import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRegistry, type Plugin } from '@/lib/plugin-system';
import { useWorkspaceContract, type WorkspaceSnapshot } from '../src/features/workspace/contract.ts';
import { useExplorerContract } from '../src/features/explorer/contract.ts';
import { agentApi, runAgentAction } from '../src/features/agent/api/agent.ts';

const Icon = () => null;

const testPlugin: Plugin = {
  id: 'test.renderers',
  itemRenderers: [
    { type: 'primary', label: 'Primary Key', icon: Icon, component: Icon },
    { type: 'folder', label: 'Folder', icon: Icon },
    { type: 'file', label: 'File', icon: Icon, component: Icon },
  ],
};

const primaryRoot = { id: 'primary-acme', type: 'primary', name: 'Storefront Core', parentId: null } as const;

const snapshot: WorkspaceSnapshot = {
  workspace: {
    id: 'acme',
    name: 'Acme',
    items: [
      primaryRoot,
      { id: 'src', type: 'folder', name: 'src', parentId: null },
      { id: 'utils', type: 'file', name: 'utils.ts', parentId: 'src', content: '' },
    ],
  },
  primaryItem: primaryRoot,
  openItems: [],
};

describe('agentApi & action runner', () => {
  it('returns generic item actions without hardcoding item types in agentApi', async () => {
    const openRes = await agentApi.ask('open utils.ts', snapshot, 0);
    assert.deepEqual(openRes.actions, [{ target: 'workspace', type: 'openItem', itemId: 'utils' }]);

    const folderRes = await agentApi.ask('open src', snapshot, 0);
    assert.deepEqual(folderRes.actions, [{ target: 'workspace', type: 'openItem', itemId: 'src' }]);

    const closeRes = await agentApi.ask('close utils.ts', snapshot, 0);
    assert.deepEqual(closeRes.actions, [{ target: 'workspace', type: 'closeItem', itemId: 'utils' }]);
  });

  it('routes folder and primary openItem actions cleanly using ItemRenderer metadata', () => {
    const registry = createRegistry([testPlugin]);
    const revealed: Array<{ wsId: string; ids: readonly string[] }> = [];
    let primaryShown = 0;

    useWorkspaceContract.getState().setActions({
      isActiveWorkspace: (id) => id === 'acme',
      showPrimary: () => {
        primaryShown += 1;
        return true;
      },
      openItem: () => false,
      closeItem: () => false,
      setPrimaryItem: async () => true,
    });
    useExplorerContract.getState().setActions({
      revealItems: (wsId, ids) => {
        revealed.push({ wsId, ids });
      },
      collapseAll: () => true,
      expandAll: () => true,
    });

    try {
      const folderNote = runAgentAction(
        { target: 'workspace', type: 'openItem', itemId: 'src' },
        snapshot.workspace,
        registry.itemRenderer,
      );
      assert.equal(folderNote, null);
      assert.equal(primaryShown, 0);
      assert.deepEqual(revealed, [{ wsId: 'acme', ids: ['src'] }]);

      const rootNote = runAgentAction(
        { target: 'workspace', type: 'openItem', itemId: 'primary-acme' },
        snapshot.workspace,
        registry.itemRenderer,
      );
      assert.equal(rootNote, null);
      assert.equal(primaryShown, 1);
      assert.deepEqual(revealed[1], { wsId: 'acme', ids: ['primary-acme'] });
    } finally {
      useWorkspaceContract.getState().clear();
      useExplorerContract.getState().clear();
    }
  });

  it('returns explorer actions for collapse all and expand all commands', async () => {
    const collapseRes = await agentApi.ask('collapse all', snapshot, 0);
    assert.deepEqual(collapseRes.actions, [{ target: 'explorer', type: 'collapseAll' }]);

    const expandRes = await agentApi.ask('expand all', snapshot, 0);
    assert.deepEqual(expandRes.actions, [{ target: 'explorer', type: 'expandAll' }]);
  });

  it('reads primaryItem from WorkspaceSnapshot without coupling to feature/primary', async () => {
    const configured = await agentApi.ask('what is the primary key?', snapshot, 0);
    assert.match(configured.text, /Storefront Core/);
    assert.match(configured.text, /id: primary-acme, type: primary/);
    assert.deepEqual(configured.actions, []);

    const unsetSnapshot: WorkspaceSnapshot = {
      workspace: { id: 'fresh', name: 'Fresh', items: [] },
      primaryItem: undefined,
      openItems: [],
    };
    const unset = await agentApi.ask('primary key', unsetSnapshot, 0);
    assert.match(unset.text, /no primary key selected yet/);
    assert.deepEqual(unset.actions, [{ target: 'workspace', type: 'showPrimary' }]);
  });
});
