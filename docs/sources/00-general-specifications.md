> An universitar / Academic year: **2026–2027**  
> Disciplina / Course: **Tehnologii Web / Web Technologies**  
> Statut / Status: **Draft v2.0 — pentru revizuire / for review**

---

# Specificații generale ale proiectului — RO

## 1. Scop și rezultat

Se dezvoltă o aplicație web full-stack funcțională, pentru tema repartizată, printr-un proces de inginerie software asistat de AI. Studenții trebuie să poată specifica cerințe, proiecta componente, inspecta modificările propuse de agent, implementa, depana, testa, măsura performanța și explica soluția. Responsabilitatea pentru cod și rezultate revine echipei, indiferent de instrumentele AI utilizate.

**Componență:** individual sau în echipe de **maximum 3 studenți**. Proiectul reprezintă **25% din nota finală** a disciplinei; evaluarea examenului și activităților de tutorial este separată.

## 2. Tehnologii de bază

- **JavaScript**, module ECMAScript; **fără TypeScript**.
- **Node.js LTS** și **Express** pentru API REST HTTP/JSON.
- **React + Vite** pentru interfața SPA; React Router după necesități.
- **Sequelize** cu **SQLite** sau alt SGBD relațional justificat/aprobat.
- API-uri web native (`fetch`, browser storage etc.) atunci când sunt potrivite.
- **Git** pentru istoricul muncii și integrarea contribuțiilor.
- Un agent de codare AI (de exemplu Codex), cu inspecția diferențelor și validarea independentă.
- Sunt permise biblioteci suplimentare când sunt motivate. Nu sunt obligatorii microserviciile, containerele ori un serviciu cloud plătit.

## 3. Funcționalitate obligatorie

1. Cel puțin două roluri cu permisiuni distincte; autentificare și autorizare efectivă pe server.
2. Un model relațional cu entități corelate și constrângeri de integritate.
3. Minimum trei fluxuri utilizator complete, descrise prin criterii de acceptare.
4. Un flux cu mai multe stări/tranziții și reguli de business explicite.
5. Validare pe server, răspunsuri de eroare coerente și stări de încărcare/eroare în UI.
6. Filtrare, ordonare și paginare pentru cel puțin o colecție relevantă.
7. Integrare funcțională cu un API/serviciu extern sau un substitut aprobat cu contract de integrare clar; simulatoarele locale sunt acceptate pentru scenarii de eroare și cost zero.
8. Interfață responsivă. Nu se impune un număr artificial de pagini sau endpointuri.

**Invariantă de business:** cel puțin o regulă esențială trebuie protejată la nivel de backend/bază de date, nu doar în interfață.

## 4. Calitate, testare și acoperire

- Teste automate de unitate pentru reguli de business; teste de integrare pentru API și persistență; teste negative pentru validare și permisiuni; cel puțin un flux end-to-end automatizat.
- Se testează explicit invariantele critice ale temei și scenariile obligatorii din pachetele arhitecturale.
- Se livrează raport de **statement coverage** și **branch coverage** pentru codul backend scris în proiect.
- **Praguri propuse:** ≥70% statement, ≥60% branch; acestea sunt praguri de proiect supuse aprobării, nu dovada suficientă a corectitudinii.
- Se exclud justificat codul generat automat, dependențele, migrările și configurațiile; se documentează excluderile.
- Un raport scurt identifică funcționalități insuficient testate și riscurile asociate.

## 5. Performanță și planificarea capacității — bază obligatorie

Fiecare temă definește volum de date, utilizatori simultani, tipul operațiilor și obiective de latență/eroare. Echipa implementează un test de încărcare reproductibil (de exemplu k6 sau Artillery) cu cel puțin **trei niveluri de încărcare**. Se raportează throughput, p50/p95, rata erorilor și resursele observabile, pe un mediu descris explicit. Se estimează capacitatea susținută în raport cu obiectivul impus și se identifică un posibil blocaj. **Nu se compară direct RPS-ul între calculatoare diferite.** Pachetul SCL impune analiză și optimizare suplimentară.

## 6. Securitate — bază obligatorie

Parolele nu se păstrează în clar. Se protejează secretele, se validează intrările, se verifică drepturile pe fiecare operație și pe fiecare obiect sensibil; nu se expun date sensibile în răspunsuri ori jurnale. Se folosesc constrângeri și interogări parametrizate. Se documentează tratamentul pentru CORS, cookie/token și erori. Pachetul **SEC** adaugă scanare OWASP ZAP și dovada remedierilor, fără a înlocui verificările manuale de autorizare. Testele de securitate se fac exclusiv pe instanțe controlate/autorizate.

