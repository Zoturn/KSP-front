import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderRoutes } from '@/test/renderRoutes';

import { buildRoutes } from './routes';

// Replaces the real layout with one that throws while rendering, which is the
// only way to reach the route tree's outermost error boundary. It lives in its
// own file because `vi.mock` applies to every test in the file it appears in.
vi.mock('@/components/RootLayout', () => ({
  RootLayout: (): never => {
    throw new Error('layout exploded');
  },
}));

describe('root error boundary', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('explains the failure when the layout itself throws, instead of a blank page', () => {
    renderRoutes(buildRoutes());

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

  it('does not show the raw error to the visitor', () => {
    renderRoutes(buildRoutes());

    expect(screen.queryByText(/layout exploded/)).not.toBeInTheDocument();
  });
});
