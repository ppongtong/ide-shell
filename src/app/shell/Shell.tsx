// The frame around every page: activity bar | breadcrumbs + page, plus the dialog host.
import { useEffect, useEffectEvent } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
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

/** For route activities with rememberLastLocation, store the last URL seen inside their area. */
function useRememberLastLocation() {
  const registry = useRegistry();
  const rememberHref = useShell((s) => s.rememberHref);
  const { pathname, href } = useRouterState({ select: (s) => s.location });

  // React 19.2 useEffectEvent: reads the latest registry without making it an effect dependency.
  const remember = useEffectEvent((path: string, url: string) => {
    const active = registry.activeRouteActivity(path);
    if (active?.action.kind === 'route' && active.action.rememberLastLocation) {
      rememberHref(active.id, url);
    }
  });

  useEffect(() => {
    remember(pathname, href);
  }, [pathname, href]);
}
