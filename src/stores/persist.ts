// One prefix + reset registry for every persisted store, so Settings can reset
// all workbench layout state in-memory without importing any feature's store
// and without calling location.reload().
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

const PREFIX = 'ide:';
const resetters = new Set<() => void>();

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function getSafeStorage(): StateStorage {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    /* blocked storage (private mode / sandboxed iframe) */
  }
  return noopStorage;
}

export const persistName = (name: string) => PREFIX + name;

/** localStorage when available, or a silent no-op storage in Node tests / restricted frames. */
export const persistStorage = createJSONStorage(getSafeStorage);

/** Register an in-memory store reset callback when defining a persisted store. */
export function registerResetter(reset: () => void) {
  resetters.add(reset);
}

export function resetAllPersisted() {
  for (const reset of resetters) reset();
  try {
    if (typeof localStorage !== 'undefined') {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith(PREFIX)) localStorage.removeItem(key);
      }
    }
  } catch {
    /* storage unavailable: nothing to clear */
  }
}
