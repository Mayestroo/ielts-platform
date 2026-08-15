# IELTS Mock Exam Platform — Full Development Plan for AI Coding Agent

## 0. Purpose of This Document
This is a specification and execution plan, not code. Hand this document to an AI coding agent (or engineering team) as the source of truth. It defines architecture, data model, feature behavior, UI/UX rules, anti-cheating requirements, and delivery phases for an IELTS preparation/exam platform used by a language school, with two panels: **User Panel** and **Admin Panel**.

Core constraints the agent must respect throughout:
- Concurrency target: **20–50 simultaneous exam-takers**, stable under load.
- **Network-resilient**: exam progress must survive connection drops/tab crashes without data loss.
- **Anti-cheating** is a first-class requirement, not an afterthought — build it into architecture, not bolted on.
- UI: light mode, **rounded corners everywhere** (no sharp/square corners), modern, no cartoonish stickers/emoji, disciplined typography and color palette, layout must closely mirror the **official IELTS Computer-Delivered Test (CDI)** interface.

---

## 1. Recommended Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js (React, TypeScript) | SSR for admin reports, CSR for exam runtime, strong ecosystem for drag-and-drop, good SEO for marketing pages if needed |
| State/exam runtime | Zustand or Redux Toolkit + local persistence layer | Predictable state for timers, answers, autosave queue |
| Styling | Tailwind CSS + a small design-token file | Enforces consistent rounded-corner, color, spacing system |
| Drag & Drop | `@dnd-kit/core` | Accessible, performant, works for heading-matching, sentence completion, diagram labeling |
| Backend | NestJS (Node.js, TypeScript) or Django REST Framework | Strong module boundaries (User, Test, Exam Session, Grading, Reporting), good for RBAC |
| Database | PostgreSQL | Relational integrity for tests/sections/questions/answers, JSONB for flexible question payloads |
| Cache/Realtime | Redis | Exam session state, timers, rate limiting, pub/sub for admin live-monitoring |
| Queue | BullMQ (Redis-backed) | Async jobs: OpenAI writing-checks, certificate PDF generation, report generation |
| File/audio storage | S3-compatible object storage (MinIO self-hosted or AWS S3) | Listening audio files, recorded speaking (if added later), certificates |
| Auth | JWT (short-lived access + refresh token, httpOnly cookies) + device/session binding | Needed for anti-cheating (single active session enforcement) |
| Writing evaluation | OpenAI API (server-side only, via queue worker) | Never call OpenAI from client; keeps prompts/keys secure and allows retry/backoff |
| Realtime layer | WebSocket (Socket.IO) or SSE | Timer sync, autosave acks, admin live proctoring dashboard, force-submit signals |
| Deployment | Docker Compose (or Kubernetes if the school plans to scale beyond one node) | Reproducible envs; separate containers for API, worker, web, Postgres, Redis |
| Monitoring | Prometheus + Grafana, or a hosted APM (Sentry for errors, Grafana Cloud for metrics) | Load target is small (20–50 users) but must be observable |

---

## 2. High-Level Architecture

1. **Web app (Next.js)** — two route groups: `/app/*` (user panel) and `/admin/*` (admin panel), separate auth guards and layouts.
2. **API service (NestJS)** — REST (or GraphQL if preferred) exposing modules: Auth, Users, Tests, Questions, ExamSessions, Assignments, Grading, WritingCheck, Reports, Certificates, Statistics.
3. **Exam Session Service** — the most critical subsystem. Owns: session creation, per-answer autosave, timer authority (server-side, not client-side), pause/resume on reconnect, force-submit on timeout, section-locking (flow enforcement for Offline Mock).
4. **Worker service** — consumes queue jobs: OpenAI writing grading, certificate PDF rendering, bulk report exports, audio transcoding (optional).
5. **PostgreSQL** — system of record.
6. **Redis** — ephemeral session state (current timer value, current section/part, live connection heartbeat) and pub/sub channel for admin live monitor.
7. **Object storage** — listening audio, images for reading (diagrams/maps), generated certificates/reports.

