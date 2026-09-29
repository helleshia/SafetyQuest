# SafetyQuest: Roles, Permissions, and Interface Requirements

Version: 1.0 · Prepared: September 18, 2026 · Status: implementation specification, not an implementation status report.

This document defines the website experiences for **Super Admin, Teacher, and Parent/Guardian**, and the **Student mobile application** for Grade 4–6 learners. It is based on [SYSTEM-BRIEF.pdf](SYSTEM-BRIEF.pdf), supplemented by the requested website roles and the proposed decisions below.

The website manages accounts, curriculum, classes, assessment reviews, and progress. Students learn and complete assessments in the Flutter mobile app for Android and iOS. All four roles use the same backend and the same authoritative learning records.

## 1. Source requirements and proposed additions

| Origin | Requirements |
| --- | --- |
| Brief, page 1 | Flutter student app; story-driven lessons and quizzes; practical simulations; decision and reaction-time recording; points, badges, levels, immediate feedback; audio narration; child-friendly visuals; randomized simulated emergency alerts. |
| Brief, page 1 | Teacher website with section rosters, completion and quiz analytics, simulation logs, teacher-entered grades and feedback, lesson publishing, module editing, quiz rubrics, and topic availability controls. |
| Brief, page 2 | Fifteen curriculum modules; physical parental consent and digital child assent; token-based student access; physical custody of the identity master list by the section instructor; section-scoped teacher access; HTTPS and database encryption; deletion of research learning records immediately after final thesis defense. |
| User requirement | Website roles are Super Admin, Teacher, and Parent/Guardian; students use the mobile application. |
| Proposed specification | Admin provisioning, parent linking, publishing approval, account states, detailed menus, permissions, grading defaults, data entities, API boundaries, reporting rules, and implementation order. |

**Interpretation:** the brief requires teacher publishing capabilities. This specification preserves teachers' ability to publish approved section materials, while requiring Super Admin approval before a changed safety protocol becomes a global module. This publishing boundary is a proposed governance decision, not a requirement explicitly stated in the PDF.

This document does not claim that the existing frontend already implements these features. Its authentication forms are currently previews; backend authentication and authorization remain to be built.

## 2. System boundaries and implementation defaults

### 2.1 Platform and responsibility map

| Role | Platform | Primary purpose | Data scope |
| --- | --- | --- | --- |
| Super Admin | Website | Govern users, sections, curriculum, and system operations. | Authorized deployment-wide administration; student information stays token-based. |
| Teacher | Website | Manage assigned sections, teach, assign activities, review assessments, and identify knowledge gaps. | Sections explicitly assigned to the teacher. |
| Parent/Guardian | Website | Follow linked children's progress and support practice at home. | Verified, active parent-to-student links only. |
| Student | Mobile app | Learn, practice, receive feedback, and track personal progress. | Own profile, assigned content, attempts, rewards, and feedback. |

### 2.2 Defaults to implement

- Start with one school/pilot deployment and multiple sections across Grades 4–6. Store a deployment/school identifier so records cannot mix if another school is added later.
- Each student belongs to one active section per school term. Transfers preserve historical records and change access scope.
- Each section has one primary teacher; additional assigned teachers may be supported through explicit assignments. Teachers cannot assign themselves to sections.
- An adult account has one role in the initial release. Multiple children can be linked to one parent; a child can have multiple verified guardians.
- Super Admin membership is controlled by existing authorized administrators. It is never a public signup option.
- Parent access is read-only for learning records. Teachers own academic review; administrators own platform governance.
- Global curriculum changes use versioning and approval. Historical attempts retain the versions on which they were completed.
- Student screens prioritize large buttons and short instructions. Adult dashboards prioritize usable tables, filters, and clear summaries.

### 2.3 Privacy conflict to resolve explicitly

The brief says that no student PII is captured and that the student's name-to-token master list stays physically with the teacher. Preserve that arrangement: do not add student names, photographs, birthdates, addresses, student email addresses, or a digital identity master list to the default schema.

However, identifiable parent accounts linked to student tokens can make those records identifiable in context. **Treat student tokens and linked learning records as protected, pseudonymous information; do not describe the complete platform as anonymous or “zero PII.”** This is a design inference from the proposed linking model and the DPA's definition of personal information. The DPA also includes education information in its sensitive-information definition. [NPC: Data Privacy Act](https://privacy.gov.ph/data-privacy-act/).

Parent dashboards are a proposed extension to the brief. Before live parent linking, the project must document this extension in its approved study/privacy materials and review the consent and access arrangement with the responsible school/research authority. This is a deployment requirement; it does not prevent building the interface and scoped linking mechanism.

Physical consent forms and identity verification remain offline. The website stores verification status, dates, verifier, notice version, and a non-identifying reference—not scans of signed forms or identification documents.

## 3. Accounts, authentication, and onboarding

### 3.1 Adult account lifecycle

Use separate fields for email verification, account approval, and account status. Verifying an email does not grant teacher or administrator privileges.

| State | Meaning | Allowed access |
| --- | --- | --- |
| Invited / unverified | Invitation or signup exists; email ownership is unconfirmed. | Verification and recovery only. |
| Pending approval | Email verified; role approval still required. | Pending-approval screen, own basic profile, and sign out. |
| Active | Approved account with valid role. | Role dashboard within its permitted scope. |
| Suspended | Access temporarily blocked. | Suspension explanation and support route; active sessions are revoked. |
| Deactivated | Account no longer participates. | No dashboard access. |

**Super Admin:** provision the first administrator through a controlled server setup. Additional admins receive invitations from an active Super Admin. Require MFA and recent reauthentication for role changes, administrator invitations, and research-data deletion. Prevent removing or suspending the last active administrator.

**Teacher:** invitation is preferred. If public teacher registration remains available, approve it before granting section access. Assign sections separately from approving the account.

**Parent:** register or accept an invitation, verify email, then request a child link. An active parent without linked children sees onboarding, not student records.

**Student:** no adult website signup. The teacher creates a token-based student record after offline consent verification. Initial mobile enrollment uses a classroom code plus an individual one-time activation credential. A classroom code is an enrollment locator, never permission to view or select every child in that class.

### 3.2 Recovery and shared-device behavior

