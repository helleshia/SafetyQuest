import { useEffect, useId, useRef, useState } from "react";
import Icon from "./Icon";
import "./notifications.css";

export type NotificationItem = { id: string; title: string; detail: string; icon: string; page: string };

export default function Notifications({ items, accountId, go }: { items: NotificationItem[]; accountId: string; go: (page: string) => void }) {
  const [open, setOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const storageKey = `safetyquest.notifications.read.${accountId}`;
  const [read, setRead] = useState<string[]>(() => {
    try { const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]"); return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : []; } catch { return []; }
  });
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const unread = items.filter(item => !read.includes(item.id));
  const visible = unreadOnly ? unread : items;
  const markRead = (ids: string[]) => {
    setRead(previous => {
      const next = [...new Set([...previous, ...ids])];
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Reading still works when storage is unavailable. */ }
      return next;
    });
  };
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);

  return <div className="sq-notifications" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} type="button" className="sa-icon-button" aria-label={`Notifications, ${unread.length} unread`} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)}><Icon name="bell" />{unread.length > 0 && <i />}</button>
    {open && <section id={panelId} className="sq-notification-panel" aria-label="Notifications">
      <div className="sq-notification-heading"><div><h2>Notifications <span>{unread.length}</span></h2><p>Stay up to date with your workspace.</p></div><button type="button" className="sa-icon-button" aria-label="Close notifications" onClick={() => { setOpen(false); trigger.current?.focus(); }}><Icon name="close" /></button></div>
      <div className="sq-notification-tools"><div><button type="button" aria-pressed={!unreadOnly} onClick={() => setUnreadOnly(false)}>All</button><button type="button" aria-pressed={unreadOnly} onClick={() => setUnreadOnly(true)}>Unread ({unread.length})</button></div><button type="button" disabled={!unread.length} onClick={() => markRead(items.map(item => item.id))}>Mark all as read</button></div>
      <div className="sq-notification-list">{visible.length ? visible.map(item => <button type="button" key={item.id} className={`sq-notification-item ${read.includes(item.id) ? "" : "is-unread"}`} onClick={() => { markRead([item.id]); setOpen(false); trigger.current?.focus(); go(item.page); }}><span className="sq-notification-icon"><Icon name={item.icon} /></span><span><strong>{item.title}</strong><small>{item.detail}</small><em>Open workspace <Icon name="arrow" /></em></span>{!read.includes(item.id) && <b aria-label="Unread" />}</button>) : <div className="sq-notification-empty"><Icon name="check" /><strong>You're all caught up</strong><p>{unreadOnly ? "No unread notifications." : "No pending items need your attention."}</p></div>}</div>
      <div className="sq-notification-footer">Notifications reflect current workspace activity.</div>
    </section>}
  </div>;
}
