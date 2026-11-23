import type { ReactElement } from 'react';

export function HomePage(): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Welcome to KSP</h1>
      <p className="text-content-muted">
        Products and categories will appear here once the catalog is connected.
      </p>
    </div>
  );
}
