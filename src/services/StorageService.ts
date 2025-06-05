// src/services/StorageService.ts

class StorageService {
  private memoryStore: Map<string, string> | null = null;

  constructor() {
    if (typeof localStorage === 'undefined') {
      this.memoryStore = new Map<string, string>();
      console.warn('localStorage is not available. Using in-memory fallback for StorageService.');
    }
  }
  public get(key: string): string | null {
    if (this.memoryStore) {
      return this.memoryStore.get(key) || null;
    } else {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error('Error getting item from localStorage:', e);
        return null;
      }
    }
  }

  public set(key: string, value: string): void {
    if (this.memoryStore) {
      this.memoryStore.set(key, value);
    } else {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.error('Error setting item in localStorage:', e);
      }
    }
  }

  public remove(key: string): void {
    if (this.memoryStore) {
      this.memoryStore.delete(key);
    } else {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('Error removing item from localStorage:', e);
      }
    }
  }
}

export default new StorageService();
