import { useId } from 'react';
import type { ComponentProps, ReactElement } from 'react';

import { cn } from '@/lib/cn';

type InputProps = Omit<ComponentProps<'input'>, 'id'> & {
  /** Visible label. Required: an input with no label has no accessible name. */
  label: string;
  /** Validation message. Its presence puts the field into the invalid state. */
  error?: string;
  /** Help text shown under the field and read out with it. */
  hint?: string;
  id?: string;
};

export function Input({
  label,
  error,
  hint,
  id: idProp,
  className,
  'aria-describedby': describedByProp,
  ...rest
}: InputProps): ReactElement {
  // `useId` gives each instance a stable unique id, so two inputs on a page
  // never share a label target. A caller can still pass their own `id`.
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  // `aria-describedby` points at the elements whose text a screen reader should
  // read after the label when the field gains focus. Without it the error is
  // just red text beside the box, invisible to anyone who cannot see the red.
  const describedBy =
    [describedByProp, hint && hintId, error && errorId]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-content">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'rounded-md border bg-surface px-3 py-2 text-sm text-content',
          'placeholder:text-content-subtle',
          // Form controls use `border-strong`, never `border`: a control's edge
          // has to reach 3:1 contrast to be findable. The error colour pairs
          // with the message text, so colour is never the only signal.
          error ? 'border-danger' : 'border-border-strong',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...rest}
      />
      {hint && (
        <p id={hintId} className="text-sm text-content-muted">
          {hint}
        </p>
      )}
      {/* `role="alert"` makes a message that appears *after* the field has
          focus (a failed submit) get announced; `aria-describedby` above covers
          the case where the field is focused afterwards. */}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-danger-emphasis">
          {error}
        </p>
      )}
    </div>
  );
}
