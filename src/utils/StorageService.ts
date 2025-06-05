/**
 * StorageService - A unified storage wrapper that safely handles browser/test/server environments
 *
 * This service provides safe access to localStorage with graceful fallbacks:
 * - Uses localStorage when available (browser)
 * - Falls back to in-memory Map when localStorage is unavailable (Node/tests)
 * - Handles Safari private mode exceptions
 */

import Logger from './Logger';

const log = new Logger('Storage');

class StorageService {
  private readonly storage: Storage | Map<string, string>;
  private isNative: boolean = false;

  constructor() {
    this.storage = this.detectStorage();
  }

  /**
   * Detects available storage, falling back to in-memory when necessary
   */
  private detectStorage(): Storage | Map<string, string> {
    // Check if we're in a browser environment and localStorage is available
    if (typeof window !== 'undefined' && typeof localStorage === 'object') {
      try {
        // Test localStorage functionality (Safari private mode detection)
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);

        log.debug('Using native localStorage');
        this.isNative = true;
        return localStorage;
      } catch (e) {
        log.warn(
          'localStorage detected but unavailable (Safari private mode?), using memory storage',
          e,
        );
      }
    } else {
      log.info('No localStorage available (Node/test environment), using memory storage');
    }

    // Fallback to Map-based implementation
    return new Map<string, string>();
  }

  /**
   * Gets a value from storage by key
   * @param key The key to retrieve
   * @returns The stored value, or null if not found
   */
  get(key: string): string | null {
    if (this.isNative) {
      return (this.storage as Storage).getItem(key);
    }

    const map = this.storage as Map<string, string>;
    return map.has(key) ? map.get(key)! : null;
  }

  /**
   * Stores a value in storage
   * @param key The key to store under
   * @param value The value to store
   */
  set(key: string, value: string): void {
    if (this.isNative) {
      (this.storage as Storage).setItem(key, value);
    } else {
      (this.storage as Map<string, string>).set(key, value);
    }
  }

  /**
   * Removes a value from storage
   * @param key The key to remove
   */
  remove(key: string): void {
    if (this.isNative) {
      (this.storage as Storage).removeItem(key);
    } else {
      (this.storage as Map<string, string>).delete(key);
    }
  }

  /**
   * Clears all values from storage
   */
  clear(): void {
    if (this.isNative) {
      (this.storage as Storage).clear();
    } else {
      (this.storage as Map<string, string>).clear();
    }
  }
}

// Export a singleton instance
export default new StorageService();
