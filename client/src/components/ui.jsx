import { useEffect, useRef, useId } from "react";

const paths = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  book: "M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4zM13 7a3 3 0 0 1 3-3h5v15h-4a4 4 0 0 0-4 2",
  calendar: "M4 5h16v16H4zM8 2v6M16 2v6M4 11h16",
  arrow: "M5 12h14M13 6l6 6-6 6",
  chevron: "m9 5 7 7-7 7",
  search: "M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  check: "m5 12 4 4L20 5",
  close: "m6 6 12 12M18 6 6 18",
  bookmark: "M6 3h12v18l-6-4-6 4z",
  clock: "M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  globe: "M2 12h20M12 2c6 6 6 14 0 20-6-6-6-14 0-20M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  spark: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z",
  chart: "M4 20V10M12 20V4M20 20v-7",
  info: "M12 11v6M12 7v1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
};
export function Icon({ name, size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.book} /></svg>;
}
export function Button({ children, variant = "primary", className = "", ...props }) {
  return <button type="button" className={`button button-${variant} ${className}`} {...props}>{children}</button>;
}
export function Alert({ children, title, tone = "info", action }) {
  return <div className={`alert alert-${tone}`} role={tone === "error" ? "alert" : "status"}><Icon name="info" /><div>{title && <strong>{title}</strong>}<span>{children}</span></div>{action}</div>;
}
export function EmptyState({ title, children, action, icon = "book" }) {
  return <div className="empty-state"><div className="empty-icon"><Icon name={icon} size={28}/></div><h2>{title}</h2><p>{children}</p>{action}</div>;
}
export function Pagination({ page, total, pageSize, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <nav className="pagination" aria-label="Course pages"><span>{total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}` : "0 courses"}</span><div><Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</Button><span aria-live="polite">Page {page} of {pages}</span><Button variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next <Icon name="chevron" size={15}/></Button></div></nav>;
}
export function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  // Capture before React's autoFocus moves focus into the dialog. Native focus
  // restoration alone is unreliable when Escape unmounts a controlled dialog.
  const openedFrom = useRef(document.activeElement);
  useEffect(() => {
    const dialog = ref.current; dialog.showModal();
    return () => {
      dialog.close();
      const target = openedFrom.current?.isConnected ? openedFrom.current : document.getElementById('main');
      target?.focus();
    };
  }, []);
  return <dialog ref={ref} className="modal" aria-labelledby="dialog-title" onClose={onClose} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === ref.current) onClose(); }}><div className="modal-heading"><h2 id="dialog-title">{title}</h2><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose} autoFocus><Icon name="close"/></button></div>{children}</dialog>;
}

export function Field({ label, error, ...props }) {
  const generatedId = useId();
  const id = props.id || generatedId;
  return <label htmlFor={id}>{label}<input {...props} id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined}/>{error && <span id={`${id}-error`} role="alert">{error}</span>}</label>;
}
export function SelectField({ label, className = "", children, ...props }) {
  return <label className={`select-field ${className}`}><span className="sr-only">{label}</span><select {...props}>{children}</select></label>;
}
export function StatusBadge({ children, className = "tag" }) {
  return <span className={className}>{children}</span>;
}
export function Loading({ children = "Loading…" }) {
  return <span role="status" aria-live="polite">{children}</span>;
}
export function ConfirmDialog({ title, children, confirmLabel, onConfirm, onClose, pending = false }) {
  return <Modal title={title} onClose={onClose}><p>{children}</p><div className="dialog-actions"><Button variant="secondary" onClick={onClose} disabled={pending}>Cancel</Button><Button onClick={onConfirm} disabled={pending}>{pending ? "Please wait…" : confirmLabel}</Button></div></Modal>;
}
