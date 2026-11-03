import { presentSession, type SessionSnapshot } from './present-session';

function snapshot(overrides: Partial<SessionSnapshot> = {}): SessionSnapshot {
  return {
    code: 'AB23CD',
    status: 'question_open',
    quizTitle: 'Paradigmas',
    hostId: 'host',
    hostName: 'Profe Demo',
    currentQuestionIndex: 0,
    questionOpenedAt: '2026-11-02T12:00:00.000Z',
    questionClosesAt: '2026-11-02T12:00:20.000Z',
    questions: [
      {
        id: 'q1',
        prompt: 'El aula está en vivo.',
        correctAnswer: true,
        imagePath: '/media/demo.png',
        timeLimitSeconds: 20,
        orderIndex: 0,
      },
    ],
    players: [
      { userId: 'ana', displayName: 'Ana', score: 1 },
      { userId: 'luis', displayName: 'Luis', score: 0 },
    ],
    answers: [{ questionId: 'q1', userId: 'ana', value: true, isCorrect: true, points: 1 }],
    ...overrides,
  };
}

describe('estado visible de la sala', () => {
  it('oculta la respuesta correcta y el punto recién ganado mientras la pregunta está abierta', () => {
    const view = presentSession(snapshot(), 'ana');
    expect(view.question?.correctAnswer).toBeNull();
    expect(view.question?.yourAnswer).toBe(true);
    expect(view.yourScore).toBe(0);
    expect(view.players.find((player) => player.displayName === 'Ana')?.score).toBe(0);
  });

  it('revela la respuesta correcta y el marcador al cerrar la pregunta', () => {
    const view = presentSession(snapshot({ status: 'question_closed' }), 'ana');
    expect(view.question?.correctAnswer).toBe(true);
    expect(view.yourScore).toBe(1);
  });

  it('no mezcla jugadores ni puntajes de otra sala', () => {
    const other = presentSession(
      snapshot({
        code: 'ZZ99YY',
        players: [{ userId: 'sofia', displayName: 'Sofía', score: 4 }],
        answers: [],
      }),
      'sofia',
    );
    expect(other.code).toBe('ZZ99YY');
    expect(other.players.map((player) => player.displayName)).toEqual(['Sofía']);
    expect(other.yourScore).toBe(4);
  });

  it('personaliza la respuesta: Luis no ve lo que marcó Ana', () => {
    const view = presentSession(snapshot(), 'luis');
    expect(view.question?.yourAnswer).toBeNull();
    expect(view.question?.correctAnswer).toBeNull();
    expect(view.question?.answeredCount).toBe(1);
  });
});
