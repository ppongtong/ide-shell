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
  /** Raw `?item=` URL search key (`"type:id"`), even if unopenable; `undefined` when pinned Details tab is active. */
  readonly activeKey?: string;
  /** Resolved Item of the active tab when `activeKey` refers to an openable non-container item. */
  readonly activeItem?: Item;
  /** Items open in tabs, in tab order. */
  readonly openItems: readonly Item[];
}

/** Each action returns false when it could not do anything (draft mode, left workspace, unknown item, tab not open). */
export interface WorkspaceActions {
  /** True when `wsId` is still the active workspace AND no navigation away from it is in flight. */
  isActiveWorkspace(wsId: string): boolean;
  /** Switch to the pinned Details tab (clears `?item=`). */
  showDetails(): boolean;
  /** Open a non-container item in a tab and switch to it. */
  openItem(itemId: string): boolean;
  /** Close the item's tab. */
  closeItem(itemId: string): boolean;
}

export const useWorkspaceContract = createPluginBridge<WorkspaceSnapshot, WorkspaceActions>();