- Adult password recovery uses a generic email response, an expiring single-use code, a verified reset step, and matching new passwords. Do not reveal whether an email belongs to an account.
- Student recovery is teacher-assisted using the physical master list. Issue a new private credential and revoke the old one; do not ask the child to provide an email address.
- Publicly visible student tokens are identifiers, not authentication secrets. Returning mobile access uses a private credential and revocable session; any PIN option needs server-side attempt limits.
- Shared devices must offer an obvious sign-out/switch-learner action and clear the previous learner's session and local records.
- Changing the role selector or frontend route never changes server-granted permissions.

**Existing UI action:** remove `Super Admin` from public registration choices when connecting authentication. Administrative invitations need a separate authorized flow.

## 4. Super Admin website

### 4.1 Main purpose

The Super Admin gets a complete administrative view of registered adults, student token records, assigned sections, parent links, learning activity, content versions, and governance status. “All user information” means the fields needed for administration; it excludes passwords, private activation credentials, recovery codes, and the teacher's physical student identity list.

Recommended sidebar:

1. Overview
2. Users
3. Sections
4. Academic Year
5. Assessment Overview
6. Reports
7. Announcements
8. Consent & Parent Links
9. Audit & Data Lifecycle
10. Settings

### 4.2 Overview

Show summary cards for active teachers, parents, student tokens, sections, pending teacher approvals, pending parent links, and consent/assent status counts. Separate suspended, pending, and active users rather than displaying one ambiguous total.

Dashboard panels:

- Completion by grade, section, module, and learning phase.
- Quiz and simulation performance as separate charts.
- Common incorrect decisions by module, using approved answer mappings.
- Simulation assessments awaiting teacher review.
- Recent administrative activity, such as invitations and content publication.
- Operational status: failed notifications, sync issues, and unavailable content.
- A task queue linking to approvals and operational issues.

Analytics must display the date range, last refresh, participant denominator, and missing-data count. “Recently active” means a defined learning-activity window, not a claim that a student is physically safe or currently online.

### 4.3 Users: directory and detail pages

Use tabs for Super Admins, Teachers, Parents, and Students, with role/status filters and pagination.

| User type | List and detail information | Administrative actions |
| --- | --- | --- |
| Super Admin | Name, email, account status, email verification, MFA enrollment, creation date, last login. | Invite, suspend/reactivate, deactivate, and initiate recovery; protect last active admin. |
| Teacher | Name, email, verification/approval status, assigned sections, grade levels, active student count, last login. | Invite/approve, assign/revoke sections, suspend/reactivate, initiate recovery. |
| Parent | Name, email, verification status, linked student tokens, link states, creation date, last login. | Invite, suspend/reactivate, inspect/revoke links, initiate recovery. |
| Student | Randomized token, grade/section, term, participation status, consent/assent status, module completion, latest learning activity. | Inspect records, coordinate transfer/deactivation, revoke sessions, initiate teacher-assisted recovery. |

Adult details include recent administrative activity and role-relevant associations. Student details include module results and token-based activity, with detailed assessment access audited.

Rules:

- No password or credential display/export, including for another administrator.
- No student-name search, because names are not stored in the default design.
- Admins cannot impersonate a teacher, parent, or child in the initial release.
- Administrators cannot overwrite quiz answers, simulation events, or teacher grades. Corrections follow the grading workflow and retain history.
- Role changes revoke old role access immediately and require explicit review of existing section/link relationships.

### 4.4 Sections

Fields: section ID, display name, grade, school term, deployment, primary teacher, additional assigned teachers, enrollment state, active student count, and class-code status.

Actions: create/edit/archive a section; assign/reassign teachers; open/close enrollment; rotate class codes; inspect the token roster; coordinate student transfers; inspect section assignments and progress.

Archiving a section ends new learning assignments and enrollment. It does not automatically delete its research records or replace the defense-triggered deletion policy.

### 4.5 Academic Year, curriculum, and content approval

The current requested drilldown is `Academic Year list → selected year → Grade Level → Section → Students`. Each step uses compact tables. The year list has Add Academic Year; inside a year, Add Grade Level creates an explicit grade record for that year; inside a grade, Add Section creates a section in its selected term. Sections have View, Edit, Archive/Restore, and confirmed Delete. Each section has Add Student (full name plus unique student ID), student View/Edit/Delete, and Add/Assign Teacher (select an existing active teacher, create a demo teacher, replace it, or remove its assignment). Name and ID are separate fields; internal record IDs remain stable during edits. Student ID edits also update individually targeted assignment tokens.

The grade level list is no longer inferred from sections or automatically added to new years. New academic years start empty, with First and Second Semester available as term options and no configured dates. Empty years/grades can be removed. Populated sections, assessment-bearing sections, and students with guardian links/learning history cannot be hard-deleted; archive sections or suspend accounts instead. Confirmed deletion of an empty year also removes its empty grade and term records. All changes are local preview state and reset on reload/sign-out; they are not backend CRUD.

The interface preview starts with SY 2026–2027, grades 4–6, an active First Semester with the existing six sections, and a planned Second Semester without sections. The existing fifteen-module library and publication workflow remain available inside Curriculum; this is still a shared baseline library, not separate per-year module copies. Term membership is explicit on section records. Backend persistence, historical enrollment membership, live account provisioning, and full term/date administration remain unimplemented.

The latest requested name-entry feature adds an optional `studentName` field to preview student records while retaining the SafetyQuest token in `name` for compatibility with existing learning screens. Existing fixtures without names show “Name not recorded”; they are not silently given invented identities. Use fictional names only. This explicitly changes the requested interface beyond the original offline-name design in section 2.3. Real name storage is not approved merely by building the UI and requires a revised identity, access, consent, and deployment design before live data is entered.

Maintain the fifteen baseline modules and their lesson, quiz, simulation, narration, and grading assets. Each version records grade suitability, objectives, source references, language, prerequisites, content author, reviewer, and publication status.

Workflow: `Draft → Submitted → Changes requested / Approved → Published → Archived`.

- Teachers author drafts and section supplements within their scope.
- Super Admin reviews and publishes global versions, subject to the project's authorized safety-content review process.
- Teachers can publish approved section materials and assign approved versions without waiting for another approval per assignment.
- A section supplement cannot silently replace an approved emergency-response procedure.
- The reviewed version becomes immutable; later edits create another draft.
- Publication approval controls distribution; it does not imply that the administrator is personally a medical or disaster-response expert.

### 4.6 Assessment Overview

Show aggregate performance and token-level drilldowns by section/module. Include theoretical score, practical score, decision accuracy, recorded reaction-time context, review status, and latest feedback.

The purpose is oversight and identifying missing reviews. Academic grade entry remains with the assigned teacher. A teacher reassignment gives the new authorized teacher access to the section's permitted history.

