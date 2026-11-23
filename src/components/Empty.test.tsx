import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Empty } from './Empty';

describe('Empty', () => {
  it('says there is nothing to show', () => {
    render(<Empty />);

    expect(screen.getByText('Nothing to show')).toBeInTheDocument();
  });

  it('renders a custom title, description and action', () => {
    render(
      <Empty
        title="No products yet"
        description="Check back soon."
        action={<a href="/">Back to home</a>}
      />,
    );

    expect(screen.getByText('No products yet')).toBeInTheDocument();
    expect(screen.getByText('Check back soon.')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to home' }),
    ).toBeInTheDocument();
  });

  it('is not presented as an error', () => {
    render(<Empty />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
