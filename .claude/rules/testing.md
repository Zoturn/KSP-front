---
paths:
  - "ksp-frontend/**/*.test.ts"
  - "**/*.test.ts"
  - "ksp-frontend/**/*.test.tsx"
  - "**/*.test.tsx"
---

# Testing & explanation (ksp-frontend)

**Every component ships with tests AND an explanation.** Nothing is "done" without both.

## Discipline: tests-alongside + explain
1. Build the component.
2. **Immediately** write its tests — never batch them for later.
3. Explain what was built and why; capture durable concepts in `LEARNING/NN-topic.md`.

## Tools & location
**Vitest + React Testing Library**, in a `*.test.tsx` file **beside** the component.

## What to test
- **Behavior through the DOM**, never implementation details. Query by accessible role, label,
  or visible text (`getByRole('button', { name: /add to cart/i })`) — not by CSS class or
  component internals. If a test breaks when you refactor markup but behavior is unchanged,
  the test was wrong.
- **All three states explicitly: loading, error, empty.** An untested error state is how
  broken error handling reaches users.
- User interactions via `@testing-library/user-event`, not synthetic `fireEvent` where
  avoidable.

## Mocking the API
- **Mock at the API boundary, not `fetch`.** The generated GraphQL client is the seam.
- Components using server state need a `QueryClientProvider` wrapper — use a shared
  `renderWithProviders` test helper rather than repeating setup.
- In tests, create the `QueryClient` with `retry: false` so failure tests don't wait for
  retries.
- Never assert against a live backend; the committed `schema.gql` guarantees the types, tests
  supply the data.

## Money
The API returns integer **cents**. Assert on the formatted output the user actually sees
(`$49.99`), and include at least one case proving no floating-point drift.

## Naming
`describe('ProductCard')` → `it('shows the price formatted from cents')`,
`it('disables the add-to-cart button while the mutation is pending')`.
Test names state **behavior**, never implementation.
