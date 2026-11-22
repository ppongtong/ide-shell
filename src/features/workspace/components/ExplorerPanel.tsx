// Explorer: workspace items as a nested disclosure list. Icons and click
// behaviour come from registered item types.
import { getRouteApi } from '@tanstack/react-router';
import { ChevronDown, ChevronRight, File } from 'lucide-react';
import { useRegistry } from '@/lib/plugin-system';
import { getItemTypes, itemKey, type Item } from '@/contracts/workspace';
import { NONE, useWorkbench } from '../stores/workbench';
import { useTabs } from '../hooks/useTabs';

const route = getRouteApi('/workspaces/$wsId');

export default function ExplorerPanel() {
  const workspace = route.useLoaderData();
  const { item: activeKey } = route.useSearch();
  const tabs = useTabs(workspace.id, activeKey);
  const expanded = useWorkbench((s) => s.expanded[workspace.id] ?? NONE);
  const itemTypes = getItemTypes(useRegistry());
  const isFolder = (i: Item) => !!itemTypes.get(i.type)?.isContainer;

  // Group & sort once in O(N log N) instead of filtering all items per folder.
  const byParent = new Map<string | null, Item[]>();
  for (const item of workspace.items) {
    const bucket = byParent.get(item.parentId);
    if (bucket) bucket.push(item);
    else byParent.set(item.parentId, [item]);
  }
  for (const bucket of byParent.values()) {
    bucket.sort((a, b) => Number(isFolder(b)) - Number(isFolder(a)) || a.name.localeCompare(b.name));
  }

  const renderNode = (item: Item, depth: number) => {
    const type = itemTypes.get(item.type);
    const Icon = type?.icon ?? File;
    const open = expanded.includes(item.id);
    const active = itemKey(item.type, item.id) === activeKey;
    const children = byParent.get(item.id) ?? NONE_ITEMS;

    return (
      <li key={item.id}>
        <button
          type="button"
          className={`tree-row ${active ? 'active' : ''}`}
          style={{ paddingLeft: 8 + depth * 14 }}
          aria-expanded={type?.isContainer ? open : undefined}
          aria-current={active ? 'true' : undefined}
          onClick={() => tabs.openItem(item)}
          title={type ? type.label : `Unknown type "${item.type}"`}
        >
          <span className="chev" aria-hidden="true">
            {type?.isContainer && (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
          </span>
          <Icon size={14} />
          <span>{item.name}</span>
        </button>
        {type?.isContainer && open && children.length > 0 && (
          <ul role="list">{children.map((c) => renderNode(c, depth + 1))}</ul>
        )}
      </li>
    );
  };

  const roots = byParent.get(null) ?? NONE_ITEMS;
  if (!roots.length) return <div className="empty">This workspace is empty.</div>;
  return (
    <ul className="tree" role="list" aria-label="Explorer">
      {roots.map((i) => renderNode(i, 0))}
    </ul>
  );
}

const NONE_ITEMS: Item[] = [];
