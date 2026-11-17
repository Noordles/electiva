import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../app/api.js';
import { useCollection } from '../app/useCollection.js';
import { Alert, Button, ConfirmDialog, EmptyState, Loading, Pagination, StatusBadge } from '../components/ui.jsx';

export function Enrollments() {
  const [page, setPage] = useState(1), { result, loading, error, refresh } = useCollection(`/me/enrollments?page=${page}&pageSize=10`);
  const [selected, setSelected] = useState(null), [pending, setPending] = useState(false), [notice, setNotice] = useState(''), [actionError, setActionError] = useState('');
  const cancel = async () => {
    setPending(true); setActionError('');
    try { await api(`/me/enrollments/${selected.id}/cancel`, { method: 'POST', body: {} }); setSelected(null); setNotice('Your enrollment was cancelled. Any available seat is passed to the next student in the queue.'); refresh(); }
    catch (failure) { setActionError(failure.message); } finally { setPending(false); }
  };
  return <section className="workspace-page"><span className="eyebrow muted">YOUR SEMESTER</span><h1>My enrollments</h1><p className="page-intro">Your choices, your place in the queue, and a clear record of every change.</p>{notice && <Alert>{notice}</Alert>}{error && <Alert tone="error" title="Couldn’t load your enrollments" action={<Button onClick={refresh}>Retry</Button>}>{error}</Alert>}{loading && <Loading>Loading your enrollments…</Loading>}{result && (result.data.length ? <><div className="enrollment-list">{result.data.map(row => <article className="enrollment-row" key={row.id}><div><span className="eyebrow muted">{row.code}</span><h2>{row.title}</h2><p>Requested {new Date(row.createdAt).toLocaleString()}</p></div><StatusBadge className={`tag status-${row.status.toLowerCase()}`}>{row.status === 'ACTIVE' ? 'Enrolled' : row.status === 'WAITLISTED' ? 'Waitlisted' : 'Cancelled'}</StatusBadge>{row.status !== 'CANCELLED' && <Button variant="secondary" onClick={() => { setSelected(row); setActionError(''); }}>Cancel enrollment</Button>}</article>)}</div><Pagination {...result.meta} onChange={setPage}/></> : <EmptyState title="A fresh start, full of possibilities." action={<Link className="button button-primary" to="/courses">Explore courses</Link>}>When you choose an elective, your enrollment and waitlist status appear here.</EmptyState>)}{selected && <ConfirmDialog title={`Cancel ${selected.title}?`} confirmLabel="Cancel enrollment" onConfirm={cancel} onClose={() => { if (!pending) setSelected(null); }} pending={pending}>You can request a place again while the enrollment window is open. A new request joins at the end of the queue.{actionError && <span role="alert" className="action-error">{actionError}</span>}</ConfirmDialog>}</section>;
}
