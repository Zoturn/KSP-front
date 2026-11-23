import { useEffect } from 'react';
import type { ReactElement } from 'react';

import { useLocation, useNavigate, useRouteError } from 'react-router';

import { ErrorState } from '@/components/ErrorState';
import { TextLink } from '@/components/TextLink';

import { paths } from './paths';

/**
 * What a visitor sees when a page throws while rendering.
 *
 * An error boundary catches errors thrown during *render*. It does not catch a
 * rejected promise or a failed request: those are handled where the data is
 * fetched, via the query's error state.
 */
export function RouteError(): ReactElement {
  const error = useRouteError();
  const navigate = useNavigate();
  const { pathname, search, hash } = useLocation();

  // Showing the visitor a friendly message must not mean losing the cause.
  useEffect(() => {
    console.error('Route render failed', error);
  }, [error]);

  return (
    <div className="flex flex-col gap-4">
      {/* The raw error message is for the console, not the visitor: it can
          carry internals and means nothing to them. */}
      <ErrorState
        title="This page failed to load"
        message="Something unexpected happened while showing this page."
        // Navigating to the page we are already on, with `replace`, makes the
        // router discard the error and render the route again.
        onRetry={() => {
          void navigate({ pathname, search, hash }, { replace: true });
        }}
      />
      <TextLink to={paths.home}>Back to home</TextLink>
    </div>
  );
}
