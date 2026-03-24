/**
 * LocalStorage management with quota handling and graceful degradation
 * Automatically falls back to memory storage when quota is exceeded
 * Provides monitoring and cleanup utilities for storage optimization
 */

import { logger } from './logger';

interface StorageQuota {
  usage: number;
  quota: number;
  percentage: number;
}

class StorageManager {
  private memoryStorage: Map<string, string> = new Map();
  private usingMemoryFallback = false;

  /**
   * Get storage quota information
   * @returns Storage usage statistics or null if not available
   */
  async getStorageQuota(): Promise<StorageQuota | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentage = quota > 0 ? (usage / quota) * 100 : 0;
        
        return { usage, quota, percentage };
      } catch (error) {
        logger.error('Failed to get storage quota', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Check if localStorage is available and has space
   * @returns True if localStorage is usable
   */
  isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      logger.warn('localStorage not available, using memory fallback');
      this.usingMemoryFallback = true;
      return false;
    }
  }

  /**
   * Set item in storage with quota handling
   * @param key - Storage key
   * @param value - Value to store (will be JSON stringified if object)
   * @returns True if successfully stored
   */
  setItem(key: string, value: any): boolean {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    try {
      if (this.usingMemoryFallback || !this.isLocalStorageAvailable()) {
        this.memoryStorage.set(key, stringValue);
        return true;
      }
      
      localStorage.setItem(key, stringValue);
      return true;
    } catch (error: any) {
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        logger.warn('LocalStorage quota exceeded, falling back to memory storage', { key });
        this.usingMemoryFallback = true;
        this.memoryStorage.set(key, stringValue);
        
        // Try to clean up old data
        this.cleanupOldData();
        
        return true;
      }
      
      logger.error('Failed to set storage item', error);
      return false;
    }
  }

  /**
   * Get item from storage
   * @param key - Storage key
   * @returns Stored value or null if not found
   */
  getItem(key: string): string | null {
    if (this.usingMemoryFallback) {
      return this.memoryStorage.get(key) || null;
    }
    
    try {
      return localStorage.getItem(key);
    } catch (error) {
      logger.error('Failed to get storage item', error);
      return this.memoryStorage.get(key) || null;
    }
  }

  /**
   * Remove item from storage
   * @param key - Storage key
   */
  removeItem(key: string): void {
    this.memoryStorage.delete(key);
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.error('Failed to remove storage item', error);
    }
  }

  /**
   * Clear all storage
   */
  clear(): void {
    this.memoryStorage.clear();
    
    try {
      localStorage.clear();
    } catch (error) {
      logger.error('Failed to clear storage', error);
    }
  }

  /**
   * Get all keys in storage
   * @returns Array of storage keys
   */
  getAllKeys(): string[] {
    const keys = new Set<string>();
    
    // Add memory storage keys
    this.memoryStorage.forEach((_, key) => keys.add(key));
    
    // Add localStorage keys
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.add(key);
      }
    } catch (error) {
      logger.error('Failed to get storage keys', error);
    }
    
    return Array.from(keys);
  }

  /**
   * Clean up old or unnecessary data to free space
   * Removes items older than 30 days that aren't critical
   */
  cleanupOldData(): void {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const keysToRemove: string[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        // Skip critical data
        if (this.isCriticalKey(key)) continue;
        
        const value = localStorage.getItem(key);
        if (!value) continue;
        
        // Check if item has timestamp
        try {
          const parsed = JSON.parse(value);
          if (parsed.timestamp && parsed.timestamp < thirtyDaysAgo) {
            keysToRemove.push(key);
          }
        } catch {
          // Not JSON, skip
        }
      }
      
      // Remove old items
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          logger.info('Removed old storage item', { key });
        } catch (error) {
          logger.error('Failed to remove old item', error);
        }
      });
      
      if (keysToRemove.length > 0) {
        logger.info('Cleaned up old storage data', { removed: keysToRemove.length });
      }
    } catch (error) {
      logger.error('Failed to clean up old data', error);
    }
  }

  /**
   * Check if key is critical and should not be auto-deleted
   * @param key - Storage key
   * @returns True if key is critical
   */
  private isCriticalKey(key: string): boolean {
    const criticalPrefixes = [
      'auth',
      'user',
      'settings',
      'practiceReminderSettings',
      'pushNotificationsEnabled',
    ];
    
    return criticalPrefixes.some(prefix => key.startsWith(prefix));
  }

  /**
   * Check if using memory fallback
   * @returns True if localStorage is unavailable and using memory
   */
  isUsingMemoryFallback(): boolean {
    return this.usingMemoryFallback;
  }

  /**
   * Get storage statistics
   * @returns Storage usage information
   */
  async getStorageStats(): Promise<{
    quota: StorageQuota | null;
    itemCount: number;
    usingMemoryFallback: boolean;
    estimatedSize: number;
  }> {
    const quota = await this.getStorageQuota();
    const keys = this.getAllKeys();
    
    let estimatedSize = 0;
    keys.forEach(key => {
      const value = this.getItem(key);
      if (value) {
        estimatedSize += key.length + value.length;
      }
    });
    
    return {
      quota,
      itemCount: keys.length,
      usingMemoryFallback: this.usingMemoryFallback,
      estimatedSize,
    };
  }
}

// Export singleton instance
export const storageManager = new StorageManager();
