// Pure Explorer tree builder. Kept outside React components so React Compiler
// caches the O(N log N) grouping & localeCompare sorts strictly on `(items, itemTypes)`.
import { EMPTY, type Item, type ItemType } from '@/lib/plugin-system';

export interface ExplorerTree {
  readonly byId: ReadonlyMap<string, Item>;
  readonly byParent: ReadonlyMap<string | null, readonly Item[]>;
  readonly primaryRoots: readonly Item[];
  readonly leafTypes: readonly ItemType[];
  readonly byItemType: ReadonlyMap<string, readonly Item[]>;
  /** Every container & group ID that can be collapsed/expanded in this workspace. */
  readonly collapsibleIds: readonly string[];
}

export function buildExplorerTree(items: readonly Item[], itemTypes: ReadonlyMap<string, ItemType>): ExplorerTree {
  const isContainer = (i: Item) => !!itemTypes.get(i.type)?.isContainer;
  const isPinnedRoot = (i: Item) => !!itemTypes.get(i.type)?.pinnedRoot;

  const byId = new Map<string, Item>();
  const byParent = new Map<string | null, Item[]>();
  for (const item of items) {
    byId.set(item.id, item);
    const bucket = byParent.get(item.parentId);
    if (bucket) bucket.push(item);
    else byParent.set(item.parentId, [item]);
  }
  for (const bucket of byParent.values()) {
    bucket.sort((a, b) => Number(isContainer(b)) - Number(isContainer(a)) || a.name.localeCompare(b.name));
  }

  const primaryRoots = (byParent.get(null) ?? EMPTY).filter(isPinnedRoot);
  const primarySubtreeIds = new Set<string>();
  const collectSubtree = (id: string) => {
    primarySubtreeIds.add(id);
    for (const child of byParent.get(id) ?? EMPTY) collectSubtree(child.id);
  };
  for (const root of primaryRoots) collectSubtree(root.id);

  const leafTypes = [...itemTypes.values()].filter((t) => !t.isContainer);
  const byItemType = new Map<string, Item[]>();
  for (const item of items) {
    if (primarySubtreeIds.has(item.id) || isContainer(item)) continue;
    const bucket = byItemType.get(item.type);
    if (bucket) bucket.push(item);
    else byItemType.set(item.type, [item]);
  }
  for (const bucket of byItemType.values()) {
    bucket.sort((a, b) => a.name.localeCompare(b.name));
  }

  const collapsibleIds: string[] = [];
  for (const item of items) {
    if (isContainer(item)) collapsibleIds.push(item.id);
  }
  for (const type of leafTypes) {
    collapsibleIds.push(`group:${type.type}`);
  }

  return { byId, byParent, primaryRoots, leafTypes, byItemType, collapsibleIds };
}

/** Collect ancestor container IDs (plus `group:<type>` if at root) so an active item is visible in the tree. */
export function ancestorContainerIds(
  byId: ReadonlyMap<string, Item>,
  primaryRoots: readonly Item[],
  item: Item,
): string[] {
  const ancestors: string[] = [];
  for (let cur = item.parentId ? byId.get(item.parentId) : undefined; cur; cur = cur.parentId ? byId.get(cur.parentId) : undefined) {
    ancestors.unshift(cur.id);
  }
  const underPinnedRoot = ancestors.length > 0 && primaryRoots.some((r) => r.id === ancestors[0]);
  if (!underPinnedRoot) ancestors.push(`group:${item.type}`);
  return ancestors;
}
