import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('says that something failed, with the reason when given', () => {
    render(
      <ErrorState message="The server did not respond" onRetry={vi.fn()} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The server did not respond',
    );
  });

  it('invokes the retry callback when "Try again" is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('invokes the retry callback from the keyboard', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    await user.tab();
    await user.keyboard('{Enter}');

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('is not presented as an empty result', () => {
    render(<ErrorState onRetry={vi.fn()} />);

    expect(screen.queryByText(/nothing to show/i)).not.toBeInTheDocument();
  });
});
