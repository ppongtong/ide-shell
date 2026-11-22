// ─────────────────────────────────────────────────────────────
// Breadcrumbs for /workspaces/$wsId, plugged in via the route's
// staticData.Breadcrumbs:   Acme ▾ › Storefront Core › checkout.ts
// Reads workspace summaries from the parent /workspaces route loader.
// ─────────────────────────────────────────────────────────────
import { Fragment, type ReactNode } from 'react';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { parseItem, type Item } from '@/lib/plugin-system';
import { CrumbButton, CrumbSep, CrumbText } from '@/components/ui/Breadcrumb';
import { pathTo, type Workspace, type WorkspaceSummary } from '../api/workspaces';
import { useWorkbench } from '../stores/workbench';

const workspacesRoute = getRouteApi('/workspaces');
const detailRoute = getRouteApi('/workspaces/$wsId');

// Explicit types: this component is referenced from the route's own definition,
// so inferring them from that route would be circular.
export function WorkspaceBreadcrumbs(): ReactNode {
  const workspace: Workspace = detailRoute.useLoaderData();
  const list: WorkspaceSummary[] = workspacesRoute.useLoaderData();
  const item: string | undefined = detailRoute.useSearch({ select: (s: { item?: string }) => s.item });
  const expandAll = useWorkbench((s) => s.expandAll);
  const navigate = useNavigate();

  const ref = parseItem(item);
  const chain: Item[] = ref ? pathTo(workspace.items, ref.id) : [];

  return (
    <>
      <select
        className="crumb switcher"
        value={workspace.id}
        aria-label="Switch workspace"
        onChange={(e) => {
          const wsId = e.target.value;
          const nextItem = useWorkbench.getState().lastActive[wsId];
          void navigate({
            to: '/workspaces/$wsId',
            params: { wsId },
            // ?panels= is retained automatically by retainSearchParams(['panels'])
            search: (prev) => ({ ...prev, item: nextItem }),
          });
        }}
      >
        {list.map((w) => (
          <option key={w.id} value={w.id}>{w.name}</option>
        ))}
      </select>
      {chain.length === 0 ? (
        <>
          <CrumbSep />
          <CrumbText>Details</CrumbText>
        </>
      ) : (
        chain.map((it, i) => (
          <Fragment key={it.id}>
            <CrumbSep />
            {i === chain.length - 1 ? (
              <CrumbText>{it.name}</CrumbText>
            ) : (
              // A folder/primary crumb reveals it in the Explorer.
              <CrumbButton onClick={() => expandAll(workspace.id, chain.slice(0, i + 1).map((x) => x.id))}>
                {it.name}
              </CrumbButton>
            )}
          </Fragment>
        ))
      )}
    </>
  );
}
