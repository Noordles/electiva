# JIN demonstration and review rehearsal

This is a proposed speaking plan. Team rehearsal and individual explanations are pending actual participation. Use synthetic accounts only; the student controls any college upload.

1. **Noor — 3 minutes:** explain the course-enrollment goal and his wine/cyan visual direction. Sign in as student A, search a one-seat offering, enroll and show persisted history. Explain server-derived identity, the database capacity guard and why the UI's availability is advisory.
2. **Ilinca — 4 minutes:** sign in as admin, create a course/draft offering, set a local-time window, publish and show its roster. Student B joins the waitlist. Student A cancels; B reloads and is enrolled. Explain the single transaction, FIFO, stale-version rejection and why an occupied offering cannot be archived. Demonstrate a rejected capacity decrease.
3. **Jwan — 3 minutes:** show per-offering reports, preview EXT-DATA from the separate HTTP directory and import twice without duplication. Explain timeout/failure isolation. Open the measured capacity charts and discuss percentiles, the actual run duration, overload model, backend-only resource counters and SQLite's one-writer limit.
4. **Shared — 2 minutes:** show passing npm test/coverage/E2E/CON records, the process-crash rollback proof, AI assistance and actual contribution ledger. Each member explains one test and the limits of the experiment. Do not claim a review, teacher approval or mastery that has not happened.

Before defense, each member should inspect the assigned changes in team-review.md, execute their checks and add an actual dated review/case. Keep a short note of a real question or correction and what the student can now explain. The examples below are prompts for that inspection, not completed personal accounts.

- Noor: how do current-membership uniqueness and transaction locking complement each other? What happens when a process dies after updating cancellation but before commit?
- Ilinca: what happens when another admin saves while a form is open? When may capacity increases promote students, and what happens outside the window?
- Jwan: why does choosing a page before counting enrollment history reduce work? How does a paired result hash support correctness, and why does a short desktop run not establish universal capacity?
