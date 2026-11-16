import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, EmptyState, Icon, Modal, Pagination, SelectField } from "../../components/ui.jsx";
import { previewCourses } from "./preview-courses.js";

const pageSize = 3;
export function Catalog() {
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const [saved, setSaved] = useState([]);
  const query = params.get("q") || "";
  const department = params.get("department") || "All subjects";
  const sort = params.get("sort") === "credits" ? "credits" : "title";
  const filtered = previewCourses.filter(c => (department === "All subjects" || c.department === department) && `${c.title} ${c.code}`.toLowerCase().includes(query.toLowerCase()));
  filtered.sort((a, b) => sort === "credits" ? b.credits - a.credits || a.title.localeCompare(b.title) : a.title.localeCompare(b.title));
  const requestedPage = Number(params.get("page") || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, Math.max(1, Math.ceil(filtered.length / pageSize))) : 1;
  const update = (key, value) => setParams(current => {
    const next = new URLSearchParams(current);
    if (value) next.set(key, String(value)); else next.delete(key);
    if (key !== "page") next.delete("page");
    return next;
  }, { replace: true });
  const toggleSaved = id => setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  return <>
    <section className="hero"><div className="hero-copy"><span className="eyebrow"><span className="tiny-star">✳</span> A LITTLE CURIOSITY GOES A LONG WAY</span><h1>Make room for<br/><em>what’s next.</em></h1><p>Explore new ideas. Find your interests.<br/>Build a semester that feels like you.</p><a className="hero-link" href="#course-search">Find your next elective <Icon name="arrow" size={18}/></a></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="art-note art-note-one"><Icon name="book" size={27}/><span>Room to<br/><strong>discover.</strong></span></div><div className="art-stamp">YOUR<br/>NEXT<br/><span>CHAPTER ↗</span></div><div className="art-dot"/><div className="art-note art-note-two"><Icon name="spark" size={24}/><span>Follow your curiosity</span></div></div></section>
    <div className="section-heading"><div><span className="eyebrow muted">THE COURSE EXPLORER</span><h2>Find a different perspective.</h2></div><span className="sample-label">Sample catalog <span>·</span> {previewCourses.length} electives</span></div>
    <div className="catalog-toolbar" id="course-search"><label className="search-field"><Icon name="search"/><span className="sr-only">Search courses</span><input value={query} onChange={event => update("q", event.target.value)} placeholder="Search a subject, idea or course code…" /></label><SelectField label="Subject" value={department} onChange={event => update("department", event.target.value)}>{["All subjects", ...new Set(previewCourses.map(c => c.department))].map(d => <option key={d}>{d}</option>)}</SelectField><SelectField label="Sort courses" className="sort-field" value={sort} onChange={event => update("sort", event.target.value)}><option value="title">Title: A–Z</option><option value="credits">Most credits</option></SelectField></div>
    <div className="catalog-note"><span><Icon name="info" size={15}/> A preview of the experience. Course details are illustrative; enrollment is not open.</span><span aria-live="polite">{saved.length ? `${saved.length} saved in this preview` : "Explore at your own pace"}</span></div>
    {filtered.length ? <div className="course-grid">{filtered.slice((page - 1) * pageSize, page * pageSize).map(course => <article className="course-card" key={course.id}><div className={`course-cover ${course.theme}`}><span className="course-code">{course.code}</span><Icon name={course.icon} size={65}/><button type="button" className={`save-button ${saved.includes(course.id) ? "saved" : ""}`} aria-label={`${saved.includes(course.id) ? "Unsave" : "Save"} ${course.title}`} aria-pressed={saved.includes(course.id)} onClick={() => toggleSaved(course.id)}><Icon name="bookmark" size={18}/></button><span className="cover-word">{course.department.split(" ")[0].toLowerCase()}<span>↗</span></span></div><div className="course-content"><span className="course-department">{course.department}</span><h3>{course.title}</h3><p>{course.description}</p><div className="course-meta"><span><Icon name="book" size={15}/>{course.credits} ECTS</span><span><Icon name="clock" size={15}/>{course.format}</span></div><Button variant="text" onClick={() => setSelected(course)}>Explore course <Icon name="arrow" size={18}/></Button></div></article>)}</div> : <EmptyState title="Nothing here just yet." action={<Button variant="secondary" onClick={() => setParams({})}>Clear filters</Button>}>Try a different keyword or explore another subject.</EmptyState>}
    <Pagination page={page} total={filtered.length} pageSize={pageSize} onChange={value => update("page", value)}/>
    <section className="bottom-note"><div className="bottom-note-icon"><Icon name="spark" size={25}/></div><div><h3>Your interests don’t have to fit in one box.</h3><p>Sometimes the course outside your comfort zone is the one that stays with you.</p></div><span className="hand-arrow" aria-hidden="true">↗</span></section>
    {selected && <Modal title={selected.title} onClose={() => setSelected(null)}><span className="tag">{selected.code} · {selected.department}</span><p>{selected.description}</p><div className="tags">{selected.tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div><p className="dialog-note">This is an illustrative offering in the Electiva preview. Enrollment, real availability and student accounts arrive in the next milestone.</p><Button disabled>Enrollment not yet available</Button></Modal>}
  </>;
}
