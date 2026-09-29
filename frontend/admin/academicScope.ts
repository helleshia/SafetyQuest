import type { AcademicTerm, GradeLevel, Section, User } from "../shared/demo";

export function termsForYear(terms: AcademicTerm[], yearId: string) {
  return terms.filter(term => term.academicYearId === yearId);
}

export function sectionsForTerm(sections: Section[], terms: AcademicTerm[], yearId: string, termId: string) {
  if (!termsForYear(terms, yearId).some(term => term.id === termId)) return [];
  return sections.filter(section => section.termId === termId);
}

export function gradeLevels(grades: GradeLevel[], yearId: string) {
  return grades.filter(grade => grade.academicYearId === yearId).sort((a, b) => Number(a.level) - Number(b.level));
}

export function sectionsForGrade(sections: Section[], grade: string) {
  return sections.filter(section => section.grade === grade);
}

export function studentsForSection(users: User[], scopedSections: Section[], sectionId: string) {
  if (!scopedSections.some(section => section.id === sectionId)) return [];
  return users.filter(user => user.role === "Student" && user.section === sectionId);
}
