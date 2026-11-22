// The frame around every page: activity bar | breadcrumbs + page, plus the dialog host.
import { useEffect } from 'react';
import { Outlet, useRouter } from '@tanstack/react-router';
import { useRegistry } from '@/lib/plugin-system';
import { useShell } from '@/stores/shell-store';
import { ActivityBar } from './ActivityBar';
import { Breadcrumbs } from './Breadcrumbs';
import { DialogHost } from './DialogHost';

export function Shell() {
  useRememberLastLocation();
  return (
    <div className="shell">
      <ActivityBar />
      <div className="main">
        <Breadcrumbs />
        <main className="page">
          <Outlet />
        </main>
      </div>
      <DialogHost />
    </div>
  );
}

/**
 * Subscribes directly to router `onResolved` events so recording `lastHref`
 * never re-renders the root `<Shell>` component on URL/tab changes.
 */
function useRememberLastLocation() {
  const registry = useRegistry();
  const router = useRouter();
  const rememberHref = useShell((s) => s.rememberHref);

  useEffect(() => {
    const record = () => {
      const { pathname, href } = router.state.location;
      const active = registry.activeRouteActivity(pathname);
      if (active?.action.kind === 'route' && active.action.rememberLastLocation) {
        rememberHref(active.id, href);
      }
    };
    record();
    return router.subscribe('onResolved', record);
  }, [registry, router, rememberHref]);
}
