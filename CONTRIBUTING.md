# Contributing to SafeLaunch

Thanks for taking a look. A few things worth knowing up front:

- SafeLaunch is early-stage and currently driven by a single maintainer, following a phased roadmap ([`roadmap.md`](./roadmap.md)). It's not yet tagged or packaged for production use.
- Scope is intentionally locked to a fully open-source, single-tenant MVP. Multi-tenancy, billing, and user accounts are explicitly out of scope for now.
- Given that, **please open an issue before starting on anything beyond a small bug fix.** It saves you from building something that doesn't fit the current phase or the locked scope.

## Ways to contribute

- **Bug reports** — open an issue with steps to reproduce, what you expected, and what happened. Include the server version/commit and OS.
- **Small fixes** — typos, obvious bugs, missing error handling — feel free to open a PR directly.
- **Anything larger** (new endpoints, schema changes, new dependencies, frontend architecture changes) — open an issue or discussion first.

## Development setup

See the [Quickstart](./README.md#quickstart) in the main README for running the server and rebuilding the frontend.

## Code conventions

**Go:**
- Run `gofmt` and `go vet ./...` before submitting — there's no CI enforcing this yet, so it's on you.
- Pure Go only — no CGO (the project uses `modernc.org/sqlite` specifically to keep single-binary, cross-compiled builds working).

**Frontend:**
- `pnpm exec tsc --noEmit` and `pnpm lint` should both be clean.
- No new runtime dependencies without a good reason — the frontend intentionally sticks close to native browser APIs (native `<dialog>`, the Invoker Commands API, React's built-in `Suspense`/`use()`) instead of reaching for a state-management or data-fetching library. Keep new code consistent with that.

## Submitting a pull request

1. Keep it focused — one logical change per PR.
2. Describe the *why*, not just the *what*, especially if it's not obvious from the diff.
3. Make sure the app still builds and runs (`go run .` / `pnpm build`).
4. Link the issue it addresses, if there is one.

## License

By contributing, you agree your contribution is licensed under the [Apache License 2.0](./LICENSE), same as the rest of the project.