**Golden rule:** the exam timer and section-flow state live on the **server**, mirrored to the client for display. The client is never the source of truth for time remaining or which part is unlocked — this is central to anti-cheating and to crash recovery.

---

## 3. Data Model (Core Entities)

Design as relational tables in PostgreSQL. JSONB used only where content genuinely varies by question type.

### 3.1 Identity & Access
- **User**: id, full_name, phone/email, password_hash, role (`student`, `admin`, `teacher/grader`), tier (`free`, `gold`, `premium`), status, created_at.
- **Session/Device**: user_id, device_fingerprint, ip, user_agent, issued_at, revoked_at — used to enforce single active exam session per user.

### 3.2 Test Content
- **Test**: id, module (`listening`|`reading`|`writing`), title (e.g. "Listening Test 1"), type (`full`|`split`), tier (`free`|`gold`|`premium`), status (`draft`|`published`|`archived`), created_by, version.
- **TestPart**: id, test_id, module, part_number (1–4 for Listening, 1–3 for Reading, 1–2 for Writing), audio_url (listening), passage_text/rich_content (reading), prompt/image_url (writing task 1 chart etc.), order_index.
  - A "Full" test = 1 Test row containing 4 (or 3, or 2) TestPart rows in sequence.
  - A "Split" test (e.g. "Listening Test 1 – Section 2") = same TestPart content exposed as its own standalone Test entity of type `split`, referencing the same underlying part content (avoid data duplication: split tests reference `TestPart` records, they don't copy them).
- **Question**: id, test_part_id, question_type (see §7), order_index, question_group_id (for shared-instruction groups like "Questions 1–5"), payload (JSONB: options, blanks, drag items, correct answers, highlight zones, diagram hotspots), points, explanation_text (for Test Analysis feature).
- **QuestionGroup**: id, test_part_id, instruction_text, question_type, range_label (e.g. "Questions 14–20").

### 3.3 Exam Sessions & Answers
- **ExamSession**: id, user_id, session_type (`self_practice`|`offline_mock`), module_flow (ordered list: listening→reading→writing for Offline Mock), status (`not_started`|`in_progress`|`paused_disconnected`|`submitted`|`force_submitted`|`expired`), started_at, server_time_remaining, current_part_id, result_visibility (`immediate`|`admin_release`), released_at.
- **ExamSessionPart**: session_id, test_part_id, status, started_at, ended_at, time_spent_seconds.
- **Answer**: id, session_id, question_id, answer_value (JSONB — text, selected option ids, drag-drop mapping, highlighted ranges), is_correct (nullable until graded), autosaved_at, answer_version (increment on every change, to detect conflicting writes).
- **WritingSubmission**: id, session_id, question_id (task 1 or 2), essay_text, word_count, ai_score_breakdown (JSONB: Task Response, Coherence & Cohesion, Lexical Resource, Grammar), ai_feedback_text, overall_band, graded_at, model_version.
- **SpeakingScore** (manual, if speaking module is included later): id, session_id, examiner_id, part_scores (JSONB), overall_band, notes.

### 3.4 Assignment (Offline Mock)
- **Assignment**: id, user_id, assigned_by (admin_id), test_bundle (references the Listening/Reading/Writing full tests forming the mock), scheduled_at, deadline, result_visibility_override, status.

### 3.5 Reporting/Certificates
- **Certificate**: id, user_id, exam_session_id or assignment_id, overall_band, module_bands (JSONB), issued_at, pdf_url, certificate_number (unique, verifiable).
- **AuditLog**: id, actor_id, action, entity, entity_id, meta(JSONB), created_at — required for anti-cheating forensics and admin accountability.

---

## 4. User Panel — Detailed Feature Spec

### 4.1 Navigation Structure
Four top-level areas: **Listening**, **Reading**, **Writing**, **Offline Mock**, plus **My History**, **My Results/Analysis**, **Profile**.

### 4.2 Section Catalogs (Listening / Reading / Writing)
- List view grouped by "Test N" (e.g., "Listening Test 1", "Listening Test 2", ...).
- Each Test card expands or links to its variants:
  - **Full Test** (all parts in one timed session, exactly like the real exam).
  - **Split Tests**: "Listening Test 1 — Part 1", "— Part 2", "— Part 3", "— Part 4" as independently startable, shorter practice sessions.
- Each card shows a **tier badge**: Free / Gold / Premium. Locked tiers show an upgrade prompt instead of a Start button; access is enforced **server-side** on session creation, not just hidden in the UI.
- Filters: module, tier, completed/not completed, difficulty (optional future field).

### 4.3 Offline Mock Flow
- Not self-selected by the user — appears in their dashboard **only when an admin assigns it** (`Assignment` entity).
- Fixed sequential flow enforced by the server: **Listening → Reading → Writing**, no skipping ahead, no returning to a completed module once submitted (matches real exam behavior).
- A countdown/scheduling banner shows when the mock is scheduled and its deadline.
- On start, the session locks to that flow; leaving mid-module pauses the timer server-side and requires resume within a grace window (see §9 network resilience) rather than losing progress.

### 4.4 Exam Runtime (applies to both self-practice and Offline Mock — see full UI spec in §6)

### 4.5 Test Analysis (post-submission)
For every completed test (self-practice or mock, once results are released):
- Per-question breakdown: your answer vs. correct answer, correct/incorrect flag, and an **explanation** (from `Question.explanation_text`) describing why the correct answer is correct and, where feasible, the likely reasoning trap.
- Section/part-level score summary and estimated band.
- For Reading/Listening: link back into the original passage/audio with the relevant answer location highlighted, so the user can review in context.
- For Writing: full AI feedback breakdown by the four IELTS criteria with actionable suggestions.
- Time-spent analytics per part/question (helps identify pacing issues).

### 4.6 Result Visibility Control (Offline Mock)
- `Assignment.result_visibility_override` (or session-level `result_visibility`) has two modes:
  - **Immediate**: results/analysis unlock the moment the user submits.
  - **Admin release**: results stay hidden ("Pending review") until an admin explicitly releases them (e.g., after manual speaking/writing check or to release results simultaneously to a whole cohort). Admin action sets `released_at` and triggers a notification.
- This must default to **admin release** for Offline Mock (mirrors real test centers releasing results together) but be configurable per assignment.

### 4.7 History
- Chronological list of all attempts across Listening/Reading/Writing (self-practice + mocks), with date, test name, score/band, status (submitted/expired/pending release).
- Filterable by module and date range; clicking an entry opens Test Analysis (§4.5).

### 4.8 Writing Checker (OpenAI Integration)
- Flow: user submits essay → `WritingSubmission` created with status `pending` → job pushed to queue → worker calls OpenAI API server-side with a structured grading prompt (IELTS band descriptors for Task 1 and Task 2 separately) → response parsed into the four-criteria breakdown + overall band + feedback text → stored, submission status `graded` → user notified.
- Must never block the UI: user sees "Your essay is being evaluated" and can navigate away; a notification/badge shows when ready.
- Rate limiting and cost control: queue concurrency capped, retries with exponential backoff on API errors, and a fallback "manual review requested" path if OpenAI fails repeatedly (routes to admin for manual grading).
- Admin can override/edit AI-generated writing scores (AI is an assistant to the human process, not a final authority the school is legally bound by).

---

## 5. Admin Panel — Detailed Feature Spec

### 5.1 User CRUD
- List/search/filter users (by tier, role, activity, registration date).
- Create/edit/deactivate/delete (soft-delete preferred, keep exam history intact via FK constraints with `ON DELETE RESTRICT` or archiving instead of hard delete).
- Bulk actions: bulk tier upgrade, bulk assignment to a mock.
- View a user's full profile: history, assignments, certificates, notes.

### 5.2 Test CRUD (must be very thorough — this is the content backbone)
- **Test builder** supporting:
  - Create a Test (module, title, tier, type full/split).
  - Add/reorder Parts within a Test (drag-to-reorder part sequence).
  - Rich content editor per part: passage text with formatting (bold/italic/paragraph breaks) for Reading; audio upload + auto-duration detection for Listening; prompt + optional chart/image upload for Writing Task 1.
  - **Question builder** supporting all question types in §7, with live preview matching the actual exam renderer (WYSIWYG — what admin builds is exactly what students see).
  - Question grouping with shared instructions and numbering ranges (auto-numbering across the whole test, not per part).
  - Answer-key entry per question + `explanation_text` field (mandatory for Test Analysis feature).
  - Versioning: editing a published test that already has submissions creates a new version rather than mutating historical data (protects analysis-page integrity for past attempts).
  - Duplicate/clone a test (useful for creating split variants from a full test, or creating a similar test quickly).
  - Publish/unpublish/archive workflow with draft preview.
  - Import/export (CSV/JSON) for bulk question entry, to speed up content migration from existing materials.
  - Validation before publish: every question has an answer key, audio files exist and play, no orphaned question groups, numbering has no gaps/duplicates.

### 5.3 Assignment
- Create an Offline Mock assignment: select user(s) or a group/cohort, select the Listening+Reading+Writing test bundle, set schedule window/deadline, set result-visibility mode.
- View assignment status per user (not started / in progress / submitted / expired).
- Reassign or extend deadline; cancel assignment.

### 5.4 Manual Speaking / Writing Grading Console
- Queue of items needing human grading (speaking always manual; writing when AI grading failed or admin chooses manual override).
- Score entry against IELTS band descriptors per criterion, notes field, and final band.
- Audio playback interface if speaking recordings are stored (design the schema now — `SpeakingScore`/audio URL — even if speaking module ships later).

### 5.5 Per-User Results
- Full result history per user, module bands, overall band trend over time (chart), comparison across attempts.
- Ability to release/hold results (ties into §4.6).

### 5.6 Reports
- Cohort-level reports: average band by module, most-missed question types, completion rates, tier distribution.
- Exportable to PDF/Excel.
- Scheduled/automated report generation via the worker queue for large exports (avoid blocking the request thread).

### 5.7 Certificates
- Generate a downloadable PDF certificate for a completed (and released) mock/test, with overall band, module bands, user name, date, unique verification number/QR code.
- Template should be editable by admin (logo, center name, signature image) without code changes — store as a configurable template record.

### 5.8 Statistics Dashboard
- Live counters: active exam sessions right now (ties into live-monitoring, §8), total users by tier, tests completed this week/month, average band trend.
- Charts: band distribution histogram, module performance breakdown, most common wrong-answer question types (content-quality feedback loop for admins improving materials).

---

## 6. Exam Page UI/UX Specification (must match IELTS CDI closely)

### 6.1 Header
- **Left**: platform/school logo.
- **Right**: 
  - Countdown timer (server-authoritative value, client just renders a local ticking display synced every N seconds via WebSocket/poll; never trust a client-only timer).
  - Settings menu (icon, not a big colorful button): 
    - Font size control (small/medium/large — persists per user).
    - Color/theme palette switcher (a few accessible palettes, still light-mode family — e.g., default white, soft grey, high-contrast — matches real IELTS accessibility options).

### 6.2 Main Exam Area — three-pane layout (Reading/Listening with text)
- **Left pane**: source content (reading passage text, or nothing/audio-only indicator for Listening — see 6.4).
- **Middle**: a **draggable resizer bar** (splitter) letting the user adjust the left/right pane width ratio; persist the last-used ratio in local state for the session.
- **Right pane**: questions for the currently active Part, scrollable independently from the left pane.

### 6.3 Bottom Part Navigator (persistent footer bar)
- Segmented control: **Part 1 | Part 2 | Part 3 | (Part 4 for Listening) | Submit (checkmark icon)**.
- Clicking a part switches the right-pane question view to that part's questions (and left-pane content, for Reading) — this must respect flow-locking rules for Offline Mock (can't jump to a part not yet reached, if the exam design requires linear progression; for self-practice, free navigation is fine).
- Within the active part, a **question-number strip** appears (e.g., numbers 1–10 when Part 1 is active): each number is clickable to jump/scroll to that question, and turns **green** once that question has an answer recorded (matches real IELTS "answered" indicator). Unanswered = neutral/grey. Currently-focused question = distinctly outlined/highlighted, not colored green until actually answered.
- **Submit** button (checkmark icon) triggers a confirmation modal summarizing answered/unanswered count before final submission; disabled/relabeled appropriately if this is a part-submit vs. whole-test-submit depending on flow.

