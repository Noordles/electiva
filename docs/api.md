# Planned API v1 contract

API base `/api/v1`. Response examples are design contracts, not implemented endpoints. JSON success `{data,...meta}`; error `{error:{code,message,requestId,details?}}`. Exclude sensitive values from details. Paginated collections `{data:[],meta:{page,pageSize,total,totalPages}}`. Dates are UTC ISO-8601 at HTTP boundary and normalized to integer UTC milliseconds internally.

| Method/path | Access | Behavior/status |
|---|---|---|
| POST /auth/login | public, limited | email/password → 200 user summary + cookie/CSRF contract; 401 generic failure |
| GET /auth/me | session | 200 identity/role, or 401 |
| GET /auth/csrf | session | 200 session-bound CSRF token |
| POST /auth/logout | session+CSRF | revoke session, clear cookie, 204 |
| GET /offerings | student/admin | published catalog; q/term/department/open/sort/order/page/pageSize; 200 |
| GET /offerings/:id | student/admin | public course/seat/window info; 404 absent |
| POST /offerings/:id/enrollments | student+CSRF | derive user from session; 201 ACTIVE/WAITLISTED+Location; 200 existing current enrollment |
| GET /me/enrollments | student | only own records/status/history, bounded pages |
| POST /me/enrollments/:id/cancel | owner+CSRF | 200 CANCELLED incl. repeated in-window action; promote server-side |
| GET /admin/courses | admin | bounded course management list incl. drafts/archive |
| POST /admin/courses | admin+CSRF | validate metadata, unique code, 201 |
| PATCH /admin/courses/:id | admin+CSRF | allowed metadata only, 200 |
| POST /admin/offerings | admin+CSRF | course/term/capacity/window, initial DRAFT, 201 |
| PATCH /admin/offerings/:id | admin+CSRF | metadata/capacity/window with version; 200; 409 stale version/below occupancy |
| POST /admin/offerings/:id/publish | admin+CSRF | validate complete offer; 200 |
| POST /admin/offerings/:id/archive | admin+CSRF | no current memberships; 200 or 409 |
| GET /admin/offerings/:id/roster | admin | bounded/filterable members; no secrets |
| GET /admin/reports/enrollments | admin | aggregate per-offering/term counts, bounded results |
| GET /admin/directory/courses/:code | admin | preview external metadata via adapter; 200/502/504 |
| POST /admin/directory/import | admin+CSRF | validate preview/import version, allowed fields; 201/200 |
| GET /health | public | 200 liveness, no sensitive config |
| GET /ready | public | DB ready/not ready only, 200/503 |

Errors: 400 invalid JSON/query; 401 not authenticated; 403 role/CSRF; 404 absent or inaccessible enrollment (avoid existence leaks); 409 window_closed, capacity_below_occupancy, stale_version, offering_not_available; 415 unsupported media; 422 invalid fields; 429 login throttling; 503 temporarily_busy; 500 sanitized unexpected failure. Team-selected error conventions must be frozen before UI implementation.

Catalog contract: trim and cap q length; whitelist sort `title`, `code`, `opensAt`; order asc/desc only; page integer>=1; pageSize 1..100 default20; deterministic ID tiebreaker, with tests when titles match. SQL handles filters/order/pagination; never load full collections into JavaScript to slice. Clarify whether open filter uses snapshot server time; show available seats as advisory because another request can take them before enrollment commits. Query parameters never become raw SQL identifiers.

Provider simulator contract, proposed: `GET /v1/courses/:externalCode` returns `{schemaVersion:1,data:{code,title,description,credits,department}}`; unknown code404; controlled timeout/500/invalid payload modes for local tests only. Import identity by unique external code; double import updates metadata or returns same course without duplicate records. Never proxy an arbitrary client-provided URL. Tests pin provider fixtures; no internet dependency for CI.
