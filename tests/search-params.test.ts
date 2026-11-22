import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { itemKey, parseItem, parsePanels, togglePanel } from '@/lib/plugin-system';
import { indexItems, validateDetailSearch } from '../src/features/workspace/lib/search.ts';

describe('search-params & workspace search helpers', () => {
  it('parses valid type:id item keys and rejects malformed keys', () => {
    assert.deepEqual(parseItem(itemKey('file', 'utils')), { type: 'file', id: 'utils' });
    assert.deepEqual(parseItem('file:dir:nested'), { type: 'file', id: 'dir:nested' });
    assert.equal(parseItem(undefined), undefined);
    assert.equal(parseItem(''), undefined);
    assert.equal(parseItem('abc'), undefined);
    assert.equal(parseItem(':id'), undefined);
    assert.equal(parseItem('file:'), undefined);
  });

  it('validates workspace detail search params cleanly', () => {
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

  it('parses and toggles comma-separated panel IDs', () => {
    assert.deepEqual(parsePanels(undefined), []);
    assert.deepEqual(parsePanels('agent,,outline'), ['agent', 'outline']);
    assert.equal(togglePanel(undefined, 'agent'), 'agent');
    assert.equal(togglePanel('agent', 'agent'), undefined);
    assert.equal(togglePanel('agent', 'outline'), 'agent,outline');
    assert.equal(togglePanel('agent,outline', 'agent'), 'outline');
  });

  it('caches item lookup maps per workspace items array reference', () => {
    const ws = {
      id: 'acme',
      name: 'Acme',
      items: [{ id: 'utils', type: 'file', name: 'utils.ts', parentId: null }],
    };
    const first = indexItems(ws);
    const second = indexItems(ws);
    assert.equal(first, second);
    assert.equal(first.byId.get('utils')?.name, 'utils.ts');
    assert.equal(first.byKey.get('file:utils')?.name, 'utils.ts');
  });
});
