import type { ReactElement, ReactNode } from 'react';

type EmptyProps = {
  title?: string;
  description?: string;
  /** Something the visitor can do about it, e.g. a link to clear a filter. */
  action?: ReactNode;
};

/**
 * "The data arrived and there is none." Deliberately neutral: no alert role,
 * no danger colour. An empty result is a normal outcome, and presenting it as a
 * failure would send people looking for something that is not broken.
 */
export function Empty({
  title = 'Nothing to show',
  description,
  action,
}: EmptyProps): ReactElement {
  return (
    <div className="flex flex-col items-center gap-2 p-8 text-center">
      <p className="text-base font-semibold text-content">{title}</p>
      {description && (
        <p className="text-sm text-content-muted">{description}</p>
      )}
      {action}
    </div>
  );
}
