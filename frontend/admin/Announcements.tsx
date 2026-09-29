import { useState } from "react";
import Icon from "../shared/Icon";
import type { GuardianLink, Section, User } from "../shared/demo";
import { useData } from "../shared/store";
import { Empty, Field, Modal, Note, Panel } from "../shared/ui";
import "./announcements.css";

type Group = { id: string; label: string; icon: string; tint: string; note: string };

/** Who an announcement can go to. Students receive theirs on the mobile app. */
const GROUPS: Group[] = [
  { id: "Everyone", label: "Everyone", icon: "users", tint: "coral", note: "Teachers, parents, and kids" },
  { id: "teachers", label: "Teachers", icon: "person", tint: "mint", note: "Teachers who run a section" },
  { id: "parents", label: "Parents", icon: "consent", tint: "lilac", note: "Parents whose link is confirmed" },
  { id: "students", label: "Students", icon: "graduation", tint: "blue", note: "Kids, in their app" },
  { id: "adults", label: "Adults", icon: "mail", tint: "yellow", note: "Grown-ups only, no kids" },
];


function audienceLabel(group: string, scope: string) {
  const name = group === "Everyone" ? "everyone" : group;
  return scope === "Whole school"
    ? (group === "Everyone" ? "Everyone" : `All ${name}`)
    : `${scope} · ${name}`;
}

/** Parse a stored audience string back into the group it targets. */
function groupOf(audience: string): Group {
  const text = audience.toLowerCase();
  if (text.includes("everyone")) return GROUPS[0];
  if (text.includes("teacher")) return GROUPS[1];
  if (text.includes("parent")) return GROUPS[2];
  if (text.includes("student")) return GROUPS[3];
  return GROUPS[4];
}

/**
 * Real recipient count for an audience. Adults have no section of their own, so a
 * grade-scoped message reaches the teachers assigned to that grade and the guardians
 * verified against a learner in it.
 */
function reach(audience: string, users: User[], sections: Section[], links: GuardianLink[]) {
  const grade = audience.match(/Grade (\d+)/)?.[1];
  const gradeSections = sections.filter(section => !grade || section.grade === grade);
  const ids = new Set(gradeSections.map(section => section.id));
  const group = groupOf(audience).id;
  const wants = (role: User["role"]) =>
    group === "Everyone" ? role !== "Super Admin"
      : group === "adults" ? role === "Teacher" || role === "Parent"
      : group === "teachers" ? role === "Teacher"
      : group === "parents" ? role === "Parent"
      : role === "Student";

  return users.filter(user => {
    if (user.status !== "Active" || !wants(user.role)) return false;
    if (!grade) return true;
    if (user.role === "Student") return ids.has(user.section);
    if (user.role === "Teacher") return gradeSections.some(section => section.teacherId === user.id);
    return links.some(link => link.parentId === user.id && link.status === "Active"
      && ids.has(users.find(child => child.id === link.studentId)?.section ?? ""));
  }).length;
}

