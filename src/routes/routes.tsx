import type { RouteObject } from 'react-router';

import { RootLayout } from '@/components/RootLayout';

import { HomePage } from './HomePage';
import { NotFoundPage } from './NotFoundPage';
import { RouteError } from './RouteError';
import { StatusPage } from './StatusPage';
import { paths } from './paths';

/**
 * The route tree, as data.
 *
 *   RootLayout                       header + <Outlet/> + footer, always mounted
 *   └─ (pathless, ErrorBoundary)     catches a page that throws while rendering
 *      ├─ /          HomePage
 *      ├─ /status    StatusPage
 *      └─ *          NotFoundPage     matches any URL nothing above did
 *
 * The error boundary sits on a pathless route *inside* the layout, not on the
 * layout itself. When a page throws, the boundary renders in the layout's
 * `<Outlet />`, so the header and footer survive. Put it on the layout and the
 * whole frame would be replaced by the error.
 *
 * `extraPages` lets a test add a page (one that throws, say) to the real tree
 * instead of testing a hand-copied lookalike that could drift from it.
 */
export function buildRoutes(extraPages: RouteObject[] = []): RouteObject[] {
  return [
    {
      path: paths.home,
      Component: RootLayout,
      // Only reached if the layout itself throws, which leaves no frame to keep.
      ErrorBoundary: RouteError,
      children: [
        {
          ErrorBoundary: RouteError,
          children: [
            { index: true, Component: HomePage },
            { path: 'status', Component: StatusPage },
            ...extraPages,
            { path: '*', Component: NotFoundPage },
          ],
        },
      ],
    },
  ];
}
