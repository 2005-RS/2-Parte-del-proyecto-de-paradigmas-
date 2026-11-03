import { randomBytes, randomUUID } from 'crypto';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { DomainError } from '../common/domain-error';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/auth-user';
import { MetricsService } from '../telemetry/metrics.service';
import {
  assertAnswerAllowed,
  assertCanJoin,
  assertHost,
  normalizeRoomCode,
  pointsFor,
} from './domain/game-rules';
import { presentSession, type SessionSnapshot } from './domain/present-session';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeCode(): string {
  const bytes = randomBytes(6);
  return [...bytes].map((byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

type Tx = Prisma.TransactionClient;

@Injectable()
export class SessionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SessionService.name);
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private readonly maxPlayers: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly metrics: MetricsService,
  ) {
    this.maxPlayers = Number(process.env.MAX_PLAYERS_PER_SESSION || 40);
  }

  async onModuleInit(): Promise<void> {
    const open = await this.prisma.gameSession.findMany({
      where: { status: 'question_open', questionClosesAt: { not: null } },
    });
    for (const session of open) {
      const closesAt = session.questionClosesAt!;
      if (closesAt.getTime() <= Date.now()) {
        await this.closeById(session.id, null);
      } else {
        this.arm(session.id, closesAt);
      }
    }
  }

  onModuleDestroy(): void {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
  }

  async create(quizId: string, user: AuthUser) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!quiz) throw new DomainError('NOT_FOUND', 'No encontramos ese cuestionario.', 404);
    if (quiz.ownerId !== user.id) {
      throw new DomainError('NOT_OWNER', 'Solo puedes abrir una sala con tus cuestionarios.', 403);
    }
    if (quiz.questions.length === 0) {
      throw new DomainError('INVALID_STATE', 'Agrega al menos una pregunta antes de abrir la sala.', 409);
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const created = await this.prisma.gameSession.create({
          data: {
            id: randomUUID(),
            quizId: quiz.id,
            hostId: user.id,
            hostName: user.displayName,
            code: makeCode(),
            quizTitle: quiz.title,
            questions: {
              create: quiz.questions.map((question) => ({
                id: randomUUID(),
                prompt: question.prompt,
                correctAnswer: question.correctAnswer,
                imagePath: question.imagePath,
                timeLimitSeconds: question.timeLimitSeconds,
                orderIndex: question.orderIndex,
              })),
            },
          },
        });
        return this.present(created.code, user.id);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') continue;
        throw error;
      }
    }
    throw new DomainError('INTERNAL', 'No se pudo generar el código de la sala.', 500);
  }

  async cancel(code: string, userId: string): Promise<void> {
    const session = await this.findRow(code);
    assertHost(session.hostId, userId);
    if (session.status !== 'lobby') {
      throw new DomainError('INVALID_STATE', 'Solo se puede cancelar una sala que aún no empieza.', 409);
    }
    await this.prisma.gameSession.delete({ where: { id: session.id } });
  }

  async join(code: string, user: AuthUser) {
    const normalized = normalizeRoomCode(code);
    await this.prisma.$transaction(async (tx) => {
      const session = await this.require(tx, normalized);
      await this.lock(tx, session.id);
      const fresh = await tx.gameSession.findUniqueOrThrow({
        where: { id: session.id },
        include: { players: true },
      });
      const existing = fresh.players.some((player) => player.userId === user.id);
      assertCanJoin({
        status: fresh.status,
        playerCount: fresh.players.length,
        maxPlayers: this.maxPlayers,
        alreadyJoined: existing,
      });
      if (existing) return;
      await tx.sessionPlayer.create({
        data: {
          id: randomUUID(),
          sessionId: fresh.id,
          userId: user.id,
          displayName: user.displayName,
        },
      });
    });
    this.publish(normalized);
    return this.present(normalized, user.id);
  }

  async assertWatch(code: string, userId: string): Promise<void> {
    const snapshot = await this.loadSnapshot(code);
    const member = snapshot.players.some((player) => player.userId === userId);
    if (snapshot.hostId !== userId && !member) {
      throw new DomainError('NOT_IN_SESSION', 'Entra a la sala con tu perfil antes de conectarte.', 403);
    }
  }

  async start(code: string, userId: string) {
    const normalized = normalizeRoomCode(code);
    const timing = await this.prisma.$transaction(async (tx) => {
      const session = await this.require(tx, normalized);
      await this.lock(tx, session.id);
      const fresh = await tx.gameSession.findUniqueOrThrow({
        where: { id: session.id },
        include: { questions: { orderBy: { orderIndex: 'asc' } }, players: true },
      });
      assertHost(fresh.hostId, userId);
      if (fresh.status !== 'lobby') throw new DomainError('INVALID_STATE', 'La partida ya comenzó.', 409);
      if (fresh.questions.length === 0) {
        throw new DomainError('INVALID_STATE', 'El cuestionario no tiene preguntas.', 409);
      }
      if (fresh.players.length === 0) {
        throw new DomainError('INVALID_STATE', 'Espera a que alguien entre a la sala.', 409);
      }
      const first = fresh.questions[0];
      const openedAt = new Date();
      const closesAt = new Date(openedAt.getTime() + first.timeLimitSeconds * 1000);
      await tx.gameSession.update({
        where: { id: fresh.id },
        data: {
          status: 'question_open',
          currentQuestionIndex: first.orderIndex,
          questionOpenedAt: openedAt,
          questionClosesAt: closesAt,
        },
      });
      return { id: fresh.id, closesAt };
    });
    this.arm(timing.id, timing.closesAt);
    this.metrics.sessionStarted();
    this.publish(normalized);
    return this.present(normalized, userId);
  }

  async close(code: string, userId: string) {
    const session = await this.findRow(code);
    await this.closeById(session.id, userId);
    return this.present(session.code, userId);
  }

  async next(code: string, userId: string) {
    const normalized = normalizeRoomCode(code);
    const outcome = await this.prisma.$transaction(async (tx) => {
      const session = await this.require(tx, normalized);
      await this.lock(tx, session.id);
      const fresh = await tx.gameSession.findUniqueOrThrow({
        where: { id: session.id },
        include: { questions: { orderBy: { orderIndex: 'asc' } } },
      });
      assertHost(fresh.hostId, userId);
      if (fresh.status !== 'question_closed') {
        throw new DomainError('INVALID_STATE', 'Cierra la pregunta actual antes de avanzar.', 409);
      }
      const upcoming = fresh.questions.find((question) => question.orderIndex > fresh.currentQuestionIndex);
      if (!upcoming) {
        await tx.gameSession.update({
          where: { id: fresh.id },
          data: { status: 'finished', finishedAt: new Date() },
        });
        return { kind: 'finished' as const, id: fresh.id };
      }
      const openedAt = new Date();
      const closesAt = new Date(openedAt.getTime() + upcoming.timeLimitSeconds * 1000);
      await tx.gameSession.update({
        where: { id: fresh.id },
        data: {
          status: 'question_open',
          currentQuestionIndex: upcoming.orderIndex,
          questionOpenedAt: openedAt,
          questionClosesAt: closesAt,
        },
      });
      return { kind: 'open' as const, id: fresh.id, closesAt };
    });
    this.clearTimer(outcome.id);
    if (outcome.kind === 'open') this.arm(outcome.id, outcome.closesAt);
    this.publish(normalized);
    return this.present(normalized, userId);
  }

  async finish(code: string, userId: string) {
    const session = await this.findRow(code);
    assertHost(session.hostId, userId);
    if (session.status === 'lobby') {
      throw new DomainError('INVALID_STATE', 'La partida todavía no empieza.', 409);
    }
    if (session.status === 'question_open') {
      throw new DomainError('INVALID_STATE', 'Cierra la pregunta antes de terminar.', 409);
    }
    if (session.status !== 'finished') {
      await this.prisma.gameSession.update({
        where: { id: session.id },
        data: { status: 'finished', finishedAt: new Date() },
      });
    }
    this.clearTimer(session.id);
    this.publish(session.code);
    return this.present(session.code, userId);
  }

  async answer(code: string, userId: string, questionId: string, value: boolean) {
    const normalized = normalizeRoomCode(code);
    let outcome = 'accepted';
    try {
      await this.prisma.$transaction(async (tx) => {
        const session = await this.require(tx, normalized);
        await this.lock(tx, session.id);
        const fresh = await tx.gameSession.findUniqueOrThrow({
          where: { id: session.id },
          include: {
            questions: true,
            players: true,
            answers: { where: { userId, questionId } },
          },
        });
        const current = fresh.questions.find((question) => question.orderIndex === fresh.currentQuestionIndex);
        if (!current || current.id !== questionId) {
          outcome = 'rejected';
          throw new DomainError('QUESTION_CLOSED', 'Esa pregunta ya no está activa.', 409);
        }
        try {
          assertAnswerAllowed({
            isMember: fresh.players.some((player) => player.userId === userId),
            status: fresh.status,
            now: new Date(),
            closesAt: fresh.questionClosesAt,
            alreadyAnswered: fresh.answers.length > 0,
          });
        } catch (error) {
          if (error instanceof DomainError) {
            outcome = error.code === 'TOO_LATE' ? 'late' : error.code === 'ALREADY_ANSWERED' ? 'duplicate' : 'rejected';
          }
          throw error;
        }
        const points = pointsFor(current.correctAnswer, value);
        try {
          await tx.answer.create({
            data: {
              id: randomUUID(),
              sessionId: fresh.id,
              questionId: current.id,
              userId,
              value,
              isCorrect: points === 1,
              points,
            },
          });
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            outcome = 'duplicate';
            throw new DomainError('ALREADY_ANSWERED', 'Ya enviaste una respuesta para esta pregunta.', 409);
          }
          throw error;
        }
        if (points > 0) {
          await tx.sessionPlayer.update({
            where: { sessionId_userId: { sessionId: fresh.id, userId } },
            data: { score: { increment: points } },
          });
        }
      });
    } catch (error) {
      this.metrics.answer(outcome === 'accepted' ? 'rejected' : outcome);
      throw error;
    }
    this.metrics.answer('accepted');
    this.publish(normalized);
    return this.present(normalized, userId);
  }

  async present(code: string, userId: string) {
    const snapshot = await this.loadSnapshot(code);
    const member = snapshot.players.some((player) => player.userId === userId);
    if (snapshot.hostId !== userId && !member) {
      throw new DomainError('NOT_IN_SESSION', 'No participas en esta sala.', 403);
    }
    return presentSession(snapshot, userId);
  }

  async results(code: string, userId: string) {
    const view = await this.present(code, userId);
    if (view.status !== 'finished') {
      throw new DomainError('INVALID_STATE', 'La clasificación está disponible al terminar la partida.', 409);
    }
    return view;
  }

  async listMine(hostId: string) {
    const rows = await this.prisma.gameSession.findMany({
      where: { hostId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { players: true } } },
    });
    return rows.map((row) => ({
      code: row.code,
      quizTitle: row.quizTitle,
      status: row.status,
      playerCount: row._count.players,
      createdAt: row.createdAt.toISOString(),
      finishedAt: row.finishedAt?.toISOString() ?? null,
    }));
  }

  async loadSnapshot(code: string): Promise<SessionSnapshot> {
    const normalized = normalizeRoomCode(code);
    const session = await this.prisma.gameSession.findUnique({
      where: { code: normalized },
      include: {
        questions: { orderBy: { orderIndex: 'asc' } },
        players: { orderBy: { joinedAt: 'asc' } },
        answers: true,
      },
    });
    if (!session) throw new DomainError('ROOM_NOT_FOUND', 'No encontramos una sala con ese código.', 404);
    return {
      code: session.code,
      status: session.status,
      quizTitle: session.quizTitle,
      hostId: session.hostId,
      hostName: session.hostName,
      currentQuestionIndex: session.currentQuestionIndex,
      questionOpenedAt: session.questionOpenedAt?.toISOString() ?? null,
      questionClosesAt: session.questionClosesAt?.toISOString() ?? null,
      questions: session.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        correctAnswer: question.correctAnswer,
        imagePath: question.imagePath,
        timeLimitSeconds: question.timeLimitSeconds,
        orderIndex: question.orderIndex,
      })),
      players: session.players.map((player) => ({
        userId: player.userId,
        displayName: player.displayName,
        score: player.score,
      })),
      answers: session.answers.map((answer) => ({
        questionId: answer.questionId,
        userId: answer.userId,
        value: answer.value,
        isCorrect: answer.isCorrect,
        points: answer.points,
      })),
    };
  }

  private async closeById(id: string, actorId: string | null): Promise<void> {
    const code = await this.prisma.$transaction(async (tx) => {
      await this.lock(tx, id);
      const session = await tx.gameSession.findUnique({ where: { id } });
      if (!session) return null;
      if (actorId) assertHost(session.hostId, actorId);
      if (session.status !== 'question_open') {
        if (actorId) throw new DomainError('INVALID_STATE', 'No hay una pregunta abierta.', 409);
        return null;
      }
      await tx.gameSession.update({
        where: { id },
        data: { status: 'question_closed' },
      });
      return session.code;
    });
    this.clearTimer(id);
    if (code) this.publish(code);
  }

  private async closeFromTimer(id: string): Promise<void> {
    try {
      await this.closeById(id, null);
    } catch (error) {
      this.logger.error(error);
    }
  }

  private arm(id: string, closesAt: Date): void {
    this.clearTimer(id);
    const delay = Math.max(0, closesAt.getTime() - Date.now());
    const timer = setTimeout(() => {
      void this.closeFromTimer(id);
    }, delay);
    this.timers.set(id, timer);
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
  }

  private publish(code: string): void {
    this.events.emit('realtime.publish', code);
  }

  private async require(tx: Tx, code: string) {
    const session = await tx.gameSession.findUnique({ where: { code } });
    if (!session) throw new DomainError('ROOM_NOT_FOUND', 'No encontramos una sala con ese código.', 404);
    return session;
  }

  private async findRow(code: string) {
    const normalized = normalizeRoomCode(code);
    const session = await this.prisma.gameSession.findUnique({ where: { code: normalized } });
    if (!session) throw new DomainError('ROOM_NOT_FOUND', 'No encontramos una sala con ese código.', 404);
    return session;
  }

  private async lock(tx: Tx, id: string): Promise<void> {
    await tx.$executeRaw`SELECT id FROM game_sessions WHERE id = ${id}::uuid FOR UPDATE`;
  }
}
