import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { agentApi } from '../src/features/agent/api/agent.ts';
import type { WorkspaceSnapshot } from '../src/features/workspace/contract.ts';

const snapshot: WorkspaceSnapshot = {
  workspace: {
    id: 'acme',
    name: 'Acme',
    items: [
      { id: 'primary-storefront', type: 'primary', name: 'Storefront Core', parentId: null },
      { id: 'utils', type: 'file', name: 'utils.ts', parentId: null, content: '' },
    ],
  },
  isDraft: false,
  openItems: [],
};

describe('agentApi', () => {
  it('returns workspace actions for open and close commands', async () => {
    const openRes = await agentApi.ask('open utils.ts', snapshot, 0);
    assert.deepEqual(openRes.actions, [{ target: 'workspace', type: 'openItem', itemId: 'utils' }]);

    const closeRes = await agentApi.ask('close utils.ts', snapshot, 0);
    assert.deepEqual(closeRes.actions, [{ target: 'workspace', type: 'closeItem', itemId: 'utils' }]);
  });

  it('returns explorer actions for collapse all and expand all commands', async () => {
    const collapseRes = await agentApi.ask('collapse all', snapshot, 0);
    assert.deepEqual(collapseRes.actions, [{ target: 'explorer', type: 'collapseAll' }]);

    const expandRes = await agentApi.ask('expand all', snapshot, 0);
    assert.deepEqual(expandRes.actions, [{ target: 'explorer', type: 'expandAll' }]);
  });
});
