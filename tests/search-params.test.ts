import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parsePanels, togglePanel } from '../src/lib/plugin-system/search-params.ts';
import { createRegistry } from '../src/lib/plugin-system/registry.ts';
import {
  getItemTypes,
  itemKey,
  parseItem,
  validateDetailSearch,
} from '../src/contracts/workspace.ts';

const Icon = () => null;

describe('generic panel search params', () => {
  it('parses and toggles comma-separated panel IDs', () => {
    assert.deepEqual(parsePanels(undefined), []);
    assert.deepEqual(parsePanels('agent,,outline'), ['agent', 'outline']);
    assert.equal(togglePanel(undefined, 'agent'), 'agent');
    assert.equal(togglePanel('agent', 'agent'), undefined);
    assert.equal(togglePanel('agent', 'outline'), 'agent,outline');
    assert.equal(togglePanel('agent,outline', 'agent'), 'outline');
  });
});

describe('workspace contract', () => {
  it('parses valid type:id item keys and rejects malformed keys', () => {
    assert.deepEqual(parseItem(itemKey('file', 'utils')), { type: 'file', id: 'utils' });
    assert.deepEqual(parseItem('file:dir:nested'), { type: 'file', id: 'dir:nested' });
    assert.equal(parseItem(undefined), undefined);
    assert.equal(parseItem(''), undefined);
    assert.equal(parseItem('abc'), undefined);
    assert.equal(parseItem(':id'), undefined);
    assert.equal(parseItem('file:'), undefined);
  });

  it('validates detail search params cleanly', () => {
    assert.deepEqual(validateDetailSearch({ item: 'file:utils', panels: 'agent' }), {
      item: 'file:utils',
      panels: 'agent',
    });
    assert.deepEqual(validateDetailSearch({ item: 'bad', panels: '' }), {
      item: undefined,
      panels: undefined,
    });
    assert.deepEqual(validateDetailSearch({ item: 'file:', panels: 123 }), {
      item: undefined,
      panels: undefined,
    });
  });

  it('indexes plugin itemTypes and rejects duplicates', () => {
    const ok = createRegistry([
      { id: 'p1', itemTypes: [{ type: 'file', label: 'File', icon: Icon }] },
      { id: 'p2', itemTypes: [{ type: 'dataset', label: 'Dataset', icon: Icon }] },
    ]);
    const types = getItemTypes(ok);
    assert.deepEqual([...types.keys()], ['file', 'dataset']);
    assert.equal(getItemTypes(ok), types); // cached per Registry

    const dup = createRegistry([
      { id: 'p1', itemTypes: [{ type: 'file', label: 'File', icon: Icon }] },
      { id: 'p2', itemTypes: [{ type: 'file', label: 'Duplicate', icon: Icon }] },
    ]);
    assert.throws(() => getItemTypes(dup), /Duplicate item type "file"/);
  });
});