## 7. Cerințe arhitecturale injectabile

Fiecare proiect are **exact două pachete arhitecturale obligatorii** indicate în fișa temei. Cerințele și verificările pachetelor se adaugă peste baza comună. Fiecare pachet necesită cel puțin o decizie arhitecturală documentată (ADR scurt: problemă, alternative, alegere, experiment/test, limite). Nu se acordă puncte doar pentru introducerea unor tehnologii complicate.

## 8. Utilizarea AI și responsabilitatea individuală

Se predau un rezumat al instrumentelor AI utilizate și **un caz tehnic semnificativ per student**: cerință, intervenția agentului, inspecție, defect/limitare sau verificare, remediere și rezultat. Nu se cer transcrieri complete de conversații. Fiecare membru trebuie să poată explica fluxurile esențiale, contribuția proprie și testele sale.

## 9. Git, livrare și reproducibilitate

Repozitoriu comun, commit-uri incrementale, contribuții atribuibile, integrare verificabilă. Se cer `README.md`, `.env.example` fără chei reale, lockfile, instrucțiuni de instalare, inițializare/seed date, rulare, testare, coverage, încărcare și build/execuție de producție. O demonstrație în mod producție poate rula local/containerizat dacă găzduirea publică nu este disponibilă. Nu sunt obligatorii servicii plătite.

**Documente minime:** `docs/requirements.md`, `docs/architecture.md`, `docs/adr/`, `docs/testing.md`, `docs/capacity.md`, `docs/ai-usage.md`, `docs/packages/`. Structura exactă a codului rămâne la alegerea echipei.

## 10. Predări intermediare

| Etapă | Cerințe verificabile |
|---|---|
| **M1 — Analiză/design** | Repozitoriu și echipă; cerințe/roluri/fluxuri; invariante; schemă date și API; schiță arhitectură; alternative pentru cele două pachete; model de sarcină; plan teste; schelet executabil. |
| **M2 — Backend/teste** | API și persistență funcționale; securitate de bază; reguli esențiale implementate; teste unitate+integrare; raport inițial de coverage; primul scenariu arhitectural verificabil. |
| **M3 — Livrare finală** | Aplicație integrală; test E2E; pachete validate; raport coverage și lacune; test de încărcare și capacitate; ADR; documentație; demonstrație și contribuții individuale. |

**Nu se introduce o cerință surpriză individuală formulată de profesor la final**; toate scenariile obligatorii sunt publicate în avans în fișe. Datele-limită sunt comunicate separat.

## 11. Evaluare propusă (100 puncte din nota proiectului)

| Criteriu | Puncte |
|---|---:|
| Funcționalitate de bază și reguli de business | 30 |
| Pachet arhitectural 1 (implementare, teste, justificare) | 20 |
| Pachet arhitectural 2 (implementare, teste, justificare) | 20 |
| Calitatea testelor, acoperirea generală și analiza lacunelor | 10 |
| Git, colaborare, utilizarea AI și contribuție individuală | 10 |
| Documentare, capacitate de bază, reproducibilitate și susținere | 10 |
| **Total** | **100** |

Pachetele sunt evaluate pe comportament corect (40%), verificări reproductibile (30%), argumentare arhitecturală (20%) și dovezi/limite (10%). Un sistem care nu rulează nu poate obține punctaj integral la funcționalitate, dar componentele demonstrabile pot fi evaluate separat. Regulile exacte privind penalitățile și eventualele plafonări vor fi publicate înaintea primei predări.

---

# General Project Specification — EN

## 1. Goal and outcome

Develop a working full-stack web application for the assigned topic through AI-assisted software engineering. Students must specify requirements, design components, inspect agent-proposed changes, implement, debug, test, measure performance, and explain the result. The team remains accountable for all code and behavior regardless of AI assistance.

**Team size:** one to **three students**. The project contributes **25% of the overall course grade**; examination and tutorial assessment remain separate.

## 2. Standard technology

- **JavaScript**, ECMAScript modules; **no TypeScript**.
- **Node.js LTS** with **Express** for the HTTP/JSON REST API.
- **React + Vite** SPA; React Router where needed.
- **Sequelize** with **SQLite** or another justified/approved relational database.
- Native web APIs (`fetch`, browser storage, etc.) when appropriate.
- **Git** for contribution history and integration.
- An AI coding agent (e.g., Codex), with diff review and independent validation.
- Additional libraries are permitted when justified. Microservices, containers, and paid cloud services are not mandatory.

## 3. Mandatory functionality

