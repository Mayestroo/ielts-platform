# Single Active Session Enforcement and Abandonment Expiration

Preventing unauthorized multi-device access during exams while avoiding operational deadlocks requires defensive session management. We decided to reject concurrent logins during active `ExamSession` states with generic, privacy-safe error responses. To prevent orphaned locks if a student abandons a session without reconnecting, sessions paused for longer than the scheduled exam duration plus a 30-minute grace window automatically transition to `expired`, freeing the account lock while preserving partial answers.
