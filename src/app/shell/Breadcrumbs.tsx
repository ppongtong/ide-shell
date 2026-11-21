// ─────────────────────────────────────────────────────────────
// Breadcrumbs from the matched routes' staticData:
//   crumb       → a plain label ("Workspaces")
//   Breadcrumbs → a component the route provides (the workspace feature
//                 renders its switcher + item path). The shell never
//                 imports a feature.
// ─────────────────────────────────────────────────────────────
import { Fragment, Suspense } from 'react';
import { Link, useMatches } from '@tanstack/react-router';
import { useRegistry } from '@/lib/plugin-system';
import { CrumbSep, CrumbText } from '@/components/ui/Breadcrumb';

export function Breadcrumbs() {
  const registry = useRegistry();
  const matches = useMatches().filter((m) => m.staticData?.crumb || m.staticData?.Breadcrumbs);

  return (
    <nav className="crumbs" aria-label="Breadcrumbs">
      {matches.map((m, i) => {
        const { crumb, Breadcrumbs: RouteBreadcrumbs } = m.staticData;
        const last = i === matches.length - 1;
        const label = crumb?.(m, registry) ?? '';
        return (
          <Fragment key={m.id}>
            {i > 0 && <CrumbSep />}
            {RouteBreadcrumbs ? (
              // A feature's Breadcrumbs read its route's data: only render them once it loaded.
              m.status === 'success' ? (
                <Suspense fallback={<CrumbText>…</CrumbText>}>
                  <RouteBreadcrumbs match={m} />
                </Suspense>
              ) : (
                <CrumbText>{m.status === 'error' ? 'Not found' : '…'}</CrumbText>
              )
            ) : last ? (
              <CrumbText>{label}</CrumbText>
            ) : (
              <Link className="crumb" to={m.pathname}>{label}</Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
