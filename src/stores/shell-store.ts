// App-wide shell state only. Feature state lives in its feature's stores/.
import { create } from 'zustand';

interface ShellState {
  /** Activity whose dialog is open. Not in the URL: Back should not reopen a dialog. */
  readonly openDialog: string | null;
  /** Last URL visited inside each route activity (for rememberLastLocation). */
  readonly lastHref: Readonly<Record<string, string>>;

  showDialog(activityId: string): void;
  hideDialog(): void;
  rememberHref(activityId: string, href: string): void;
}

export const useShell = create<ShellState>()((set) => ({
  openDialog: null,
  lastHref: {},
  showDialog: (openDialog) => set({ openDialog }),
  hideDialog: () => set({ openDialog: null }),
  rememberHref: (id, href) =>
    set((s) => (s.lastHref[id] === href ? s : { lastHref: { ...s.lastHref, [id]: href } })),
}));
