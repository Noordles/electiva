# Requirements, acceptance criteria and traceability

Source labels refer to preserved originals: **G** = 00-general-specifications.md, **T** = tema1-course-enrollment.md, **P** = 01-architectural-challenges.md. Section numbers refer to their English headings. The table describes final required evidence; current M2 implementation/verification is in milestones/M2.md and artifacts/m2/verification.json. Team design choices remain explicit.

M2 supplies persisted/authenticated student workflows, protected administration APIs, database/concurrency checks, synthetic seeding, all-backend coverage, a separate HTTP simulator and actual student-browser evidence. Remaining gaps affect R07/R10/R14 full administration UI, R12 substitute acceptance, R20/R22/R23 measured SCL, R26/R27/R28 broader recovery/security/package audit, R29 genuine individual cases and R30–R33 final reviews/reproducibility/delivery. No full-project acceptance or grade is claimed.

| ID | Requirement and source | Planned work | Required completion evidence |
|---|---|---|---|
| R01 | Correct team/theme, max three; G§1, T heading | N01, I01 | JIN roster, theme 1, three names, CON+SCL |
| R02 | JavaScript ESM, Node LTS, Express; G§2 | N01, J02 | Locked runtime/dependencies; executable API; no TS |
| R03 | React + Vite SPA/native fetch; G§2 | I02, I05 | Working frontend backed by real API |
| R04 | Sequelize + SQLite relational integrity; G§2–3 | N02, N04 | Migrations, FK/check/unique/trigger tests on real file DB |
| R05 | Real authentication, student/admin roles; G§3.1, T§6 | N05, I05, N10 | 401/403, sessions/logout, no role escalation |
| R06 | Related entities and integrity; G§3.2 | N04 | Schema, migrations, rollback and invalid-FK checks |
| R07 | ≥3 full workflows/acceptance criteria; G§3.3 | I01, N08, I08 | W1–W5 below; automated critical paths |
| R08 | Multistate workflow/rules; G§3.4 | N03, N06, I06 | Enrollment/waitlist/cancel/re-enroll transition tests |
| R09 | Server validation/consistent errors; G§3.5 | J02, N05, I04 | Error envelopes and negative API tests |
| R10 | UI loading/error states, responsive; G§3.5/8 | I02, I05, N08, I08, J08 | Slow/failure/empty/conflict states; keyboard/mobile checks |
| R11 | Filtering/sorting/pagination; G§3.6 | J04, I05 | Stable pages, combined filters, invalid query tests |
| R12 | Meaningful integration/substitute; G§3.7 | I03, J05 | Contract, simulator HTTP exchange, outage behavior; approval status |
| R13 | Student browse/enroll/cancel/status; T§2 | J04, N06, I06, N08 | Own records only; persisted state survives restart |
| R14 | Admin courses/capacities/windows/reports; T§2 | I04, J06, I08, J08 | Authorized CRUD/archive, controls, accurate counts |
| R15 | Automatic promotion after cancellation; T§2 | I06, I08 | FIFO in same transaction, concurrent cancellation tests |
| R16 | Never exceed capacity; T§3; P/CON | N04, N06, N07 | One-seat race, persisted SQL counts, DB bypass tests |
| R17 | No duplicate active enrollment; T§3 | N04, N07 | Concurrent same-student attempts leave one current membership |
| R18 | Outside-window operations denied; T§3 | N06, I06, N10 | Exact boundary/UTC tests; unchanged DB on rejection |
| R19 | 10,000 synthetic students; T§4 | J06 | Reproducible seed manifest/counts; no real student data |
| R20 | 100 active users; listing p95 <800ms illustrative; T§4 | J03, J09 | Measured endpoint-specific data and stated environment |
| R21 | 20 competing requests for last seat; T§5; P/CON | N07, N09 | 1 enrolled, 19 waitlisted; all outcomes accounted; final DB verified |
| R22 | Three load levels + saturation; G§5, P/SCL | J03, J07, J09 | Raw results, p50/p95/throughput/error/resource charts |
| R23 | One measured optimization, controlled before/after; P/SCL | J10, J11 | Baseline/optimized SHAs, same workload/hardware, explanation |
| R24 | Unit, API/persistence, negative + ≥1 automated E2E; G§4 | N07, I07, J07, I09 | Real test runs; failure output retained |
| R25 | Backend statement/branch coverage, draft ≥70/60; G§4 | J07, N10 | Enforced project targets, HTML/JSON report, justified exclusions |
| R26 | Untested behavior/risk report; G§4 | N10, I10, J11 | Honest gap list tied to modules/features |
| R27 | Passwords, secrets, per-object access, parameterized SQL; G§6 | N05, N10 | Negative security cases, redaction, cookie/CORS/CSRF docs |
| R28 | Exactly two packages with ADR/evidence; G§7, T heading, P composition | N03, J03, N09, J11 | CON+SCL reports and accepted ADRs; no third package scope |
| R29 | AI summary + significant case per student; G§8 | N11, I11, J12 | 3 genuine case records with inspection/correction/results |
| R30 | Incremental Git/contributions/integration; G§9 | all work packages | Actual author/reviewer/evidence SHAs; lockfile; clean history |
| R31 | README/env/setup/seed/test/load/build/prod reproducibility; G§9 | N01, J02, J07, I10, I12 | Fresh-clone production walkthrough |
| R32 | Minimum docs/requirements, architecture, ADR, testing, capacity, AI, packages; G§9 | all document owners | Every file populated with actual evidence at M3 |
| R33 | M1/M2/M3 deliverables; G§10, T§7 | plan gates | Each gate checklist complete; dates remain unknown |
| R34 | Assessment 25%; proposed 30/20/20/10/10/10 rubric; G§1/11 | N12, I12, J12 | Demonstration mapped to criteria; no promised grade |
| R35 | Paid services optional; tests on authorized systems; P boundaries, G§2/6/9 | J05, J07, I10 | Local controlled services; no required paid dependency |

