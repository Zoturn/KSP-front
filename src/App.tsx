import type { ReactElement } from 'react';

import { RouterProvider } from 'react-router/dom';

import { createAppRouter } from '@/routes/router';

// Created once, at module load: the router owns navigation state, so it must
// outlive any single render of `App`.
const router = createAppRouter();

function App(): ReactElement {
  return <RouterProvider router={router} />;
}

export default App;
