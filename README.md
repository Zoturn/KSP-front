# ksp-frontend

Web UI for the KSP e-commerce catalog — **React + Vite + TypeScript + TanStack Query + Tailwind**.

Part of the KSP learning project. This app does **not** hand-write its API layer: it generates
a fully typed client from `ksp-backend`'s OpenAPI spec.

---

## Prerequisites

- Node.js 22.x
- A running `ksp-backend` (see that repo's README) — needed to generate the API client and to
  have anything to display.

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Environment
cp .env.example .env

# 3. Generate the typed API client from the running backend
npm run generate:api

# 4. Start the dev server
npm run dev
```

Open <http://localhost:5173>.

---

## The backend contract

```
ksp-backend  →  openapi.json  →  npm run generate:api  →  src/api/generated/
```

- Types and endpoint functions are **generated** — never hand-written.
- **Do not edit `src/api/generated/`.** It is build output. If something is wrong, fix the
  backend DTO and regenerate.
- Re-run `npm run generate:api` whenever the backend contract changes. If the app then fails
  to compile, that is the safety net working — the API changed under you.

---

## Commands

| Command                | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Vite dev server                                 |
| `npm run build`        | production build (also typechecks)              |
| `npm run preview`      | serve the production build locally              |
| `npm test`             | Vitest                                          |
| `npm run generate:api` | regenerate the API client from the backend spec |

---

## Project structure

```
src/
  api/          generated client + configured axios instance
  features/     auth/ catalog/ cart/ orders/ admin/
  components/   shared UI
  hooks/        shared hooks
  lib/          helpers (money formatting, storage)
  routes/       routing + protected routes
```

---

## Conventions worth knowing

- **Server state goes through TanStack Query.** No `useEffect` + `fetch` data fetching.
  Client-only UI state (modals, drafts) stays in `useState`.
- **Money arrives as integer cents.** Format with `Intl.NumberFormat` at display time; never
  do currency math in floats.
- **Loading, error and empty states are handled explicitly** — an unhandled error state is a bug.
- **Tailwind is explained as it is introduced** (it's new to the author).

Full conventions live in this repo's `.claude/rules/`.
