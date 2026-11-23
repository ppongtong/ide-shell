// Workspace detail URL search validation & cached item indexing.
import { itemKey, parseItem, PRIMARY_TYPE, type Item, type ItemRenderer, type WorkspaceInfo } from '@/lib/plugin-system';

export interface DetailSearch {
  readonly item?: string;
  readonly panels?: string;
}

export function validateDetailSearch(raw: Record<string, unknown>): DetailSearch {
  const item = typeof raw.item === 'string' && parseItem(raw.item) ? raw.item : undefined;
  const panels = typeof raw.panels === 'string' && raw.panels ? raw.panels : undefined;
  return { item, panels };
}

export interface ItemIndex {
  readonly byId: ReadonlyMap<string, Item>;
  readonly byKey: ReadonlyMap<string, Item>;
}

const indexCache = new WeakMap<readonly Item[], ItemIndex>();

/** O(1) WeakMap-cached lookup maps (`byId` and `byKey`) for a workspace's `items` array. */
export function indexItems(workspace: WorkspaceInfo): ItemIndex {
  const cached = indexCache.get(workspace.items);
  if (cached) return cached;

  const byId = new Map<string, Item>();
  const byKey = new Map<string, Item>();
  for (const item of workspace.items) {
    byId.set(item.id, item);
    byKey.set(itemKey(item.type, item.id), item);
  }
  const built: ItemIndex = { byId, byKey };
  indexCache.set(workspace.items, built);
  return built;
}

/** An item opens in a closable tab when it is not `PRIMARY_TYPE` and its registered renderer provides a `component`. */
export const isClosableTabType = (renderers: ReadonlyMap<string, ItemRenderer>, type: string): boolean =>
  type !== PRIMARY_TYPE && !!renderers.get(type)?.component;

/** Set of `"type:id"` keys in `workspace` that open in closable tabs (memoized by React Compiler in `WorkspaceDetailPage`). */
export function openableKeys(
  workspace: WorkspaceInfo,
  renderers: ReadonlyMap<string, ItemRenderer>,
): ReadonlySet<string> {
  const set = new Set<string>();
  for (const item of workspace.items) {
    if (isClosableTabType(renderers, item.type)) {
      set.add(itemKey(item.type, item.id));
    }
  }
  return set;
}
