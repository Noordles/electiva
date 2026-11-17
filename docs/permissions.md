# Frozen M1 role and ownership contract

Implemented server contract in M2. The admin page is role-restricted; management screens remain M3. API tests verify roles, object ownership, CSRF and session behavior.

| Operation | Anonymous | Student | Administrator |
|---|---|---|---|
| Login / public health | Allowed | Allowed | Allowed |
| Published catalog/details |401|Allowed|Allowed|
| Enroll / join waitlist |401|Own session identity only|403; no implicit student impersonation|
| Own enrollment history / cancellation |401|Own records only|No student impersonation endpoint|
| Course/offering publish/edit/archive |401|403|Allowed with CSRF and version/business checks|
| Change capacity/window |401|403|Allowed; cannot reduce below occupancy|
| Roster/reports/provider import |401|403|Allowed, bounded output, no secrets|
| Read another student's enrollment |401|404|Use explicit authorized roster/report route|

CSRF/origin validation is required for cookie-authenticated state changes. Enrollment identities come from the server session, never from a submitted role/userId. Server-time [opensAt,closesAt) applies to enrollment/cancellation/promotion; reads remain available outside the window. Policies are team proposals pending future teacher revisions, not independently confirmed grading rules.
