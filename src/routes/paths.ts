/**
 * Every URL the app answers, in one place. The route tree and the navigation
 * both read from here, so a path cannot be renamed in one and forgotten in the
 * other.
 */
export const paths = {
  home: '/',
  status: '/status',
} as const;
