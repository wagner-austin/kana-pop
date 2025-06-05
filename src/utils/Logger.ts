// ── src/utils/Logger.ts ───────────────────────────────────────────────
import { TEXT_COLOUR_DARK } from '../constants';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'off';

// Define colors for log levels, excluding 'off' as it won't be printed.
const COLORS: Record<Exclude<LogLevel, 'off'>, string> = {
  debug: TEXT_COLOUR_DARK,
  info: '#2b90d9',
  warn: '#f6a800',
  error: '#e54242',
};

// Logging is active only in development to allow Vite to tree-shake it in production.
const ACTIVE = import.meta.env.DEV;

export default class Logger {
  // Read and cache the log level from localStorage at boot.
  // Defaults to 'info' if no valid level is found.
  public static bootLevel: LogLevel = (() => {
    const raw = localStorage.getItem('logLevel');
    const validLevels: ReadonlyArray<LogLevel> = ['debug', 'info', 'warn', 'error', 'off'];
    // Ensure the stored value is a valid LogLevel.
    if (raw && (validLevels as ReadonlyArray<string>).includes(raw)) {
      return raw as LogLevel;
    }
    return 'info'; // Sensible default.
  })();

  // Static guard for cheap debug checks in hot paths.
  static isDebug = Logger.bootLevel === 'debug';

  // Numerical order for comparing log levels.
  private static levelOrder: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    off: 4, // 'off' is the highest, meaning no logs will be shown if level is 'off'.
  };

  // Constructor accepts a scope and an optional log level, defaulting to bootLevel.
  constructor(
    private scope: string,
    private level: LogLevel = Logger.bootLevel,
  ) {}

  private out(level: Exclude<LogLevel, 'off'>, ...args: unknown[]) {
    if (!ACTIVE) return; // Logging disabled if not in DEV mode.
    if (this.level === 'off') return; // Logger instance is set to 'off'.

    // Only log if the message's level is greater than or equal to this instance's configured level.
    if (Logger.levelOrder[level] < Logger.levelOrder[this.level]) return;

    const timeParts = new Date().toISOString().split('T');
    const time = timeParts.length > 1 && timeParts[1] ? timeParts[1].slice(0, 8) : '00:00:00';
    console.log(
      `%c${time} %c${this.scope} %c${level.toUpperCase()}`,
      'color:#999;font-size:0.8em',
      'color:#fff;background:#555;padding:0 4px;border-radius:2px',
      `color:${COLORS[level]};font-weight:bold`,
      ...args,
    );
  }

  debug(...a: unknown[]) {
    this.out('debug', ...a);
  }
  info(...a: unknown[]) {
    this.out('info', ...a);
  }
  warn(...a: unknown[]) {
    this.out('warn', ...a);
  }
  error(...a: unknown[]) {
    this.out('error', ...a);
  }
}

// --- Global Helper for DevTools ---
declare global {
  interface Window {
    logger: ReturnType<typeof makeRootLogger>;
  }
}

function makeRootLogger() {
  return {
    /**
     * Sets the desired log level in localStorage and reloads the page
     * for the new level to take effect.
     * @param l The log level to set.
     */
    setLevel(l: LogLevel) {
      localStorage.setItem('logLevel', l);
      location.reload();
    },
  };
}

// Expose the logger utility on the window object for easy access from DevTools.
window.logger = makeRootLogger();

export const logLevel = Logger.bootLevel; // so non-class code can read it
