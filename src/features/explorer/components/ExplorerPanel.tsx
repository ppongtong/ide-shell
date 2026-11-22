// ─────────────────────────────────────────────────────────────
// Explorer (`core.explorer`):
//   • Reads the active workspace & active tab from `@/features/workspace/contract`
//     (subscribing only to `workspace`, `isDraft`, `activeKey`, and `activeItem`).
//   • Auto-reveals `activeItem`'s parent containers on tab switches and deep links,
//     so workspace tab logic never needs to call Explorer.
//   • Publishes its own shared state & actions to `./contract` (`useExplorerContract`)
//     via `useLayoutEffect` as the reference plugin state-sharing example.
// ─────────────────────────────────────────────────────────────
import { useLayoutEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, File } from 'lucide-react';
import { EMPTY, itemKey, useRegistry, type Item, type WorkspaceInfo } from '@/lib/plugin-system';
import { useWorkspaceContract } from '@/features/workspace/contract';
import { useExplorerContract } from '../contract';
import { ancestorContainerIds, buildExplorerTree } from '../lib/tree';
import { useExplorerStore } from '../stores/explorer-store';

export default function ExplorerPanel() {
  const workspace = useWorkspaceContract((s) => s.current?.workspace ?? null);
  const isDraft = useWorkspaceContract((s) => s.current?.isDraft ?? false);

  if (!workspace) {
    return (
      <div className="explorer-draft">
        <p className="explorer-draft-title">{isDraft ? 'Workspace not created yet' : 'No workspace open'}</p>
        <p className="hint">
          {isDraft ? (
            <>
              Complete the required fields in the <strong>Details</strong> tab and click{' '}
              <strong>Create workspace</strong> to initialize the primary root node and Explorer items.
            </>
          ) : (
            'Open a workspace to browse its items.'
          )}
        </p>
      </div>
    );
  }

  return <SavedExplorer workspace={workspace} />;
}

function SavedExplorer({ workspace }: { workspace: WorkspaceInfo }) {
  const activeKey = useWorkspaceContract((s) => s.current?.activeKey);
  const activeItem = useWorkspaceContract((s) => s.current?.activeItem);
  const collapsed = useExplorerStore((s) => s.collapsed[workspace.id] ?? EMPTY);
  const toggleNode = useExplorerStore((s) => s.toggleNode);
  const revealItems = useExplorerStore((s) => s.revealItems);
  const collapseAllInStore = useExplorerStore((s) => s.collapseAll);
  const expandWorkspace = useExplorerStore((s) => s.expandWorkspace);

  const setSnapshot = useExplorerContract((s) => s.setSnapshot);
  const setActions = useExplorerContract((s) => s.setActions);
  const clear = useExplorerContract((s) => s.clear);

  const registry = useRegistry();
  const tree = buildExplorerTree(workspace.items, registry.itemType);

  const targetRef = useRef({ wsId: workspace.id, collapsibleIds: tree.collapsibleIds });
  useLayoutEffect(() => {
    targetRef.current = { wsId: workspace.id, collapsibleIds: tree.collapsibleIds };
  }, [workspace.id, tree.collapsibleIds]);

  // Auto-reveal ancestor folders/group whenever the active tab changes (including deep links & Agent opens).
  useLayoutEffect(() => {
    if (!activeItem) return;
    const toReveal = ancestorContainerIds(tree.byId, tree.primaryRoots, activeItem);
    revealItems(workspace.id, toReveal);
  }, [workspace.id, activeItem, tree.byId, tree.primaryRoots, revealItems]);

  useLayoutEffect(() => {
    setSnapshot({ workspaceId: workspace.id, collapsedIds: collapsed });
  }, [workspace.id, collapsed, setSnapshot]);

  useLayoutEffect(() => {
    setActions({
      revealItems,
      collapseAll() {
        const { wsId, collapsibleIds } = targetRef.current;
        collapseAllInStore(wsId, collapsibleIds);
        return true;
      },
      expandAll() {
        expandWorkspace(targetRef.current.wsId);
        return true;
      },
    });
    return () => {
      clear();
    };
  }, [revealItems, collapseAllInStore, expandWorkspace, setActions, clear]);

  const renderNode = (item: Item, depth: number, extraClass = '') => {
    const type = registry.itemType.get(item.type);
    const Icon = type?.icon ?? File;
    const isPinned = !!type?.pinnedRoot;
    const open = !collapsed.includes(item.id);
    const active = isPinned ? !activeKey : itemKey(item.type, item.id) === activeKey;
    const children = tree.byParent.get(item.id) ?? EMPTY;

    return (
      <li key={item.id}>
        {isPinned ? (
          <div
            className={`tree-row ${extraClass} ${active ? 'active' : ''}`}
            style={{ paddingLeft: 8 + depth * 14 }}
          >
            <button
              type="button"
              className="chev"
              aria-label={open ? `Collapse ${item.name}` : `Expand ${item.name}`}
              aria-expanded={open}
              onClick={() => toggleNode(workspace.id, item.id)}
            >
              {open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="tree-main"
              aria-current={active ? 'true' : undefined}
              onClick={() => {
                useWorkspaceContract.getState().actions?.showDetails();
                if (!open) toggleNode(workspace.id, item.id);
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
            onClick={() => {
              if (type?.isContainer) toggleNode(workspace.id, item.id);
              else useWorkspaceContract.getState().actions?.openItem(item.id);
            }}
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
      {tree.primaryRoots.map((root) => renderNode(root, 0, 'primary-root'))}

      {tree.leafTypes.map((type) => {
        const groupId = `group:${type.type}`;
        const open = !collapsed.includes(groupId);
        const items = tree.byItemType.get(type.type) ?? EMPTY;
        const Icon = type.icon;
        const heading = type.pluralLabel ?? `${type.label}s`;

        return (
          <li key={groupId}>
            <button
              type="button"
              className="tree-row type-group"
              style={{ paddingLeft: 8 }}
              aria-expanded={open}
              onClick={() => toggleNode(workspace.id, groupId)}
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
