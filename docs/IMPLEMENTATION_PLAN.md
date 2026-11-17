# Electiva — complete implementation plan

**Team JIN · Theme 1 · ASE Web Technologies · 2026–2027**  
Prepared 16 November 2026 from the three user-supplied specifications. Current state: **M1 and M2 technically implemented**, plus the N08 student interface. Remaining M3 work and genuine teammate reviews stay pending. See milestones/M2.md. See [M1 evidence](milestones/M1.md).

Electiva is a university elective-course enrollment SPA. Students discover offerings, enroll or join a waitlist, cancel and check their status. Administrators manage courses, capacities, enrollment windows and reports. Backend/database rules preserve seat capacity and unique current enrollment under concurrency. The two assigned architectural packages are **CON (Concurrency and Consistency)** and **SCL (Scalability and Capacity)**.

This replaces earlier provisional equipment-booking and STA suggestions. Team name JIN does not determine the product name. The private repository is https://github.com/Noordles/electiva . No official milestone deadlines are supplied.

## 1. What counts as complete

Deliver a working JavaScript ESM full-stack app: React/Vite frontend, Node LTS/Express REST API, Sequelize/SQLite persistence; real student/admin authentication/authorization; course search/filter/sort/pagination; enroll/cancel/status; FIFO promotion after cancellation; admin capacity/window/report management; one meaningful external-service integration or documented accepted substitute; responsive/error-aware UI; backend/database invariants; real automated tests/coverage; measured concurrency/load/saturation/optimization evidence; required documentation; attributable Git work; three real individual AI-assisted engineering cases; reproducible production-mode demo.

Governing sources are in [docs/sources](sources/). All say **Draft v2.0 for review**. Coverage70% statements/60% branches are proposed source thresholds; listing p95<800ms is illustrative. Adopt those provisionally as engineering gates and record any revised teacher instruction. The project is25% of the course grade; the proposed project rubric weights core correctness30%, CON20%, SCL20%, tests10%, Git/individual work10%, docs/capacity/defense10%. Do not promise a grade.

## 2. Equal work and responsibility

| Owner | Name from the team register | Role mix | Packages | Points |
|---|---|---|---:|---:|
| N | Al-Sammarraie Nooruldeen Sameer Fawzi | Data/auth/enrollment, student actions UI, CON/security, tests/docs | 12 | 40 |
| I | Ilinca-Mara Vlădescu | Acceptance/contracts, admin/waitlist, login/catalog/admin UI, E2E/docs | 12 | 40 |
| J | Taya Jwan | API/catalog/seed/integration, reports/provider UI, SCL/tooling/tests/docs | 12 | 40 |
| Total | Team JIN | Cross-reviewed integrated product | 36 | 120 |

Each member has M1=9, M2=15, M3=16 estimated effort points. Points are relative planning units, not exact hours. Rebalance future work if real effort differs. Reviews: I reviews N, J reviews I, N reviews J. Each member must explain overall workflows and their own work; no specialist is excused from understanding invariants or tests. [Team record](team.md) preserves the roster's additional A initial without inventing its expansion.

Every package has steps, dependencies, file boundaries, an acceptance gate and one proposed short commit subject in [TASKS.md](TASKS.md). Machine-readable [tasks.json](tasks.json) is the same backlog. M1/M2 tasks and N08 are implemented_verified in tasks.json; I09 is partial; other M3 tasks remain planned. Planning artifacts are not completed application contributions.

## 3. Bottom-up execution phases

### Phase0 — preserve evidence and settle scope

Read G/T/P together; record the actual names/theme/packages, source hashes, draft status, missing dates and proposed policy. Preserve originals under subject Downloaded Materials; copy source documents into the private repo. Create the authorized repository and planning commits. The initial planning session completed these actions; subsequent M1 implementation is recorded in milestones/M1.md.

Resolve or record [open decisions](OPEN_DECISIONS.md): simulator acceptance; window/cancellation/promotion interpretation; FIFO/capacity-change behavior; supported dependency versions; exact teammate Git identities. Design can continue with explicit proposals while awaiting teacher clarification. Do not claim a substitute is approved or communicate with teacher/team without instruction.

### Phase 1 — runnable foundation and agreed contracts (M1)

