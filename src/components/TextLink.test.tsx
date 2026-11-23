import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { TextLink } from './TextLink';

function renderLink(): ReturnType<typeof createMemoryRouter> {
  const router = createMemoryRouter(
    [
      { path: '/', element: <TextLink to="/next">Go next</TextLink> },
      { path: '/next', element: <p>Arrived</p> },
    ],
    { initialEntries: ['/'] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe('TextLink', () => {
  it('is a link with the given text pointing at the given route', () => {
    renderLink();

    expect(screen.getByRole('link', { name: 'Go next' })).toHaveAttribute(
      'href',
      '/next',
    );
  });

  it('follows the route when activated, without a page reload', async () => {
    const user = userEvent.setup();
    const router = renderLink();

    await user.click(screen.getByRole('link', { name: 'Go next' }));

    expect(await screen.findByText('Arrived')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/next');
  });

  it('is reachable and activatable from the keyboard', async () => {
    const user = userEvent.setup();
    renderLink();

    await user.tab();
    expect(screen.getByRole('link', { name: 'Go next' })).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(await screen.findByText('Arrived')).toBeInTheDocument();
  });
});
