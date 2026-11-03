import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DomainError } from '../common/domain-error';
import { detectImage } from '../media/image-type';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/auth-user';
import { assertOwner } from '../sessions/domain/game-rules';
import type { CreateQuestionDto, UpdateQuestionDto, UpdateQuizDto, CreateQuizDto } from './dto';

const extensionOf = { png: 'png', jpeg: 'jpg', webp: 'webp' } as const;

@Injectable()
export class QuizService {
  private readonly uploadDir: string;
  private readonly maxBytes: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.uploadDir = config.get<string>('UPLOAD_DIR') || './uploads';
    this.maxBytes = Number(config.get<string>('UPLOAD_MAX_BYTES') || 2_097_152);
  }

  async list(ownerId: string) {
    const quizzes = await this.prisma.quiz.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { questions: true } } },
    });
    return quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      questionCount: quiz._count.questions,
      updatedAt: quiz.updatedAt.toISOString(),
    }));
  }

  async get(id: string, ownerId: string) {
    const quiz = await this.owned(id, ownerId);
    return this.toDto(quiz);
  }

  async create(dto: CreateQuizDto, user: AuthUser) {
    const quiz = await this.prisma.quiz.create({
      data: {
        id: randomUUID(),
        ownerId: user.id,
        ownerName: user.displayName,
        title: dto.title.trim(),
        description: dto.description?.trim() || '',
      },
      include: { questions: true },
    });
    return this.toDto(quiz);
  }

  async update(id: string, ownerId: string, dto: UpdateQuizDto) {
    await this.owned(id, ownerId);
    await this.ensureEditable(id);
    const quiz = await this.prisma.quiz.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description?.trim(),
      },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });
    return this.toDto(quiz);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    await this.owned(id, ownerId);
    await this.ensureEditable(id);
    await this.prisma.quiz.delete({ where: { id } });
  }

  async addQuestion(quizId: string, ownerId: string, dto: CreateQuestionDto) {
    await this.owned(quizId, ownerId);
    await this.ensureEditable(quizId);
    const last = await this.prisma.question.findFirst({
      where: { quizId },
      orderBy: { orderIndex: 'desc' },
    });
    const question = await this.prisma.question.create({
      data: {
        id: randomUUID(),
        quizId,
        prompt: dto.prompt.trim(),
        correctAnswer: dto.correctAnswer,
        timeLimitSeconds: dto.timeLimitSeconds ?? 20,
        orderIndex: (last?.orderIndex ?? -1) + 1,
      },
    });
    return question;
  }

  async updateQuestion(quizId: string, questionId: string, ownerId: string, dto: UpdateQuestionDto) {
    await this.owned(quizId, ownerId);
    await this.ensureEditable(quizId);
    await this.questionOf(quizId, questionId);
    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        prompt: dto.prompt?.trim(),
        correctAnswer: dto.correctAnswer,
        timeLimitSeconds: dto.timeLimitSeconds,
      },
    });
  }

  async removeQuestion(quizId: string, questionId: string, ownerId: string): Promise<void> {
    await this.owned(quizId, ownerId);
    await this.ensureEditable(quizId);
    await this.questionOf(quizId, questionId);
    await this.prisma.question.delete({ where: { id: questionId } });
    const rest = await this.prisma.question.findMany({
      where: { quizId },
      orderBy: { orderIndex: 'asc' },
    });
    await this.prisma.$transaction(
      rest.map((question, index) =>
        this.prisma.question.update({ where: { id: question.id }, data: { orderIndex: index } }),
      ),
    );
  }

  async moveQuestion(quizId: string, questionId: string, ownerId: string, direction: 'up' | 'down') {
    await this.owned(quizId, ownerId);
    await this.ensureEditable(quizId);
    const questions = await this.prisma.question.findMany({
      where: { quizId },
      orderBy: { orderIndex: 'asc' },
    });
    const index = questions.findIndex((question) => question.id === questionId);
    if (index < 0) throw new DomainError('NOT_FOUND', 'No encontramos esa pregunta.', 404);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= questions.length) return this.get(quizId, ownerId);
    const current = questions[index];
    const neighbor = questions[target];
    await this.prisma.$transaction([
      this.prisma.question.update({ where: { id: current.id }, data: { orderIndex: neighbor.orderIndex } }),
      this.prisma.question.update({ where: { id: neighbor.id }, data: { orderIndex: current.orderIndex } }),
    ]);
    return this.get(quizId, ownerId);
  }

  async saveImage(quizId: string, questionId: string, ownerId: string, buffer: Buffer) {
    await this.owned(quizId, ownerId);
    await this.ensureEditable(quizId);
    await this.questionOf(quizId, questionId);
    if (buffer.length === 0) throw new DomainError('IMAGE_TYPE', 'Selecciona un archivo de imagen.', 400);
    if (buffer.length > this.maxBytes) {
      throw new DomainError('IMAGE_TOO_LARGE', 'La imagen supera el máximo de 2 MB.', 400);
    }
    const kind = detectImage(buffer);
    if (!kind) throw new DomainError('IMAGE_TYPE', 'La imagen debe ser JPEG, PNG o WebP.', 400);
    const filename = `${randomUUID()}.${extensionOf[kind]}`;
    await mkdir(this.uploadDir, { recursive: true });
    await writeFile(join(this.uploadDir, filename), buffer);
    const imagePath = `/media/${filename}`;
    await this.prisma.question.update({ where: { id: questionId }, data: { imagePath } });
    return { imagePath };
  }

  private async owned(id: string, ownerId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!quiz) throw new DomainError('NOT_FOUND', 'No encontramos ese cuestionario.', 404);
    assertOwner(quiz.ownerId, ownerId);
    return quiz;
  }

  private async questionOf(quizId: string, questionId: string) {
    const question = await this.prisma.question.findFirst({ where: { id: questionId, quizId } });
    if (!question) throw new DomainError('NOT_FOUND', 'No encontramos esa pregunta.', 404);
    return question;
  }

  private async ensureEditable(quizId: string) {
    const active = await this.prisma.gameSession.count({
      where: { quizId, status: { not: 'finished' } },
    });
    if (active > 0) {
      throw new DomainError(
        'QUIZ_LOCKED',
        'Hay una partida abierta con este cuestionario. Termínala o cancélala antes de editar.',
        409,
      );
    }
  }

  private toDto(quiz: {
    id: string;
    title: string;
    description: string;
    updatedAt: Date;
    questions: Array<{
      id: string;
      prompt: string;
      correctAnswer: boolean;
      imagePath: string | null;
      timeLimitSeconds: number;
      orderIndex: number;
    }>;
  }) {
    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      updatedAt: quiz.updatedAt.toISOString(),
      questions: quiz.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        correctAnswer: question.correctAnswer,
        imagePath: question.imagePath,
        timeLimitSeconds: question.timeLimitSeconds,
        orderIndex: question.orderIndex,
      })),
    };
  }
}
