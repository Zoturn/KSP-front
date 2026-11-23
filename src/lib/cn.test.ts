import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('joins the fragments it is given with single spaces', () => {
    expect(cn('rounded-md', 'px-4')).toBe('rounded-md px-4');
  });

  it('drops false, null, undefined and empty fragments', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('keeps a conditional fragment when its condition holds', () => {
    const active = true;

    expect(cn('base', active && 'bg-primary')).toBe('base bg-primary');
  });

  it('returns an empty string when there is nothing to join', () => {
    expect(cn(false, null)).toBe('');
  });
});