## Complete workflows

**W1 — Discover a course (J04 + I05):** Given an authenticated student, when they filter by term/department, search title/code, select a supported ordering and move pages, then the server returns a bounded stable page with seat availability/window status, and UI displays loading, no-results and recoverable failure states. Query state survives navigation in URL parameters. A closed offering is visible but cannot accept a write.

**W2 — Enroll or join waitlist (N06 + N08):** Given a published offering inside its window and no current membership, when the student enrolls, then exactly one committed ACTIVE or WAITLISTED row appears. Capacity is server-enforced. Repeated submission returns the current membership without creating another one. A full course joins the FIFO waitlist with visible status. Forged student IDs cannot act on another user.

**W3 — Cancel and promote (I06 + I08):** Given an open window and an ACTIVE student A plus WAITLISTED B/C, when A cancels, then A becomes CANCELLED and earliest eligible B becomes ACTIVE in the same transaction, C remains WAITLISTED, and counts stay correct. A repeated cancellation has no extra effect. Cancelling WAITLISTED removes it without releasing a seat. A closed window rejects the mutation without partial changes.

**W4 — Administer offerings (I04 + I08):** Given an admin, create course and offering, set capacity and UTC window, publish, edit and archive appropriately. Reject malformed windows, negative capacity, stale edits and a capacity decrease below active count. A student receives 403 from the API even if they craft the request. Capacity increases promote waitlisted students transactionally while open; unrelated metadata edits do not rewrite enrollment history.

**W5 — Inspect reports and provider data (J05/J06/J08):** Given an admin, view totals and paginated course rosters; compare active/waitlisted/cancelled counts with persisted fixtures. Look up a provider course code through the API adapter, preview details and explicitly import allowed metadata. Provider outage displays a useful error and cannot corrupt existing offerings or enrollments. No student receives another student's roster data.

## Acceptance decisions owned by the team

Use ACTIVE / WAITLISTED / CANCELLED enrollment states, DRAFT / PUBLISHED / ARCHIVED offering lifecycle, FIFO waitlists, open interval policy [open,close), immutable enrollment identity, and no student self-assigned roles. These implement the general multistate requirement; STA is not an assigned package. No official requirement for four enrollment states is inferred from the unused STA package.
