import { useRef, useState } from "react";
import type { User } from "../shared/demo";
import { api } from "../shared/api";
import { useData } from "../shared/store";
import { Field, Modal, Note } from "../shared/ui";
import { normalizeStudentId, studentError } from "./academicValidation";

type Row = { studentName: string; studentId: string; sectionName: string; line: number };

function parseSpreadsheet(text: string): { rows: Row[]; error: string } {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length < 2) return { rows: [], error: "Add a header row and at least one student." };

  const split = (line: string) => {
    if (line.includes("\t")) return line.split("\t").map(cell => cell.trim());
    const cells: string[] = [];
    let current = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') { current += '"'; i += 1; }
        else quoted = !quoted;
      } else if ((ch === "," || ch === ";") && !quoted) {
        cells.push(current.trim());
        current = "";
      } else current += ch;
    }
    cells.push(current.trim());
    return cells;
  };

  const header = split(lines[0]).map(cell => cell.toLowerCase().replace(/[\s_]+/g, ""));
  const nameIdx = header.findIndex(cell => ["studentname", "fullname", "fullname", "studentfullname", "fullname"].includes(cell));
  const idIdx = header.findIndex(cell => ["studentid", "id", "token", "studenttoken", "lrn"].includes(cell));
  const sectionIdx = header.findIndex(cell => ["section", "classname", "class", "sectionname"].includes(cell));
  if (nameIdx < 0 || idIdx < 0) {
    return { rows: [], error: "Header must include Student Name and Student ID. Add a Section column too (see instructions)." };
  }

  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = split(lines[i]);
    const studentName = (cells[nameIdx] ?? "").trim();
    const studentId = (cells[idIdx] ?? "").trim();
    const sectionName = sectionIdx >= 0 ? (cells[sectionIdx] ?? "").trim() : "";
    if (!studentName && !studentId) continue;
    rows.push({ studentName, studentId, sectionName, line: i + 1 });
  }
  if (!rows.length) return { rows: [], error: "No student rows found under the header." };
  return { rows, error: "" };
}

const TEMPLATE = "Student Name,Student ID,Section\nJuan Dela Cruz,SQ-G4-001,Mahogany\nMaria Santos,SQ-G4-002,Mahogany\n";

function matchSection(
  label: string,
  catalog: { id: string; name: string }[],
  fallbackId: string,
) {
  const needle = label.trim().toLowerCase();
  if (needle) {
    const exact = catalog.find(item => item.name.toLowerCase() === needle
      || item.name.toLowerCase().endsWith(` · ${needle}`)
      || item.name.toLowerCase().includes(needle));
    if (exact) return exact.id;
  }
  return fallbackId;
}

