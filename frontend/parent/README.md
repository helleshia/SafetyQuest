# Parent interface preview

Sign in with `parent@safetyquest.demo` and `SafetyQuest@2026`, or use the Parent preview-account button on the sign-in screen.

## Child check-in

Signing in does not open a record. The first screen is a check-in form asking for **your child's name and their student ID**, and nothing renders until one child has been identified.

Only the student ID is checked, and only against guardian links already verified for this account. The typed name becomes a label on the parent's own screens. The admin Academic Year preview separately supports adding fictional names to student records; this does not change the check-in or guardian authorization rule. A student ID that is not linked to the account and a student ID that belongs to nobody return one identical message, so the form cannot be used to probe the roster. Pending and revoked links get their own message but still open nothing.

Checking in confirms you are opening the right record. It never creates, extends, or restores a guardian link; only the responsible teacher can do that.

## Preview data

The preview guardian is Camille Mendoza (`p3`) with four link states, so each one renders:

| Link | Student | State |
| --- | --- | --- |
| `SQ-G5-013` | Maya Mendoza, Grade 5 · Acacia | Active |
| `SQ-G5-020` | Elias Mendoza, Grade 5 · Molave | Active |
| `SQ-G6-026` | Noah Mendoza | Pending |
| `SQ-G6-032` | Liana Mendoza | Revoked |

Check in more than one child and a child selector appears in the top bar.

## Pages

My Children, Learning Progress, Results & Feedback, Practice at Home, Announcements, Consent & Access, and My Account — the sidebar in section 6.1 of [roles.md](../../roles.md).

Results include published reviews and published revisions, never draft reviews. Completion uses the stored student summary over published modules; it does not invent per-module completion or count unpublished results. Assigned activities are filtered by section and student-target tokens. Practice at Home checkboxes are parent-reported and held in component state only — they never touch scores, completion, grades, points, or mastery. Parents cannot change any learning record.

## Naming

Names in `progress.ts` are fictional, parent-preview-only display fixtures. The optional `studentName` added through the admin preview takes precedence when a student record is displayed; the existing token remains unchanged. Student ID here is a SafetyQuest token, not a school-issued ID. Name entry/display is beyond the offline identity arrangement in `roles.md`; do not populate these fixtures or forms with real children's names. Live name handling needs an agreed identity/consent design and authorized backend responses.

## Limits of the preview

Like the other consoles, this uses local demo authentication and an in-memory `DataProvider`. Records reset when the provider remounts, and changes made in the teacher or admin preview do not survive a sign-out. Checked-in children are session state and are cleared on sign-out by design. Server authentication, guardian authorization, persistent shared progress, and identity handling all remain required for live use.

Run the focused checks with `node --test src/parent/progress.test.mjs`.
