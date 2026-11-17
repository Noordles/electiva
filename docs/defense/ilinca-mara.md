# Ilinca-Mara — lifecycle and interface review worksheet

**Status: technical case prepared; Ilinca's direct inspection/reflection remains pending.**

Actual AI-assisted finding: the initial admin browser journey landed in the student catalog because Login's already-authenticated redirect overrode the role-specific navigation. The role-aware redirect was corrected in commit2271fc8. The same journey creates/publishes an offering, detects a stale edit, reopens fresh data, increases capacity to promote a waiter, rejects archiving current memberships, verifies cancellation counts and finally archives safely. This was observed by the automated implementation session, not attributed to Ilinca.

Read Login.jsx, admin/Admin.jsx and admin-flow.test.js. Build then run npm run test:e2e. Explain client navigation versus server authorization, how an admin version becomes stale, why an open-window capacity change can promote a waiter, and why a failed cancellation must roll back its promotion. Review Noor's lock/time/ownership checks and crash evidence.

After actual review, add date/commit, inspected diff, personal checks, actual command/result, a real question/correction or verified behavior and what you can explain independently. Do not submit this pending worksheet as a completed personal engineering account.