### 4.7 Reports

Provide deployment-level summary reports, adult-account inventories, token-based student progress reports, module knowledge-gap reports, pending-review lists, and research exports within the approved study scope.

Exports must include filters, reporting period, generation timestamp, content/scoring versions, and completeness notes. Detailed student exports are restricted and audited. CSV cells must be safely encoded so user-provided text does not become a spreadsheet formula.

### 4.8 Announcements, consent, and links

Publish announcements to adults, specific sections, or a selected authorized audience. Keep operational announcements distinct from simulated emergency activities.

Consent & Parent Links shows consent-status counts, verification metadata, active/revoked guardian relationships, and disputed requests. The responsible section teacher verifies physical forms and guardian identity. Administrators handle account/link disputes without gaining access to a digital student identity master list.

### 4.9 Audit, data lifecycle, and settings

Inspect administrative actions, content changes, account/section changes, detailed-record access, exports, guardian-link changes, grade changes, and deletion jobs.

Settings cover school term, approved mastery defaults, content languages, notification templates, simulation frequency limits, privacy notice versions, account provisioning, and the research lifecycle. Configuration changes are versioned and audited.

Do not put database passwords, encryption keys, mail credentials, or other infrastructure secrets into dashboard settings.

## 5. Teacher website

### 5.1 Main purpose and navigation

The Teacher manages their assigned sections and turns student activity into instruction and feedback.

Recommended sidebar:

1. My Dashboard
2. My Sections
3. Student Progress
4. Assignments
5. Lessons & Modules
6. Quizzes & Rubrics
7. Simulation Review
8. Grades & Feedback
9. Reports
10. Announcements
11. Consent & Parent Links
12. My Account

Use a section switcher for teachers assigned to more than one section. Every page indicates the currently selected scope.

### 5.2 My Dashboard

Cards: enrolled/eligible students, assignment completion, quiz-pass count, simulation-pass count, pending assessment reviews, and pending consent or guardian-link verifications.

Panels: module progress, frequently missed questions/decisions, learners needing follow-up by token, recent completed assessments, upcoming due dates, and feedback awaiting publication.

Follow-up indicators describe learning needs, such as “revisit flood-route selection.” They must not label a child unsafe, unfit, or diagnosed based on app performance.

### 5.3 Sections and roster

Show student tokens, grade/section, participation status, verified consent, assent state, enrollment date, credential activation state, parent-link state, and latest activity.

Teacher actions:

- Generate student token records and print private activation slips after verifying participation eligibility.
- Keep the physical token-to-name list offline and secure.
- Verify consent and guardian-link requests in person or through the approved offline process.
- Open/rotate enrollment codes within their assigned section.
- Reset a student's private access credential after offline verification.
- Mark a student inactive or request a transfer; preserve assessment history.
- Assign approved activities to the section or selected student tokens.

Do not upload spreadsheets of student names, student IDs, birthdates, or addresses. A bulk-create workflow can use a participant count and generate tokens instead.

### 5.4 Student Progress detail

Each token's detail page contains:

- Section, term, participation and clearance states.
- Completed, assigned, and remaining modules.
- Lesson progress and quiz attempts, with question explanations.
- Practical assessment attempts and decision sequences.
- Grade review history and published teacher feedback.
- Earned rewards and activity dates.
- Current/past verified guardian links relevant to the section.

The teacher identifies the learner by consulting the physical master list. Progress screens must not add an unofficial name field or identifying free-text alias.

### 5.5 Assignments and availability

An assignment has a module/content version, target section or tokens, opening date, optional due date, phase requirements, retry policy, simulation settings, and status.

Teacher actions: draft, publish, reschedule, withdraw, and review an assignment; unlock or hide approved topics; set prerequisites; enable supervised/randomized simulation practice within approved frequency limits.

Availability is section-scoped. Changing an assignment does not republish the global module or change a completed assessment's scoring policy.

### 5.6 Lessons, quizzes, and rubrics

Provide editors for story pages, narration assets, illustrations, questions, answers, explanations, scenario branches, decision criteria, and rubric weights.

- Preview the child-facing interface before submission/publication.
- Use approved source references and maintain a content version.
- Submit changes to baseline safety procedures for global review.
- Publish approved section materials and activities.
- Add instructional context within approved section-authoring rules.
- Rubric changes affect future attempts only; historical attempts keep the old rubric.

Draft text, answer keys, and unpublished scenarios are not accessible to parents or students.

### 5.7 Simulation Review

The review queue lists student token, module/scenario version, completion date, simulated decisions, automatic result, reaction-time measures, sync/data quality, and teacher-review status.

Attempt detail presents the scenario timeline and each action, expected decision, outcome, elapsed time, pause/background interruptions, and corrective feedback. Reaction time is contextual evidence, not the sole grade or a measure of real emergency readiness.

Teacher actions: enter a rubric grade, add age-appropriate feedback, flag an interrupted attempt, request a retake, and publish a review. The event log is immutable.

### 5.8 Grades and feedback

Keep automatic scores, teacher grades, and published feedback separate. States: `Awaiting review → Reviewed draft → Published → Revised`.

Parents and students see published results only. A revised grade includes the previous value, new value, reason, author, and time. Teachers do not edit raw attempt answers or award unsupported simulation results.

Do not enter student names, family situations, medical details, or disciplinary allegations in feedback. Keep comments focused on the learning activity.

### 5.9 Reports and communication

Reports: section completion, token-level learning progress, quiz misconceptions, simulation decisions, published grades, pending reviews, and recommended revision topics.

Teachers export only their assigned section scope. Parents receive a child-specific report, never a full class export.

Teachers publish section announcements and learner-specific feedback. Direct private chat is deferred; the initial release uses published announcements, structured feedback, and an approved school contact route.

### 5.10 Restrictions

A teacher cannot inspect unassigned sections, change adult roles, approve themselves, view another teacher's identity master list, publish global protocol changes without review, delete research logs, or revoke another section's parent relationships.

## 6. Parent/Guardian website

### 6.1 Main purpose and navigation

Parents see what their linked child is learning, which activities need attention, and how to reinforce approved lessons at home.

Recommended sidebar:

1. My Children
2. Learning Progress
3. Results & Feedback
4. Practice at Home
5. Announcements
6. Consent & Access
7. My Account

Display a token-based child selector if more than one link is active. Use the token, grade, and section to distinguish records; do not store a child's real-name alias in the pilot.

### 6.2 My Children dashboard

