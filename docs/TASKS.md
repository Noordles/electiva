# Detailed implementation backlog

M1–M3 implementation now has31 technically verified packages. N11/I11/J12 personal cases and N12/I12 final acceptance/rehearsal gates remain partial pending genuine member participation and open approval items. See milestones/M3.md, traceability.md and tasks.json. The36 original work packages below preserve the balanced responsibility plan; their steps are not claims of completed human contribution.

## Al-Sammarraie Nooruldeen Sameer Fawzi — 12 packages, 40 points

### N01 — Establish repository and reproducible workspace

**Milestone:** M1 · **Effort:** 3 points · **Depends on:** none

**Files/scope:** `README.md, package.json, lockfile, .env.example, .gitignore, docs/team.md`

1. Confirm theme 1/CON+SCL and roster; preserve source hashes and Draft status.
2. Choose compatible supported Node LTS/npm and dependency versions from official documentation; record versions and reasons.
3. Create npm workspaces for server/client; commit lockfile and harmless environment examples.
4. Ignore secrets/build/runtime databases; choose local DB directory outside OneDrive.
5. Create feature branches and command placeholders that fail clearly until implemented; never claim the planning repo runs.

**Done when:** Clean clone can install locked dependencies; no secrets/DB/TypeScript; team/source record accurate.

**Proposed atomic commit:** `chore(repo): initialize JIN workspace`

### N02 — Design schema and transaction boundaries

**Milestone:** M1 · **Effort:** 3 points · **Depends on:** N01, I01, J02

**Files/scope:** `docs/architecture.md, schema diagram, model/migration contracts`

1. Map users/sessions/courses/offerings/enrollments and their keys.
2. Define epoch-time windows, capacity and current-membership constraints.
3. Specify ACTIVE/WAITLISTED/CANCELLED lifecycle and immutable attempt identity.
4. Plan transaction ownership across enroll/cancel/capacity writes.
5. Agree schema/API names with I and J before they implement modules.

**Done when:** Schema diagram and constraint list trace R04/R06/R16–18; review records all write entry points.

**Proposed atomic commit:** `docs(data): define enrollment schema`

### N03 — Spike SQLite locking and record CON decision

**Milestone:** M1 · **Effort:** 3 points · **Depends on:** N02, I03

**Files/scope:** `docs/adr/0001-*.md, tools/spikes/sqlite-concurrency.js`

1. Build a disposable file-DB spike with two independent connections and immediate transactions.
2. Enable/assert per-connection foreign keys, busy timeout and selected journal mode.
3. Test concurrent writers, rollback and driver behavior using bounded retries.
4. Compare DB guards with process mutex and approved server-DB alternative.
5. Update proposed ADR with actual spike observations; keep full CON test pending.

**Done when:** Spike exits cleanly; no nested transaction errors; limitations recorded; architecture chosen before N04.

**Proposed atomic commit:** `chore(con): verify SQLite transaction strategy`

### N04 — Implement schema, migrations and DB guards

**Milestone:** M2 · **Effort:** 4 points · **Depends on:** N03

**Files/scope:** `server/src/db/, server/migrations/, server/tests/db/`

1. Implement Sequelize models and ordered migration runner; avoid sync-alter as production migration.
2. Add foreign keys/CHECKs and unique normalized email/course code.
3. Add current-membership partial unique index and ACTIVE lookup index.
4. Add capacity INSERT/UPDATE guards, immutable membership identity and capacity-decrease protection.
5. Test migration from empty DB, rollback/reapply, invalid FK/status, duplicate and over-capacity raw SQL.

**Done when:** Real SQLite integration checks reject invalid writes even outside services; clean migration/rollback demonstrated.

**Proposed atomic commit:** `feat(db): enforce enrollment integrity`

### N05 — Implement authentication and server permissions

**Milestone:** M2 · **Effort:** 4 points · **Depends on:** N04, J02

**Files/scope:** `server/src/auth/, server/tests/auth/`

