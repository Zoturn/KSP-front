import { createBrowserRouter } from 'react-router';

import { buildRoutes } from './routes';

/**
 * The browser router: it reads and writes the address bar. Tests use
 * `createMemoryRouter` with the same `buildRoutes()` tree instead.
 */
export function createAppRouter(): ReturnType<typeof createBrowserRouter> {
  return createBrowserRouter(buildRoutes());
}
