import { describe, it, expect, vi } from 'vitest';
import StateMachine, { State } from '@/core/StateMachine';

describe('StateMachine', () => {
  const enter = vi.fn();
  const update = vi.fn();
  const exit = vi.fn();

  const a: State = { enter, update, exit };
  const b: State = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };

  const sm = new StateMachine().add('a', a).add('b', b);

  it('calls enter() when state is changed', () => {
    sm.change('a');
    expect(enter).toHaveBeenCalledTimes(1);
  });

  it('forwards update(dt) to current state', () => {
    sm.update(0.16);
    expect(update).toHaveBeenCalledWith(0.16);
  });

  it('calls exit() on previous state when changing', () => {
    sm.change('b');
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('exposes currentStateName', () => {
    expect(sm.currentStateName).toBe('b');
  });
});
