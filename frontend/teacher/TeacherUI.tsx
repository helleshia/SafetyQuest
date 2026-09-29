import type { ReactNode } from "react";
import Icon from "../shared/Icon";

/** Page header card. Same shape as the Super Admin intro headers: one icon tile,
    a title, a sentence that says what the page is for, and an optional action slot. */
export function PageHead({ icon, eyebrow, title, mono = false, actions, children }: {
  icon: string;
  eyebrow?: string;
  title: string;
  mono?: boolean;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return <header className="tc-head">
    <span className="tc-head-icon"><Icon name={icon} /></span>
    <div className="tc-head-text">
      {eyebrow && <p className="tc-eyebrow">{eyebrow}</p>}
      <h2 className={mono ? "sa-mono" : ""}>{title}</h2>
      {children && <p>{children}</p>}
    </div>
    {actions && <div className="tc-head-actions">{actions}</div>}
  </header>;
}

/** Headline number card. `sub` is the quieter half of the figure, as in "12 of 36". */
export function Metric({ icon, tint = "coral", label, value, sub, word = false, flag = false, children }: {
  icon: string;
  tint?: "coral" | "mint" | "lilac" | "yellow" | "blue";
  label: string;
  value: ReactNode;
  sub?: string;
  word?: boolean;
  flag?: boolean;
  children?: ReactNode;
}) {
  return <article className={`tc-metric ${flag ? "is-flag" : ""}`}>
    <header><span className={`tc-metric-icon tint-${flag ? "yellow" : tint}`}><Icon name={icon} /></span><h3>{label}</h3></header>
    <b className={word ? "is-word" : ""}>{value}{sub && <i> {sub}</i>}</b>
    {children && <p>{children}</p>}
  </article>;
}
