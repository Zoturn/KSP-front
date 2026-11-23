import type { ComponentProps, ReactElement } from 'react';

import { cn } from '@/lib/cn';

/**
 * A raised container. It owns only the *surface* (background, border, radius,
 * padding, shadow); layout inside it is the caller's business.
 *
 * `rounded-xl` is the radius reserved for cards, `shadow-raised` is the themed
 * shadow token, and `bg-surface-raised` is the surface a card sits on.
 */
export function Card({
  className,
  children,
  ...rest
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface-raised p-6 shadow-raised',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
