import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App';

describe('App', () => {
  it('serves the home page inside the shared frame at the root URL', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome to KSP' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
