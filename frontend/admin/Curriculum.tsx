import { useState } from "react";
import Icon from "../shared/Icon";
import type { Module, ModuleStatus } from "../shared/demo";
import { useData } from "../shared/store";
import { Modal, Note, Panel, Pill, Search, Select, Toolbar } from "../shared/ui";

const FLOW: ModuleStatus[] = ["Draft", "In review", "Approved", "Published", "Archived"];

export default function Curriculum() {
  const { modules, setModules, log, say } = useData();
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("All domains");
  const [open, setOpen] = useState<Module | null>(null);

  const rows = modules.filter(module =>
    (domain === "All domains" || module.domain === domain)
    && module.name.toLowerCase().includes(query.trim().toLowerCase()));

  function move(module: Module, status: ModuleStatus, message: string, bumpVersion = false) {
    const next = { ...module, status, version: bumpVersion ? module.version + 1 : module.version };
    setModules(current => current.map(row => (row.id === module.id ? next : row)));
    log("Content workflow", `Module ${module.id} · ${module.name} · ${message}`);
    say(message);
    setOpen(next);
  }

  return <>
    <Toolbar>
      <div><h2 className="sa-toolbar-title">Curriculum</h2><p className="sa-toolbar-note">{modules.length} recorded modules · {modules.filter(module => module.status === "Published").length} published</p></div>
      <div className="sa-toolbar-right">
        <Search value={query} onChange={setQuery} placeholder="Search modules" />
        <Select label="Domain" value={domain} options={["All domains", "Disaster Preparedness", "Personal Safety"]} onChange={setDomain} />
      </div>
    </Toolbar>

    <div className="sa-flow">
      {FLOW.map((state, index) => <div key={state} className="sa-flow-step">
        <span>{state}</span>
        <b>{modules.filter(module => module.status === state).length}</b>
        {index < FLOW.length - 1 && <Icon name="chevron" className="sa-flow-arrow" />}
      </div>)}
      <p>Changes requested returns a submission to its author: {modules.filter(module => module.status === "Changes requested").length} in that state.</p>
    </div>

    <Panel title="Module versions" note="Module records saved in the school workspace. Content authoring and version archives are not connected yet." wide>
      <table className="sa-table sa-table-click">
        <thead><tr><th>#</th><th>Module</th><th>Domain</th><th>Version</th><th>Lesson pages</th><th>Questions</th><th>Scenarios</th><th>Status</th><th /></tr></thead>
        <tbody>{rows.map(module => <tr key={module.id} onClick={() => setOpen(module)} tabIndex={0} onKeyDown={event => { if (event.key === "Enter") setOpen(module); }}>
          <td className="sa-dim">{String(module.id).padStart(2, "0")}</td>
          <td><strong>{module.name}</strong></td>
          <td>{module.domain}</td>
          <td className="sa-mono">v{module.version}</td>
          <td>{module.lessonPages}</td>
          <td>{module.questions}</td>
          <td>{module.scenarios}</td>
          <td><Pill>{module.status}</Pill></td>
          <td className="sa-row-arrow"><Icon name="chevron" /></td>
        </tr>)}</tbody>
      </table>
    </Panel>

    {open && <Modal title={`${open.name} · v${open.version}`} note={`${open.domain} · module ${open.id}`} onClose={() => setOpen(null)}>
      <div className="sa-detail-grid">
        <div><small>Publication status</small><Pill>{open.status}</Pill></div>
        <div><small>Grade suitability</small><strong>Not recorded</strong></div>
        <div><small>Content author</small><strong>Not recorded</strong></div>
        <div><small>Reviewer</small><strong>Not recorded</strong></div>
        <div><small>Language</small><strong>Not recorded</strong></div>
        <div><small>Prerequisite</small><strong>Not recorded</strong></div>
      </div>

      <h3 className="sa-sub">Assets in this version</h3>
      <ul className="sa-list">
        <li><div><strong>Learn — story lesson</strong><small>{open.lessonPages} illustrated scenes with narration and captions</small></div><Pill>Not verified</Pill></li>
        <li><div><strong>Learn — quiz</strong><small>{open.questions} questions with explanations · answer keys stay server-side</small></div><Pill>Not verified</Pill></li>
        <li><div><strong>Practice — simulation</strong><small>{open.scenarios} scenario branches with a versioned decision rubric</small></div><Pill>Not verified</Pill></li>
      </ul>

      <h3 className="sa-sub">Reviewed source references</h3>
      <p className="sa-footnote">No source references recorded.</p>

      <h3 className="sa-sub">Review decision</h3>
      <div className="sa-action-row">
        {open.status === "In review" && <>
          <button type="button" className="sa-primary" onClick={() => move(open, "Approved", "Version approved for publication.")}><Icon name="check" />Approve version</button>
          <button type="button" className="sa-ghost sa-danger" onClick={() => move(open, "Changes requested", "Changes requested and returned to the author.")}>Request changes</button>
        </>}
        {open.status === "Approved" && <button type="button" className="sa-primary" onClick={() => move(open, "Published", "Version published globally. It is now immutable.")}><Icon name="check" />Publish globally</button>}
        {open.status === "Published" && <>
          <button type="button" className="sa-ghost" onClick={() => move(open, "Draft", "New draft opened. The module version number was incremented.", true)}><Icon name="edit" />Open a new draft</button>
          <button type="button" className="sa-ghost sa-danger" onClick={() => move(open, "Archived", "Version archived. Existing attempts keep their results.")}>Archive version</button>
        </>}
        {(open.status === "Draft" || open.status === "Changes requested") && <button type="button" className="sa-ghost" onClick={() => move(open, "In review", "Draft submitted for authorized safety-content review.")}>Submit for review</button>}
        {open.status === "Archived" && <button type="button" className="sa-ghost" onClick={() => move(open, "Published", "Version restored to published.")}>Restore version</button>}
      </div>
      <Note>Publication approval controls distribution. It does not certify the administrator as a medical or disaster-response expert, and a section supplement can never silently replace an approved emergency-response procedure.</Note>
    </Modal>}
  </>;
}

