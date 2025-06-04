import Logger from '../utils/Logger';
const log = new Logger('SM');

export interface State {
  enter?(): void;
  update?(dt: number): void;
  exit?(): void;
}

export default class StateMachine {
  private states = new Map<string, State>();
  private current?: State;
  private currentName?: string;

  add(name: string, s: State) { this.states.set(name, s); return this; }

  change(name: string) {
    log.info('→ change', { from: this.currentName, to: name });
    this.current?.exit?.();
    this.current = this.states.get(name);
    this.currentName = name;
    this.current?.enter?.();
  }
  update(dt: number) { this.current?.update?.(dt); }

  get currentStateName(): string | undefined {
    return this.currentName;
  }
}