1. Implement salted password hashing and constant-time verification.
2. Create hashed server session tokens, rotation/expiry/logout and safe cookie settings.
3. Add authenticated/student/admin middleware and owner-scoped record lookup.
4. Add CSRF/origin checks and safe login throttling; reject client role/user overrides.
5. Cover success/wrong password/expired/revoked session/role escalation and redact sensitive errors.

**Done when:** Real login/session tests; 401/403/CSRF cases; plaintext secrets absent from DB/responses/logs.

**Proposed atomic commit:** `feat(auth): add sessions and role guards`

### N06 — Implement transactional enrollment service

**Milestone:** M2 · **Effort:** 4 points · **Depends on:** N05, I04

**Files/scope:** `server/src/enrollments/, server/tests/enrollment-rules/`

1. Validate offering ID, derive student from session and acquire immediate transaction.
2. Reread publication/window after lock; handle current enrollment replay.
3. Honor existing queue; insert ACTIVE or WAITLISTED using database guards.
4. Bound whole-transaction busy retries and map known HTTP errors.
5. Commit before responding and expose own enrollment/history endpoint; keep network work outside transaction.

**Done when:** Enroll/waitlist/replay/window-rejection integration tests inspect final DB state; no trust in client seat count.

**Proposed atomic commit:** `feat(enrollment): allocate seats transactionally`

### N07 — Prove last-seat and duplicate-request invariants

**Milestone:** M2 · **Effort:** 3 points · **Depends on:** N06, I06

**Files/scope:** `server/tests/concurrency/, artifacts/con/`

1. Seed one-seat open course and 20 independent authenticated students.
2. Release20 HTTP enrollment requests together with a start barrier.
3. Assert 1 ACTIVE + 19 WAITLISTED and all 20 contract results; query persisted DB independently.
4. Run concurrent same-student requests and ensure one current membership.
5. Add window endpoint and raw SQL negative cases; retain actual output/environment/exit code.

**Done when:** R16–18/R21 evidence; no ignored rejected promise or silent503; tests fail on overbooking.

**Proposed atomic commit:** `test(con): verify last-seat and duplicate races`

### N08 — Build student enrollment and status interface

**Milestone:** M3 · **Effort:** 4 points · **Depends on:** I05, N07, I06

**Files/scope:** `client/src/features/enrollments/, client/tests/enrollments/`

1. Build course-detail action panel using existing shared components.
2. Display window/full/ACTIVE/WAITLISTED states and advisory availability.
3. Implement own enrollments/history and cancellation result flow.
4. Handle401/409/422/503, stale availability and repeated clicks with server response refresh.
5. Add keyboard/mobile/component checks for own UI paths.

**Done when:** Student can enroll/waitlist/cancel/view own state using real API; error and loading states visible.

**Proposed atomic commit:** `feat(ui): add student enrollment workspace`

### N09 — Extend concurrency proof across cancellation and processes

**Milestone:** M3 · **Effort:** 3 points · **Depends on:** N07, J07, I07

**Files/scope:** `server/tests/concurrency/, docs/packages/concurrency.md`

1. Test simultaneous enroll/cancel/capacity edit and window closure after lock wait.
2. Run two local API processes or independent app DB connections against same local file.
3. Force transaction failure and inspect durable state after reopen.
4. Assert FIFO/no duplicate promotions and recovery after contention.
5. Publish CON report with commands/SHAs/SQL outcomes/retries and finalize ADR only when demonstrated.

**Done when:** CON canonical and adversarial scenarios pass; actual single-writer/latency limits explicitly reported.

**Proposed atomic commit:** `test(con): verify contention and recovery`

### N10 — Close backend security and coverage gaps

**Milestone:** M3 · **Effort:** 3 points · **Depends on:** J07, N09, I07

**Files/scope:** `server/tests/security/, docs/testing.md, security policy`

1. Run complete statement/branch coverage over all backend application files.
2. Add meaningful uncovered authorization/window/error tests rather than excluding code.
3. Test cross-user cancellation/reads, student admin reports, CSRF/session expiry and query injection.
4. Inspect logs/responses/env/git for sensitive data; verify body/page/rate bounds.
5. Record remaining untested behavior, thresholds/exclusions and remediation results.

