import { FormEvent, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, type Question, type Quiz, type QuizSummary } from '../api';
import { useAuth } from '../auth';
import { LinkMascot } from '../brand';
import { Character } from '../characters';
import { mediaUrl } from '../config';
import { playGo } from '../sfx';

const lobby = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } },
};

const tile = {
  hidden: { opacity: 0, y: 48, scale: 0.86, rotate: -2 },
  show: { opacity: 1, y: 0, scale: 1, rotate: 0, transition: { type: 'spring' as const, bounce: 0.42, duration: 0.7 } },
};

export function HomePage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<QuizSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.quizzes(token).then(setQuizzes).catch((reason: Error) => setError(reason.message));
  }, [token]);

  async function play(quizId: string) {
    if (!token) return;
    setOpening(quizId);
    setError(null);
    try {
      playGo();
      const session = await api.createSession(token, quizId);
      navigate(`/sala/${session.code}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo abrir la sala.');
      setOpening(null);
    }
  }

  return (
    <main className="hub">
      <motion.div className="hub-orb a" animate={{ y: [0, -24, 0], x: [0, 12, 0] }} transition={{ duration: 7, repeat: Infinity }} />
      <motion.div className="hub-orb b" animate={{ y: [0, 20, 0], x: [0, -16, 0] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div className="hub-hero" initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.35 }}>
        <div>
          <p className="hub-kicker">Academia en vivo</p>
          <h1>Elige la actividad, {user?.displayName}</h1>
          <p>Link abre la sala. El grupo entra con el PIN o el QR, como una clase de ProfeLink.</p>
        </div>
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>
          <LinkMascot />
        </motion.div>
        <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
          <Link className="empezar" to="/quizzes/nuevo">Nuevo juego</Link>
        </motion.div>
      </motion.div>
      {error && <div className="banner">{error}</div>}
      {!quizzes && <p className="status-line">Cargando el lobby…</p>}
      {quizzes && quizzes.length === 0 && <p className="status-line">Todavía no hay juegos.</p>}
      <motion.div className="hub-grid" variants={lobby} initial="hidden" animate="show">
        {quizzes?.map((quiz, index) => (
          <motion.article
            className="hub-tile"
            key={quiz.id}
            variants={tile}
            whileHover={{ y: -12, scale: 1.03, rotate: index % 2 === 0 ? -1 : 1 }}
            whileTap={{ scale: 0.98 }}
          >
            <Character name={quiz.title} size={84} />
            <h2>{quiz.title}</h2>
            <p>{quiz.description || 'Sin descripción'}</p>
            <span className="pill">{quiz.questionCount} preguntas</span>
            <div className="actions">
              <button className="empezar" disabled={opening === quiz.id} onClick={() => play(quiz.id)}>
                {opening === quiz.id ? 'Abriendo…' : 'Jugar'}
              </button>
              <Link className="exit" to={`/quizzes/${quiz.id}`}>Editar</Link>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </main>
  );
}

export function NewQuizPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      const quiz = await api.createQuiz(token, { title, description });
      navigate(`/quizzes/${quiz.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear.');
    }
  }

  return (
    <main className="hub">
      <motion.div className="hub-hero" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <p className="hub-kicker">Nueva actividad</p>
          <h1>Arma la clase</h1>
          <p>Ponle nombre y después agrega las preguntas de verdadero o falso.</p>
        </div>
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2.2, repeat: Infinity }}>
          <LinkMascot size={120} />
        </motion.div>
      </motion.div>
      <form className="form game-card" onSubmit={onSubmit}>
        {error && <div className="banner">{error}</div>}
        <label>
          Título
          <input value={title} onChange={(event) => setTitle(event.target.value)} minLength={3} required />
        </label>
        <label>
          Descripción
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <button className="empezar" type="submit">Continuar</button>
      </form>
    </main>
  );
}

