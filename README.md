<div align="center">
<img src="logo_gh.png" alt="SafeLaunch logo" height="120" />

<br/>

# SafeLaunch
<!-- build statistics --><!-- test coverage --><!-- installs -->
</div>

**An open-source, self-contained, single-binary feature flag server for micro-SaaS and indie developers.**

Sits between a config file and the giants (Unleash / ConfigCat / LaunchDarkly). More than env vars, less than a platform.

> You want to change a flag without a redeploy. That's the entire value proposition. If you don't need that, use env vars. If you need experimentation, team collaboration, and governance, use one of the giants.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)

---

## Status: early development

SafeLaunch is a young, actively-developed project — **not yet tagged, packaged, or ready for production use.** There is no release binary, no CLI, no SDK, and no auth yet. What exists today:

- A Go API server ([Gin](https://github.com/gin-gonic/gin)) backed by embedded SQLite, with CRUD endpoints for boolean feature flags
- A small React + Vite dashboard, built and embedded into the Go binary via `//go:embed`
- A `Dockerfile` + `docker-compose.yaml` for running the server in a container

Not yet built: authentication, targeting rules / percentage rollouts / variants, the Python CLI, SDKs, observability, and the event pipeline. See [`roadmap.md`](./roadmap.md) for the full phased plan and current phase status.

## Why this project exists

**Who it's for:** solo/indie developers and 1–5 person teams self-hosting on a small VPS who want to flip a flag without a redeploy.

**Who it's not for:** teams that need experimentation platforms (→ Statsig, GrowthBook), enterprise governance / SOC 2 (→ LaunchDarkly), or a hosted SaaS (SafeLaunch is self-hosted only).

## Tech stack

| Layer | Today | Planned |
|---|---|---|
| Server | Go, Gin, embedded SQLite (`modernc.org/sqlite`) | Same, plus API-key auth, evaluation engine, event pipeline |
| Dashboard | React + Vite, embedded via `//go:embed` | - |
| CLI | — | Python (Typer + rich), separate distributable |
| SDKs | — | TypeScript (MVP), Python + Ruby (post-MVP) |
| Cache | — | In-process (`sync.Map` / Ristretto), no Redis |
| Deploy | Docker (`docker-compose up`) | + Linux binary via GitHub Releases, multi-arch Docker via `goreleaser` |


## Quickstart

### Prerequisites

- Go 1.26+
- Node.js + [pnpm](https://pnpm.io/) (only if you're rebuilding the frontend)

### Run from source

```bash
git clone https://github.com/epi-dev/safelaunch.git
cd safelaunch

# create a local env file (not committed)
echo "ENV=development" > .env

go run .
```

The server starts on `http://localhost:8080`. SQLite data is stored at `./db/feature_flags.db` (created automatically on first run).

### Run with Docker

```bash
docker compose up --build
```


### Rebuild the frontend (optional)

The dashboard is pre-built into `frontend/dist` and embedded into the Go binary. To make frontend changes take effect in the binary:

```bash
cd frontend
pnpm install
pnpm build      # writes frontend/dist
cd ..
go run .        # re-embeds the fresh dist/ output
```

For live frontend development against a running Go server, use `pnpm dev` inside `frontend/` (Vite dev server on `:5173`, proxied CORS is enabled when `ENV=development`).

## Build a single binary (Linux)

### 1. Build the frontend first

`//go:embed frontend/dist` bakes in whatever is at that path at compile time, so the dashboard has to be built *before* the Go binary:

```bash
cd frontend
pnpm install
pnpm build      # writes frontend/dist
cd ..
```

### 2. Build the Go binary

```bash
CGO_ENABLED=0 go build -o safelaunch .
```

Run the app:

```bash
./safelaunch
```

### Cross-compiling for a Linux VPS

From macOS or any non-Linux dev machine, target Linux directly:

```bash
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o safelaunch-linux-amd64 .
# Apple Silicon / arm64 servers:
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -o safelaunch-linux-arm64 .
```

Copy the resulting file to the server, `chmod +x`, and run it.

> If you'd rather ship a container than a bare binary — see [Run with Docker](#run-with-docker) above.

## Roadmap

- [`roadmap.md`](./roadmap.md) — the 10-phase plan this project follows, gated on outcomes not deadlines


## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## License

Apache License 2.0 — see [`LICENSE`](./LICENSE).
