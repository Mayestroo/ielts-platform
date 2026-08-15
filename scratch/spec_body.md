# Spec: IELTS Computer-Delivered Mock Exam & Preparation Platform

## Problem Statement

Language schools and test preparation centers require an authentic, high-fidelity Computer-Delivered IELTS (CDI) simulation platform for both self-directed student practice and supervised cohort mock exams. Existing solutions frequently suffer from client-side timer manipulation, cheating vulnerabilities (tab-switching, answer inspection), catastrophic data loss during transient network interruptions, and disconnected manual grading workflows. Additionally, schools lack automated yet instructor-moderated writing evaluation and centralized cohort performance analytics.

## Solution

A robust, enterprise-grade IELTS preparation and examination platform comprising:
1. **User Panel (Next.js)**: Pixel-perfect IELTS CDI exam runtime (custom splitter, keyboard-accessible drag-and-drop, persistent audio bar, in-passage text highlighting, and real-time word counters) with an optimistic IndexedDB write-ahead buffer that guarantees zero data loss during network drops.
2. **Admin & Grader Panel (Next.js)**: Full WYSIWYG test authoring for all IELTS question types, immutable test versioning, cohort assignment scheduling, real-time exam session live monitoring with anti-cheating alerts, and human-in-the-loop writing/speaking grading queues.
3. **Backend API & Real-time Layer (NestJS + Socket.IO + PostgreSQL + Redis + BullMQ)**: Server-authoritative timer management, dual-channel WebSocket communications (prioritized Control vs. background Telemetry), JIT presigned media delivery, asynchronous AI writing evaluation using OpenAI, and automated IELTS band calculations.
4. **Shared Domain Core (Turborepo Monorepo)**: End-to-end type safety via Zod-driven polymorphic question schemas and deterministic IELTS scoring utilities.

---

## User Stories

### 1. Identity, Access & Subscriptions
1. As a student, I want to register and log in with email/phone and password, so that my practice progress and exam history are securely tracked.
2. As a student, I want my active exam session to prevent concurrent logins from other devices, so that my test integrity cannot be compromised.
3. As a student, I want to see my subscription tier (Free, Gold, Premium) and know which tests are unlocked, so that I can practice within my entitlement.
4. As an admin, I want to manage student accounts, update tiers in bulk, and review individual test attempt logs, so that I can support students effectively.
5. As an admin, I want an immutable audit log of all sensitive actions (score overrides, logins, session terminations), so that administrative accountability is guaranteed.

### 2. Test Content Authoring & Management
6. As an admin, I want to create and manage Tests across Listening, Reading, and Writing modules with full and split variants, so that students have diverse practice materials.
7. As an admin, I want to organize Test Parts with rich text passage formatting, audio uploads, and prompt charts, so that materials match real exam formats.
8. As an admin, I want to create Question Groups with shared instructions and contiguous numbering (e.g., Questions 1–5), so that questions follow official structures.
9. As an admin, I want to build all standard IELTS question types (Multiple Choice, Matching Headings, Gap Fill, Summary Completion, Diagram Labeling, True/False/Not Given) with live WYSIWYG preview, so that content authoring is intuitive and error-free.
10. As an admin, I want to configure shared answer pools for multi-letter questions (e.g., "Choose TWO letters"), so that options are mutually exclusive in the student UI.
11. As an admin, I want to provide normalized answer keys and mandatory pedagogical explanations per question, so that students can learn from their mistakes in Test Analysis.
12. As an admin, I want published tests that already have student attempts to create a new immutable draft version on edit, so that historical attempt integrity is never corrupted.

### 3. Exam Scheduling & Assignments
13. As an admin, I want to create an Offline Mock assignment by selecting student cohorts, test bundles (Listening + Reading + Writing), schedule windows, and result visibility policies, so that formal mock exams are organized effortlessly.
14. As an admin, I want assignments to pin to specific test version numbers at creation time, so that live mocks remain completely isolated from future content updates.
15. As a student, I want to see my assigned Offline Mocks with countdown schedules and deadlines on my dashboard, so that I can prepare and start on time.

