import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPluginBridge } from '../src/lib/plugin-system/bridge.ts';

interface CounterSnapshot {
  readonly count: number;
}

interface CounterActions {
  increment(): void;
}

describe('createPluginBridge', () => {
  it('starts empty so consumers degrade safely when a plugin is unmounted or unloaded', () => {
    const useCounterBridge = createPluginBridge<CounterSnapshot, CounterActions>();
    assert.equal(useCounterBridge.getState().current, null);
    assert.equal(useCounterBridge.getState().actions, null);
  });

  it('publishes snapshot and actions independently and clears both on unmount', () => {
    const useCounterBridge = createPluginBridge<CounterSnapshot, CounterActions>();
    let n = 0;

    useCounterBridge.getState().setSnapshot({ count: 3 });
    useCounterBridge.getState().setActions({
      increment: () => {
        n += 1;
      },
    });

    assert.deepEqual(useCounterBridge.getState().current, { count: 3 });
    useCounterBridge.getState().actions?.increment();
    assert.equal(n, 1);

    let notifications = 0;
    const unsub = useCounterBridge.subscribe(() => {
      notifications += 1;
    });
    useCounterBridge.getState().clear();
    assert.equal(useCounterBridge.getState().current, null);
    assert.equal(useCounterBridge.getState().actions, null);
    assert.equal(notifications, 1);

    // Calling clear() again when already empty is a no-op (0 subscriber notifications).
    useCounterBridge.getState().clear();
    assert.equal(notifications, 1);
    unsub();
  });
});
