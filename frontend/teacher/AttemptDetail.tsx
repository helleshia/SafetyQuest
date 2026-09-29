import { useState } from "react";
import Icon from "../shared/Icon";
import type { AnswerRecord, AssessmentRow, Module, Section, User } from "../shared/demo";
import { useData } from "../shared/store";
import { Field, Note, Panel, Pill } from "../shared/ui";
import { useScope } from "./TeacherApp";
import { averageScore, officialResultsFor } from "../../shared/scoring";
import type { LessonQuestion } from "../../shared/lesson-content";

const nameOf = (student: User) => student.studentName?.trim() || student.name;
const initials = (student: User) => nameOf(student).split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase() || "S";
const stamp = () => new Date().toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).replace(/,([^,]*)$/, " ·$1");

/** The full record behind one score, as its own page: what the learner answered,
    what the scenario expected, what the score is made of, and the teacher's own
    feedback and notes on it. */
export default function AttemptDetail({ student, module, section, row, passMark, backLabel, onBack }: {
  student: User;
  module: Module;
  section: Section;
  row: AssessmentRow;
  passMark: number;
  backLabel: string;
  onBack: () => void;
}) {
  const store = useData();
  const { assessments, setAssessments, assignments, setAssignments, lessonQuestions, log, say } = store;
  const scope = useScope();
  // Read the live row so a saved grade, feedback, or note shows immediately.
  const live = assessments.find(item => item.id === row.id) ?? row;

  const [grade, setGrade] = useState(String(live.grade ?? live.practical));
  const [feedback, setFeedback] = useState(live.feedback ?? "");
  const [comment, setComment] = useState("");

  const score = live.grade ?? live.practical;
  const passed = score >= passMark;
  // What the learner actually answered, recorded by the app from the lesson.
  // Attempts from before the app saved answers carry only their totals.
  const quiz = live.detail?.quiz ?? [];
  const steps = live.detail?.steps ?? [];
  const quizRight = quiz.filter(line => line.correct).length;
  const missed = steps.filter(line => !line.correct);
  // The lesson's own questions, from the database, for attempts that predate
  // the app saving each answer: the questions are real, the pick is unknown.
  const bank = lessonQuestions?.[module.id];
  const comments = live.comments ?? [];
  const assignment = assignments.find(item => item.sectionId === section.id && item.moduleId === module.id && item.status === "Published");
  const grantedTries = assignment?.extraTries?.[student.id] ?? 0;

  // How this attempt sits against the rest of the class on the same lesson.
  const peers = officialResultsFor(assessments.filter(item => item.sectionId === section.id && item.moduleId === module.id));
  const peerAverage = averageScore(peers);

  function patch(changes: Partial<AssessmentRow>, action: string, message: string) {
    setAssessments(current => current.map(item => (item.id === live.id ? { ...item, ...changes } : item)));
    log(action, `${nameOf(student)} · ${module.name} · ${message}`);
    say(message);
  }

  function allowAnotherTry() {
    if (!assignment) {
      say("Open this lesson for the class first, then grant another try.");
      return;
    }
    setAssignments(current => current.map(item => {
      if (item.id !== assignment.id) return item;
      const next = (item.extraTries?.[student.id] ?? 0) + 1;
      return { ...item, extraTries: { ...item.extraTries, [student.id]: next } };
    }));
    log("Retake granted", `${nameOf(student)} · ${module.name} · another simulation try`);
    say(`Another try granted for ${nameOf(student)} on ${module.name}.`);
  }

  return <>
    <button type="button" className="sa-ghost tc-back" onClick={onBack}>
      <Icon name="arrow" className="tc-back-icon" />{backLabel}
    </button>

    <header className="atd-head">
      <span className="tc-avatar">{initials(student)}</span>
      <div className="atd-heading">
        <p className="tc-eyebrow">Attempt record</p>
        <h2>{nameOf(student)}</h2>
        <p>
          <span><Icon name="person" />Student ID {student.name}</span>
          <span><Icon name="curriculum" />{module.name}</span>
          <span><Icon name="sections" />{section.name}</span>
          <span><Icon name="calendar" />Submitted {live.submitted ?? "not recorded"}</span>
          <span><Icon name="audit" />v{module.version}</span>
        </p>
      </div>
      <Pill>{live.review}</Pill>
    </header>

    <div className={`atd-verdict ${passed ? "is-pass" : "is-fail"}`}>
      <span className="atd-score"><b>{score}%</b><small>{live.grade === undefined ? "automatic score" : "teacher grade"}</small></span>
      <div>
        <strong>{passed ? "Passed" : "Did not pass"} this lesson</strong>
        <small>
          {score}% against a {passMark}% pass mark
          {live.grade !== undefined && live.grade !== live.practical ? ` · the automatic score was ${live.practical}%` : ""}
          {peerAverage !== null ? ` · the class averages ${peerAverage}% on this lesson` : ""}.
        </small>
      </div>
      <dl className="atd-head-facts">
        <div><dt>Decision accuracy</dt><dd>{live.accuracy}%</dd></div>
        <div><dt>Reaction</dt><dd>{live.quality === "Complete" ? `${live.reaction.toFixed(1)}s` : "—"}</dd></div>
        <div><dt>Data quality</dt><dd className="atd-fact-word">{live.quality}</dd></div>
      </dl>
    </div>

    {live.quality === "Interrupted" && <Note>This attempt was backgrounded mid-scenario. The interrupted interval is marked unavailable rather than scored as zero, and it is excluded from reaction-time summaries.</Note>}

    <Panel title="Decisions during the practical" icon="clock" wide
      note={!steps.length
        ? bank ? `The ${bank.steps.length} steps of this lesson's practical. The learner's choices were not saved for this attempt.` : "No step-by-step record for this attempt."
        : missed.length === 0
          ? `All ${steps.length} steps were safe · ${score}%.`
          : `${steps.length - missed.length} of ${steps.length} steps were safe. The ${missed.length === 1 ? "step" : "steps"} marked below ${missed.length === 1 ? "is" : "are"} worth revisiting in class.`}>
      {steps.length
        ? <ol className="atd-questions">
          {steps.map((line, index) => <AnswerItem key={index} line={line} label={`Step ${index + 1}`} />)}
        </ol>
        : bank
          ? <><Note>{noRecord}</Note><ol className="atd-questions">
            {bank.steps.map((line, index) => <QuestionItem key={index} line={line} label={`Step ${index + 1}`} />)}
          </ol></>
          : <Note>{noRecord}</Note>}
      <Note>Reaction time is contextual evidence. It is not the sole grade and not a measure of real emergency readiness.</Note>
    </Panel>

    <Panel title="Answers to the lesson questions" icon="curriculum" wide
      note={!quiz.length
        ? bank ? `The ${bank.quiz.length} Check questions of this lesson, with the lesson's answers. The learner's picks were not saved for this attempt.` : "No Check answers were recorded with this attempt."
        : `${quizRight} of ${quiz.length} correct. The learner's choice is marked, and the lesson's answer is shown beside it.`}>
      {quiz.length
        ? <ol className="atd-questions">
          {quiz.map((line, index) => <AnswerItem key={index} line={line} label={`Q${index + 1}`} />)}
        </ol>
        : bank
          ? <><Note>{noRecord}</Note><ol className="atd-questions">
            {bank.quiz.map((line, index) => <QuestionItem key={index} line={line} label={`Q${index + 1}`} />)}
          </ol></>
          : <Note>{noRecord}</Note>}
    </Panel>

    <div className="tc-grid-2">
      <Panel title="Feedback to the learner" icon="edit" note="The practical grade is automatic. Add feedback only when you want a note for the learner — or change the grade if something went wrong.">
        <div className="sa-form">
          <Field label={`Teacher grade (%) · pass mark ${passMark}`} hint="Starts at the automatic score. Change it only when a retake or review is needed.">
            <input type="number" min={0} max={100} value={grade} onChange={event => setGrade(event.target.value)} />
          </Field>
          <Field label="Age-appropriate feedback" hint="Keep it to the learning activity. No names, family situations, medical details, or allegations.">
            <textarea rows={4} value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="You waited for cover well. Next time, wait for the signal before leaving the room." />
          </Field>
          <div className="sa-action-row">
            <button type="button" className="sa-ghost" onClick={() => patch({ grade: Number(grade), feedback, review: "Reviewed draft" }, "Review drafted", "saved as a reviewed draft")}>Save draft</button>
            <button type="button" className="sa-primary" onClick={() => patch({ grade: Number(grade), feedback, review: "Published" }, "Review published", "published to the learner and any linked parents")}><Icon name="check" />{feedback.trim() ? "Publish feedback" : "Confirm grade"}</button>
          </div>
        </div>
        {live.review === "Published" || live.review === "Revised"
          ? <Note>Score is already live for averages. Publishing feedback updates what the family sees.</Note>
          : <Note>Interrupted attempts stay here until you confirm. Complete runs publish automatically.</Note>}
      </Panel>

      <Panel title="Teacher notes" icon="announcements" note="Your own notes on this attempt. They stay between teachers and never reach the learner or their parents." action={comments.length ? <span className="tc-count-chip">{comments.length}</span> : undefined}>
        {comments.length === 0
          ? <p className="sa-empty">No notes on this attempt yet.</p>
          : <ul className="atd-comments">
            {comments.map(item => <li key={item.id}>
              <div className="atd-comment-head">
                <span className="atd-comment-mark">{item.author.split(" ").map(part => part[0]).slice(0, 2).join("")}</span>
                <strong>{item.author}</strong>
                <small>{item.at}</small>
                {item.author === scope.teacherName && <button type="button" className="atd-comment-remove" aria-label="Delete this note"
                  onClick={() => patch({ comments: comments.filter(note => note.id !== item.id) }, "Attempt note deleted", "a teacher note was deleted")}><Icon name="close" /></button>}
              </div>
              <p>{item.text}</p>
            </li>)}
          </ul>}

        <form className="sa-form atd-comment-form" onSubmit={event => {
          event.preventDefault();
          const text = comment.trim();
          if (!text) return;
          patch({ comments: [...comments, { id: `cm${Date.now()}`, author: scope.teacherName, at: stamp(), text }] }, "Attempt note added", "a teacher note was added");
          setComment("");
        }}>
          <Field label="Add a note" hint="Observations for yourself or the next teacher. Keep it to the learning activity.">
            <textarea rows={3} value={comment} onChange={event => setComment(event.target.value)} placeholder="Needed a second read of the lesson before the practical made sense." />
          </Field>
          <div className="sa-action-row"><button type="submit" className="sa-ghost" disabled={!comment.trim()}><Icon name="plus" />Add note</button></div>
        </form>
      </Panel>
    </div>

    {live.revisions?.length ? <Panel title="Revision history" icon="audit" note="Every revision keeps the previous value, the new value, the reason, the author, and the time." wide>
      <div className="tc-table-scroll"><table className="sa-table">
        <thead><tr><th>Previous</th><th>New</th><th>Reason</th><th>Author</th><th>Time</th></tr></thead>
        <tbody>{live.revisions.map((revision, index) => <tr key={index}>
          <td>{revision.from}%</td>
          <td><strong>{revision.to}%</strong></td>
          <td>{revision.reason}</td>
          <td className="sa-dim">{revision.author}</td>
          <td className="sa-dim">{revision.at}</td>
        </tr>)}</tbody>
      </table></div>
    </Panel> : null}

    <Panel title="Allow another try" icon="restore" note="Learners get one simulation try by default. Use this when you want them to take the practical again." wide>
      <div className="sa-action-row" style={{ alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <button type="button" className="sa-primary" onClick={allowAnotherTry} disabled={!assignment}>
          <Icon name="plus" />Allow another try
        </button>
        <small className="sa-dim">
          {assignment
            ? `Extra tries already granted for this learner on this lesson: ${grantedTries}.`
            : "Publish the lesson to this class first."}
        </small>
      </div>
    </Panel>

  </>;
}

const noRecord = "This attempt was taken before the app saved each answer, so the learner's own picks are not known. The lesson's questions and answers are shown below. Attempts taken from now on show what the learner chose.";

/** One recorded answer: the lesson's own question, every option with the
    learner's pick and the lesson's answer marked, or for tap and hold steps,
    what was done beside what was expected. */
function AnswerItem({ line, label }: { line: AnswerRecord; label: string }) {
  const choices = line.choices.length > 0 && line.chosen !== undefined;
  return <li className={line.correct ? "is-right" : "is-wrong"}>
    <div className="atd-question-head">
      <span>{label}</span>
      <strong>{line.prompt}</strong>
      <b>{line.correct ? "Correct" : "Missed"}{line.seconds !== undefined ? ` · ${line.seconds.toFixed(1)}s` : ""}</b>
    </div>
    {choices
      ? <ul className="atd-choices">
        {line.choices.map((choice, i) => {
          const picked = i === line.chosen;
          const isAnswer = i === line.answer;
          return <li key={i} className={`${picked ? "is-picked" : ""} ${isAnswer ? "is-answer" : ""}`}>
            <span className="atd-choice-letter">{String.fromCharCode(65 + i)}</span>
            <span className="atd-choice-text">{choice}</span>
            {picked && <em>{line.correct ? "chose · correct" : "chose"}</em>}
            {isAnswer && !picked && <em className="atd-expected">lesson answer</em>}
          </li>;
        })}
      </ul>
      : <ul className="atd-choices">
        <li className={line.correct ? "is-picked is-answer" : "is-picked"}>
          <span className="atd-choice-letter"><Icon name="check" /></span>
          <span className="atd-choice-text"><strong>Did:</strong> {line.chose}</span>
          <em>{line.correct ? "safe" : "missed"}</em>
        </li>
        {!line.correct && line.expected && <li className="is-answer">
          <span className="atd-choice-letter"><Icon name="arrow" /></span>
          <span className="atd-choice-text"><strong>Expected:</strong> {line.expected}</span>
          <em className="atd-expected">lesson answer</em>
        </li>}
      </ul>}
    {line.explain && <p className="sa-explanation"><strong>Why:</strong> {line.explain}</p>}
  </li>;
}

/** A lesson question with no learner pick: every option, the lesson's answer
    marked, or for tap and hold steps what the lesson expects. */
function QuestionItem({ line, label }: { line: LessonQuestion; label: string }) {
  return <li className="is-unrecorded">
    <div className="atd-question-head">
      <span>{label}</span>
      <strong>{line.prompt}</strong>
      <b>Not recorded</b>
    </div>
    {line.choices.length > 0
      ? <ul className="atd-choices">
        {line.choices.map((choice, i) => <li key={i} className={i === line.answer ? "is-answer" : ""}>
          <span className="atd-choice-letter">{String.fromCharCode(65 + i)}</span>
          <span className="atd-choice-text">{choice}</span>
          {i === line.answer && <em className="atd-expected">lesson answer</em>}
        </li>)}
      </ul>
      : line.expected && <ul className="atd-choices">
        <li className="is-answer">
          <span className="atd-choice-letter"><Icon name="arrow" /></span>
          <span className="atd-choice-text"><strong>Expected:</strong> {line.expected}</span>
          <em className="atd-expected">lesson answer</em>
        </li>
      </ul>}
    {line.explain && <p className="sa-explanation"><strong>Why:</strong> {line.explain}</p>}
  </li>;
}
