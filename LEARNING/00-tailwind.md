# 00 — Tailwind CSS and design tokens, from zero

> You have not used Tailwind or design tokens before. This note explains what problem each
> solves, how they combine into a themeable system, and the traps that cost people hours.
> Read §1–§4 before writing components; §5–§8 as you hit them.
>
> **Version matters here.** We use **Tailwind v4**, which is CSS-first. Most tutorials you'll
> find online are v3 and will tell you to edit `tailwind.config.js`. **We don't have one.**

---

## 1. The problem: styling without a system

Here's what markup looks like when every value is written by hand:

```tsx
<div className="bg-[#ffffff] border border-[#e2e8f0] rounded-[8px] p-[16px]">
  <h3 className="text-[#0f172a] text-[16px] font-semibold">{product.name}</h3>
  <p  className="text-[#64748b] text-[14px]">{product.category}</p>
  <span className="text-[#0f172a] text-[18px] font-bold">{price}</span>
</div>
```

Four failures, worst last:

1. **You can't search for intent.** `#0f172a` is used for the title *and* the price. Are those
   the same decision, or two decisions that coincidentally match? Nobody can tell. `grep` finds
   strings, not meaning.
2. **Change is O(n) and unsafe.** Marketing changes the brand blue → find-and-replace across 60
   files, and you miss the ones written `#3B82F6` and `rgb(59 130 246)`.
3. **Drift.** Six months in you have `#e2e8f0`, `#e2e8f1`, and `#e1e7ef` all meaning "border",
   because three people eyeballed three Figma frames.
4. **Dark mode is impossible.** There's no seam to cut. `#ffffff` is a *fact*, not a *role*.
   To theme this you'd touch all twelve values in every component.

---

## 2. Design tokens

**A design token is a named design decision.**

Not "this button is `#3b82f6`" but "this button is `--color-primary`, which happens to be
`#3b82f6` today."

> If you can't say what the name means in one sentence, it isn't a token — it's a variable.

Same markup, tokenised:

```tsx
<div className="bg-surface border border-border rounded-xl p-4">
  <h3 className="text-content text-base font-semibold">{product.name}</h3>
  <p  className="text-content-muted text-sm">{product.category}</p>
  <span className="text-content text-lg font-bold">{price}</span>
</div>
```

The markup now states **intent**. `text-content-muted` says "secondary information" — a design
decision you can review. `#64748b` says nothing.

### Two tiers, and only one goes in your markup

| Tier | What it is | Example | Allowed in markup? |
|---|---|---|---|
| **Primitive** | a *fact* about a colour | `--color-brand-600`, `--color-slate-900` | ❌ never |
| **Semantic** | the *role* it plays | `--color-surface`, `--color-danger` | ✅ only this |

There's a third tier in the industry (component-level, `--button-bg`). **We deliberately skip
it** — it pays off for multi-brand systems or public component libraries, and we have one brand
and one app. It's also strictly additive, so we can add it later; adding the *semantic* tier
later would be a rewrite.

### Why the semantic tier is the one that matters

Because **a theme is exactly a different set of semantic→primitive bindings.** Nothing else moves:

| Token | Light | Dark |
|---|---|---|
| `--color-brand-600` (primitive) | blue | blue — **unchanged** |
| `--color-slate-50` (primitive) | near-white | near-white — **unchanged** |
| `--surface` (semantic) | white | slate-900 — **remapped** |
| `--content` (semantic) | slate-900 | slate-50 — **remapped** |

Skip the semantic tier and there's no binding to change, so every theme difference becomes a
`dark:` class on every element — `bg-white dark:bg-slate-900`, roughly 400 times, each one a
chance to forget.

**Rule that follows: never redefine a primitive per theme.** If `--color-slate-50` meant
something different in dark mode, the name would be a lie and every downstream assumption breaks.

---

## 3. Utility-first: why it feels wrong, and why it isn't

You'll write this and recoil:

```html
<div class="flex items-center gap-3 rounded-xl bg-surface p-4 shadow-raised">
```

*"This is inline styles with extra steps. Separation of concerns is dead."* Everyone has this
objection. Here's why it doesn't hold:

**The separation was never real.** `.product-card` isn't reusable — it's a name meaning "the
styles for the product card". Change the markup, change the class. HTML and CSS were always
coupled 1:1; the class name was a pointer pretending otherwise. Utilities delete the pointer.

**Utility CSS is bounded; hand-written CSS is not.** A stylesheet grows with every feature
forever, because deleting CSS is scary — you can never prove nothing uses `.card-header-alt`.
Utility CSS has a ceiling: the set of utilities you used. Delete a component and its styling
vanishes with it. **Nothing is ever orphaned.**

**Naming is the real cost.** BEM exists because naming is hard, and `.product-card__body--compact`
is the tax. Utilities remove naming for the 90% of styling that's one-off.

**You get constraints for free.** A stylesheet lets you write `padding: 17px`. There is no
`p-17` class.

What survives from separation of concerns: **components**. Reuse lives in `<ProductCard />`,
not `.product-card`. Same encapsulation, one layer instead of two.