For the selected child, show completed modules out of fifteen, current assignment, lesson/quiz/practical phase progress, recent badges, published feedback, upcoming activities, and last recorded learning activity.

Provide a “Link a child” action and an empty-state explanation when no link exists. Pending requests display their status without revealing the requested child's records.

### 6.3 Linking process

1. Parent signs in with a verified adult account.
2. The responsible teacher checks the physical consent and guardian relationship offline.
3. Teacher issues an expiring, one-time guardian invitation linked to one student record.
4. Parent redeems the invitation while authenticated.
5. Teacher confirms the intended adult account; the backend activates the relationship.
6. Parent and teacher receive an access-confirmation notification.

Store `pending`, `active`, `revoked`, or `expired` relationship states. A token, surname, class code, or possession of a student's device alone does not prove guardianship.

Revoking a parent link immediately ends that parent's access to the child. It does not delete the child's progress or remove another guardian's independently verified link.

### 6.4 Learning Progress and Results & Feedback

Show module/phase completion, best and latest quiz scores, practical assessment summaries, published teacher grades, earned badges, and published instructional feedback.

Parents can download a report for their linked child. Do not expose class rankings, other children's records, answer keys, raw event timelines, unpublished teacher notes, or other guardians' contact information.

Explain simulation results in plain language. For example: “Your child can review this lesson and try the practice again.” Avoid equating a low score with real-world danger or ability.

### 6.5 Practice at Home

Provide approved family discussion prompts, offline activity checklists, short module recaps, and guidance about asking a trusted adult for help. These materials support learning; they do not provide a live emergency-response service.

If parents mark a home activity complete, store it as a separate parent-reported checklist entry. It must not change the student's quiz score, assessment completion, grades, XP, or mastery.

### 6.6 Consent & Access and account settings

Show privacy notices, verified physical-consent status, guardian-link status, contact preferences, notification settings, and request routes for access correction, unlinking, or participation withdrawal.

An online acknowledgment does not replace mandatory physical informed consent. Parent-link withdrawal and student participation withdrawal are separate operations. Participation withdrawal is verified through the responsible teacher and stops new learning-data collection.

Parents can update their own adult profile and password. They cannot edit the child roster, assign grades, unlock modules, control other guardians, or alter school-assigned activities.

## 7. Student mobile application

### 7.1 Navigation and overall interface

Use four bottom-navigation destinations: **Home, Quests, Badges, and Me**. Notifications and teacher feedback appear through a visible inbox button on Home. Lessons and simulations use focused full-screen activity views.

Use the landing page's coral, burgundy, cream, and supportive pastel palette. Reuse Space Grotesk for headings and DM Sans for body content if appropriately bundled/licensed for the mobile build. Adapt contrast and sizes for children rather than shrinking the adult dashboard.

### 7.2 Enrollment and child-friendly assent

Screen sequence:

1. Welcome with SafetyQuest mascot and a clear “Start” button.
2. Enter classroom code and individual activation credential.
3. Backend validates the section, student record, credential, and physical-consent status.
4. Explain, in simple narrated language, what learning information is recorded and who can see it.
5. Offer clear assent choices: agree to participate or decline/leave.
6. Select a preset avatar and set approved narration/sound preferences.
7. Open Home after eligibility and assent are confirmed.

Do not request a child's full name, birthdate, home address, photo, email, or phone number. Do not show a roster of classmates on login.

Before consent/assent, account-security handling may still occur, but do not begin learning analytics or record assessments. Declining assent must remain a real choice, with no punishment or loss message.

### 7.3 Home: what the student sees first

The main screen contains:

- A welcoming mascot, preset avatar, and non-identifying student token.
- A large **Continue my quest** card for the next eligible activity.
- One understandable progress statement, such as “4 of 15 quests finished.”
- A teacher-assigned activity card, including due date when applicable.
- A small display of earned XP/level and latest badge.
- A short, approved safety tip or encouragement.
- Inbox and narration controls with clear labels.

The first screen should prioritize the next action. Do not fill it with dense charts, reaction-time tables, administrator metrics, or classmates' progress.

### 7.4 Quests library

Organize fifteen modules into **Disaster Preparedness** and **Personal Safety**. Cards show topic artwork, short title, availability, progress, and phase status.

Possible card states: `Available`, `In progress`, `Needs practice`, `Completed`, `Locked by prerequisite`, or `Not assigned yet`.

Locked cards explain how they become available. Keep teacher-hidden content unavailable even if the student changes a local screen or guesses a module URL.

### 7.5 Module introduction

Show topic art, one short learning objective, an approximate activity duration, narration control, and two clear stages:

1. **Learn:** story lesson and quiz.
2. **Practice:** scenario simulation.

Show Start/Continue and a Back action. Display the teacher's assignment instructions where present. Practical assessments unlock after completing the required theoretical activities under the configured policy.

### 7.6 Phase 1: interactive lesson

Use one scene or idea per page, a cartoon illustration/animation, optional narration with captions, short text, and predictable Previous/Next navigation.

Interactive scenes can ask the child to select or identify the safe response. An answer receives an explanation. Missing a question should invite another attempt; it should not shame the learner.

Save a resumable checkpoint after completed lesson scenes. Asset-loading failures show Retry/Back and must not mark the lesson complete.

### 7.7 Phase 1: quiz

Show one question at a time, a question counter, labeled answer buttons, optional audio, and a clear Submit answer action. Use accessible image-choice questions where useful.

After submission, present corrective feedback and an explanation. The result screen shows the score, pass/retry status, a topic to revisit, and Continue to Practice when eligible.

Question selection, scoring, and attempt limits are controlled by the backend/content version. Do not ship future question answer keys in a public catalog response.

### 7.8 Phase 2: scenario simulation

Present a clearly labeled practice situation with illustrated surroundings, short prompts, and high-contrast action choices. The simulation records decisions and active decision time against a versioned scenario rubric.

Provide immediate corrective feedback where pedagogically appropriate. Allow the learner to pause, exit, or replay under the assignment policy. Exiting does not automatically count as a failed academic assessment.

Result screen: completed scenario, decision feedback, automatic practical score, whether a teacher review is pending, and Try again/Back to Quests actions. Published teacher grades appear later in the inbox and module results.

### 7.9 Randomized simulated emergency alerts

These alerts are **in-app educational simulations**, not actual disaster warnings.

