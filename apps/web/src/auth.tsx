import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, type User } from './api';

type AuthValue = {
  token: string | null;
  user: User | null;
  ready: boolean;
  enter: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('profelink.token'));
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setReady(true);
      return;
    }
    let active = true;
    api
      .me(token)
      .then((next) => {
        if (active) setUser(next);
      })
      .catch(() => {
        localStorage.removeItem('profelink.token');
        if (active) {
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const value = useMemo<AuthValue>(
    () => ({
      token,
      user,
      ready,
      enter: (nextToken, nextUser) => {
        localStorage.setItem('profelink.token', nextToken);
        setToken(nextToken);
        setUser(nextUser);
        setReady(true);
      },
      logout: () => {
        localStorage.removeItem('profelink.token');
        setToken(null);
        setUser(null);
      },
    }),
    [token, user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider');
  return value;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <p className="status-line">Cargando tu perfil…</p>;
  if (!token) return <Navigate to="/entrar" replace state={{ from: `${location.pathname}${location.search}` }} />;
  return children;
}
