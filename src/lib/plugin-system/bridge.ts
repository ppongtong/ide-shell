// ─────────────────────────────────────────────────────────────
// Typed cross-plugin state & action bridge.
//   • A feature exports `useMyContract = createPluginBridge<Snapshot, Actions>()`
//     from `src/features/<name>/contract.ts`.
//   • While mounted/active, the owning feature calls `useMyContract.usePublish(snapshot, actions)`
//     to publish synchronously before paint and clear on unmount.
//   • Other features select narrow slices in render (`useMyContract((s) => ...)`)
//     or read `.getState()` inside event/async handlers.
//   • When a plugin is unloaded or unmounted, `current` and `actions` are `null`.
// ─────────────────────────────────────────────────────────────
import { useLayoutEffect } from 'react';
import { create, type StoreApi, type UseBoundStore } from 'zustand';

export interface PluginBridgeState<Snapshot, Actions> {
  readonly current: Snapshot | null;
  readonly actions: Actions | null;
  setSnapshot(current: Snapshot): void;
  setActions(actions: Actions): void;
  clear(): void;
}

export interface PluginBridge<Snapshot, Actions>
  extends UseBoundStore<StoreApi<PluginBridgeState<Snapshot, Actions>>> {
  /** Publishes `snapshot` (`null` for actions-only bridges) and `actions`, clearing on unmount. */
  usePublish(snapshot: Snapshot | null, actions: Actions): void;
}

function createUsePublish<Snapshot, Actions>(store: StoreApi<PluginBridgeState<Snapshot, Actions>>) {
  return function usePublish(snapshot: Snapshot | null, actions: Actions): void {
    useLayoutEffect(() => {
      if (snapshot !== null) store.getState().setSnapshot(snapshot);
    }, [snapshot]);

    useLayoutEffect(() => {
      store.getState().setActions(actions);
    }, [actions]);

    useLayoutEffect(() => {
      return () => {
        store.getState().clear();
      };
    }, []);
  };
}

export function createPluginBridge<Snapshot, Actions = Record<string, never>>(): PluginBridge<Snapshot, Actions> {
  const store = create<PluginBridgeState<Snapshot, Actions>>()((set, get) => ({
    current: null,
    actions: null,
    setSnapshot: (current) => {
      if (Object.is(get().current, current)) return;
      set({ current });
    },
    setActions: (actions) => set({ actions }),
    clear: () => set((s) => (s.current === null && s.actions === null ? s : { current: null, actions: null })),
  }));
  return Object.assign(store, { usePublish: createUsePublish(store) });
}
