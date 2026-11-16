> An universitar / Academic year: **2026–2027**  
> Disciplina / Course: **Tehnologii Web / Web Technologies**  
> Statut / Status: **Draft v2.0 — pentru revizuire / for review**

---

# Înscriere la cursuri opționale — RO

**Pachete obligatorii:** `CON` + `SCL`  
**Fișă comună:** [`00-general-specifications.md`](00-general-specifications.md)  
**Definiții pachete:** [`01-architectural-challenges.md`](01-architectural-challenges.md)

## 1. Obiectiv

Studenții aleg cursuri cu locuri limitate; administratorii gestionează ofertele, ferestrele de înscriere și listele de așteptare.

## 2. Funcționalitate minimă

Student: căutare, înscriere/anulare, vizualizare statut. Administrator: gestionare cursuri, capacități, perioade și rapoarte. Promovare din lista de așteptare după anulare.

## 3. Invariante și reguli critice

Numărul înscrierilor active nu depășește capacitatea; același student nu are două înscrieri active la același curs; operațiile în afara intervalului sunt respinse.

## 4. Scenariu de volum și sarcină

10.000 de studenți fictivi, 100 utilizatori activi și 20 de cereri concurente pentru ultimul loc; obiectiv indicativ p95 < 800 ms pentru listare în profilul de test.

## 5. Verificări obligatorii ale pachetelor

CON: 20 cereri pentru un loc, verificare finală DB; SCL: trei niveluri, saturare și o optimizare măsurată.

## 6. Criterii comune de acceptare

- Un student din rolul obișnuit poate efectua fluxurile proprii, dar nu poate exercita operațiile rolului privilegiat.
- Există teste automate pentru fluxurile critice, permisiuni, intrări invalide și invariante.
- Cele două pachete sunt implementate, demonstrate și însoțite de rezultate reproductibile; simpla descriere nu este suficientă.
- Raportul de coverage, testul comun de încărcare și estimarea capacității sunt predate, conform specificației generale.
- Se livrează seed-uri sintetice, scripturi de test, ADR pentru fiecare pachet și instrucțiuni de demonstrație.

## 7. Livrare pe etape

**M1:** cazuri de utilizare, actori, reguli, schemă, API, profil de sarcină, plan de teste și alternative pentru pachete.  
**M2:** API, persistență, reguli critice și testele inițiale; primul scenariu de pachet demonstrabil.  
**M3:** SPA integrată, testele complete, ambele pachete validate, rapoarte de acoperire și performanță, ADR și demonstrație.

## 8. Extensie opțională

Liste de așteptare cu priorități sau înscrieri în lot.

**Atenție:** extensia nu înlocuiește cerințele obligatorii și nu implică servicii plătite.

---

# University Course Enrollment — EN

**Mandatory packages:** `CON` + `SCL`  
**Common specification:** [`00-general-specifications.md`](00-general-specifications.md)  
**Package definitions:** [`01-architectural-challenges.md`](01-architectural-challenges.md)

## 1. Objective

Students select capacity-limited optional courses; administrators manage offerings, enrollment windows, and waitlists.

## 2. Minimum functionality

Student: browse, enroll/cancel, check status. Administrator: manage courses, capacities, windows, and reports. Waitlist promotion after cancellation.

## 3. Critical invariants and rules

Active enrollments never exceed capacity; a student cannot have two active enrollments for one course; operations outside the enrollment window are denied.

## 4. Data and workload scenario

10,000 synthetic students, 100 active users, 20 competing requests for the last seat; illustrative p95 < 800 ms for listings in the documented test profile.

## 5. Mandatory package verification

CON: 20 requests for one seat, final DB verification; SCL: three levels, saturation, and one measured optimization.

## 6. Common acceptance criteria

- Ordinary users can complete their allowed workflows, but cannot perform privileged operations.
- Automated tests cover critical workflows, permissions, invalid inputs, and invariants.
- Both packages are implemented and backed by reproducible evidence; a description alone is insufficient.
- Coverage report, common load test, and capacity estimate are delivered under the general specification.
- Synthetic seed data, test scripts, an ADR per package, and demonstration instructions are provided.

## 7. Milestone deliverables

**M1:** use cases, actors, rules, schema, API, workload profile, test plan, and package alternatives.  
**M2:** API, persistence, critical rules, and initial tests; first demonstrable package scenario.  
**M3:** integrated SPA, completed tests, both packages verified, coverage/performance reports, ADRs, and demonstration.

## 8. Optional extension

Priority waitlists or batch enrollment.

**Note:** extensions never replace mandatory requirements and must not require paid services.
