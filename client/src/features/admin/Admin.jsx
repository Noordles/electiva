import { useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { api } from '../../app/api.js';
import { useCollection } from '../../app/useCollection.js';
import { Alert, Button, ConfirmDialog, EmptyState, Field, Loading, Modal, Pagination, SelectField } from '../../components/ui.jsx';

export function CollectionState({ collection, empty = 'No records yet.', children }) {
  const { result, loading, error, refresh } = collection;
  if (loading) return <div className="loading-panel"><Loading>Loading records…</Loading></div>;
  if (error) return <Alert tone="error" title="Couldn’t load records" action={<Button onClick={refresh}>Retry</Button>}>{error}</Alert>;
  if (!result?.data.length) return <EmptyState title={empty}>New records will appear here when they are saved.</EmptyState>;
  return children;
}

function Editor({ title, children, onClose, saveLabel = 'Save changes', onSave }) {
  const [pending, setPending] = useState(false), [error, setError] = useState('');
  const close = () => { if (!pending) onClose(); };
  const submit = async event => {
    event.preventDefault(); setPending(true); setError('');
    try { await onSave(new FormData(event.currentTarget)); }
    catch (failure) { setError(failure.message); } finally { setPending(false); }
  };
  return <Modal title={title} onClose={close}>{error && <Alert tone="error" title="Couldn’t save">{error}</Alert>}<form className="editor-form" onSubmit={submit}><fieldset disabled={pending}>{children}<div className="dialog-actions"><Button variant="secondary" onClick={close}>Back</Button><Button type="submit">{pending ? 'Saving…' : saveLabel}</Button></div></fieldset></form></Modal>;
}

function CourseEditor({ course, onClose, onSaved }) {
  return <Editor title={course ? 'Edit course' : 'Create course'} onClose={onClose} saveLabel={course ? 'Save course' : 'Create course'} onSave={async form => {
    const body = Object.fromEntries(form); body.credits = Number(body.credits);
    await api(course ? `/admin/courses/${course.id}` : '/admin/courses', { method: course ? 'PATCH' : 'POST', body }); onSaved();
  }}><Field label="Course code" name="code" defaultValue={course?.code} required maxLength={24} pattern="[A-Za-z0-9][A-Za-z0-9-]*"/><Field label="Course title" name="title" defaultValue={course?.title} required maxLength={160}/><label>Description<textarea name="description" defaultValue={course?.description} required maxLength={4000} rows={4}/></label><div className="form-columns"><Field label="Department" name="department" defaultValue={course?.department} required maxLength={100}/><Field label="Credits" name="credits" type="number" defaultValue={course?.credits ?? 5} min="1" max="60" step="1" required/></div></Editor>;
}

const localDate = value => {
  const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
function OfferingEditor({ offering, course, onClose, onSaved }) {
  const tomorrow = Date.now() + 86400000;
  return <Editor title={offering ? `Edit ${offering.code}` : `Offer ${course.code}`} onClose={onClose} saveLabel={offering ? 'Save offering' : 'Create draft'} onSave={async form => {
    const body = { term: form.get('term'), capacity: Number(form.get('capacity')), opensAt: new Date(form.get('opensAt')).toISOString(), closesAt: new Date(form.get('closesAt')).toISOString() };
    if (offering) body.version = offering.version; else body.courseId = course.id;
    await api(offering ? `/admin/offerings/${offering.id}` : '/admin/offerings', { method: offering ? 'PATCH' : 'POST', body }); onSaved();
  }}><p className="dialog-note">Times use your device’s timezone and are saved in UTC. Capacity increases promote the oldest waitlisted students while the window is open.</p><Field label="Term" name="term" defaultValue={offering?.term ?? '2026-2027'} required maxLength={40}/><Field label="Capacity" name="capacity" type="number" defaultValue={offering?.capacity ?? 20} required min="0" max="10000" step="1"/><Field label="Enrollment opens (local time)" name="opensAt" type="datetime-local" defaultValue={localDate(offering?.opensAt ?? Date.now())} required/><Field label="Enrollment closes (local time)" name="closesAt" type="datetime-local" defaultValue={localDate(offering?.closesAt ?? tomorrow)} required/>{offering && <p className="dialog-note">Editing version {offering.version}. A conflicting update requires reopening the form with fresh data.</p>}</Editor>;
}

function Courses() {
  const [page, setPage] = useState(1), [query, setQuery] = useState(''), [editor, setEditor] = useState(null), [offer, setOffer] = useState(null), [notice, setNotice] = useState('');
  const collection = useCollection(`/admin/courses?page=${page}&pageSize=10&q=${encodeURIComponent(query)}`), { result, refresh } = collection;
  return <><div className="management-heading"><div><h2>Course library</h2><p>Keep the course description separate from its term, seats and enrollment window.</p></div><Button onClick={() => setEditor({})}>New course</Button></div>{notice && <Alert>{notice}</Alert>}<Field label="Find a course" type="search" value={query} onChange={event => { setPage(1); setQuery(event.target.value); }} maxLength={200}/><CollectionState collection={collection} empty="Your course library starts here."><div className="table-scroll"><table><caption className="sr-only">Course library</caption><thead><tr><th>Course</th><th>Department</th><th>ECTS</th><th>Actions</th></tr></thead><tbody>{result?.data.map(course => <tr key={course.id}><td><strong>{course.title}</strong><span className="table-detail">{course.code}</span></td><td>{course.department}</td><td>{course.credits}</td><td><div className="row-actions"><Button variant="secondary" onClick={() => setEditor(course)}>Edit</Button><Button variant="text" onClick={() => setOffer(course)}>Create offering</Button></div></td></tr>)}</tbody></table></div><Pagination {...result?.meta} onChange={setPage}/></CollectionState>{editor && <CourseEditor course={editor.id ? editor : null} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); setNotice('Course saved.'); refresh(); }}/>}{offer && <OfferingEditor course={offer} onClose={() => setOffer(null)} onSaved={() => { setOffer(null); setNotice('Draft offering created. Open Offerings to review and publish it.'); }}/>}</>;
}

