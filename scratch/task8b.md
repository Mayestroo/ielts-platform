Part of #2
Blocked by: #10

## What to build

Build the high-priority Socket.IO Control Channel gateway in apps/api and client socket hook in apps/web per ADR-0009:
- Dedicated Control Channel namespace/events for authoritative exam timer tick synchronization
- Server-to-client commands: time extension, pause/resume, and administrative force-submit
- Client-to-server commands: session state transition requests and timer reconciliation
- Direct WebSocket communication layer required by the CDI Exam Shell (Task 9).

## Acceptance criteria

- [ ] Control Channel Socket.IO gateway initialized in NestJS
- [ ] Timer tick sync events emitted authoritatively from server Redis state
- [ ] Admin commands (add time, force submit) handled with immediate priority
- [ ] Client hook in packages/shared-types or apps/web to consume Control events.

## Blocked by

- #10
