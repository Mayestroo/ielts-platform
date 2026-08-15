Part of #2
Blocked by: #5, #10

## Question / Objective

Build the automated essay grading pipeline per ADR-0004 and PLAN.md §4.8:
- BullMQ worker queue consuming WritingSubmission jobs
- Server-side OpenAI API integration evaluating Task 1 & Task 2 against official IELTS band descriptors (TR, CC, LR, GRA)
- Dual-tier configuration: immediate delivery for Self Practice; holding behind moderation gate for Offline Mock
- Exponential retry backoff and fallback to manual grading on persistent API errors.
