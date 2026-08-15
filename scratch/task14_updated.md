Part of #2
Blocked by: #11, #15

## What to build

Implement anti-cheating detection, proctoring escalation, and audit logging in apps/web and apps/api per ADR-0003 and PLAN.md §8:
- Client-side visibilitychange, blur, and fullscreen exit detection
- Warning modal on 1-2 infractions
- Real-time WebSocket escalation to admin Live Monitor at 3+ infractions
- Restricted copy/paste and context menu on exam text
- AuditLog emission for all detected focus loss and fullscreen exit violations.

## Acceptance criteria

- [ ] Focus loss and tab switch listeners with warning modal (1-2 infractions)
- [ ] High-priority live WebSocket alert emitted to admin monitor on 3+ infractions
- [ ] Immutable AuditLog records created for proctoring infractions
- [ ] Admin force-submit action with reason logging.

## Blocked by

- #11
- #15
