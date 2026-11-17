# M3 experiment protocol — frozen before measurement

The earlier120-second steady window was a planning proposal. This local classroom experiment uses **3s warmup,12s measured steady traffic and3s recovery**, with three independent repetitions at10/50/100 users. Authentication and fixture creation are excluded. All durations and drained completion time are saved. These short windows support a bounded desktop comparison, not a long-duration production SLA.

Each run resets the same10,000-student/100-offering/50,000-attempt fixture and its logical row hash. Random password salts and sessions are excluded from that hash. One backend child process and one generator process share the same Windows machine/local SSD. Backend CPU/RSS/event-loop/retry counters exclude the generator. Power mode and unrelated machine activity are not controlled.

Traffic is closed-loop: one outstanding request per user,500–1500ms seeded think time and an initial0–1000ms stagger. Mix70% catalog,15% own history,10% enroll,5% cancel; missing tracked cancellation falls back to enrollment. Latencies include HTTP/generator scheduling; endpoint results and completion drain are explicit. Request deadline5s. Every run verifies recovery, capacity, uniqueness and foreign keys after quiescing the service.

Baseline and optimized snapshots use the same fixture clock, model and environment. Three repeated SQL profiles use the exact application query, five warmups and50 measured requests each; results/fixture hashes must agree. Select a query change only after inspecting baseline profile/plan. Integrity indexes, auth, data, service count and runtime remain constant. Sequential version order is a limitation, reported with repeat ranges.

Saturation steps use100/200/400 users without think time to bound overload on this laptop; that stress model is reported separately from the ordinary user model. Repeat three times where safe. Stop higher levels if unexpected errors reach5% or backend RSS exceeds1GiB. Report the highest tested sustainable level meeting listing p95<800ms, errors<1% and all invariants for the stated duration/model; report an upper tested bound if no knee appears. Failed levels remain in evidence. Recovery is always checked.

No actual gain, capacity or package acceptance is claimed before measurements finish. All reports name exact snapshot commits, commands, timestamps, environment and limitations.
