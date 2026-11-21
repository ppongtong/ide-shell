// One prefix + reset registry for every persisted store, so Settings can reset
// all workbench layout state in-memory without importing any feature's store
// and without calling location.reload().
import { createJSONStorage } from 'zustand/middleware';

const PREFIX = 'ide:';
const resetters = new Set<() => void>();

export const persistName = (name: string) => PREFIX + name;

/** localStorage, or nothing if the browser blocks it (private mode, sandboxed frames). */
export const persistStorage = createJSONStorage(() => localStorage);

/** Register an in-memory store reset callback when defining a persisted store. */
export function registerResetter(reset: () => void) {
  resetters.add(reset);
}

export function resetAllPersisted() {
  for (const reset of resetters) reset();
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PREFIX)) localStorage.removeItem(key);
    }
  } catch {
    /* storage unavailable: nothing to clear */
  }
}
