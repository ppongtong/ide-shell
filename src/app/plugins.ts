// The ONE list of features the app loads. Order here doesn't matter;
// each contribution carries its own `order`.
import { workspacePlugin } from '@/features/workspace';
import { agentPlugin } from '@/features/agent';
import { reportsPlugin } from '@/features/reports';
import { settingsPlugin } from '@/features/settings';

export const plugins = [workspacePlugin, agentPlugin, reportsPlugin, settingsPlugin];
