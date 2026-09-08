---
paths:
  - "ksp-frontend/src/**/*.tsx"
  - "ksp-frontend/src/**/*.css"
  - "ksp-frontend/src/styles/**/*"
  - "ksp-frontend/index.html"
  - "ksp-frontend/vite.config.ts"
---

# Tailwind CSS + design tokens (ksp-frontend)

**Tailwind v4** — CSS-first. There is **no `tailwind.config.js`**; the design system lives in
`src/styles/theme.css` using `@theme`. Entry point is `@import "tailwindcss";` (never the old
`@tailwind base/components/utilities`). Vite plugin is `@tailwindcss/vite`.

Full explanation: `LEARNING/00-tailwind.md`.

## Two token tiers — and only one is allowed in markup

| Tier | Example | Where it may appear |
|---|---|---|
| **Primitive** (a fact) | `--color-brand-600`, `--color-slate-900` | `theme.css` only |
| **Semantic** (a role) | `--color-surface`, `--color-content-muted` | **markup — this tier only** |

```tsx
<div className="bg-surface text-content border-border" />   // ✅ themes correctly
<div className="bg-white text-slate-900 border-slate-200" /> // ❌ primitive; dead in dark mode
```

**Never redefine a primitive per theme.** `slate-50` is light grey in every theme. A theme is
*exactly* a different set of semantic→primitive bindings; nothing else moves. Only the
semantic tier is redefined for dark mode.

Exception: non-themed decorative colour where the colour *is* the content (a chart series, a
category swatch). Comment it.

## `@theme inline` is load-bearing
Semantic tokens are mapped with **`@theme inline`**, primitives with plain `@theme`.

`inline` makes `bg-surface` compile to `background-color: var(--surface)` — resolved **at the
element**, so it walks up to the nearest `[data-theme="dark"]`. Without `inline` the reference
resolves once at `:root` and **dark mode silently fails**.

## The semantic set
- Surfaces: `canvas`, `surface`, `surface-raised`, `surface-sunken`
- Content: `content`, `content-muted`, `content-subtle`, `content-inverted`
- Borders: `border` (decorative only), `border-strong` (**all form controls** — 3:1 required)
- Brand: `primary`, `primary-hover`, `primary-active`, `primary-content`, `primary-subtle`, `primary-emphasis`
- State: `success` / `warning` / `danger`, each with `-subtle` (tint bg) and `-emphasis` (fg)
- `focus`, plus `shadow-raised` / `shadow-overlay` (themed — a black shadow is invisible on dark)

## Theming
`data-theme="dark" | "light"` on `<html>`, absent = follow the OS. Attribute, not a `.dark`
class, because a user on a dark-OS machine must be able to force light — three states, not two.
A tiny **synchronous inline script in `<head>`** applies it before first paint (no flash).

## Spacing & scale
`--spacing: 0.25rem` generates the entire scale — do not define spacing tokens.
Stay on the rhythm **1, 2, 3, 4, 6, 8, 12, 16, 24**. Radii: `rounded-md` controls,
`rounded-lg` nested/images, `rounded-xl` cards, `rounded-full` pills. Weights: only
`normal` / `medium` / `semibold` / `bold`.

`z-index` is **not** a theme namespace — use `z-(--z-modal)` with the `--z-*` scale.
A raw `z-50` or `z-[9999]` is a bug.

## THE bug that will cost you an hour: never build class names dynamically
Tailwind scans source as **plain text**. A class string that is assembled at runtime never
appears in the file, so **no CSS is generated** — no error, no warning, valid TypeScript, and
the DOM attribute even looks right.

```tsx
<span className={`bg-${status}`} />                  // ❌ silently unstyled
<button className={`bg-${color}-600`} />             // ❌ silently unstyled

const styles = {                                      // ✅ full names, literal in source
  paid: 'bg-success-subtle text-success-emphasis',
  failed: 'bg-danger-subtle text-danger-emphasis',
} as const
<span className={styles[status]} />
```
`as const` + `keyof typeof` turns a missing variant into a **compile error**. Use this pattern
everywhere. For genuinely runtime values use the CSS-variable form:
`style={{ '--swatch': hex }}` + `bg-(--swatch)`.

## `@apply` is banned in application code
It reintroduces naming, unbounded stylesheets, and indirection — everything utilities removed.
If you want to reuse styles, **extract a React component**, not a CSS class.
Only legitimate use: styling third-party DOM you don't control.

## Utility vs component
Used once or twice → inline. **3+ times AND it's a nameable UI concept** (Button, Badge,
PriceTag) → extract a component. If you can't name the thing, don't extract it.

## Arbitrary values
`p-[13px]` / `bg-[#3b82f6]` bypass the system — they don't theme, don't rebrand, don't audit.
Acceptable only for: an external brand colour, a measured one-off with a comment, or a layout
value with no scale (`grid-cols-[24rem_2.5rem_minmax(0,1fr)]`). Never for a colour that has a
semantic token.

## Accessibility is encoded in the tokens
- `text-content-subtle` is the **contrast floor** — nothing lighter exists on purpose.
- **`bg-warning` never takes `content-inverted`** (white on amber ≈2.1:1 — fails). Warning
  fills carry `text-content`. The token that would let you make this mistake deliberately
  does not exist.
- Form controls use `border-border-strong`, never `border-border`.
- Focus: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`
  — `outline` not `ring` (follows radius, survives forced-colors), and **`focus-visible`
  not `focus`** so mouse users see no ring and nobody is tempted to delete it.
- **Never encode meaning in colour alone** — badges carry text, errors carry a message + `aria-invalid`.
- Every `transition-*` needs `motion-reduce:transition-none`.

## Mobile-first
Unprefixed = all sizes; `md:` = **768px and up**. Writing `md:grid-cols-2` to mean "2 columns
on mobile" is backwards and is the most common beginner error.
