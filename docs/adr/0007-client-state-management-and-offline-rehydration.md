# Client State Management and Offline Rehydration

Exam runtimes must withstand sudden page reloads and connection disruptions without user-facing friction. We decided to use Zustand coupled with Dexie.js (IndexedDB) as an optimistic write-ahead buffer. On page rehydration, local IndexedDB state renders immediately while background reconciliation checks `answer_version` with the server: higher local versions auto-retry submission, while higher server versions take precedence automatically without displaying disruptive conflict dialogs to the student.
