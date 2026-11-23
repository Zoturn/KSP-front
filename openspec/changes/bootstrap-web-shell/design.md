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

A `fetch` wrapper is also the clearer choice to read: `POST /graphql` with a JSON body
`{ query, variables }` is the entire protocol, and seeing that once is worth more than reading
a client's abstractions over it.

**One consequence to name, because a rule currently assumes otherwise:** `testing.md` says to
mock at the API boundary rather than at `fetch`, naming "the generated GraphQL client" as the
seam. With typed documents instead of generated hooks there is no generated client function to
stand in front of — **the wrapper is that boundary**, and it is what tests mock. That is the
same principle, not an exception to it, but the rule's wording describes the Apollo-shaped
design this decision rejects, so it gets corrected rather than worked around.

**What the wrapper owns, because nothing else should:** reading the `errors` array. GraphQL
returns HTTP 200 for execution failures, so `response.ok` is not success. Get this wrong and
every component silently treats a failed query as a successful one with `undefined` data — the
single most likely mistake in this repo.

But "throw whenever `errors` is non-empty" is the wrong correction, and `frontend.md` says why:
`data` and `errors` legitimately coexist, so a partially successful response is normal — render
what resolved and surface what did not, rather than treating any error as total failure. A
nullable field whose resolver failed arrives as `null` beside an error entry while the rest of
the response is still worth rendering. The rule the wrapper implements:

| Response                                        | Wrapper                                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| `data` present, `errors` absent or empty        | resolves with `data`                                                                  |
| `data` null or absent, `errors` non-empty       | throws                                                                                |
| `data` present **and** `errors` non-empty       | resolves with both — partial success                                                  |
| HTTP 400                                        | throws — a parse or schema-validation failure is a malformed document, not a UI state |
| other non-2xx, network rejection, non-JSON body | throws                                                                                |

What it throws is a typed `GraphQLRequestError` carrying `errors`, the first entry's
`extensions.code` and its `extensions.validationErrors`. `frontend.md` requires the UI to
branch on that code and to attach validation messages to individual form fields; a plain
`Error` holding a joined message string throws away exactly the information that makes those
two things possible.

### Decision 2: Generated output is gitignored, and its absence must be loud

`src/api/generated/` is build output: gitignored, produced by `npm run generate:api`.

**Why not commit it:** it is derived, it would churn in every diff, and a committed copy can
silently disagree with `schema.gql`. (This repo's own post-commit hook already skips the path
when deciding whether a commit needs a review pass — but that is a review-scope decision, not
an argument about what belongs in version control, so it is not evidence either way.)

**The cost, stated plainly:** a fresh clone cannot build until the generator has run, and the
generator needs the sibling backend checkout. That is why `api-client-generation/spec.md`
requires a loud, actionable failure — the generate script checks for
`../ksp-backend/schema.gql` first and exits with the path it wanted and how to get it. A
missing schema must never degrade into "cannot find module `./generated`", which sends the
reader to the wrong file entirely.

**Gitignoring it is what creates the drift hole, so this decision also owns closing it.**
Nothing regenerates a gitignored directory on its own: after a backend schema change, `dev`,
`build` and `test` all keep running happily against yesterday's types, and the spec's promise
that drift breaks the build quietly becomes false. Three things close it, and they belong here
rather than being left to habit:

- `predev`, `prebuild` and `pretest` run `generate:api`. Reading one local file is cheap enough
  that there is no reason to make it a step anyone can forget.
- The generate script **removes `src/api/generated/` before it checks for the schema**, so a
  missing schema cannot leave a stale client standing. The spec forbids falling back to a stale
  copy; deleting first is what makes that true instead of aspirational.
- A `typecheck` script (`tsc --noEmit`), run by the post-commit hook alongside the tests.
  Vitest does not type-check, so without this the commit gate cannot see drift at all.

**Alternative considered:** publishing the schema as a package, or fetching it from the
backend's git remote. Both remove the sibling-checkout coupling and both add publishing
machinery to a two-repo project. Revisit if CI ever builds this repo alone.

### Decision 3: The token layer is `tailwind.md`, not a new design

There is no decision left to make here, and that is the decision: **`.claude/rules/tailwind.md`
is the token specification**, and this change implements it rather than inventing a parallel
one. An earlier draft of this document treated the Tailwind major version as unknown and
sketched its own `surface / text / border / accent` set plus a spacing scale, which would have
produced a second token system contradicting the rule on four separate points. Implementation
follows the rule:

- **Tailwind v4, CSS-first.** No `tailwind.config.js`. Entry is `@import "tailwindcss";`, the
  Vite plugin is `@tailwindcss/vite`. The install task confirms v4 actually resolved — a check
  against a known answer, not an open question.