export function EditorPage() {
  const { token } = useAuth();
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [correct, setCorrect] = useState(true);
  const [seconds, setSeconds] = useState(20);
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    if (!token) return;
    const next = await api.quiz(token, id);
    setQuiz(next);
    setTitle(next.title);
    setDescription(next.description);
  }

  useEffect(() => {
    load().catch((reason: Error) => setError(reason.message));
  }, [token, id]);

  async function saveQuiz(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      setQuiz(await api.updateQuiz(token, id, { title, description }));
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar.');
    }
  }

  async function addQuestion(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      const question = await api.addQuestion(token, id, {
        prompt,
        correctAnswer: correct,
        timeLimitSeconds: seconds,
      });
      if (file) await api.uploadImage(token, id, question.id, file);
      setPrompt('');
      setFile(null);
      setCorrect(true);
      setSeconds(20);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo agregar la pregunta.');
    }
  }

  async function openRoom() {
    if (!token) return;
    try {
      const session = await api.createSession(token, id);
      navigate(`/sala/${session.code}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo abrir la sala.');
    }
  }

  async function removeQuiz() {
    if (!token || !confirm('¿Eliminar este cuestionario?')) return;
    try {
      await api.deleteQuiz(token, id);
      navigate('/');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo eliminar.');
    }
  }

  if (!quiz) return <p className="status-line">{error || 'Cargando el juego…'}</p>;

  return (
    <main className="hub creator">
      <div className="hub-hero">
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>
          <Character name={quiz.title} size={96} />
        </motion.div>
        <div>
          <p className="hub-kicker">Editor</p>
          <h1>{quiz.title}</h1>
        </div>
        <button className="empezar" onClick={openRoom}>Abrir sala</button>
      </div>
      {error && <div className="banner">{error}</div>}
      <form className="form" onSubmit={saveQuiz}>
        <label>
          Título
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        <label>
          Descripción
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <div className="actions">
          <button className="btn">Guardar datos</button>
          <button className="btn-danger" type="button" onClick={removeQuiz}>Eliminar</button>
        </div>
      </form>

      <div className="question-list">
        {quiz.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            quizId={id}
            question={question}
            index={index}
            total={quiz.questions.length}
            onChange={load}
            onError={setError}
          />
        ))}
      </div>

      <form className="form" onSubmit={addQuestion} style={{ marginTop: 16 }}>
        <h2>Agregar pregunta</h2>
        <label>
          Enunciado
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} minLength={5} required />
        </label>
        <div className="choice-inline">
          <button type="button" className={correct ? 'on-true' : 'btn-ghost'} onClick={() => setCorrect(true)}>Verdadero</button>
          <button type="button" className={!correct ? 'on-false' : 'btn-ghost'} onClick={() => setCorrect(false)}>Falso</button>
        </div>
        <label>
          Segundos
          <input type="number" min={5} max={60} value={seconds} onChange={(event) => setSeconds(Number(event.target.value))} />
        </label>
        <label>
          Imagen opcional, JPEG, PNG o WebP, hasta 2 MB
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>
        <button className="btn">Agregar</button>
      </form>
    </main>
  );
}

function QuestionCard({
  quizId,
  question,
  index,
  total,
  onChange,
  onError,
}: {
  quizId: string;
  question: Question;
  index: number;
  total: number;
  onChange: () => Promise<void>;
  onError: (message: string | null) => void;
}) {
  const { token } = useAuth();
  const [prompt, setPrompt] = useState(question.prompt);
  const [correct, setCorrect] = useState(question.correctAnswer);
  const [seconds, setSeconds] = useState(question.timeLimitSeconds);
  const preview = mediaUrl(question.imagePath);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      await api.updateQuestion(token, quizId, question.id, {
        prompt,
        correctAnswer: correct,
        timeLimitSeconds: seconds,
      });
      await onChange();
      onError(null);
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : 'No se pudo guardar la pregunta.');
    }
  }

  async function upload(file: File) {
    if (!token) return;
    try {
      await api.uploadImage(token, quizId, question.id, file);
      await onChange();
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : 'No se pudo guardar la imagen.');
    }
  }

  async function move(direction: 'up' | 'down') {
    if (!token) return;
    try {
      await api.moveQuestion(token, quizId, question.id, direction);
      await onChange();
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : 'No se pudo reordenar.');
    }
  }

  async function remove() {
    if (!token) return;
    try {
      await api.deleteQuestion(token, quizId, question.id);
      await onChange();
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : 'No se pudo eliminar la pregunta.');
    }
  }

  return (
    <form className="question-card" onSubmit={save}>
      <div className="spread">
        <h3>Pregunta {index + 1}</h3>
        <span className="pill">{correct ? 'Verdadero' : 'Falso'}</span>
      </div>
      <label>
        Enunciado
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} required />
      </label>
      <div className="choice-inline">
        <button type="button" className={correct ? 'on-true' : 'btn-ghost'} onClick={() => setCorrect(true)}>Verdadero</button>
        <button type="button" className={!correct ? 'on-false' : 'btn-ghost'} onClick={() => setCorrect(false)}>Falso</button>
      </div>
      <label>
        Segundos
        <input type="number" min={5} max={60} value={seconds} onChange={(event) => setSeconds(Number(event.target.value))} />
      </label>
      {preview && <img className="shot" src={preview} alt="" />}
      <label>
        Reemplazar imagen
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => {
          const next = event.target.files?.[0];
          if (next) void upload(next);
        }} />
      </label>
      <div className="actions">
        <button className="btn">Guardar pregunta</button>
        <button className="btn-ghost" type="button" disabled={index === 0} onClick={() => move('up')}>Subir</button>
        <button className="btn-ghost" type="button" disabled={index === total - 1} onClick={() => move('down')}>Bajar</button>
        <button className="btn-danger" type="button" onClick={remove}>Quitar</button>
      </div>
    </form>
  );
}
