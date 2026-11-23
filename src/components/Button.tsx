import type { ComponentProps, ReactElement } from 'react';

import { cn } from '@/lib/cn';
import { colorTransition, focusRing } from '@/lib/interactive';

import { Spinner } from './Spinner';

// Every class below is written out in full. Tailwind finds classes by scanning
// the source as text, so a name assembled at runtime (`bg-${variant}`) would
// never be seen and silently produce no CSS. `as const` + `keyof typeof` also
// turns a mistyped variant into a compile error rather than an unstyled button.
//
// `enabled:hover:` means "on hover, but only if the button is not disabled", so
// a disabled button does not light up under the pointer.
const variants = {
  primary:
    'bg-primary text-primary-content enabled:hover:bg-primary-hover enabled:active:bg-primary-active',
  secondary:
    'border border-border-strong bg-surface text-content enabled:hover:bg-surface-sunken',
  ghost: 'text-content enabled:hover:bg-surface-sunken',
} as const;

export type ButtonVariant = keyof typeof variants;

type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant;
  /** Shows a spinner and blocks clicks while an action is in flight. */
  loading?: boolean;
};

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps): ReactElement {
  return (
    <button
      // A bare <button> inside a <form> submits it. Defaulting to "button"
      // makes submitting something you ask for, not something you get by accident.
      type={type}
      // A loading button is disabled so a second click cannot start a second
      // request; `aria-busy` tells assistive tech why.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium',
        colorTransition,
        focusRing,
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {loading && <Spinner decorative className="text-current" />}
      {children}
    </button>
  );
}
