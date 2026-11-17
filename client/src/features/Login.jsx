import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useSession } from '../app/Session.jsx';
import { Alert, Button, Field, Loading } from '../components/ui.jsx';

export function Login() {
  const { user, login, loading } = useSession(), navigate = useNavigate();
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [pending, setPending] = useState(false), [error, setError] = useState('');
  if (loading) return <Loading>Checking your session…</Loading>;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/courses'} replace/>;
  const submit = async event => {
    event.preventDefault(); setPending(true); setError('');
    try { const identity = await login(email, password); setPassword(''); navigate(identity.role === 'admin' ? '/admin' : '/courses', { replace: true }); }
    catch (failure) { setError(failure.message); } finally { setPending(false); }
  };
  return <section className="workspace-page login-page"><span className="eyebrow muted">YOUR NEXT CHAPTER</span><h1>Welcome to Electiva.</h1><p className="page-intro">A thoughtful way to plan your elective courses.</p><div className="login-panel"><h2>Your course workspace</h2><p>Sign in with the account provided for this application.</p>{error && <Alert tone="error" title="Couldn’t sign in">{error}</Alert>}<form onSubmit={submit}><Field label="Account email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)}/><Field label="Password" type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={event => setPassword(event.target.value)}/><Button type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</Button></form><p className="dialog-note">This is a college project. Demo accounts use synthetic data and are separate from your ASE login.</p><Link to="/about">About the project</Link></div></section>;
}