### 6.4 Module-Specific Layout Differences
- **Listening**: no left content pane (audio plays via a persistent, minimal audio bar — no scrubbing/rewind if replicating real exam rules, or allow it if this is practice-only; make this configurable per test since real IELTS listening plays once). Right pane still shows questions; part navigator behaves the same.
- **Reading**: left = passage text (with in-passage highlighting support, see §7), right = questions, resizer between them as in §6.2.
- **Writing**: left pane = task prompt (and chart/image for Task 1), right pane = a plain rich-text writing field with a live word counter (IELTS requires minimum word counts — surface this, e.g., "187/150 words," turning a subtle color when under the minimum). No resizer complexity needed here beyond the same two-pane skeleton for visual consistency.

### 6.5 Design System Rules
- **Corners**: consistent rounded-corner radius token (e.g., 8–12px) applied to all cards, buttons, inputs, modals — never sharp/square corners anywhere in the product.
- **Color palette**: a small, disciplined palette — one primary accent (used sparingly for primary actions and the "answered" green indicator), neutral greys for structure, white/near-white background (light mode only). No gradients-as-decoration, no illustrative stickers/emoji/mascots anywhere in the exam UI. Admin panel may have slightly more color for data visualization (charts) but stays within the same restrained palette family.
- **Typography**: one type family, a clear scale (e.g., 4–5 sizes total: caption, body, subtitle, heading, display), generous line-height for reading passages specifically (readability during a 60-minute reading test matters).
- **Motion**: minimal, purposeful transitions only (pane resize, part switch, modal open) — no decorative animation during timed exam screens, since it can be distracting or exploited to hide something.

