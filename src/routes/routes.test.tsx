import { act } from 'react';
import type { ReactElement } from 'react';

import type { RouteObject } from 'react-router';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderRoutes } from '@/test/renderRoutes';

import { buildRoutes } from './routes';

describe('not-found route', () => {
  it('answers an unknown URL with a page that says so', () => {
    renderRoutes(buildRoutes(), '/no/such/page');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/does not exist/i)).toBeInTheDocument();
  });

  it('offers a way back to a page that exists', async () => {
    const user = userEvent.setup();
    renderRoutes(buildRoutes(), '/no/such/page');

    await user.click(screen.getByRole('link', { name: 'Back to home' }));

    expect(
      await screen.findByRole('heading', { name: 'Welcome to KSP' }),
    ).toBeInTheDocument();
  });

  it('still renders inside the shared frame', () => {
    renderRoutes(buildRoutes(), '/no/such/page');

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});

describe('route error boundary', () => {
  // `Boom` throws while rendering until `shouldThrow` is switched off, which is
  // how the retry test models "the second attempt works".
  let shouldThrow = true;
  let renderAttempts = 0;
  function Boom(): ReactElement {
    renderAttempts += 1;
    if (shouldThrow) throw new Error('kaboom: internal detail');
    return <h1>Recovered page</h1>;
  }

  const routes = (): RouteObject[] =>
    buildRoutes([{ path: 'boom', Component: Boom }]);
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    shouldThrow = true;
    renderAttempts = 0;
    // React and react-router both log a caught render error; keep the output
    // readable, and keep the spy to assert the error is not swallowed.
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('shows an explanation instead of a blank page when a page throws', () => {
    renderRoutes(routes(), '/boom');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This page failed to load',
    );
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to home' }),
    ).toBeInTheDocument();
  });

  it('does not unmount the shared frame when a page throws', async () => {
    const { router } = renderRoutes(routes());
    const bannerBefore = screen.getByRole('banner');
    const footerBefore = screen.getByRole('contentinfo');

    await act(() => router.navigate('/boom'));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    // The same nodes that were on the page before the error, not look-alikes
    // rendered afresh: the header and footer were never torn down.
    expect(screen.getByRole('banner')).toBe(bannerBefore);
    expect(screen.getByRole('contentinfo')).toBe(footerBefore);
    expect(
      screen.getByRole('link', { name: 'API status' }),
    ).toBeInTheDocument();
  });

  it('keeps the cause out of the page but in the console', () => {
    renderRoutes(routes(), '/boom');

    expect(screen.queryByText(/kaboom/)).not.toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalledWith(
      'Route render failed',
      expect.objectContaining({ message: 'kaboom: internal detail' }),
    );
  });

  it('recovers when the visitor retries and the page now works', async () => {
    const user = userEvent.setup();
    renderRoutes(routes(), '/boom');

    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByRole('heading', { name: 'Recovered page' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('retries the same URL, query string included', async () => {
    const user = userEvent.setup();
    const { router } = renderRoutes(routes(), '/boom?sort=price#reviews');

    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByRole('heading', { name: 'Recovered page' });

    expect(router.state.location.pathname).toBe('/boom');
    expect(router.state.location.search).toBe('?sort=price');
    expect(router.state.location.hash).toBe('#reviews');
  });

  it('keeps showing the error if the retry fails again', async () => {
    const user = userEvent.setup();
    renderRoutes(routes(), '/boom');
    // React may try a failing render more than once on its own, so compare
    // against the count before the click rather than a fixed number.
    const attemptsBeforeRetry = renderAttempts;

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // The page was genuinely asked to render again, and failed again.
    expect(renderAttempts).toBeGreaterThan(attemptsBeforeRetry);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This page failed to load',
    );
  });

  it('lets the visitor leave a failed page for a working one', async () => {
    const user = userEvent.setup();
    renderRoutes(routes(), '/boom');

    await user.click(screen.getByRole('link', { name: 'Back to home' }));

    expect(
      await screen.findByRole('heading', { name: 'Welcome to KSP' }),
    ).toBeInTheDocument();
  });
});
