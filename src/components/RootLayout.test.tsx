import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { buildRoutes } from '@/routes/routes';

import { renderRoutes } from '@/test/renderRoutes';

describe('RootLayout', () => {
  it('renders the page content inside the shared frame', () => {
    renderRoutes(buildRoutes());

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('heading', { level: 1, name: 'Welcome to KSP' }),
    );
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('identifies the site and links back to the home page', () => {
    renderRoutes(buildRoutes(), '/status');

    const siteName = screen.getByRole('link', { name: 'KSP' });

    expect(screen.getByRole('banner')).toContainElement(siteName);
    expect(siteName).toHaveAttribute('href', '/');
  });

  it('offers navigation to the routes that exist', () => {
    renderRoutes(buildRoutes());
    const nav = screen.getByRole('navigation', { name: 'Main' });

    expect(nav).toContainElement(screen.getByRole('link', { name: 'Home' }));
    expect(nav).toContainElement(
      screen.getByRole('link', { name: 'API status' }),
    );
  });

  it('marks the link for the current page, and only that one', () => {
    renderRoutes(buildRoutes(), '/status');

    expect(screen.getByRole('link', { name: 'API status' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('changes the page content on navigation without rebuilding the frame', async () => {
    const user = userEvent.setup();
    renderRoutes(buildRoutes());
    const bannerBefore = screen.getByRole('banner');
    const footerBefore = screen.getByRole('contentinfo');

    await user.click(screen.getByRole('link', { name: 'API status' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'API status' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Welcome to KSP' }),
    ).not.toBeInTheDocument();
    // The same DOM nodes, not look-alikes: the frame was never unmounted.
    expect(screen.getByRole('banner')).toBe(bannerBefore);
    expect(screen.getByRole('contentinfo')).toBe(footerBefore);
  });

  it('keeps keyboard focus on the link that was activated', async () => {
    const user = userEvent.setup();
    renderRoutes(buildRoutes());

    await user.tab();
    await user.tab();
    await user.tab();
    const statusLink = screen.getByRole('link', { name: 'API status' });
    expect(statusLink).toHaveFocus();
    await user.keyboard('{Enter}');

    await screen.findByRole('heading', { name: 'API status' });
    expect(statusLink).toHaveFocus();
  });

  it('reaches every link by keyboard in reading order', async () => {
    const user = userEvent.setup();
    renderRoutes(buildRoutes());

    const order: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      await user.tab();
      order.push(document.activeElement?.textContent ?? '');
    }

    expect(order).toEqual(['KSP', 'Home', 'API status']);
  });
});
