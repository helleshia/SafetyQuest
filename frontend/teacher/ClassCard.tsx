import Icon from "../shared/Icon";
import type { ClassStats } from "./classData";

/** Grade tints carry across the card, the class header, and the roster. */
export const gradeTint = (grade: string) => (["4", "5", "6"].includes(grade) ? `grade-${grade}` : "grade-other");

export default function ClassCard({ stats, onOpen }: { stats: ClassStats; onOpen: () => void }) {
  const { section, students, progress, average, lessons } = stats;
  const [gradeLabel, sectionLabel] = section.name.split(" · ");

  return <button type="button" className="tc-class" onClick={onOpen}>
    <header>
      <span className={`tc-class-badge ${gradeTint(section.grade)}`}>G{section.grade}</span>
      <span className="tc-class-title">
        <strong>{sectionLabel ?? section.name}</strong>
        <small>{gradeLabel} · {students.length} student{students.length === 1 ? "" : "s"}</small>
      </span>
      <Icon name="chevron" />
    </header>

    <span className="tc-class-progress">
      <span>Class progress<b>{progress}%</b></span>
      <span className="tc-class-track"><i style={{ width: `${progress}%` }} /></span>
    </span>

    <dl className="tc-class-foot">
      <div><dt>Average score</dt><dd>{average}%</dd></div>
      <div><dt>Active lessons</dt><dd>{lessons}</dd></div>
    </dl>
  </button>;
}
