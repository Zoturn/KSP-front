# Tasks

> Build order: tooling, then the token layer, then primitives, then the shell, then the contract
> pipeline, then the one slice that proves all of it together. Every task that adds a component
> writes its tests in the same task — see `testing.md`.
>
> `LEARNING/` is gitignored in this repo, so task 7.2 produces a file that will not appear in
> the diff. That is expected; the record of it lives here.
>
> The token layer is specified by `.claude/rules/tailwind.md`, not by this change. Group 2
> implements that rule; it does not get to design a second token set.

## 1. Tooling and scaffold

- [x] 1.1 Scaffold Vite + React + TypeScript into this repo (which already contains
      `CLAUDE.md`, `README.md`, `.claude/`, `LEARNING/`, `openspec/` — **do not overwrite
      them**; scaffold into a temp directory and merge in, the way the backend's task 1.1 did).
      Pin Node `>= 24.9` in `engines` and add `.nvmrc`, matching the backend's floor. Verify
      `npm run dev` serves a page and `npm run build` succeeds.
      **Done.** Installed: Vite 8.3, React 19.3, TypeScript 7.0, and the scaffold ships oxlint
      rather than ESLint (see 1.2). Build passes under `tsc -b`; dev verified by fetching the
      page and a transformed module, not by assuming.
- [x] 1.2 Add Prettier with `@trivago/prettier-plugin-sort-imports` configured to the import
      order `frontend.md` specifies, plus ESLint for TS + React. Verify by deliberately
      mis-ordering imports in one file, running the formatter, and confirming it reorders them —
      a formatter that is installed but not actually enforcing the convention is the failure
      mode here.
      **Done, with one deviation:** the linter is **oxlint** (the Vite 8 scaffold's default), not
      ESLint — `typescript-eslint` declares `typescript <6.1.0` and TypeScript 7.0 is what installs,
      so ESLint would need an unsupported peer override or a TypeScript downgrade. Verified both
      tools can fail: the import plugin reorders every group against a no-plugin control (the
      `@/` alias had to exist first, so it was added to `vite.config.ts` and `tsconfig.app.json`),
      and oxlint rejects a conditional `useState`. `npm audit` reports a moderate `minimatch` DoS
      via the sort-imports plugin; dev-only and fed no untrusted globs, so not force-downgraded.
- [x] 1.3 Add Vitest + React Testing Library with a jsdom environment and a single smoke test.
      `testing.md` also requires `@testing-library/user-event` for interactions, so install it
      here rather than when the first interactive component needs it; add
      `@testing-library/jest-dom` and register its matchers in the setup file. Add a
      `typecheck` script (`tsc --noEmit`) in the same task — Vitest does not type-check, and
      task 5.5 needs this script to exist. Verify `npm test` passes, confirm the test genuinely
      runs by making it fail once, and confirm `npm run typecheck` is clean.
      **Done.** Vitest 5.1, jsdom pinned to `^29` because jsdom 30+ requires Node 24.15 and the
      declared floor is 24.9. Verified: the smoke test fails when its assertion is broken, a
      second render does not see the first (cleanup is registered by hand, since globals are
      off), and `typecheck` rejects both a wrong prop and a jest-dom matcher typo.

## 2. The token layer

> **Read `.claude/rules/tailwind.md` before starting this group.** It is the token
> specification, not background reading: file name, both tiers, the exact semantic set and the
> ban on spacing tokens all come from there (design Decision 3). Do not design a token set.

- [x] 2.1 Install Tailwind v4 with the `@tailwindcss/vite` plugin. The stylesheet entry is the
      single import `@import "tailwindcss";` — not the three old `@tailwind` directives — and
      there is no `tailwind.config.js`. Confirm the installed major actually is v4 (a check
      against a known answer: `tailwind.md` already fixes the version) and that a utility class
      applies in the dev server.
      **Done.** Tailwind 4.3.5, `@tailwindcss/vite` accepts Vite 8. Two findings: v4 scans the
      whole project, markdown included, so the banned examples quoted in `.claude/rules/` were being
      generated into production CSS (10.7 kB against 4.8 kB with a control build) — fixed with
      `source('../')`; and that restriction hid `index.html`, which carries the body classes, so it
      is re-added with `@source`. The dev server serves a stale scan until restarted.
- [x] 2.2 Write `src/styles/theme.css` with both tiers as `tailwind.md` defines them:
      primitives under plain `@theme`, semantic roles under **`@theme inline`**, using its
      enumerated set — the four surfaces, `content` and its variants, `border` plus
      `border-strong`, the `primary-*` family, `success`/`warning`/`danger` each with `-subtle`
      and `-emphasis`, `focus`, and the themed shadows. **Define no spacing tokens**;
      `--spacing: 0.25rem` generates the scale. Verify the spec requirement directly: change
      one semantic binding, confirm every surface using it changes, and revert.
      **Done.** Contrast was computed, not eyeballed (every text pairing >= 4.5:1, `border-strong` and
      `focus` >= 3:1; white on the warning amber is 1.72:1, so the rule's ban is real). Verified in
      the browser pane: rebinding `--primary` in one line changed `bg-primary` and nothing else;
      reverting restored it.
- [x] 2.3 Prove `@theme inline` does what Decision 3 claims, because this is the one mistake in
      this group that produces no error message and is expensive to find later. Shipping a dark
      theme is a non-goal, so verify with a throwaway: temporarily add a
      `[data-theme="dark"]` block rebinding one semantic token to a different primitive, set
      the attribute on `<html>`, and confirm the element changes. Then move that token from
      `@theme inline` to plain `@theme` and confirm it **stops** responding — that second half
      is the one that proves `inline` is load-bearing rather than incidental. Restore both, and
      remove the throwaway block.
      **Done.** Nested under a dark-themed element, `bg-surface` went dark with the inline form of
      the theme block and stayed white with the plain form. The test element has to be nested: on
      `<html>` itself both forms work and the check proves nothing.

## 3. Design-system primitives

- [x] 3.1 `Button` with variants (primary/secondary/ghost) and a disabled and loading state,
      built from the **semantic** tier only — no primitive colour class reaches the markup.
      Variant classes are full literal strings in an `as const` map, never assembled from a
      prop, because Tailwind scans source as text and a built-up class name silently produces
      no CSS. Focus is `focus-visible` with an `outline`, per `tailwind.md`. Tests: renders its
      label, fires `onClick`, does **not** fire when disabled, and exposes an accessible name
      when it carries only an icon.
      **Done.** Nine tests. Mutation-checked: removing the loading guard fails the loading test,
      and removing the default `type` fails the form-submission test, each and only that one.
- [x] 3.2 `Input` with a label, error text and `aria-describedby` wiring, plus `Alert`,
      `Card` and `Spinner`. The input's border is `border-strong`, not `border` — the rule ties
      that to the 3:1 contrast requirement for controls. Tests for each: the label is
      associated with the control (query it by label, not by test id), and the error text is
      announced rather than merely coloured.
      **Done.** `Spinner`, `Input`, `Alert`, `Card` plus a `cn` helper (it joins literals; it
      never builds class names). Mutation-checked: dropping `aria-describedby` or `aria-invalid`
      fails the error tests, and making a danger alert polite fails the alert test. One wrong test
      of mine was fixed on the way: a live region is announced by its text, not by an accessible name.
- [x] 3.3 Verification for this group: run the suite, and confirm every primitive is reachable
      and operable by keyboard with a visible focus indicator — the `web-shell` spec requires
      this of the components themselves, not of a later audit.
      **Done.** Real Tab key in the browser pane: order is primary, secondary, ghost, icon-only,
      email, name; the disabled and loading buttons are skipped. Every focused element gets a 2px
      outline offset 2px in the `focus` token, visible in a screenshot. (Reading the colour
      straight after the keypress showed `currentcolor` because `transition-colors` includes
      `outline-color`; it settles to the token within 150ms.) Enter and Space activation is
      covered in jsdom, where real CSS is absent.

## 4. App shell and the three states

- [x] 4.1 `Loading`, `Empty` and `ErrorState` as shared components (design Decision 4).
      `ErrorState` takes a retry callback rather than owning the retry. Tests: each renders its
      message, and `ErrorState` invokes the callback when retry is activated.
      **Done.** One test file per component. Mutation-checked, which also exposed a test of mine
      that claimed the visible loading copy was hidden from assistive tech but would have passed
      without `aria-hidden`; it now filters the accessibility tree and fails if the attribute goes.
- [x] 4.2 Root layout with header and footer, plus `react-router` in its data-router
      configuration with the route tree in `src/routes/` (design Decision 5). Verify navigation
      changes content without a full page reload.
      **Done.** react-router installs as 8.5.2, not the 7.x assumed; the route keys used
      (`Component`, `ErrorBoundary`, `children`) were checked against its types. A `/status`
      placeholder page exists so the frame has a second route; 6.1 replaces it. Verified in the
      browser pane: after a real click a `window` marker survived, the `<header>` was the same DOM
      node, and there was still one navigation entry.
- [x] 4.3 A not-found route and a route-level error boundary. Tests: an unknown URL renders the
      not-found page with a link back; a component that throws during render produces the error
      state rather than a blank page **and does not unmount the shell** — that second assertion
      is the one the spec actually requires, and the easy one to omit.
      **Done.** The error boundary sits on a pathless route inside the layout, so a throwing page
      renders its error in the layout's outlet. Mutation-checked all four ways: moving the
      boundary to the layout fails the frame-survives test and nothing else; a dead retry button
      fails the recovery test; removing the catch-all fails both not-found tests; keying the frame
      on the URL fails the no-rebuild and focus tests. `buildRoutes(extraPages)` lets tests add a
      throwing page to the real tree rather than a copy. A deep link to an unknown URL was
      checked in the browser pane. The raw error stays in the console, not on the page.

## 5. The generated API client

- [ ] 5.1 Add `graphql-codegen` reading `../ksp-backend/schema.gql` — the committed file, never
      a URL (`api-client-generation` spec). Emit to `src/api/generated/`, gitignore that
      directory, and add the `generate:api` script. Wire `predev`, `prebuild` and `pretest` to
      run it (design Decision 2): the directory is gitignored, so nothing else keeps it in step
      with the schema, and reading one local file is too cheap to justify a manual step anyone
      can forget. Verify it produces typed output for `apiStatus` from a clean state, and that
      `npm run dev` regenerates without being asked.
- [ ] 5.2 Make a missing schema fail loudly (spec requirement, design Decision 2): the generate
      script **deletes `src/api/generated/` first, then** checks for the schema and exits
      naming the path it wanted and how to obtain it. The order is the point — checking first
      and exiting would leave yesterday's client in place, and the spec forbids falling back to
      a stale copy. **Verify by temporarily renaming the backend's `schema.gql`**: the message
      must be actionable rather than a downstream "cannot find module", and the generated
      directory must be gone rather than stale. Then restore it and regenerate.
- [ ] 5.3 Write the `fetch` wrapper (design Decision 1) and its typed `GraphQLRequestError`,
      which carries `errors`, `extensions.code` and `extensions.validationErrors` — the UI has
      to branch on that code and attach field messages, so a plain `Error` with a joined string
      is not sufficient. The error contract is **not** "throw whenever `errors` is non-empty":
      `frontend.md` requires a partially successful response to render what resolved. Unit-test
      each row of Decision 1's table, as six cases:
      a 200 with only `data` resolves; a 200 with `errors` and null `data` rejects; a 200 with
      **both** resolves and exposes the errors alongside the data (the case an over-eager
      wrapper silently discards); an HTTP 400 rejects, since a parse or validation failure is a
      malformed document rather than a UI state; a non-2xx rejects; and a rejected `fetch` or a
      non-JSON body (a 502 HTML page) rejects without throwing a `SyntaxError` from the parse.
- [ ] 5.4 Add the TanStack Query provider and the query-key factory (design Decision 6). Test
      that the factory produces stable, distinct keys — two calls with the same arguments must
      be equal, and different arguments must not collide. In the same task add the shared
      `renderWithProviders` helper `testing.md` requires: a **fresh** `QueryClient` per test
      (a shared one leaks cache between tests) built with `retry: false`, so failure tests do
      not sit through retries. Task 6.1 is the first test that needs it, and a helper invented
      there tends to be invented twice.
- [ ] 5.5 Prove drift actually breaks the build, which no current mechanism does
      (design Decision 2): Vitest does not type-check, so the commit gate is blind to it.
      Have the post-commit hook run `npm run typecheck` alongside the tests. Then verify
      end to end: point codegen at a scratch copy of `schema.gql` with `apiStatus` renamed,
      confirm `npm run typecheck` fails and names the operation and field, and restore. A
      spec requirement that nothing enforces is the one that quietly stops being true.

## 6. The vertical slice

- [ ] 6.1 A status view that runs the generated `apiStatus` query through the wrapper and
      TanStack Query, rendering the `Loading`, `ErrorState` and success paths, using
      `renderWithProviders` from 5.4. Mock **the wrapper**, not `fetch` — it is the API boundary
      this design has (design Decision 1). Tests: all three states render, and the error state
      appears for a 200 response whose `data` is null and whose `errors` is non-empty — the
      case a status-code check would miss entirely.
- [ ] 6.2 Verification for this group, end to end and by hand: start the backend
      (`docker compose up -d` and `npm run start:dev` in `ksp-backend`), run this repo's dev
      server, and confirm the status view renders `ok`. Confirm in the network panel that the
      request went to a relative `/graphql` through Vite's proxy (design Decision 7) — a direct
      call to `localhost:3000` would be blocked, because the backend sets no CORS headers, and
      then this task's two halves would be indistinguishable. Then stop the backend and confirm
      the error state appears with a working retry. Both halves matter, and the second only
      means something once the first has genuinely succeeded.
- [ ] 6.3 Confirm every scenario in `specs/web-shell/spec.md` and
      `specs/api-client-generation/spec.md` maps to a passing test or a recorded manual check,
      the same audit the backend's change ran. Note any gap explicitly instead of assuming
      coverage.

## 7. Documentation

- [ ] 7.1 Fix the documentation this change proves wrong. In `CLAUDE.md`: `api/` is described as
      holding an "axios instance & interceptors", a REST leftover in a GraphQL-only project; it
      points at `../.claude/rules/frontend.md` when those rules live in this repo; it calls
      `schema.gql` "the backend spec"; and it states the HTTP-200 error rule without the
      parse/validation 400 exception the backend verified. In `.claude/rules/frontend.md`:
      replace the `hover:bg-slate-100` and `dark:bg-slate-900` examples, which use primitive
      classes `tailwind.md` bans in markup and a `dark:` variant that does not match its
      `data-theme` approach; and drop "codegen produces a typed hook per operation", which
      describes a design Decision 1 rejected. In `.claude/rules/testing.md`: name the transport
      wrapper as the mocking seam, since "the generated GraphQL client" is not a thing this
      design produces. (**Those three rule corrections were applied when this change was
      amended**, ahead of the rest of this task — path-scoped rules load as soon as a matching
      file is edited, so leaving them until the end would have had group 3 building its first
      primitive from banned examples. Verify they are still accurate once the code exists.)
      Update `README.md`'s getting-started steps to match what actually works, including that
      `generate:api` runs automatically before `dev`, `build` and `test`.
- [ ] 7.2 Write `LEARNING/01-tanstack-query.md` at the depth of `00-tailwind.md`: why server
      state is not component state, `queryKey` as cache identity, `staleTime` versus `gcTime`,
      the `isPending`/`isError`/`data` triad, why the `errors`-array check belongs in the
      transport rather than in each component, and why that check is "`data` is null **and**
      `errors` is non-empty" rather than "`errors` is non-empty" — the distinction that keeps a
      partial response renderable. `LEARNING/` is gitignored, so record here that it was
      written; this task is last because `config.yaml`'s task rules require the LEARNING note
      to close the list.
