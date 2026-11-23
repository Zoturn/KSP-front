import { createMemoryRouter } from 'react-router';
import type { RouteObject } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { render } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';

type RenderedRoutes = RenderResult & {
  router: ReturnType<typeof createMemoryRouter>;
};

/**
 * Renders a route tree at `path`, in memory: no address bar, no page reload.
 * Pass the real `buildRoutes()` so the test exercises the same tree production
 * does.
 */
export function renderRoutes(
  routes: RouteObject[],
  path = '/',
): RenderedRoutes {
  const router = createMemoryRouter(routes, { initialEntries: [path] });

  return { router, ...render(<RouterProvider router={router} />) };
}
