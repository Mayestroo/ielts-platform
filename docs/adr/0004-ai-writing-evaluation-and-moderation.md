# AI Writing Evaluation and Moderation Workflow

Essay evaluation across `Self Practice` and `Offline Mock` has different latency, cost, and reliability requirements. We decided on a dual-tier evaluation architecture where model identifiers are dynamically configurable via settings/environment variables rather than hardcoded. `Self Practice` delivers immediate automated AI feedback, while `Offline Mock` routes AI evaluations through an administrative/grader approval gate before results are released to students.
