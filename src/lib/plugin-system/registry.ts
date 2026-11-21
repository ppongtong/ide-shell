// ─────────────────────────────────────────────────────────────
// Registry: reads every plugin ONCE at startup and builds the
// sorted lists + lookup maps the rest of the app reads.
// ─────────────────────────────────────────────────────────────
import { createContext, use } from 'react';
import type { Activity, ItemType, Plugin, SidebarPanel } from './types';

export interface Registry {
  plugins: Plugin[];
  topActivities: Activity[];
  bottomActivities: Activity[];
  activity: Map<string, Activity>;
  panel: Map<string, SidebarPanel>;
  itemType: Map<string, ItemType>;
  /** Panels a container can show, in stack order. */
  panelsFor(container: SidebarPanel['container']): SidebarPanel[];
}

function indexById<T>(kind: string, list: T[], key: (t: T) => string): Map<string, T> {
  const map = new Map<string, T>();
  for (const t of list) {
    const k = key(t);
    if (map.has(k)) throw new Error(`Duplicate ${kind} "${k}" registered by two plugins`);
    map.set(k, t);
  }
  return map;
}

function assertUniqueOrder<T extends { id: string; order: number }>(
  kind: string,
  list: T[],
  groupOf: (t: T) => string,
) {
  const seen = new Map<string, string>();
  for (const item of list) {
    const group = groupOf(item);
    const slot = `${group}:${item.order}`;
    const existing = seen.get(slot);
    if (existing) {
      throw new Error(`Duplicate ${kind} order ${item.order} in "${group}" ("${existing}" and "${item.id}")`);
    }
    seen.set(slot, item.id);
  }
}

export function createRegistry(plugins: Plugin[]): Registry {
  const activities = plugins.flatMap((p) => p.activities ?? []);
  const panels = plugins.flatMap((p) => p.panels ?? []);
  const itemTypes = plugins.flatMap((p) => p.itemTypes ?? []);

  const activity = indexById('activity', activities, (a) => a.id);
  const panel = indexById('panel', panels, (p) => p.id);
  const itemType = indexById('item type', itemTypes, (t) => t.type);

  // Fail at boot, not at first click.
  assertUniqueOrder('activity', activities, (a) => a.position ?? 'top');
  assertUniqueOrder('panel', panels, (p) => p.container);

  for (const a of activities) {
    if (a.action.kind === 'togglePanel' && !panel.has(a.action.panelId))
      throw new Error(`Activity "${a.id}" toggles unknown panel "${a.action.panelId}"`);
    if (a.action.kind === 'route' && a.action.page && a.action.to !== `/${a.id}`)
      throw new Error(`Plugin page activity "${a.id}" must use to: "/${a.id}"`);
  }

  const byOrder = (x: { order: number; id: string }, y: { order: number; id: string }) =>
    x.order - y.order || x.id.localeCompare(y.id);

  return {
    plugins,
    topActivities: activities.filter((a) => a.position !== 'bottom').sort(byOrder),
    bottomActivities: activities.filter((a) => a.position === 'bottom').sort(byOrder),
    activity,
    panel,
    itemType,
    panelsFor: (container) => panels.filter((p) => p.container === container).sort(byOrder),
  };
}

export const RegistryContext = createContext<Registry | null>(null);

/** React 19: `use(Context)` — same as useContext, but also callable inside conditions. */
export function useRegistry(): Registry {
  const r = use(RegistryContext);
  if (!r) throw new Error('useRegistry must be used inside <RegistryContext value={…}>');
  return r;
}
