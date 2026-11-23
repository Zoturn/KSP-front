import type { ReactElement } from 'react';

import { Spinner } from './Spinner';

type LoadingProps = {
  /** What is loading, e.g. "Loading products". */
  label?: string;
};

/**
 * "The data has not arrived yet." One of the three states a view must tell
 * apart (see `Empty` and `ErrorState`); never render it as a blank area.
 */
export function Loading({ label = 'Loading' }: LoadingProps): ReactElement {
  return (
    <div className="flex items-center justify-center gap-2 p-8">
      {/* The spinner announces `label` to screen readers. The visible copy is
          hidden from them so the same words are not read out twice. */}
      <Spinner label={label} />
      <span aria-hidden="true" className="text-sm text-content-muted">
        {label}
      </span>
    </div>
  );
}
