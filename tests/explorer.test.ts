import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Item, ItemRenderer } from '../src/lib/plugin-system/types.ts';
import { buildExplorerTree } from '../src/features/explorer/lib/tree.ts';
import { useExplorerStore } from '../src/features/explorer/stores/explorer-store.ts';
import { resetAllPersisted } from '../src/stores/persist.ts';

const Icon = () => null;

const renderers = new Map<string, ItemRenderer>([
  ['primary', { type: 'primary', label: 'Primary Key', icon: Icon, component: Icon }],
  ['folder', { type: 'folder', label: 'Folder', icon: Icon }],
  ['file', { type: 'file', label: 'File', pluralLabel: 'Files', icon: Icon, component: Icon }],
  ['dataset', { type: 'dataset', label: 'Dataset', pluralLabel: 'Datasets', icon: Icon, component: Icon }],
]);

describe('explorer tree & store', () => {
  it('pins primary roots with nested children and groups remaining openable items by renderer type', () => {
    const items: Item[] = [
      { id: 'primary-1', type: 'primary', name: 'Storefront Core', parentId: null },
      { id: 'child-b', type: 'file', name: 'b.ts', parentId: 'primary-1' },
      { id: 'child-a', type: 'file', name: 'a.ts', parentId: 'primary-1' },
      { id: 'z-file', type: 'file', name: 'zeta.ts', parentId: null },
      { id: 'a-file', type: 'file', name: 'alpha.ts', parentId: null },
    ];

    const tree = buildExplorerTree(items, renderers);
    assert.deepEqual(
      tree.primaryRoots.map((i) => i.id),
      ['primary-1'],
    );
    assert.deepEqual(
      (tree.byParent.get('primary-1') ?? []).map((i) => i.name),
      ['a.ts', 'b.ts'],
    );
    assert.deepEqual(
      (tree.byRendererType.get('file') ?? []).map((i) => i.name),
      ['alpha.ts', 'zeta.ts'],
    );
    assert.deepEqual(
      tree.groupRenderers.map((r) => r.type),
      ['file', 'dataset'],
    );
    assert.deepEqual(tree.unknownItems, []);
  });

  it('collects root items of unregistered types into unknownItems so they do not vanish from Explorer', () => {
    const items: Item[] = [
      { id: 'u1', type: 'file', name: 'utils.ts', parentId: null },
      { id: 'nb1', type: 'unregistered-nb', name: 'revenue.nb', parentId: null },
    ];
    const tree = buildExplorerTree(items, renderers);
    assert.deepEqual(
      tree.unknownItems.map((i) => i.name),
      ['revenue.nb'],
    );
  });

  it('toggles, collapses all, reveals paths, and resets with resetAllPersisted', () => {
    resetAllPersisted();
    const store = useExplorerStore.getState();

    store.toggleNode('acme', 'group:file');
    assert.deepEqual(useExplorerStore.getState().collapsed['acme'], ['group:file']);

    store.collapseAll('acme', ['primary-1', 'group:file', 'group:dataset']);
    assert.deepEqual(useExplorerStore.getState().collapsed['acme'], ['primary-1', 'group:file', 'group:dataset']);

    store.revealItems('acme', ['primary-1', 'group:file']);
    assert.deepEqual(useExplorerStore.getState().collapsed['acme'], ['group:dataset']);

    resetAllPersisted();
    assert.deepEqual(useExplorerStore.getState().collapsed, {});
  });
});
