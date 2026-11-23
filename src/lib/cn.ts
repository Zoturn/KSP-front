/**
 * Joins class-name fragments, dropping the falsy ones.
 *
 * This is deliberately NOT a class *builder*. Tailwind scans source files as
 * plain text, so every class name must appear in full somewhere in the source
 * (see `.claude/rules/tailwind.md`). `cn` only concatenates strings that are
 * already written out literally at the call site:
 *
 *   cn('rounded-md px-4', isActive && 'bg-primary')   // fine: both are literal
 *   cn(`bg-${colour}`)                                // never: no CSS is generated
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
