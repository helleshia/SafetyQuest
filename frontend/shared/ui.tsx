import { useEffect, type ReactNode } from "react";
import Icon from "./Icon";

export function Panel({ title, note, action, icon, wide = false, children }: { title: string; note?: string; action?: ReactNode; icon?: string; wide?: boolean; children: ReactNode }) {
  return <section className={`sa-panel ${wide ? "sa-panel-wide" : ""}`}>
    <header className="sa-panel-head">
      <div><h2>{icon && <span className="sa-panel-title-icon"><Icon name={icon} /></span>}{title}</h2>{note && <p>{note}</p>}</div>
      {action}
    </header>
    {children}
  </section>;
}

export function Stat({ label, value, note, tone = "" }: { label: string; value: ReactNode; note?: string; tone?: string }) {
  return <div className={`sa-stat ${tone}`}><small>{label}</small><strong>{value}</strong>{note && <span>{note}</span>}</div>;
}

const TONES: Record<string, string> = {
  Active: "ok", Published: "ok", Complete: "ok", Approved: "ok", Verified: "ok",
  Pending: "warn", "In review": "warn", "Awaiting review": "warn", Submitted: "warn", Interrupted: "warn", "Reviewed draft": "warn",
  Suspended: "bad", Revoked: "bad", Deactivated: "bad", Expired: "bad", "Changes requested": "bad",
};
export function Pill({ children }: { children: string }) {
  return <span className={`sa-pill sa-pill-${TONES[children] ?? "neutral"}`}>{children}</span>;
}

export function Bar({ label, value, total, tint = "coral" }: { label: string; value: number; total: number; tint?: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return <div className="sa-bar">
    <span className="sa-bar-label">{label}</span>
    <span className="sa-bar-track"><i className={`sa-bar-fill tint-${tint}`} style={{ width: `${pct}%` }} /></span>
    <span className="sa-bar-value">{pct}%<small>{value}/{total}</small></span>
  </div>;
}

export function Empty({ text }: { text: string }) {
  return <p className="sa-empty">{text}</p>;
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="sa-toolbar">{children}</div>;
}

export function Search({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="sa-search">
    <Icon name="search" />
    <input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} type="search" />
  </label>;
}

export function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="sa-select">
    <span>{label}</span>
    <select value={value} onChange={event => onChange(event.target.value)}>{options.map(option => <option key={option}>{option}</option>)}</select>
    <Icon name="down" />
  </label>;
}

export function Pager({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (page: number) => void }) {
  if (pages <= 1) return <p className="sa-pager-note">{total} record{total === 1 ? "" : "s"}</p>;
  return <div className="sa-pager">
    <span>{total} records · page {page + 1} of {pages}</span>
    <div>
      <button type="button" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</button>
      <button type="button" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  </div>;
}

export function Modal({ title, note, onClose, children }: { title: string; note?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return <div className="sa-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="sa-modal" role="dialog" aria-modal="true" aria-label={title}>
      <header><div><h2>{title}</h2>{note && <p>{note}</p>}</div><button type="button" onClick={onClose} aria-label="Close"><Icon name="close" /></button></header>
      <div className="sa-modal-body">{children}</div>
    </div>
  </div>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="sa-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="sa-note">{children}</p>;
}
