Part of #2
Blocked by: #4, #10, #23

## What to build

Build the authentic Computer-Delivered IELTS exam interface in apps/web per PLAN.md §6:
- Three-pane layout: source text pane, draggable resizer bar (splitter), scrollable question pane
- CDI header: school logo, server-synced local ticking countdown timer consuming Socket.IO Control Channel (#23), accessibility settings (font size, high-contrast themes)
- Bottom Part Navigator: segmented part switch, question-number strip (1..40) with green answered indicator
- Submission confirmation modal summarizing answered/unanswered counts.

## Acceptance criteria

- [ ] Split-pane layout with persistent resizer ratio
- [ ] Direct Socket.IO Control Channel integration for timer sync
- [ ] Part navigator with dynamic question answer status indicators
- [ ] Accessible confirmation modal before test submission.

## Blocked by

- #4
- #10
- #23
