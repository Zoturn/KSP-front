import type { ReactElement } from 'react';

/**
 * Placeholder so the shell has a second route to navigate to. Task 6.1 turns
 * this into the real view: the generated `apiStatus` query, rendered through
 * `Loading`, `ErrorState` and the success state.
 */
export function StatusPage(): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">API status</h1>
    </div>
  );
}
