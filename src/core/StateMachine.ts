import Logger from '../utils/Logger';
const log = new Logger('SM');

export interface State {
  /** may return a Promise – caller must await */
  enter?(): void | Promise<void>;
  update?(dt: number): void;
  exit?(): void;
}

export default class StateMachine {
  private states = new Map<string, State>();
  private current?: State;
  private currentName?: string;
  /** simple overlay stack (bottom = gameplay, top = modal) */
  private stack: State[] = [];

  add(name: string, s: State) {
    this.states.set(name, s);
    return this;
  }

  /** replace current state */
  async change(name: string) {
    log.info('→ change', { from: this.currentName, to: name });
    if (this.current?.exit) this.current.exit();
    this.current = this.states.get(name);
    this.currentName = name;
    if (this.current?.enter) await this.current.enter();
  }
  update(dt: number) {
    this.current?.update?.(dt);
  }

  get currentStateName(): string | undefined {
    return this.currentName;
  }

  /* ───── optional modal overlay helpers ───── */
  async push(name: string) {
    if (this.current) {
      this.stack.push(this.current);
      if (this.current.exit) this.current.exit();
    }
    this.current = this.states.get(name);
    this.currentName = name;
    if (this.current?.enter) await this.current.enter();
  }

  async pop() {
    if (!this.stack.length) return;
    if (this.current?.exit) this.current.exit();
    this.current = this.stack.pop();
    this.currentName = this.current
      ? [...this.states.entries()].find(([, v]) => v === this.current)?.[0]
      : undefined;
    if (this.current?.enter) await this.current.enter();
  }
}
