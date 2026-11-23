import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card } from './Card';

describe('Card', () => {
  it('renders its children', () => {
    render(
      <Card>
        <h2>Product</h2>
      </Card>,
    );

    expect(
      screen.getByRole('heading', { name: 'Product' }),
    ).toBeInTheDocument();
  });

  it('passes through attributes such as a role and label', () => {
    render(
      <Card role="region" aria-label="Order summary">
        content
      </Card>,
    );

    expect(
      screen.getByRole('region', { name: 'Order summary' }),
    ).toBeInTheDocument();
  });

  it('applies a class the caller adds', () => {
    render(<Card className="mt-4">content</Card>);

    expect(screen.getByText('content')).toHaveClass('mt-4');
  });
});