The feeling passes in about two days.

---

## 4. How it actually works (Tailwind v4)

### Setup is two packages

```bash
npm install tailwindcss @tailwindcss/vite
```

No PostCSS config, no autoprefixer, no `tailwind.config.js`, no `npx tailwindcss init`.

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({ plugins: [react(), tailwindcss()] })
```

### A CSS variable becomes utilities automatically

This is the core mechanic. Tailwind reads the **namespace prefix** of a variable name:

```css
@theme {
  --color-brand-600: oklch(0.546 0.215 262.9);
}
```

`--color-*` is the colour namespace, so you now have `bg-brand-600`, `text-brand-600`,
`border-brand-600`, `ring-brand-600`, `fill-brand-600`… plus opacity modifiers
(`bg-brand-600/50`) and every variant (`hover:`, `md:`, `dark:`). **One variable, dozens of
utilities, zero configuration.**

| Namespace | Generates |
|---|---|
| `--color-*` | `bg-*`, `text-*`, `border-*`, `ring-*`, … |
| `--font-*` | `font-sans`, `font-mono` |
| `--text-*` | `text-sm`, `text-lg` (size) |
| `--radius-*` | `rounded-*` |
| `--shadow-*` | `shadow-*` |
| `--spacing` | `p-*`, `m-*`, `gap-*`, `w-*`, … |

### Spacing: one number generates everything

```css
--spacing: 0.25rem;   /* 4px */
```

`p-4` → 16px, `gap-6` → 24px, `mt-1.5` → 6px. Every integer works, so there's nothing to
memorise and no scale to define. The discipline is a *usage* rule: stay on the rhythm
**1, 2, 3, 4, 6, 8, 12, 16, 24**.

### Why OKLCH?

Tailwind v4's default palette is OKLCH: `oklch(lightness chroma hue)`. It's **perceptually
uniform** — equal numeric steps look equally spaced to the eye, which an HSL ramp does not
achieve. It also reaches colours hex can't express on modern displays.

---

## 5. Dark mode, and the one line that makes it work

Our theming has three states, in override order:

1. **`prefers-color-scheme`** — the OS preference. Pure CSS, applies before first paint, free.
2. **`[data-theme="dark"|"light"]` on `<html>`** — an explicit user choice that beats the OS.
3. **Attribute absent** — follow the OS.

We use an **attribute, not a `.dark` class**, deliberately: a class can only say "dark or not",
so a user on a dark-OS machine could never force light. An attribute has three states.

A tiny **synchronous inline script in `<head>`** applies the stored choice before first paint —
if it were deferred you'd see a flash of the wrong theme.

### `@theme inline` — the subtlest thing in the whole system

Semantic tokens are mapped with **`@theme inline`**. Get this wrong and dark mode silently
does nothing.

**Without `inline`** the reference resolves once, at `:root`:
```css
:root { --color-surface: var(--surface); }   /* resolved HERE */
.bg-surface { background-color: var(--color-surface); }
```

**With `inline`** the reference is inlined into the utility itself:
```css
.bg-surface { background-color: var(--surface); }   /* resolved AT THE ELEMENT */
```

Now `var(--surface)` is evaluated on the element wearing the class, walking up the cascade to
the nearest definition — so any `[data-theme="dark"]` ancestor wins. It also gives **scoped
sub-theming** free: put `data-theme="dark"` on one `<section>` and only that section flips.

**Rule: primitives in plain `@theme`, semantic tokens in `@theme inline`.**

---

## 6. Fundamentals you'll use constantly

### Mobile-first responsive prefixes
Unprefixed = every size. Prefixed = **that breakpoint and up**.

```tsx
<div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
```
2 columns everywhere, 3 from 768px, 4 from 1280px.

**The classic beginner error** is writing `md:grid-cols-2` meaning "2 columns on mobile". It
means the opposite — `md:` is `min-width: 48rem`.

### State variants
```tsx
<button className="
  bg-primary text-primary-content
  hover:bg-primary-hover
  active:bg-primary-active
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus
  disabled:opacity-50 disabled:pointer-events-none
">
```
Useful detail: **v4 wraps `hover:` in `@media (hover: hover)`**, so hover styles no longer stick
on touch devices after a tap. Variants stack: `md:dark:hover:bg-primary-hover`.

### `@apply` is a trap
```css
.btn-primary { @apply rounded-md bg-primary px-4 py-2; }   /* don't */
```
It looks like the fix for long class lists. It isn't: you're back to naming things, back to an
unbounded stylesheet you can never safely delete from, back to opening a second file to
understand a button. It also generates that CSS whether or not the class is used.

**If you want reuse, extract a React component.** The only legitimate `@apply` is styling
third-party DOM you don't control.

---

## 7. The bug that will cost you an hour

**Tailwind scans your source as plain text.** From the docs: it *"doesn't attempt to actually
parse your files as code in any way."* It's a regex looking for things that could be class
names. There is no evaluation, no module graph, no type checking.

So this **silently renders an unstyled element**:

```tsx
// ❌ the strings "bg-success" / "bg-danger" never appear in the file
<span className={`bg-${status === 'paid' ? 'success' : 'danger'}`} />

