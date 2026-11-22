// Pure Explorer tree builder. Kept outside React components so React Compiler
// caches the O(N log N) grouping & localeCompare sorts strictly on `(items, itemTypes)`.
import type { Item, ItemType } from '@/lib/plugin-system';

export const NONE_ITEMS: readonly Item[] = Object.freeze([]);

export interface ExplorerTree {
  readonly byParent: ReadonlyMap<string | null, readonly Item[]>;
  readonly primaryRoots: readonly Item[];
  readonly leafTypes: readonly ItemType[];
  readonly byItemType: ReadonlyMap<string, readonly Item[]>;
  /** Every container & group ID that can be collapsed/expanded in this workspace. */
  readonly collapsibleIds: readonly string[];
}

export function buildExplorerTree(items: readonly Item[], itemTypes: ReadonlyMap<string, ItemType>): ExplorerTree {
  const isContainer = (i: Item) => !!itemTypes.get(i.type)?.isContainer;

  const byParent = new Map<string | null, Item[]>();
  for (const item of items) {
    const bucket = byParent.get(item.parentId);
    if (bucket) bucket.push(item);
    else byParent.set(item.parentId, [item]);
  }
  for (const bucket of byParent.values()) {
    bucket.sort((a, b) => Number(isContainer(b)) - Number(isContainer(a)) || a.name.localeCompare(b.name));
  }

  const primaryRoots = (byParent.get(null) ?? NONE_ITEMS).filter((i) => i.type === 'primary');
  const primarySubtreeIds = new Set<string>();
  const collectSubtree = (id: string) => {
    primarySubtreeIds.add(id);
    for (const child of byParent.get(id) ?? NONE_ITEMS) collectSubtree(child.id);
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

  return { byParent, primaryRoots, leafTypes, byItemType, collapsibleIds };
}
