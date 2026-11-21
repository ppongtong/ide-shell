import { createRootRouteWithContext } from '@tanstack/react-router';
import type { RouterContext } from '@/lib/plugin-system';
import { Shell } from '@/app/shell/Shell';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Shell,
  notFoundComponent: () => <div className="empty">Page not found.</div>,
});
