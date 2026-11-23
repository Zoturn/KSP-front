import type { ReactElement } from 'react';

import { TextLink } from '@/components/TextLink';

import { paths } from './paths';

export function NotFoundPage(): ReactElement {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-content-muted">
        The page you were looking for does not exist.
      </p>
      <TextLink to={paths.home}>Back to home</TextLink>
    </div>
  );
}
