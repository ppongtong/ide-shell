// ─────────────────────────────────────────────────────────────
// Public cross-feature contract of `core.explorer` (reference example
// of how any feature shares state & actions with other features).
// ─────────────────────────────────────────────────────────────
import { createPluginBridge } from '@/lib/plugin-system';

export interface ExplorerSnapshot {
  readonly workspaceId: string | null;
  /** Collapsed container/group IDs in the active workspace (`group:file`, `primary-storefront`, etc.). */
  readonly collapsedIds: readonly string[];
}

export interface ExplorerActions {
  /** Toggle a container item or `group:<type>` section open/closed. */
  toggleNode(wsId: string, nodeId: string): void;
  /** Ensure every ID in `nodeIds` is expanded (used by Breadcrumbs & Agent when revealing an item). */
  revealItems(wsId: string, nodeIds: readonly string[]): void;
  /** Collapse all collapsible roots/groups in `wsId` (or the currently active Explorer workspace). */
  collapseAll(): boolean;
  /** Expand all collapsed nodes in the currently active Explorer workspace. */
  expandAll(): boolean;
}

export const useExplorerContract = createPluginBridge<ExplorerSnapshot, ExplorerActions>();
