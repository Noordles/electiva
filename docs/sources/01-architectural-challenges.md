> An universitar / Academic year: **2026–2027**  
> Disciplina / Course: **Tehnologii Web / Web Technologies**  
> Statut / Status: **Draft v2.0 — pentru revizuire / for review**

---

# Pachete de provocări arhitecturale — RO

## Regula de compunere

**Proiect = specificația generală + fișa domeniului + exact două pachete obligatorii.** Pachetele sunt cerințe reutilizabile, nu biblioteci NPM gata scrise. Cele două pachete se verifică separat, dar se integrează în aceeași aplicație. Fiecare necesită un ADR concis, teste executabile și dovezi măsurabile. Funcționalitatea de bază, testarea, coverage, securitatea de bază și un test de capacitate simplu rămân obligatorii pentru toate proiectele. SCL adaugă optimizare de capacitate; SEC adaugă scanare ZAP.

## Catalog

| ID | Pachet | Dificultate orientativă |
|---|---|---|
| CON | Concurență și consistență | Avansat |
| STA | Fluxuri cu stări | Intermediar |
| SCL | Scalabilitate și capacitate | Avansat |
| DBP | Interogări și volum de date | Intermediar |
| RTM | Colaborare în timp real | Avansat |
| ASY | Procese asincrone | Avansat |
| SEC | Evaluare securitate cu OWASP ZAP | Intermediar |
| TEN | Izolare multi-tenant | Avansat |
| EXT | Integrare externă rezilientă | Intermediar |
| OFF | Funcționare offline și sincronizare | Avansat |
| WRK | Calcule în Web Worker | Intermediar |
| AUD | Jurnalizare și reconstrucție | Intermediar |

## CON — Concurență și consistență

**Cerință injectată:** Operații concurente asupra aceleiași resurse limitate; integritatea este protejată de server/bază de date.

**Verificare obligatorie:** Cel puțin 20 de cereri concurente pentru capacitate insuficientă; verificați atât răspunsurile, cât și starea persistentă; fără supraalocare.

**Decizii de discutat:** Tranzacții, constrângeri, operații atomice; limitele SQLite.

## STA — Fluxuri cu stări

**Cerință injectată:** Proces cu minimum patru stări, tranziții permise, condiții și actori autorizați.

**Verificare obligatorie:** Teste pentru tranziții valide/invalide, cereri repetate și operații neautorizate.

**Decizii de discutat:** Mașină de stări explicită versus condiții dispersate.

## SCL — Scalabilitate și capacitate

**Cerință injectată:** Model explicit de trafic/date, trei niveluri de sarcină și un experiment de saturare; optimizare măsurabilă.

**Verificare obligatorie:** Grafice p50/p95, throughput, erori, CPU/memorie dacă sunt disponibile; măsurători comparabile înainte/după.

**Decizii de discutat:** Blocaje DB, even loop, conexiuni, caching sau indexuri.

## DBP — Interogări și volum de date

**Cerință injectată:** Filtrare/ordonare/agregare peste volum semnificativ; evitați încărcarea integrală în RAM.

**Verificare obligatorie:** Date seed reproductibile (implicit 100.000 înregistrări principale), plan interogare, timp înainte/după, paginare corectă.

**Decizii de discutat:** Indexuri, eager loading, N+1, paginare offset/cursor.

## RTM — Colaborare în timp real

**Cerință injectată:** Clienți multipli observă modificări fără refresh manual; controlează starea învechită.

**Verificare obligatorie:** 20 clienți conectați; întârzieri măsurate, reconectări și verificarea autorizării mesajelor.

**Decizii de discutat:** Polling, SSE sau WebSocket și reconcilierea stării.

## ASY — Procese asincrone

**Cerință injectată:** Operație lungă cu trimitere rapidă, status, rezultat și comportament sigur la eșec.

**Verificare obligatorie:** Mai multe joburi, job eșuat, întrerupere worker, tratarea cererilor duplicate.

**Decizii de discutat:** Worker în proces versus coadă persistentă, retry și idempotency.