- **The file is `src/styles/theme.css`**, not `tokens.css`.
- **Two tiers.** Primitives (`--color-slate-900`) via plain `@theme`, live in `theme.css` only;
  semantic roles (`--color-surface`) via **`@theme inline`**, and markup uses only this tier.
  `inline` is load-bearing, not cosmetic: without it `bg-surface` resolves once at `:root` and
  dark mode silently fails — so it goes in now, not when a second theme arrives.
- **The semantic set is the one `tailwind.md` enumerates** — the four surfaces (`canvas`
  through `surface-sunken`), `content` with its muted, subtle and inverted variants, `border`
  plus `border-strong` for every form control, the `primary-*` family, the three state colours
  each with a `-subtle` and an `-emphasis`, `focus`, and the themed shadows.
- **No spacing tokens.** `--spacing: 0.25rem` generates the whole scale; defining more is
  explicitly forbidden there.

**Why in CSS rather than a TS object:** the values are needed by Tailwind at build time and by
the cascade at runtime; CSS custom properties are the one representation both can read without
a bridge. A theme is then exactly a different set of semantic-to-primitive bindings.

**What this change does owe the rule:** `frontend.md`'s Tailwind section still illustrates
variants with `hover:bg-slate-100` and `dark:bg-slate-900` — primitive classes that
`tailwind.md` bans in markup, using a `dark:` variant that does not match its `data-theme`
attribute approach. Left alone, the first primitive gets built from the examples rather than
from the rule. Fixing those lines is part of this change's documentation task.

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
React material assumes. Matching the documentation and answers a maintainer will actually find
is worth more here than the extra type safety — and the route surface is tiny.

The error boundary is attached at the route level so a failed route renders the shell's error
state rather than replacing the whole page, which is what `web-shell/spec.md` requires when it
says a failure in one part must not take the application down.

### Decision 6: Query keys are a typed factory, not inline arrays

Query keys come from one small factory module rather than being written inline at call sites.

**Why now, with one query:** inline keys are how caches silently stop invalidating. Two call
sites spell the same key slightly differently, each gets its own cache entry, and a mutation
invalidates one of them. Establishing the factory while there is a single key costs nothing;
retrofitting it across a feature set is a refactor nobody chooses to do.

### Decision 7: Vite proxies `/graphql`, so the browser makes a same-origin request

The wrapper posts to a **relative** `/graphql`, and Vite's `server.proxy` forwards it to the
backend on `localhost:3000`. An optional `VITE_GRAPHQL_URL` overrides the target for any
environment that is not this two-terminal local setup, documented in a committed
`.env.example` (`.gitignore` already admits that one file).

**Why this is settled here rather than left open:** the backend never calls `enableCors` —
verified, not assumed; there is no CORS configuration anywhere in `ksp-backend/src/`. So a
page served from Vite's port that fetches `http://localhost:3000/graphql` directly is blocked
by the browser before the backend sees it. That is not a detail to discover during task 6.2;
it would make task 6.2 **unfalsifiable**, since the view would render its error state with the
backend running and with it stopped, and the check that was supposed to prove the pipeline
works would prove nothing either way.

The alternative is adding `enableCors` to the backend. Rejected for now: it is a change to the
other repo, in the middle of that repo's own in-flight change, to fix a problem that exists
only in local development. A proxy keeps it on this side of the contract. When the frontend is
deployed somewhere the proxy does not exist, CORS on the backend becomes the right answer, and
`VITE_GRAPHQL_URL` is the seam that makes that switch a configuration change.

## Concepts this introduces (explanation requirement)

First appearances in this repo, each to be explained where it is introduced:

- **Tailwind**: utility-first styling, the two token tiers and why only the semantic one may
  appear in markup, what `@theme inline` actually changes about where a variable resolves, and
  why `@apply` is mostly a trap.
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
- **A second token system emerging beside `tailwind.md`** → the failure this plan already made
  once on paper. Decision 3 removes the room for it: the rule is the spec, and the install task
  confirms v4 rather than asking which major it is.
- **One vertical slice on `apiStatus` is thin** → True, and deliberate: it is the only field the
  contract offers. Its value is proving the pipeline, not the feature.
- **Generated output being gitignored hides it from review** → Accepted; it is derived. The
  operations that matter — the queries we write — are reviewable.

## Migration Plan

Not applicable: new repository, no existing users, no data. Rollback is `git revert`.

## Open Questions

- **Whether `Empty` and `ErrorState` eventually need per-feature variants.** One generic version
  each is right for a shell; the catalog phase will show whether that holds.
- **How a partial response is surfaced in the UI.** Decision 1 settles that the transport
  returns `data` and `errors` together; what a view does with "most of this rendered, one field
  did not" is a real design question, and the shell has no view with enough fields to answer it.
  The catalog phase, where a product can have a failed relation beside good data, is where it
  gets decided.
