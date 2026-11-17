# Final technical evidence and remaining acceptance gates

Source IDs/locators are defined in requirements.md and preserved source originals. These statuses refer to observed technical evidence, not a teacher grade or human mastery. Command exits/timestamps/source hashes are in artifacts/m3/verification.json; controlled performance snapshots are named in capacity-results.md.

| Requirement | Status | Concrete evidence / limit |
|---|---|---|
| R01 team/theme | Verified | team.md; three supplied roster names; theme1; CON+SCL |
| R02 runtime/ESM | Verified | package.json/lock, .node-version; server/client JavaScript ESM; clean installation |
| R03 React/Vite API SPA | Verified | client/src, tools/build.mjs; production browser tests; no mock critical enrollment API |
| R04 Sequelize/SQLite | Verified | db/database.js models/queries; ordered migrations; database.test.js |
| R05 roles/auth | Verified | auth.js; auth.test.js/security.test.js/business-api.test.js; real sessions/401/403 |
| R06 related entities | Verified | users/sessions/courses/offerings/enrollments; FK/check/unique/triggers; unsafe migration refusal |
| R07 complete workflows | Verified technically | W1–W5, student-flow.test.js and admin-flow.test.js; browse/enroll/waitlist/cancel/promote/admin/import/report |
| R08 multistate rules | Verified | enrollment.test.js, admin.js; DRAFT/PUBLISHED/ARCHIVED and ACTIVE/WAITLISTED/CANCELLED |
| R09 validation/errors | Verified | validation.js/errors.js, HTTP negative suites, invalid UTC/field/query/body checks |
| R10 frontend states | Verified for recorded scope | loading/error/empty/conflict states; failure Retry; keyboard opener/Escape/focus;360/768/1280 and mobile tables; full assistive-technology audit absent |
| R11 filter/sort/page | Verified | catalog.test.js; SQL stable ties and page-first baseline equivalence; URL filters |
| R12 meaningful integration | Implemented; approval open | separate HTTP simulator/adapter; directory.test.js and browser import/outage; teacher acceptance unverified |
| R13 student actions/persistence | Verified | student/browser/API suites; actual process restart/session/durable-state proof |
| R14 administrator flows | Verified | admin UI, version-aware API, rosters, course search, reports; admin-flow.test.js |
| R15 promotion | Verified | FIFO in cancellation/capacity transaction; lifecycle/concurrency/browser/process tests |
| R16 capacity | Verified | SQL INSERT/UPDATE/capacity-edit guards; last-seat and post-load SQL audits |
| R17 duplicate course request | Verified | partial offering index plus migration2 course-level INSERT/UPDATE triggers; cross-offering regression and legacy preflight |
| R18 enrollment window | Verified | injected-clock boundaries, lock-wait closure, real HTTP denial; [open,close) policy documented |
| R19 synthetic scale | Verified | seed.test.js; capacity fixture10,000 students/100 offerings/50,000 attempts; no real student dataset |
| R20 ordinary100-user objective | Measured within limits | three final guard-validation runs p95≤137.30ms,0 errors; short classroom windows, highest ordinary level tested |
| R21 twenty competing students | Verified | real sessions/two processes;1 ACTIVE/19 WAITLISTED; persisted outcomes |
| R22 load levels/saturation | Measured | three matched10/50/100 repetitions; separate100/200/400 overload, failed baseline safety stop/recovery retained |
| R23 measured optimization | Measured |2363b72→5aa19c7 query change; matching fixture/result hashes, plans, repeated JSON/CSV/plots; later guard validation separate |
| R24 test layers/E2E | Verified | npm test, coverage, production Chromium student/admin/recovery tests; initial failures retained and repaired |
| R25 coverage | Verified against draft gates | all server/src included, enforced70/60; JSON/HTML/LCOV reports; no hard modules hidden |
| R26 gaps/risks | Documented | testing.md/security.md/capacity-results.md; unexecuted coverage startup, deployment/encoding/shutdown/assistive-tech/long-duration limits |
| R27 security | Verified for scope | salted scrypt, hashed sessions, cookie/CSRF/Origin/role/object checks, bound parameters/limits, secret scan; no penetration-test certification |
| R28 exactly CON+SCL | Technically demonstrated | packages/concurrency.md and SCL.md; ADR0001/0002; human peer acceptance pending |
| R29 individual AI cases | Pending human participation | ai-usage.md and three prepared defense worksheets; genuine inspection/reflection not fabricated |
| R30 Git/contributions | Partial acceptance | incremental verified-author commits and AI assistance; actual teammate reviews/authorship require real evidence |
| R31 reproducible setup | Verified technically | clean clone npm ci/migrate/seed/build/production receipt; explicit local storage/credentials and optional plotting dependency |
| R32 required documentation | Populated | requirements/architecture/ADRs/testing/capacity/security/AI/packages/setup/demo/release plus saved evidence |
| R33 milestones | Technical M1–M3 candidate | milestone reports; final acceptance waits on genuine cases/reviews, integration approval and actual dates |
| R34 defense/grade | Human gate | proposed team demo and question guide; no rehearsal/grade claim |
| R35 cost/authorized systems | Verified scope | local loopback fixtures, no required paid API or public load target; no college submission/mail/attendance actions |

Evidence generation does not establish individual student mastery. The review ZIP is a technical candidate for the team's inspection, with those open acceptance gates preserved.
