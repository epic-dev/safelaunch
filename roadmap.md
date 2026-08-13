# SafeLaunch — Roadmap

## Index

- [Product hypothesis](#product-hypothesis-living-doc--current-version-as-of-2026-08-03-post-pivot)
- [Language strategy](#language-strategy)
- [Open source strategy](#open-source-strategy)
- [Roadmap — phased, gate-driven](#roadmap--phased-gate-driven)
  - [Phase 0 — Discovery](#phase-0--discovery-15-25-hrs-take-your-time)
  - [Phase 1 — Foundation: Go server + SQLite + Python CLI — in progress](#phase-1--foundation-go-server--sqlite--python-cli-30-40-hrs--in-progress)
  - [Phase 2 — Evaluation engine: targeting rules + variants](#phase-2--evaluation-engine-targeting-rules--variants-15-25-hrs)
  - [Phase 3 — Real persistence — partially done](#phase-3--real-persistence-embedded-sqlite--in-process-cache-10-18-hrs--partially-done-basic-sqlite-landed-in-phase-1)
  - [Phase 4 — Observability](#phase-4--observability-15-25-hrs)
  - [Phase 5 — Event pipeline + rollup analytics](#phase-5--event-pipeline--rollup-analytics-in-process-go-10-15-hrs)
  - [Phase 6 — SDK v1 — partially done](#phase-6--sdk-v1-15-25-hrs--partially-done-sdk-built-not-published)
  - [Phase 7 — Web dashboard, embedded — done](#phase-7--web-dashboard-embedded-25-35-hrs--done)
  - [Phase 8 — Security hardening](#phase-8--security-hardening-15-25-hrs)
  - [Phase 9 — Launch prep + multi-channel release](#phase-9--launch-prep--multi-channel-release-20-30-hrs)
- [Post-launch — Tier A extensions](#post-launch--tier-a-extensions-see-prd-section-7)
- [Post-launch — Tier B (SaaS/enterprise extension)](#post-launch--tier-b-saasenterprise-extension)
- [Progress tracker](#progress-tracker)
- [Ground rules](#ground-rules)

---

## Product hypothesis (living doc — current version as of 2026-08-03 post-pivot)

**Working name:** SafeLaunch (code name — pick real name before public phase).

**One-liner:** SafeLaunch is an **open-source, self-contained, single-binary feature flag server for micro-SaaS and indie developers.**

**Positioning:** sits between a config file and the giants (Unleash / ConfigCat / LaunchDarkly). More than env vars, less than a platform.

**Core pitch:** *"You want to change flags without a redeploy."* If you don't need that → use env vars. If you need experimentation + team collaboration + governance → use one of the giants.

**Users:** indie developers + micro-SaaS operators (1-5 engineers) running self-hosted on a $5-30/mo VPS. Concrete personas:
- Indie hacker with a Next.js SaaS charging $9/mo, ships weekly, wants A/B copy changes without a Vercel redeploy
- Solo Rails dev on a Hetzner box, wants to disable a broken feature without pushing a hotfix
- Two-person startup on Fly.io, wants gradual rollout for a risky migration path
- Consultant building client apps, wants a shared flag tool to drop into every project

Common thread: fluent with the command line, comfortable running Docker or a Linux binary on a small VPS, deploys weekly+, uses TypeScript/Python/Ruby.

**One pillar: feature flags.** Kill-switch UX, canary/percentage rollouts, and user targeting are all *features within* the flag pillar, not separate pillars. One product, done well.

**Technical shape:**
- **Server:** Go single binary (~15MB), embedded SQLite, in-process cache, in-process event pipeline
- **Dashboard:** Next.js static export, embedded in the Go binary via `//go:embed`
- **CLI:** Python (Typer + rich), separate distributable
- **SDKs:** TypeScript (MVP) + Python + Ruby (Tier A post-MVP)
- **Distribution:** Linux binary via GitHub Releases + Docker container via GHCR (multi-channel via `goreleaser`)
- **License:** Apache 2.0, single public repo
- **Deployment:** self-hosted on any Linux box, Fly machine, or Coolify

**How this changes as you learn:** update this whole section when a phase reveals something that reshapes the product. Every subsequent phase reads from this doc as the source of truth for what to build.

---

## Language strategy

Go for the server, Python for tooling, TypeScript/Python/Ruby for SDKs.

| Component | Language | Why |
|-----------|----------|-----|
| **Server** (flag CRUD + evaluation + event ingestion + dashboard serving) | **Go**, HTTP via [Gin](https://github.com/gin-gonic/gin) | Single-binary distribution + Docker container; small footprint, fast cold start |
| **Embedded frontend (dashboard)** | **TypeScript** (React + Vite) | Static build embedded in the Go binary via `//go:embed` |
| **CLI tool** (developer admin) | **Python** (Typer + rich, packaged with `uv`, distributed via PyPI) | Excellent terminal UX; separate distributable from the server binary |
| **JS/TS SDK** (npm) — MVP | **TypeScript** (built with tsup) | Consumers: web apps, Node microservices, Next.js apps |
| **Python SDK** (PyPI) — Tier A post-MVP | **Python** | Consumers: Django/Flask/FastAPI apps, Python microservices |
| **Ruby SDK** (gem) — Tier A post-MVP | **Ruby** | Consumers: Rails / Sinatra / indie Ruby projects |

**SDK ecosystem is intentionally opinionated:** TS + Python + Ruby covers ~90% of the target market's stacks. No aspiration to match ConfigCat's 20+ SDK count.

**Rule:** Go for the server is non-negotiable (single-binary is core to the positioning). SDK languages match target-user markets, not internal convenience. CLI in Python keeps a Python learning surface without putting Python on the server.

---

## Open source strategy

**Model:** **fully OSS, single-tenant by design.** No cloud tier, no billing, no multi-tenancy in MVP. Enterprise/SaaS extension deferred to post-launch steps.

**Repos:** the server + CLI + dashboard live in `safelaunch/safelaunch` (public, Apache 2.0). SDKs (TypeScript now; Python and Ruby post-MVP) live in their own repos, MIT.

---

## Roadmap — phased, gate-driven

### Phase 0 — Discovery (~15-25 hrs, take your time)

**Goal:** understand the domain deeply enough to make product decisions. Emerge with a written hypothesis you can defend.

**Discovery / theory:**
1. **Study 3 existing tools deeply**, pick from: **LaunchDarkly**, **ConfigCat** (closest competitor by target market — strongly recommend including), **PostHog**, **Statsig**, **Split**, **Unleash** (OSS), **Flagsmith** (OSS), **GrowthBook** (OSS), **Optimizely**. Read their docs. Sign up. Use them. Compare their SDKs, dashboards, targeting language, event model.
2. **Read at least 2 OSS codebases** — Unleash and Flagsmith are the two most instructive. Skim their architecture docs, look at how they model flags, how their SDKs work, how they handle multi-tenancy.
3. **Read up on feature flag use cases** — not just A/B testing. Kill switches, permission gating, ops toggles, gradual rollouts, config management. Martin Fowler's "Feature Toggles" article is a good spine.
4. **Read A/B testing basics** — Evan Miller's blog on sample size + significance; skim one Stripe or Uber engineering post on how they run experiments.
5. **Understand release safety practices** — canary deploys, blue-green, progressive delivery. Read one post on how Netflix or Google does progressive rollouts.

**Practice deliverables:**
1. **Competitive matrix** (`safelaunch/discovery/competitive-matrix.md`) — 8 tools × 10 dimensions (pricing, SDK languages, targeting model, experiment support, self-hosted option, event storage, positioning, biggest weakness, biggest strength, who they're best for).
2. **Use-case catalogue** (`safelaunch/discovery/use-cases.md`) — 10 distinct feature-flag use cases with a real example each. Ask yourself for each: "would SafeLaunch handle this well? Is this in scope?"
3. **Architecture notes on 2 OSS tools** (`safelaunch/discovery/oss-{unleash,flagsmith}-notes.md`) — 500 words each. How does each store flags? How does the SDK fetch them? How does evaluation work client-side vs server-side?
4. **Updated product hypothesis** — go back to the top of THIS FILE and rewrite the "Product hypothesis" section based on what you learned. Sharpen the differentiator. Kill anti-goals that were wrong. Add ones you missed.
5. **PRD v0** (`safelaunch/PRD.md`) — 1000-1500 words. Entities, core user flows for MVP, what's IN, what's OUT.

**Gate:**
- [ ] Can explain, without notes, the difference between server-side and client-side flag evaluation and when each fits
- [ ] Can name the top 3 competitors and articulate SafeLaunch's differentiator against each
- [ ] PRD is written and no section says "TBD"
- [ ] Product hypothesis section at top of this file has been updated

---

### Phase 1 — Foundation: Go server + SQLite + Python CLI (~30-40 hrs) — in progress

> **Note:** time budget bumped from 20-30 to 30-40 hrs to absorb the Go learning curve on top of the Phase 1 delivery scope. Once past this phase, Go productivity ramps up quickly and subsequent phases return to their previous estimates. The JSON-file interim storage originally planned for this phase was skipped — the server went straight to embedded SQLite, so what was Phase 3's "replace JSON with SQLite" step already happened here.

**Goal:** end-to-end skeleton. A Go server exposes a CRUD REST API for feature flags, persisted directly to embedded SQLite, with a React + Vite dashboard embedded in the binary for manual management. A Python CLI and browser-driven end-to-end tests are the remaining pieces before this phase closes. No SDK. No auth yet beyond a shared API key from env var (still open).

**Discovery / theory:**
1. **Go fundamentals** — types, interfaces, error handling patterns, `context.Context`, goroutines/channels basics, project layout. Recommended: A Tour of Go + first 4 chapters of *Learning Go* (Bodner) or *Let's Go* (Alex Edwards, the Go web dev bible).
2. **HTTP router** — went with [Gin](https://github.com/gin-gonic/gin) instead of the originally-planned Chi/Echo comparison. Decision made but never written up — backfill `safelaunch/decisions/010-http-router.md` before closing this phase.
3. **SQLite driver in Go** — `modernc.org/sqlite` (pure Go, no CGO) chosen over `mattn/go-sqlite3`, keeping cross-compilation simple for later. Decision made but never written up — backfill `safelaunch/decisions/002-storage-driver.md` before closing this phase.
4. **Python packaging & CLIs** — Typer docs. `uv` (fast Python package manager) — commit to it. Skim `rich` for terminal output.
5. **Playwright basics** — the page/locator/fixture model, and how it drives a real server against a real (throwaway) SQLite file for genuine end-to-end coverage instead of mocking the API.

**Practice deliverables:**
1. **Repo scaffold** — flat layout today (`main.go`, `handlers/`, `middlewares/`, `types/`, `db/queries/`), not yet split into `internal/` packages as originally sketched. Revisit the split later if the flat layout starts to hurt.
2. **Go server + embedded SQLite** — ✅ done:
   - `feature_flags` table (`id`, `key`, `description`, `enabled`) via `modernc.org/sqlite`, created on startup if missing
   - No migrations framework yet — schema is a single `CREATE TABLE IF NOT EXISTS` in `db/queries` (migrations + schema extension are Phase 3 scope)
3. **Go server endpoints** — ✅ implemented (differs from the original `/flags` + `/evaluate` sketch):
   - `GET /api/healthz` — health check
   - `GET /api/v1/feature-flags` — list all flags
   - `GET /api/v1/feature-flags/:key` — get one flag
   - `POST /api/v1/feature-flags` — create a flag
   - `PUT /api/v1/feature-flags/:key` — update a flag
   - `DELETE /api/v1/feature-flags/:key` — delete a flag
   - No `/evaluate` endpoint yet — flags are plain booleans with no targeting/variants, so "evaluate" isn't meaningful until Phase 2
   - No API-key auth yet — open item, see Gate
4. **Embedded dashboard** — ✅ done, ahead of schedule: a React + Vite UI, built and embedded into the Go binary via `//go:embed frontend/dist`. This absorbed most of what Phase 7 originally planned — see Phase 7 below.
5. **CLI commands** (Python, Typer) — 🔲 in progress, the main open item in this phase:
   - `safelaunch flag create <key> --description=... [--enabled]`
   - `safelaunch flag list [--json]`
   - `safelaunch flag get <key>`
   - `safelaunch flag update <key> --enabled/--disabled`
   - `safelaunch flag delete <key> [--yes]`
   - Reads API URL (+ API key, once auth exists) from `~/.safelaunch/config.toml` or env vars
   - Pretty output via `rich`
6. **End-to-end tests (Playwright)** — 🔲 new deliverable, not started:
   - Drive the running Go server + embedded dashboard through a real browser, not mocks
   - Cover the CRUD happy path through the UI: create a flag → see it in the list → toggle enabled → edit description → delete it
   - Run against a throwaway SQLite file so tests don't collide with dev data
   - Runnable locally via `npx playwright test` for now; wire into CI once CI exists (Phase 9 territory)
7. **Go tests** — 🔲 not started: table-driven unit tests on handlers + queries.
8. **README** — ✅ done (what SafeLaunch is, how to run locally, build a single binary, current status).
9. **CONTRIBUTING.md** — ✅ done.

**Gate:**
- [x] `go run .` (or `docker compose up`) starts the server and serves the embedded dashboard
- [x] Full CRUD happy path works through the API: create → list → get → update → delete
- [ ] Full CRUD happy path also works through the CLI: create → list → get → update → delete
- [ ] API key auth on all routes except `/api/healthz`
- [ ] Playwright e2e suite covers the CRUD happy path through the embedded dashboard
- [ ] Go tests passing (`go test ./...`) + Python CLI tests passing (`pytest`)
- [ ] Notes file (`safelaunch/notes/phase-1.md`) — 200 words on what shipped + surprises + what's still open (especially: what took longer than expected during Go ramp-up, and why JSON storage got skipped)

---

### Phase 2 — Evaluation engine: targeting rules + variants (~15-25 hrs)

**Goal:** flags aren't just boolean on/off. Percentage rollouts, attribute rules, multiple variants (control/treatment). Evaluation is deterministic per user.

**Discovery / theory:**
1. **Deterministic bucketing** — read on how tools hash `(userId, flagKey)` for consistent percentage rollouts. Understand why `Math.random()` is wrong here (breaks user experience across sessions).
2. **Rule engines** — skim JSON Logic. Decide: build your own tiny rule evaluator, or adopt one? Justify in a decision doc (`safelaunch/decisions/001-rule-engine.md`).
3. **Multivariate flags** — read how LaunchDarkly / Unleash model multiple variants. Understand the "variation weights" model.

**Practice deliverables:**
1. **Extend flag model:**
   - `variants: [{ key, value, weight }]` (weights sum to 100)
   - `targeting: [{ conditions: [{ attribute, operator, value }], variant }]` (rules evaluated in order, first match wins; fallback to weighted variants)
2. **Evaluation logic** (TS, in the API):
   - Given `(flagKey, userContext)`, walk targeting rules → find match → return variant.
   - If no rule matches: hash `(userId, flagKey)` → map to a bucket 0-99 → select variant by cumulative weight.
   - Return `{ value, reason: "targeting-rule" | "percentage" | "default" }` so consumers know why.
3. **Property-based tests** — same user always gets same variant across evaluations (given same flag config). Distribution is even across many users for a 50/50 rollout (tolerance ±2%).
4. **CLI extensions:**
   - `safelaunch flag update <key> --add-variant=<key>=<value>:<weight>`
   - `safelaunch flag update <key> --add-rule=<attr>=<val>:<variant>`
   - `safelaunch flag show <key>` — pretty-print full flag config including rules + variants.

**Gate:**
- [ ] User `alice` gets variant X consistently across 100 evaluations
- [ ] 10,000 fake users across a 50/50 flag → split within 48/52 range
- [ ] Attribute rule "country == 'CH' → treatment" works
- [ ] `reason` field explains every evaluation

---

### Phase 3 — Real persistence: embedded SQLite + in-process cache (~10-18 hrs) — partially done (basic SQLite landed in Phase 1)

> **Note (per ADR 009):** originally scoped as Postgres + Redis (~15-25 hrs). Simplified to SQLite + in-process cache to preserve the single-binary story. Time budget dropped. Basic SQLite storage (a single `feature_flags` table, no migrations, no cache, no WAL pragmas) already shipped in Phase 1. What's left here: migrations framework, the extended schema (variants/targeting/versions, once Phase 2 defines them), in-process cache, WAL pragmas, backup docs, and the load test.

**Goal:** replace JSON file with SQLite embedded in the Go binary. Add in-process caching. Zero external service dependencies.

**Discovery / theory:**
1. **SQLite in Go** — already decided in Phase 1: `modernc.org/sqlite` (pure Go, no CGO, easier cross-compilation) over `mattn/go-sqlite3`. Backfill `safelaunch/decisions/002-storage-driver.md` if it wasn't written during Phase 1.
2. **SQLite operational patterns** — WAL mode (`PRAGMA journal_mode=WAL`) for concurrent reads, `PRAGMA synchronous=NORMAL` for the durability/perf tradeoff, `PRAGMA busy_timeout=5000` for retry on locks. Read a good SQLite-in-production article (Simon Willison's blog is excellent).
3. **Migration strategy** — `golang-migrate` or `pressly/goose`. Migrations embedded in the binary via `//go:embed`.
4. **In-process caching** — `sync.Map` (simple) vs Ristretto (feature-rich, LFU eviction). For evaluation cache, either works at target-user scale.

**Practice deliverables:**
1. **SQLite schema** (via versioned migrations, embedded via `//go:embed`):
   - `flags` (id, key, description, default_value, enabled, killed_at, created_at, updated_at)
   - `flag_variants` (id, flag_id, key, value, weight)
   - `flag_targeting_rules` (id, flag_id, ordinal, conditions_json, variant_key)
   - `flag_versions` (id, flag_id, config_snapshot_json, created_at, created_by) — immutable audit trail
2. ~~Replace file storage with SQLite~~ — already done in Phase 1. Current default path is `./db/feature_flags.db`, hardcoded in `main.go` — make it configurable via env var (open item for this phase).
3. **In-process cache** for the evaluation-read path — `map[string]*Flag` behind a `sync.RWMutex`, or Ristretto. Invalidate on any write to the flag. TTL not strictly needed since we own both writer and reader in-process, but set 60s TTL as a safety net.
4. **WAL mode + pragmas** set at DB open. Documented.
5. **Backup story documented** — `cp safelaunch.db safelaunch.db.backup` works fine when the server is stopped. For online backup: `.backup` command via sqlite3 CLI or Go's SQLite backup API. Put both in the README.
6. **Load test** with `k6` or `vegeta` against a local server: measure p50/p95/p99 of `POST /evaluate` before cache and after. Document in `safelaunch/notes/phase-3-perf.md`.

**Gate:**
- [ ] Migrations run cleanly forward and roll back; migration files embedded in the binary (no separate files to ship)
- [x] Flag data persists across server restarts (kill process, restart, all flags present) — already true today, SQLite is file-backed since Phase 1
- [ ] Cache hit rate > 95% in steady-state load
- [ ] p95 evaluate latency < 5 ms under 1k RPS locally (in-process cache should be near-zero overhead)
- [ ] `cp safelaunch.db backup.db` while server is running produces a consistent snapshot (WAL semantics)

---

### Phase 4 — Observability (~15-25 hrs)

**Goal:** the tool observes ITSELF as well as it observes your customers' releases. Structured logs, metrics, traces — the works. This is your biggest interview gap so this phase is grade-critical.

**Discovery / theory:**
- Do [`Observability-Security-prep-guide.md`](../../topics/Observability-Security-prep-guide.md) **Sessions 1, 2, 3** in full (pillars + metrics + tracing). These sessions produce writeup deliverables — save them under `safelaunch/notes/obs-*`.

**Practice deliverables:**
1. **Structured logging** (`pino` in TS API, `structlog` in Python CLI + analytics).
   - JSON output.
   - Every request generates a `requestId` at the API edge; propagate on any outbound call.
   - PII redaction: never log API keys, user emails, or full user contexts in plaintext.
   - Log level via env var, `info+` in prod, `debug` opt-in per request via header.
2. **Metrics** (`prom-client` in TS):
   - `/metrics` endpoint exposed on API.
   - RED metrics on all HTTP routes (rate, errors, duration as histogram).
   - Custom metrics: evaluations/sec, cache hit rate, active API keys/min, flag-write ops/min.
3. **Tracing** (OpenTelemetry SDK, TS):
   - Auto-instrument Fastify, Postgres client, Redis client.
   - Manual span around the evaluation logic (attribute: flag key, variant returned).
   - Export to Grafana Cloud free tier (or Jaeger locally in docker-compose).
4. **Grafana dashboard** — one dashboard with 4 panels: request rate, p95 latency, error rate, evaluations/sec. Screenshot in `safelaunch/notes/phase-4-dashboard.md`.
5. **Sentry** wired up for both TS and Python. Test error → visible in Sentry with a readable stack.
6. **Release annotations** (this is on-brand for SafeLaunch — dogfood):
   - Every flag change writes an event annotation.
   - Annotations show up as vertical lines on the Grafana dashboard.
   - Demo: change a flag → see line appear on the request-rate graph within 30s.

**Gate:**
- [ ] Log line pasted showing `requestId` + `flagKey` + level + message in JSON
- [ ] Full trace visible in Grafana: CLI → API → Postgres → Redis
- [ ] Dashboard screenshot with all 4 panels populated + annotations showing
- [ ] Simulate a Redis outage → error rate metric spikes, alert would fire (write the alert but don't route it)
- [ ] Notes file distinguishes observability of SafeLaunch itself from observability SafeLaunch will provide TO customers (this distinction is your product's core value)

---

### Phase 5 — Event pipeline + rollup analytics (in-process, Go) (~10-15 hrs)

> **Scope note (per ADR 009, 2026-08-03):** originally BullMQ + Python + ClickHouse (~15-25 hrs). Now: **in-process Go goroutines + SQLite**. External queue and analytics store dropped in favor of the single-binary story. Python analytics processor obsoleted; rollup done in Go inside the same binary. Time budget dropped again. A/B/n testing remains Tier A (post-MVP).

**Goal:** SDK-emitted evaluation events flow through an in-process buffer to SQLite. A background goroutine computes rollup counts so the dashboard and CLI can answer "how many users have seen v2 so far?" No external queue, no external analytics DB.

**Discovery / theory:**
1. **Go concurrency for this shape** — goroutines + buffered channels; graceful shutdown patterns; `context.Context` propagation. Read *Concurrency in Go* chapters 3-4 or equivalent.
2. **Event schemas** — read on schema evolution for events. Additive changes only, versioned schemas. CloudEvents spec for reference. Design v1 to accept a `conversion` event type post-MVP without breaking existing consumers.
3. **SQLite for event workloads** — bulk INSERT via `INSERT ... VALUES (...), (...), ...` with transactions; `WITHOUT ROWID` tables for narrow event rows; time-based partitioning via separate tables or a `created_at` index; retention via periodic `DELETE WHERE created_at < ...`.
4. **Backpressure in the buffered-channel model** — what happens when the analytics buffer fills? Options: drop-oldest (metric loss but no user impact), block ingestion (protects data but slows the API), shed with warning (recommended default). Read on this.

**Practice deliverables:**
1. **Event schema** (documented in `safelaunch/docs/events.md`). MVP only ingests `evaluation` events; schema versioned + additive-safe:
   ```json
   {
     "version": 1,
     "eventType": "evaluation",
     "flagKey": "...",
     "variantKey": "...",
     "userId": "...",
     "sessionId": "...",
     "timestamp": "...",
     "properties": { ... }
   }
   ```
2. **Ingestion endpoint** (Go): `POST /events` — batch-friendly, accepts an array up to 100. Validates. Pushes onto an in-process buffered channel. Returns 202. Never blocks on downstream.
3. **Background writer goroutine** (Go): drains the channel in batches (up to 500 events or 5-second flush), does a single bulk INSERT into SQLite. Log + drop with warning if buffer overflows.
4. **Rollup goroutine** (Go): periodic (default 1 min) rollup pass — reads recent evaluation events from SQLite, computes per-flag / per-variant counts, writes summary rows to a `flag_stats` table. Idempotent (uses last-processed watermark). This replaces the Python analytics processor.
5. **CLI reporting command** (Python — talks to the Go server's HTTP API):
   - `safelaunch stats <flag-key>` — pretty-print current rollup counts (evaluations per variant, distinct users per variant, over configurable time window)
   - _(No `safelaunch experiment` command in MVP — added when A/B/n ships as Tier A post-launch.)_
6. **Retention policy** — configurable via env var. Default: keep raw events 7 days, rollups indefinitely. Background goroutine sweeps old events.
7. **Load test**: fire 10k events at the server; verify all land in SQLite within 30 seconds; buffer never overflows at that rate; rollup produces correct counts. Document in `safelaunch/notes/phase-5-perf.md`.

**Gate:**
- [ ] 10k events → 100% written to SQLite within 30s under normal load
- [ ] Kill server mid-flush → on restart, unflushed events are lost (documented; acceptable at MVP scale — user can enable durable-writes mode via env var for stronger guarantee at latency cost)
- [ ] Rollup goroutine produces per-flag counts that match hand-verified totals
- [ ] `safelaunch stats <flag>` returns numbers matching the rollup table
- [ ] Event schema is versioned and additive-safe (a `conversion` event type can be added post-MVP without changing any existing consumer code)
- [ ] Buffer-overflow behavior documented: what happens when analytics throughput exceeds capacity (shed with warning, don't block ingestion)

---

### Phase 6 — SDK v1 (~15-25 hrs) — partially done (SDK built, not published)

> **Note:** the TypeScript SDK is already built, in its own repo (per the open source strategy, SDKs live outside `safelaunch/safelaunch`) — it just hasn't been published to npm yet. This phase's remaining scope is verification against the checklist below and the actual `npm publish`, not building from scratch.

**Goal:** publishable JS/TS SDK developers can install. Fetches flag config from the API, evaluates locally against user context, batches events back.

**Discovery / theory:**
1. **How SDKs are shipped** — read on npm publishing, semantic versioning, bundle-size discipline. Target < 10 KB gzipped for the core SDK.
2. **SDK failure modes** — network down, backend down, cache stale, wrong API key. Read how LaunchDarkly / Unleash SDKs handle each.

**Practice deliverables:**
1. **`@safelaunch/sdk-js`** package (in its own repo, built with `tsup`) — ✅ built, 🔲 not yet published to npm.
2. **API surface (minimal):**
   ```typescript
   const client = new SafeLaunchClient({ apiKey: '...', pollIntervalMs: 30_000 });
   await client.init();
   const value = client.evaluate('flag-key', { userId: 'u1', country: 'CH' }, /* default */ false);
   client.track('conversion', { userId: 'u1' });
   await client.close();
   ```
   — verify the shipped SDK still matches this surface before publishing. `track()` in particular depends on the Phase 5 event pipeline, which doesn't exist server-side yet.
3. **Behavior** — confirm each of these against the actual SDK before publishing:
   - Init fetches all flags for the API key, caches in memory.
   - Polls every N seconds (configurable).
   - Evaluate is synchronous and pure — never blocks, never throws.
   - On any error: log warning, return the `default` value.
   - Events batched, flushed every 5s or every 100 events.
4. **Bundle-size check** in CI — 🔲 no CI exists yet for the SDK repo.
5. **Tests** — status TBD, confirm what exists in the SDK repo.
6. **Local demo app** (a tiny React app) using the SDK — 🔲 not started.

**Gate:**
- [ ] SDK installable via `npm install @safelaunch/sdk-js`
- [ ] Bundle size < 10 KB gzipped
- [ ] Demo app in `apps/demo/` renders differently based on flag value
- [ ] Kill the API → demo app keeps working with last-known values, no crashes

---

### Phase 7 — Web dashboard, embedded (~25-35 hrs) — done

> **Note:** shipped early and by a different path than planned — a React + Vite static build embedded via `//go:embed`, not the originally-planned Next.js static export with shadcn/ui. Most of this scope landed as part of core Phase 1 work rather than as its own phase. Kept here mainly for its Gate, which is still a fair checklist to verify against.

**Goal:** browser UI for flag management, embedded in the Go binary. Zero additional runtime dependencies. When users run `./safelaunch`, the dashboard is served on the same port as the API.

**What actually shipped:**
- React + Vite dashboard (`frontend/`) — no Next.js, no shadcn/ui, no `next export`
- Build pipeline: `pnpm build` in `frontend/` writes `frontend/dist/`, embedded into the Go binary via `//go:embed frontend/dist`
- Served at `/` (and `/assets`) on the same port as the API
- CRUD flows for feature flags from the browser

**Not built (deferred past MVP for now):**
- Auth prompt / API key gate on the dashboard — depends on Phase 1's still-open auth item
- Optimistic UI updates on flag toggles
- "Big red button" kill-switch treatment, distinct from a normal toggle
- Release annotations timeline per flag — depends on Phase 4/5 work that hasn't happened yet
- Events log page

**Gate:**
- [x] `./safelaunch` binary embeds the dashboard — currently ~34 MB (`frontend/dist` itself is ~230 KB before gzip; the rest is the Go binary + SQLite driver). Slightly over the original 30 MB target, worth watching as dependencies grow but not urgent.
- [x] Dashboard loads at `http://localhost:8080/` when the binary runs — no separate frontend deploy
- [x] Full CRUD from browser — no CLI needed (currently also the *only* way to manage flags, since the CLI doesn't exist yet)
- [ ] Toggle a flag → SDK-connected demo reflects change within 60s (poll interval) — no SDK-connected demo app exists yet, revisit once Phase 6's demo app is built
- [ ] Kill switch works end-to-end, event annotation shows in observability dashboard — no kill-switch UX or observability yet (Phase 4/5)
- [ ] Mobile view acceptable (bootstrap-quality is fine) — not verified

---

### Phase 8 — Security hardening (~15-25 hrs)

> **Note (2026-08-03 pivot per ADR 008):** the original Phase 8 (Auth + multi-tenancy) and Phase 9 (Billing / Stripe) were dropped from MVP when SafeLaunch pivoted to portfolio-first / fully OSS / single-tenant. Both are documented in PRD Section 7 Tier B (SaaS/enterprise extension), to be revived only if commercialization is pursued. What was Phase 10 is now Phase 8; what was Phase 11 is now Phase 9.

**Goal:** production-worthy security posture. Fixed for a real launch.

**Discovery / theory:**
- Do Observability-Security prep guide **Sessions 4, 5, 8** in full. Session 8 is the audit template.

**Practice deliverables:**
1. **Full security audit** against the 10-layer checklist. `safelaunch/notes/phase-8-audit.md`.
2. **Fix everything Med or High severity.** Expected work (single-tenant Go OSS scope):
   - Security headers via middleware: CSP, HSTS, X-Frame-Options, Referrer-Policy, X-Content-Type-Options (use `github.com/unrolled/secure` or hand-rolled)
   - CORS narrowly configured for the dashboard origin — never `*` on the API
   - Rate limiting on evaluation endpoint + flag-mutation endpoints (per API key + per IP) — `github.com/ulule/limiter` or similar
   - Dependency scanning in CI: `govulncheck ./...` for Go, `pip-audit` for the Python CLI, `npm audit --omit=dev` for the SDK. All fail the build on High.
   - Secrets in env vars (not committed); document rotation procedure in README
   - API key rotation flow — CLI + dashboard command to generate a new key + invalidate old (persists to config file for the binary to reload on next start)
   - _(No cross-tenant IDOR test since single-tenant — but include a general authorization test: request without valid API key → 401, no data leakage in error responses.)_
3. **Load test** the full path (SDK → server → SQLite → in-process rollup) with `k6` at 500 RPS for 5 min. Capture graphs, document bottlenecks. Baseline expectation: p95 evaluate < 5ms locally.
4. **Backup + restore** — document `.backup` procedure for SQLite (works while server is running). Optional: recommend Litestream in the README for continuous S3 replication (Phase 9 or post-launch item).
5. **Release signing** — publish SHA256SUMS with GitHub Releases; sign the file if a GPG key is set up (optional Phase 9 vs required now).

**Gate:**
- [ ] Audit doc rates all 10 layers; nothing Med+ unresolved
- [ ] Auth test in CI: unauthenticated request returns 401 cleanly; no data leakage in error messages
- [ ] Load test documented; system holds up or specific bottleneck named + planned
- [ ] Backup restore verified end-to-end

---

### Phase 9 — Launch prep + multi-channel release (~20-30 hrs)

**Goal:** public OSS release. Repo polished, docs live, first non-you human runs it successfully. Multi-channel distribution (Linux binary + Docker image) set up in CI.

**Practice deliverables:**
1. **Real name** — pick, register domain (optional), npm scope, PyPI name, GitHub org.
2. **Multi-channel release automation via `goreleaser`** — GitHub Actions workflow that on git tag produces:
   - Linux amd64 binary
   - Linux arm64 binary
   - Docker image (multi-arch) pushed to GitHub Container Registry
   - `SHA256SUMS` file for verification
   - GitHub Release page with all artifacts + auto-generated changelog
3. **Install-script** hosted on your domain (or served from GitHub Pages): `curl -fsSL https://safelaunch.dev/install | sh` that downloads the right binary for the platform, verifies SHA, moves to `/usr/local/bin`. Optional if hosting is a hassle — GitHub Releases URL is enough.
4. **Docs site** — recommend just the README + `docs/` folder rendered by GitHub. Full Docusaurus/Fumadocs deferred unless you have appetite. Cover: quickstart (5-min), self-hosting guide, SDK reference, targeting rules, security notes.
5. **Landing page / GitHub README polish** — headline (the positioning line), three benefits, quickstart command, "star the repo" call to action, honest "who this is for / who it's not for" section (from PRD Section 3).
6. **`.github/` templates** — issue templates, PR template, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`.
7. **Recruit one real user.** Friend, ex-colleague, someone with a side project. Watch them run either the binary or the Docker container. Log friction points.
8. **Fix top 5 friction points.**
9. **Launch post** — write a technical launch post for the blog: "Introducing SafeLaunch: an open-source feature flag server that sits between a config file and the giants." This post is the portfolio-defining artifact of the project.
10. **Show HN / dev.to / Hashnode syndication** — publish to at least two channels. Not for user growth (it's a portfolio project) but for GitHub inbound + interview mention material.

**Gate:**
- [ ] `goreleaser` runs cleanly from CI on git tag → GitHub Release with binary + Docker image + checksums
- [ ] One-line quickstart works from a fresh Linux VPS: `curl -O <url> && chmod +x safelaunch && ./safelaunch`
- [ ] One-line Docker quickstart works from Mac: `docker run -p 4000:4000 ghcr.io/<user>/safelaunch:latest`
- [ ] Docs live (README + `docs/` in the repo, rendered by GitHub)
- [ ] One non-you human has run SafeLaunch (either binary or container) and evaluated a flag through the TS SDK
- [ ] Friction log filed; top-5 fixes shipped
- [ ] Launch post published and cross-linked from GitHub README

---

## Post-launch — Tier A extensions (see PRD Section 7)

Natural OSS extensions, added based on user feedback / personal learning interest. Don't require a commercialization decision.

- A/B/n testing (top priority — largest MVP deferral)
- Auto-rollback on error/latency spikes
- Python SDK
- Slack / webhook notifications
- Advanced targeting DSL (segments, nested rules)
- Scheduled ramps
- Sequential / Bayesian statistics (after basic A/B/n ships)

## Post-launch — Tier B (SaaS/enterprise extension)

Only pursued if ADR 008 revisit triggers fire — unexpected OSS traction + monetization becomes live question. Effectively a v2 initiative with its own planning phase.

- Multi-tenancy layer
- User accounts + authentication
- Billing / Stripe integration
- Hosted SaaS tier
- Approval workflows for high-risk flags
- Multi-region edge cache
- SOC 2 pathway (only if a paying customer requires it)

---

## Progress tracker

| Phase | Focus | Started | Done | Grade | Notes file |
|-------|-------|---------|------|-------|-----------|
| 0 | Discovery | ✅ |  |  |  |
| 1 | Foundation | ✅ |  |  |  |
| 2 | Evaluation engine |  |  |  |  |
| 3 | Real persistence | ✅ (partial — basic SQLite only) |  |  |  |
| 4 | Observability |  |  |  |  |
| 5 | Event pipeline + rollup analytics |  |  |  |  |
| 6 | SDK v1 | ✅ (partial — built, unpublished) |  |  |  |
| 7 | Web dashboard | ✅ | ✅ |  |  |
| 8 | Security hardening |  |  |  |  |
| 9 | Launch (OSS release) |  |  |  |  |

**Cumulative average:** __/100
**Public release readiness (after Phase 9):** GO / HOLD-BACK / RED-FLAG

> **Note (2026-08-03):** original roadmap had 12 phases (0-11) targeting a SaaS MVP. Per ADR 008 (portfolio-first / fully OSS pivot), Phase 8 (Auth + multi-tenancy) and Phase 9 (Billing) were dropped from MVP. Renumbered: what was Phase 10 → Phase 8; what was Phase 11 → Phase 9. Dropped work is documented as Tier B in PRD Section 7 for potential future revival.

---

## Ground rules

1. **Discovery first, always.** No coding in a new phase until the discovery/theory step is complete. When you're excited about the code, that's exactly the moment to pause and read.
2. **The product hypothesis is a living doc.** Update it at the top of this file after every phase where you learned something that reshapes it.
3. **Phase gates are hard.** No moving on with a gate item unchecked. Extend the phase or descope the next one — don't build on wobble.
4. **Every phase ends with a written note.** `safelaunch/notes/phase-N.md`. What shipped. What surprised you. What's still open. This is portfolio material and interview fuel.
5. **Architectural decisions get ADRs.** `safelaunch/decisions/NNN-topic.md`. One page each. Six months from now, you'll thank yourself.
6. **When you finish a phase, ping** "grade phase N" — I fill inline.
7. **When your product hypothesis changes, update the top of this file and tell me.** The roadmap adjusts to the product, not the other way around.
