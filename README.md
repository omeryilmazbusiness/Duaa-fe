# DUA-OS-FE

Duaa Executive OS frontend. Next.js App Router + the Guest Premium management shell (zinc-950 sidebar, serif headlines, cafe-first tabs).

Talks to [DUA-OS-BE](../DUA-OS-BE). Cafe is the first vertical; hotel and supply catalogs are registered so later workspaces do not fork the shell.

## Surfaces

| Who | Login | Shell |
|-----|--------|--------|
| GM / department manager / SERVICE | email + password at `/login` | `/{slug}/manager` tabs from `/v1/me` |
| Kitchen, bar, cleaning… | 4-digit number at `/{slug}/staff-login` | `/{slug}/staff` portal |

Cafe GM tabs: `today`, `ops`, `dashboard`, `feedback` (no reservations). Hotel GM would add `reservations` from the catalog without a new layout.

## Run

Backend (memory demo, no Postgres):

```bash
cd ../DUA-OS-BE && make run
```

Frontend:

```bash
cd ../DUA-OS-FE
cp .env.example .env.local   # DUA_API_ORIGIN=http://localhost:8080
npm install
npm run dev
```

GM: `duaa@example.com` / `ChangeMe123!` — cafe slug `duaa-cafe`.

Next rewrites `/v1/*` to the Go API so the browser stays same-origin.

## Self-test

```bash
make self-test
```

Runs typecheck, Vitest (catalog + staff-scope + mappers), import-boundary fitness, production build.

## Architecture

Hexagonal, matching ADR-0001 on the backend.

- `src/domain` — catalogs, staff-scope, RBAC, routing. No React, no fetch.
- `src/application` — ports (`AuthPort`, `StaffPort`, `WorkPort`, `BriefPort`, `TokenStore`).
- `src/infrastructure` — HTTP client + localStorage token store.
- `src/components/manager/tab-registry.tsx` — OCP: new verticals add a panel, they do not edit the shell.

Session tabs from `/v1/me` drive navigation. Client catalogs are a fallback so hotel/supply screens already exist as coming-soon panels.
