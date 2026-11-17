# ADR0001 — Protect enrollment consistency

Status: implemented and technically verified for the M2 topology; owner N; reviewer I pending actual review. Source G§3/7, T§3/5, P/CON.

Problem:20 requests can race for one place; cancellations and promotion must not lose or duplicate a seat.

Alternatives: (A) browser checks or process-local mutex (insufficient across processes); (B) short SQLite IMMEDIATE transaction plus database capacity/uniqueness guards; (C) approved relational server DB with row locks/conditional mutation (adds deployment/approval work).

Proposed choice B: permitted default SQLite/Sequelize, local disk DB, FK/CHECK/partial UNIQUE, capacity guards, one transaction for every mutation and FIFO promotion, bounded busy handling and committed responses. SQL statements use transaction parameter consistently. Recheck window after acquiring the transaction. Do not claim SQLite row locks or several simultaneous writers.

Evidence needed: N04/N07/N09 scenario results,20-request response+DB state, raw-SQL bypass rejection, two-connection/process behavior, timeout/retry counts, rollback and window boundary tests. Reject or revise this choice if the selected driver cannot satisfy those checks.

Limits: one writer limits throughput; FIFO follows committed queue order. No multi-host or unlimited scaling claim. M2 HTTP evidence is in artifacts/m2/concurrency.json; independent-process recovery and final SCL remain pending.


## M1 experiment and decision

Technical direction accepted for M2, with CON acceptance still pending. `npm run spike:sqlite` uses a temporary local file, two Sequelize writer instances and 20 independent managed transaction connections. It observes 1 claim/19 full outcomes, rollback leaves 0 rows, FK/capacity bypasses are rejected, and each transaction reads foreign_keys=1/busy_timeout=0. WAL and SQLite version are recorded in artifacts/m1/sqlite-spike.json.

Initial 100ms native busy waits caused 99 outer retries in the first exploratory run and failed-BEGIN rollback warnings. A zero driver wait plus bounded asynchronous Sequelize acquisition retry avoids occupying libuv workers while the lock holder needs them. The final policy uses at most 30 acquisition attempts with backoff/jitter and at most 8 whole-operation attempts for remaining SQLITE_BUSY failures. Counters for both layers are recorded separately; non-busy errors preserve identity and are never retried. Final repeated checks require no rollback warnings.

This is a transaction spike, not an enrollment implementation or performance/HTTP/concurrency acceptance result. A probe capacity guard is not the full application schema. N04/N07/N09 must revalidate the chosen behavior for actual service code, windows, duplicate requests, cancellation and promotion. No teammate review or student mastery is inferred from AI-assisted implementation.

M2 revalidation: real schema/services now pass the authenticated20-student last-seat proof, duplicate clicks, cancellation/promotion rollback, stale capacity races and lock-time boundary checks. The application uses30 asynchronous acquisition attempts and at most5 whole-transaction attempts (the historical spike's8-attempt policy above is not the application setting). HTTP responses follow transaction commit. Two app/DB instances in one Node process passed; process crash/recovery remains N09.
