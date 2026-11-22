// ─────────────────────────────────────────────────────────────
// Typed cross-plugin state & action bridge.
//   • A feature exports `useMyContract = createPluginBridge<Snapshot, Actions>()`
//     from `src/features/<name>/contract.ts`.
//   • While mounted/active, the owning feature publishes `setSnapshot` / `setActions`,
//     and calls `clear()` on unmount.
//   • Other features select narrow slices in render (`useMyContract((s) => ...)`)
//     or read `.getState()` inside event/async handlers.
//   • When a plugin is unloaded or unmounted, `current` and `actions` are `null`.
// ─────────────────────────────────────────────────────────────
import { create, type StoreApi, type UseBoundStore } from 'zustand';

export interface PluginBridgeState<Snapshot, Actions> {
  readonly current: Snapshot | null;
  readonly actions: Actions | null;
  setSnapshot(current: Snapshot): void;
  setActions(actions: Actions): void;
  clear(): void;
}

export type PluginBridge<Snapshot, Actions> = UseBoundStore<StoreApi<PluginBridgeState<Snapshot, Actions>>>;

export function createPluginBridge<Snapshot, Actions = Record<string, never>>(): PluginBridge<Snapshot, Actions> {
  return create<PluginBridgeState<Snapshot, Actions>>()((set) => ({
    current: null,
    actions: null,
    setSnapshot: (current) => set({ current }),
    setActions: (actions) => set({ actions }),
    clear: () => set({ current: null, actions: null }),
  }));
}
