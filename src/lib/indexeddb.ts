
/**
 * IndexedDB wrapper for offline-first data storage
 * Stores large practice data sets locally for offline access
 */

import { logger } from './logger';

const DB_NAME = 'FretMasterDB';
const DB_VERSION = 1;

interface DBStores {
  practiceSessions: 'practiceSessions';
  customChords: 'customChords';
  offlineQueue: 'offlineQueue';
  settings: 'settings';
}

const STORES: DBStores = {
  practiceSessions: 'practiceSessions',
  customChords: 'customChords',
  offlineQueue: 'offlineQueue',
  settings: 'settings',
};

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private initFailed = false;

  /**
   * Initialize IndexedDB connection
   */
  async init(): Promise<void> {
    // Return existing initialization promise if in progress
    if (this.initPromise) {
      return this.initPromise;
    }
    
    // Don't retry if previous init failed
    if (this.initFailed) {
      logger.warn('IndexedDB initialization previously failed, operations will be skipped');
      return Promise.resolve();
    }
    
    this.initPromise = new Promise((resolve, reject) => { // FIX: Assign the new Promise to this.initPromise
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error('Failed to open IndexedDB', request.error);
        this.initFailed = true;
        this.initPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.info('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains(STORES.practiceSessions)) {
          const practiceStore = db.createObjectStore(STORES.practiceSessions, { keyPath: 'id' });
          practiceStore.createIndex('user_id', 'user_id', { unique: false });
          practiceStore.createIndex('started_at', 'started_at', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.customChords)) {
          const chordsStore = db.createObjectStore(STORES.customChords, { keyPath: 'id' });
          chordsStore.createIndex('user_id', 'user_id', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.offlineQueue)) {
          const queueStore = db.createObjectStore(STORES.offlineQueue, { 
            keyPath: 'id',
            autoIncrement: true 
          });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          queueStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.settings)) {
          db.createObjectStore(STORES.settings, { keyPath: 'user_id' });
        }

        logger.info('IndexedDB schema upgraded');
      };
    });
    return this.initPromise; // FIX: Return the assigned promise
  }

  /**
   * Get item from store
   */
  async get<T>(storeName: keyof DBStores, key: string): Promise<T | null> {
    if (!this.db) {
      try {
        await this.init();
      } catch (error) {
        logger.warn('IndexedDB unavailable, returning null');
        return null;
      }
    }
    
    if (this.initFailed || !this.db) {
      return null;
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => {
        logger.error('IndexedDB get error', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all items from store
   */
  async getAll<T>(storeName: keyof DBStores): Promise<T[]> {
    if (!this.db) {
      try {
        await this.init();
      } catch (error) {
        logger.warn('IndexedDB unavailable, returning empty array');
        return [];
      }
    }
    
    if (this.initFailed || !this.db) {
      return [];
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        logger.error('IndexedDB getAll error', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get items by index
   */
  async getByIndex<T>(
    storeName: keyof DBStores, 
    indexName: string, 
    value: any
  ): Promise<T[]> {
    if (!this.db) {
      try {
        await this.init();
      } catch (error) {
        logger.warn('IndexedDB unavailable, returning empty array');
        return [];
      }
    }
    
    if (this.initFailed || !this.db) {
      return [];
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        logger.error('IndexedDB getByIndex error', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Put item into store
   */
  async put(storeName: keyof DBStores, item: any): Promise<void> {
    if (!this.db) {
      try {
        await this.init();
      } catch (error) {
        logger.warn('IndexedDB unavailable, skipping put operation');
        return;
      }
    }
    
    if (this.initFailed || !this.db) {
      logger.warn('IndexedDB unavailable, operation skipped');
      return;
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        logger.error('IndexedDB put error', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete item from store
   */
  async delete(storeName: keyof DBStores, key: string): Promise<void> {
    if (!this.db) {
      try {
        await this.init();
      } catch (error) {
        logger.warn('IndexedDB unavailable, skipping delete operation');
        return;
      }
    }
    
    if (this.initFailed || !this.db) {
      return;
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        logger.error('IndexedDB delete error', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all items from store
   */
  async clear(storeName: keyof DBStores): Promise<void> {
    if (!this.db) {
      try {
        await this.init();
      } catch (error) {
        logger.warn('IndexedDB unavailable, skipping clear operation');
        return;
      }
    }
    
    if (this.initFailed || !this.db) {
      return;
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => {
        logger.error('IndexedDB clear error', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Add item to offline sync queue
   */
  async queueOfflineAction(action: {
    type: 'create' | 'update' | 'delete';
    storeName: string;
    data: any;
  }): Promise<void> {
    await this.put(STORES.offlineQueue, {
      ...action,
      timestamp: Date.now(),
      synced: false,
    });
    logger.info('Action queued for offline sync', action);
  }

  /**
   * Get all unsynced offline actions
   */
  async getUnsyncedActions(): Promise<any[]> {
    return this.getByIndex(STORES.offlineQueue, 'synced', false);
  }

  /**
   * Mark action as synced
   */
  async markActionSynced(actionId: number): Promise<void> {
    const action = await this.get(STORES.offlineQueue, String(actionId));
    if (action) {
      await this.put(STORES.offlineQueue, { ...action, synced: true });
    }
  }
}

export const indexedDB = new IndexedDBManager();
