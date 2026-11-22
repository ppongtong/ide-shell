// ─────────────────────────────────────────────────────────────
// Explorer (`core.explorer`):
//   • Reads the active workspace & active tab from `@/features/workspace/contract`.
//   • Pins `type: 'primary'` at the top (showing a "Select primary key…" slot
//     when no primary item has been chosen yet, or the primary root + children once set).
//   • Groups remaining openable items by registered `ItemRenderer`.
// ─────────────────────────────────────────────────────────────
import { useLayoutEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, File, KeyRound } from 'lucide-react';
import { EMPTY, itemKey, useRegistry, type Item, type WorkspaceInfo } from '@/lib/plugin-system';
import { useWorkspaceContract } from '@/features/workspace/contract';
import { useExplorerContract } from '../contract';
import { ancestorContainerIds, buildExplorerTree, OTHER_GROUP_ID } from '../lib/tree';
import { useExplorerStore } from '../stores/explorer-store';

export default function ExplorerPanel() {
  const workspace = useWorkspaceContract((s) => s.current?.workspace ?? null);

  if (!workspace) {
    return (
      <div className="explorer-draft">
        <p className="explorer-draft-title">No workspace open</p>
        <p className="hint">Open a workspace to browse its items.</p>
      </div>
    );
  }

  return <WorkspaceExplorer workspace={workspace} />;
}

function WorkspaceExplorer({ workspace }: { workspace: WorkspaceInfo }) {
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
  const tree = buildExplorerTree(workspace.items, registry.itemRenderer);
  const PrimaryIcon = registry.itemRenderer.get('primary')?.icon ?? KeyRound;

  const targetRef = useRef({ wsId: workspace.id, collapsibleIds: tree.collapsibleIds });
  useLayoutEffect(() => {
    targetRef.current = { wsId: workspace.id, collapsibleIds: tree.collapsibleIds };
  }, [workspace.id, tree.collapsibleIds]);

  // Auto-reveal ancestor folders/group whenever the active tab changes.
  useLayoutEffect(() => {
    if (!activeItem) return;
    const toReveal = ancestorContainerIds(tree.byId, tree.primaryRoots, registry.itemRenderer, activeItem);
    revealItems(workspace.id, toReveal);
  }, [workspace.id, activeItem, tree.byId, tree.primaryRoots, registry.itemRenderer, revealItems]);

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
  }, [revealItems, collapseAllInStore, expandWorkspace, setActions]);

  useLayoutEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);

  const renderNode = (item: Item, depth: number, extraClass = '') => {
    const renderer = registry.itemRenderer.get(item.type);
    const Icon = renderer?.icon ?? File;
    const isPrimary = item.type === 'primary';
    const children = tree.byParent.get(item.id) ?? EMPTY;
    const hasChildren = children.length > 0;
    const isFolderOnly = !!renderer && !renderer.component;
    const canExpand = hasChildren || isFolderOnly;
    const open = !collapsed.includes(item.id);
    const active = isPrimary ? !activeKey : itemKey(item.type, item.id) === activeKey;

    return (
      <li key={item.id}>
        {isPrimary ? (
          <div
            className={`tree-row ${extraClass} ${active ? 'active' : ''}`}
            style={{ paddingLeft: 8 + depth * 14 }}
          >
            {hasChildren ? (
              <button
                type="button"
                className="chev"
                aria-label={open ? `Collapse ${item.name}` : `Expand ${item.name}`}
                aria-expanded={open}
                onClick={() => toggleNode(workspace.id, item.id)}
              >
                {open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
              </button>
            ) : (
              <span className="chev" aria-hidden="true" />
            )}
            <button
              type="button"
              className="tree-main"
              aria-current={active ? 'true' : undefined}
              onClick={() => {
                useWorkspaceContract.getState().actions?.showPrimary();
                if (hasChildren && !open) toggleNode(workspace.id, item.id);
              }}
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
            aria-expanded={canExpand ? open : undefined}
            aria-current={active ? 'true' : undefined}
            onClick={() => {
              if (isFolderOnly) toggleNode(workspace.id, item.id);
              else useWorkspaceContract.getState().actions?.openItem(item.id);
            }}
            title={renderer ? renderer.label : `Unknown type "${item.type}"`}
          >
            <span className="chev" aria-hidden="true">
              {canExpand && (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
            </span>
            <Icon size={14} />
            <span>{item.name}</span>
          </button>
        )}
        {canExpand && open && hasChildren && (
          <ul role="list">{children.map((c) => renderNode(c, depth + 1))}</ul>
        )}
      </li>
    );
  };

  return (
    <ul className="tree" role="list" aria-label="Explorer">
      {/* 1. Pinned Primary slot at top (unselected prompt vs. configured primary root + children) */}
      {tree.primaryRoots.length > 0 ? (
        tree.primaryRoots.map((root) => renderNode(root, 0, 'primary-root'))
      ) : (
        <li>
          <button
            type="button"
            className={`tree-row primary-root unset ${!activeKey ? 'active' : ''}`}
            style={{ paddingLeft: 8 }}
            aria-current={!activeKey ? 'true' : undefined}
            onClick={() => {
              useWorkspaceContract.getState().actions?.showPrimary();
            }}
          >
            <span className="chev" aria-hidden="true" />
            <PrimaryIcon size={14} />
            <span>Select primary key…</span>
          </button>
        </li>
      )}

      {/* 2. Collapsible section for every registered openable ItemRenderer */}
      {tree.groupRenderers.map((renderer) => {
        const groupId = `group:${renderer.type}`;
        const open = !collapsed.includes(groupId);
        const items = tree.byRendererType.get(renderer.type) ?? EMPTY;
        const Icon = renderer.icon;
        const heading = renderer.pluralLabel ?? `${renderer.label}s`;

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

      {/* 3. Fallback group for items whose plugin is not loaded */}
      {tree.unknownItems.length > 0 && (
        <li key={OTHER_GROUP_ID}>
          <button
            type="button"
            className="tree-row type-group"
            style={{ paddingLeft: 8 }}
            aria-expanded={!collapsed.includes(OTHER_GROUP_ID)}
            onClick={() => toggleNode(workspace.id, OTHER_GROUP_ID)}
          >
            <span className="chev" aria-hidden="true">
              {!collapsed.includes(OTHER_GROUP_ID) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <File size={14} />
            <span>Other</span>
            <span className="tree-count">{tree.unknownItems.length}</span>
          </button>
          {!collapsed.includes(OTHER_GROUP_ID) && (
            <ul role="list">{tree.unknownItems.map((item) => renderNode(item, 1))}</ul>
          )}
        </li>
      )}
    </ul>
  );
}
