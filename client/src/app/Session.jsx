import { createContext, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, setCsrfToken } from './api.js';
import { Alert, Button, EmptyState, Loading } from '../components/ui.jsx';

const SessionContext = createContext(null);
export const useSession = () => useContext(SessionContext);
export function SessionProvider({ children }) {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    (async () => {
      try {
        const identity = await api('/auth/me', { signal: controller.signal, quiet401: true });
        const csrf = await api('/auth/csrf', { signal: controller.signal, quiet401: true });
        if (!controller.signal.aborted) { setCsrfToken(csrf.data.csrfToken); setUser(identity.data); }
      } catch (failure) { if (!controller.signal.aborted) { setUser(null); if (failure.status !== 401) setError('We could not check your session. Please try again.'); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    const expired = () => { setUser(null); setCsrfToken(undefined); };
    window.addEventListener('electiva-session-expired', expired);
    return () => window.removeEventListener('electiva-session-expired', expired);
  }, []);
  const login = async (email, password) => {
    const result = await api('/auth/login', { method: 'POST', body: { email, password }, quiet401: true });
    setCsrfToken(result.data.csrfToken); setUser(result.data.user); setError('');
    return result.data.user;
  };
  const logout = async () => { await api('/auth/logout', { method: 'POST', body: {} }); setCsrfToken(undefined); setUser(null); };
  return <SessionContext.Provider value={{ user, loading, error, login, logout, retry: () => setAttempt(value => value + 1) }}>{children}</SessionContext.Provider>;
}
export function RequireSession({ children, role }) {
  const { user, loading, error, retry } = useSession();
  if (loading) return <div className="workspace-page"><Loading>Checking your session…</Loading></div>;
  if (error) return <Alert tone="error" title="Connection unavailable" action={<Button onClick={retry}>Retry</Button>}>{error}</Alert>;
  if (!user) return <EmptyState title="Your workspace starts here." action={<Link className="button button-primary" to="/login">Sign in</Link>}>Sign in to explore course availability and manage your choices.</EmptyState>;
  if (role && user.role !== role) return <EmptyState title="A different workspace." action={<Link className="button button-primary" to="/courses">Explore courses</Link>}>This page is available to {role === 'admin' ? 'administrators' : 'students'}.</EmptyState>;
  return children;
}
