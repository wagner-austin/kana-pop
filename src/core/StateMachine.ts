export interface State {
  enter?(): void;
  update?(dt: number): void;
  exit?(): void;
}

export default class StateMachine {
  private states = new Map<string, State>();
  private current?: State;

  add(name: string, s: State) { this.states.set(name, s); return this; }

  change(name: string) {
    this.current?.exit?.();
    this.current = this.states.get(name);
    this.current?.enter?.();
  }
  update(dt: number) { this.current?.update?.(dt); }
}
