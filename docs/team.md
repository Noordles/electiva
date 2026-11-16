# JIN team register and attribution

Assigned project number: **1**. Assigned topic: **University Course Enrollment / Înscriere la cursuri opționale**. Assigned packages: **CON + SCL**.

| Key | Full display name | Name in supplied roster | Roster row | Planned effort |
|---|---|---|---|---|
| N | Al-Sammarraie Nooruldeen Sameer Fawzi | AL-SAMMARRAIE NOORULDEEN SAMEER FAWZI | 2 | 40 points, 12 work packages |
| I | Ilinca-Mara Vlădescu | VLĂDESCU A ILINCA-MARA | 25 | 40 points, 12 work packages |
| J | Taya Jwan | TAYA JWAN | 10 | 40 points, 12 work packages |

Source: student-supplied roster screenshot, checked 16 November 2026. Each listed row has team JIN and project 1. The register's additional A initial is retained verbatim here; its expansion is unknown. Taya Jwan is kept in the order requested by the student. The screenshot includes unrelated classmates and is not committed to this repository.

## Balanced responsibility

- N: foundations, relational integrity, authentication, enrollment/concurrency, own student enrollment UI, security and CON evidence.
- I: user/API acceptance contracts, course administration, waitlist lifecycle, student/admin interfaces, E2E, production documentation.
- J: API infrastructure, catalog queries, synthetic data, external integration, reports UI, performance tooling and SCL evidence.

Each person owns implementation, relevant automated checks, evidence and explanation for their packages. Nobody is assigned only documentation or only UI. Reviews rotate N → I → J → N: I reviews N, J reviews I, N reviews J. Each receives and performs 12 planned reviews.

| Milestone | N | I | J | Team total |
|---|---:|---:|---:|---:|
| M1: tasks 01–03 | 9 | 9 | 9 | 27 |
| M2: tasks 04–07 | 15 | 15 | 15 | 45 |
| M3: tasks 08–12 | 16 | 16 | 16 | 48 |
| Total | 40 | 40 | 40 | 120 |

Points include implementation, checks and documentation. Re-estimate when actual work differs; keep all three totals balanced by transferring future work and recording why. Equal commit counts or lines of code are not proof of equal effort.

## Accurate Git attribution

Planning commits are authored using the existing configured Git identity and document AI assistance. Planned-owner metadata assigns a future responsibility; it does not say that person has implemented/reviewed it. Do not forge author emails, backdate commits, insert unearned coauthor trailers, or create empty commits to make a contribution chart look balanced.

Before implementation attributed to a teammate, collect their real GitHub login and author email, agree the task scope, and let the contributor author it or explicitly verify the actual work/assistance. Log reviewer approval and evidence with the real commit SHA in docs/contributions.md. AI-assisted work must also appear in docs/ai-usage.md.
