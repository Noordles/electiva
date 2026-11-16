# Atomic Git plan and contribution policy

## Rules

Use one coherent behavior/change per commit, with its meaningful tests and relevant documentation. If a package proves too large, split into independently reviewable commits with narrower subjects; keep the owner/effort ledger, not an artificial commit quota. Do not make future empty commits now.

Before each commit: inspect git status and diff; stage explicit files; run the relevant meaningful checks; inspect the staged diff; use a short imperative subject. Record actual evidence and reviewer. Never git-add unrelated subject files, credentials, downloaded archives or SQLite files. Do not amend another member’s published history or squash away attributable contributions merely to simplify the graph.

Branches: feature/N-N06-enrollment, feature/I-I06-waitlist, feature/J-J04-catalog, etc. Review rotation: I reviews N; J reviews I; N reviews J. Integrate a tested branch with a reviewable merge or fast-forward according to agreed policy; retain original attributable commits. Main must meet the current milestone gate. Each milestone gets an evidence manifest/tag only when actually satisfied.

Suggested body trailers (ownership metadata, not author claims):

```text
Task: N06
Planned-Owner: Al-Sammarraie Nooruldeen Sameer Fawzi
AI-Assistance: Codex; inspected by <actual reviewer>
Verification: <actual command, exit code, artifact>
```

Teammate author identity must be a real verified Git name/email. Do not invent J/I emails or apply coauthor trailers without actual qualifying contribution. Existing configured author identity is used for this AI-assisted planning session.

## Future implementation subjects

| Task | Owner | Proposed short commit |
|---|---|---|
| I01 | Ilinca-Mara Vlădescu | `docs(requirements): define roles and workflows` |
| J01 | Taya Jwan | `docs(quality): define test and capacity strategy` |
| N01 | Al-Sammarraie Nooruldeen Sameer Fawzi | `chore(repo): initialize JIN workspace` |
| I02 | Ilinca-Mara Vlădescu | `feat(ui): add responsive application shell` |
| J02 | Taya Jwan | `feat(api): add Express application foundation` |
| N02 | Al-Sammarraie Nooruldeen Sameer Fawzi | `docs(data): define enrollment schema` |
| I03 | Ilinca-Mara Vlădescu | `docs(api): specify enrollment contracts` |
| J03 | Taya Jwan | `docs(scl): define measurable optimization experiment` |
| N03 | Al-Sammarraie Nooruldeen Sameer Fawzi | `chore(con): verify SQLite transaction strategy` |
| I04 | Ilinca-Mara Vlădescu | `feat(admin): manage courses and offerings` |
| J04 | Taya Jwan | `feat(catalog): add filtered paginated offerings` |
| N04 | Al-Sammarraie Nooruldeen Sameer Fawzi | `feat(db): enforce enrollment integrity` |
| I05 | Ilinca-Mara Vlădescu | `feat(ui): connect login and course catalog` |
| J05 | Taya Jwan | `feat(integration): add course directory adapter` |
| N05 | Al-Sammarraie Nooruldeen Sameer Fawzi | `feat(auth): add sessions and role guards` |
| I06 | Ilinca-Mara Vlădescu | `feat(waitlist): promote students after cancellation` |
| J06 | Taya Jwan | `feat(data): add synthetic seed and enrollment reports` |
| N06 | Al-Sammarraie Nooruldeen Sameer Fawzi | `feat(enrollment): allocate seats transactionally` |
| I07 | Ilinca-Mara Vlădescu | `test(waitlist): cover lifecycle and rollback rules` |
| J07 | Taya Jwan | `chore(test): wire coverage and load verification` |
| N07 | Al-Sammarraie Nooruldeen Sameer Fawzi | `test(con): verify last-seat and duplicate races` |
| I08 | Ilinca-Mara Vlădescu | `feat(ui): add offering and waitlist administration` |
| J08 | Taya Jwan | `feat(ui): add reports and directory import` |
| N08 | Al-Sammarraie Nooruldeen Sameer Fawzi | `feat(ui): add student enrollment workspace` |
| I09 | Ilinca-Mara Vlădescu | `test(e2e): verify enrollment and promotion journey` |
| J09 | Taya Jwan | `perf(baseline): measure load and saturation` |
| N09 | Al-Sammarraie Nooruldeen Sameer Fawzi | `test(con): verify contention and recovery` |
| I10 | Ilinca-Mara Vlădescu | `docs(setup): document reproducible production run` |
| J10 | Taya Jwan | `perf(catalog): optimize measured listing bottleneck` |
| N10 | Al-Sammarraie Nooruldeen Sameer Fawzi | `test(security): cover authorization and error gaps` |
| I11 | Ilinca-Mara Vlădescu | `docs(ai): record waitlist engineering case` |
| J11 | Taya Jwan | `docs(scl): report optimization and tested capacity` |
| N11 | Al-Sammarraie Nooruldeen Sameer Fawzi | `docs(ai): record enrollment engineering case` |
| I12 | Ilinca-Mara Vlădescu | `docs(delivery): finalize demonstration and bundle` |
| J12 | Taya Jwan | `docs(ai): record performance engineering case` |
| N12 | Al-Sammarraie Nooruldeen Sameer Fawzi | `docs(release): verify requirements and contributions` |

## Planning-session commits

1. `docs(sources): preserve Theme 1 specifications` — source copies and hashes.
2. `docs(plan): define JIN delivery gates and ownership` — shared overview and accurate team record.
3. `docs(con): plan enrollment integrity and security` — N responsibility/design plan.
4. `docs(flows): plan administration and user journeys` — I responsibility/design plan.
5. `docs(scl): plan verification and capacity experiments` — J responsibility/design plan.

These are real documentation commits created now, using the actual configured author. Planned-owner trailers on the last three describe intended implementation responsibility; they are not evidence that those students wrote the planning text or application.
