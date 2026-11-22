// ─────────────────────────────────────────────────────────────
// Public cross-feature contract of `core.workspace`.
// Other features may import ONLY this file (`@/features/workspace/contract`)
// to read the active workspace/tabs or trigger workspace tab actions.
// ─────────────────────────────────────────────────────────────
import { createPluginBridge, type Item, type WorkspaceInfo } from '@/lib/plugin-system';

export interface WorkspaceSnapshot {
  /** Active workspace, or `null` while drafting a new workspace on `/workspaces/new`. */
  readonly workspace: WorkspaceInfo | null;
  /** True when the workbench is in draft creation mode (`/workspaces/new`). */
  readonly isDraft: boolean;
  /** Raw active tab key (`"type:id"`), or `undefined` when pinned Details tab is active. */
  readonly activeKey?: string;
  /** Item of the active tab (if an openable item tab is active). */
  readonly activeItem?: Item;
  /** Items open in tabs, in tab order. */
  readonly openItems: readonly Item[];
}

/** Each action returns false when it could not do anything (draft mode, unknown item, tab not open). */
export interface WorkspaceActions {
  /** Switch to the pinned Details tab (clears `?item=`). */
  showDetails(): boolean;
  /** Open the item in a tab and switch to it (revealing parent containers in Explorer if loaded). */
  openItem(itemId: string): boolean;
  /** Close the item's tab. */
  closeItem(itemId: string): boolean;
}

export const useWorkspaceContract = createPluginBridge<WorkspaceSnapshot, WorkspaceActions>();
