# AI assistance and individual engineering cases

## Planning record — 16 November 2026

Codex read the three supplied Draft v2.0 specifications and roster, corrected earlier topic/package assumptions to course enrollment CON+SCL, prepared traceability/design/work packages, and created the private repository under the student's authorization. Existing Git identity is Al Sammarraie Nooruldeen. Planning artifacts are AI-assisted proposals; students have not yet reviewed/implemented the proposed application, and no student mastery or completed contribution is implied.

The team must inspect proposed diffs and verify behavior independently. Keep a concise record rather than complete chat transcripts. Never fabricate defects, reviewers, test runs or individual work to complete this form.

## Case N — enrollment consistency (future record)

Requirement/source; exact task/commit; prompt/agent contribution summary; student inspection; observed defect/limitation or verification; correction; actual test command and result; remaining limits; what N can explain. Suggested investigation: a naive read-then-insert oversells or an incorrectly scoped transaction fails under20 concurrent requests. Use only a defect actually observed.

## Case I — waitlist/admin/UI lifecycle (future record)

Same fields. Suggested investigation: cancellation commits before promotion, capacity update race, or stale admin form overwrites another update. Document the real behavior, correction and checks observed by I.

## Case J — performance/integration (future record)

Same fields. Suggested investigation: inefficient listing query, misleading aggregate p95, or provider timeout leaks into core flow. Include actual before/after data and what J inspected.

Each member must explain important overall flows and their own code/tests during defense. Future case records can change if a different significant real issue arises.
