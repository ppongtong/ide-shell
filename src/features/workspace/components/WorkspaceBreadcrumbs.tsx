// ─────────────────────────────────────────────────────────────
// Breadcrumbs for /workspaces/$wsId, plugged in via the route's
// staticData.Breadcrumbs:   Acme ▾ › Storefront Core › checkout.ts
// ─────────────────────────────────────────────────────────────
import { Fragment, type ReactNode } from 'react';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { findPrimaryItem, parseItem, PRIMARY_TYPE, useRegistry, type Item } from '@/lib/plugin-system';
import { CrumbButton, CrumbSep, CrumbText } from '@/components/ui/Breadcrumb';
import { useExplorerContract } from '@/features/explorer/contract';
import { pathTo, type Workspace, type WorkspaceSummary } from '../api/workspaces';
import { useWorkbench } from '../stores/workbench';

const workspacesRoute = getRouteApi('/workspaces');
const detailRoute = getRouteApi('/workspaces/$wsId');

export function WorkspaceBreadcrumbs(): ReactNode {
  const workspace: Workspace = detailRoute.useLoaderData();
  const list: WorkspaceSummary[] = workspacesRoute.useLoaderData();
  const item: string | undefined = detailRoute.useSearch({ select: (s: { item?: string }) => s.item });
  const registry = useRegistry();
  const navigate = useNavigate();

  const primaryItem = findPrimaryItem(workspace);
  const primaryLabel = primaryItem?.name ?? registry.itemRenderer.get(PRIMARY_TYPE)?.label ?? 'Primary';

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
            search: (prev) => ({ ...prev, item: nextItem }),
          });
        }}
      >
        {list.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
      {chain.length === 0 ? (
        <>
          <CrumbSep />
          <CrumbText>{primaryLabel}</CrumbText>
        </>
      ) : (
        chain.map((it, i) => (
          <Fragment key={it.id}>
            <CrumbSep />
            {i === chain.length - 1 ? (
              <CrumbText>{it.name}</CrumbText>
            ) : (
              <CrumbButton
                onClick={() => {
                  useExplorerContract.getState().actions?.revealItem(it.id);
                }}
              >
                {it.name}
              </CrumbButton>
            )}
          </Fragment>
        ))
      )}
    </>
  );
}