- Trigger only during eligible foreground app sessions, within teacher-configured availability and frequency limits.
- Never interrupt login, assent, a graded quiz, another simulation, or a result being submitted.
- Use an explicit “Practice alert—this is a simulation” label and predictable visual styling.
- Let the child respond, defer, or exit. Record defer/exit as such; do not turn nonparticipation into an automatic wrong answer.
- Avoid distressing alarms, vibration, or urgent countdowns by default.
- Practice calls and dispatch scenes never place a real call, send a real emergency message, or contact a real responder.
- Do not suggest that the application monitors a child's physical safety.

The initial release does not send randomized emergency practice prompts as out-of-session push notifications.

### 7.10 Badges and level progress

Show earned badges, what each badge represents, a simple XP/level progress indicator, and encouragement to revisit lessons. Locked badge descriptions explain the learning requirement.

Keep achievement records personal. Public leaderboards, peer comparisons, reward purchases, and streak-loss penalties are outside the initial scope.

### 7.11 Inbox and teacher feedback

Display new assignments, section announcements, teacher feedback, and published reviews. Use short, age-appropriate text with narration where useful.

Only authorized announcements and the learner's own feedback appear. No direct student-to-student chat or open teacher/student messaging is included.

### 7.12 Me and accessibility settings

Show preset avatar, student token, section/grade, current level, and personal progress. Controls: narration, sound, supported language, reduced motion, replay child-friendly privacy explanation, sign out, and teacher-assisted help.

The learner can ask to stop participation through an understandable screen. Stop new learning-data collection immediately and notify the responsible teacher to resolve the withdrawal workflow. Do not require a child to explain sensitive personal circumstances in a free-text field.

### 7.13 Connectivity and interruptions

The first release requires a connection for enrollment, scoring, submissions, and new content access. Preserve local checkpoints for a short interrupted session, while isolating them by learner/session.

Show saving, saved, retry, and failed states. Do not present unsubmitted work as a server-confirmed score. Retries use a unique attempt identifier so one submission cannot create duplicate scores or rewards.

Full offline module downloads and queued offline assessment scoring are future enhancements. Shared-device caches must not expose a previous student's records.

## 8. Curriculum: fifteen baseline modules

All modules use both theoretical and practical phases. The scenario descriptions below are illustrative content-design directions, not emergency instructions or validated safety protocols.

| # | Domain | Module from the brief | Student experience direction |
| --- | --- | --- | --- |
| 1 | Disaster Preparedness | Understanding Emergencies & Disaster Preparedness | Recognize situations and choose an approved preparedness response. |
| 2 | Disaster Preparedness | Earthquake Safety | Story and decision sequence based on reviewed earthquake-safety guidance. |
| 3 | Disaster Preparedness | Fire Safety | Identify approved evacuation choices in an illustrated setting. |
| 4 | Disaster Preparedness | Flood Safety | Interpret reviewed warning/route examples and select safe decisions. |
| 5 | Disaster Preparedness | Typhoon Safety | Prepare supplies and work through approved pre-storm decisions. |
| 6 | Disaster Preparedness | Earthquake & Fire Evacuation Drills | Practice an approved school evacuation sequence. |
| 7 | Disaster Preparedness | Emergency Go Bag | Select and organize approved essential-supply examples. |
| 8 | Disaster Preparedness | Emergency Communication | Practice a fictional reporting conversation without a real call. |
| 9 | Personal Safety | Stranger Danger | Recognize boundaries and identify an approved trusted-adult response. |
| 10 | Personal Safety | Cyberbullying & Online Safety | Work through fictional privacy and online-interaction choices. |
| 11 | Personal Safety | Road & Traffic Safety | Practice reviewed pedestrian-safety choices in a cartoon scene. |
| 12 | Personal Safety | Basic First Aid | Identify appropriate approved help-seeking and first-aid learning responses. |
| 13 | Personal Safety | Bullying Awareness | Explore fictional bystander/support choices without collecting real allegations. |
| 14 | Personal Safety | Water Safety | Recognize reviewed supervision and boundary examples. |
| 15 | Personal Safety | Poison, Household, & Electricity Safety | Recognize illustrated hazards and approved help-seeking choices. |

The brief references NDRRMC and Philippine Red Cross guidance, and PAGASA-related flood/typhoon content. Each module must record the actual reviewed references used before publication. Do not treat this table as confirmation that any specific lesson is already endorsed by those bodies.

## 9. Permission matrix

“All” means the administrator's authorized deployment. “Assigned” means an explicit active section assignment. “Linked” means an active verified guardian relationship. “Own” means the authenticated student's record.

| Capability | Super Admin | Teacher | Parent | Student |
| --- | --- | --- | --- | --- |
| View adult-account directory | All | Own profile and necessary section contacts | Own profile and assigned teacher contact route | No adult directory |
| Invite/approve adult accounts | Yes | No | No | No |
| Grant administrator role | Controlled admin invitation | No | No | No |
| Assign teachers to sections | Yes | No | No | No |
| View student-token roster | All | Assigned | Linked children only | Own profile only |
| View student real-name master list | No digital list | Physical custody for own section | No platform list | No platform list |
| Create student records | Authorized coordination | Assigned, after eligibility verification | No | No |
| Reset student credentials | Initiate/coordinated recovery | Assigned, after offline verification | Request through teacher | Request through teacher |
| Verify physical parental consent | View metadata/oversight | Responsible assigned teacher | Submit through offline process | No |
| Give/withdraw child assent | No | No | No | Own participation |
| Request a guardian link | Support/oversight | Issue and verify assigned invitations | Own account | No |
| Revoke guardian access | Audited oversight | Assigned child | Withdraw own link | Request help |
| View learning progress | All, audited detail access | Assigned | Linked summaries | Own |
| View raw simulation events | Authorized administration | Assigned | No | Own explanatory results, not raw admin log |
| Draft lessons/questions/scenarios | Yes | Within authoring scope | No | No |
| Publish global protocol changes | After authorized review | Submit for review | No | No |
| Publish approved section material | Oversight | Assigned | No | No |
| Set section assignments/availability | Oversight | Assigned | No | No |
| Configure global scoring defaults | Yes, versioned | No | No | No |
| Configure approved assignment rubrics | Oversight | Assigned, future attempts only | No | No |
| Enter/revise teacher grades | No direct grade override | Assigned, audited | No | No |
| View unpublished review notes | Authorized oversight | Assigned | No | No |
| View published grades/feedback | All, scoped purpose | Assigned | Linked | Own |
| Complete lessons and assessments | No | Preview only, excluded from analytics | No | Own |
| Edit raw answers/events or grant arbitrary XP | No | No | No | No |
| Export reports | Authorized all/token-based | Assigned | Linked child report only | No bulk export |
| Publish announcements | Authorized audiences | Assigned audiences | No | No |
| Read audit records | Authorized administration | Own relevant change history | Own access requests/status | No admin log |
| Execute research-data deletion | Restricted, verified lifecycle action | No | Request route | Request route |

