Part of #2
Blocked by: #23, #11

## What to build

Build the Telemetry Channel and the Admin Live Proctoring Dashboard in apps/api and apps/web per ADR-0009 and PLAN.md §8:
- Telemetry Socket.IO namespace/events: periodic client heartbeats, focus/blur telemetry logs, active connection presence
- Admin Live Monitor dashboard: real-time grid of active exam sessions, remaining timers, network connectivity indicators, and proctoring status.

## Acceptance criteria

- [ ] Telemetry Socket.IO channel implemented with background prioritization
- [ ] Real-time heartbeats and session presence tracking
- [ ] Admin Live Monitor interface displaying live session telemetry.

## Blocked by

- #23
- #11
