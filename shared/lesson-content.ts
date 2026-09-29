/* A lesson's questions, as the mobile app plays them. The app's content is the
   source; `mobile/tool/export_lesson_content_test.dart` writes it to
   backend/data/lesson-content.json and the server keeps it in the
   `lesson_content` collection. */

/** One Check question or simulation step, with no learner in it. */
export type LessonQuestion = {
  prompt: string;
  /** "choice" for a multiple-choice question, else the simulation kind. */
  kind: string;
  choices: string[];
  /** Index of the right option in `choices`, when there is one. */
  answer?: number;
  /** What the lesson wants, in words. */
  expected: string;
  explain?: string;
};

export type LessonBank = {
  key: string;
  title: string;
  badge: string;
  quiz: LessonQuestion[];
  steps: LessonQuestion[];
};
