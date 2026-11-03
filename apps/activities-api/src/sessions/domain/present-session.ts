export type SessionSnapshot = {
  code: string;
  status: 'lobby' | 'question_open' | 'question_closed' | 'finished';
  quizTitle: string;
  hostId: string;
  hostName: string;
  currentQuestionIndex: number;
  questionOpenedAt: string | null;
  questionClosesAt: string | null;
  questions: Array<{
    id: string;
    prompt: string;
    correctAnswer: boolean;
    imagePath: string | null;
    timeLimitSeconds: number;
    orderIndex: number;
  }>;
  players: Array<{ userId: string; displayName: string; score: number }>;
  answers: Array<{
    questionId: string;
    userId: string;
    value: boolean;
    isCorrect: boolean;
    points: number;
  }>;
};

export function presentSession(snapshot: SessionSnapshot, viewerId: string) {
  const youAreHost = snapshot.hostId === viewerId;
  const me = snapshot.players.find((player) => player.userId === viewerId) ?? null;
  const revealed = snapshot.status === 'question_closed' || snapshot.status === 'finished';
  const current =
    snapshot.questions.find((question) => question.orderIndex === snapshot.currentQuestionIndex) ?? null;
  const showQuestion = Boolean(current) && snapshot.status !== 'lobby';
  const yourAnswer = current
    ? snapshot.answers.find((answer) => answer.questionId === current.id && answer.userId === viewerId) ?? null
    : null;
  const answeredCount = current
    ? snapshot.answers.filter((answer) => answer.questionId === current.id).length
    : 0;

  const visibleScore = (player: SessionSnapshot['players'][number]) => {
    if (snapshot.status !== 'question_open' || !current) return player.score;
    const gained =
      snapshot.answers.find((answer) => answer.questionId === current.id && answer.userId === player.userId)
        ?.points ?? 0;
    return player.score - gained;
  };

  const ranking = [...snapshot.players].sort(
    (a, b) => b.score - a.score || a.displayName.localeCompare(b.displayName, 'es'),
  );

  return {
    code: snapshot.code,
    status: snapshot.status,
    quizTitle: snapshot.quizTitle,
    hostName: snapshot.hostName,
    youAreHost,
    youArePlayer: Boolean(me),
    yourName: me?.displayName ?? null,
    yourScore: me ? visibleScore(me) : 0,
    playerCount: snapshot.players.length,
    players: snapshot.players.map((player) => ({
      displayName: player.displayName,
      score: visibleScore(player),
    })),
    question:
      showQuestion && current
        ? {
            id: current.id,
            index: current.orderIndex,
            total: snapshot.questions.length,
            prompt: current.prompt,
            imagePath: current.imagePath,
            timeLimitSeconds: current.timeLimitSeconds,
            openedAt: snapshot.questionOpenedAt,
            closesAt: snapshot.questionClosesAt,
            answeredCount,
            yourAnswer: yourAnswer ? yourAnswer.value : null,
            correctAnswer: revealed ? current.correctAnswer : null,
          }
        : null,
    ranking:
      snapshot.status === 'finished'
        ? ranking.map((player, index) => ({
            place: index + 1,
            displayName: player.displayName,
            score: player.score,
          }))
        : null,
  };
}
