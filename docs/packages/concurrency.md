# CON — verification contract

Owner N, reviewer I; collaborator I owns cancellation/promotion. Mandatory topic package; all results pending.

Implement backend/database-protected capacity, uniqueness and enrollment-window rules under concurrent HTTP requests. Use architecture.md and ADR0001. Canonical verification releases 20 distinct authenticated students together against one remaining place in an open, published offering. Require exactly 1 ACTIVE, 19 WAITLISTED, all 20 responses accounted for and no unexpected failure. Independently inspect persisted SQL counts, uniqueness and state after restart. Busy failures must be reported and fixed; do not ignore 503 responses or claim they are successful waitlist results.

Also verify concurrent same-student duplicates, FIFO cancellation handoff, capacity edits, lock-window races, rollback, independent connections/processes, and raw SQL bypass rejection. Test-only fault injection must not be reachable through production endpoints.

Deliver actual command, SHA, fixture/environment, exit status, response/SQL assertions, retry evidence, alternatives and SQLite limitations. Explain one-writer throughput and fair ordering by committed queue position. No passing-result or no-overallocation claim is made by this planning document.