### 4. Exam Runtime & Student Experience
16. As a student, I want a CDI interface closely mirroring the official IELTS exam (light theme, rounded corners, clean typography, no distractions), so that I experience authentic exam conditions.
17. As a student, I want an independently scrollable split-pane layout with a draggable resizer bar in Reading and Writing, so that I can comfortably review source texts while answering questions.
18. As a student, I want a bottom Part Navigator with a question-number strip that turns green once answered, so that I can easily track my progress across the test.
19. As a student, I want to highlight text within reading passages and have my highlights persist across reloads, so that I can annotate key information.
20. As a student, I want drag-and-drop questions to support both mouse/touch dragging and click-to-select fallbacks, so that I can input answers quickly and accessibly.
21. As a student, I want the Writing module to provide a real-time word counter with minimum threshold indications (150/250 words), so that I know if I have met length requirements.
22. As a student, I want a submission confirmation modal summarizing answered and unanswered question counts before final submit, so that I do not accidentally submit an incomplete test.

### 5. Audio Playback & Synchronization
23. As a student in an Offline Mock, I want the Listening audio to play once continuously with server-synchronized timing, so that the simulation matches official test rules.
24. As a student in an Offline Mock, I want only volume adjustments available without pause/rewind controls, so that listening integrity is preserved.
25. As a student in Self Practice, I want full audio playback controls (play, pause, 10s scrub, speed control), so that I can practice listening at my own pace.
26. As a student whose browser refreshes during Listening, I want the audio to automatically resume from the server's elapsed timestamp without recovering lost time, so that fairness is preserved without manual intervention.

### 6. Anti-Cheating & Live Proctoring
27. As a student in an Offline Mock, I want future locked parts to remain completely unavailable over the network until unlocked, so that answers cannot be inspected via developer tools.
28. As a student, I want audio and media URLs to be delivered via short-lived presigned URLs strictly for my active part, so that media files cannot be shared or downloaded permanently.
29. As a student, I want to receive a clear warning modal if I switch tabs or exit fullscreen, so that I am reminded of exam rules without being unfairly auto-disqualified.
30. As an admin, I want a real-time Live Monitor dashboard displaying active student sessions, elapsed timers, connection states, and proctoring violation alerts, so that I can oversee offline exams.
31. As an admin, I want to receive an escalated WebSocket alert when a student triggers 3+ tab switches, so that I can investigate and take supervisory action.
32. As an admin, I want the exclusive authority to grant extra time or force-submit an exam session from the Live Monitor, so that human discretion governs serious infractions.

### 7. Network Resilience & Offline Rehydration
33. As a student experiencing transient network drops, I want my answers saved immediately to a local IndexedDB write-ahead buffer, so that no answer is lost.
34. As a student, I want my client to automatically retry unsynced answers with exponential backoff and update a calm status indicator ("Saved" / "Saving..." / "Offline - will retry"), so that I have peace of mind.
35. As a student whose browser crashes mid-exam, I want the page reload to instantly rehydrate from IndexedDB and silently reconcile versions with the server, so that I can resume answering without disruptive conflict dialogs.
36. As an admin, I want Offline Mock timers to enforce continuous wall-clock countdown with a 20-second network tolerance window before logging prolonged disconnections, so that Wi-Fi disconnections cannot be exploited for extra thinking time.
37. As a student in Self Practice, I want my timer to pause automatically during network disconnections, so that my practice session is not penalized by connectivity issues.
38. As the system, I want abandoned disconnected sessions exceeding the exam duration plus a 30-minute grace window to automatically expire, so that account locks are released safely.

