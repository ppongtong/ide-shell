// Pure Explorer tree builder. Kept outside React components so React Compiler
// caches the O(N log N) grouping & localeCompare sorts strictly on `(items, renderers)`.
import { EMPTY, PRIMARY_TYPE, type Item, type ItemRenderer } from '@/lib/plugin-system';

export const OTHER_GROUP_ID = 'group:__other__';

export interface ExplorerTree {
  readonly byId: ReadonlyMap<string, Item>;
  readonly byParent: ReadonlyMap<string | null, readonly Item[]>;
  readonly primaryItem: Item | undefined;
  /** Top-level container-only items (e.g. `type: 'folder'` where `component` is omitted). */
  readonly rootFolders: readonly Item[];
  readonly groupRenderers: readonly ItemRenderer[];
  readonly byRendererType: ReadonlyMap<string, readonly Item[]>;
  /** Top-level items whose `type` is not registered by any loaded plugin (shown under "Other"). */
  readonly unknownItems: readonly Item[];
  /** Every item/group ID that can be collapsed/expanded in this workspace. */
  readonly collapsibleIds: readonly string[];
}

export function buildExplorerTree(
  items: readonly Item[],
  renderers: ReadonlyMap<string, ItemRenderer>,
): ExplorerTree {
  const byId = new Map<string, Item>();
  for (const item of items) byId.set(item.id, item);

  const hasCycle = (item: Item): boolean => {
    const seen = new Set<string>([item.id]);
    for (let p = item.parentId; p; p = byId.get(p)?.parentId ?? null) {
      if (seen.has(p)) return true;
      seen.add(p);
    }
    return false;
  };

  const byParent = new Map<string | null, Item[]>();
  for (const item of items) {
    const parentKey = item.parentId && byId.has(item.parentId) && !hasCycle(item) ? item.parentId : null;
    const bucket = byParent.get(parentKey);
    if (bucket) bucket.push(item);
    else byParent.set(parentKey, [item]);
  }

  const isFolderItem = (i: Item) => {
    if (i.type === PRIMARY_TYPE) return false;
    const r = renderers.get(i.type);
    return (!!r && !r.component) || (byParent.get(i.id)?.length ?? 0) > 0;
  };

  for (const bucket of byParent.values()) {
    bucket.sort((a, b) => Number(isFolderItem(b)) - Number(isFolderItem(a)) || a.name.localeCompare(b.name));
  }

  // Matches `findPrimaryItem(workspace)` (first root item with `type === PRIMARY_TYPE`).
  const primaryItem = items.find((i) => i.type === PRIMARY_TYPE && i.parentId === null);

  // Every non-primary renderer that provides a main-pane `component` gets a root Explorer group.
  const groupRenderers = [...renderers.values()].filter((r) => r.type !== PRIMARY_TYPE && !!r.component);
  const rootFolders: Item[] = [];
  const byRendererType = new Map<string, Item[]>();
  const unknown: Item[] = [];

  // Partition root items (`byParent.get(null)`) once; nested items render inside their parent's subtree.
  for (const item of byParent.get(null) ?? EMPTY) {
    if (item.type === PRIMARY_TYPE) continue;
    const renderer = renderers.get(item.type);
    if (!renderer) {
      unknown.push(item);
      continue;
    }
    if (!renderer.component) {
      rootFolders.push(item);
      continue;
    }
    const bucket = byRendererType.get(item.type);
    if (bucket) bucket.push(item);
    else byRendererType.set(item.type, [item]);
  }

  const collapsibleIds: string[] = [];
  for (const item of items) {
    if (item.type === PRIMARY_TYPE && item.id !== primaryItem?.id) continue;
    const r = renderers.get(item.type);
    if ((byParent.get(item.id)?.length ?? 0) > 0 || (!!r && !r.component)) {
      collapsibleIds.push(item.id);
    }
  }
  for (const r of groupRenderers) {
    collapsibleIds.push(`group:${r.type}`);
  }
  if (unknown.length > 0) {
    collapsibleIds.push(OTHER_GROUP_ID);
  }

  return {
    byId,
    byParent,
    primaryItem,
    rootFolders: rootFolders.length > 0 ? rootFolders : EMPTY,
    groupRenderers,
    byRendererType,
    unknownItems: unknown.length > 0 ? unknown : EMPTY,
    collapsibleIds,
  };
}

/** Collect ancestor IDs (plus `group:<type>` / `group:__other__` when rooted in a type group) so `item` is visible. */
export function ancestorContainerIds(
  byId: ReadonlyMap<string, Item>,
  renderers: ReadonlyMap<string, ItemRenderer>,
  item: Item,
): string[] {
  const ancestors: string[] = [];
  const seen = new Set<string>([item.id]);
  for (
    let cur = item.parentId ? byId.get(item.parentId) : undefined;
    cur && !seen.has(cur.id);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined
  ) {
    seen.add(cur.id);
    ancestors.unshift(cur.id);
  }

  const rootItem = (ancestors[0] ? byId.get(ancestors[0]) : undefined) ?? item;
  if (rootItem.type === PRIMARY_TYPE) return ancestors;

  const rootRenderer = renderers.get(rootItem.type);
  if (rootRenderer && !rootRenderer.component) return ancestors;

  ancestors.push(rootRenderer ? `group:${rootItem.type}` : OTHER_GROUP_ID);
  return ancestors;
}
