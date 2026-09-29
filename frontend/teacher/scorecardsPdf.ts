import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AssessmentRow, Module, Section, User } from "../shared/demo";
import { TOTAL_LESSONS, allLessons, standingFor, type ClassLesson } from "./classData";
import type { LearningProgressRow } from "../shared/store";
import { averageScore, officialResults } from "../../shared/scoring";

const nameOf = (student: User) => student.studentName?.trim() || student.name;

// The console palette, as RGB for the PDF.
const CORAL: [number, number, number] = [228, 93, 60];
const INK: [number, number, number] = [58, 28, 31];
const MUTED: [number, number, number] = [122, 101, 98];
const PAPER: [number, number, number] = [250, 247, 242];
const LINE: [number, number, number] = [232, 221, 214];
const GREEN: [number, number, number] = [47, 107, 76];

/** jspdf-autotable records where the last table ended on the document. */
const endOfLastTable = (doc: jsPDF) =>
  (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0;

/** Builds the class's scorecards as a real PDF file and downloads it: one
    card per learner, with their average, attempts and lessons, and for every
    open lesson the Check score, practical score, standing and reaction time. */
export function downloadScorecardsPdf(options: {
  section: Section;
  students: User[];
  assessments: AssessmentRow[];
  modules: Module[];
  lessons: ClassLesson[];
  progress: LearningProgressRow[];
  passMark: number;
  teacherName: string;
}) {
  const { section, students, assessments, lessons, progress, passMark, teacherName } = options;
  const stamped = new Date().toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SafetyQuest scorecards", margin, margin + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(
    `${section.name} · ${students.length} ${students.length === 1 ? "learner" : "learners"} · pass mark ${passMark}% · prepared by ${teacherName} · ${stamped}`,
    margin,
    margin + 26,
    { maxWidth: pageWidth - margin * 2 },
  );

  let y = margin + 50;
  if (!students.length) {
    doc.setTextColor(...INK);
    doc.text("No learners in this class yet.", margin, y);
  }

  for (const student of students) {
    const rows = assessments.filter(row => row.studentId === student.id);
    const average = averageScore(officialResults(rows, student.id));
    const lines = lessons.map(({ module }) => {
      const standing = standingFor(student, module.id, rows, passMark, progress);
      return [
        module.name,
        standing.quizBest === null ? "-" : `${standing.quizBest}%`,
        standing.score === null ? "-" : `${standing.score}%`,
        standing.passed === null
          ? standing.awaiting ? "Awaiting review" : "Not attempted"
          : standing.passed ? "Pass" : "Fail",
        standing.reaction === null ? "-" : `${standing.reaction.toFixed(1)}s`,
        standing.attempt?.review ?? "-",
      ];
    });

    // Keep a learner's heading with the start of their table.
    if (y > pageHeight - 160) {
      doc.addPage();
      y = margin;
    }

    doc.setDrawColor(...LINE);
    doc.setFillColor(...PAPER);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 54, 8, 8, "FD");
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(nameOf(student), margin + 12, y + 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(`Student ID ${student.name} · ${section.name}`, margin + 12, y + 38);

    // Summary figures along the right of the heading.
    const facts: [string, string][] = [
      ["AVERAGE", average === null ? "-" : `${average}%`],
      ["ATTEMPTS", String(rows.length)],
      ["LESSONS", `${Math.min(student.completed, TOTAL_LESSONS)} / ${TOTAL_LESSONS}`],
    ];
    let x = pageWidth - margin - 14;
    for (const [label, value] of [...facts].reverse()) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...INK);
      doc.text(value, x, y + 24, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      doc.text(label, x, y + 38, { align: "right" });
      x -= 78;
    }

    autoTable(doc, {
      startY: y + 62,
      margin: { left: margin, right: margin },
      head: [["Lesson", "Check", "Practical", "Standing", "Reaction", "Review"]],
      body: lines.length ? lines : [["No lessons are open for this class yet.", "", "", "", "", ""]],
      theme: "grid",
      styles: { font: "helvetica", fontSize: 9, textColor: INK, lineColor: LINE, lineWidth: 0.5, cellPadding: 5 },
      headStyles: { fillColor: CORAL, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
      alternateRowStyles: { fillColor: PAPER },
      columnStyles: {
        1: { halign: "center", cellWidth: 48 },
        2: { halign: "center", cellWidth: 56 },
        3: { cellWidth: 82 },
        4: { halign: "center", cellWidth: 54 },
        5: { cellWidth: 82 },
      },
      didParseCell: cell => {
        if (cell.section !== "body" || cell.column.index !== 3) return;
        if (cell.cell.raw === "Fail") cell.cell.styles.textColor = CORAL;
        if (cell.cell.raw === "Pass") cell.cell.styles.textColor = GREEN;
      },
    });
    y = endOfLastTable(doc) + 22;
  }

  // Page numbers.
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`SafetyQuest · ${section.name} · page ${page} of ${pages}`, pageWidth / 2, pageHeight - 20, { align: "center" });
  }

  const day = new Date().toISOString().slice(0, 10);
  const slug = section.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "class";
  doc.save(`safetyquest-scorecards-${slug}-${day}.pdf`);
}

export function classLessonsForPdf(
  assignments: Parameters<typeof allLessons>[0],
  modules: Module[],
  sectionId: string,
) {
  return allLessons(assignments, modules, sectionId);
}
