# Capacity, saturation and optimization protocol

Status: M2 implements a bounded harness and a two-second/10-user smoke; final SCL experiments remain pending. artifacts/m2/load-smoke.json records endpoint-specific p50/p95/errors and combined runner/server CPU/RSS. Do not infer capacity or optimization from it. The remaining protocol below describes future controlled work. Source: G§5, T§4–5, P/SCL.

## Reproducible seed and traffic model

Implemented M2 large profile:10,000 synthetic students, one admin,100 courses and100 published offerings, initially no enrollment history. Demo:30 students/six offerings, including one-seat courses. Dates are relative to an explicit seed clock; passwords are randomly generated synthetic credentials. Larger historical fixtures remain a future profiling choice, not a teacher requirement. M2 load uses fixed per-user pseudorandom seeds, a70/15/10/5 catalog/history/enroll/cancel mix, one listing warmup per user and no think time. Its client and server share a process; final SCL topology and steady/recovery windows need separate verification.

Seed credentials are synthetic and documented locally; accounts for load tests have precomputed password hashes during setup. Authenticate 100 distinct users before timing business requests. Report login performance separately; do not make a password-hashing benchmark accidentally stand in for listing performance. Persist/reuse sessions only for that controlled run, and exclude tokens from reports.

Mixed workload, team assumption: 70% filtered/sorted catalog listings, 15% own status, 10% enroll requests, 5% cancellation. List p95 is measured for listing only, not only as an aggregate. Writers choose valid open offerings, and cancellations follow owned states; log expected full/waitlist/window conflicts separately from unexpected errors. Waitlisting is a successful business response, not a transport failure.

## Three levels and saturation

- L1:10 active virtual users.
- L2:50 active virtual users.
- L3:100 active virtual users (topic target).
- Per level: proposed 30s warmup,120s measured steady load,30s recovery. Use a declared think time (proposed0.5–1.5s seeded jitter), log actual attempted/completed rates, and document the closed-loop model.
- Saturation:150→200→300 active users in separate measured steps, extending gradually only if still within resource-safe local limits. Stop on sustained failure, memory pressure or unresponsive server; document the actual tested ceiling. If no saturation is reached, report that result rather than inventing a saturation point; revise/increase the controlled load or report hardware limitation for instructor review.
- Team sustainable target: listing p95<800ms plus <1% unexpected error responses and no invariant violations during the measured interval. The error threshold/duration are team choices; preserve draft/illustrative source status.

Record RPS/throughput, endpoint p50/p95, all HTTP outcome counts, unexpected error rate, in-flight/queue/backlog if observable, CPU, peak/RSS memory, event-loop delay and SQLite busy/retry rates. State when a resource metric is unavailable. Save hardware/OS/power mode, Node/npm/package/SQLite versions, local DB path/size/PRAGMAs, process count, load-tool version, connection settings, machine co-location, commit SHA and exact command.

## Controlled before/after experiment

1. Complete correctness/security suite first. Keep all integrity constraints/indexes present in both variants.
2. Tag baseline commit and save DB seed/hash. Capture query plan and query counts; measure all three levels and saturation with production build, disabled debug SQL chatter, identical fixtures and stable machine conditions.
3. Inspect the actual bottleneck. First candidate: a composite index supporting common `lifecycle + term + course/ordering` catalog access, combined with eliminating repeated per-row count queries if profiling shows them. Pick ONE measurable change first; do not claim causation after changing server count, DBMS, hardware, seed, caches and queries together.
4. Implement the optimization with migration/query tests and its own commit. Save EXPLAIN QUERY PLAN before/after if relevant. Avoid caching mutable seat counts unless a complete invalidation/correctness design is separately justified.
5. Rerun the same scenarios at least 3 times per version with fresh same-data DBs. Alternate version order where practical to reduce warm-cache bias; define cold/warm treatment and reset enrollment state per run. Warm up both consistently. Authenticate outside measured windows.
6. Produce charts: load vs listing p50/p95; throughput vs load; unexpected errors vs load; CPU/RSS vs load where available; before/after at matched levels. Store numerical data alongside charts. Report median and spread across runs and the capacity knee; show regressions honestly.
7. If the index change has no useful effect, report it as a failed hypothesis, profile again, and measure a justified alternative. SCL requires a measured optimization, not an assumed speedup. Retain failed-experiment evidence.
8. Re-run CON/security/E2E after optimization, inspect persisted invariants after saturation, and check recovery. Estimate sustainable capacity as the highest actually tested stable load meeting targets for that duration/profile; no extrapolated universal user-count claims or raw RPS comparison with other computers.

Planned evidence: `artifacts/capacity/<run-id>/manifest.json`, `summary.json`, `query-plans.txt`, charts and references to raw data. Raw records can be large and contain synthetic session tokens if mishandled: scrub before saving and keep bulky data out of normal Git history.
