# Exam Timer and Disconnection Handling Policy

Exam sessions must prevent cheating through intentional disconnection while accommodating genuine network jitter. We decided to enforce continuous server-side wall-clock timers for `Offline Mock` sessions with a 20-second tolerance window for transient drops, after which prolonged disconnections are logged to `AuditLog` and flagged on the admin live monitor. Timer pausing is permitted only in `Self Practice`, and time extensions in `Offline Mock` remain exclusively an admin prerogative.
