import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { useWorkbench } from '../src/features/workspace/stores/workbench.ts';
import { useShell } from '../src/stores/shell-store.ts';
import { resetAllPersisted } from '../src/stores/persist.ts';

describe('workbench & shell persistence reset', () => {
  it('atomically updates tabs and lastActive on openTab and closeTab', () => {
    resetAllPersisted();

    useWorkbench.getState().openTab('acme', 'file:utils');
    assert.deepEqual(useWorkbench.getState().tabs['acme'], ['file:utils']);
    assert.equal(useWorkbench.getState().lastActive['acme'], 'file:utils');

    useWorkbench.getState().openTab('acme', 'dataset:sales');
    assert.deepEqual(useWorkbench.getState().tabs['acme'], ['file:utils', 'dataset:sales']);
    assert.equal(useWorkbench.getState().lastActive['acme'], 'dataset:sales');

    const next = useWorkbench.getState().closeTab('acme', 'dataset:sales');
    assert.equal(next, 'file:utils');
    assert.equal(useWorkbench.getState().lastActive['acme'], 'file:utils');

    const last = useWorkbench.getState().closeTab('acme', 'file:utils');
    assert.equal(last, null);
    assert.equal(useWorkbench.getState().lastActive['acme'], undefined);
  });

  it('clears remembered shell lastHref when resetAllPersisted runs', () => {
    useShell.getState().rememberHref('workspaces', '/workspaces/acme?item=file:utils');
    assert.equal(useShell.getState().lastHref['workspaces'], '/workspaces/acme?item=file:utils');

    resetAllPersisted();
    assert.deepEqual(useShell.getState().lastHref, {});
  });
});
