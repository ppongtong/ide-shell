// Explorer:
//   • Draft mode (/workspaces/new): setup prompt until required details are saved.
//   • Saved mode: Primary root node(s) pinned first with nested children,
//     followed by collapsible root groups for every non-container ItemType.
import { useSearch } from '@tanstack/react-router';
import { ChevronDown, ChevronRight, File } from 'lucide-react';
import { itemKey, useRegistry, type Item, type PanelProps } from '@/lib/plugin-system';
import { NONE, useWorkbench } from '../stores/workbench';
import { useTabs } from '../hooks/useTabs';

export default function ExplorerPanel({ workspace }: PanelProps) {
  if (!workspace) {
    return (
      <div className="explorer-draft">
        <p className="explorer-draft-title">Workspace not created yet</p>
        <p className="hint">
          Complete the required fields in the <strong>Details</strong> tab and click{' '}
          <strong>Create workspace</strong> to initialize the primary root node and Explorer items.
        </p>
      </div>
    );
  }
  return <SavedExplorer workspace={workspace} />;
}

function SavedExplorer({ workspace }: { workspace: NonNullable<PanelProps['workspace']> }) {
  const activeKey = useSearch({
    from: '/workspaces/$wsId',
    select: (s) => s.item,
  });
  const tabs = useTabs(workspace.id, activeKey);
  const collapsed = useWorkbench((s) => s.collapsed[workspace.id] ?? NONE);
  const toggleFolder = useWorkbench((s) => s.toggleFolder);
  const registry = useRegistry();
  const isContainer = (i: Item) => !!registry.itemType.get(i.type)?.isContainer;

  // Group items by parentId in O(N log N) for nested primary/folder children.
  const byParent = new Map<string | null, Item[]>();
  for (const item of workspace.items) {
    const bucket = byParent.get(item.parentId);
    if (bucket) bucket.push(item);
    else byParent.set(item.parentId, [item]);
  }
  for (const bucket of byParent.values()) {
    bucket.sort((a, b) => Number(isContainer(b)) - Number(isContainer(a)) || a.name.localeCompare(b.name));
  }

  // Primary root nodes pinned at the top + track all descendants so they aren't repeated below.
  const primaryRoots = (byParent.get(null) ?? NONE_ITEMS).filter((i) => i.type === 'primary');
  const primarySubtreeIds = new Set<string>();
  const collectSubtree = (id: string) => {
    primarySubtreeIds.add(id);
    for (const child of byParent.get(id) ?? NONE_ITEMS) collectSubtree(child.id);
  };
  for (const root of primaryRoots) collectSubtree(root.id);

  // Remaining leaf items grouped by their registered non-container ItemType.
  const leafTypes = [...registry.itemType.values()].filter((t) => !t.isContainer);
  const byItemType = new Map<string, Item[]>();
  for (const item of workspace.items) {
    if (primarySubtreeIds.has(item.id) || isContainer(item)) continue;
    const bucket = byItemType.get(item.type);
    if (bucket) bucket.push(item);
    else byItemType.set(item.type, [item]);
  }
  for (const bucket of byItemType.values()) {
    bucket.sort((a, b) => a.name.localeCompare(b.name));
  }

  const renderNode = (item: Item, depth: number, extraClass = '') => {
    const type = registry.itemType.get(item.type);
    const Icon = type?.icon ?? File;
    const isPrimary = item.type === 'primary';
    const open = !collapsed.includes(item.id);
    const active = isPrimary ? !activeKey : itemKey(item.type, item.id) === activeKey;
    const children = byParent.get(item.id) ?? NONE_ITEMS;

    return (
      <li key={item.id}>
        {isPrimary ? (
          <div
            className={`tree-row ${extraClass} ${active ? 'active' : ''}`}
            style={{ paddingLeft: 8 + depth * 14 }}
          >
            <button
              type="button"
              className="chev"
              aria-label={open ? `Collapse ${item.name}` : `Expand ${item.name}`}
              aria-expanded={open}
              onClick={() => toggleFolder(workspace.id, item.id)}
            >
              {open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="tree-main"
              aria-current={active ? 'true' : undefined}
              onClick={() => {
                tabs.showDetails();
                if (!open) toggleFolder(workspace.id, item.id);
              }}
              title="Workspace details"
            >
              <Icon size={14} />
              <span>{item.name}</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`tree-row ${extraClass} ${active ? 'active' : ''}`}
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
        )}
        {type?.isContainer && open && children.length > 0 && (
          <ul role="list">{children.map((c) => renderNode(c, depth + 1))}</ul>
        )}
      </li>
    );
  };

  return (
    <ul className="tree" role="list" aria-label="Explorer">
      {/* 1. Primary root node(s) pinned first */}
      {primaryRoots.map((root) => renderNode(root, 0, 'primary-root'))}

      {/* 2. Collapsible root section for each registered non-container ItemType */}
      {leafTypes.map((type) => {
        const groupId = `group:${type.type}`;
        const open = !collapsed.includes(groupId);
        const items = byItemType.get(type.type) ?? NONE_ITEMS;
        const Icon = type.icon;
        const heading = type.pluralLabel ?? `${type.label}s`;

        return (
          <li key={groupId}>
            <button
              type="button"
              className="tree-row type-group"
              style={{ paddingLeft: 8 }}
              aria-expanded={open}
              onClick={() => toggleFolder(workspace.id, groupId)}
            >
              <span className="chev" aria-hidden="true">
                {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <Icon size={14} />
              <span>{heading}</span>
              <span className="tree-count">{items.length}</span>
            </button>
            {open &&
              (items.length > 0 ? (
                <ul role="list">{items.map((item) => renderNode(item, 1))}</ul>
              ) : (
                <p className="tree-empty">No {heading.toLowerCase()} yet</p>
              ))}
          </li>
        );
      })}
    </ul>
  );
}

const NONE_ITEMS: readonly Item[] = Object.freeze([]);
