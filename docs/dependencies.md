# M1 runtime and dependency decisions

Verified16 November 2026 against the npm registry and official Node/Vite/Express/Sequelize documentation.

- Node 24.22.1 (supported24 LTS; selected installed runtime), npm 12.2.0. `.node-version`, engines and packageManager record the tested runtime. Node 26 is also listed LTS upstream; compatibility with 26 is not claimed without tests.
- Express5.3.0: HTTP/error/lifecycle foundation, promise-aware handlers.
- React/React DOM19.3.1: SPA; React Router DOM7.18.5: navigation and URL filter state.
- Vite8.3.8 + React plugin6.3.0: development and production build; current Node 24 satisfies required engine.
- Sequelize6.37.8 + sqlite3 6.0.1: permitted stable relational stack and real-file concurrency experiment.
- uuid11.1.1 override preserves the audited transitive resolution. No additional application UI, validation, logging or state framework is required for M1.
- Node's built-in test runner/assert/fetch supplies foundation tests. Full automated browser E2E tooling is deferred to I09/J07; M1 browser QA uses the connected browser and is not claimed as the mandatory E2E.

All versions are exact and package-lock.json is committed. npm 12 policy approves only `sqlite3@6.0.1`'s install script at project scope; no global install-script setting was changed. A temporary clean workspace passed npm ci and loaded native SQLite 3.52.0 without manual binary copying. Current npm audit reports 0 vulnerabilities for this lockfile; this is not a security certification.

Primary references: https://nodejs.org/en/about/previous-releases ; https://vite.dev/guide/ ; https://expressjs.com/en/guide/error-handling/ ; https://sequelize.org/docs/v6/other-topics/transactions/ .

M2 additions,17 November: c8 12.0.0 for V8-to-Istanbul all-backend coverage/threshold enforcement, and @playwright/test1.65.1 for actual isolated Chromium production journeys. Coverage's test-exclude dependency initially resolved vulnerable glob/minimatch; project overrides pin glob14.0.6/minimatch11.0.9. Their Node engines support this runtime. The changed major transitive resolutions were checked by executing coverage, build and browser tests; npm audit returned0. Browser binaries live in the local Playwright cache, outside Git. CI installs Chromium separately. No application framework or ORM version was upgraded.
