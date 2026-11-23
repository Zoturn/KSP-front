import type { ReactElement } from 'react';

import { Alert } from './Alert';
import { Button } from './Button';

type ErrorStateProps = {
  title?: string;
  message?: string;
  /**
   * Called when the visitor asks to try again. Required: an error with no way
   * forward is a dead end. The caller supplies it because only the caller knows
   * what "again" means (a query's `refetch`, a route reload, ...).
   */
  onRetry: () => void;
};

/**
 * "The data could not be fetched." Never present this as an empty result: the
 * visitor would conclude there is nothing there rather than that something
 * failed.
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps): ReactElement {
  return (
    <div className="flex flex-col items-start gap-4">
      <Alert variant="danger" title={title}>
        {message}
      </Alert>
      <Button variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
