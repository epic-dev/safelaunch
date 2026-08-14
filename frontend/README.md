# SafeLaunch frontend

This is the embedded dashboard UI for the [SafeLaunch](../README.md) feature flag server. It's a React + TypeScript + Vite app, built to static assets and embedded directly into the Go server binary via `//go:embed frontend/dist` (see [`main.go`](../main.go)) — there's no separate frontend deployment or server.

## Development

```bash
pnpm install
pnpm dev
```

The dev server proxies API requests to a locally running SafeLaunch server (see `consts/api-endpoints.ts`).

## Build

```bash
pnpm build
```

Outputs to `dist/`, which the Go server embeds and serves at runtime.
