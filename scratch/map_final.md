## Destination

Deliver the complete, production-ready IELTS Computer-Delivered Mock Exam & Preparation Platform (Next.js + NestJS + Turborepo monorepo) fulfilling all 48 user stories and 14 ADRs across the 7 delivery phases as specified in #1.

## Notes

- Domain glossary: `CONTEXT.md`
- Architecture decisions: `docs/adr/` (ADR 0001–0014)
- Full specification: #1 (`docs/SPEC.md`)
- Core skills to consult: `implement`, `tdd`, `code-review`, `diagnosing-bugs`

## Roadmap & Child Tickets

### Phase 1: Foundations
- [ ] #3 - Task 1: Initialize Turborepo Monorepo and Base Workspace Configuration **(Frontier - Unblocked)**
- [ ] #4 - Task 2: Implement Shared Zod Schemas and IELTS Scoring Engine *(Blocked by #3)*
- [ ] #5 - Task 3: Implement PostgreSQL Database Schema & Prisma ORM Migrations *(Blocked by #4)*
- [ ] #6 - Task 4: Implement Authentication, RBAC and Single-Session Guard *(Blocked by #5)*

### Phase 2: Admin Content & Test Builder
- [ ] #7 - Task 5: Implement Admin Test CRUD and Versioning Management *(Blocked by #5, #6)*
- [ ] #8 - Task 6: Implement Admin Question Builder and WYSIWYG Renderer `[size:XL]` *(Blocked by #4, #7)*
- [ ] #9 - Task 7: Implement Admin Cohort Mock Assignments and Scheduling *(Blocked by #7)*

### Phase 3: Exam Runtime & Offline Resilience
- [ ] #10 - Task 8: Implement Exam Session Lifecycle & Server-Authoritative Timer *(Blocked by #5, #6)*
- [ ] #23 - Task 8b: Implement Socket.IO Control Channel for Timer Sync & Session Commands *(Blocked by #10)*
- [ ] #11 - Task 9: Implement CDI Exam Shell, Split-Resizer Pane and Part Navigator *(Blocked by #4, #10, #23)*
- [ ] #12 - Task 10: Implement Question Renderers, Drag-and-Drop and Passage Highlighting `[size:XL]` *(Blocked by #4, #8, #11)*
- [ ] #14 - Task 11: Implement Zustand + Dexie.js Write-Ahead Buffer & Auto-Rehydration *(Blocked by #10, #12)*
- [ ] #13 - Task 12: Implement Listening Audio Playback Synchronization and JIT Media Delivery *(Blocked by #10, #11)*

### Phase 4: Anti-Cheating & Real-Time Proctoring
- [ ] #15 - Task 13: Implement Telemetry Channel & Admin Live Monitor *(Blocked by #23, #11)*
- [ ] #16 - Task 14: Implement Focus/Blur Proctoring Modal and Anti-Cheating Escalation *(Blocked by #11, #15)*

### Phase 5: Grading, AI & Post-Exam Analysis
- [ ] #17 - Task 15: Implement BullMQ Asynchronous OpenAI Writing Checker *(Blocked by #5, #10)*
- [ ] #18 - Task 16: Implement Grader Console for Writing & Speaking Evaluation *(Blocked by #17)*
- [ ] #19 - Task 17: Implement Post-Exam Test Analysis and Contextual Review UI *(Blocked by #4, #10, #18)*

### Phase 6: Reporting & Certification
- [ ] #20 - Task 18: Implement PDF Certificate Generation with QR Verification *(Blocked by #4, #19)*
- [ ] #21 - Task 19: Implement Cohort Analytics and Admin Reporting Dashboard *(Blocked by #19)*

### Phase 7: Verification & Load Testing
- [ ] #22 - Task 20: Playwright E2E Exam Simulation Suite and 50-User Load Benchmark *(Blocked by #11–#21)*

## Decisions so far

<!-- the index — one line per closed ticket: enough to judge relevance, then zoom the link for the detail the ticket holds -->

## Not yet specified

- In-browser live audio recording and examiner playback for the Speaking module (planned for v2)
- Multi-campus / multi-tenant school organization isolation (planned for v2)
- Native mobile companion apps (planned for v2)

## Out of scope

- Live webcam video streaming and AI facial recognition proctoring (ruled out for v1)
- Native desktop Electron wrappers (browser-based CDI simulation is canonical)