Authorization is enforced on every backend read, write, export, subscription, and attachment request. Hiding a sidebar item does not enforce a permission.

## 10. Shared records and data model

Use internal random IDs for relationships. The visible student token can be rotated without using it as a database primary key or an authentication secret.

| Entity | Minimum responsibilities/fields |
| --- | --- |
| AdultAccount | Internal ID, name, email, role, verification/approval/account states, password hash, MFA metadata, preferences, timestamps. |
| SchoolDeployment / SchoolTerm | Deployment identity, term dates, study lifecycle, responsible operators, defense-completion event. |
| Section | Deployment, term, grade, display name, enrollment state, class-code metadata. |
| TeacherSectionAssignment | Teacher, section, primary/additional role, active dates and revocation. |
| StudentRecord | Random ID, visible token, grade/section membership, preset avatar, participation status; no default identity fields. |
| StudentSectionMembership | Current and historical section/term assignments and transfers. |
| StudentCredential / Session | Hashed activation/access credentials, expiry, use/revocation state, device/session metadata kept minimally. |
| ConsentVerification | Student, physical-form non-identifying reference, verified status/date, responsible verifier, applicable notice version. |
| ChildAssent | Student, notice version, assent choice/date, withdrawal state. |
| GuardianLink / Invitation | Parent and student IDs, invitation hash/expiry, teacher verification, relationship state, activation/revocation times. |
| Module / ContentVersion | Domain, objectives, grade suitability, approved sources, author/reviewer, content and publication states. |
| LessonPage / ContentAsset | Versioned story scenes, narration, captions, illustrations, asset permissions. |
| QuizVersion / Question | Versioned questions, answer rules, explanations, scoring policy; separate server-side answer-key access. |
| SimulationVersion / Rubric | Scenario states, allowed transitions, decision rules, timing definition, versioned criteria. |
| Assignment | Section or token targets, content version, phase requirements, opening/due dates, retries, simulation settings, state. |
| LessonProgress | Student, assigned content version, completed checkpoints, start/completion timestamps. |
| QuizAttempt | Student, assignment/version, selected questions, responses, automatic score, timestamps, completion state. |
| SimulationAttempt / Event | Student, scenario/rubric versions, decision events, elapsed time, interruptions, completion and data-quality state. |
| TeacherReview | Attempt, teacher, rubric grade, review/publication state, qualitative feedback and revision history. |
| RewardLedger / BadgeAward | Student, learning event, award policy/version, points/badge, unique deduplication key. |
| Announcement / Notification | Author, target scope, message/version, delivery/read status, expiration. |
| HomePracticeChecklist | Parent/student link, approved checklist item, parent-reported completion; separate from assessment. |
| AuditEvent / DeletionJob | Actor, action, target IDs, scope, timestamps, change references, lifecycle verification and job results. |

Adult identities and their association with student records need stricter access than aggregate dashboard counts. Avoid storing identifying free text in lesson answers, feedback, event logs, filenames, or exported metadata.

## 11. Learning states, scoring, and analytics

### 11.1 Module and attempt states

Module progress: `Not started → Learning → Quiz eligible → Quiz passed → Practice eligible → Practice passed → Completed`.

Retry outcomes may mark `Needs practice`; they do not erase past attempts. An assigned activity can additionally be unavailable, withdrawn, or past its due date. Completed learning and assignment availability are different concepts.

Attempt lifecycle: `Created → In progress → Submitted → Scored`, with separate `Interrupted`, `Abandoned`, or `Invalid` outcomes. Teacher review is another state on top of a scored practical attempt.

### 11.2 Proposed initial scoring policy

These are configurable product defaults, not values stated in the PDF:

- Theoretical score: earned quiz points divided by available quiz points, expressed as a percentage.
- Practical score: earned decision-rubric points divided by available decision-rubric points, expressed as a percentage. Required critical decisions must also meet the scenario's reviewed rules.
- Initial pass thresholds: 70% for theoretical and practical activities, configurable before assignment publication.
- Module completion: required lesson scenes completed, quiz passed, and practical assessment passed. Automatic completion does not mean that a teacher has published an academic grade.
- Optional combined module result: 40% theoretical and 60% practical. Show the component scores and rubric version; do not silently equate this with an official school grade.
- Teachers publish academic grades using the school's approved assessment policy. If weighting differs, configure and version it explicitly.
- Ungraded practice can be repeatable. Graded assignments use their published retry policy.

### 11.3 Reaction-time rules

Measure elapsed active time from the moment a scenario prompt and its action controls are ready to the student's decision. Record backgrounding, explicit pauses, narration state, and other interruptions separately.

Do not treat network upload time as student reaction time. Interrupted or incomplete intervals are marked unavailable/invalid rather than scored as zero. Device-timed measurements are contextual research observations, not tamper-proof evidence of real emergency behavior.

Use correctness as the default scoring basis. Reaction-time weighting is disabled unless a reviewed rubric explicitly defines it and accounts for accessibility and device differences.

### 11.4 Proposed gamification defaults

- First completion of a module's required lessons: 10 XP.
- First passing quiz result for that module: 20 XP.
- First passing practical assessment: 30 XP.
- Module mastery badge: awarded after all required module phases pass.
- Initial level progression: one level per 100 XP; completed baseline curriculum can earn 900 XP under this policy.
- Retrying improves learning/results but does not repeatedly award the same XP event.

The backend issues rewards through a deduplicated ledger. Regrading or withdrawing an invalid attempt must follow a documented reward-correction policy, preserving history instead of manually editing totals.

### 11.5 Analytics definitions

Display best score and latest score separately. Pending review is not a failing grade. Missing attempts are not zero scores. Interrupted attempts remain distinguishable from completed failures.

Completion percentages use eligible participants and assigned module versions. Count a transferred student once within the chosen reporting scope. Aggregates should not combine different rubric versions without explaining the comparison.

“Real-time” means updates after successful server acceptance, using scoped subscriptions or polling. Show the refresh time and pending sync state; never subscribe a teacher or parent to all students and rely on frontend filtering.

## 12. Notifications, reports, and common screen states

