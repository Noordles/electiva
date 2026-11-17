# Frontend behavior and verification

Implemented: the wine/cyan portal preserves Noor’s design direction and icon. Student catalog details use a native dialog rather than a separate /courses/:id page. Administration uses /admin/courses, /admin/offerings, /admin/reports and /admin/directory. Production browser tests cover student and admin workflows, stale forms, provider failures and three viewport widths. The route table below retains the original responsibility/acceptance plan.

| Route | Main owner | Required content and states |
|---|---|---|
| /login | I | Validated credentials, progress, generic rejection, safe redirect |
| /courses | I | Search/filters/order/page controls, capacity/window badges, loading/error/empty |
| /courses/:id | N | Details, clear UTC/local window, enroll/join-waitlist, conflict refresh |
| /my-enrollments | N | ACTIVE/WAITLISTED/CANCELLED, own history and cancellation confirmation/result |
| /admin/courses | I | Course CRUD/archive controls, offering capacity/window forms, validation |
| /admin/offerings/:id | I | Current counts, bounded roster and FIFO status, stale-version handling |
| /admin/reports | J | Per-term/offer summaries, filtered pages, count consistency |
| /admin/directory | J | External lookup preview/import, timeout/outage/invalid metadata states |

I02 defines shared Button/Input/Select/StatusBadge/Alert/Loading/Empty/Pagination/ConfirmDialog and layout tokens. Reuse native buttons/labels, visible keyboard focus, error associations, aria-live for action results, adequate contrast and accessible dialog focus. Never convey membership state by color alone. URL query state for catalog. Session bootstrap handles expired-cookie401 centrally without loops. In-flight buttons disable duplicate clicks, while backend remains correct for repeated/racing requests.

Check at 360px, 768px and 1280px proposed viewports, zoom/keyboard, long titles, empty lists, offline responses, slow server, 401/403/409/422/503, navigation/reload and form recovery. Tables scroll or adapt without clipping actions. Explicit cancellation confirmation shows the course; waitlist promotion is visible on reload/poll-on-action, with no mandatory real-time package. Do not show raw DB errors or student personal data in non-admin screens.

N owns enrollment details/my enrollment UI and critical race outcomes. I owns login/catalog/admin workflow UI and visual consistency. J owns report/provider UI and API error handling there. Each owner includes frontend checks for their own paths; I coordinates E2E, not every test for the entire team.