1. At least two roles with distinct permissions, including real server-side authentication and authorization.
2. Related relational entities with integrity constraints.
3. At least three complete user workflows with acceptance criteria.
4. A multistate business workflow with explicit transitions/rules.
5. Server validation, consistent errors, and UI loading/error states.
6. Filtering, sorting, and pagination for at least one relevant collection.
7. One meaningful external API/service integration or an approved substitute with a clear integration contract; local simulated services are acceptable for free, reproducible failure experiments.
8. Responsive frontend; no arbitrary minimum page or endpoint count.

At least one critical **business invariant** must be enforced at the server/database boundary, not merely in the UI.

## 4. Quality, tests, and coverage

- Automated unit tests for business rules, integration tests for API/persistence, negative validation/authorization tests, and at least one automated end-to-end workflow.
- Explicit tests for topic-critical invariants and assigned architectural-package scenarios.
- Submit **statement coverage** and **branch coverage** for student-authored backend application code.
- **Proposed thresholds:** ≥70% statements, ≥60% branches. These are draft grading thresholds, not proof of correctness.
- Document justified exclusions for generated code, dependencies, migrations, and configuration.
- Briefly identify important untested behavior and associated risk.

## 5. Baseline performance and capacity planning

Each topic defines data volume, concurrent clients, workload mix, and latency/error objectives. Run a reproducible load test (e.g. k6 or Artillery) at **three load levels**; report throughput, p50/p95 latency, errors, and observable resource usage, with the test environment recorded. Estimate sustainable capacity against the stated service objective and identify a likely bottleneck. **Do not compare raw RPS across different students' machines.** SCL adds deeper saturation analysis and optimization.

## 6. Baseline security

Never store plaintext passwords. Protect secrets, validate untrusted input, enforce permissions on sensitive operations and objects, and prevent data disclosure through responses or logs. Use database constraints and parameterized queries. Document CORS, cookies/tokens, and error-handling policy. **SEC** adds OWASP ZAP scanning and remediation evidence; scanners do not replace manual authorization testing. Security tests must only target controlled/authorized instances.

## 7. Injected architectural challenges

Every topic assigns **exactly two mandatory packages** listed in its topic sheet. These add to, rather than replace, baseline requirements. Each package requires a concise architectural decision record (ADR: problem, alternatives, selection, experiment/test, limitations). Complexity for its own sake is not rewarded.

## 8. AI-assisted work and individual accountability

Submit a concise AI tool usage summary and **one significant engineering case per student**: requirement, agent contribution, inspection, issue/limitation or verification, correction, and outcome. Full chat transcripts are not required. Each student must explain important code paths, their contribution, and their tests.

## 9. Git, delivery, reproducibility

Use a shared repository with incremental commits, identifiable contributions, and reviewable integration. Include `README.md`, secret-free `.env.example`, lockfile, and setup, database/seed, run, tests, coverage, load-test, and production-build/start instructions. Reproducible local/containerized production-mode deployment is acceptable if public hosting is impractical. Paid services are not required.

**Minimum docs:** `docs/requirements.md`, `docs/architecture.md`, `docs/adr/`, `docs/testing.md`, `docs/capacity.md`, `docs/ai-usage.md`, `docs/packages/`. Code organization is flexible.

## 10. Milestones

| Milestone | Verifiable deliverables |
|---|---|
| **M1 — Analysis/design** | Repository and team; requirements/roles/workflows; invariants; initial schema and API; architecture sketch; alternatives for both packages; workload assumptions; test plan; runnable skeleton. |
| **M2 — Backend/tests** | Working API/persistence; baseline security; core rules; unit+integration tests; initial coverage report; first verifiable architectural scenario. |
| **M3 — Final delivery** | Integrated application; E2E test; both packages verified; coverage and gap analysis; load and capacity report; ADRs; docs; demonstration and individual contributions. |

**There is no surprise instructor-issued final change request**. Mandatory scenarios are published in advance. Exact milestone dates are announced separately.

## 11. Proposed grading (100 project points)

| Criterion | Points |
|---|---:|
| Core features and business correctness | 30 |
| Architectural package 1: solution, tests, reasoning | 20 |
| Architectural package 2: solution, tests, reasoning | 20 |
| Test quality, overall coverage, gap analysis | 10 |
| Git, collaboration, AI process, individual contribution | 10 |
| Docs, baseline capacity, reproducibility, defense | 10 |
| **Total** | **100** |

Internally, each package is assessed for correct behavior (40%), reproducible verification (30%), architectural reasoning (20%), and evidence/limitations (10%). Non-running systems cannot receive full functionality credit, but demonstrable partial components may be assessed. Exact late penalties and grade caps will be announced before M1.
