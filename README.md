# Electiva

**Team JIN · ASE Web Technologies · Theme 1: University Course Enrollment · CON + SCL**

## Current milestone

**Phase 1 / M1 implemented:** a runnable Express API and responsive React/Vite preview, reproducible workspaces, frozen design contracts and a real-file SQLite transaction experiment. Sign-in, persisted catalog, enrollment, waitlists and admin business APIs are intentionally M2/M3 work. The preview labels all sample courses; it never creates a fake enrollment or grants administrator rights.

The wine/cyan visual system follows the student's Iraq Economic Observatory direction. [Design tokens](docs/design-system.md) · [M1 evidence and scope](docs/milestones/M1.md) · [Full implementation plan](docs/IMPLEMENTATION_PLAN.md) · [Granular backlog](docs/TASKS.md).

## Quick start

Tested runtime: **Node 24.22.1, npm 12.2.0**. Use Node 24 LTS within the declared engines. Install Node/npm normally; then from this repository:

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/courses**. The API is on127.0.0.1:3000; Vite proxies `/api`. Copy `.env.example` to `.env` only to change ports. Stop with Ctrl+C. `npm run dev:server` offers standalone API watch mode; the combined supervisor keeps one API child and closes both services together.

SQLite's pinned native install script is approved only for `sqlite3@6.0.1` in this project's npm 12 allowScripts policy. A clean temporary install was verified. No global script/security setting was changed, and no native binary is committed.

## Verify

```sh
npm test
npm run test:coverage
npm run spike:sqlite
npm run build
npm run start:production
```

Production-mode preview: **http://127.0.0.1:3000/courses**. Built client files are served by Express with SPA deep-link fallback; unknown API/asset routes stay JSON404. The production command requires a completed build and reports a clear failure otherwise.

- `/health` and `/api/v1/health`:200 for process liveness.
- `/ready` and `/api/v1/ready`:503 `not_ready` until M2 attaches real application database readiness.
- `/api/v1/meta`: explicitly reports M1 preview and unavailable authentication/catalog/enrollment capabilities.
- `npm test`: foundation HTTP/config/lifecycle tests, file-DB transaction spike, retry checks and non-fake pending-command check.
- `test:coverage`: observed M1 line/branch coverage only; this is not the final all-backend statement/branch report required at M2/M3.
- `spike:sqlite`: temporary local DB with 20 claimants, two Sequelize writer instances, rollback and integrity checks. It is not the authenticated HTTP CON acceptance test.
- Pending seed/migrate/CON/E2E/UI/load commands exit nonzero with a clear scope message.

`npm audit` is recorded separately; the M1 lockfile returned zero findings on 16 November 2026. Never present this as a security certification.

## Documents

[Requirements](docs/requirements.md) · [Permissions](docs/permissions.md) · [Schema](docs/schema.md) · [Architecture](docs/architecture.md) · [API contract](docs/api.md) · [UI](docs/ui.md) · [Testing](docs/testing.md) · [Capacity](docs/capacity.md) · [CON decision](docs/adr/0001-enrollment-consistency.md) · [SCL decision](docs/adr/0002-capacity-optimization.md) · [AI assistance](docs/ai-usage.md) · [Contributions](docs/contributions.md).

Team: **Al-Sammarraie Nooruldeen Sameer Fawzi; Ilinca-Mara Vlădescu; Taya Jwan**. Git history uses the actual configured author identity. Task ownership remains distinct from completed human contribution/review.

## Runtime storage and limits

The default future database path uses `%LOCALAPPDATA%/Electiva/dev.sqlite` on Windows, outside this OneDrive checkout. Relative, in-memory, OneDrive and UNC runtime paths are rejected. The M1 spike creates and removes a local temporary DB; it never creates an application database. Keep credentials, session data, runtime DB/WAL files and node_modules out of Git.

All three source specifications remain user-supplied Draft v2.0. Milestone dates are unknown. FIFO/window decisions and local external-directory substitute are explicit team proposals; instructor acceptance of the substitute remains unverified. No public deployment, teammate invitation, attendance action, email or submission is part of M1.
