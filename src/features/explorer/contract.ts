// ─────────────────────────────────────────────────────────────
// Public cross-feature contract of `core.explorer`.
// Shares domain-level tree actions without leaking internal node/group IDs.
// ─────────────────────────────────────────────────────────────
import { createPluginBridge } from '@/lib/plugin-system';

export interface ExplorerActions {
  /** Expand `itemId` (if collapsible) and every ancestor folder/group needed to make it visible. */
  revealItem(itemId: string): boolean;
  /** Collapse all collapsible roots/groups in the active Explorer workspace. */
  collapseAll(): void;
  /** Expand all collapsed nodes in the active Explorer workspace. */
  expandAll(): void;
}

export const useExplorerContract = createPluginBridge<null, ExplorerActions>();
export const usePublishExplorerContract = useExplorerContract.usePublish;
