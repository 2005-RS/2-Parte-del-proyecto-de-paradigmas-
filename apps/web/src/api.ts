import { config } from './config';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export type User = { id: string; email: string; displayName: string };

export type QuizSummary = {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  updatedAt: string;
};

export type Question = {
  id: string;
  prompt: string;
  correctAnswer: boolean;
  imagePath: string | null;
  timeLimitSeconds: number;
  orderIndex: number;
};

export type Quiz = {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
  questions: Question[];
};

export type SessionState = {
  code: string;
  status: 'lobby' | 'question_open' | 'question_closed' | 'finished';
  quizTitle: string;
  hostName: string;
  youAreHost: boolean;
  youArePlayer: boolean;
  yourName: string | null;
  yourScore: number;
  playerCount: number;
  players: { displayName: string; score: number }[];
  question: null | {
    id: string;
    index: number;
    total: number;
    prompt: string;
    imagePath: string | null;
    timeLimitSeconds: number;
    openedAt: string | null;
    closesAt: string | null;
    answeredCount: number;
    yourAnswer: boolean | null;
    correctAnswer: boolean | null;
  };
  ranking: null | { place: number; displayName: string; score: number }[];
};

export type HistoryItem = {
  code: string;
  quizTitle: string;
  status: string;
  playerCount: number;
  createdAt: string;
  finishedAt: string | null;
};

type TokenResponse = { accessToken: string; user: User };

async function request<T>(base: string, path: string, token: string | null, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('No hay conexión con el servicio. Revisa la red e inténtalo de nuevo.', 'NETWORK', 0);
  }
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message || 'No se pudo completar la acción.', data?.code || 'HTTP_ERROR', response.status);
  }
  return data as T;
}

export const api = {
  register: (body: { displayName: string; email: string; password: string }) =>
    request<TokenResponse>(config.authUrl, '/auth/register', null, { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<TokenResponse>(config.authUrl, '/auth/login', null, { method: 'POST', body: JSON.stringify(body) }),
  me: (token: string) => request<User>(config.authUrl, '/auth/me', token),
  quizzes: (token: string) => request<QuizSummary[]>(config.activitiesUrl, '/quizzes', token),
  quiz: (token: string, id: string) => request<Quiz>(config.activitiesUrl, `/quizzes/${id}`, token),
  createQuiz: (token: string, body: { title: string; description: string }) =>
    request<Quiz>(config.activitiesUrl, '/quizzes', token, { method: 'POST', body: JSON.stringify(body) }),
  updateQuiz: (token: string, id: string, body: { title: string; description: string }) =>
    request<Quiz>(config.activitiesUrl, `/quizzes/${id}`, token, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteQuiz: (token: string, id: string) =>
    request<void>(config.activitiesUrl, `/quizzes/${id}`, token, { method: 'DELETE' }),
  addQuestion: (
    token: string,
    quizId: string,
    body: { prompt: string; correctAnswer: boolean; timeLimitSeconds: number },
  ) => request<Question>(config.activitiesUrl, `/quizzes/${quizId}/questions`, token, { method: 'POST', body: JSON.stringify(body) }),
  updateQuestion: (
    token: string,
    quizId: string,
    questionId: string,
    body: { prompt: string; correctAnswer: boolean; timeLimitSeconds: number },
  ) =>
    request<Question>(config.activitiesUrl, `/quizzes/${quizId}/questions/${questionId}`, token, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteQuestion: (token: string, quizId: string, questionId: string) =>
    request<void>(config.activitiesUrl, `/quizzes/${quizId}/questions/${questionId}`, token, { method: 'DELETE' }),
  moveQuestion: (token: string, quizId: string, questionId: string, direction: 'up' | 'down') =>
    request<Quiz>(config.activitiesUrl, `/quizzes/${quizId}/questions/${questionId}/move`, token, {
      method: 'POST',
      body: JSON.stringify({ direction }),
    }),
  uploadImage: (token: string, quizId: string, questionId: string, file: File) => {
    const body = new FormData();
    body.append('file', file);
    return request<{ imagePath: string }>(
      config.activitiesUrl,
      `/quizzes/${quizId}/questions/${questionId}/image`,
      token,
      { method: 'POST', body },
    );
  },
  createSession: (token: string, quizId: string) =>
    request<SessionState>(config.activitiesUrl, '/sessions', token, {
      method: 'POST',
      body: JSON.stringify({ quizId }),
    }),
  join: (token: string, code: string) =>
    request<SessionState>(config.activitiesUrl, `/sessions/${code}/join`, token, { method: 'POST' }),
  state: (token: string, code: string) => request<SessionState>(config.activitiesUrl, `/sessions/${code}`, token),
  results: (token: string, code: string) =>
    request<SessionState>(config.activitiesUrl, `/sessions/${code}/results`, token),
  start: (token: string, code: string) =>
    request<SessionState>(config.activitiesUrl, `/sessions/${code}/start`, token, { method: 'POST' }),
  close: (token: string, code: string) =>
    request<SessionState>(config.activitiesUrl, `/sessions/${code}/close`, token, { method: 'POST' }),
  next: (token: string, code: string) =>
    request<SessionState>(config.activitiesUrl, `/sessions/${code}/next`, token, { method: 'POST' }),
  finish: (token: string, code: string) =>
    request<SessionState>(config.activitiesUrl, `/sessions/${code}/finish`, token, { method: 'POST' }),
  cancel: (token: string, code: string) =>
    request<void>(config.activitiesUrl, `/sessions/${code}`, token, { method: 'DELETE' }),
  answer: (token: string, code: string, questionId: string, value: boolean) =>
    request<SessionState>(config.activitiesUrl, `/sessions/${code}/answers`, token, {
      method: 'POST',
      body: JSON.stringify({ questionId, value }),
    }),
  history: (token: string) => request<HistoryItem[]>(config.activitiesUrl, '/sessions/mine', token),
};