1. N01 initializes locked npm workspaces and environment boundaries. J02 starts Express health/error/config lifecycle; I01 writes requirements/permission/workflow acceptance criteria.
2. N02 defines relational model/invariants/transaction boundary; I02 builds the actual React/Vite responsive shell; J01 defines tests/workload/evidence.
3. I03 freezes API/UI/provider contracts; N03 runs the SQLite concurrency spike and proposes ADR0001; J03 fixes the SCL experiment protocol and ADR0002 alternatives.
4. Inspect/review diffs and startup checks. M1 demonstrates health/API plus SPA shell, documented schema/API/workflows/invariants, both package alternatives, seed/workload assumptions and planned tests. Authentication/enrollment need not be falsely portrayed as implemented at this stage.

**M1 gate:** N01–N03, I01–I03, J01–J03 actually done; repository/team docs, runnable skeleton, roles/3+ flows, schema/API, architecture, CON/SCL alternatives, load model and test plan reviewed. No test/performance results invented. Dates remain unknown.

### Phase2 — database and identity before business writes

1. N04 migrates real file-backed SQLite and proves DB-level capacity/uniqueness/FK/CHECK protection, including raw-SQL bypasses. Keep live files outside OneDrive.
2. N05 implements hashed passwords, sessions, CSRF, ownership and role checks; run actual auth/security tests.
3. I04 implements authorized course/offering/window/capacity lifecycle; J04 implements database-filtered, ordered, bounded catalog; J05 implements separate HTTP provider simulator/adapter, preview and import.
4. Inspect contract coherence before connecting real UI. No enrollment logic assumes client-provided identity or availability.

**Exit:** schema survives restart; student/admin distinction is real; malformed/unauthorized requests are rejected before mutation; catalog/admin/provider APIs have integration evidence.

### Phase3 — critical enrollment and waitlist transactions (M2)

1. N06 implements enroll/queue/replay inside short immediate transactions. I06 implements cancellation plus FIFO promotion in the same transaction and promotion on valid capacity increases.
2. J06 creates reproducible demo/10,000-student profiles and accurate reports; I05 connects login/catalog SPA to real APIs.
3. N07 proves the canonical20-request/one-seat race and concurrent duplicate student attempts; I07 covers lifecycle races/rollback and admin limits. J07 aggregates real tests/coverage/load harness/CI after domain tests exist.
4. Review SQL after writes, not just HTTP statuses. Correct failures before extending UI. Complete initial coverage and record any gaps.

**M2 gate:** all tasks04–07 for N/I/J actually complete; functional persisted API, security, core rules, unit+integration/negative tests, initial backend statement+branch report, and at least the canonical CON scenario demonstrated. Provider approval status remains transparent. No SCL speed claim yet.

### Phase4 — complete vertical user journeys

1. N08 implements real enrollment/detail/my-status/cancellation UI.
2. I08 implements admin course/offering/window/waitlist UI.
3. J08 implements admin reports and directory-preview/import UI.
4. Each owner tests loading/error/empty/permission/mobile states. N09 extends concurrency testing across processes, window-lock races and recovery; N10 closes meaningful coverage/security gaps.
5. I09 automates production-mode admin plus two-student enrollment→waitlist→cancel→promotion flow. Confirm reload/persistence and crafted unauthorized requests fail.

**Exit:** W1–W5 can be demonstrated on real persisted data with real session boundaries; at least one full mandatory E2E passes; no API mocked in that critical proof.

### Phase5 — measure capacity, optimize, and reverify SCL

1. J09 tags a correctness-verified baseline, records hardware/runtime/data hashes, and runs 10/50/100 active-user levels plus controlled saturation, three repetitions per version.
2. Inspect actual query/event-loop/SQLite bottlenecks. J10 implements one small measured optimization (initial hypothesis: catalog query/index access), preserving every safety constraint.
3. J11 repeats identical load/data/environment conditions for before/after comparison; publishes numerical summaries/charts, test SHA references, sustainable tested capacity and limitations. Failed hypotheses remain visible; iterate if no optimization was demonstrated.
4. Re-run CON/security/E2E against optimized release. Resource/RPS/latency results are hardware/profile-specific; no direct RPS contest across student computers.

**Exit:** CON and SCL independently verified; report endpoint p50/p95, throughput, unexpected/expected errors and observable CPU/memory; explain saturation/recovery and measured improvement. No theory-only package acceptance.

### Phase6 — reproducible delivery and individual defense (M3)

1. I10 performs fresh-clone install/migrate/seed/build/production startup and writes verified commands.
2. N11/I11/J12 document one genuine inspected AI-assisted technical case each, actual commits and tests; assign demo segments and practice answers.
3. N12 audits R01–R35, commit/reviewer/evidence ledger, package ADRs, coverage and known gaps; I12 verifies delivery bundle and rehearses the production demo.
4. Tag M3 only after all evidence exists. Student performs upload and other course actions separately; no automatic submission, attendance or email.

