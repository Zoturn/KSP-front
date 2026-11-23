import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('announces "Loading" through a status region by default', () => {
    render(<Spinner />);

    // A live region is announced by its text content, not by an accessible name.
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
  });

  it('announces a custom label when one is given', () => {
    render(<Spinner label="Loading products" />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading products');
  });

  it('is hidden from assistive technology when decorative', () => {
    const { container } = render(<Spinner decorative />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
