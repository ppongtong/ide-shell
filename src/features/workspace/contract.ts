// ─────────────────────────────────────────────────────────────
// Public cross-feature contract of `core.workspace`.
// Other features may import ONLY this file (`@/features/workspace/contract`)
// to read the active workspace/tabs, trigger tab actions, or signal
// primary-key selection from the `type: 'primary'` plugin renderer.
// ─────────────────────────────────────────────────────────────
import { createPluginBridge, type Item, type WorkspaceInfo } from '@/lib/plugin-system';

export interface PrimaryChildSeed {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly content?: string;
}

export interface PrimarySelectionInput {
  readonly name: string;
  readonly content?: string;
  readonly children?: readonly PrimaryChildSeed[];
}

export interface WorkspaceSnapshot {
  readonly workspace: WorkspaceInfo;
  /** Raw `?item=` URL search key (`"type:id"`), even if unopenable; `undefined` when pinned Primary tab is active. */
  readonly activeKey?: string;
  /** Resolved Item of the active tab when `activeKey` refers to an openable non-primary item. */
  readonly activeItem?: Item;
  /** Items open in closable tabs, in tab order. */
  readonly openItems: readonly Item[];
}

/** Each synchronous action returns false when it could not do anything (left workspace, unknown item, tab not open). */
export interface WorkspaceActions {
  /** True when `wsId` is still the active workspace AND no navigation away from it is in flight. */
  isActiveWorkspace(wsId: string): boolean;
  /** Switch to the pinned Primary tab (clears `?item=`). */
  showPrimary(): boolean;
  /** Open an item in a closable tab and switch to it. */
  openItem(itemId: string): boolean;
  /** Close the item's tab. */
  closeItem(itemId: string): boolean;
  /** Signal from the `type: 'primary'` renderer when the user selects/saves the workspace's primary key/data. */
  setPrimaryItem(input: PrimarySelectionInput): Promise<boolean>;
}

export const useWorkspaceContract = createPluginBridge<WorkspaceSnapshot, WorkspaceActions>();