---

## 7. Question Types & Interactions

Support the full standard IELTS question-type catalog; the JSONB `Question.payload` schema should be typed per kind (define TypeScript discriminated unions / Pydantic models per type on the backend, matched by a `renderer` component per type on the frontend):

| Question Type | Interaction |
|---|---|
| Multiple choice (single answer) | Radio buttons |
| Multiple choice (select N of M) | Checkboxes with a max-selection guard |
| Matching headings | **Drag-and-drop**: paragraph labels in left/passage margin, heading options in a right-side bank; user drags a heading onto a paragraph target. Must support click-to-select as an accessible/alternate input method too (not everyone can drag precisely, and it's a fallback if drag fails on flaky connections). |
| Matching information/features | Drag-and-drop, same pattern as above, generalized to a "match item bank to target list" component |
| Sentence completion / gap fill | Inline text input within the sentence, or drag-word-into-blank variant depending on test design |
| Summary completion (word bank) | **Drag-and-drop** words/phrases from a bank into blanks in a summary paragraph |
| Table/flow-chart/diagram completion | Inline inputs or drag targets positioned over an image (diagram hotspot coordinates stored in payload) |
| Short-answer questions | Free-text input with a word-limit hint (e.g., "no more than two words") |
| True/False/Not Given, Yes/No/Not Given | Three-way radio/segmented control |
| Highlighting | Text-selection tool over the passage: user selects a span, it's visually highlighted and stored as a text-range annotation tied to the question or as a free-form note tool; must persist highlights per session and restore them on reconnect/resume |

Build drag-and-drop with `@dnd-kit` so it works reliably on both desktop and touch devices, with keyboard-accessible fallback (select source, select target, confirm) — required both for accessibility and as an anti-glitch fallback under poor network conditions where drag events might be janky.

---

## 8. Anti-Cheating & Security Requirements

This is an exam platform — treat every client-side value as untrusted.

1. **Server-authoritative timer**: countdown lives server-side (Redis-backed per session); client only displays it. On submit, server clamps to the real elapsed time; if time already expired server-side, force-submit with whatever answers were last autosaved.
2. **Single active session enforcement**: a user cannot have two active exam sessions (same or different device) simultaneously — starting a new one invalidates/logs out the old one, and this event is written to `AuditLog`.
3. **Tab/window visibility & focus tracking**: log `visibilitychange`/`blur` events with timestamps to `AuditLog` (not necessarily auto-fail, but gives admins a flagged-activity report per session — e.g., "left the exam tab 6 times, total 90s away"). Surface this as a "suspicious activity" flag on the admin results page, not a silent auto-penalty (avoid false positives from legitimate app-switch e.g. accidental notification).
4. **Copy/paste and right-click restrictions** on exam content areas (passages, questions) — disable text selection copy on the reading passage except through the sanctioned highlight tool; disable browser context menu inside the exam runtime.
5. **Disable printing / screenshot-friendly leaks** where feasible (note: screenshots can't be fully prevented client-side — document this limitation honestly rather than over-promising).
6. **Full-screen enforcement (optional but recommended)**: prompt/require full-screen mode during Offline Mock sessions; log exits from full-screen.
7. **Answer integrity**: every autosave call is authenticated, session-scoped, and versioned (`answer_version`) — reject stale/out-of-order writes, and rate-limit per session to block scripted answer injection.
8. **Device fingerprint + IP logging** per session for forensic review, without being invasive (no webcam proctoring in this scope, but leave the architecture open to add it later, e.g., a `ProctoringEvent` table).
9. **Content protection**: audio files served via short-lived signed URLs (not permanent public links) so links can't be shared/downloaded persistently. Question payloads for parts not yet reached (in a linear Offline Mock flow) are **not sent to the client at all** until that part unlocks — this closes the "inspect network tab to see future answers/questions" hole, which is one of the most important anti-cheating measures.
10. **Rate limiting & bot protection** on auth and answer-submission endpoints (Redis-based rate limiter), plus standard protections: CSRF tokens, httpOnly+secure cookies, password hashing (argon2/bcrypt), input validation on every endpoint, RBAC middleware checked server-side on every request (never trust a hidden admin-only button in the UI as the actual gate).
11. **Live monitoring (admin)**: an admin-facing live dashboard (via WebSocket/Redis pub-sub) showing currently active exam sessions, elapsed/remaining time, and any flagged events in real time, so a supervisor can intervene during an Offline Mock.

---

## 9. Network Resilience & Offline-Interruption Handling

1. **Autosave on every answer change**, debounced (e.g., 1–2s after the user stops interacting) plus a periodic heartbeat save (e.g., every 15–20s) regardless of change, so partial state is never far from persisted.
2. **Local write-ahead buffer**: answers are written to an in-memory/local queue immediately on change (instant UI feedback) and flushed to the server asynchronously; if the network call fails, retry with exponential backoff and keep the item queued — never lose an answer just because one request failed.
3. **Local persistence fallback (IndexedDB, not localStorage due to size)**: mirror the pending-write queue to IndexedDB so that a full page reload/crash mid-exam can rehydrate un-flushed answers once connectivity returns — explicitly requested to be resilient to "internet uzilishlari" (internet drops).
4. **Reconnection flow**: on regaining connectivity, the client re-authenticates the session, pulls the authoritative server state (current time remaining, current unlocked part, last-known-good answers), reconciles with any locally-queued unsynced answers (by `answer_version`, last-write-wins per question but never silently drop data — surface a merge/confirm step only if there's a genuine conflict), and resumes.
5. **Grace period on disconnect**: if a session goes silent (no heartbeat) for more than a defined threshold (e.g., 60–90s), server marks it `paused_disconnected` and **pauses the authoritative timer** rather than continuing to burn exam time against a student stuck on a bad connection — configurable grace window (e.g., up to 5 minutes) after which it resumes counting down or admin is alerted to manually extend, per school policy.
6. **Visual connectivity indicator**: a small, calm status indicator (not alarming) showing "Saved" / "Saving..." / "Offline — will retry" so the user isn't left guessing whether their work is safe.
7. **Idempotent submit**: final submission is idempotent (safe to retry) — if the submit request is sent but the response is lost due to a drop, retrying it must not create duplicate submissions or corrupt state.

---

## 10. Scalability & Performance (20–50 Concurrent Users)

This load is modest, but the architecture should avoid obvious bottlenecks:

1. **Connection pooling** on Postgres (PgBouncer if needed) — at this scale a single well-configured instance is sufficient, but pooling avoids connection exhaustion from many short-lived API calls plus WebSocket connections.
2. **Redis for hot-path state** (timers, session heartbeat, live-monitor pub/sub) instead of hitting Postgres on every tick — keeps DB load low and read/write latency for exam-critical operations minimal.
3. **Stateless API instances** behind a load balancer (even if only 1–2 instances are needed at this scale) so horizontal scaling is a config change, not a rewrite, if the school grows.
4. **Audio/static assets via CDN or at least object storage with proper caching headers**, not served through the API process.
5. **Background jobs isolated in a worker process/pool** (OpenAI grading, PDF/certificate generation, bulk reports) so heavy or slow operations never block exam-critical request paths.
6. **Load testing before go-live**: simulate 50 concurrent exam sessions each autosaving every 15–20s plus periodic timer syncs, and verify p95 latency on the autosave endpoint stays low (target sub-300ms) and no dropped WebSocket connections under sustained load.
7. **Database indices** on all frequent lookup paths: `answer(session_id, question_id)`, `exam_session(user_id, status)`, `assignment(user_id, status)`, etc. — define explicitly during schema implementation, don't rely on defaults.
8. **Graceful degradation**: if Redis is temporarily unavailable, the system should fail toward "pause and protect data" (see §9.5 pattern) rather than silently losing timer/session integrity.

---

## 11. Suggested Delivery Phases

**Phase 1 — Foundations**
- Auth (roles: student/admin/grader), base DB schema, Docker Compose environment, design system tokens (colors, radius, typography) implemented as a shared Tailwind config.

**Phase 2 — Admin Content Pipeline**
- Test CRUD (full builder for all question types), Test versioning/publish flow, User CRUD, Assignment creation. Content must exist before the exam runtime can be meaningfully tested.

**Phase 3 — Exam Runtime (the core of the product)**
- Exam session lifecycle (server-authoritative timer, part-locking), all question-type renderers, autosave + offline-resilience layer (§9), header/settings (font size, theme), part navigator with answered-indicator, resizer pane, submit flow.

**Phase 4 — Anti-Cheating Hardening**
- Single-session enforcement, focus/visibility logging, signed media URLs, part-content lazy delivery, rate limiting, audit logging, admin live-monitor dashboard.

**Phase 5 — Grading & Analysis**
- Writing checker (OpenAI queue integration), Test Analysis page (explanations, review-in-context), manual speaking/writing grading console, result-visibility release controls.

**Phase 6 — Reporting & Certificates**
- Per-user results, cohort reports (export), statistics dashboards, certificate template + PDF generation with verification numbers.

**Phase 7 — Load Testing, Polish, Launch**
- Simulate 50 concurrent sessions, fix bottlenecks, full UI QA against the IELTS-CDI visual reference, accessibility pass (keyboard fallback for drag-drop, font scaling, contrast), final security review.

---

## 12. Non-Functional Requirements Checklist (for the agent to self-verify)

- [ ] No exam-critical value (timer, unlocked part, correctness) is ever trusted from the client.
- [ ] Every answer write is versioned, idempotent, retried on failure, and mirrored locally until confirmed synced.
- [ ] Future/unreached exam parts are not present in the client payload at all.
- [ ] All destructive/administrative actions are RBAC-checked server-side, not just hidden in the UI.
- [ ] All corners in the UI use the shared rounded-radius token; no sharp corners anywhere.
- [ ] Color palette limited and consistent; no stickers/emoji/mascots in the exam or results UI.
- [ ] Drag-and-drop question types have a keyboard/click-based accessible fallback.
- [ ] OpenAI calls happen only server-side, in a queue, with retries and a manual-review fallback.
- [ ] System tested at 50 concurrent exam sessions with acceptable p95 latency before launch.
- [ ] Every admin action affecting a user or their results is written to `AuditLog`.
