# ADR0001 — Protect enrollment consistency

Status: proposed; owner N; reviewer I. Source G§3/7, T§3/5, P/CON.

Problem:20 requests can race for one place; cancellations and promotion must not lose or duplicate a seat.

Alternatives: (A) browser checks or process-local mutex (insufficient across processes); (B) short SQLite IMMEDIATE transaction plus database capacity/uniqueness guards; (C) approved relational server DB with row locks/conditional mutation (adds deployment/approval work).

Proposed choice B: permitted default SQLite/Sequelize, local disk DB, FK/CHECK/partial UNIQUE, capacity guards, one transaction for every mutation and FIFO promotion, bounded busy handling and committed responses. SQL statements use transaction parameter consistently. Recheck window after acquiring the transaction. Do not claim SQLite row locks or several simultaneous writers.

Evidence needed: N04/N07/N09 scenario results,20-request response+DB state, raw-SQL bypass rejection, two-connection/process behavior, timeout/retry counts, rollback and window boundary tests. Reject or revise this choice if the selected driver cannot satisfy those checks.

Limits: one writer limits write throughput; fairness is FIFO by committed queue order, not packet arrival time. No multi-host SQLite or unlimited scaling claim. No observed results yet.
