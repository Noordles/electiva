# AI assistance and individual engineering cases

## Planning record — 16 November 2026

Codex read the three supplied Draft v2.0 specifications and roster, corrected earlier topic/package assumptions to course enrollment CON+SCL, prepared traceability/design/work packages, and created the private repository under the student's authorization. Existing Git identity is Al Sammarraie Nooruldeen. Planning artifacts are AI-assisted proposals; students have not yet reviewed/implemented the proposed application, and no student mastery or completed contribution is implied.

The team must inspect proposed diffs and verify behavior independently. Keep a concise record rather than complete chat transcripts. Never fabricate defects, reviewers, test runs or individual work to complete this form.

## Case N — enrollment consistency (future record)

Requirement/source; exact task/commit; prompt/agent contribution summary; student inspection; observed defect/limitation or verification; correction; actual test command and result; remaining limits; what N can explain. Suggested investigation: a naive read-then-insert oversells or an incorrectly scoped transaction fails under20 concurrent requests. Use only a defect actually observed.

## Case I — waitlist/admin/UI lifecycle (future record)

Same fields. Suggested investigation: cancellation commits before promotion, capacity update race, or stale admin form overwrites another update. Document the real behavior, correction and checks observed by I.

## Case J — performance/integration (future record)

Same fields. Suggested investigation: inefficient listing query, misleading aggregate p95, or provider timeout leaks into core flow. Include actual before/after data and what J inspected.

Each member must explain important overall flows and their own code/tests during defense. Future case records can change if a different significant real issue arises.

## M2 implementation — 17 November 2026

Noor asked to continue through the plan, keep commits natural/small and preserve his design direction. Codex implemented the persisted backend and student interface, then exercised real file SQLite, HTTP sessions and production Chromium. Noor's actual design/product steering is credited; direct supervision by Ilinca/Jwan is not claimed without their inspection evidence. team-review.md assigns concrete technical reviews to all three members.

Observed corrections: normal prepared writes initially saw stale schema after migration DDL on another connection; a post-migration schema read corrected the reproduced failure. Multi-instance Windows fixture cleanup initially attempted removal before closing the second connection; registered cleanup ordering fixed it. Password review preserved significant whitespace rather than trimming it. Origin/CSRF, role/owner checks, raw DB guards, rollback, replay and FIFO were tested independently. Native Escape handling now respects pending dialog actions. Coverage installation initially introduced four moderate transitive findings; explicitly pinned patched glob/minimatch dependencies under test-exclude restored audit0, with coverage/build/browser behavior verified.

M2 evidence includes20 authenticated competing students, duplicate clicks, cancellation/capacity/window races, real provider HTTP fault cases,10,000 synthetic student seeding and production student browser flows. The short load smoke is only harness verification. No claimed separate-process recovery, measured SCL improvement, approved substitute, human peer review or individual student mastery is inferred from these results.

## M3 implementation and source audit — 17 November 2026

Codex implemented administration/report/import screens, separate-process crash recovery, expanded security tests and actual performance experiments under Noor's direction. The admin browser test caught an authenticated redirect overriding the admin destination; the role-aware redirect was corrected. SQL profiling supported page-first enrollment-history counting, and matching fixture/result hashes plus repeated HTTP measurements verified it. The student's pause is preserved in the checkpoint and interrupted overload snapshot; resumed measurements are explicitly identified.

A final audit against the literal source invariant reproduced two ACTIVE enrollments for one course through distinct offerings. The original guard was per offering. Migration2/service checks now protect current requests across the course, reject unsafe legacy duplicates without deleting data and preserve original migration checksums. Regression/raw-SQL/upgrade tests verify this correction. This is an actual AI implementation/audit finding; no teammate is claimed to have independently discovered or reviewed it.

The prepared member worksheets identify concrete code, findings, tests and explanation prompts. They remain pending genuine personal inspection/reflection. Source study, automated checks and a prepared script are not evidence that the student mastered the code or that all three supervised this session directly.

Full verification exposed two further concrete issues: the directory success test used an artificial100ms deadline under concurrent startup, and the keyboard test lost focus when Escape unmounted a controlled dialog. Success HTTP checks now use the actual2s adapter contract, while the deliberate timeout keeps a short deadline. Dialog teardown explicitly restores its opener or the main region. The clean rehearsal also revealed NODE_ENV=development selecting a development React bundle; the build now sets production mode before loading Vite and rehearsal asserts the development notice is absent. Initial failure/output artifacts remain in artifacts/m3. These corrections are attributed to the AI-assisted implementation/test session, not invented teammate reviews.


## Phase 1 implementation — 16 November 2026

Codex implemented/verified the M1 workspace, API foundation, preview SPA, contracts and SQLite spike. Initial 100ms SQLite busy waits caused worker contention; bounded asynchronous acquisition retries with zero driver wait resolved the final tested spike without rollback warnings. Browser inspection also caught and corrected a local UTF-8 rewrite regression before delivery. The student's later steering changed the initial green palette to wine/cyan using their thesis stylesheet. Actual tests/evidence are in artifacts/m1 and milestones/M1.md. All commits use the real configured author, with planned-owner/task trailers. No peer review, individual human implementation or mastery is invented. The three future student engineering cases remain pending actual student participation.