**M3 gate:** working integrated SPA; correct persisted rules; real E2E; CON+SCL evidence+ADRs; coverage>=provisional 70/60 with honest gap report; measured capacity+saturation+optimization; approved integration or explicit unresolved approval; clean reproducible production instructions; complete docs; true individual contribution/AI cases; demonstration and archive integrity.

## 4. Planned structure

```text
Electiva/
  package.json                 # future workspace scripts
  package-lock.json            # future locked dependencies
  .env.example                 # future harmless configuration
  client/src/{app,components,features,styles}/
  server/src/{auth,catalog,courses,offerings,enrollments,reports,integrations,db,middleware}/
  server/migrations/
  server/tests/{unit,integration,security,concurrency}/
  services/course-directory-simulator/
  tools/{seed,load,results,spikes}/
  tests/e2e/
  artifacts/{con,capacity,coverage}/
  docs/{sources,adr,packages,defense}/
```

M1 workspace/API/SPA foundation and probe code now exist; the structure below also includes future M2/M3 directories. Runtime DBs, secrets, dependencies and generated builds never become repository source. Generated report files are recorded only after actual runs; bulky raw data stays separately referenced.

## 5. Decisions that prevent expensive rework

- **Identity before writes:** session identity determines student/role; UI role menus cannot authorize APIs.
- **DB before UI:** capacity guards/partial unique/current-state integrity and real locking spike precede enrollment widgets.
- **Atomic cancel/promote:** one transaction preserves seat accounting and queue fairness through failure/races.
- **Time on server:** UTC [open,close), reread after lock, explicit policy for cancellation/promotion. No browser clock authorization.
- **Query at database:** bounded stable pages, validated sort/filter, no full RAM collection scan/slice.
- **Integration independent:** versioned separate HTTP simulator proposal, meaningful metadata preview/import, no external call in enrollment transaction.
- **Correctness before performance:** do not remove guards, reduce dataset, change workload or omit error responses to obtain a better chart.
- **Actual attribution:** planned ownership is not completed authorship. Do not fabricate teammate Git identities or contribution evidence.

[architecture.md](architecture.md) gives the schema, state machine and transaction algorithm. [api.md](api.md) freezes requests/errors; [ui.md](ui.md) assigns screen behavior; [requirements.md](requirements.md) maps all 35 acceptance items to tasks and evidence.

## 6. Verification and required artifact contract

Final command contract is in README. Implement real `npm test`, `test:coverage`, `test:concurrency`, `test:e2e`, seed/migrate/build/production and load/compare commands. Each task declares the checks it needs; do not repeatedly run costly unrelated load tests for document edits.

At each integration gate capture SHA, time, command/exit status, dependency/runtime/fixture version and evidence paths. CON checks 20 simultaneous distinct student sessions for 1 place and independently inspects persisted 1 ACTIVE / 19 WAITLISTED; duplicates, cancellation/queue races, capacity edits and closed windows receive separate checks. Coverage includes all authored backend application files. E2E exercises the production build. SCL uses3 load levels plus saturation and matched before/after experiments. [testing.md](testing.md) and [capacity.md](capacity.md) specify the full protocols.

## 7. Commit and review execution

Commit incrementally after each coherent task or behavior and its meaningful checks. Proposed messages are short conventional subjects, such as `feat(enrollment): allocate seats transactionally`, `feat(waitlist): promote students after cancellation`, and `perf(catalog): optimize measured listing bottleneck`. [COMMIT_PLAN.md](COMMIT_PLAN.md) lists all 36 subjects and the actual planning-session commit boundaries.

Keep author identity accurate, preserve teammate commits and record actual reviews/tests. Stage only relevant files and inspect staged diffs. No empty, backdated or fake author commits to make equal contribution counts. Collect real I/J GitHub identities before attributed implementation. Future owner labels in documentation do not imply that students reviewed this plan or wrote its AI-assisted text.

## 8. Risks, stopping rules and deferred extras

Critical early risk: selected Sequelize/SQLite driver transaction semantics under simultaneous requests. Resolve via spike before business implementation. Database runtime lives outside OneDrive and never on a shared network path. Bounded busy retries can produce a safe503, but the canonical20-request test must account for every expected successful enrollment/waitlist outcome and cannot pass by ignoring503s.

