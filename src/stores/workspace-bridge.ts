// ─────────────────────────────────────────────────────────────
// Workspace bridge: what the workspace feature shares with other
// features (e.g. the agent) without them importing it.
//   • The workspace page publishes `current` + `actions` while it
//     is mounted, and clears both when it unmounts.
//   • Readers render with a selector:  useWorkspaceBridge((s) => s.current)
//     or read inside async/event code: useWorkspaceBridge.getState()
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';
import type { Item, WorkspaceInfo } from '@/lib/plugin-system';

export interface WorkspaceSnapshot {
  workspace: WorkspaceInfo;
  /** Item of the active tab. */
  activeItem?: Item;
  /** Items open in tabs, in tab order. */
  openItems: Item[];
}

/** Each action returns false when it could not do anything (unknown item, tab not open). */
export interface WorkspaceActions {
  /** Open the item in a tab and switch to it, expanding its parent folders. A folder just expands. */
  openItem(itemId: string): boolean;
  /** Close the item's tab. */
  closeItem(itemId: string): boolean;
}

interface WorkspaceBridgeState {
  current: WorkspaceSnapshot | null;
  actions: WorkspaceActions | null;
  setSnapshot(current: WorkspaceSnapshot): void;
  setActions(actions: WorkspaceActions): void;
  clearBridge(): void;
}

export const useWorkspaceBridge = create<WorkspaceBridgeState>()((set) => ({
  current: null,
  actions: null,
  setSnapshot: (current) => set({ current }),
  setActions: (actions) => set({ actions }),
  clearBridge: () => set({ current: null, actions: null }),
}));
