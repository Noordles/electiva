import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { Alert, Button, EmptyState, Icon, Field, StatusBadge, Loading } from "../components/ui.jsx";
import { Catalog } from "../features/catalog/Catalog.jsx";
import { Login } from '../features/Login.jsx';
import { Enrollments } from '../features/Enrollments.jsx';
import { RequireSession, useSession } from './Session.jsx';

function useApiStatus() {
  const [status, setStatus] = useState("connecting");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setStatus("connecting");
    fetch("/api/v1/meta", { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5_000)]) })
      .then(async response => { if (!response.ok) throw new Error(); const body = await response.json(); if (body.data?.product !== "Electiva") throw new Error(); setStatus("online"); })
      .catch(() => { if (!controller.signal.aborted) setStatus("offline"); });
    return () => controller.abort();
  }, [attempt]);
  return { status, retry: () => setAttempt(a => a + 1) };
}
function Admin() {
  return <section className="workspace-page"><span className="eyebrow muted">ADMINISTRATION</span><h1>A clear view of every course.</h1><p className="page-intro">Manage courses, enrollment windows and capacity through the protected administration API.</p><Alert title="API ready">Course, offering, roster, directory and reporting endpoints are implemented. Management screens are the next interface milestone.</Alert><div className="feature-grid">{[["book", "Course offerings", "Create and publish courses with clear capacity and enrollment windows."], ["calendar", "Waitlist management", "Keep the queue fair, and promote students when a seat becomes available."], ["chart", "Enrollment reports", "Understand demand with course-level summaries and bounded rosters."]].map(([icon, title, description]) => <article key={title} className="feature-card"><Icon name={icon} size={26}/><h2>{title}</h2><p>{description}</p><span className="tag">Management API ready</span></article>)}</div></section>;
}
function About() {
  return <section className="workspace-page"><span className="eyebrow muted">BUILT WITH PURPOSE</span><h1>More choice. Less friction.</h1><p className="page-intro">Electiva is team JIN’s elective course enrollment project for ASE Web Technologies, 2026–2027.</p><div className="about-panel"><h2>Where we are today</h2><p>Sign-in, a persisted course catalog, enrollment, cancellation and FIFO waitlists are implemented. The application uses server-side permissions and database constraints to protect student records and seats.</p><h2>What we’re building</h2><p>Students can browse, enroll, cancel and track their status. Administrator APIs manage offerings and windows. The remaining work includes management screens, automated browser journeys and measured capacity experiments.</p><p>The assigned architectural challenges are concurrency and consistency (CON), and scalability and capacity (SCL).</p><p>Designed by Noor, following his wine-red and cyan visual direction. Built with AI assistance for team JIN; individual implementation and review evidence is recorded in the project documentation.</p><div className="team-names"><span>Al-Sammarraie Nooruldeen Sameer Fawzi</span><span>Ilinca-Mara Vlădescu</span><span>Taya Jwan</span></div></div></section>;
}
export function App() {
  const { status, retry } = useApiStatus();
  const { user, logout } = useSession();
  const [logoutError, setLogoutError] = useState('');
  const signOut = async () => { try { await logout(); setLogoutError(''); } catch (error) { setLogoutError(error.message); } };
  const location = useLocation();
  useEffect(() => { document.title = `Electiva · ${location.pathname === "/courses" || location.pathname === "/" ? "Explore courses" : location.pathname === "/my-enrollments" ? "My enrollments" : "Your course workspace"}`; }, [location.pathname]);
  return <div className="app-layout"><a href="#main" className="skip-link">Skip to content</a><aside className="sidebar"><Link to="/courses" className="brand" aria-label="Electiva home"><img className="brand-mark" src="/electiva-icon.png" width="40" height="40" alt=""/><span>electiva<span className="brand-period">.</span></span></Link><div className="sidebar-label">YOUR WORKSPACE</div><nav aria-label="Main navigation"><NavLink to="/courses"><Icon name="grid"/>Explore courses<Icon className="nav-arrow" name="arrow" size={17}/></NavLink>{user?.role !== 'admin' && <NavLink to="/my-enrollments"><Icon name="book"/>My enrollments</NavLink>}{user?.role === 'admin' && <NavLink to="/admin"><Icon name="chart"/>Administration</NavLink>}</nav><div className="sidebar-note"><span className="tiny-star">✳</span><p>A semester shaped<br/>by your curiosity.</p><span>YOUR NEXT CHAPTER STARTS HERE</span></div><div className="sidebar-bottom"><NavLink to="/about"><Icon name="info" size={18}/>About Electiva</NavLink><div className="team-brand"><span className="team-avatar">JIN</span><div><strong>Team JIN</strong><span>Web Technologies · ASE</span></div></div></div></aside><div className="main-layout"><header className="topbar"><span className="breadcrumb">Workspace <span>/</span><strong>{location.pathname === "/my-enrollments" ? "My enrollments" : location.pathname === "/admin" ? "Administration" : location.pathname === "/about" ? "About" : location.pathname === "/login" ? "Sign in" : "Explore courses"}</strong></span><div className="topbar-actions">{user ? <><span className="account-name">{user.displayName}</span><Button variant="text" onClick={signOut}>Sign out</Button></> : <Link className="signin-link" to="/login">Sign in <Icon name="arrow" size={16}/></Link>}</div></header><main id="main" tabIndex={-1}>{status === "offline" && <Alert title="Connection unavailable" tone="error" action={<Button variant="secondary" onClick={retry}>Retry</Button>}>The application service could not be reached. Check your connection, then try again.</Alert>}{logoutError && <Alert tone="error" title="Couldn’t sign out">{logoutError}</Alert>}<Routes><Route path="/" element={<RequireSession><Catalog/></RequireSession>}/><Route path="/courses" element={<RequireSession><Catalog/></RequireSession>}/><Route path="/my-enrollments" element={<RequireSession role="student"><Enrollments/></RequireSession>}/><Route path="/admin" element={<RequireSession role="admin"><Admin/></RequireSession>}/><Route path="/login" element={<Login/>}/><Route path="/about" element={<About/>}/><Route path="*" element={<EmptyState title="This page took a different path." action={<Link className="button button-primary" to="/courses">Back to courses</Link>}>We couldn’t find that page. Your next elective is still waiting.</EmptyState>}/></Routes><footer><span>© 2026 Electiva · Team JIN · Designed by Noor</span><span className={`connection-status ${status}`} aria-live="polite"><i/>{status === "online" ? "Application service connected" : status === "offline" ? "Application service offline" : <Loading>Connecting to application service…</Loading>}</span></footer></main></div></div>;
}
