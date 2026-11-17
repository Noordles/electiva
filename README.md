# Electiva

**Team JIN · ASE Web Technologies · Theme 1: University Course Enrollment · CON + SCL**

## Current milestone

**M3 technical review candidate:** integrated student and administrator workspaces, persisted enrollment/FIFO, course-level integrity guards, real directory HTTP integration, independent-process crash recovery, automated production-browser journeys and measured CON/SCL evidence. See [M3 verification](docs/milestones/M3.md) and the [performance report](docs/capacity-results.md).

The student resumed after the recorded app-review pause. The [checkpoint](docs/CHECKPOINT.md) preserves that history. Genuine individual member reviews/cases, teacher acceptance of the proposed integration substitute and actual submission dates remain open. This repository distinguishes technical verification from final college acceptance.

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
npm run verify:m3
npm run rehearse
npm run start:production
```

Production-mode local check: **http://127.0.0.1:3000/courses**. Built files use SPA deep-link fallback; unknown APIs/assets stay JSON404. For local HTTP sign-in set COOKIE_SECURE=false in .env; production otherwise defaults to Secure cookies for HTTPS. The application binds only to loopback; do not expose synthetic accounts publicly. Browser tests require the build and local Chromium; on Linux install with `npx playwright install --with-deps chromium`.

- `/health` and `/api/v1/health`:200 for process liveness.
- `/ready` and `/api/v1/ready`: actual database readiness; 200 when ready.
- `/api/v1/meta`: reports M3 and implemented capabilities.
- `npm test`: unit/API/persistence/negative/concurrency tests, isolated temporary file databases and synthetic accounts.
- `test:coverage`: c8 statement/branch report for all server/src files, including unexecuted startup code; enforces draft70/60 targets. HTML/LCOV/JSON generated in ignored coverage/.
- `test:e2e` / `test:ui`: production-browser student/admin flows, stale forms, provider errors, keyboard/focus and widths360/768/1280. Critical enrollment APIs are real.
- `test:concurrency`: independent application processes,20 authenticated students, duplicate clicks, capacity/cancellation/window races and durable rollback after killing a process mid-transaction.
- `verify:m3`: records exact local source hashes, commands and exits for tests/coverage/build/E2E/CON/audit. `rehearse` verifies a fresh local clone/install/migrate/seed/build/production HTTP flow.
- `load:baseline`: repeated10/50/100-user scenarios on10,000 students/50,000 attempts. `load:saturation` uses a separate no-think overload model; give a new output path for a new experiment. `load:compare` regenerates saved CSV/PNG/SVG reports with the optional Python/Matplotlib environment in tools/analysis-requirements.txt. [Protocol](docs/capacity-protocol.md) explains exact clocks/fixtures/windows and reproduction.
- `spike:sqlite`: temporary local DB with 20 claimants, two Sequelize writer instances, rollback and integrity checks. It is not the authenticated HTTP CON acceptance test.
- CI installs/tests/checks coverage/builds/runs Chromium. Hosted results are verified separately. Heavy performance runs stay local/manual and never target a public service.

Saved M3 evidence includes the measured catalog improvement, overload failures and recovery, full coverage and dependency audit. These are dated checks, not a security certification or long-duration production SLA. Runtime/OS/hardware and short experiment limits are preserved with the data.

## Documents

[Requirements](docs/requirements.md) · [Permissions](docs/permissions.md) · [Schema](docs/schema.md) · [Architecture](docs/architecture.md) · [API contract](docs/api.md) · [UI](docs/ui.md) · [Testing](docs/testing.md) · [Capacity](docs/capacity.md) · [CON decision](docs/adr/0001-enrollment-consistency.md) · [SCL decision](docs/adr/0002-capacity-optimization.md) · [AI assistance](docs/ai-usage.md) · [Contributions](docs/contributions.md).

Team: **Al-Sammarraie Nooruldeen Sameer Fawzi; Ilinca-Mara Vlădescu; Taya Jwan**. Git history uses the actual configured author identity. Task ownership remains distinct from completed human contribution/review.

## Runtime storage and limits

The application database defaults to `%LOCALAPPDATA%/Electiva/dev.sqlite` outside this OneDrive checkout. Relative, in-memory, OneDrive and UNC runtime paths are rejected. Migrations run idempotently at startup with checksum validation. Keep credentials, sessions, runtime DB/WAL files and node_modules out of Git.

Noor supplied product/design direction and requested incremental tested implementation. Codex assisted implementation and verification. [Team review guide](docs/team-review.md) assigns each member a balanced technical inspection; the contribution ledger records reviews when they happen. No teammate supervision or approval is invented.

All three source specifications remain user-supplied Draft v2.0. Milestone dates are unknown. FIFO/window policies and the directory substitute remain explicit team choices; instructor acceptance of the substitute is unverified. The [release checklist](docs/release.md) and [demo plan](docs/demo.md) keep final review/upload under student control. No public deployment, teammate invitation, attendance action, email or college submission is performed.
