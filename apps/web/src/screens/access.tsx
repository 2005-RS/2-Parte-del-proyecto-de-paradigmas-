import { FormEvent, ReactNode, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { LinkMascot } from '../brand';

const ornaments = [
  { glyph: '🎁', left: '7%', top: '16%', delay: 0 },
  { glyph: '⭐', left: '84%', top: '12%', delay: 0.2 },
  { glyph: '🎄', left: '5%', top: '68%', delay: 0.45 },
  { glyph: '🔔', left: '86%', top: '64%', delay: 0.15 },
  { glyph: '❄️', left: '76%', top: '28%', delay: 0.35 },
  { glyph: '🍬', left: '14%', top: '38%', delay: 0.55 },
];

function GateFrame({ kicker, title, lede, children }: { kicker: string; title: string; lede: string; children: ReactNode }) {
  return (
    <main className="gate">
      {ornaments.map((item) => (
        <motion.span
          key={item.glyph + item.left}
          className="gate-ornament"
          style={{ left: item.left, top: item.top }}
          animate={{ y: [0, -16, 0], rotate: [-8, 8, -8] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: item.delay }}
        >
          {item.glyph}
        </motion.span>
      ))}
      <motion.div
        className="gate-card"
        initial={{ opacity: 0, y: 48, scale: 0.9, rotate: -2 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.42, duration: 0.7 }}
      >
        <div className="gate-lights" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (
            <i key={index} style={{ animationDelay: `${index * 0.12}s` }} />
          ))}
        </div>
        <motion.div animate={{ y: [0, -12, 0], rotate: [-3, 3, -3] }} transition={{ duration: 2.2, repeat: Infinity }}>
          <LinkMascot size={132} />
        </motion.div>
        <p className="hub-kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="lede">{lede}</p>
        {children}
      </motion.div>
    </main>
  );
}

export function LoginPage() {
  const { enter } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/';
  const [email, setEmail] = useState('demo@profelink.dev');
  const [password, setPassword] = useState('Demo1234!');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await api.login({ email, password });
      enter(result.accessToken, result.user);
      navigate(from);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo entrar.');
    } finally {
      setPending(false);
    }
  }

  return (
    <GateFrame
      kicker="Navidad en el aula"
      title="Entra al aula"
      lede="Link te abre la puerta. Entra y elige la actividad de tu academia."
    >
      <form className="form" onSubmit={onSubmit}>
        {error && <div className="banner">{error}</div>}
        <label>
          Correo
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <motion.button className="btn" type="submit" disabled={pending} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96, y: 4 }}>
          {pending ? 'Entrando…' : 'Entrar'}
        </motion.button>
        <Link to="/registro">Crear un perfil</Link>
      </form>
    </GateFrame>
  );
}

export function RegisterPage() {
  const { enter } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await api.register({ displayName, email, password });
      enter(result.accessToken, result.user);
      navigate('/');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear el perfil.');
    } finally {
      setPending(false);
    }
  }

  return (
    <GateFrame
      kicker="Nuevo jugador"
      title="Nuevo perfil"
      lede="Crea tu perfil, elige avatar con tu nombre y entra a la sala del profesor."
    >
      <form className="form" onSubmit={onSubmit}>
        {error && <div className="banner">{error}</div>}
        <label>
          Nombre visible
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} required />
        </label>
        <label>
          Correo
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
        </label>
        <motion.button className="btn" type="submit" disabled={pending} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96, y: 4 }}>
          {pending ? 'Creando…' : 'Crear perfil'}
        </motion.button>
        <Link to="/entrar">Ya tengo perfil</Link>
      </form>
    </GateFrame>
  );
}