**Done when:** Provisional70/60 coverage gates pass with real report; no critical security gap hidden; risk list current.

**Proposed atomic commit:** `test(security): cover authorization and error gaps`

### N11 — Write individual consistency case and defense notes

**Milestone:** M3 · **Effort:** 3 points · **Depends on:** N10

**Files/scope:** `docs/ai-usage.md, docs/defense/nooruldeen.md`

1. Select a real significant concurrency/security issue investigated in own work.
2. Record requirement, AI contribution, inspected diff and observed verification/defect.
3. Link actual correction commit and test result; state limitations.
4. Explain request→service→transaction→guard→response path without relying on generated prose.
5. Peer review I tasks assigned to N by review rotation and record actual evidence where performed.

**Done when:** One genuine N case, code/test locators and accurate actual contribution ledger.

**Proposed atomic commit:** `docs(ai): record enrollment engineering case`

### N12 — Verify rubric traceability and release integrity

**Milestone:** M3 · **Effort:** 3 points · **Depends on:** I10, I11, J12, N11

**Files/scope:** `docs/requirements.md, docs/contributions.md, release checklist`

1. Trace every R01–R35 to implementation/test/report SHAs.
2. Check exactly CON+SCL delivered and no obsolete topic assumptions.
3. Verify full commit log/owners/reviews and all 3 genuine AI cases.
4. Check secret-free archive and source hashes; ensure reported versions match release.
5. Collect final gate evidence and sign technical readiness without submitting.

**Done when:** Every required acceptance criterion has concrete evidence or explicit unresolved failure; no invented completion.

**Proposed atomic commit:** `docs(release): verify requirements and contributions`

## Ilinca-Mara Vlădescu — 12 packages, 40 points

### I01 — Specify roles, workflows and acceptance criteria

**Milestone:** M1 · **Effort:** 3 points · **Depends on:** N01

**Files/scope:** `docs/requirements.md, docs/team.md`

1. Read general/theme/package sources with exact section locators.
2. Write student/admin permission matrix and W1–W5 acceptance scenarios.
3. Define duplicate/cancel/window/FIFO/admin edge behavior with N.
4. Distinguish source requirements from proposed policy and draft targets.
5. List external-service approval and missing deadlines as open decisions.

**Done when:** All mandatory functionality mapped;3+ complete workflows; no invented dates/rules.

**Proposed atomic commit:** `docs(requirements): define roles and workflows`

### I02 — Create responsive React shell and components

**Milestone:** M1 · **Effort:** 3 points · **Depends on:** N01, J02

**Files/scope:** `client/src/app/, client/src/components/, client/src/styles/`

1. Create Vite React JavaScript app and shared routing/layout.
2. Define spacing/color/typography and reusable forms/alerts/pagination.
3. Implement native semantic controls, visible focus and accessible status messages.
4. Add login/student/admin route shells with explicit loading/error/empty designs.
5. Check360/768/1280 widths; use mock UI fixtures only until real integration and label them.

**Done when:** Runnable frontend shell, consistent accessible controls and responsive layout; no simulated backend success claim.

**Proposed atomic commit:** `feat(ui): add responsive application shell`

### I03 — Freeze API, UI and provider contracts

**Milestone:** M1 · **Effort:** 3 points · **Depends on:** N02, J02

**Files/scope:** `docs/api.md, docs/ui.md, provider schema fixtures`

1. Agree endpoint/response/error contracts with N/J.
2. Specify filters/page limits, version conflicts, cancellation replay and status labels.
3. Specify provider lookup/preview/import payload and timeout behavior.
4. Define UTC display/input and ownership/error conventions.
5. Create contract examples/fixtures and mark substitute approval pending.

**Done when:** N/J can implement independently without guessing field names or request outcomes.

**Proposed atomic commit:** `docs(api): specify enrollment contracts`

### I04 — Implement admin course and offering management

**Milestone:** M2 · **Effort:** 4 points · **Depends on:** N04, N05, I03

