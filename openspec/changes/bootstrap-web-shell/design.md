# Design

## Context

See `proposal.md` — Why. The repo is empty of code, so every decision below is a first
precedent rather than a change to something. The binding external fact is that the backend's
committed `schema.gql` currently has one field; see the proposal's "What the contract blocks".

Conventions already written and not reopened here: TanStack Query owns all server state,
Tailwind with tokens rather than ad-hoc values, no component library, generated API client,
Vitest + RTL, money as integer minor units formatted at the display edge. See this repo's
`.claude/rules/`.

## Goals / Non-Goals

**Goals (design level)**

- One cache, one source of API truth, and one place visual values are defined.
- Make the three unglamorous states (loading, empty, error) easy to do right and awkward to skip.
- Prove the cross-repo pipeline while the schema is one field wide.

**Non-goals (design level)** — beyond `proposal.md`'s list:

- No state-management library beyond TanStack Query plus React's own `useState`.
- No abstraction over Tailwind (no `cva`/`tv` layer yet) — one `cn` helper at most.
- No test-data factory framework. Tests build the objects they need.

## Decisions

### Decision 1: TanStack Query is the only cache — so no Apollo Client

The transport is a thin `fetch` wrapper plus `graphql-codegen`'s typed documents. Apollo Client
and urql are rejected.

**Why:** both ship their own normalised cache. Running one alongside TanStack Query means two
caches holding the same server data with independent invalidation — the bug class where a
mutation updates one and the UI reads the other. `frontend.md` already says all server state
goes through TanStack Query; adding Apollo would quietly make that false.

A `fetch` wrapper is also the honest teaching choice: `POST /graphql` with a JSON body
`{ query, variables }` is the entire protocol, and seeing that once is worth more than learning
a client's abstractions over it.

**What the wrapper owns, because nothing else should:** reading the `errors` array. GraphQL
returns HTTP 200 for execution failures, so `response.ok` is not success. The wrapper throws
when `errors` is present and non-empty, which is what turns a GraphQL failure into something
TanStack Query's `isError` can see. Get this wrong and every component silently treats a failed
query as a successful one with `undefined` data — the single most likely mistake in this repo.

### Decision 2: Generated output is gitignored, and its absence must be loud

`src/api/generated/` is build output: gitignored, produced by `npm run generate:api`.

**Why not commit it:** it is derived, it would churn in every diff, and a committed copy can
silently disagree with `schema.gql`. The backend's post-commit hook already excludes this path
as build output, so ignoring it is consistent with a decision that has already been made.

**The cost, stated plainly:** a fresh clone cannot build until the generator has run, and the
generator needs the sibling backend checkout. That is why `api-client-generation/spec.md`
requires a loud, actionable failure — the generate script checks for
`../ksp-backend/schema.gql` first and exits with the path it wanted and how to get it. A
missing schema must never degrade into "cannot find module `./generated`", which sends the
reader to the wrong file entirely.

**Alternative considered:** publishing the schema as a package, or fetching it from the
backend's git remote. Both remove the sibling-checkout coupling and both add publishing
machinery to a two-repo learning project. Revisit if CI ever builds this repo alone.

### Decision 3: Tokens live in CSS, consumed through Tailwind

Design tokens are defined once in a stylesheet and Tailwind is configured to expose them as
utilities, so `bg-surface` resolves to a token rather than a hex value appearing in markup.

**Why in CSS rather than a TS object:** the values are needed by Tailwind at build time and by
the cascade at runtime; CSS custom properties are the one representation both can read without
a bridge. It also makes a future theme a matter of redefining the same names under a selector.

**To verify at install time rather than assume:** Tailwind's configuration moved from
`tailwind.config.js` to a CSS-first `@theme` block in version 4. The implementation task must
check which major actually installs and follow that version's documented approach — this is
exactly the kind of "the tutorial is for the previous major" trap that has already cost this
project time twice on the backend (the Nest 12 CLI scaffold, and TypeORM's 1.0 release).

### Decision 4: The three states are components, not conventions

`Loading`, `Empty` and `ErrorState` are real shared components, and the one vertical slice uses
all three.

**Why:** `web-shell/spec.md` requires the three states be distinguishable, and a rule that says
"handle your error states" is unenforceable. Components make the right thing the shortest path:
a developer reaching for the error case finds something to render. It also gives the tests
something concrete to assert, rather than asserting an absence.

`ErrorState` takes a retry callback rather than owning the retry, because the thing that knows
how to retry is the query.

### Decision 5: Routing by `react-router`, with routes as data

`react-router` in its data-router configuration, with the route tree declared in one place
(`src/routes/`).

**Why it over TanStack Router:** TanStack Router's typed-route story is genuinely nicer and
pairs naturally with TanStack Query, but react-router is what the overwhelming majority of
React material assumes. For a repo whose stated purpose is learning, matching the documentation
the reader will find is worth more than the type safety — and the route surface here is tiny.

The error boundary is attached at the route level so a failed route renders the shell's error
state rather than replacing the whole page, which is what `web-shell/spec.md` requires when it
says a failure in one part must not take the application down.

### Decision 6: Query keys are a typed factory, not inline arrays

Query keys come from one small factory module rather than being written inline at call sites.

**Why now, with one query:** inline keys are how caches silently stop invalidating. Two call
sites spell the same key slightly differently, each gets its own cache entry, and a mutation
invalidates one of them. Establishing the factory while there is a single key costs nothing;
retrofitting it across a feature set is a refactor nobody chooses to do.

## Concepts this introduces (teaching requirement)

First appearances in this repo, each to be explained where it is introduced:

- **Tailwind**: utility-first styling, the token layer, and why `@apply` is mostly a trap.
- **TanStack Query**: `QueryClient` and provider, `queryKey` as cache identity, the
  `isPending`/`isError`/`data` triad, `staleTime` versus `gcTime`, and why server data never
  belongs in `useState`.
- **React**: error boundaries (and that they catch render errors, not async rejections — a
  distinction that surprises people), and why `key` matters for list identity.
- **graphql-codegen**: that the schema is the input and the typed documents are the output, and
  that `TypedDocumentNode` is what carries the result type into `useQuery`.

## Risks / Trade-offs

- **Sibling-checkout coupling** → Accepted (Decision 2), mitigated by a loud failure. The exit
  is publishing the schema, if CI ever needs this repo standalone.
- **A hand-rolled fetch wrapper is less capable than Apollo** (no normalised cache, no optimistic
  helpers) → Accepted: TanStack Query covers caching, and the catalog is read-only for now.
  Revisit when mutations arrive, as a deliberate decision rather than by drift.
- **Tailwind's major version may change the token approach** → Decision 3 requires checking the
  installed major instead of following remembered syntax.
- **One vertical slice on `apiStatus` is thin** → True, and deliberate: it is the only field the
  contract offers. Its value is proving the pipeline, not the feature.
- **Generated output being gitignored hides it from review** → Accepted; it is derived. The
  operations that matter — the queries we write — are reviewable.

## Migration Plan

Not applicable: new repository, no existing users, no data. Rollback is `git revert`.

## Open Questions

- **Where the dev server proxies the API.** The backend serves `POST /graphql` on
  `localhost:3000`; whether this repo calls it directly with CORS or proxies through Vite can be
  settled when the slice is wired, and changes nothing above.
- **Whether `Empty` and `ErrorState` eventually need per-feature variants.** One generic version
  each is right for a shell; the catalog phase will show whether that holds.