## SEC — Evaluare securitate cu OWASP ZAP

**Cerință injectată:** Plan de test securitate pe instanță controlată; scanare, triere, remediere și teste manuale.

**Verificare obligatorie:** Raport ZAP, rezultate explicate, teste acces la obiectele altui utilizator, regresie după remedieri.

**Decizii de discutat:** Limitele scanării automate, securitatea sesiunii și autorizarea pe obiect.

## TEN — Izolare multi-tenant

**Cerință injectată:** Organizații multiple folosesc platforma fără scurgeri de date între tenant-uri.

**Verificare obligatorie:** Teste negative citire/scriere/căutare/export pentru cel puțin 3 organizații.

**Decizii de discutat:** Filtrare tenant centralizată, constrângeri, politici de acces.

## EXT — Integrare externă rezilientă

**Cerință injectată:** Serviciu extern sau simulator cu timeout, eroare, rate limit și răspuns duplicat.

**Verificare obligatorie:** Teste deterministe de eroare, retry limitat, stări coerente și efecte idempotente.

**Decizii de discutat:** Timeout, retry/backoff, starea operației, deduplicare.

## OFF — Funcționare offline și sincronizare

**Cerință injectată:** Acțiuni selectate funcționează fără rețea și se sincronizează ulterior.

**Verificare obligatorie:** Mod avion, reîncărcare pagină, revenire online, retransmisii duplicate, conflict.

**Decizii de discutat:** IndexedDB, service worker, sincronizare și rezolvare conflicte.

## WRK — Calcule în Web Worker

**Cerință injectată:** Procesare client costisitoare fără blocarea interfeței.

**Verificare obligatorie:** Responsivitate UI și durată calcul înainte/după worker, rezultat corect, raport progres/anulare după caz.

**Decizii de discutat:** Transfer date, mesaje între fire, overhead și memorie.

## AUD — Jurnalizare și reconstrucție

**Cerință injectată:** Evenimente importante înregistrate cu actor, timp, obiect, acțiune și rezultat.

**Verificare obligatorie:** Reconstituiți istoricul unui obiect; împiedicați modificarea jurnalului de către utilizatori obișnuiți.

**Decizii de discutat:** Audit tranzacțional, evenimente și limitele integrității jurnalului.

## Evaluare și restricții

Fiecare pachet are aceeași rubrică: implementare corectă 40%, teste/dovezi reproductibile 30%, alternative și decizie 20%, documentarea limitelor 10%. Nu se acceptă doar o descriere teoretică. Nu se folosesc servicii plătite obligatorii. Scenariile de atac și scanările se limitează la sisteme proprii/autorizate. Dimensiunile de date și nivelurile de încărcare pot fi ajustate justificat de titular când mediul hardware nu permite valorile orientative, fără eliminarea experimentului.

---

# Architectural Challenge Packages — EN

## Composition rule

**Project = general specification + domain topic sheet + exactly two mandatory packages.** These packages are reusable requirement sets, not prebuilt NPM modules. Both must be implemented in the same application and independently verified. Each requires a concise ADR, executable tests, and measurable evidence. Core functionality, testing, coverage, baseline security, and lightweight capacity testing remain mandatory for all projects. SCL adds capacity optimization; SEC adds ZAP scanning.

## Catalogue

| ID | Package | Indicative difficulty |
|---|---|---|
| CON | Concurrency and Consistency | Advanced |
| STA | Workflow State Integrity | Intermediate |
| SCL | Scalability and Capacity | Advanced |
| DBP | Data-Intensive Query Optimization | Intermediate |
| RTM | Real-Time Collaboration | Advanced |
| ASY | Asynchronous Jobs and Recovery | Advanced |
| SEC | OWASP ZAP Security Assessment | Intermediate |
| TEN | Multi-Tenant Isolation | Advanced |
| EXT | Resilient External Integration | Intermediate |
| OFF | Offline Operation and Synchronization | Advanced |
| WRK | Browser Worker Computation | Intermediate |
| AUD | Auditability and Reconstruction | Intermediate |

## CON — Concurrency and Consistency