**Files/scope:** `server/src/courses/, server/src/offerings/, server/tests/admin/`

1. Add authorized course create/edit/archive and offering create/edit/publish.
2. Validate capacity integer/window ordering/course relationship.
3. Use transaction/version checks for admin edits; reject stale or below-occupancy writes.
4. Prevent archive that strands current memberships; keep referenced history.
5. Cover happy/invalid/student-denied/missing/stale-edit cases using file DB.

**Done when:** Admin APIs work and preserve invariants; student crafted requests denied; invalid inputs do not persist.

**Proposed atomic commit:** `feat(admin): manage courses and offerings`

### I05 — Integrate login and searchable student catalog

**Milestone:** M2 · **Effort:** 4 points · **Depends on:** N05, J04, I02

**Files/scope:** `client/src/features/auth/, client/src/features/catalog/`

1. Implement session bootstrap/login/logout with native fetch/CSRF handling.
2. Connect catalog filters/sort/pagination to real API and URL query state.
3. Display course/term/seat/window details with clear closed/full states.
4. Handle slow/empty/error/expired-session states without redirect loops.
5. Add frontend contract/component checks and responsive keyboard review.

**Done when:** Real student session and server-filtered pages; no client-only authorization or full-dataset slicing.

**Proposed atomic commit:** `feat(ui): connect login and course catalog`

### I06 — Implement atomic cancellation and FIFO promotion

**Milestone:** M2 · **Effort:** 4 points · **Depends on:** N06

**Files/scope:** `server/src/enrollments/cancel.js, promotion.js, tests/waitlist/`

1. Derive owner from session and enforce open-window policy.
2. Cancel ACTIVE/WAITLISTED idempotently inside transaction.
3. Promote earliest queued enrollment into released seat before commit.
4. Wire the same promotion service to capacity increases during open window.
5. Ensure failures roll back cancellation/promotion together; no newcomer jumps existing queue.

**Done when:** Cancellation and FIFO handoff durable and atomic; duplicate actions do not release/promote twice.

**Proposed atomic commit:** `feat(waitlist): promote students after cancellation`

### I07 — Test lifecycle races and administration rules

**Milestone:** M2 · **Effort:** 3 points · **Depends on:** I06, N07

**Files/scope:** `server/tests/waitlist/, server/tests/admin/`

1. Test2 waiters, active/queued cancellation and re-enrollment at queue tail.
2. Test simultaneous cancels/promotions/new enrollment/capacity updates.
3. Inject promotion failure and check full rollback.
4. Test exact window boundaries, closed-window cancellation and privilege checks.
5. Cross-check roster/count state after all operations and record failures honestly.

**Done when:** FIFO/atomicity/window/admin cases pass against real DB; no duplicate handoff.

**Proposed atomic commit:** `test(waitlist): cover lifecycle and rollback rules`

### I08 — Build admin management and waitlist screens

**Milestone:** M3 · **Effort:** 4 points · **Depends on:** I04, I06, I02

**Files/scope:** `client/src/features/admin/, client/tests/admin/`

1. Build course/offering forms with capacity/window/version fields.
2. Connect publish/archive actions and roster/status pages.
3. Display server validation and stale edit conflicts without losing entered data.
4. Refresh waitlist/seat counts after writes, display FIFO order to admin only.
5. Check mobile/keyboard/loading/empty/forbidden cases with shared components.

**Done when:** Admin completes W4 using real API; ordinary student cannot access private data or execute actions.

**Proposed atomic commit:** `feat(ui): add offering and waitlist administration`

### I09 — Automate production end-to-end workflows

**Milestone:** M3 · **Effort:** 3 points · **Depends on:** N08, I08, J08, N10

**Files/scope:** `tests/e2e/, Playwright config, docs/testing.md`

1. Build SPA and start production API with isolated seeded DB and simulator.
2. Automate admin setup and two independent student browser sessions.
3. Assert last-seat enroll→waitlist→cancel→promotion and reload persistence.
4. Assert student admin denial plus validation/network recovery UI.
5. Save actual run results/screenshots and close browser/server/DB resources.

