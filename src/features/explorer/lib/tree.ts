// Pure Explorer tree builder. Kept outside React components so React Compiler
// caches the O(N log N) grouping & localeCompare sorts strictly on `(items, renderers)`.
import { EMPTY, type Item, type ItemRenderer } from '@/lib/plugin-system';

export const OTHER_GROUP_ID = 'group:__other__';

export interface ExplorerTree {
  readonly byId: ReadonlyMap<string, Item>;
  readonly byParent: ReadonlyMap<string | null, readonly Item[]>;
  readonly primaryRoots: readonly Item[];
  readonly groupRenderers: readonly ItemRenderer[];
  readonly byRendererType: ReadonlyMap<string, readonly Item[]>;
  /** Items whose `type` is not registered by any loaded plugin (shown under "Other"). */
  readonly unknownItems: readonly Item[];
  /** Every item/group ID that can be collapsed/expanded in this workspace. */
  readonly collapsibleIds: readonly string[];
}

export function buildExplorerTree(
  items: readonly Item[],
  renderers: ReadonlyMap<string, ItemRenderer>,
): ExplorerTree {
  const byId = new Map<string, Item>();
  const byParent = new Map<string | null, Item[]>();
  for (const item of items) {
    byId.set(item.id, item);
    const bucket = byParent.get(item.parentId);
    if (bucket) bucket.push(item);
    else byParent.set(item.parentId, [item]);
  }

  const isFolderItem = (i: Item) => {
    if (i.type === 'primary') return false;
    const r = renderers.get(i.type);
    return (r && !r.component) || (byParent.get(i.id)?.length ?? 0) > 0;
  };

  for (const bucket of byParent.values()) {
    bucket.sort((a, b) => Number(isFolderItem(b)) - Number(isFolderItem(a)) || a.name.localeCompare(b.name));
  }

  const primaryRoots = (byParent.get(null) ?? EMPTY).filter((i) => i.type === 'primary');
  const primarySubtreeIds = new Set<string>();
  const collectSubtree = (id: string) => {
    primarySubtreeIds.add(id);
    for (const child of byParent.get(id) ?? EMPTY) collectSubtree(child.id);
  };
  for (const root of primaryRoots) collectSubtree(root.id);

  // Every non-primary renderer that provides a main-pane `component` gets a root Explorer group.
  const groupRenderers = [...renderers.values()].filter((r) => r.type !== 'primary' && !!r.component);
  const byRendererType = new Map<string, Item[]>();
  const unknown: Item[] = [];

  for (const item of items) {
    if (primarySubtreeIds.has(item.id) || item.type === 'primary') continue;
    const renderer = renderers.get(item.type);
    if (!renderer) {
      unknown.push(item);
      continue;
    }
    if (!renderer.component) continue; // folder items render inside their parent / root folder hierarchy
    const bucket = byRendererType.get(item.type);
    if (bucket) bucket.push(item);
    else byRendererType.set(item.type, [item]);
  }
  for (const bucket of byRendererType.values()) {
    bucket.sort((a, b) => a.name.localeCompare(b.name));
  }
  unknown.sort((a, b) => a.name.localeCompare(b.name));

  const collapsibleIds: string[] = [];
  for (const item of items) {
    if ((byParent.get(item.id)?.length ?? 0) > 0 || (renderers.has(item.type) && !renderers.get(item.type)?.component)) {
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
    primaryRoots,
    groupRenderers,
    byRendererType,
    unknownItems: unknown.length > 0 ? unknown : EMPTY,
    collapsibleIds,
  };
}

/** Collect ancestor IDs (plus `group:<type>` / `group:__other__`) so an active item is visible in the tree. */
export function ancestorContainerIds(
  byId: ReadonlyMap<string, Item>,
  primaryRoots: readonly Item[],
  renderers: ReadonlyMap<string, ItemRenderer>,
  item: Item,
): string[] {
  const ancestors: string[] = [];
  for (
    let cur = item.parentId ? byId.get(item.parentId) : undefined;
    cur;
    cur = cur.parentId ? byId.get(cur.parentId) : undefined
  ) {
    ancestors.unshift(cur.id);
  }
  const underPrimary = ancestors.length > 0 && primaryRoots.some((r) => r.id === ancestors[0]);
  if (!underPrimary && item.type !== 'primary') {
    ancestors.push(renderers.has(item.type) ? `group:${item.type}` : OTHER_GROUP_ID);
  }
  return ancestors;
}