### 8. Writing & Speaking Evaluation
39. As a student submitting an essay in Self Practice, I want immediate automated AI evaluation with criteria breakdown (Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy) and actionable feedback, so that I can improve my writing instantly.
40. As a student in an Offline Mock, I want my writing evaluation to undergo instructor review before release, so that my school's official results maintain human accuracy.
41. As a grader, I want a dedicated grading console to review pending AI writing scores, edit individual criteria bands, input feedback, and approve final scores, so that grading is fast and consistent.
42. As a grader, I want to input Speaking scores across Fluency, Lexical Resource, Grammar, and Pronunciation with notes, so that full 4-module results can be computed.
43. As an admin, I want AI model identifiers to be dynamically configurable per mode (lightweight for self-practice, advanced for mocks) without code deployments, so that models can be updated seamlessly.

### 9. Results, Analytics & Certification
44. As a student, I want to access a detailed Test Analysis page post-release displaying per-question correctness, correct answers, in-context passage highlights, and pedagogical explanations, so that I understand where I made mistakes.
45. As a student, I want my overall band score calculated according to official IELTS rounding rules (.25 and .75 round up), so that my score matches official standards.
46. As an admin, I want the ability to hold Offline Mock results until all module scores (including speaking/writing) are finalized, and release results to the cohort simultaneously.
47. As a student completing an Offline Mock, I want to download a verifiable PDF certificate with overall and module band scores and a verification QR code, so that I can share my achievement.
48. As an admin, I want cohort analytics showing average bands by module, most-missed question types, and completion rates, so that teachers can refine their curriculum.

---

## Implementation Decisions

### Monorepo Structure & Package Boundaries
- **Monorepo (Turborepo + pnpm workspaces)**:
  - `apps/web`: Next.js (App Router), React, Tailwind CSS, Zustand, Dexie.js (`idb`), `@dnd-kit/core`.
  - `apps/api`: NestJS, Prisma ORM, Socket.IO gateway, BullMQ queue producer/consumer, Passport/JWT auth.
  - `packages/shared-types`: Zod schemas, inferred TypeScript types (`z.infer<>`), IELTS band rounding utility, scoring constants.
- **Database & Storage**: PostgreSQL (system of record with JSONB for question payloads and answer values) + Redis (ephemeral timer states, rate limiting, pub/sub, queue backend) + S3/MinIO (object storage).

### Domain & Runtime Architecture
- **Type-Safe Polymorphic Schemas (ADR 0012)**: Every question type (`multiple_choice`, `matching_headings`, `gap_fill`, `summary_completion`, `diagram_labeling`, `true_false_not_given`) and answer payload is strictly validated via Zod schemas on both frontend renderers and backend ingestion endpoints.
- **Question Granularity & Shared Answer Pools (ADR 0006)**: Questions are modeled 1:1 with standard IELTS question numbers (1..40). Question groups with shared letters utilize `answer_pool_shared: true` to enforce UI mutual exclusivity.
- **Offline Write-Ahead Buffer (ADR 0007)**: Client mutations write synchronously to Zustand and IndexedDB (Dexie.js), flushing asynchronously to the API with `answer_version` tracking. Reload rehydrates locally first, reconciling silently without user-facing conflict modals.
- **Server-Authoritative Timer & Network Policy (ADR 0002)**: Redis-backed countdown. Offline Mock enforces wall-clock progression with 20s network tolerance. Disconnections >20s log to `AuditLog` and flag on Live Monitor. Time extensions are strictly admin-controlled.
- **Dual-Channel WebSockets (ADR 0009)**: Dedicated `Control Channel` (timer sync, admin commands, state changes) and `Telemetry Channel` (heartbeats, blur/focus logs, presence) to eliminate command queuing.
- **Human-in-the-Loop Anti-Cheating Escalation (ADR 0003)**: Focus loss triggers a warning modal (1–2 occurrences), escalating to a live WebSocket alert on the admin dashboard at 3+ occurrences. Automatic force-submits are strictly forbidden.
- **Single Active Session & Abandonment Protection (ADR 0014)**: Concurrent logins during active exam sessions are blocked with generic error messages. Disconnected sessions exceeding exam duration + 30m auto-expire.
- **Media Delivery & Security (ADR 0013, ADR 0005)**: Media files delivered via 60–90s TTL presigned URLs scoped strictly to currently unlocked Test Parts with client-side auto-refresh. Offline Mock enforces single audio playback without seek controls.
- **Dual-Tier AI Writing Evaluation (ADR 0004)**: Asynchronous BullMQ background worker executing configurable OpenAI models. Self-practice evaluates immediately; Offline Mock holds scores behind an admin/grader moderation gate.
- **Deterministic IELTS Band Calculation (ADR 0011, ADR 0010)**: Centralized `roundToNearestHalfIELTS` utility applying official .25/.75 ceiling rules. Textual answers evaluate via case-insensitive trimmed array matching combined with independent `max_words` validation.
- **Immutable Test Versioning (ADR 0008)**: Tests with existing attempts spawn a new version on edit. Assignments permanently bind to `test_id + version`.