**Done when:** At least1 complete real E2E green; production behavior verified; no mocks for critical API.

**Proposed atomic commit:** `test(e2e): verify enrollment and promotion journey`

### I10 — Document and rehearse clean production setup

**Milestone:** M3 · **Effort:** 3 points · **Depends on:** I09, J11

**Files/scope:** `README.md, .env.example, docs/deployment.md`

1. Run fresh-clone npm ci/migrate/seed/build/production start with documented versions.
2. Confirm API JSON404 vs SPA route fallback and same-origin session/CSRF behavior.
3. Document Windows paths/ports/local DB outside OneDrive and simulator start.
4. Explain coverage/load commands, evidence paths and limitations.
5. Confirm setup requires no paid service, real user email or live API secret.

**Done when:** Another team member can reproduce without hidden machine state; record actual commands/results.

**Proposed atomic commit:** `docs(setup): document reproducible production run`

### I11 — Write individual waitlist case and demo script

**Milestone:** M3 · **Effort:** 3 points · **Depends on:** I09

**Files/scope:** `docs/ai-usage.md, docs/defense/ilinca-mara.md, docs/demo.md`

1. Select actual significant lifecycle/UI/admin issue and inspected correction.
2. Record requirement/AI help/review/test/effect with SHAs.
3. Write a timed demonstration for admin setup and waitlist handoff.
4. Practice explaining transaction implications and client/server permission difference.
5. Review N work per rotation and document real reviews only.

**Done when:** One genuine I engineering case plus reproducible demo segment and current contribution evidence.

**Proposed atomic commit:** `docs(ai): record waitlist engineering case`

### I12 — Prepare final demonstration and delivery bundle

**Milestone:** M3 · **Effort:** 3 points · **Depends on:** N12, I10, J12

**Files/scope:** `docs/demo.md, docs/release.md, release artifact manifest`

1. Rehearse clean production demo with all 3 members.
2. Check source/docs/tests/lockfile/env example and evidence references in bundle.
3. Verify archive integrity and exclude node_modules/secrets/runtime DBs.
4. Assign speaking segments and questions so each explains own tests plus core flows.
5. Prepare handoff for student upload; verify final dates separately when supplied.

**Done when:** Reviewable final bundle and rehearsed demonstration; no automatic submission or invented grade.

**Proposed atomic commit:** `docs(delivery): finalize demonstration and bundle`

## Taya Jwan — 12 packages, 40 points

### J01 — Design workload, test and tooling strategy

**Milestone:** M1 · **Effort:** 3 points · **Depends on:** N01, I01

**Files/scope:** `docs/testing.md, docs/capacity.md, dependency rationale`

1. List unit/API/persistence/negative/E2E/concurrency evidence.
2. Adopt provisional coverage 70/60 and illustrative listing800ms target.
3. Define10,000 students/100 users, traffic mix, three levels and saturation.
4. Choose minimal test/load/chart libraries and justify additional dependencies.
5. Specify environment/run manifest and fixture reset strategy.

**Done when:** Test and performance design traces G§4–6/T§4–5/SCL; measured fields remain blank.

**Proposed atomic commit:** `docs(quality): define test and capacity strategy`

### J02 — Build Express API foundation and error contract

**Milestone:** M1 · **Effort:** 3 points · **Depends on:** N01

**Files/scope:** `server/src/app.js, config/, middleware/errors.js, server startup`

1. Separate app factory/listen/config and orderly close hooks.
2. Add JSON body limit, health/readiness and request IDs.
3. Add consistent safe errors/not-found and validation helpers.
4. Implement production SPA/static serving and development proxy contract.
5. Write startup/invalidJSON/unknownAPI tests and runtime/env validation.

**Done when:** Runnable skeleton/health route and shared error behavior support M1; no secrets in responses.

**Proposed atomic commit:** `feat(api): add Express application foundation`

### J03 — Specify provider and SCL experiment alternatives

**Milestone:** M1 · **Effort:** 3 points · **Depends on:** N02, I03, J01

