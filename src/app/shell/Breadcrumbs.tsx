// ─────────────────────────────────────────────────────────────
// Breadcrumbs from the matched routes' staticData:
//   crumb       → a plain label ("Workspaces")
//   Breadcrumbs → a component the route provides (the workspace feature
//                 renders its switcher + item path). The shell never
//                 imports a feature.
// ─────────────────────────────────────────────────────────────
import { Fragment, Suspense } from 'react';
import { Link, useRouter, useRouterState, type AnyRouteMatch } from '@tanstack/react-router';
import { useRegistry } from '@/lib/plugin-system';
import { CrumbSep, CrumbText } from '@/components/ui/Breadcrumb';

export function Breadcrumbs() {
  const registry = useRegistry();
  const router = useRouter();

  // Single structurally-shared subscription projecting only plain route identity/status fields,
  // so ?item= and ?panels= updates never re-render the shell breadcrumb bar.
  const slices = useRouterState({
    structuralSharing: true,
    select: (state) =>
      state.matches
        .filter((m) => m.staticData?.crumb || m.staticData?.Breadcrumbs)
        .map((m) => ({
          id: m.id,
          routeId: m.routeId,
          pathname: m.pathname,
          status: m.status as AnyRouteMatch['status'],
          params: m.params as Readonly<Record<string, string>>,
        })),
  });

  return (
    <nav className="crumbs" aria-label="Breadcrumbs">
      {slices.map((s, i) => {
        const staticData = router.routesById[s.routeId]?.options.staticData;
        if (!staticData) return null;
        const { crumb, Breadcrumbs: RouteBreadcrumbs } = staticData;
        const last = i === slices.length - 1;
        const label = crumb?.(s.params, registry) ?? '';
        return (
          <Fragment key={s.id}>
            {i > 0 && <CrumbSep />}
            {RouteBreadcrumbs ? (
              s.status === 'success' ? (
                <Suspense fallback={<CrumbText>…</CrumbText>}>
                  <RouteBreadcrumbs />
                </Suspense>
              ) : (
                <CrumbText>{s.status === 'error' ? 'Not found' : '…'}</CrumbText>
              )
            ) : last ? (
              <CrumbText>{label}</CrumbText>
            ) : (
              <Link className="crumb" to={s.pathname}>
                {label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
