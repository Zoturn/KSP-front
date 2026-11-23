import type { ComponentProps, ReactElement } from 'react';

import { Link } from 'react-router';

import { cn } from '@/lib/cn';

/**
 * An in-app link styled as text. It wraps react-router's `Link`, so following
 * it changes the route without reloading the page.
 */
export function TextLink({
  className,
  ...rest
}: ComponentProps<typeof Link>): ReactElement {
  return (
    <Link
      className={cn(
        'rounded-md font-medium text-primary-emphasis underline underline-offset-2',
        'transition-colors motion-reduce:transition-none hover:text-primary-active',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        className,
      )}
      {...rest}
    />
  );
}