**Files/scope:** `docs/adr/0002-*.md, docs/capacity.md, simulator contract`

1. Compare query/index optimization, cache and DB change options.
2. Define baseline/after SHAs, fixed data/environment,3 repetitions and charts.
3. Choose distinct local institutional-directory HTTP simulator proposal.
4. List provider failure fixtures/approval status and integration boundaries.
5. Finalize workload measures/stopping rule and planned capacity estimate.

**Done when:** SCL ADR proposed with falsifiable hypothesis; no unmeasured gain; integration contract usable.

**Proposed atomic commit:** `docs(scl): define measurable optimization experiment`

### J04 — Implement catalog filtering, ordering and pagination

**Milestone:** M2 · **Effort:** 4 points · **Depends on:** N04, N05, I03

**Files/scope:** `server/src/catalog/, server/tests/catalog/`

1. Query published offerings with bounded q/term/department/open filters.
2. Whitelist sort/order and validate repeated/structured/invalid params.
3. Apply SQL limit/offset with stable ID tiebreak and total count.
4. Return seat/window metadata using bounded database aggregation.
5. Test duplicates in titles, empty/beyond-last pages/filter combinations and no full collection load.

**Done when:** API contract and database-backed pages pass; baseline query plan/query count documented for SCL.

**Proposed atomic commit:** `feat(catalog): add filtered paginated offerings`

### J05 — Implement directory integration and controlled simulator

**Milestone:** M2 · **Effort:** 4 points · **Depends on:** I03, N04, N05

**Files/scope:** `server/src/integrations/, services/course-directory-simulator/, tests/integration/`

1. Build versioned local simulator success/notfound/timeout/500/invalid fixtures.
2. Implement fixed-base-URL adapter with bounded timeout and response validation.
3. Add admin preview/import endpoint mapping allowed metadata only.
4. Deduplicate imports by external code; keep provider outside enrollment transaction.
5. Test outage/malformed data and assert stored courses/enrollments remain valid.

**Done when:** Real local HTTP request proves meaningful integration; approval pending until recorded; no external messages.

**Proposed atomic commit:** `feat(integration): add course directory adapter`

### J06 — Seed synthetic workload and implement report queries

**Milestone:** M2 · **Effort:** 4 points · **Depends on:** N04, I04

**Files/scope:** `tools/seed/, server/src/reports/, server/tests/reports/`

1. Build fixed-seed demo/large profiles with 10,000 synthetic students in large.
2. Create valid capacities/windows/enrollment histories without bypassing safety constraints.
3. Add admin-only per-offering/term counts and paginated roster queries.
4. Verify counts against direct SQL and student denial.
5. Emit seed/reference-time/count/hash manifest; support local isolated benchmark resets.

**Done when:** Deterministic valid seed and report aggregates; no real classmates as load accounts.

**Proposed atomic commit:** `feat(data): add synthetic seed and enrollment reports`

### J07 — Wire real tests, coverage and load harness

**Milestone:** M2 · **Effort:** 3 points · **Depends on:** N07, I07, J04, J05, J06

**Files/scope:** `package scripts, test config, tools/load/, CI configuration`

1. Make npm test aggregate real unit/API/persistence suites with nonzero failures.
2. Configure all-backend statement/branch coverage and documented exclusions.
3. Build concurrency/load runner with bounded requests and explicit outcome counters.
4. Record p50/p95/RPS/errors/CPU/RSS where observable and environment manifest.
5. Add CI install/test/coverage/build; keep heavy load manual and local authorized only.

**Done when:** Meaningful npm commands run and emit artifacts; missing scenarios are failures; no hidden internet service.

**Proposed atomic commit:** `chore(test): wire coverage and load verification`

### J08 — Build report and provider administration UI

**Milestone:** M3 · **Effort:** 4 points · **Depends on:** J05, J06, I02

**Files/scope:** `client/src/features/reports/, client/src/features/directory/`

1. Build aggregate reports, term filters and paginated roster display.
2. Connect directory lookup/preview/import with clear confirmation/result.
3. Show timeout/unavailable/invalid-data errors and preserve form state.
4. Use shared accessible/responsive components and session permission handling.
5. Add own component/integration checks, including data leakage/empty/failure cases.

