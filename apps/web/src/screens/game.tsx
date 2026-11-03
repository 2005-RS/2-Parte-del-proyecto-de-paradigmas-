import { motion } from 'motion/react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, type SessionState } from '../api';
import { useAuth } from '../auth';
import { LinkMascot, Logo } from '../brand';
import { Character, Trophy } from '../characters';
import { mediaUrl } from '../config';
import { useClock, useLiveSession } from '../live';
import { musicMuted, playCorrect, playGo, playJoin, playPodium, playTick, playWrong, setMusicMuted, startLobbyMusic, stopMusic } from '../sfx';

export function JoinPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState((params.get('pin') || '').toUpperCase());
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const auto = useRef(false);

  useEffect(() => {
    const pin = (params.get('pin') || '').toUpperCase();
    if (!token || pin.length !== 6 || auto.current) return;
    auto.current = true;
    setPending(true);
    api
      .join(token, pin)
      .then(() => {
        sessionStorage.setItem('profelink.room', pin);
        playJoin();
        navigate(`/jugar/${pin}`);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setPending(false));
  }, [params, token, navigate]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setPending(true);
    setError(null);
    const normalized = code.trim().toUpperCase();
    try {
      await api.join(token, normalized);
      sessionStorage.setItem('profelink.room', normalized);
      playJoin();
      navigate(`/jugar/${normalized}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo entrar a la sala.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="stage">
      <Blobs />
      <div className="stage-inner">
        <div className="host-bar">
          <Link className="exit" to="/">Salir</Link>
          <Connection connected />
        </div>
        <form className="pin-card" onSubmit={onSubmit}>
          <p>Código del juego</p>
          <h1>Entra a la sala</h1>
          <p className="lede">{user?.displayName}, escribe el código que está proyectando el profesor.</p>
          {error && <div className="banner">{error}</div>}
          <label>
            Código
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              minLength={6}
              maxLength={6}
              autoFocus
              required
              style={{ fontSize: '2rem', letterSpacing: '0.28em', textAlign: 'center', textTransform: 'uppercase' }}
            />
          </label>
          <button className="go" disabled={pending}>{pending ? 'Entrando…' : 'Unirme'}</button>
        </form>
      </div>
    </section>
  );
}

export function HostPage() {
  const { token } = useAuth();
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const live = useLiveSession(code, token || '', 'host');
  const [pending, setPending] = useState(false);
  const [muted, setMuted] = useState(musicMuted);
  useJoinPops(live.state?.playerCount ?? 0);
  useEffect(() => {
    const status = live.state?.status;
    if (muted) {
      stopMusic();
      return;
    }
    if (status === 'lobby') startLobbyMusic();
    else if (status === 'finished') playPodium();
    else stopMusic();
    return () => stopMusic();
  }, [live.state?.status, muted]);

  async function run(action: () => Promise<SessionState | void>) {
    setPending(true);
    live.setError(null);
    try {
      const next = await action();
      if (next) live.setState(next);
    } catch (reason) {
      live.setError(reason instanceof Error ? reason.message : 'No se pudo controlar la sala.');
    } finally {
      setPending(false);
    }
  }

  async function cancel() {
    if (!token) return;
    await run(async () => {
      await api.cancel(token, code);
      navigate('/');
    });
  }

  if (!token) return null;
  const state = live.state;
  const showcase = !state || state.status === 'lobby' || state.status === 'finished';
  const asking = state?.status === 'question_open' || state?.status === 'question_closed';
  return (
    <section className={asking ? 'q-screen' : showcase ? 'scene' : 'stage'}>
      {showcase && <Garland />}
      {!showcase && !asking && <Blobs />}
      <div className="stage-inner">
        <div className="host-bar">
          <Link className="exit" to="/">Salir</Link>
          <Connection connected={live.connected} />
          <button
            className="exit"
            type="button"
            onClick={() => {
              const next = !muted;
              setMuted(next);
              setMusicMuted(next);
              if (!next && state?.status === 'lobby') startLobbyMusic();
            }}
          >
            {muted ? 'Música off' : 'Música on'}
          </button>
        </div>
        {live.error && <div className="banner">{live.error}</div>}
        {!state && <p>Cargando sala…</p>}
        {state?.status === 'lobby' && (
          <>
            <motion.div
              className="join-banner"
              initial={{ y: -80, opacity: 0, scale: 0.92 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', bounce: 0.46 }}
            >
              <div>
                <p>Únete en</p>
                <strong>{window.location.host}</strong>
              </div>
              <div>
                <p>PIN de juego</p>
                <div className="pin">{formatPin(state.code)}</div>
              </div>
              <RoomQr value={`${window.location.origin}/jugar?pin=${state.code}`} />
            </motion.div>
            <div className="wordmark">
              <Logo size={64} />
              <span>ProfeLink</span>
              <small>La actividad en vivo de tu academia</small>
            </div>
            <Roster state={state} />
            <div className="scene-actions">
              <button className="empezar" disabled={pending || state.playerCount === 0} onClick={() => { playGo(); void run(() => api.start(token, code)); }}>
                {state.playerCount === 0 ? 'Bloqueado' : 'Empezar'}
              </button>
              <button className="exit" disabled={pending} onClick={cancel}>Cancelar</button>
            </div>
          </>
        )}
        {state && state.status !== 'lobby' && state.status !== 'finished' && state.question && <QuestionView state={state} />}
        {state?.status === 'question_open' && (
          <div className="q-actions">
            <button className="go" disabled={pending} onClick={() => run(() => api.close(token, code))}>Cerrar pregunta</button>
          </div>
        )}
        {state?.status === 'question_closed' && (
          <div className="q-actions">
            <button className="go" disabled={pending} onClick={() => { playGo(); void run(() => api.next(token, code)); }}>
              {state.question && state.question.index + 1 < state.question.total ? 'Siguiente' : 'Premios'}
            </button>
            <button className="exit" disabled={pending} onClick={() => run(() => api.finish(token, code))}>Terminar</button>
          </div>
        )}
        {state?.status === 'finished' && <PrizeScreen state={state} />}
      </div>
    </section>
  );
}

export function PlayPage() {
  const { token, user } = useAuth();
  const { code = '' } = useParams();
  const live = useLiveSession(code, token || '', 'player');
  const [pending, setPending] = useState(false);

  async function answer(value: boolean) {
    if (!token || !live.state?.question) return;
    setPending(true);
    live.setError(null);
    try {
      live.setState(await api.answer(token, code, live.state.question.id, value));
    } catch (reason) {
      live.setError(reason instanceof Error ? reason.message : 'No se pudo enviar la respuesta.');
    } finally {
      setPending(false);
    }
  }

  if (!token) return null;
  const state = live.state;
  const locked = !state?.question || state.status !== 'question_open' || state.question.yourAnswer !== null || pending;
  const answering = state?.status === 'question_open' && state.question && state.question.yourAnswer === null;

  const asking = state?.status === 'question_open' || state?.status === 'question_closed';
  return (
    <section className={state?.status === 'finished' || state?.status === 'lobby' ? 'scene' : asking ? 'q-screen' : 'stage'}>
      {(state?.status === 'finished' || state?.status === 'lobby') && <Garland />}
      {state?.status !== 'finished' && state?.status !== 'lobby' && !asking && <Blobs />}
      <div className="stage-inner">
        <div className="play-top">
          <Link className="exit" to="/jugar">Salir</Link>
          <Connection connected={live.connected} />
          <span className="you-chip">
            <Character name={user?.displayName || 'Jugador'} size={36} />
            <strong>{user?.displayName} · {state?.yourScore ?? 0} pts</strong>
          </span>
        </div>
        {live.error && <div className="banner">{live.error}</div>}
        {!state && <p>Buscando la sala…</p>}
        {state?.status === 'lobby' && (
          <div className="pin-card waiting-player">
            <motion.div animate={{ y: [0, -14, 0], rotate: [-4, 4, -4] }} transition={{ duration: 1.6, repeat: Infinity }}>
              <Character name={user?.displayName || 'Jugador'} size={120} />
            </motion.div>
            <p>Estás dentro</p>
            <h1>{user?.displayName}</h1>
            <p>Mira la pantalla del profesor. La pregunta llegará sola.</p>
          </div>
        )}
        {answering && state && (
          <QuestionView state={state} player onAnswer={answer} locked={locked} />
        )}
        {state && state.status === 'question_closed' && state.question && (
          <QuestionView state={state} player />
        )}
        {state?.status === 'question_open' && state.question?.yourAnswer !== null && (
          <div className="locked-in">
            <div className="shapes" aria-hidden="true"><i /><i /><i /><i /></div>
            <h1>¡Listo!</h1>
            <p>Respuesta enviada. Espera el cierre.</p>
          </div>
        )}
        {state?.status === 'finished' && <PrizeScreen state={state} />}
      </div>
    </section>
  );
}

export function HistoryPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Awaited<ReturnType<typeof api.history>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.history(token).then(setRows).catch((reason: Error) => setError(reason.message));
  }, [token]);

  return (
    <main className="hub">
      <motion.div className="hub-orb a" animate={{ y: [0, -22, 0], x: [0, 10, 0] }} transition={{ duration: 7, repeat: Infinity }} />
      <motion.div className="hub-orb b" animate={{ y: [0, 18, 0] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div className="hub-hero" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.35 }}>
        <div>
          <p className="hub-kicker">Academia</p>
          <h1>Partidas</h1>
          <p>Salas de tu academia: entra a una en vivo o abre el podio de las que ya cerraron.</p>
        </div>
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 2.2, repeat: Infinity }}>
          <LinkMascot />
        </motion.div>
      </motion.div>
      {error && <div className="banner">{error}</div>}
      {!rows && <p className="status-line">Cargando las salas…</p>}
      {rows && rows.length === 0 && <p className="status-line">Todavía no hay partidas.</p>}
      <motion.div className="hub-grid" variants={board} initial="hidden" animate="show">
        {rows?.map((row, index) => (
          <motion.article
            className={`match-tile tone-${index % 4}`}
            key={row.code}
            variants={pop}
            whileHover={{ y: -10, scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.08 }}>
              <Character name={row.quizTitle + row.code} size={84} />
            </motion.div>
            <h2>{row.quizTitle}</h2>
            <p className="match-pin">{formatPin(row.code)}</p>
            <span className={`match-state ${row.status}`}>{labelStatus(row.status)} · {row.playerCount}</span>
            <Link className="empezar" to={row.status === 'finished' ? `/resultados/${row.code}` : `/sala/${row.code}`}>
              {row.status === 'finished' ? 'Premios' : 'Entrar'}
            </Link>
          </motion.article>
        ))}
      </motion.div>
    </main>
  );
}

export function ResultsPage() {
  const { token } = useAuth();
  const { code = '' } = useParams();
  const [state, setState] = useState<SessionState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.results(token, code).then(setState).catch((reason: Error) => setError(reason.message));
  }, [token, code]);

  return (
    <section className="scene">
      <Garland />
      <div className="stage-inner">
        <Link className="exit" to="/historial">Volver</Link>
        {error && <div className="banner">{error}</div>}
        {state && (
          <>
            <p className="meta">{state.quizTitle} · sala {state.code}</p>
            <PrizeScreen state={state} />
          </>
        )}
      </div>
    </section>
  );
}

function QuestionView({
  state,
  player = false,
  onAnswer,
  locked = false,
}: {
  state: SessionState;
  player?: boolean;
  onAnswer?: (value: boolean) => void;
  locked?: boolean;
}) {
  const now = useClock();
  const question = state.question;
  const closes = question?.closesAt ? new Date(question.closesAt).getTime() : now;
  const total = (question?.timeLimitSeconds ?? 1) * 1000;
  const remain = Math.max(0, closes - now);
  const ratio = state.status === 'question_open' ? Math.max(0, Math.min(1, remain / total)) : 0;
  const seconds = Math.ceil(remain / 1000);
  useCountdown(state.status === 'question_open', seconds);
  useHostReveal(!player, question?.id ?? '', state.status);
  const revealedNow = question?.correctAnswer !== null && question?.correctAnswer !== undefined;
  const playerTone = !question || question.yourAnswer === null
    ? 'miss'
    : question.yourAnswer === question.correctAnswer ? 'win' : 'lose';
  usePlayerVerdict(player && revealedNow ? question.id : '', playerTone);
  if (!question) return null;
  const image = mediaUrl(question.imagePath);
  const revealed = question.correctAnswer !== null;
  const tiles: { value: boolean | null; label: string; color: string; shape: string }[] = [
    { value: true, label: 'Verdadero', color: 'red', shape: 'triangle' },
    { value: false, label: 'Falso', color: 'blue', shape: 'diamond' },
    { value: null, label: '', color: 'yellow', shape: 'circle' },
    { value: null, label: '', color: 'green', shape: 'square' },
  ];
  return (
    <article className="q-board" key={question.id}>
      <header className="q-ask">
        <p>Pregunta {question.index + 1} de {question.total}</p>
        <h1>{question.prompt}</h1>
      </header>
      <div className="q-media">
        {image ? <img src={image} alt="" /> : <div className="q-placeholder" />}
        {state.status === 'question_open' && <Ring ratio={ratio} seconds={seconds} />}
        {!player && state.status === 'question_open' && <span className="q-count">{question.answeredCount}</span>}
      </div>
      <div className="q-grid">
        {tiles.map((tile) => {
          const interactive = tile.value !== null && !!onAnswer;
          const picked = tile.value !== null && question.yourAnswer === tile.value;
          const win = revealed && tile.value !== null && question.correctAnswer === tile.value;
          const dim = revealed && (tile.value === null || question.correctAnswer !== tile.value);
          const className = `q-tile ${tile.color}${win ? ' win' : ''}${dim ? ' dim' : ''}${picked ? ' picked' : ''}`;
          const body = (
            <>
              <i className={`mark ${tile.shape}`} />
              {tile.label && <span>{tile.label}</span>}
            </>
          );
          if (!interactive) {
            return <div className={className} key={tile.color}>{body}</div>;
          }
          return (
            <button key={tile.color} className={className} type="button" disabled={locked} onClick={() => { if (tile.value !== null) onAnswer?.(tile.value); }}>
              {body}
            </button>
          );
        })}
      </div>
      {player && revealed && question.yourAnswer !== null && (
        <p className="q-result">{question.yourAnswer === question.correctAnswer ? '¡Correcto! +1' : 'Esta vez no suma'}</p>
      )}
      {player && revealed && question.yourAnswer === null && <p className="q-result">Se acabó el tiempo</p>}
      {!player && state.status !== 'question_open' && <People state={state} />}
    </article>
  );
}

function People({ state }: { state: SessionState }) {
  if (state.players.length === 0) return <p>Nadie ha entrado todavía. Máximo 40 participantes.</p>;
  return (
    <ul className="avatars">
      {state.players.map((player, index) => (
        <li key={`${player.displayName}-${index}`}>
          <Character name={player.displayName} size={42} />
          <span>{player.displayName}</span>
          <strong>{player.score}</strong>
        </li>
      ))}
    </ul>
  );
}

function Roster({ state }: { state: SessionState }) {
  if (state.players.length === 0) {
    return <p className="roster-empty">Los personajes aparecen aquí cuando el grupo entra con el PIN o el QR.</p>;
  }
  return (
    <motion.ul className="roster" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
      {state.players.map((player, index) => (
        <motion.li
          key={`${player.displayName}-${index}`}
          variants={{
            hidden: { opacity: 0, scale: 0.2, y: 90, rotate: index % 2 ? -18 : 18 },
            show: { opacity: 1, scale: 1, y: 0, rotate: 0, transition: { type: 'spring', bounce: 0.55, duration: 0.7 } },
          }}
          whileHover={{ scale: 1.12, rotate: index % 2 ? 6 : -6 }}
        >
          <motion.div
            animate={{ y: [0, -12, 0], rotate: [0, 4, -4, 0] }}
            transition={{ duration: 1.8 + (index % 4) * 0.25, repeat: Infinity, delay: index * 0.12, ease: 'easeInOut' }}
          >
            <Character name={player.displayName} size={84} />
          </motion.div>
          <span>{player.displayName}</span>
        </motion.li>
      ))}
    </motion.ul>
  );
}

function PrizeScreen({ state }: { state: SessionState }) {
  if (!state.ranking) return null;
  const [first, second, third] = state.ranking;
  return (
    <div className="prizes">
      <Confetti />
      <h1>Premios</h1>
      <div className="podium">
        {second && <PodiumSlot row={second} tone="silver" />}
        {first && <PodiumSlot row={first} tone="gold" />}
        {third && <PodiumSlot row={third} tone="bronze" />}
      </div>
      <ol className="ranking">
        {state.ranking.map((row) => (
          <li key={row.displayName}>
            <Character name={row.displayName} size={36} />
            <span className="place">{row.place}. {row.displayName}</span>
            <strong>{row.score}</strong>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PodiumSlot({ row, tone }: { row: { place: number; displayName: string; score: number }; tone: string }) {
  return (
    <article className={tone}>
      <Trophy place={row.place} />
      <Character name={row.displayName} size={92} />
      <b>{row.place}</b>
      <div>{row.displayName}</div>
      <strong>{row.score} pts</strong>
    </article>
  );
}

function RoomQr({ value }: { value: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let live = true;
    void import('qrcode').then((mod) => mod.default.toDataURL(value, {
      margin: 1,
      width: 168,
      color: { dark: '#071422', light: '#ffffff' },
    })).then((url) => {
      if (live) setSrc(url);
    });
    return () => {
      live = false;
    };
  }, [value]);
  return src ? <img className="qr" src={src} alt="QR para unirse a la sala" /> : <div className="qr" />;
}

function Garland() {
  return (
    <div className="garland" aria-hidden="true">
      {Array.from({ length: 16 }, (_, index) => <i key={index} />)}
    </div>
  );
}

function formatPin(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

function Ring({ ratio, seconds }: { ratio: number; seconds: number }) {
  const radius = 42;
  const length = 2 * Math.PI * radius;
  return (
    <div className={seconds <= 5 ? 'ring urgent' : 'ring'} aria-label={`${seconds} segundos`}>
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} />
        <circle className="value" cx="50" cy="50" r={radius} style={{ strokeDasharray: length, strokeDashoffset: length * (1 - ratio) }} />
      </svg>
      <strong>{seconds}</strong>
    </div>
  );
}

function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 26 }, (_, index) => (
        <span
          key={index}
          style={{
            left: `${(index * 37) % 100}%`,
            animationDelay: `${(index % 8) * 0.08}s`,
            background: ['#e21b3c', '#1368ce', '#ffa602', '#26890c', '#ffffff'][index % 5],
          }}
        />
      ))}
    </div>
  );
}

function Blobs() {
  return (
    <>
      <span className="blob a" />
      <span className="blob b" />
      <span className="blob c" />
    </>
  );
}

function Connection({ connected }: { connected: boolean }) {
  return (
    <p className="meta">
      <span className={connected ? 'live-dot on' : 'live-dot'} />
      {connected ? 'En vivo' : 'Reconectando. La sala y el puntaje se conservan.'}
    </p>
  );
}

function useJoinPops(count: number) {
  const previous = useRef(count);
  useEffect(() => {
    if (count > previous.current) playJoin();
    previous.current = count;
  }, [count]);
}

function useCountdown(active: boolean, seconds: number) {
  const previous = useRef<number | null>(null);
  useEffect(() => {
    if (!active) {
      previous.current = null;
      return;
    }
    if (previous.current === seconds) return;
    previous.current = seconds;
    if (seconds > 0 && seconds <= 5) playTick();
  }, [active, seconds]);
}

function useHostReveal(enabled: boolean, questionId: string, status: string) {
  const played = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled || status !== 'question_closed' || played.current === questionId) return;
    played.current = questionId;
    playGo();
  }, [enabled, questionId, status]);
}

function usePlayerVerdict(questionId: string, tone: 'win' | 'lose' | 'miss') {
  const played = useRef<string | null>(null);
  useEffect(() => {
    if (!questionId || played.current === questionId) return;
    played.current = questionId;
    if (tone === 'win') playCorrect();
    if (tone === 'lose' || tone === 'miss') playWrong();
  }, [questionId, tone]);
}

const board = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const pop = {
  hidden: { opacity: 0, y: 40, scale: 0.88 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, bounce: 0.4, duration: 0.65 } },
};

function labelStatus(status: string): string {
  if (status === 'finished') return 'Terminada';
  if (status === 'lobby') return 'En espera';
  return 'En curso';
}
