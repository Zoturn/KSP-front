// Class strings every interactive element shares. They are plain constants, not
// functions that build names: Tailwind finds classes by scanning source text,
// and a literal string here is found exactly as one written inline would be.
// Keeping them in one place means a rule from `.claude/rules/tailwind.md` is
// applied by importing, not by remembering.

/**
 * The visible keyboard-focus indicator.
 *
 * `focus-visible` (not `focus`) shows the ring for keyboard users but not after
 * a mouse click, so nobody is tempted to delete it. `outline` (not `ring`)
 * follows the border radius and survives Windows forced-colours mode.
 */
export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

/**
 * Colour transitions, switched off for people who asked their OS for less
 * motion. `tailwind.md` requires the pair: a transition without its
 * `motion-reduce` partner is a bug.
 */
export const colorTransition =
  'transition-colors motion-reduce:transition-none';
