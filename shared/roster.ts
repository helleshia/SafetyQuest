/* How a class roster is ranked and ordered, so the teacher console and the learners'
   app leaderboard agree on who is first.

   Learners are ranked by simulation stars collected; equal stars are split by the
   average official score. Only learners equal on both share a place. A learner with no
   official result yet is not ranked. */

import { averageScore, officialResults, totalStars } from "./scoring.ts";

type Attempt = Parameters<typeof officialResults>[0][number];
type Learner = { id: string; name: string; studentName?: string | null };

export type RosterEntry<S extends Learner> = {
  student: S;
  /** Average official score, or null before any attempt counts. */
  average: number | null;
  stars: number;
  /** 1 for first place, shared on a tie; null when the learner has no official result. */
  rank: number | null;
};

export type RosterSort = "name" | "high" | "low";

export const displayName = (student: Learner) => student.studentName?.trim() || student.name;

export function rosterEntries<S extends Learner>(students: S[], assessments: Attempt[]): RosterEntry<S>[] {
  const scored = students.map(student => {
    const results = officialResults(assessments, student.id);
    return { student, average: averageScore(results), stars: totalStars(results), ranked: results.length > 0 };
  });
  const ahead = (row: typeof scored[number], other: typeof scored[number]) =>
    other.ranked && (other.stars > row.stars || (other.stars === row.stars && (other.average ?? 0) > (row.average ?? 0)));
  return scored.map(row => ({
    student: row.student,
    average: row.average,
    stars: row.stars,
    rank: row.ranked ? scored.filter(other => ahead(row, other)).length + 1 : null,
  }));
}

/** A–Z by name, or by grade (average score) highest or lowest first. Learners with no
    score yet always come last in the grade orders, and ties fall back to A–Z. */
export function sortRoster<S extends Learner>(entries: RosterEntry<S>[], sort: RosterSort): RosterEntry<S>[] {
  const byName = (a: RosterEntry<S>, b: RosterEntry<S>) =>
    displayName(a.student).localeCompare(displayName(b.student), undefined, { sensitivity: "base" });
  return [...entries].sort((a, b) => {
    if (sort === "name") return byName(a, b);
    if (a.average === null || b.average === null) {
      if (a.average === b.average) return byName(a, b);
      return a.average === null ? 1 : -1;
    }
    const grade = sort === "high" ? b.average - a.average : a.average - b.average;
    return grade || (sort === "high" ? b.stars - a.stars : a.stars - b.stars) || byName(a, b);
  });
}

/** The first three places, ties included, best first. */
export const podium = <S extends Learner>(entries: RosterEntry<S>[]) =>
  entries
    .filter(entry => entry.rank !== null && entry.rank <= 3)
    .sort((a, b) => (a.rank as number) - (b.rank as number) || displayName(a.student).localeCompare(displayName(b.student)));
