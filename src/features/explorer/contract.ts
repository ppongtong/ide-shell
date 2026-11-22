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
  /** Ensure every ID in `nodeIds` is expanded (used by Breadcrumbs when clicking a parent folder). */
  revealItems(wsId: string, nodeIds: readonly string[]): void;
  /** Collapse all collapsible roots/groups in the active Explorer workspace. */
  collapseAll(): boolean;
  /** Expand all collapsed nodes in the active Explorer workspace. */
  expandAll(): boolean;
}

export const useExplorerContract = createPluginBridge<ExplorerSnapshot, ExplorerActions>();
