import { requireUser } from "../../lib/auth";
import type { MobileAccount } from "../../lib/mobile-auth";
import { endpoint, json } from "../../lib/http";
import type { AdminState } from "../../../shared/admin-schema";
import { reaches, scopesFor } from "../../../shared/announcements";
import { withStudentTotals } from "../../../shared/scoring";

/** Everything a guardian may see, and nothing else.

    Two boundaries are enforced here rather than in the console:
    a parent reaches only children whose guardian link is `Active`, and only
    results a teacher has actually published. A link is either one the school
    recorded, or the parent email the student named during mobile setup matching
    this parent's account email. A pending or
    revoked link, or an unpublished attempt, never leaves the server. */
function scopedSnapshot(state: AdminState, parentId: string, namedBy: string[]) {
  // A link the school recorded wins, so revoking it still ends access.
  const recorded = new Set(state.links.filter(link => link.parentId === parentId).map(link => link.studentId));
  const emailLinks = namedBy.filter(studentId => !recorded.has(studentId)).map(studentId =>
    ({ id: `email-${studentId}`, parentId, studentId, status: "Active" as const, verifiedBy: "the email given at app setup" }));
  const links = [...state.links.filter(link => link.parentId === parentId), ...emailLinks];
  const linked = links.filter(link => link.status === "Active");
  const childIds = new Set(linked.map(link => link.studentId));
  const children = state.users.filter(user => user.role === "Student" && childIds.has(user.id));
  const sectionIds = new Set(children.map(child => child.section));
  const sections = state.sections.filter(section => sectionIds.has(section.id));

  return {
    users: [...withStudentTotals(children, state.assessments), ...state.users.filter(user => user.id === parentId)],
    // The parent's own links, including pending and revoked ones, so the console can
    // explain why a child is not reachable. Other families' links never appear.
    links,
    sections,
    assessments: state.assessments.filter(row =>
      childIds.has(row.studentId) && (row.review === "Published" || row.review === "Revised")),
    modules: state.modules,
    settings: state.settings,
    // Their children's class posts, and school posts for parents (whole school,
    // or their children's grade or section).
    announcements: state.announcements.filter(item => reaches(item.audience, "parents", scopesFor(sections))),
    assignments: [],
    academicYears: state.academicYears,
    academicTerms: state.academicTerms,
    grades: state.grades,
  };
}

export const GET = endpoint(async () => {
  const { db, workspace, account } = await requireUser(["Parent"]);
  const named = account.email
    ? await db.collection<MobileAccount>("mobile_accounts").find({ "parentContact.kind": "email", "parentContact.value": account.email.toLowerCase() }, { projection: { _id: 1 } }).toArray()
    : [];
  return json({ ...scopedSnapshot(workspace.state, account.id, named.map(row => row._id)), revision: workspace.revision, audit: [], accountId: account.id });
});
