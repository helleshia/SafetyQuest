import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "../shared/Icon";

export type AcademicAction = { label: string; icon: string; onSelect: () => void; disabled?: boolean; danger?: boolean };

export default function AcademicActionMenu({ label, actions }: { label: string; actions: AcademicAction[] }) {
  const menuId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const lastFirst = useRef(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  function close(restoreFocus = false) { setOpen(false); if (restoreFocus) trigger.current?.focus(); }
  function show(last = false) {
    lastFirst.current = last;
    const rect = trigger.current?.getBoundingClientRect(); if (!rect) return;
    setPosition({ top: rect.bottom + 7, left: Math.max(8, Math.min(rect.right - 216, window.innerWidth - 224)) });
    window.dispatchEvent(new CustomEvent("academic-action-menu-open", { detail: menuId }));
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const rect = trigger.current?.getBoundingClientRect();
    const height = menu.current?.getBoundingClientRect().height ?? 0;
    if (rect) setPosition({ top: Math.max(8, Math.min(rect.bottom + 7, window.innerHeight - height - 8)), left: Math.max(8, Math.min(rect.right - 216, window.innerWidth - 224)) });
    const enabled = menu.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
    if (enabled?.length) enabled[lastFirst.current ? enabled.length - 1 : 0].focus();
    const outside = (event: PointerEvent) => { if (!trigger.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node)) close(); };
    const another = (event: Event) => { if ((event as CustomEvent).detail !== menuId) close(); };
    const dismiss = (event: Event) => { if (event.type === "scroll" && event.target instanceof Node && menu.current?.contains(event.target)) return; close(); };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("academic-action-menu-open", another);
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", dismiss, true);
    return () => { document.removeEventListener("pointerdown", outside); window.removeEventListener("academic-action-menu-open", another); window.removeEventListener("resize", dismiss); window.removeEventListener("scroll", dismiss, true); };
  }, [open, menuId]);

  return <>
    <button ref={trigger} type="button" className="academic-more-button" title={`More actions for ${label}`} aria-label={`More actions for ${label}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => open ? close() : show()} onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); show(event.key === "ArrowUp"); } }}><Icon name="more" /></button>
    {open && createPortal(<div ref={menu} id={menuId} className="academic-action-menu" role="menu" aria-label={`Actions for ${label}`} style={position} onKeyDown={event => {
      const enabled = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
      const index = enabled.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === "Escape") { event.preventDefault(); close(true); }
      else if (event.key === "Tab") close(true);
      else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length;
        enabled[next]?.focus();
      }
    }}><div className="academic-menu-caption" role="presentation">Manage record</div>{actions.map(action => <button key={action.label} type="button" role="menuitem" disabled={action.disabled} className={action.danger ? "is-danger" : ""} onClick={() => { close(true); action.onSelect(); }}><Icon name={action.icon} /><span>{action.label}</span></button>)}</div>, document.body)}
  </>;
}