Other risks: source revision before milestone, unconfirmed simulator approval/window policy, workload generator competing with server CPU, thin coverage that misses races, stale admin forms, raw artifact token leakage. Owners and responses are in tasks/testing/capacity/open decisions.

Priority waitlists, batch enrollment, live notifications, public self-registration, extra roles, payments, complex microservices/cloud deployment and extra architectural packages are deferred. Standard FIFO waitlisting, basic external integration/security and capacity measurement remain mandatory. When hardware cannot sustain the illustrative profile, document real measurements and seek the instructor's justified adjustment rather than silently shrink the requirement.

## 9. Definition of done for every task

Code/docs address the stated acceptance condition; diff reviewed; meaningful relevant checks actually pass; no new critical regression; no secrets/unrelated files; work committed with accurate subject/author; actual reviewer/evidence recorded; required docs/AI case updated where relevant; unresolved limits explicit. A planned task, a generated file or an install success is not evidence of a working feature.

## 10. Complete task index

| Task | Milestone | Owner | Points | Depends on | Outcome |
|---|---|---|---:|---|---|
| I01 | M1 | I | 3 | N01 | Specify roles, workflows and acceptance criteria |
| J01 | M1 | J | 3 | N01, I01 | Design workload, test and tooling strategy |
| N01 | M1 | N | 3 | — | Establish repository and reproducible workspace |
| I02 | M1 | I | 3 | N01, J02 | Create responsive React shell and components |
| J02 | M1 | J | 3 | N01 | Build Express API foundation and error contract |
| N02 | M1 | N | 3 | N01, I01, J02 | Design schema and transaction boundaries |
| I03 | M1 | I | 3 | N02, J02 | Freeze API, UI and provider contracts |
| J03 | M1 | J | 3 | N02, I03, J01 | Specify provider and SCL experiment alternatives |
| N03 | M1 | N | 3 | N02, I03 | Spike SQLite locking and record CON decision |
| I04 | M2 | I | 4 | N04, N05, I03 | Implement admin course and offering management |
| J04 | M2 | J | 4 | N04, N05, I03 | Implement catalog filtering, ordering and pagination |
| N04 | M2 | N | 4 | N03 | Implement schema, migrations and DB guards |
| I05 | M2 | I | 4 | N05, J04, I02 | Integrate login and searchable student catalog |
| J05 | M2 | J | 4 | I03, N04, N05 | Implement directory integration and controlled simulator |
| N05 | M2 | N | 4 | N04, J02 | Implement authentication and server permissions |
| I06 | M2 | I | 4 | N06 | Implement atomic cancellation and FIFO promotion |
| J06 | M2 | J | 4 | N04, I04 | Seed synthetic workload and implement report queries |
| N06 | M2 | N | 4 | N05, I04 | Implement transactional enrollment service |
| I07 | M2 | I | 3 | I06, N07 | Test lifecycle races and administration rules |
| J07 | M2 | J | 3 | N07, I07, J04, J05, J06 | Wire real tests, coverage and load harness |
| N07 | M2 | N | 3 | N06, I06 | Prove last-seat and duplicate-request invariants |
| I08 | M3 | I | 4 | I04, I06, I02 | Build admin management and waitlist screens |
| J08 | M3 | J | 4 | J05, J06, I02 | Build report and provider administration UI |
| N08 | M3 | N | 4 | I05, N07, I06 | Build student enrollment and status interface |
| I09 | M3 | I | 3 | N08, I08, J08, N10 | Automate production end-to-end workflows |
| J09 | M3 | J | 3 | J07, N09, J08 | Measure baseline load and saturation |
| N09 | M3 | N | 3 | N07, J07, I07 | Extend concurrency proof across cancellation and processes |
| I10 | M3 | I | 3 | I09, J11 | Document and rehearse clean production setup |
| J10 | M3 | J | 3 | J09 | Optimize one measured catalog bottleneck |
| N10 | M3 | N | 3 | J07, N09, I07 | Close backend security and coverage gaps |
| I11 | M3 | I | 3 | I09 | Write individual waitlist case and demo script |
| J11 | M3 | J | 3 | J10 | Publish controlled comparison and capacity estimate |
| N11 | M3 | N | 3 | N10 | Write individual consistency case and defense notes |
| I12 | M3 | I | 3 | N12, I10, J12 | Prepare final demonstration and delivery bundle |
| J12 | M3 | J | 3 | J11 | Write individual performance case and verify evidence |
| N12 | M3 | N | 3 | I10, I11, J12, N11 | Verify rubric traceability and release integrity |
