import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import './index.css';
import App from './App.jsx';
import { theme } from './theme';

// Keep the shared app (cart, catalog and dialogs) mounted as the URL changes.
const router = createBrowserRouter([{ path: '*', element: <App /> }]);
const queryClient = new QueryClient();

// The published HTML is visible while non-critical CSS and React load.
await Promise.all(
  [...document.querySelectorAll('link[data-app-css]')].map((link) =>
    link.sheet
      ? Promise.resolve()
      : new Promise((resolve) => {
          link.addEventListener('load', resolve, { once: true });
          link.addEventListener('error', resolve, { once: true });
          setTimeout(resolve, 3000);
        }),
  ),
);
document.querySelectorAll('[data-initial-meta]').forEach((node) => node.remove());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme} forceColorScheme="light">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
);
