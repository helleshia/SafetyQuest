import { useState } from "react";
import { useData } from "../shared/store";
import { Empty, Note, Panel, Search } from "../shared/ui";
import "./governance.css";

export default function Audit() {
  const { audit, users, assessments, links } = useData();
  const [query, setQuery] = useState("");
  const rows = audit.filter(entry => `${entry.action} ${entry.detail} ${entry.actor ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="gov-page">
    <Panel title="Administrative history" icon="clock" note="The latest 1,000 server-recorded events. Full history is retained in MongoDB." wide action={<Search value={query} onChange={setQuery} placeholder="Search history" />}>
      {!rows.length ? <Empty text="No administrative events match this search." /> : <div className="gov-table-scroll"><table className="sa-table"><thead><tr><th>Action</th><th>Details</th><th>Administrator</th><th>When</th></tr></thead><tbody>{rows.map(entry => <tr key={entry.id}><td><strong>{entry.action}</strong></td><td>{entry.detail}</td><td>{entry.actor ?? "Not recorded"}</td><td>{new Date(entry.time).toLocaleString()}</td></tr>)}</tbody></table></div>}
    </Panel>
    <Panel title="Stored learner records" icon="curriculum" wide><dl className="users-fields"><div><dt>Students</dt><dd>{users.filter(user => user.role === "Student").length}</dd></div><div><dt>Assessment attempts</dt><dd>{assessments.length}</dd></div><div><dt>Guardian links</dt><dd>{links.length}</dd></div></dl></Panel>
    <Note>Study-wide deletion is not available yet. Backup retention is managed in MongoDB Atlas; exported files remain with their holders. No backup or downloaded-file counts are inferred.</Note>
  </div>;
}
