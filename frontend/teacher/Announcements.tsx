import { useState } from "react";
import Icon from "../shared/Icon";
import { useData } from "../shared/store";
import { Empty, Field, Modal, Note, Panel } from "../shared/ui";
import { PageHead } from "./TeacherUI";
import { useScope } from "./TeacherApp";

export default function Announcements() {
  const { announcements, setAnnouncements, log, say } = useData();
  const scope = useScope();
  const [composing, setComposing] = useState(false);
  const [sectionId, setSectionId] = useState(scope.mySections[0]?.id ?? "");
  const sectionNames = new Set(scope.mySections.map(section => section.name));
  const mine = announcements.filter(item => sectionNames.has(item.audience));
  const school = announcements.filter(item => !sectionNames.has(item.audience));
  const selectedSection = scope.mySections.find(section => section.id === sectionId) ?? scope.mySections[0];

  return <div className="tc-page">
    <PageHead icon="announcements" eyebrow="Announcements" title="Keep families informed" actions={<button type="button" className="sa-primary" onClick={() => setComposing(true)} disabled={!scope.mySections.length}><Icon name="plus" />New announcement</button>}>
      Publish messages to the parents and learners connected to your assigned sections.
    </PageHead>

    <Panel title="Your section announcements" icon="announcements" note="Only parents linked to the selected section can read these messages." wide>
      {!mine.length ? <Empty text="You have not published an announcement for your sections yet." /> : <ul className="tc-notices">{mine.map(item => <li key={item.id}>
        <span className="tc-notice-icon"><Icon name="announcements" /></span>
        <div className="tc-notice-body"><div className="tc-notice-head"><strong>{item.title}</strong><span className="tc-audience">{item.audience}</span><small>{item.date}</small></div><p>{item.message}</p><div className="tc-notice-foot"><span><Icon name="users" />Parents and learners in this section</span><button type="button" className="sa-ghost sa-danger" onClick={() => { setAnnouncements(current => current.filter(row => row.id !== item.id)); log("Announcement withdrawn", `${item.title} · ${item.audience}`); say("Announcement withdrawn."); }}>Withdraw</button></div></div>
      </li>)}</ul>}
    </Panel>

    <Panel title="From the school" icon="bell" note="Read-only messages published by the administration." wide>
      {!school.length ? <Empty text="No school announcements right now." /> : <ul className="tc-notices">{school.map(item => <li key={item.id}><span className="tc-notice-icon"><Icon name="bell" /></span><div className="tc-notice-body"><div className="tc-notice-head"><strong>{item.title}</strong><span className="tc-audience">{item.audience}</span><small>{item.date}</small></div><p>{item.message}</p></div></li>)}</ul>}
    </Panel>

    {composing && <Modal title="New section announcement" note="Parents and learners in the selected section will see this message." onClose={() => setComposing(false)}>
      <form className="sa-form" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); const audience = selectedSection?.name ?? ""; const title = String(data.get("title") ?? "").trim(); const message = String(data.get("message") ?? "").trim(); if (!audience) return; setAnnouncements(current => [{ id: `an${Date.now()}`, title, message, audience, date: new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) }, ...current]); log("Section announcement published", `${title} · ${audience}`); say(`Published to ${audience}.`); setComposing(false); }}>
        <Field label="Section"><select value={sectionId} onChange={event => setSectionId(event.target.value)}>{scope.mySections.map(section => <option key={section.id} value={section.id}>{section.name}</option>)}</select></Field>
        <Field label="Title"><input name="title" required maxLength={120} placeholder="Announcement title" autoFocus /></Field>
        <Field label="Message" hint="Do not include student names, IDs, scores, or private information."><textarea name="message" required rows={5} maxLength={2000} placeholder="Write a short, useful message for families." /></Field>
        <Note>This is a one-way notice. Private chat and emergency alerts are not part of this release.</Note>
        <button type="submit" className="sa-primary">Publish announcement<Icon name="arrow" /></button>
      </form>
    </Modal>}
  </div>;
}