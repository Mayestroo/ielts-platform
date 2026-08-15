# Anti-Cheating Escalation and Proctoring Policy

Detecting suspicious activity like tab-switching or fullscreen exits requires balancing deterrence against false positives from OS notifications. We decided on a human-in-the-loop escalation model: 1–2 infractions display a warning modal, while 3+ infractions escalate to a high-priority real-time WebSocket alert on the admin live monitor. Automatic force-submits are prohibited to avoid penalizing innocent students; session termination remains strictly an administrative action.
