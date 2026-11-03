import {
  assertAnswerAllowed,
  assertCanJoin,
  assertHost,
  normalizeRoomCode,
  pointsFor,
} from './game-rules';

describe('reglas de la partida', () => {
  const now = new Date('2026-11-02T12:00:00.000Z');
  const closesAt = new Date('2026-11-02T12:00:20.000Z');

  it('asigna un punto cuando la respuesta coincide y cero cuando no', () => {
    expect(pointsFor(true, true)).toBe(1);
    expect(pointsFor(false, false)).toBe(1);
    expect(pointsFor(true, false)).toBe(0);
    expect(pointsFor(false, true)).toBe(0);
  });

  it('acepta la primera respuesta de un participante dentro del tiempo', () => {
    expect(() =>
      assertAnswerAllowed({
        isMember: true,
        status: 'question_open',
        now,
        closesAt,
        alreadyAnswered: false,
      }),
    ).not.toThrow();
  });

  it('rechaza el reenvío para no sumar el punto otra vez', () => {
    expect(() =>
      assertAnswerAllowed({
        isMember: true,
        status: 'question_open',
        now,
        closesAt,
        alreadyAnswered: true,
      }),
    ).toThrow(/Ya enviaste/);
  });

  it('rechaza una respuesta tardía o con la pregunta cerrada', () => {
    expect(() =>
      assertAnswerAllowed({
        isMember: true,
        status: 'question_open',
        now: closesAt,
        closesAt,
        alreadyAnswered: false,
      }),
    ).toThrow(/tiempo/);

    expect(() =>
      assertAnswerAllowed({
        isMember: true,
        status: 'question_closed',
        now,
        closesAt,
        alreadyAnswered: false,
      }),
    ).toThrow(/ya no acepta/);
  });

  it('impide que un participante controle la sala del anfitrión', () => {
    expect(() => assertHost('host', 'player')).toThrow(/anfitrión/);
    expect(() => assertHost('host', 'host')).not.toThrow();
  });

  it('limita los participantes nuevos y deja reconectar a quien ya entró', () => {
    expect(() =>
      assertCanJoin({ status: 'question_open', playerCount: 2, maxPlayers: 40, alreadyJoined: true }),
    ).not.toThrow();
    expect(() =>
      assertCanJoin({ status: 'question_open', playerCount: 2, maxPlayers: 40, alreadyJoined: false }),
    ).toThrow(/ya comenzó/);
    expect(() =>
      assertCanJoin({ status: 'lobby', playerCount: 40, maxPlayers: 40, alreadyJoined: false }),
    ).toThrow(/40/);
  });

  it('solo acepta códigos de sala de 6 caracteres', () => {
    expect(normalizeRoomCode(' ab23cd ')).toBe('AB23CD');
    expect(() => normalizeRoomCode('abc')).toThrow(/código/);
    expect(() => normalizeRoomCode('IIIIII')).toThrow(/código/);
  });
});
