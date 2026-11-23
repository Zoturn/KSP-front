// Registers the jest-dom matchers (`toBeInTheDocument`, `toHaveAccessibleName`,
// ...) on Vitest's `expect`, and their TypeScript types along with them.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only unmounts rendered trees after each test by itself when
// `afterEach` is a global. We import from 'vitest' explicitly instead of
// enabling globals, so the cleanup is wired up here by hand.
afterEach(cleanup);