| Event | Intended recipients |
| --- | --- |
| Teacher approval needed | Super Admin |
| Section assignment or account activation | Relevant teacher/adult |
| Guardian link awaiting verification | Responsible teacher; requesting parent sees status |
| New learning assignment | Target students; linked parents if enabled |
| Practical assessment submitted | Assigned teacher |
| Published grade or feedback | Own student and actively linked parents |
| New section announcement | Selected authorized section audience |
| Content draft submitted / changes requested | Reviewer / author |
| Link or section access revoked | Affected adult; appropriate administrator/teacher |
| Participation withdrawn | Responsible teacher; relevant verified guardian/oversight process |

Email and device notifications should not embed detailed child results or student identifiers unnecessarily. Use a generic message and require authentication to read the detail. Simulated emergency activities use the separate in-app rules in section 7.9.

Every dashboard/list needs loading, empty, error/retry, permission-denied, suspended/revoked-access, and stale-data states. Charts need denominators and labels. A parent with no linked children and a teacher with no sections must see an actionable onboarding state.

Adult data lists can paginate and scroll within usable dashboards. The previously requested no-scroll layout applies to the sign-in, signup, and recovery screens; do not squeeze long reports or lesson content into unreadable fixed-height pages.

## 13. Backend and API responsibilities

The existing React/Vite project is the website frontend. The brief specifies Flutter for mobile but does not choose the backend language, database, mail provider, or hosting platform. Choose those separately; role requirements must not depend on a frontend-only mock.

Suggested endpoint families—not final route contracts:

| Area | Example responsibilities | Authorization boundary |
| --- | --- | --- |
| `/auth/*` | Adult verification/login/reset, session revocation, MFA. | Verified account/session and lifecycle rules. |
| `/admin/users`, `/admin/sections` | Adult provisioning, section assignments, governance. | Active Super Admin within deployment. |
| `/sections/{id}/students` | Token roster, credential issue, section progress. | Super Admin or assigned Teacher, action-specific. |
| `/guardian-links/*` | Invitation, redemption, verification, revocation. | Requesting Parent and responsible Teacher/Admin. |
| `/parents/me/children` | Linked-child summaries and reports. | Active guardian relationships, checked per child. |
| `/curriculum/*` | Versioned drafts, review, approved publication. | Author/reviewer scope; learner-safe read responses. |
| `/assignments/*` | Section assignments and availability. | Assigned Teacher; target Student on read. |
| `/students/enroll` | Class locator, individual credential, clearance checks. | Rate-limited enrollment validation. |
| `/students/me/*` | Own profile, progress, assignments, rewards, inbox. | Authenticated Student, server-derived identity. |
| `/attempts/*` | Start, submit, score, review, and retry. | Own Student submissions; assigned Teacher reviews. |
| `/reports/*` | Scope-bound report generation/download. | Same record permissions as normal reads. |
| `/lifecycle/*` | Verified defense-completion/deletion jobs. | Restricted administrator execution. |

Use server-derived actor IDs and scopes. Never trust an arbitrary `studentId`, `sectionId`, `role`, `score`, `xp`, or `parentId` supplied by the client as proof of access or achievement.

## 14. Security, privacy, and research lifecycle

### 14.1 Access and storage requirements