function Roster({ offering, onClose }) {
  const [status, setStatus] = useState(''), [page, setPage] = useState(1);
  const collection = useCollection(`/admin/offerings/${offering.id}/roster?page=${page}&pageSize=10${status ? `&status=${status}` : ''}`), { result } = collection;
  return <Modal title={`${offering.code} roster`} onClose={onClose}><p>Requests are shown in committed queue order. Only an enrolled student can cancel their own request.</p><SelectField label="Roster status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option><option value="ACTIVE">Enrolled</option><option value="WAITLISTED">Waitlisted</option><option value="CANCELLED">Cancelled</option></SelectField><CollectionState collection={collection} empty="No requests in this view."><div className="table-scroll"><table><caption className="sr-only">Student requests</caption><thead><tr><th>Request</th><th>Student</th><th>Status</th></tr></thead><tbody>{result?.data.map(row => <tr key={row.id}><td>#{row.id}</td><td>{row.displayName}<span className="table-detail">{row.email}</span></td><td><span className={`tag status-${row.status.toLowerCase()}`}>{row.status}</span></td></tr>)}</tbody></table></div><Pagination {...result?.meta} onChange={setPage}/></CollectionState></Modal>;
}

function Offerings() {
  const [page, setPage] = useState(1), [editor, setEditor] = useState(null), [roster, setRoster] = useState(null), [action, setAction] = useState(null), [pending, setPending] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const collection = useCollection(`/admin/offerings?page=${page}&pageSize=10`), { result, refresh } = collection;
  const perform = async () => {
    setPending(true); setError('');
    try { await api(`/admin/offerings/${action.offering.id}/${action.type}`, { method: 'POST', body: { version: action.offering.version } }); setNotice(`Offering ${action.type === 'publish' ? 'published' : 'archived'}.`); setAction(null); refresh(); }
    catch (failure) { setError(failure.message); } finally { setPending(false); }
  };
  return <><div className="management-heading"><div><h2>Offerings & waitlists</h2><p>Publish a clear window, keep capacity fair, and follow demand as it changes.</p></div><Link className="button button-primary" to="/admin/courses">Choose a course to offer</Link></div>{notice && <Alert>{notice}</Alert>}<CollectionState collection={collection} empty="No offerings yet."><div className="offering-list">{result?.data.map(offering => <article className="offering-row" key={offering.id}><div className="offering-summary"><div><span className="eyebrow muted">{offering.code} · {offering.term}</span><h3>{offering.title}</h3></div><span className="tag">{offering.lifecycle}</span></div><dl className="offering-facts"><div><dt>Enrolled</dt><dd>{offering.activeCount} / {offering.capacity}</dd></div><div><dt>Waitlisted</dt><dd>{offering.waitlistCount}</dd></div><div><dt>Opens</dt><dd>{new Date(offering.opensAt).toLocaleString()}</dd></div><div><dt>Closes</dt><dd>{new Date(offering.closesAt).toLocaleString()}</dd></div></dl><div className="row-actions"><Button variant="secondary" onClick={() => setRoster(offering)}>View roster</Button>{offering.lifecycle !== 'ARCHIVED' && <><Button variant="secondary" onClick={() => setEditor(offering)}>Edit offering</Button>{offering.lifecycle === 'DRAFT' && <Button onClick={() => { setError(''); setAction({ type: 'publish', offering }); }}>Publish</Button>}<Button variant="text" onClick={() => { setError(''); setAction({ type: 'archive', offering }); }}>Archive</Button></>}</div></article>)}</div><Pagination {...result?.meta} onChange={setPage}/></CollectionState>{editor && <OfferingEditor offering={editor} onClose={() => { setEditor(null); refresh(); }} onSaved={() => { setEditor(null); setNotice('Offering saved. Availability and waitlist promotions are up to date.'); refresh(); }}/>}{roster && <Roster offering={roster} onClose={() => setRoster(null)}/>}{action && <ConfirmDialog title={`${action.type === 'publish' ? 'Publish' : 'Archive'} ${action.offering.code}?`} confirmLabel={action.type === 'publish' ? 'Publish offering' : 'Archive offering'} onConfirm={perform} onClose={() => { if (!pending) setAction(null); }} pending={pending}>{action.type === 'publish' ? 'Students will see this offering. Enrollment follows its published window.' : 'Archived offerings stay in history. Current enrollments or waitlist requests must be cancelled first.'}{error && <span role="alert" className="action-error">{error}</span>}</ConfirmDialog>}</>;
}

