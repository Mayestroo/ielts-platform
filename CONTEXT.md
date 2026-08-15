# IELTS Exam Platform

An authentic exam simulation and preparation platform for language schools to conduct Computer-Delivered IELTS practice tests and proctored offline mock examinations.

## Users & Access

**Student**:
A registered learner who takes practice tests, participates in assigned offline mocks, and reviews post-exam analysis.
_Avoid_: Candidate, examinee, pupil, client.

**Grader**:
An authorized instructor or examiner who manually evaluates speaking performances and reviews or overrides automated writing scores.
_Avoid_: Teacher, examiner, evaluator, marker.

**Admin**:
A school staff member who manages users, authors tests and questions, schedules mock assignments, and oversees live exam sessions.
_Avoid_: Manager, supervisor, superuser.

**Tier**:
A user's subscription or access level (`Free`, `Gold`, `Premium`) that dictates entitlement to specific tests and platform capabilities.
_Avoid_: Plan, package, membership.

---

## Test Structure & Content

**Module**:
One of the four discrete language skill areas tested in IELTS: `Listening`, `Reading`, `Writing`, or `Speaking`.
_Avoid_: Subject, section type, skill track.

**Test**:
A complete assessment for a specific module containing an ordered sequence of Test Parts.
_Avoid_: Exam paper, test suite, quiz.

**Test Part**:
A distinct subdivided section of a Test (e.g., Part 1–4 for Listening, Part 1–3 for Reading, Task 1–2 for Writing).
_Avoid_: Section, passage, component, sub-test.

**Full Test**:
A standard test mode encompassing all constituent Test Parts executed in a single continuous session.
_Avoid_: Complete mock, whole exam.

**Split Test**:
A focused practice mode exposing a single individual Test Part for standalone practice.
_Avoid_: Mini-test, partial test, section practice.

**Question Group**:
A set of contiguous Questions sharing common instructions, stimulus context, or numbering range (e.g., "Questions 1–5").
_Avoid_: Question block, set, cluster.

**Shared Answer Pool**:
A configuration on a Question Group where multiple distinct numbered questions share a single set of mutually exclusive options (e.g., choosing two letters without repetition).
_Avoid_: Multi-answer pool, linked options.

**Question**:
An individual item within a Test Part requiring a student response, evaluated for points according to its question type.
_Avoid_: Problem, item, task.

**Question Payload**:
The strongly-typed polymorphic data schema defining interactive options, blanks, drag items, correct keys, and diagram hotspot coordinates for a Question.
_Avoid_: Question data, question content, item config.

**Word Limit**:
A strict constraint on short-answer and gap-fill items (e.g., "NO MORE THAN TWO WORDS") whose violation causes an automatic incorrect evaluation.
_Avoid_: Word count guard, length check.

---

## Exam Runtime & Workflow

**Exam Session**:
A discrete, server-tracked instance of a student attempting a Test or Offline Mock.
_Avoid_: Attempt, sitting, exam run.

**Self Practice**:
An unassigned, on-demand Exam Session initiated freely by a Student for a Full Test or Split Test with relaxed controls.
_Avoid_: Free practice, solo test, training mode.

**Offline Mock**:
A formal, admin-assigned exam session enforcing sequential multi-module progression (`Listening` → `Reading` → `Writing`) with proctoring and result release controls.
_Avoid_: Official mock, simulation exam, full mock.

**Assignment**:
An administrative directive allocating a specific versioned Offline Mock bundle to a Student or group with scheduled dates and submission deadlines.
_Avoid_: Allocation, task, homework.

**Answer**:
A student's recorded input for a single Question within an Exam Session, persisted with optimistic autosave and server-side versioning.
_Avoid_: Response, input value.

**Write-Ahead Buffer**:
A client-side persistent storage queue that records answer mutations immediately before asynchronous network transmission and reconciliation.
_Avoid_: Offline queue, local cache.

**Writing Submission**:
A student's completed essay for Writing Task 1 or Task 2, evaluated against standard IELTS band descriptors either automatically by AI or manually by a Grader.
_Avoid_: Essay submission, written text.

**Speaking Score**:
An evaluation recorded by a Grader for an interactive or recorded Speaking assessment against IELTS descriptors.
_Avoid_: Speaking result, interview mark.

**Control Channel**:
The high-priority real-time communication channel dedicated to authoritative timer synchronization, session lifecycle transitions, and administrative override commands.
_Avoid_: Command socket, priority line.

**Telemetry Channel**:
The lower-priority real-time communication channel dedicated to background heartbeats, focus/blur proctoring logs, and live monitoring metrics.
_Avoid_: Metric socket, background trace.

**Live Monitor**:
An administrative real-time dashboard displaying active exam sessions, elapsed time, network connectivity status, and proctoring violation alerts.
_Avoid_: Live view, proctor console, supervisor panel.

**Audit Log**:
An immutable record of security-sensitive and administrative actions, including session logins, focus loss events, and score overrides.
_Avoid_: Activity log, security trace, system history.

---

## Evaluation & Outcomes

**Band**:
The standardized IELTS 0–9 score metric assigned to individual modules and computed as an overall composite score according to official rounding conventions (.25 and .75 boundaries).
_Avoid_: Grade, mark, point score.

**Result Visibility**:
The release control policy determining whether results unlock immediately upon submission (`Immediate`) or remain held until authorized by an Admin (`Admin Release`).
_Avoid_: Publish state, reveal mode, score status.

**Test Analysis**:
The comprehensive post-exam review interface displaying question-level breakdowns, correct answers, contextual passage highlights, and pedagogical explanations.
_Avoid_: Review page, answers breakdown, score report.

**Certificate**:
A verifiable, downloadable credential generated upon completion and release of an Offline Mock, displaying individual module and overall bands.
_Avoid_: Diploma, result card, testimonial.
