import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Alert } from './Alert';

describe('Alert', () => {
  it('renders its title and message', () => {
    render(
      <Alert title="Heads up" variant="warning">
        Stock is running low
      </Alert>,
    );

    expect(screen.getByText('Heads up')).toBeInTheDocument();
    expect(screen.getByText('Stock is running low')).toBeInTheDocument();
  });

  it.each(['danger', 'warning'] as const)(
    'announces a %s alert assertively',
    (variant) => {
      render(<Alert variant={variant}>Something needs attention</Alert>);

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Something needs attention',
      );
    },
  );

  it.each(['info', 'success'] as const)(
    'announces a %s alert politely, not as an interruption',
    (variant) => {
      render(<Alert variant={variant}>All good</Alert>);

      expect(screen.getByRole('status')).toHaveTextContent('All good');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    },
  );

  it('defaults to a polite informational alert', () => {
    render(<Alert>Just so you know</Alert>);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders no empty heading or body when given none', () => {
    render(<Alert variant="danger" />);

    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
  });
});
