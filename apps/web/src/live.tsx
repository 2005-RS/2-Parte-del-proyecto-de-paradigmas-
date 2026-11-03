import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { api, type SessionState } from './api';
import { config } from './config';

export function useLiveSession(code: string, token: string, mode: 'host' | 'player') {
  const [state, setState] = useState<SessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;
    const socket: Socket = io(config.wsUrl, { auth: { token } });
    const refresh = () => {
      api
        .state(token, code)
        .then((next) => {
          if (active) setState(next);
        })
        .catch((reason: Error) => {
          if (active && !socket.connected) setError(reason.message);
        });
    };

    socket.on('connect', () => {
      if (!active) return;
      setConnected(true);
      setError(null);
      socket.emit(mode === 'host' ? 'session.watch' : 'session.join', { code });
    });
    socket.on('disconnect', () => {
      if (active) setConnected(false);
    });
    socket.on('session.state', (next: SessionState) => {
      if (!active) return;
      setState(next);
      setError(null);
    });
    socket.on('game.error', (payload: { message?: string }) => {
      if (active) setError(payload.message || 'No se pudo sincronizar la sala.');
    });
    socket.on('connect_error', () => {
      if (active) {
        setConnected(false);
        setError('Se perdió la conexión en vivo. Tu participación y tu puntaje siguen guardados.');
      }
    });

    refresh();
    const poll = window.setInterval(() => {
      if (!socket.connected) refresh();
    }, 1500);

    return () => {
      active = false;
      window.clearInterval(poll);
      socket.disconnect();
    };
  }, [code, token, mode]);

  return { state, setState, error, setError, connected };
}

export function useClock(): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, []);
  return now;
}
