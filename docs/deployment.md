# Local production setup and storage

Use the locked Node/npm versions in README. `npm ci` installs native SQLite through the project-specific allowScripts policy; browser binaries are installed separately with `npx playwright install chromium`. No module, binary or live database is copied from another machine. `npm run rehearse` performs a fresh local clone, install, migrate, seed, production build and actual same-origin HTTP login/enrollment check in a temporary directory, then records outcomes in artifacts/m3/clean-rehearsal.json.

The build command explicitly sets production mode before loading Vite/React, so a development NODE_ENV or .env cannot select the larger development bundle. Rehearsal intentionally inherits development mode for seeding and checks the built JavaScript excludes React's development notice. The initial environment-dependent output is retained as a diagnostic artifact.

Normal setup: npm ci → db:migrate → db:seed → build → start:production. Start dev:directory separately for the local metadata simulator. The .env.example documents ports, DATABASE_PATH and DIRECTORY_URL. Built assets are served by Express; SPA navigation falls back to HTML, while unknown APIs/assets retain404. Readiness checks SQLite.

Live SQLite/WAL files belong on local disk outside this OneDrive repository, defaulting to LOCALAPPDATA/Electiva/dev.sqlite. Preserve the database/WAL together when stopping/moving a service. For backups, stop the application first and copy the quiescent database; do not copy a changing database file alone or place a running one on cloud/network sync. Migrations are ordered/checksummed; restore altered old migrations instead of changing their checksums to bypass detection.

Seeding is synthetic, refuses non-empty data and is disabled under NODE_ENV=production. Demo password/email details are written to a private local demo-accounts.json next to the database. Never substitute university credentials. Use a new DATABASE_PATH for another demo fixture; this project provides no destructive reset command.

Development uses HTTP/Vite proxy. Production cookies default Secure; COOKIE_SECURE=false is a loopback-only HTTP demonstration exception. A future real HTTPS deployment requires trusted origin configuration, TLS/proxy review, appropriate cookie policy, operational backups and a real account-provisioning decision. Current HOST validation permits127.0.0.1 only; no public hosting is delivered or claimed.

Tests, load and rehearsal create their own temporary file databases. CON uses separate processes and a deliberately killed uncommitted transaction. Load traffic is restricted to services the runner creates on loopback. Performance results apply to the recorded hardware, workload, fixture and duration. CLI failure exits are preserved; no test command reports success merely because it was invoked.

No setup step submits coursework, registers a group, changes attendance, sends mail or changes the private repository's audience. The generated review ZIP is for the student to inspect and upload personally.

Optional analysis: npm run load:compare regenerates charts from saved before/after JSON using Python3 and Matplotlib. Install the pinned plotting dependency with `python -m pip install -r tools/analysis-requirements.txt` in your own analysis environment. Saved PNG/SVG/CSV/JSON reports can be inspected without installing Python; app/tests/build do not need the plotting package.
