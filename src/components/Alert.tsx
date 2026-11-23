import type { ReactElement, ReactNode } from 'react';

import { cn } from '@/lib/cn';

// Each variant is a fill (`-subtle`) plus text and border in the matching
// `-emphasis` colour. Full literal class names, for the same reason as Button.
const variants = {
  info: 'border-primary-emphasis bg-primary-subtle text-primary-emphasis',
  success: 'border-success-emphasis bg-success-subtle text-success-emphasis',
  warning: 'border-warning-emphasis bg-warning-subtle text-warning-emphasis',
  danger: 'border-danger-emphasis bg-danger-subtle text-danger-emphasis',
} as const;

// Problems interrupt a screen reader (`alert`); confirmations and notes wait
// their turn (`status`). Choosing by variant keeps a "saved" message from
// shouting over whatever is being read.
const roles = {
  info: 'status',
  success: 'status',
  warning: 'alert',
  danger: 'alert',
} as const;

export type AlertVariant = keyof typeof variants;

type AlertProps = {
  variant?: AlertVariant;
  /** A short heading. It also carries the meaning, so colour is never alone. */
  title?: string;
  children?: ReactNode;
  className?: string;
};

export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: AlertProps): ReactElement {
  return (
    <div
      role={roles[variant]}
      className={cn(
        'flex flex-col gap-1 rounded-lg border p-4 text-sm',
        variants[variant],
        className,
      )}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div>{children}</div>}
    </div>
  );
}
