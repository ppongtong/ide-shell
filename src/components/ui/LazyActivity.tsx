import { Activity, useState, type ReactNode } from 'react';

/**
 * Mounts `children` only after `active` has been true at least once, then keeps
 * them alive inside React `<Activity>`. Prevents hidden panels and restored
 * background tabs from downloading lazy chunks on initial page load.
 */
export function LazyActivity({ active, children }: { active: boolean; children: ReactNode }) {
  const [mounted, setMounted] = useState(active);
  if (active && !mounted) {
    setMounted(true);
  }
  if (!mounted) return null;
  return <Activity mode={active ? 'visible' : 'hidden'}>{children}</Activity>;
}
