# Electiva — University Course Enrollment

Built by **team JIN** for **ASE Web Technologies**.

ASE Web Technologies, academic year 2026–2027. Assigned theme **1**, mandatory packages **CON + SCL**.

**Current state: planning only.** No application, passing tests, measured performance, completed milestones, or teammate contributions are claimed by these documents.

Team: Al-Sammarraie Nooruldeen Sameer Fawzi; Ilinca-Mara Vlădescu; Taya Jwan.

Start with [the complete implementation plan](docs/IMPLEMENTATION_PLAN.md), then [the 36 detailed work packages](docs/TASKS.md). Each member has 12 packages and 40 estimated effort points. Points are planning estimates, not hours or evidence of completed work.

- [Requirements and acceptance criteria](docs/requirements.md)
- [Architecture and database/concurrency design](docs/architecture.md)
- [API contract](docs/api.md)
- [Frontend flows](docs/ui.md)
- [Testing and coverage plan](docs/testing.md)
- [Load, saturation and optimization plan](docs/capacity.md)
- [CON package](docs/packages/concurrency.md), [SCL package](docs/packages/SCL.md)
- [Atomic commits and ownership](docs/COMMIT_PLAN.md)
- [Team register and attribution](docs/team.md)
- [AI usage and three future engineering cases](docs/ai-usage.md)
- [Open decisions](docs/OPEN_DECISIONS.md)
- [Original specifications and hashes](docs/sources/manifest.json)

The three specifications are user-supplied **Draft v2.0, for review**. Coverage thresholds and the listing latency objective are draft/illustrative; we adopt them as provisional engineering targets. The files give no milestone deadlines. Theme 1 fixes the domain and packages; earlier equipment-booking and STA suggestions are superseded.

## Planned developer commands

These are the command contract to implement in N01/J02/J07, not commands available in this planning-only repository:

```sh
npm ci
npm run db:migrate
npm run db:seed -- --profile demo
npm run dev
npm test
npm run test:coverage
npm run test:concurrency
npm run test:e2e
npm run build
npm run start:production
npm run load:baseline
npm run load:saturation
npm run load:compare
```

The final README must replace this section with verified Node/npm versions, ports, environment variables, prerequisites and successful clean-machine instructions. Default SQLite files must live in a local application-data directory outside OneDrive; no credentials or runtime databases belong in Git.
