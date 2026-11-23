# Tasks

> Build order: tooling, then the token layer, then primitives, then the shell, then the contract
> pipeline, then the one slice that proves all of it together. Every task that adds a component
> writes its tests in the same task — see `testing.md`.
>
> `LEARNING/` is gitignored in this repo, so task 7.1 produces a file that will not appear in
> the diff. That is expected; the record of it lives here.

## 1. Tooling and scaffold

- [ ] 1.1 Scaffold Vite + React + TypeScript into this repo (which already contains
      `CLAUDE.md`, `README.md`, `.claude/`, `LEARNING/`, `openspec/` — **do not overwrite
      them**; scaffold into a temp directory and merge in, the way the backend's task 1.1 did).
      Pin Node `>= 24.9` in `engines` and add `.nvmrc`, matching the backend's floor. Verify
      `npm run dev` serves a page and `npm run build` succeeds.
- [ ] 1.2 Add Prettier with `@trivago/prettier-plugin-sort-imports` configured to the import
      order `frontend.md` specifies, plus ESLint for TS + React. Verify by deliberately
      mis-ordering imports in one file, running the formatter, and confirming it reorders them —
      a formatter that is installed but not actually enforcing the convention is the failure
      mode here.
- [ ] 1.3 Add Vitest + React Testing Library with a jsdom environment and a single smoke test.
      Verify `npm test` passes, and confirm the test genuinely runs by making it fail once.

## 2. The token layer

- [ ] 2.1 **First, check which Tailwind major installs** (design Decision 3: v4 moved
      configuration from `tailwind.config.js` to a CSS `@theme` block). Follow that version's
      documented approach rather than remembered syntax, and record which one it is in the task
      notes. Install Tailwind and confirm a utility class actually applies in the dev server.
- [ ] 2.2 Define the design tokens — colour (surface/text/border/accent plus semantic
      success/warning/danger), spacing scale, radii, font sizes — once, and expose them through
      Tailwind so markup uses `bg-surface`, never a hex literal. Verify the spec requirement
      directly: change one token's value, confirm every surface using it changes, and revert.

## 3. Design-system primitives

- [ ] 3.1 `Button` with variants (primary/secondary/ghost) and a disabled and loading state,
      built only from tokens. Tests: renders its label, fires `onClick`, does **not** fire when
      disabled, and exposes an accessible name when it carries only an icon.
- [ ] 3.2 `Input` with a label, error text and `aria-describedby` wiring, plus `Alert`,
      `Card` and `Spinner`. Tests for each: the label is associated with the control (query it
      by label, not by test id), and the error text is announced rather than merely coloured.
- [ ] 3.3 Verification for this group: run the suite, and confirm every primitive is reachable
      and operable by keyboard with a visible focus indicator — the `web-shell` spec requires
      this of the components themselves, not of a later audit.

## 4. App shell and the three states

- [ ] 4.1 `Loading`, `Empty` and `ErrorState` as shared components (design Decision 4).
      `ErrorState` takes a retry callback rather than owning the retry. Tests: each renders its
      message, and `ErrorState` invokes the callback when retry is activated.
- [ ] 4.2 Root layout with header and footer, plus `react-router` in its data-router
      configuration with the route tree in `src/routes/` (design Decision 5). Verify navigation
      changes content without a full page reload.
- [ ] 4.3 A not-found route and a route-level error boundary. Tests: an unknown URL renders the
      not-found page with a link back; a component that throws during render produces the error
      state rather than a blank page **and does not unmount the shell** — that second assertion
      is the one the spec actually requires, and the easy one to omit.

## 5. The generated API client

- [ ] 5.1 Add `graphql-codegen` reading `../ksp-backend/schema.gql` — the committed file, never
      a URL (`api-client-generation` spec). Emit to `src/api/generated/`, gitignore that
      directory, and add the `generate:api` script. Verify it produces typed output for
      `apiStatus` from a clean state.
- [ ] 5.2 Make a missing schema fail loudly (spec requirement, design Decision 2): the generate
      script checks the path first and exits naming the path it wanted and how to obtain it.
      **Verify by temporarily renaming the backend's `schema.gql`** and confirming the message
      is actionable rather than a downstream "cannot find module" — then restore it.
- [ ] 5.3 Write the `fetch` wrapper (design Decision 1). It MUST treat a non-empty `errors`
      array as a failure and throw, because GraphQL answers 200 for execution failures and
      `response.ok` is therefore not success. Unit-test exactly that: a 200 response carrying
      `errors` must reject, a 200 carrying only `data` must resolve, and a response carrying
      both must reject rather than silently returning partial data. Without these three, every
      component treats a failed query as a successful one with `undefined` data.
- [ ] 5.4 Add the TanStack Query provider and the query-key factory (design Decision 6). Test
      that the factory produces stable, distinct keys — two calls with the same arguments must
      be equal, and different arguments must not collide.

## 6. The vertical slice

- [ ] 6.1 A status view that runs the generated `apiStatus` query through the wrapper and
      TanStack Query, rendering the `Loading`, `ErrorState` and success paths. Tests with the
      transport mocked: all three states render, and the error path appears for a 200 response
      carrying `errors` — the case a status-code check would miss.
- [ ] 6.2 Verification for this group, end to end and by hand: start the backend
      (`docker compose up -d` and `npm run start:dev` in `ksp-backend`), run this repo's dev
      server, and confirm the status view renders `ok`. Then stop the backend and confirm the
      error state appears with a working retry. Both halves matter — the second is the one that
      is never checked.
- [ ] 6.3 Confirm every scenario in `specs/web-shell/spec.md` and
      `specs/api-client-generation/spec.md` maps to a passing test or a recorded manual check,
      the same audit the backend's change ran. Note any gap explicitly instead of assuming
      coverage.

## 7. Documentation

- [ ] 7.1 Write `LEARNING/01-tanstack-query.md` at the depth of `00-tailwind.md`: why server
      state is not component state, `queryKey` as cache identity, `staleTime` versus `gcTime`,
      the `isPending`/`isError`/`data` triad, and why the `errors`-array check belongs in the
      transport rather than in each component. Note that `LEARNING/` is gitignored, so record
      here that it was written.
- [ ] 7.2 Fix the documentation inaccuracies this change exposes (listed in `proposal.md`):
      `CLAUDE.md` describes `api/` as holding an "axios instance & interceptors" — a REST
      leftover in a GraphQL-only project; it points at `../.claude/rules/frontend.md` when those
      rules live in this repo; it calls `schema.gql` "the backend spec"; and it states the
      HTTP-200 error rule without the parse/validation exception the backend verified. Update
      `README.md`'s getting-started steps to match what actually works, including that
      `generate:api` must run before the first build.