- Apply deny-by-default role and relationship checks on the backend, including exports, real-time channels, and content assets.
- Encrypt transport with HTTPS. Configure and verify the brief's AES-256 database encryption-at-rest requirement at the infrastructure layer; do not claim it based only on a frontend or database setting name.
- Store passwords using a suitable salted password-hashing scheme, not reversible encryption. Hash one-time credentials and reset tokens; expire and revoke them appropriately.
- Limit login, enrollment, invitation-redemption, and recovery attempts. Use recent reauthentication for sensitive administration.
- Do not log secrets, signed consent scans, identity mappings, complete private messages, or unnecessary device identifiers.
- Administrative logs use IDs and action metadata. Record detailed student-record access and exports; retain only the metadata needed for accountability.
- A revoked section assignment, guardian link, or session must cease to authorize future requests immediately.
- Local mobile data must be isolated per learner and removed on shared-device sign-out.
- Provide adult privacy information and a child-oriented explanation of the actual data handling. NPC Advisory 2024-03 concerns child-oriented transparency; a checkbox alone is not the full design. [NPC Advisory 2024-03](https://privacy.gov.ph/wp-content/uploads/2024/12/Advisory-2024.12.17-Guidelines-on-Child-Oriented-Transparency-w-SGD.pdf).

These requirements guide implementation. Compliance is assessed against actual deployment, approved research arrangements, and organizational practices; this document is not evidence that the platform is already compliant.

### 14.2 Participation withdrawal

Stop new learning-data collection when participation is withdrawn. Revoke student learning access and relevant guardian access, and coordinate handling of existing records through the approved study process.

Do not treat withdrawing one guardian link as automatic withdrawal of the child's participation. Keep the workflows distinct.

### 14.3 Final-defense deletion

The brief's policy is to delete raw simulation records, logs, and database metrics immediately after final thesis defense. Implement a verified **defense-completed lifecycle event**, not a generic browser button or an arbitrary retention duration.

Preparation before defense:

1. Inventory learning records, derived metrics, feedback, token/link associations, device caches, exports, object storage, replicas, and backups.
2. Establish a deletion procedure that includes those copies and prevents deleted learning records from reappearing after a restore.
3. Configure backup isolation/deletion or cryptographic erasure where supported; an uncontrolled backup expiration window cannot meet immediate deletion by itself.
4. Define an appropriately non-identifying deletion receipt and verification procedure.

On verified completion:

- Close student enrollment and stop new research-data collection.
- Execute deletion of raw attempts/events, learning metrics/progress, grades/feedback, rewards, research logs, and parent/student associations used for the study, under the documented inventory.
- Purge managed exports/caches and coordinate removal of previously downloaded research copies with their authorized holders.
- Verify database, object, replica, and backup handling; record failures and retry until resolved.
- Retain only a non-identifying deletion receipt under the approved policy. Do not preserve a hidden archive of deleted student results in an audit table.

Baseline educational content can remain available independently of student research data. Any retention of adult operational accounts or irreversibly anonymous thesis summaries needs an explicit approved policy; it is not an exception implied by this specification. Physical identity/consent records remain under the responsible school's/research authority's documented process.

## 15. End-to-end workflows

### 15.1 Launching a section

Super Admin provisions/approves Teacher → assigns section → Teacher verifies physical consent and creates student tokens → issues individual access slips → Student enrolls and assents → Teacher publishes approved assignments → Student completes both phases → backend scores → Teacher reviews/publishes feedback → authorized dashboards update.

### 15.2 Adding parent access

Parent verifies account → responsible Teacher verifies guardianship/consent offline → issues private invitation → Parent redeems → Teacher confirms intended account → link activates → Parent sees only the linked child → link revocation immediately removes that access.

### 15.3 Publishing a revised module

Teacher drafts revised content → previews learner screens → submits referenced protocol changes → authorized review and Super Admin approval → new immutable version published → Teacher assigns it to section → future attempts use that version → earlier attempts retain their original rules and results.

### 15.4 Reviewing an interrupted simulation

Student resumes/exits or submits with interruption metadata → backend marks data quality → Teacher sees the actual timeline → flags invalid timing or requests retake → published feedback explains the learning step → reporting excludes invalid intervals from reaction-time summaries.

### 15.5 Transferring a learner

Responsible Teacher requests transfer → Super Admin verifies target section/teacher → old active membership ends → target membership begins → old teacher's ordinary access ends → new teacher receives appropriate history → guardian relationships are reviewed for continued authorization → assignment history stays versioned.

## 16. Implementation order

| Stage | Deliverables | Completion gate |
| --- | --- | --- |
| 1. Identity and access | Backend account/session model, adult verification/recovery, controlled admin setup, role checks, section scope, token enrollment, consent and assent. | No protected record is available through frontend-only role selection or a classroom code. |
| 2. Administration and teaching | User directory, section management, token roster, approved curriculum versions, assignments, teacher dashboard. | Teachers can manage only assigned sections; student identity mapping stays offline. |
| 3. Student learning | Flutter navigation, narrated lessons, quizzes, simulations, interrupted-state handling, authoritative scoring/rewards. | Both learning phases work; submissions and rewards are deduplicated. |
| 4. Review and parent access | Teacher grade/feedback workflow, verified guardian links, parent dashboard, scoped announcements/reports. | Parents see only linked-child published data; pending/revoked links expose nothing. |
| 5. Analytics and operations | Version-aware charts, simulation timing review, export controls, approved randomized practice, audit and deletion operations. | Analytics definitions and final-defense deletion are demonstrably enforceable. |

Super Admin, Teacher, Parent, and Student are all part of the intended completed system. Staging is build order, not permission to omit required roles or either learning phase.

Deferred enhancements: open/direct chat, public leaderboards, full offline learning, multi-role adult accounts, automated emergency dispatch, real-world location tracking, and public student registration. None is required to satisfy the brief or the requested roles.

## 17. Acceptance criteria

### Role and relationship isolation

- Teacher A cannot retrieve Teacher B's section by changing a URL, request body, subscription, export filter, or attachment ID.
- Parent A cannot retrieve an unlinked child or the class roster, including when their invitation is pending or revoked.
- Student A cannot retrieve Student B's attempts, credentials, rewards, or feedback.
- Selecting `Super Admin` in a modified client does not create an administrator.
- Suspending an account, revoking a section/link, or rotating a credential blocks future authorized use of the revoked access.

### Learning and review correctness

- All fifteen modules have approved theoretical and practical assets before claiming full curriculum delivery.
- Module completion follows the published phase requirements and versioned mastery policy.
- Repeated submission of one attempt creates one authoritative result and one applicable award.
- A content/rubric update does not silently change historical results.
- Missing, interrupted, failed, pending-review, and published results remain distinguishable.
- Parent home checklists cannot change academic results or student rewards.
- Unpublished review notes and answer keys do not reach parent/student API responses.
- Randomized alerts are clearly simulated and never initiate actual emergency contact.

### Eligibility, privacy, and lifecycle

- Learning collection begins only after the required physical-consent verification and child assent.
- No default student-name/email/photo fields or digital identity master list are introduced.
- Parent linking has a reviewed participation/privacy arrangement and verified invitation process.
- Shared-device sign-out does not leave another learner's data visible.
- Child notices explain actual data use in understandable language.
- Final-defense deletion covers the inventoried research copies, metrics, logs, associations, and managed exports; restoration cannot revive deleted records.

### Interface quality

- Auth screens use the landing palette and fonts and fit supported viewports without requiring page scroll.
- Adult dashboards expose their actual scope and use readable tables/charts instead of compressing everything into one screen.
- Student activities use large tap targets, narration/captions, minimal text, and non-punitive feedback.
- Pending approval, missing sections/links, unavailable content, revoked access, network interruptions, and delayed feedback have clear states.

## 18. Decisions to finalize before live deployment

The defaults above permit implementation to proceed. The following require documented project decisions before using real participant data:

| Decision | Proposed direction |
| --- | --- |
| Parent extension versus the brief's identity policy | Adopt protected pseudonymous records, keep the physical master list offline, and review the parent-link extension in the study/privacy materials. |
| Student access credential and shared-device model | Private teacher-issued enrollment credential, revocable sessions, teacher-assisted recovery; never token-only access. |
| Safety-content reviewer | Named authorized review process for official protocols and educational assessment rules. |
| Official academic grading | Confirm school-approved weighting, thresholds, retakes, and whether the app's combined result is advisory or an academic grade. |
| Language and accessibility scope | Confirm available narration/caption languages, accessible timing alternatives, and supported device sizes. |
| Single pilot versus multiple schools | Single-school pilot first; enforce deployment IDs from the start. |
| Backend and infrastructure | Select stack, mail delivery, storage, hosting, encryption verification, and scoped update mechanism. |
| Defense completion and record disposal | Name the authorized verifier, define immediate-copy deletion/backup handling, and approve any adult-account or anonymous-summary retention. |

## 19. References

- [SYSTEM-BRIEF.pdf](SYSTEM-BRIEF.pdf), pages 1–2: primary project brief.
- User requirements in this workspace: three adult website roles and a student mobile app; landing-page palette/font consistency; no-scroll authentication screens.
- [NPC: Republic Act No. 10173 / Data Privacy Act](https://privacy.gov.ph/data-privacy-act/): referenced for personal/education-information definitions and privacy principles.
- [NPC Advisory No. 2024-03: Guidelines on Child-Oriented Transparency](https://privacy.gov.ph/wp-content/uploads/2024/12/Advisory-2024.12.17-Guidelines-on-Child-Oriented-Transparency-w-SGD.pdf): reference for the brief's child-transparency requirement.

The proposed features, boundaries, and defaults in this document are implementation design decisions. They must not be represented as additional statements made by the PDF or as an official endorsement of SafetyQuest.