export default function Announcements() {
  const { announcements, setAnnouncements, users, sections, links, log, say } = useData();
  const [composing, setComposing] = useState(false);
  const [filter, setFilter] = useState("All");
  const [group, setGroup] = useState("teachers");
  const [scope, setScope] = useState("Whole school");

  const SCOPES = ["Whole school", ...new Set(sections.map(section => `Grade ${section.grade}`))];
  const shown = announcements.filter(item => filter === "All" || groupOf(item.audience).id === filter);
  const draftAudience = audienceLabel(group, scope);
  const draftReach = reach(draftAudience, users, sections, links);
  const chosen = GROUPS.find(item => item.id === group) ?? GROUPS[0];
  const countFor = (id: string) => announcements.filter(item => groupOf(item.audience).id === id).length;

  return <div className="ann-page">
    <header className="ann-intro">
      <div>
        <h2>Announcements</h2>
        <p>Send a message to the people who need it. Every message goes to real accounts, so pick the smallest group that gets the job done. Practice emergency drills are set up in Settings — never start one from here.</p>
      </div>
      <button type="button" className="sa-primary" onClick={() => setComposing(true)}><Icon name="plus" />New announcement</button>
    </header>

    <nav className="ann-filters" aria-label="Filter by audience">
      <button type="button" aria-current={filter === "All" ? "page" : undefined} onClick={() => setFilter("All")}>All<small>{announcements.length}</small></button>
      {GROUPS.map(item => <button type="button" key={item.id} aria-current={filter === item.id ? "page" : undefined} onClick={() => setFilter(item.id)}>
        <span className={`ann-dot tint-${item.tint}`} />{item.label}<small>{countFor(item.id)}</small>
      </button>)}
    </nav>

    <Panel title="Published announcements" icon="announcements" note="Withdrawing a message hides it from the app. It cannot pull back a notification that already reached someone’s phone." wide>
      {!shown.length ? <Empty text={filter === "All" ? "No announcements published yet." : "No announcements for this audience yet."} /> : <ul className="ann-list">
        {shown.map(item => {
          const target = groupOf(item.audience);
          return <li key={item.id} className={`tint-${target.tint}`}>
            <span className="ann-icon"><Icon name={target.icon} /></span>
            <div className="ann-body">
              <div className="ann-head">
                <strong>{item.title}</strong>
                <span className="ann-audience">{item.audience}</span>
                <small>{item.date}</small>
              </div>
              <p>{item.message}</p>
              <div className="ann-foot">
                <span><Icon name="users" />Sent to {reach(item.audience, users, sections, links)} account{reach(item.audience, users, sections, links) === 1 ? "" : "s"}</span>
                {target.id === "students" && <span className="ann-child-flag"><Icon name="bell" />Kids can read this</span>}
                <button type="button" className="sa-ghost sa-danger" onClick={() => { setAnnouncements(current => current.filter(row => row.id !== item.id)); log("Announcement withdrawn", `${item.title} · ${item.audience}`); say("Announcement withdrawn."); }}>Withdraw</button>
              </div>
            </div>
          </li>;
        })}
      </ul>}
    </Panel>

    <Note>A notification on a phone only says that something is waiting. To read the message itself, a person has to sign in.</Note>

    {composing && <Modal title="New announcement" note="Pick who gets it, then write it. The count updates as you change the audience." onClose={() => setComposing(false)}>
      <form className="sa-form ann-form" onSubmit={event => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const title = String(data.get("title"));
        setAnnouncements(current => [{ id: `an${Date.now()}`, title, message: String(data.get("message")), audience: draftAudience, date: new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) }, ...current]);
        log("Announcement published", `${title} · ${draftAudience} · ${draftReach} accounts`);
        say(`Announcement published to ${draftAudience.toLowerCase()} — ${draftReach} active accounts.`);
        setComposing(false);
      }}>
        <div className="ann-who">
          <p className="ann-step">Step 1 · Who gets this?</p>
          <div className="sa-form-pair">
            <Field label="Send to">
              <select value={group} onChange={event => setGroup(event.target.value)}>
                {GROUPS.map(item => <option key={item.id} value={item.id}>{item.label} — {item.note.toLowerCase()}</option>)}
              </select>
            </Field>
            <Field label="Grade level">
              <select value={scope} onChange={event => setScope(event.target.value)}>{SCOPES.map(item => <option key={item}>{item}</option>)}</select>
            </Field>
          </div>
          <p className="ann-estimate">
            <span className={`ann-icon tint-${chosen.tint}`}><Icon name={chosen.icon} /></span>
            <span>Goes to <strong>{draftReach}</strong> account{draftReach === 1 ? "" : "s"}<small>{draftAudience}{scope === "Whole school" ? "" : " · that grade's learners, their teachers, and their verified parents"}</small></span>
          </p>
        </div>

        <p className="ann-step">Step 2 · What does it say?</p>
        <Field label="Title"><input name="title" required placeholder="What is this about?" /></Field>
        <Field label="Message" hint="Never put a student's name, score, or ID in an announcement — anyone in the audience can read it."><textarea name="message" required rows={4} placeholder="Keep it short and actionable." /></Field>
        {(group === "students" || group === "Everyone") && <Note>This reaches children in the mobile app. Keep the words simple, never ask a child for personal information, and never use an announcement to start a practice emergency.</Note>}
        <button type="submit" className="sa-primary" disabled={!draftReach}>{draftReach ? "Publish announcement" : "Nobody is in this audience"}<Icon name="arrow" /></button>
      </form>
    </Modal>}
  </div>;
}
