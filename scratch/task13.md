Part of #2
Blocked by: #10

## Question / Objective

Build the real-time proctoring subsystem per ADR-0009 and PLAN.md §8:
- Dual-channel Socket.IO gateway: high-priority Control Channel (timer sync, admin commands, state changes) and Telemetry Channel (heartbeats, blur events, presence)
- Admin Live Monitor dashboard: real-time grid of active exam sessions, elapsed timers, connection states, and proctoring violation alerts.