**Injected requirement:** Concurrent operations against a shared limited resource; integrity enforced by server/database.

**Required verification:** At least 20 concurrent requests against insufficient capacity; verify responses and persisted state; no over-allocation.

**Decisions to discuss:** Transactions, constraints, atomic operations; SQLite limitations.

## STA — Workflow State Integrity

**Injected requirement:** Workflow with at least four states, permitted transitions, preconditions, authorized actors.

**Required verification:** Test valid/invalid transitions, repeated submissions, and unauthorized changes.

**Decisions to discuss:** Explicit state machine versus scattered conditionals.

## SCL — Scalability and Capacity

**Injected requirement:** Explicit traffic/data model, three load levels plus saturation experiment; measurable optimization.

**Required verification:** Graphs for p50/p95, throughput, errors, CPU/memory where available; controlled before/after measures.

**Decisions to discuss:** Database, event-loop, connection, caching, or index bottlenecks.

## DBP — Data-Intensive Query Optimization

**Injected requirement:** Filtering/sorting/aggregation over substantial data volume; avoid loading everything in memory.

**Required verification:** Reproducible seeded data (default 100,000 main rows), query plan, before/after timings, correct pagination.

**Decisions to discuss:** Indexes, eager loading, N+1, offset/cursor pagination.

## RTM — Real-Time Collaboration

**Injected requirement:** Multiple clients observe updates without manual refresh; handle stale state.

**Required verification:** 20 connected clients; measured delay, reconnects, and event authorization checks.

**Decisions to discuss:** Polling, SSE or WebSockets and state reconciliation.

## ASY — Asynchronous Jobs and Recovery

**Injected requirement:** Long-running operation with prompt submission, status, result, and safe failure behavior.

**Required verification:** Multiple jobs, failed job, worker interruption, duplicate request handling.

**Decisions to discuss:** In-process worker versus persistent queue, retry and idempotency.

## SEC — OWASP ZAP Security Assessment

**Injected requirement:** Scoped security plan on a controlled instance; scan, triage, remediation, and manual tests.

**Required verification:** ZAP report, explained findings, cross-user object-access tests, remediation regressions.

**Decisions to discuss:** Automated scan limits, session security, object-level authorization.

## TEN — Multi-Tenant Isolation

**Injected requirement:** Multiple organizations share the service without cross-tenant data leakage.

**Required verification:** Negative read/write/search/export tests across at least 3 organizations.

**Decisions to discuss:** Centralized tenant scoping, constraints, access policies.

## EXT — Resilient External Integration

**Injected requirement:** External service or simulator with timeout, errors, rate limits, and duplicate responses.

**Required verification:** Deterministic fault tests, bounded retries, coherent states and idempotent effects.

**Decisions to discuss:** Timeout, retry/backoff, operation state, deduplication.

## OFF — Offline Operation and Synchronization

**Injected requirement:** Selected actions work without a network and synchronize later.

**Required verification:** Airplane mode, reload, reconnect, duplicate retransmission, conflict.

**Decisions to discuss:** IndexedDB, service worker, synchronization and conflict resolution.

## WRK — Browser Worker Computation

**Injected requirement:** Expensive client-side processing without blocking interaction.

**Required verification:** UI responsiveness and computation timings before/after worker, correct result, progress/cancellation where relevant.

**Decisions to discuss:** Data transfer, thread messaging, overhead and memory.

## AUD — Auditability and Reconstruction

**Injected requirement:** Record important events with actor, time, target, action, and outcome.

**Required verification:** Reconstruct object history; prevent ordinary users from modifying audit records.

**Decisions to discuss:** Transactional audit, events, and limits of log integrity.

## Assessment and boundaries

Each package uses the same rubric: correct implementation 40%, reproducible tests/evidence 30%, alternatives and reasoning 20%, documented limitations 10%. A theoretical write-up alone is insufficient. No mandatory paid services. Attack scenarios and scans target only owned/authorized systems. The instructor may reasonably adjust indicative data volumes/load levels for hardware constraints without eliminating the experiment.
