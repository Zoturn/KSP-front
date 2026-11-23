import type { ReactElement } from 'react';

import { cn } from '@/lib/cn';

type SpinnerProps = {
  /** What a screen reader announces. Ignored when `decorative` is set. */
  label?: string;
  /**
   * Set when the spinner sits inside something that already says it is busy
   * (a loading `Button`), so the same state is not announced twice.
   */
  decorative?: boolean;
  /** Overrides the colour; defaults to the brand colour. */
  className?: string;
};

export function Spinner({
  label = 'Loading',
  decorative = false,
  className,
}: SpinnerProps): ReactElement {
  // `animate-spin` is a one-line CSS rotation. `motion-reduce:animate-none`
  // switches it off for people who asked their OS for less motion; the
  // "Loading" text below still tells them what is happening.
  const icon = (
    <svg
      className={cn(
        'size-5 animate-spin motion-reduce:animate-none',
        className ?? 'text-primary',
      )}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );

  if (decorative) return icon;

  // `role="status"` is a polite live region: assistive tech announces its
  // text without stealing focus. `sr-only` hides the text visually but keeps
  // it in the accessibility tree.
  return (
    <span role="status" className="inline-flex items-center">
      {icon}
      <span className="sr-only">{label}</span>
    </span>
  );
}
