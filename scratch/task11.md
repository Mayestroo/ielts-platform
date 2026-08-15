Part of #2
Blocked by: #10, #12

## Question / Objective

Build the offline resilience engine in apps/web per ADR-0007 and PLAN.md §9:
- Optimistic answer mutations to Zustand and Dexie.js (IndexedDB) write-ahead queue
- Debounced autosave (1-2s) + periodic heartbeat flush with exponential backoff
- Page reload rehydration from IndexedDB with silent server version reconciliation (answer_version)
- Calm connectivity status indicator ("Saved" / "Saving..." / "Offline - will retry").
