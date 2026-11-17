# ADR0002 — Measure and improve tested capacity

Status: implemented and measured; human reviewer N pending actual inspection. Source G§5/7, T§4/5, P/SCL.

Problem: demonstrate capacity with 100 active users and identify saturation under reproducible load; optimize a real measured bottleneck.

Alternatives: query/index optimization; reducing round trips/aggregation costs; cache with explicit invalidation; larger server DB/deployment. Select the smallest change supported by baseline profiling. Initial hypothesis: improve filtered catalog query/index access, preserving fresh availability and integrity.

Experiment: tagged baseline and optimized commits; same deterministic seed and environment;10/50/100 VUs plus saturation; >=3 repetitions; endpoint p50/p95, throughput, error/resource/SQLite contention graphs; before/after query plan where relevant. Unit/integration/CON/E2E rerun after optimization.

Decision: choose the requested catalog page in a MATERIALIZED CTE before counting ACTIVE/WAITLISTED/CANCELLED history. Profiling and EXPLAIN supported this query-level change; no mutable seat cache or integrity-index removal was introduced. Commit5aa19c7 is the optimization;2363b72 is the baseline. Matching fixture/result hashes, equivalence tests and three repeated HTTP scenarios at each ordinary load level support the decision. The100-user p95 median improved353.72→104.99ms; min/max and all failures remain in saved data. See capacity-results.md and generated plots/CSV.

The shorter3s/12s/3s classroom protocol was frozen before measurement in capacity-protocol.md, replacing the earlier120s planning proposal. No-think overload still exceeds the latency objective; baseline400-user errors trigger a safety stop, whereas optimized runs complete without errors. This improves the measured behavior without removing SQLite's one-writer limit. The later course-level guard is separately validated at100 users and is not back-attributed to the paired comparison. Co-location, sequential version order, pause/resume and short duration are explicit limits. Human review and teacher acceptance are separate from these technical results.


## M1 protocol frozen

The protocol in capacity.md is the implementation contract for SCL:10,000 synthetic students;10/50/100 active-user levels; saturation; >=3 repeated matched before/after runs; endpoint p50/p95/throughput/errors and observable resources; environment/seed/commit provenance. Initial index/query hypothesis remains unmeasured. No experiment, optimization gain or SCL completion is claimed at M1. The provider HTTP fixture is in contracts/course-directory.json; implementation/approval remain pending.