**Done when:** Admin completes W5 through real APIs; reports match fixtures; student sees no roster data.

**Proposed atomic commit:** `feat(ui): add reports and directory import`

### J09 — Measure baseline load and saturation

**Milestone:** M3 · **Effort:** 3 points · **Depends on:** J07, N09, J08

**Files/scope:** `artifacts/capacity/, docs/capacity.md`

1. Build production snapshot and tag baseline; save exact environment/seed hashes.
2. Run 10/50/100 active-user profiles with warmup/steady/recovery windows.
3. Run incremental saturation with resource-safe stop and report actual ceiling.
4. Capture 3 repetitions, endpoint measures/resources/error classes and post-load invariants.
5. Inspect bottleneck using real timings/query plans; document generator limitations.

**Done when:** Actual baseline datasets/charts include100-user level and saturation; capacity result is measured.

**Proposed atomic commit:** `perf(baseline): measure load and saturation`

### J10 — Optimize one measured catalog bottleneck

**Milestone:** M3 · **Effort:** 3 points · **Depends on:** J09

**Files/scope:** `server query/migration affected by experiment, regression tests`

1. Select smallest hypothesis supported by baseline evidence.
2. Implement one query/index change with isolated migration and query correctness checks.
3. Keep integrity guards/data/runtime/hardware unchanged.
4. Save before/after query plan/counts and exact optimization diff.
5. Rerun correctness/CON/E2E; if hypothesis fails, retain evidence and revise.

**Done when:** Real application behavior preserved; optimization independently reviewable and measurable.

**Proposed atomic commit:** `perf(catalog): optimize measured listing bottleneck`

### J11 — Publish controlled comparison and capacity estimate

**Milestone:** M3 · **Effort:** 3 points · **Depends on:** J10

**Files/scope:** `docs/capacity.md, docs/packages/SCL.md, ADR0002, charts/data`

1. Rerun identical levels/saturation >=3 times per version with controlled DB reset.
2. Generate p50/p95/throughput/error/resource graphs from saved numbers.
3. Report median/spread and highest tested sustainable load, including failed levels.
4. Explain improvement/regression and remaining SQLite bottleneck; finalize SCL ADR.
5. Link raw-data manifest and coverage/test evidence; no hand-entered invented metrics.

**Done when:** SCL measured optimization supported by repeatable before/after data; report states actual limits.

**Proposed atomic commit:** `docs(scl): report optimization and tested capacity`

### J12 — Write individual performance case and verify evidence

**Milestone:** M3 · **Effort:** 3 points · **Depends on:** J11

**Files/scope:** `docs/ai-usage.md, docs/defense/jwan.md, artifacts/manifest.json`

1. Record actual performance/integration issue, AI contribution and student inspection.
2. Link correction and measured verification with source/commit locators.
3. Verify charts agree with raw summaries and secrets are absent.
4. Practice explaining percentiles/throughput/capacity and model limitations.
5. Review I work per rotation and update real contribution ledger only.

**Done when:** One genuine J case and reproducible evidence index for final release.

**Proposed atomic commit:** `docs(ai): record performance engineering case`

## Dependency-safe execution waves

These waves show prerequisites, not promises that all work in a wave has equal duration. One developer may work on independent packages in parallel; integration checks remain sequential.

- Wave 1: N01
- Wave 2: I01, J02
- Wave 3: I02, J01, N02
- Wave 4: I03
- Wave 5: J03, N03
- Wave 6: N04
- Wave 7: N05
- Wave 8: I04, J04, J05
- Wave 9: I05, J06, N06
- Wave 10: I06, J08
- Wave 11: I08, N07
- Wave 12: I07, N08
- Wave 13: J07
- Wave 14: N09
- Wave 15: J09, N10
- Wave 16: I09, J10, N11
- Wave 17: I11, J11
- Wave 18: I10, J12
- Wave 19: N12
- Wave 20: I12
