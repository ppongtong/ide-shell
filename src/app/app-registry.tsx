// Built once at startup and provided to the React tree via <AppProvider>.
import type { ReactNode } from 'react';
import { createRegistry, RegistryContext } from '@/lib/plugin-system';
import { plugins } from './plugins';

const registry = createRegistry(plugins);

export function AppProvider({ children }: { children: ReactNode }) {
  return <RegistryContext value={registry}>{children}</RegistryContext>;
}
