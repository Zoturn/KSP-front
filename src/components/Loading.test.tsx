import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Loading } from './Loading';

describe('Loading', () => {
  it('tells assistive technology what is loading', () => {
    render(<Loading label="Loading products" />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading products');
  });

  it('shows the label to sighted visitors without announcing it twice', () => {
    render(<Loading label="Loading products" />);

    const copies = screen.getAllByText('Loading products');
    const exposedToAssistiveTech = copies.filter(
      (el) => !el.closest('[aria-hidden="true"]'),
    );

    // Two copies exist (the spinner's text and the visible one); exactly one is
    // in the accessibility tree.
    expect(copies).toHaveLength(2);
    expect(exposedToAssistiveTech).toHaveLength(1);
  });

  it('is not an error and not an empty result', () => {
    render(<Loading />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(/nothing to show/i)).not.toBeInTheDocument();
  });
});
