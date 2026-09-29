import { useState } from "react";
import Icon from "../shared/Icon";
import { useData } from "../shared/store";
import { Empty, Note, Panel, Pill, Select } from "../shared/ui";
import "./governance.css";

export default function Consent() {
  const store = useData();
  const { users, links, sections, setLinks, settings, log, say } = store;
  const [state, setState] = useState("All");
  const students = users.filter(user => user.role === "Student");
  const signed = students.filter(student => student.consent).length;
  const agreed = students.filter(student => student.assent).length;
  const waiting = links.filter(link => link.status === "Pending").length;
  const rows = links.filter(link => state === "All" || link.status === state);

  return <div className="gov-page">
    <header className="gov-intro">
      <span className="gov-intro-icon"><Icon name="consent" /></span>
      <div>
        <h2>Permission &amp; parent accounts</h2>
        <p>Two separate things live on this page. <strong>Permission</strong> is whether a child is allowed to take part at all. <strong>Parent accounts</strong> is whether a specific grown-up is allowed to see a specific child&rsquo;s progress. A child can have permission without any parent being connected, and connecting a parent is never automatic.</p>
      </div>
    </header>

    <div className="gov-cards">
      <article className="gov-card">
        <header><span className="gov-card-icon tint-mint"><Icon name="check" /></span><h3>Signed permission forms</h3></header>
        <b>{signed}<i> of {students.length}</i></b>
        <p>A parent signed a paper form saying their child may join. The teacher collects it by hand and ticks it off here. {settings.noticeVersion} was the version they signed.</p>
      </article>
      <article className="gov-card">
        <header><span className="gov-card-icon tint-lilac"><Icon name="person" /></span><h3>Children who said yes themselves</h3></header>
        <b>{agreed}<i> of {students.length}</i></b>
        <p>The child tapped &ldquo;yes&rdquo; in the app on their own. This is separate from the parent&rsquo;s form — a child can decline even when their parent signed, and that choice is respected.</p>
      </article>
      <article className={`gov-card ${waiting ? "is-flag" : ""}`}>
        <header><span className={`gov-card-icon ${waiting ? "tint-yellow" : "tint-mint"}`}><Icon name={waiting ? "bell" : "check"} /></span><h3>Parents waiting to be connected</h3></header>
        <b>{waiting}</b>
        <p>{waiting ? "Someone asked to see a child's progress. Nobody sees anything until the child's teacher confirms in person that this is really the parent." : "Nobody is waiting. Every request has been confirmed or turned down."}</p>
      </article>
    </div>

    <Panel title="Who can see which child" icon="users" note="One row per request. A parent only sees the children listed here — nothing else in the school." wide
      action={<Select label="Show" value={state} options={["All", "Active", "Pending", "Revoked"]} onChange={setState} />}>
      {!rows.length ? <Empty text="No requests in this state." /> : <div className="gov-table-scroll"><table className="sa-table gov-link-table">
        <thead><tr><th>Grown-up asking</th><th>Child</th><th>Class</th><th>Can they see the child?</th><th>Who confirmed it</th><th /></tr></thead>
        <tbody>{rows.map(link => {
          const student = users.find(user => user.id === link.studentId);
          const teacher = store.nameOf(sections.find(section => section.id === student?.section)?.teacherId ?? "");
          return <tr key={link.id}>
            <td><strong>{store.nameOf(link.parentId)}</strong><small className="sa-cell-sub">{users.find(user => user.id === link.parentId)?.email}</small></td>
            <td className="sa-mono">{store.nameOf(link.studentId)}</td>
            <td>{store.sectionOf(student?.section ?? "")}</td>
            <td><Pill>{link.status === "Active" ? "Yes" : link.status === "Pending" ? "Not yet" : "No longer"}</Pill></td>
            <td>{link.verifiedBy || <span className="sa-dim">Waiting for {teacher || "the class teacher"}</span>}</td>
            <td className="sa-cell-actions">
              {link.status === "Pending" && <button type="button" className="sa-ghost" onClick={() => { setLinks(current => current.map(row => (row.id === link.id ? { ...row, status: "Active", verifiedBy: teacher } : row))); log("Guardian link activated", `${store.nameOf(link.parentId)} · ${store.nameOf(link.studentId)} · verified by ${teacher}`); say("Connected. The parent can now see this child's progress."); }}><Icon name="check" />Teacher confirmed it</button>}
              {link.status !== "Revoked" && <button type="button" className="sa-ghost sa-danger" onClick={() => { setLinks(current => current.map(row => (row.id === link.id ? { ...row, status: "Revoked" } : row))); log("Guardian link revoked", `${store.nameOf(link.parentId)} · ${store.nameOf(link.studentId)}`); say("Access removed. The child's records are untouched."); }}>Remove access</button>}
            </td>
          </tr>;
        })}</tbody>
      </table></div>}
    </Panel>

    <Panel title="Why a teacher has to confirm in person" icon="bell" note="These are the things people assume prove someone is a parent. None of them do." wide>
      <ul className="gov-reasons">
        <li><span><Icon name="close" /></span><div><strong>Knowing the child&rsquo;s ID</strong><small>IDs get written on paper, shared in group chats, and seen by classmates.</small></div></li>
        <li><span><Icon name="close" /></span><div><strong>Having the same surname</strong><small>Plenty of unrelated people share a surname, and plenty of families do not.</small></div></li>
        <li><span><Icon name="close" /></span><div><strong>Knowing the class code</strong><small>Every child in the class knows it, so it proves nothing about one person.</small></div></li>
        <li><span><Icon name="close" /></span><div><strong>Holding the child&rsquo;s phone</strong><small>A phone can be borrowed, lost, or taken. It is not the same as being the parent.</small></div></li>
      </ul>
      <Note>This matters most in a custody dispute or where a child is not safe at home. The class teacher, who knows the family, is the one who confirms — not this screen.</Note>
    </Panel>

    <Note><strong>Removing access is not the same as withdrawing a child.</strong> It stops that one grown-up from seeing the child, immediately. It does not delete the child&rsquo;s work, does not affect another parent who is already connected, and does not take the child out of the study. To withdraw a child entirely, use Audit &amp; Data Lifecycle.</Note>
  </div>;
}
