import { createHashHistory, createRouter } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';

export const router = createRouter({
  routeTree,
  // The single-file demo build uses #/ URLs so it works from any host.
  history: import.meta.env.MODE === 'demo' ? createHashHistory() : undefined,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
