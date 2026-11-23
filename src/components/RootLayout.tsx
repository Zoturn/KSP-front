import type { ReactElement } from 'react';

import { Link, NavLink, Outlet } from 'react-router';

import { cn } from '@/lib/cn';
import { colorTransition, focusRing } from '@/lib/interactive';

import { paths } from '@/routes/paths';

// `end` makes "/" count as the current page only on exactly "/", not on every
// URL that starts with it.
const navItems = [
  { to: paths.home, label: 'Home', end: true },
  { to: paths.status, label: 'API status', end: false },
] as const;

/**
 * The frame every route renders inside: header, page content, footer.
 *
 * It is a *layout route*: react-router renders the matched child page where
 * `<Outlet />` sits, and this component stays mounted while the child changes.
 * That is what lets navigation replace the page without rebuilding the chrome.
 */
export function RootLayout(): ReactElement {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link
            to={paths.home}
            className={cn(
              'rounded-md text-lg font-semibold text-content',
              focusRing,
            )}
          >
            KSP
          </Link>
          <nav aria-label="Main">
            <ul className="flex items-center gap-2">
              {navItems.map(({ to, label, end }) => (
                <li key={to}>
                  {/* NavLink adds `aria-current="page"` to the link for the
                      current route, so the active state is announced as well
                      as shown. */}
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        'rounded-md px-3 py-2 text-sm font-medium',
                        colorTransition,
                        focusRing,
                        isActive
                          ? 'bg-primary-subtle text-primary-emphasis'
                          : 'text-content hover:bg-surface-sunken',
                      )
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-surface px-4 py-6 text-sm text-content-muted">
        <div className="mx-auto max-w-5xl">KSP</div>
      </footer>
    </div>
  );
}
