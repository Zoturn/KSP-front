import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Input } from './Input';

describe('Input', () => {
  it('associates its label with the control', () => {
    render(<Input label="Email" />);

    // Queried by label, not by test id: this is the association a screen
    // reader and a click on the label both rely on.
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
  });

  it('gives two inputs distinct label targets', () => {
    render(
      <>
        <Input label="First" />
        <Input label="Second" />
      </>,
    );

    expect(screen.getByLabelText('First')).not.toBe(
      screen.getByLabelText('Second'),
    );
  });

  it('describes the field with its error and marks it invalid', () => {
    render(<Input label="Email" error="Enter a valid email address" />);
    const field = screen.getByLabelText('Email');

    // The error is announced with the field, not merely coloured.
    expect(field).toHaveAccessibleDescription('Enter a valid email address');
    expect(field).toBeInvalid();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a valid email address',
    );
  });

  it('is valid and undescribed when there is no error or hint', () => {
    render(<Input label="Email" />);
    const field = screen.getByLabelText('Email');

    expect(field).toBeValid();
    expect(field).not.toHaveAccessibleDescription();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('describes the field with both a hint and an error when it has both', () => {
    render(
      <Input label="Password" hint="At least 8 characters" error="Too short" />,
    );

    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
      'At least 8 characters Too short',
    );
  });

  it('keeps a description the caller supplied alongside its own', () => {
    render(
      <>
        <p id="external">Shown elsewhere</p>
        <Input label="Email" aria-describedby="external" error="Required" />
      </>,
    );

    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
      'Shown elsewhere Required',
    );
  });

  it('passes typing through to onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input label="Email" onChange={onChange} />);

    await user.type(screen.getByLabelText('Email'), 'ab');

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(screen.getByLabelText('Email')).toHaveValue('ab');
  });

  it('moves focus to the control when its label is clicked', async () => {
    const user = userEvent.setup();
    render(<Input label="Email" />);

    await user.click(screen.getByText('Email'));

    expect(screen.getByLabelText('Email')).toHaveFocus();
  });
});
