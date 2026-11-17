# Paused for Noor's app review — 17 November 2026

**Historical checkpoint, superseded by the student's explicit continuation.** The saved pause snapshot is commit e872db9. Resumed work completed the missing overload repetition, fixed finite-value validation, added course-level duplicate guards and generated reports. Current status and remaining human gates are in milestones/M3.md and release.md; do not treat the historical pause below as a new stop instruction.

The student explicitly asked to stop development, run the app and continue only when told to resume. Do not restart implementation or benchmark work automatically.

## Running preview

- Frontend: http://127.0.0.1:5173/login
- API: http://127.0.0.1:3000
- Separate directory simulator: http://127.0.0.1:3100
- Live demonstration database: LOCALAPPDATA/Electiva/dev.sqlite, outside OneDrive.
- Generated synthetic credentials: LOCALAPPDATA/Electiva/demo-accounts.json. Keep this file outside Git. Both admin@example.test and student1@example.test use its demo password. These are not ASE accounts.
- This session started the development supervisor as exec session26426 and directory service as23047. Verify ownership/listening ports before reusing or stopping anything in a future session; session IDs may expire.

## Implemented since M2

2271fc8: complete administration/course/offering/roster/report/directory screens, including stale forms and archive protection; production admin-browser journey passed. Fixed the admin login redirect it caught.

9264291: separate-process CON and crash rollback/restart test passed. d788952: added permission/origin/password/date/checksum/retry boundary checks. 664cf14/2363b72: realistic capacity fixture, independent backend metrics and frozen protocol. 5aa19c7: page-first catalog history counts, with baseline-equivalence regression tests passing.

Ordinary before/after benchmarks completed3 repetitions each at10/50/100 users, using identical10,000-student/100-offering/50,000-attempt fixtures. Median100-user listing p95 improved353.72→104.99ms; all18 ordinary scenarios had zero request errors/invariant violations. Profile fixture/result hashes match. Raw JSON is saved under artifacts/capacity.

Baseline no-think overload completed100/200/400 once;400 produced854 failures of1339 requests and triggered the declared safety stop, with recovery/invariants intact. Optimized overload completed two repetitions at100/200/400 (six scenarios), then the student requested pause. The runner was interrupted before the third repetition. This dataset is intentionally incomplete. Do not describe all optimized overload repetitions as complete.

## Resume from here

1. Read this checkpoint and inspect git status/current preview without replacing the student's demonstration data.
2. Finish or explicitly report the missing third optimized overload repetition. The current CLI overwrites its output; preserve the existing six scenarios before running anything. Use the same fixture clock1794902400000 and model, or rerun the full series as a new versioned dataset.
3. Fix CLI finite-number validation before accepting arbitrary duration input: NaN currently passes the seconds comparisons. Extend the command-boundary test to cover invalid numeric duration. This does not affect the valid saved measurements.
4. Generate charts/CSV/summary with tools/load/plot-results.py and update capacity-results.md/SCL/ADR0002 with final overload outcomes. Matplotlib3.9.2 is installed locally; optional requirements file is provided. Charts have not been generated yet.
5. Run complete tests/coverage/build/E2E/CON after the query optimization. The added keyboard/focus and mobile-table assertions are not yet rerun. Current M3 whole-suite/CI success is not claimed. Latest hosted green CI remains M2 commit2040673.
6. Run the new clean-clone rehearsal (not yet exercised), validate setup and fix observed failures. Prepare a source/evidence review ZIP with checksum; no ZIP was produced yet.
7. Update tasks/traceability/contributions/README and dated M3 evidence honestly; then commit/push verified work and check CI when the student authorizes continuation.

Pending changes were saved as a local checkpoint. Prepared defense worksheets/demo/security/deployment/release notes are drafts for inspection. Genuine individual teammate cases/reviews, teacher acceptance of the directory substitute and actual deadlines remain unresolved. Do not invent participation, mastery or approval. No college submission or public deployment has occurred.
