import { DomainError } from '../../common/domain-error';

export type SessionStatusName = 'lobby' | 'question_open' | 'question_closed' | 'finished';

export function pointsFor(correct: boolean, value: boolean): number {
  return correct === value ? 1 : 0;
}

export function assertHost(hostId: string, userId: string): void {
  if (hostId !== userId) {
    throw new DomainError('NOT_HOST', 'Solo el anfitrión puede controlar la partida.', 403);
  }
}

export function assertOwner(ownerId: string, userId: string): void {
  if (ownerId !== userId) {
    throw new DomainError('NOT_OWNER', 'Solo puedes administrar tus cuestionarios.', 403);
  }
}

export function normalizeRoomCode(code: string): string {
  const normalized = (code || '').trim().toUpperCase();
  if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(normalized)) {
    throw new DomainError('ROOM_NOT_FOUND', 'No encontramos una sala con ese código.', 404);
  }
  return normalized;
}

export function assertAnswerAllowed(input: {
  isMember: boolean;
  status: string;
  now: Date;
  closesAt: Date | null;
  alreadyAnswered: boolean;
}): void {
  if (!input.isMember) {
    throw new DomainError('NOT_IN_SESSION', 'No estás en esta sala.', 403);
  }
  if (input.alreadyAnswered) {
    throw new DomainError('ALREADY_ANSWERED', 'Ya enviaste una respuesta para esta pregunta.', 409);
  }
  if (input.status !== 'question_open') {
    throw new DomainError('QUESTION_CLOSED', 'La pregunta ya no acepta respuestas.', 409);
  }
  if (!input.closesAt || input.now.getTime() >= input.closesAt.getTime()) {
    throw new DomainError('TOO_LATE', 'El tiempo de respuesta terminó.', 409);
  }
}

export function assertCanJoin(input: {
  status: string;
  playerCount: number;
  maxPlayers: number;
  alreadyJoined: boolean;
}): void {
  if (input.alreadyJoined) return;
  if (input.status === 'finished') {
    throw new DomainError('INVALID_STATE', 'Esta partida ya terminó.', 409);
  }
  if (input.status !== 'lobby') {
    throw new DomainError(
      'INVALID_STATE',
      'La partida ya comenzó. Solo quien ya entró puede reconectar.',
      409,
    );
  }
  if (input.playerCount >= input.maxPlayers) {
    throw new DomainError(
      'ROOM_FULL',
      `La sala admite hasta ${input.maxPlayers} participantes.`,
      409,
    );
  }
}