/** Bulk-create pending student accounts from an Excel-exported CSV. */
export default function ExcelStudentUpload({
  sectionId = "",
  sectionName = "",
  sectionOptions = [],
  onClose,
  viaTeacherApi = false,
}: {
  sectionId?: string;
  sectionName?: string;
  /** When set (and sectionId empty), the admin picks which section gets the import. */
  sectionOptions?: { id: string; name: string }[];
  onClose: () => void;
  /** Teachers persist through /api/teacher/students; admins use the directory store. */
  viaTeacherApi?: boolean;
}) {
  const { users, sections, setUsers, log, say, refresh } = useData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickedId, setPickedId] = useState(sectionId);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fallback = sections.find(row => row.id === (pickedId || sectionId));
  const catalog = (sectionOptions.length
    ? sectionOptions
    : sections.filter(row => !row.archived).map(row => ({ id: row.id, name: row.name })));
  const note = fallback?.name ?? (sectionName || "Excel bulk upload");
  const needPick = !sectionId && sectionOptions.length > 0;

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "safetyquest-students.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function onFile(file: File | undefined) {
    setError("");
    setPreview([]);
    setFileName("");
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
      setError("Save the Excel file as CSV (File → Save As → CSV UTF-8) then upload that file.");
      return;
    }
    if (!lower.endsWith(".csv") && !lower.endsWith(".txt")) {
      setError("Upload a .csv file exported from Excel.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseSpreadsheet(String(reader.result ?? ""));
      if (parsed.error) { setError(parsed.error); return; }
      setFileName(file.name);
      setPreview(parsed.rows);
    };
    reader.onerror = () => setError("Could not read that file.");
    reader.readAsText(file);
  }

  async function importRows() {
    const defaultSectionId = fallback?.id ?? "";
    if (!defaultSectionId && preview.some(row => !row.sectionName.trim())) {
      setError("Choose a default section, or put a Section value on every row.");
      return;
    }
    if (!preview.length) { setError("Choose an Excel CSV first."); return; }
    setBusy(true);
    setError("");

    if (viaTeacherApi) {
      if (!defaultSectionId) { setBusy(false); setError("Open a class first, then upload."); return; }
      try {
        const result = await api<{ message: string }>("/api/teacher/students", "POST", {
          sectionId: defaultSectionId,
          students: preview.map(row => ({ studentName: row.studentName, studentId: row.studentId })),
        });
        say(result.message);
        refresh();
        onClose();
      } catch (problem) {
        setError((problem as Error).message);
      } finally {
        setBusy(false);
      }
      return;
    }

    const created: User[] = [];
    const problems: string[] = [];
    const seen = new Set<string>();
    let working = [...users];

    for (const row of preview) {
      const token = normalizeStudentId(row.studentId);
      const targetId = matchSection(row.sectionName, catalog, defaultSectionId);
      const target = sections.find(item => item.id === targetId);
      if (!target || target.archived) {
        problems.push(`Row ${row.line}: Section “${row.sectionName || "—"}” not found. Use the exact section name.`);
        continue;
      }
      const invalid = studentError(row.studentName, token, working);
      if (invalid) { problems.push(`Row ${row.line}: ${invalid}`); continue; }
      if (seen.has(token)) { problems.push(`Row ${row.line}: Duplicate Student ID in this file.`); continue; }
      seen.add(token);
      const next: User = {
        id: `student-${crypto.randomUUID()}`,
        name: token,
        studentName: row.studentName.trim(),
        email: "",
        role: "Student",
        status: "Pending",
        section: target.id,
        completed: 0,
        score: 0,
        consent: false,
        assent: false,
        activated: false,
        enrolled: new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
      };
      created.push(next);
      working = [...working, next];
    }

    if (!created.length) {
      setBusy(false);
      setError(problems[0] ?? "No valid students to import.");
      return;
    }

    setUsers(rows => [...rows, ...created]);
    log("Students imported from Excel", `${created.length} added`);
    say(problems.length
      ? `Imported ${created.length} student${created.length === 1 ? "" : "s"}. ${problems.length} row${problems.length === 1 ? "" : "s"} skipped.`
      : `Imported ${created.length} student${created.length === 1 ? "" : "s"} from Excel.`);
    setBusy(false);
    onClose();
  }

  return <Modal title="Excel · Upload students" note={note} onClose={onClose}>
    <div className="sa-form">
      <Note>
        <strong>How to prepare the file</strong>
        <ol className="excel-instructions">
          <li>Download the template (or make a sheet in Excel).</li>
          <li>Use these column headers exactly: <code>Student Name</code>, <code>Student ID</code>, <code>Section</code>.</li>
          <li><code>Student Name</code> — full name of the learner.</li>
          <li><code>Student ID</code> — unique school ID / token (letters, numbers, hyphens).</li>
          <li><code>Section</code> — section name as it appears here (e.g. Mahogany or Grade 4 · Mahogany).</li>
          <li>Save as <strong>CSV UTF-8</strong> (File → Save As → CSV), then choose that file below.</li>
          <li>No emails, photos, or birthdays — name, ID, and section only.</li>
        </ol>
      </Note>
      {needPick && <Field label="Default section" hint="Used when a row’s Section cell is blank.">
        <select value={pickedId} onChange={event => setPickedId(event.target.value)} disabled={busy}>
          <option value="">Choose section</option>
          {sectionOptions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </Field>}
      <div className="sa-action-row">
        <button type="button" className="sa-ghost" onClick={downloadTemplate}>Download template</button>
        <button type="button" className="sa-primary" onClick={() => inputRef.current?.click()} disabled={busy}>Choose CSV file</button>
      </div>
      <input ref={inputRef} type="file" accept=".csv,.txt,text/csv" hidden onChange={event => onFile(event.target.files?.[0])} />
      <Field label="Selected file">
        <input readOnly value={fileName || "No file chosen yet"} />
      </Field>
      {preview.length > 0 && <Note>{preview.length} row{preview.length === 1 ? "" : "s"} ready to import.</Note>}
      {error && <p className="account-error" role="alert">{error}</p>}
      <div className="sa-action-row">
        <button type="button" className="sa-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="button" className="sa-primary" disabled={busy || !preview.length} onClick={() => void importRows()}>
          {busy ? "Importing…" : `Import ${preview.length || ""} student${preview.length === 1 ? "" : "s"}`.trim()}
        </button>
      </div>
    </div>
  </Modal>;
}
