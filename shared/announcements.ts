/* Who an announcement reaches, decided the same way for learners, teachers and parents.

   A post's audience is one of:
   - a section's name: a teacher's post to that class (its learners and their parents);
   - "Everyone", "All students", "All teachers", "All parents", "All adults": the whole school;
   - "<scope> · <group>", e.g. "Grade 5 · students" or "Mahogany · everyone": a grade or
     section only, for one group. The admin console writes these. */

export type Reader = "students" | "teachers" | "parents";

/** Groups that include each kind of reader. */
const GROUPS: Record<Reader, string[]> = {
  students: ["student", "everyone"],
  teachers: ["teacher", "adult", "everyone"],
  parents: ["parent", "adult", "everyone"],
};

/** The scopes a reader belongs to: their sections by name and their grades, e.g. "grade 5". */
export function scopesFor(sections: { name: string; grade: string }[]) {
  return new Set(sections.flatMap(section => [section.name.trim().toLowerCase(), `grade ${section.grade}`.trim().toLowerCase()]));
}

/** Whether a post with this audience is meant for this reader. */
export function reaches(audience: string, reader: Reader, scopes: Set<string>) {
  const text = audience.trim().toLowerCase();
  // A class post: everyone attached to that section sees it.
  if (scopes.has(text)) return true;
  const [scope, group] = text.includes("·")
    ? text.split("·").map(part => part.trim())
    : ["whole school", text];
  if (!GROUPS[reader].some(word => group.includes(word))) return false;
  return scope === "whole school" || scopes.has(scope);
}
