// ─────────────────────────────────────────────────────────────
// Workspace domain contract: types, item-type indexing, and
// workspace URL search params shared by workspace, agent,
// settings, routes, and stores—keeping lib/plugin-system generic.
// ─────────────────────────────────────────────────────────────
import type { Icon, Lazy, Registry } from '@/lib/plugin-system';

/** Container id used by sidebar panels hosted inside the workspace detail screen. */
export const WORKSPACE_DETAIL_CONTAINER = '/workspaces/$wsId' as const;

export interface Item {
  id: string;
  type: string;
  name: string;
  parentId: string | null;
  content?: string;
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  items: Item[];
}

export interface EditorProps {
  workspace: WorkspaceInfo;
  item: Item;
}

export interface ItemType {
  type: string;
  label: string;
  icon: Icon;
  /** Folders expand/collapse instead of opening a tab. */
  isContainer?: boolean;
  /** Rendered inside the tab. Omit for containers. */
  editor?: Lazy<EditorProps>;
}

/** Plug `itemTypes` into the generic Plugin contract via module augmentation. */
declare module '@/lib/plugin-system' {
  interface PluginContributions {
    itemTypes: ItemType[];
  }
}

// Cached per Registry instance so indexing happens once.
const itemTypeCache = new WeakMap<Registry, Map<string, ItemType>>();

export function getItemTypes(registry: Registry): Map<string, ItemType> {
  const cached = itemTypeCache.get(registry);
  if (cached) return cached;

  const map = new Map<string, ItemType>();
  for (const plugin of registry.plugins) {
    for (const itemType of plugin.itemTypes ?? []) {
      if (map.has(itemType.type)) {
        throw new Error(`Duplicate item type "${itemType.type}" registered by two plugins`);
      }
      map.set(itemType.type, itemType);
    }
  }
  itemTypeCache.set(registry, map);
  return map;
}

// ── Workspace detail URL search params (?item=file:utils&panels=agent) ──

export interface DetailSearch {
  item?: string;
  panels?: string;
}

export const itemKey = (type: string, id: string) => `${type}:${id}`;

export function parseItem(key?: string): { type: string; id: string } | undefined {
  if (!key) return undefined;
  const i = key.indexOf(':');
  if (i <= 0 || i === key.length - 1) return undefined;
  return { type: key.slice(0, i), id: key.slice(i + 1) };
}

export function validateDetailSearch(raw: Record<string, unknown>): DetailSearch {
  const item = typeof raw.item === 'string' && parseItem(raw.item) ? raw.item : undefined;
  const panels = typeof raw.panels === 'string' && raw.panels ? raw.panels : undefined;
  return { item, panels };
}