---

## Testing Decisions

Testing will adhere to the principle of testing **external behavior at the highest available seam** rather than internal implementation details:

### 1. Seam 1: Shared Core Domain & Validation Boundary (`packages/shared-types`)
- **Focus**: Pure unit tests for mathematical correctness and data integrity.
- **Scope**:
  - `roundToNearestHalfIELTS` tested against all 8 possible fractional remainders (0.0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875).
  - Textual normalization and `max_words` guard tests (whitespace variations, casing, punctuation, word limit overflows).
  - Zod schemas tested with valid and malformed payloads for all 10+ question types.

### 2. Seam 2: Backend API & WebSocket Boundary (`apps/api`)
- **Focus**: Integration tests via supertest and Socket.IO client against real PostgreSQL and Redis containers.
- **Scope**:
  - Exam session lifecycle (start, autosave with version increments, submit, expired abandonment transition).
  - Timer authority (server rejecting client-clock manipulation, wall-clock progression).
  - JIT media authorization (verifying locked parts return 403 Forbidden for presigned URLs).
  - Single-session concurrency lockouts and audit log emission.
  - BullMQ writing evaluation worker queue execution and failure retry fallback.

### 3. Seam 3: End-to-End Browser Exam Runtime Boundary (`apps/web` / Playwright)
- **Focus**: Complete user flows simulating real student interactions and network failures.
- **Scope**:
  - Full exam flow across Listening, Reading, and Writing.
  - Offline simulation: disconnecting network mid-exam, verifying IndexedDB persistence, reconnecting, and verifying zero data loss.
  - Proctoring interactions: tab switching triggering warning modal and admin live-monitor telemetry.
  - Audio playback synchronization and non-recoverable reload timestamp tests.
  - Resizer splitter pane, text highlighting, and drag-and-drop interactions.

---

## Out of Scope

- Live webcam/video streaming and AI facial recognition proctoring (browser focus tracking and device binding only in v1).
- In-browser live audio recording for the Speaking module (manual score entry by examiners in v1; schema ready with nullable `audio_url` for v2).
- Native iOS/Android mobile applications (fully responsive, desktop-optimized web application).
- Multi-tenant SaaS billing / white-labeling (single-institution platform deployment).

---

## Further Notes

### Phased Delivery Roadmap
- **Phase 1: Foundations** — Monorepo setup, shared Zod schemas, PostgreSQL/Redis Docker environment, JWT auth & RBAC.
- **Phase 2: Admin Content & Test Builder** — Full/split test CRUD, question builder for all types, versioning, assignments.
- **Phase 3: Exam Runtime & Offline Resilience** — Split-pane UI, IndexedDB write-ahead buffer, audio player, answer strip.
- **Phase 4: Anti-Cheating & Real-Time Proctoring** — Dual-channel WebSockets, live monitor, focus loss modal, JIT media URLs.
- **Phase 5: Grading, AI & Analysis** — BullMQ OpenAI worker, grader console, test analysis with contextual highlights.
- **Phase 6: Reporting & Certificates** — Cohort statistics, PDF certificate generator with QR verification.
- **Phase 7: Load Testing & Polish** — 50 concurrent session benchmark, accessibility audit, final CDI visual tuning.
