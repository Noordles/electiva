# Test and coverage plan

M2 verification is recorded in milestones/M2.md and artifacts/m2. Real unit/API/persistence/negative/concurrency tests and production student-browser journeys now run. The matrix below includes broader M3 scenarios; it is not a claim that every row is complete. npm test exits nonzero on failure.

## Layers and fixtures

- Unit: pure window rules with injected clock, state transitions, field validation, query normalization, FIFO eligibility, capacity-change policies. Assert meaningful boundaries rather than implementation snapshots.
- Integration: Express HTTP plus real migrated, file-backed SQLite; fresh local temporary DB per test worker. Authenticate real sessions, inspect persisted SQL state and verify persistence after app restart. In-memory SQLite alone cannot validate file locking/concurrency.
- Negative security: unauthenticated writes, student admin writes, forged userId/role, another student's cancellation/read, roster/report leakage, CSRF failures, expired/revoked sessions, malformed JSON, unknown/oversized fields and SQL sort injection.
- Concurrency: actual simultaneous fetch requests released by a barrier; distinct sessions versus repeated one-user attempts; no sequential request loop presented as a race. Use bounded deadlines and capture all responses, never silently ignore rejected promises.
- Frontend/component: forms, errors/loading/empty, permission navigation and result refresh; native semantics and keyboard behavior.
- E2E: a real browser, React production build, Express API and real DB. Main two-student flow: A gets last seat, B waitlists, A cancels, B sees ACTIVE. Add admin setup and denied student admin access. No mocking the enrollment API in the mandatory E2E.
- Integration adapter: separate local simulator with success/not-found/timeout/500/malformed contract fixtures; backend integration tests verify no local data corruption.

## Critical scenario matrix

| ID | Scenario | Assertions and evidence | Owner |
|---|---|---|---|
| T01 | 20 students / one seat / open window | 20 successful contract responses, exactly 1 ACTIVE +19 WAITLISTED, 20 distinct memberships; SQL count<=capacity | N07/N09 |
| T02 | 20 repeats from one student | one current row; consistent replay; no duplicate history from same current request | N07 |
| T03 | Concurrent cancellation and enrollment | FIFO waiter beats newcomer, active count conserved | I07 |
| T04 | Two cancellations/promotions at once | each released seat assigned once, no lost waiter/double promotion | I07 |
| T05 | Capacity edit races enroll | below-occupancy edit rejected; invariant intact either interleaving | N09/I07 |
| T06 | Window boundaries | before open denied, at open allowed, just before close allowed, at close denied; UTC input normalization | N07/I07 |
| T07 | Close while waiting for lock | time reread after lock/retry; no late admission | N09 |
| T08 | Transaction fails during promotion | cancellation and promotion roll back together; DB reopened and inspected | I07 |
| T09 | Raw SQL bypass of service | duplicate current row, over-capacity INSERT/UPDATE, invalid FK/status/capacity update rejected | N04/N07 |
| T10 | Student ownership/role attack | 401/403/404 as contract, no changes, no sensitive response/log data | N10 |
| T11 | Filtering/page ties | stable boundaries and total, no overlap for static fixture, filter combinations, reject structured/repeated bad params | J04 |
| T12 | Adapter failure | bounded timeout/safe errors; no arbitrary URL, no partial import/capacity edits | J05 |
| T13 | Restart persistence | users/course/enrollment/cancellation remain; sessions match stated policy | J07 |
| T14 | Two server processes/connections | same local DB, correct last-seat result without process-local mutex; document contention | N09 |
| T15 | Production E2E | admin creates/publishes, student enroll/waitlist/cancel/promote, role restriction, refresh survives | I09 |
| T16 | Capacity report correctness | aggregates equal direct SQL counts; report pages bounded, admin-only | J06/J08 |
| T17 | Saturation recovery | after overload, health/listing recovers, writes remain correct, no leaked locks/connections | J09/N09 |

## Coverage

Implemented: Node test runner with c8 12.0.0/V8, all server/src/**/*.js, including unimported files. Enforce provisional >=70% statements AND >=60% branches; generate JSON summary and HTML/LCOV. These are c8's V8-to-Istanbul statement/branch metrics. Browser tests run separately and do not contribute to this backend report.

The include pattern excludes dependencies, generated client output and test/load/simulator tooling. No authored backend file is excluded: config, migrations, seeding and startup are included. Startup is currently unexecuted by this suite; retry exhaustion, checksum mismatch, rare HTTP encoding/error branches and broader process recovery are gaps. Coverage percentages do not establish their correctness.

Tests must check correctness beyond the thresholds. No skipped critical tests, unconditional retries to hide flakiness, forced exit to conceal resource leaks, or stubbing a repository in the only persistence/concurrency test. Keep server startup, app factory, DB creation and close hooks separate. Test retries remain zero for core assertions; investigate failures.

## Evidence and gap report

For each verification run save UTC timestamp, SHA, runtime versions, command, exit code, fixture/hash, output/summary path and relevant SQL verification. Keep a small artifact manifest in Git; raw bulky load logs stay outside Git or in an authorized artifact store. Every M2/M3 report identifies untested features, excluded code, hardware/driver limitations and risks. No metric or pass claim is filled in before execution.
