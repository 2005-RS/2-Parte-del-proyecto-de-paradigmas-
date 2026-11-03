import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { RequireAuth, useAuth } from './auth';
import { Logo, NightSky } from './brand';
import { Character } from './characters';
import { LoginPage, RegisterPage } from './screens/access';
import { HistoryPage, HostPage, JoinPage, PlayPage, ResultsPage } from './screens/game';
import { EditorPage, HomePage, NewQuizPage } from './screens/quizzes';

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
        <Route path="/quizzes/nuevo" element={<RequireAuth><NewQuizPage /></RequireAuth>} />
        <Route path="/quizzes/:id" element={<RequireAuth><EditorPage /></RequireAuth>} />
        <Route path="/jugar" element={<RequireAuth><JoinPage /></RequireAuth>} />
        <Route path="/jugar/:code" element={<RequireAuth><PlayPage /></RequireAuth>} />
        <Route path="/sala/:code" element={<RequireAuth><HostPage /></RequireAuth>} />
        <Route path="/historial" element={<RequireAuth><HistoryPage /></RequireAuth>} />
        <Route path="/resultados/:code" element={<RequireAuth><ResultsPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function Shell() {
  const { user } = useAuth();
  const location = useLocation();
  const live = /^\/(sala|jugar|resultados)(\/|$)/.test(location.pathname);
  return (
    <div className={live ? 'shell shell-live' : 'shell shell-game'}>
      <NightSky />
      {!live && (
        <header className="topbar">
          <Link className="brand" to="/">
            <Logo />
            <span className="brand-text">
              <strong>ProfeLink</strong>
              <span>Actividades de la academia</span>
            </span>
          </Link>
          {user && (
            <div className="top-actions">
              <span className="who you-chip">
                <Character name={user.displayName} size={36} />
                {user.displayName}
              </span>
              <Link className="nav-pill" to="/jugar">Unirme</Link>
              <Link className="nav-pill" to="/historial">Partidas</Link>
              <LogoutButton />
            </div>
          )}
        </header>
      )}
      <Outlet />
    </div>
  );
}

function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <button
      className="nav-pill"
      onClick={() => {
        logout();
        navigate('/entrar');
      }}
    >
      Salir
    </button>
  );
}