function Reports() {
  const [page, setPage] = useState(1), [term, setTerm] = useState('');
  const collection = useCollection(`/admin/reports/enrollments?page=${page}&pageSize=10&term=${encodeURIComponent(term)}`), { result } = collection;
  return <><div className="management-heading"><div><h2>Enrollment reports</h2><p>Persisted counts by offering. Totals reflect the current request, including archived terms.</p></div></div><Field label="Filter by term" value={term} maxLength={40} onChange={event => { setPage(1); setTerm(event.target.value); }}/><CollectionState collection={collection} empty="No offerings match this term."><div className="table-scroll"><table><caption className="sr-only">Enrollment counts by offering</caption><thead><tr><th>Course / term</th><th>Capacity</th><th>Enrolled</th><th>Waitlisted</th><th>Cancelled</th></tr></thead><tbody>{result?.data.map(row => <tr key={row.id}><td><strong>{row.title}</strong><span className="table-detail">{row.code} · {row.term}</span></td><td>{row.capacity}</td><td>{row.activeCount}</td><td>{row.waitlistCount}</td><td>{row.cancelledCount}</td></tr>)}</tbody></table></div><Pagination {...result?.meta} onChange={setPage}/></CollectionState></>;
}

function Directory() {
  const [code, setCode] = useState(''), [preview, setPreview] = useState(null), [pending, setPending] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const lookup = async event => {
    event.preventDefault(); setPending(true); setPreview(null); setError(''); setNotice('');
    try { const result = await api(`/admin/directory/courses/${encodeURIComponent(code.trim())}`); setPreview(result.data.data); }
    catch (failure) { setError(failure.message); } finally { setPending(false); }
  };
  const importCourse = async () => {
    setPending(true); setError('');
    try { const result = await api('/admin/directory/import', { method: 'POST', body: { code: preview.code } }); setNotice(`${result.data.title} was saved to the course library. Create an offering there when you’re ready.`); }
    catch (failure) { setError(failure.message); } finally { setPending(false); }
  };
  return <><div className="management-heading"><div><h2>Course directory</h2><p>Look up metadata, review it, then choose whether to add it to the course library.</p></div></div><p className="page-intro">This project currently uses a separate local demonstration directory. Try EXT-DATA or EXT-WEB.</p><form className="directory-search" onSubmit={lookup}><Field label="Directory course code" disabled={pending} value={code} onChange={event => { setCode(event.target.value); setPreview(null); }} required maxLength={24}/><Button type="submit" disabled={pending}>{pending ? 'Please wait…' : 'Look up course'}</Button></form>{error && <Alert title="Directory unavailable" tone="error">{error}</Alert>}{notice && <Alert>{notice}</Alert>}{preview && <article className="about-panel directory-preview"><span className="eyebrow muted">{preview.code} · {preview.department}</span><h3>{preview.title}</h3><p>{preview.description}</p><p>{preview.credits} ECTS</p><Button disabled={pending} onClick={importCourse}>Import to course library</Button><p className="dialog-note">Import creates or updates course metadata. It does not publish an offering or change enrollment capacity.</p></article>}</>;
}

export function Admin() {
  return <section className="workspace-page"><span className="eyebrow muted">ADMINISTRATION</span><h1>A clear view of every course.</h1><p className="page-intro">Thoughtful choices for students start with well-managed offerings.</p><nav className="management-tabs" aria-label="Administration sections"><NavLink to="/admin/courses">Courses</NavLink><NavLink to="/admin/offerings">Offerings</NavLink><NavLink to="/admin/reports">Reports</NavLink><NavLink to="/admin/directory">Directory</NavLink></nav><Routes><Route index element={<Navigate to="courses" replace/>}/><Route path="courses" element={<Courses/>}/><Route path="offerings" element={<Offerings/>}/><Route path="reports" element={<Reports/>}/><Route path="directory" element={<Directory/>}/><Route path="*" element={<EmptyState title="Unknown administration page." action={<Link to="/admin/courses">Course library</Link>}/>}/></Routes></section>;
}
