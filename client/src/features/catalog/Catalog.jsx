import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Button, EmptyState, Icon, Loading, Modal, Pagination, SelectField } from '../../components/ui.jsx';
import { useCollection } from '../../app/useCollection.js';
import { api } from '../../app/api.js';
import { useSession } from '../../app/Session.jsx';

export function Catalog() {
  const { user } = useSession();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState(null), [pending, setPending] = useState(false), [notice, setNotice] = useState(''), [actionError, setActionError] = useState('');
  const query = params.get('q') || '', department = params.get('department') || '', sort = params.get('sort') || 'title';
  const search = new URLSearchParams(params); search.set('pageSize', '6');
  const { result, loading, error, refresh } = useCollection('/offerings?' + search.toString());
  const { result: facets } = useCollection('/offerings/facets');
  const update = (key, value) => setParams(current => {
    const next = new URLSearchParams(current);
    if (value) next.set(key, String(value)); else next.delete(key);
    if (key !== 'page') next.delete('page');
    return next;
  }, { replace: true });
  const enroll = async () => {
    setPending(true); setActionError(''); setNotice('');
    try {
      const response = await api(`/offerings/${selected.id}/enrollments`, { method: 'POST', body: {} });
      setNotice(response.data.status === 'ACTIVE' ? 'You’re enrolled. Your place is saved.' : 'You’re on the waitlist. The next available seat goes to the oldest request.');
      refresh();
    } catch (failure) { setActionError(failure.message); } finally { setPending(false); }
  };
  return <>
    <section className="hero"><div className="hero-copy"><span className="eyebrow"><span className="tiny-star">✳</span> A LITTLE CURIOSITY GOES A LONG WAY</span><h1>Make room for<br/><em>what’s next.</em></h1><p>Explore new ideas. Find your interests.<br/>Build a semester that feels like you.</p><a className="hero-link" href="#course-search">Find your next elective <Icon name="arrow" size={18}/></a></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="art-note art-note-one"><Icon name="book" size={27}/><span>Room to<br/><strong>discover.</strong></span></div><div className="art-stamp">YOUR<br/>NEXT<br/><span>CHAPTER ↗</span></div><div className="art-dot"/><div className="art-note art-note-two"><Icon name="spark" size={24}/><span>Follow your curiosity</span></div></div></section>
    <div className="section-heading"><div><span className="eyebrow muted">THE COURSE EXPLORER</span><h2>Find a different perspective.</h2></div><span className="sample-label">Published offerings {result ? `· ${result.meta.total}` : ''}</span></div>
    <div className="catalog-toolbar" id="course-search"><label className="search-field"><Icon name="search"/><span className="sr-only">Search courses</span><input value={query} maxLength={200} onChange={event => update('q', event.target.value)} placeholder="Search a subject, idea or course code…"/></label><SelectField label="Subject" value={department} onChange={event => update('department', event.target.value)}><option value="">All subjects</option>{(facets?.data.departments || []).map(item => <option key={item}>{item}</option>)}</SelectField><SelectField label="Sort courses" className="sort-field" value={sort} onChange={event => update('sort', event.target.value)}><option value="title">Title: A–Z</option><option value="code">Course code</option><option value="opensAt">Opening date</option></SelectField></div>
    <div className="catalog-note"><span><Icon name="info" size={15}/> Availability can change. Your place is confirmed when the server saves your request.</span><Link to="/my-enrollments">View my enrollments</Link></div>
    {error && <Alert tone="error" title="Couldn’t load courses" action={<Button onClick={refresh}>Retry</Button>}>{error}</Alert>}
    {loading && <div className="loading-panel"><Loading>Finding your next elective…</Loading></div>}
    {result && (result.data.length ? <><div className="course-grid">{result.data.map((course, index) => <article className="course-card" key={course.id}><div className={`course-cover ${['mint', 'lilac', 'peach', 'sand'][index % 4]}`}><span className="course-code">{course.code}</span><Icon name={index % 2 ? 'book' : 'chart'} size={65}/><span className="cover-word">{course.department.split(' ')[0].toLowerCase()}<span>↗</span></span></div><div className="course-content"><span className="course-department">{course.department}</span><h3>{course.title}</h3><p>{course.description}</p><div className="course-meta"><span><Icon name="book" size={15}/>{course.credits} ECTS</span><span>{course.enrollmentOpen ? `${course.availableSeats} seats available` : 'Window closed'}</span></div><Button variant="text" onClick={() => { setSelected(course); setNotice(''); setActionError(''); }}>Explore course <Icon name="arrow" size={18}/></Button></div></article>)}</div><Pagination {...result.meta} onChange={value => update('page', value)}/></> : <EmptyState title="Nothing here just yet." action={<Button variant="secondary" onClick={() => setParams({})}>Clear filters</Button>}>Try a different keyword or explore another subject.</EmptyState>)}
    <section className="bottom-note"><div className="bottom-note-icon"><Icon name="spark" size={25}/></div><div><h3>Your interests don’t have to fit in one box.</h3><p>Sometimes the course outside your comfort zone is the one that stays with you.</p></div><span className="hand-arrow" aria-hidden="true">↗</span></section>
    {selected && <Modal title={selected.title} onClose={() => { if (!pending) setSelected(null); }}><span className="tag">{selected.code} · {selected.department}</span><p>{selected.description}</p><dl className="course-facts"><div><dt>Credits</dt><dd>{selected.credits} ECTS</dd></div><div><dt>Term</dt><dd>{selected.term}</dd></div><div><dt>Seats available</dt><dd>{selected.availableSeats} of {selected.capacity}</dd></div><div><dt>Waitlist</dt><dd>{selected.waitlistCount} students</dd></div><div><dt>Opens</dt><dd>{new Date(selected.opensAt).toLocaleString()}</dd></div><div><dt>Closes</dt><dd>{new Date(selected.closesAt).toLocaleString()}</dd></div></dl>{actionError && <Alert tone="error">{actionError}</Alert>}{notice ? <Alert action={<Link to="/my-enrollments">See my enrollments</Link>}>{notice}</Alert> : <><p className="dialog-note">{selected.enrollmentOpen ? selected.availableSeats ? 'Request a place while the enrollment window is open.' : 'This course is full. Join the queue and you’ll be promoted automatically if a seat opens during the enrollment window.' : 'Enrollment is available only during the published window.'}</p><Button disabled={pending || !selected.enrollmentOpen || user.role !== 'student'} onClick={enroll}>{pending ? 'Saving your request…' : user.role !== 'student' ? 'Student accounts can enroll' : selected.availableSeats ? 'Enroll in this course' : 'Join the waitlist'}</Button></>}</Modal>}
  </>;
}
