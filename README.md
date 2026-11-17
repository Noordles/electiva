# Electiva

**Team JIN · ASE Web Technologies · Theme 1: University Course Enrollment · CON + SCL**

## Current milestone

**M2 implemented and technically verified:** real sign-in, persisted catalog, enrollment, cancellation, FIFO waitlists and protected administrator APIs. The student enrollment interface was also brought forward from M3. Administration/report/import screens, measured SCL experiments, separate-process recovery and genuine individual teammate reviews remain outstanding. See [M2 evidence](docs/milestones/M2.md).

**Designed by Noor.** The wine/cyan visual system follows his Iraq Economic Observatory direction and supplied Electiva icon. [Design tokens](docs/design-system.md) · [Full implementation plan](docs/IMPLEMENTATION_PLAN.md) · [Granular backlog](docs/TASKS.md).

## Quick start

Tested runtime: **Node 24.22.1, npm 12.2.0**. Use Node 24 LTS within the declared engines. Install Node/npm normally; then from this repository:

```sh
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

Open **http://127.0.0.1:5173/courses**. The API is on127.0.0.1:3000; Vite proxies `/api`. Copy `.env.example` to `.env` to change ports or the local database path. Stop with Ctrl+C.

The seed creates synthetic accounts and prints the path to a private local `demo-accounts.json`, next to the database. Default Windows location: `%LOCALAPPDATA%/Electiva/demo-accounts.json`. It contains the generated password and demo emails `student1@example.test` / `admin@example.test`. These are separate from ASE accounts. No password is committed. Seeding refuses to replace existing data. The fictional enrollment window is 30 days from seeding, unrelated to college deadlines.

`npm run db:seed:large` creates 10,000 students and 100 courses/offerings in an empty database. Set DATABASE_PATH to a separate absolute local file to retain both fixtures. `npm run dev:directory` starts the proposed separate HTTP metadata simulator on127.0.0.1:3100. Teacher acceptance of this substitute remains unverified.

SQLite's pinned native install script is approved only for `sqlite3@6.0.1` in this project's npm 12 allowScripts policy. A clean temporary install was verified. No global script/security setting was changed, and no native binary is committed.

## Verify

```sh
npm test
npm run test:coverage
npm run test:concurrency
npm run build
npx playwright install chromium
npm run test:e2e
npm run load:smoke
npm run start:production
```

Production-mode local check: **http://127.0.0.1:3000/courses**. Built files use SPA deep-link fallback; unknown APIs/assets stay JSON404. For local HTTP sign-in set COOKIE_SECURE=false in .env; production otherwise defaults to Secure cookies for HTTPS. The application binds only to loopback; do not expose synthetic accounts publicly. Browser tests require the build and local Chromium; on Linux install with `npx playwright install --with-deps chromium`.

- `/health` and `/api/v1/health`:200 for process liveness.
- `/ready` and `/api/v1/ready`: actual database readiness; 200 when ready.
- `/api/v1/meta`: reports M2 and implemented capabilities.
- `npm test`: unit/API/persistence/negative/concurrency tests, isolated temporary file databases and synthetic accounts.
- `test:coverage`: c8 statement/branch report for all server/src files, including unexecuted startup code; enforces draft70/60 targets. HTML/LCOV/JSON generated in ignored coverage/.
- `test:e2e` / `test:ui`: real production-browser student flow with two sessions, persisted promotion and responsive widths360/768/1280. Administration UI journeys remain pending.
- `load:smoke`: bounded two-second/10-user harness check against10,000 synthetic students, including SQL invariant verification. This is not SCL capacity evidence. `npm run load:baseline -- --users 50 --seconds 15 --output artifacts/raw/load-50.json` runs another local scenario.
- `spike:sqlite`: temporary local DB with 20 claimants, two Sequelize writer instances, rollback and integrity checks. It is not the authenticated HTTP CON acceptance test.
- Saturation and controlled comparison commands remain explicit pending failures until M3. CI installs/tests/checks coverage/builds/runs Chromium; hosted results are verified separately.

`npm audit` is recorded separately; the M2 lockfile returned zero findings after selecting patched coverage-tool transitive versions. This is a dated check, not a security certification.

## Documents

[Requirements](docs/requirements.md) · [Permissions](docs/permissions.md) · [Schema](docs/schema.md) · [Architecture](docs/architecture.md) · [API contract](docs/api.md) · [UI](docs/ui.md) · [Testing](docs/testing.md) · [Capacity](docs/capacity.md) · [CON decision](docs/adr/0001-enrollment-consistency.md) · [SCL decision](docs/adr/0002-capacity-optimization.md) · [AI assistance](docs/ai-usage.md) · [Contributions](docs/contributions.md).

Team: **Al-Sammarraie Nooruldeen Sameer Fawzi; Ilinca-Mara Vlădescu; Taya Jwan**. Git history uses the actual configured author identity. Task ownership remains distinct from completed human contribution/review.

## Runtime storage and limits

The application database defaults to `%LOCALAPPDATA%/Electiva/dev.sqlite` outside this OneDrive checkout. Relative, in-memory, OneDrive and UNC runtime paths are rejected. Migrations run idempotently at startup with checksum validation. Keep credentials, sessions, runtime DB/WAL files and node_modules out of Git.

Noor supplied product/design direction and requested incremental tested implementation. Codex assisted implementation and verification. [Team review guide](docs/team-review.md) assigns each member a balanced technical inspection; the contribution ledger records reviews when they happen. No teammate supervision or approval is invented.

All three source specifications remain user-supplied Draft v2.0. Milestone dates are unknown. FIFO/window decisions and local external-directory substitute are explicit team proposals; instructor acceptance of the substitute remains unverified. No public deployment, teammate invitation, attendance action, email or submission is part of M1.
