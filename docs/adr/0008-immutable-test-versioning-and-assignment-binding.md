# Immutable Test Versioning and Assignment Binding

Modifying published test content must never alter historical attempt integrity or disrupt active exam sessions. We decided that tests with existing submissions become immutable; subsequent edits spawn a new draft version (`version + 1`). Furthermore, `Assignment` records explicitly bind to a specific composite key (`test_id` + `version`), ensuring assigned cohorts remain pinned to the exact version scheduled at assignment time regardless of subsequent test updates.
