# Measured catalog comparison — 17 November 2026

Baseline snapshot2363b72; optimized snapshot5aa19c7. The only application change between these snapshots is page-first catalog counting; the accompanying test compares it with the baseline SQL. Source requirements: theme1 §4–5 and architectural package SCL. Protocol/limits were recorded before measurement in capacity-protocol.md.

The fixture contains10,000 synthetic students,100 courses/offerings and50,000 valid enrollment attempts. Logical data hash716fd743a980a8ded530755ff4c848154fa2f99c702e9eceb60326a266a01fe0 is identical across runs. Query profile result hashf512348a0f1fd8acd0ba0f9396fb5dd736257d1e06a89296093534696b6bb933 also matches. Random salts/session credentials are excluded and never saved to results.

| Ordinary active users | Baseline median listing p95 | Optimized median listing p95 | Reduction |
|---|---:|---:|---:|
|10|26.99ms|21.57ms|20.1%|
|50|70.50ms|39.21ms|44.4%|
|100|353.72ms|104.99ms|70.3%|

Each cell is the median of three independent12-second measured runs, after3-second warmup, with3-second recovery and fresh same-data fixtures. All18 ordinary scenarios had zero unexpected request errors and zero post-run capacity/uniqueness/FK violations. At100 users, baseline listing p95 ranged342.91–588.88ms; optimized35.69–194.21ms. The spread is reported, rather than selecting the best run. Exact per-endpoint p50/p95/RPS/errors, backend CPU/RSS/event-loop/retry counters and environment are in the JSON/CSV/plots.

The isolated two-query catalog profile uses three repetitions of50 measured queries after five warmups. Baseline median p50 across repetitions was9.51ms; optimized4.26ms. Baseline median p95 was12.30ms; optimized5.22ms. SQL/result hashes verify matched inputs and output. This profile excludes HTTP/auth/generator overhead and is distinct from the endpoint measurements.

## Why the change helps

The baseline plan evaluates correlated ACTIVE/WAITLISTED/CANCELLED counts while sorting/choosing offerings. A MATERIALIZED CTE now selects only the requested page before those history counts. EXPLAIN plans are saved in the profile JSON; the CTE prevents flattening that boundary. Counts remain live, and no integrity index, lock, rule, database, cache or server count was changed. Regression tests compare the two SQL paths across ordering, tied titles and pagination.

## Capacity and limitations

**100 ordinary simulated users is the highest tested level of this model**, and all three optimized runs met the adopted listing p95<800ms / errors<1% objectives with valid data. Higher ordinary-user levels were not tested; no universal capacity is inferred. Runs are short, use seeded think time500–1500ms, share one Windows machine and run versions sequentially; power mode/background activity are uncontrolled. RPS uses measured wall time including final request/think drain, rather than pretending the requested duration equals the actual elapsed time.

The separate no-think overload series tests100/200/400 clients. Baseline listing p95 was1906.66ms at100,3143.42ms at200 and5015.51ms at400. At400,854 of1339 requests failed, triggering the predeclared5% error safety stop; some server work can commit after a client deadline. Recovery and final SQL checks still passed. Optimized overload completed three repetitions per level without request errors; the last repetition resumed after the student's review pause, with the original six runs preserved and application/runtime/fixture equivalence checked. The optimized no-think latency still exceeded800ms at every tested level. This model is intentionally harsher than ordinary users; no threshold-passing no-think capacity at or above100 is inferred merely from successful responses. The baseline has one repetition per level because of the safety stop; optimized overload has three. Do not present their error-free run counts as matched repetition counts.

The later source audit added course-level current-request guards in migration2, beyond the older per-offering uniqueness. Both snapshots in the paired optimization comparison use the same original guards, so the isolated optimization comparison remains matched. The final application is independently rechecked at100 ordinary users in final-guard-validation.json; report that validation separately rather than assigning pre-hardening measurements to the final commit.

Those final guard-validation runs measured listing p95 of50.38,137.30 and54.64ms (median54.64ms) at100 ordinary users, with zero errors/invariant violations. Their snapshot is1476232. Optimized no-think medians across three runs were1189.77/2048.30/4160.16ms at100/200/400 respectively; all optimized overload requests completed without transport/application errors, but latency still failed the adopted800ms target. This distinction is visible in saturation.png.

SQLite still serializes writers. The optimization reduces read work; it does not remove write contention, promise crash-free hosting or establish a long-duration SLA. Teacher acceptance and genuine member review remain separate submission gates.

## Reproduce and inspect

Use a clean clone at the named snapshot, the locked Node/npm dependencies, and the same fresh fixture clock for both versions. `node tools/load/capacity.mjs --output <path> --clock <epoch-ms>` runs the ordinary three-level/three-repeat profile; add `--users 100,200,400 --think false` for the bounded overload profile. Use profile.mjs with the same clock for the isolated query plans/timings. For a new date, choose a fresh shared clock so offering windows remain open; do not compare different clocks/fixtures as the same experiment.

`npm run load:compare` regenerates charts/CSV/summary from the saved data, requiring the optional pinned Python plotting environment. Data lives in artifacts/capacity: baseline.json, optimized.json, both profile files, both saturation files, comparison.csv and generated PNG/SVG plots. The plotting script checks fixture and result hashes before producing the comparison.
