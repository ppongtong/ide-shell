// Built once. The router (context) and the React tree (<AppProvider>) share this instance.
import type { ReactNode } from 'react';
import { createRegistry, RegistryContext } from '@/lib/plugin-system';
import { plugins } from './plugins';

export const registry = createRegistry(plugins);

export function AppProvider({ children }: { children: ReactNode }) {
  return <RegistryContext value={registry}>{children}</RegistryContext>;
}
