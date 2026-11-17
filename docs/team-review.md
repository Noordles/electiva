# Team supervision and review guide

We are using AI to help build Electiva. Each member has a technical area to inspect, test and explain. Assigned reviews are recorded separately from reviews that have happened.

| Member | Assigned supervision | Evidence so far |
|---|---|---|
| Al-Sammarraie Nooruldeen Sameer Fawzi — Noor | Product/design; integrity/authentication/enrollment; review Jwan's integration/performance work | Chat instructions chose icon/wine/cyan and requested incremental tested changes. Independent code review and individual case pending. |
| Ilinca-Mara Vlădescu | API/UI acceptance, administration, cancellation/FIFO; review Noor's consistency/authentication | Assigned responsibility. No direct teammate inspection, test run or approval supplied. |
| Taya Jwan | Catalog/directory/data/reports/performance; review Ilinca's lifecycle/UI | Assigned responsibility. No direct teammate inspection, test run or approval supplied. |

Noor: inspect db/migrations.js, auth.js and enrollment.js; run test:concurrency. Explain why React seat checks cannot prevent overselling, why locking precedes reading state/time, and how retries avoid duplicate membership. Review directory/load code: HTTP finishes before the write transaction and a combined-process smoke cannot establish capacity.

Ilinca: inspect admin.js, cancellation/promotion, student screens and browser test. Explain stale versions, capacity floors, FIFO, cancelled history and rollback. Run npm test, build and test:e2e. Review Noor's role/ownership/CSRF behavior and last-seat proof.

Jwan: inspect catalog.js, directory.js, db/seed.js and tools/load/runner.mjs. Explain stable pages, literal wildcards, fixed-origin access, idempotent imports, synthetic credentials and endpoint latency. Run load:smoke; inspect SQL checks. Review Ilinca's capacity/window/archive behavior and cancellation journey.

When a review happens, add date, member, inspected commit, checks, command/result, one concrete question/correction and uncertainty to contributions.md. A passing review can record actual verified behavior without inventing a defect. Individual AI cases must describe what that student inspected and can explain; verified identities apply only to actual authored work.