// ❌ Tailwind sees "bg-" and "-600", never "bg-brand-600"
<button className={`bg-${color}-600`} />
```

**Why it's so nasty:** no error, no warning. TypeScript is happy — it's a valid string. The
build succeeds. The `class` attribute is even *correct* in the DOM. There's simply no CSS rule
with that name.

**The fix — always map to complete class names:**

```tsx
const statusStyles = {
  paid:      'bg-success-subtle text-success-emphasis',
  failed:    'bg-danger-subtle  text-danger-emphasis',
  pending:   'bg-warning-subtle text-warning-emphasis',
} as const

function StatusBadge({ status }: { status: keyof typeof statusStyles }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs ${statusStyles[status]}`}>{status}</span>
}
```

`as const` + `keyof typeof` turns a missing variant into a **compile error** — a silent runtime
bug becomes a build failure. Use this pattern everywhere.

For genuinely runtime values, use the CSS-variable form instead:
```tsx
<span style={{ '--swatch': category.colorHex } as React.CSSProperties}
      className="size-4 rounded-full bg-(--swatch)" />
```

**Debug checklist when a class "doesn't work":**
1. Does the exact full string appear literally in a source file?
2. Is the file in the scanned tree? (v4 auto-detects from the Git root and **honours
   `.gitignore`** — an ignored file is not scanned.)
3. Is it a real utility? `text-content-muted` exists only because we defined `--color-content-muted`.
4. Is another rule winning? Check devtools for a struck-through declaration.

---

## 8. Accessibility is built into the tokens

The point of encoding a11y at the token layer is that it becomes the **default**. If the only
available text colours pass contrast, violations require effort.

WCAG 2.2 AA: **4.5:1** normal text, **3:1** large text, **3:1** UI control boundaries and focus
indicators.

Rules that are baked in:

- **`text-content-subtle` is the floor.** Nothing lighter exists. There's deliberately no
  `content-faint` — if you want one, you want a contrast violation.
- **`bg-warning` never carries white text.** Amber-500 + white is ≈2.1:1 — it fails badly, and
  "Low stock!" in white on orange is the single most common e-commerce a11y bug. Warning fills
  take `text-content` (dark). **The token that would let you make the mistake doesn't exist.**
- **Form controls use `border-border-strong`**, not `border-border`. A `slate-200` hairline on
  white is ≈1.3:1 — fine as a decorative divider, illegal as an input border.
- **Never encode meaning in colour alone.** Badges carry text; validation errors carry a
  message and `aria-invalid`. ~8% of men have red/green colour deficiency, so
  "green = in stock / red = out" is invisible to them.

### Focus rings
```
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus
```
- **`outline`, not `ring`** — it follows border-radius, isn't clipped by `overflow-hidden`, and
  survives Windows High Contrast Mode (`ring` is a box-shadow and gets erased).
- **`outline-offset-2`** puts a gap between ring and element, so it contrasts against the page
  — without it a brand-blue ring on a brand-blue button is invisible.
- **`focus-visible`, never `focus`.** `:focus` fires on mouse clicks too; a designer calls that
  ugly, someone adds `focus:outline-none`, and **keyboard navigation becomes impossible**.
  That sequence is the origin of most real-world keyboard-accessibility failures.
  `:focus-visible` shows the ring only for keyboard users, so nobody asks you to remove it.

### Motion
Every `transition-*` gets `motion-reduce:transition-none`. Unrequested motion is genuinely
nauseating for people with vestibular disorders. One word per transition.

---

## 9. The payoff

A `ProductCard` styled entirely in semantic tokens:

```tsx
<article className="
  group flex flex-col overflow-hidden
  rounded-xl border border-border bg-surface shadow-raised
  transition-shadow duration-200 motion-reduce:transition-none
  hover:shadow-overlay
">
```

When `data-theme="dark"` lands on `<html>`, **not one character of this file changes.**

| Class | Light | Dark |
|---|---|---|
| `bg-surface` | white | slate-900 |
| `text-content` | slate-900 | slate-50 |
| `border-border` | slate-200 | slate-800 |
| `shadow-raised` | soft slate | deep black |
| `outline-focus` | brand-600 | brand-400 |

Zero `dark:` variants in a 90-line component. **That is the entire return on building the
semantic tier.**

---

## Recap

- A **token is a named decision**. Primitives are facts; **semantic tokens are roles**, and
  only semantic tokens go in markup.
- A **theme is just a remapping of semantic→primitive bindings.** Never redefine a primitive.
- **`@theme inline` for semantic tokens** — it resolves at the element, which is what makes
  dark mode work at all.
- Utilities feel wrong for two days, then stop. Reuse lives in **components**, not CSS classes.
- **Never build class names dynamically** — map to full literal strings with `as const`.
- **`@apply` is banned**; extract a component instead.
- A11y is in the tokens: contrast floor, no white-on-amber, `border-strong` for controls,
  `focus-visible` + `outline`, and `motion-reduce`.
