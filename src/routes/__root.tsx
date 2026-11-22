import { createRootRoute } from '@tanstack/react-router';
import { Shell } from '@/app/shell/Shell';

export const Route = createRootRoute({
  component: Shell,
  notFoundComponent: () => <div className="empty">Page not found.</div>,
});
