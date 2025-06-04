// ── src/utils/Logger.ts ───────────────────────────────────────────────
import { TEXT_COLOUR_DARK } from '../constants';
type Level = 'debug' | 'info' | 'warn' | 'error';

const COLORS: Record<Level, string> = {
  debug: TEXT_COLOUR_DARK,
  info : '#2b90d9',
  warn : '#f6a800',
  error: '#e54242'
};

// Disable completely in prod – Vite drops the whole file when tree-shaken.
const ACTIVE = import.meta.env.DEV;

// Filtering logic from section 3
const MIN_LEVEL: Level = (localStorage.getItem('logLevel') as Level) ?? 'debug';
const ORDER: Record<Level, number> = { debug:0, info:1, warn:2, error:3 };

export default class Logger {
  constructor(private ns: string) {}

  private out(level: Level, ...args: unknown[]) {
    if (!ACTIVE) return;
    // Filtering logic from section 3
    if (ORDER[level] < ORDER[MIN_LEVEL]) return;

    const timeParts = new Date().toISOString().split('T');
    const time = timeParts.length > 1 && timeParts[1] ? timeParts[1].slice(0, 8) : '00:00:00';
    console.log(
      `%c${time} %c${this.ns} %c${level.toUpperCase()}`,
      'color:#999;font-size:0.8em',
      'color:#fff;background:#555;padding:0 4px;border-radius:2px',
      `color:${COLORS[level]};font-weight:bold`,
      ...args
    );
  }

  debug(...a: unknown[]) { this.out('debug', ...a); }
  info (...a: unknown[]) { this.out('info',  ...a); }
  warn (...a: unknown[]) { this.out('warn',  ...a); }
  error(...a: unknown[]) { this.out('error', ...a); }
}
