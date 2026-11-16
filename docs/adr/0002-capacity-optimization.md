# ADR0002 — Measure and improve tested capacity

Status: proposed; owner J; reviewer N. Source G§5/7, T§4/5, P/SCL.

Problem: demonstrate capacity with 100 active users and identify saturation under reproducible load; optimize a real measured bottleneck.

Alternatives: query/index optimization; reducing round trips/aggregation costs; cache with explicit invalidation; larger server DB/deployment. Select the smallest change supported by baseline profiling. Initial hypothesis: improve filtered catalog query/index access, preserving fresh availability and integrity.

Experiment: tagged baseline and optimized commits; same deterministic seed and environment;10/50/100 VUs plus saturation; >=3 repetitions; endpoint p50/p95, throughput, error/resource/SQLite contention graphs; before/after query plan where relevant. Unit/integration/CON/E2E rerun after optimization.

Decision remains provisional until J09–J11 provide raw evidence. Document negative results and variance, not only the best run. Limits: hardware-specific closed-loop workload, synthetic data, co-located generator, single writer and measured duration. No predicted gain or achieved capacity is recorded yet.


## M1 protocol frozen

The protocol in capacity.md is the implementation contract for SCL:10,000 synthetic students;10/50/100 active-user levels; saturation; >=3 repeated matched before/after runs; endpoint p50/p95/throughput/errors and observable resources; environment/seed/commit provenance. Initial index/query hypothesis remains unmeasured. No experiment, optimization gain or SCL completion is claimed at M1. The provider HTTP fixture is in contracts/course-directory.json; implementation/approval remain pending.
