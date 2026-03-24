/**
 * Unit tests for StorageManager
 * Tests quota handling, fallback mechanisms, and cleanup utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageManager } from '../storage-manager';

describe('StorageManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('setItem and getItem', () => {
    it('should store and retrieve string values', () => {
      storageManager.setItem('test-key', 'test-value');
      const value = storageManager.getItem('test-key');
      expect(value).toBe('test-value');
    });

    it('should store and retrieve object values', () => {
      const testObj = { name: 'test', count: 42 };
      storageManager.setItem('test-obj', testObj);
      const value = storageManager.getItem('test-obj');
      expect(JSON.parse(value!)).toEqual(testObj);
    });

    it('should return null for non-existent keys', () => {
      const value = storageManager.getItem('non-existent');
      expect(value).toBeNull();
    });
  });

  describe('removeItem', () => {
    it('should remove items from storage', () => {
      storageManager.setItem('test-key', 'test-value');
      expect(storageManager.getItem('test-key')).toBe('test-value');
      
      storageManager.removeItem('test-key');
      expect(storageManager.getItem('test-key')).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all storage', () => {
      storageManager.setItem('key1', 'value1');
      storageManager.setItem('key2', 'value2');
      
      storageManager.clear();
      
      expect(storageManager.getItem('key1')).toBeNull();
      expect(storageManager.getItem('key2')).toBeNull();
    });
  });

  describe('getAllKeys', () => {
    it('should return all storage keys', () => {
      storageManager.setItem('key1', 'value1');
      storageManager.setItem('key2', 'value2');
      storageManager.setItem('key3', 'value3');
      
      const keys = storageManager.getAllKeys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });
  });

  describe('quota handling', () => {
    it('should fallback to memory storage when quota exceeded', () => {
      // Mock localStorage.setItem to throw QuotaExceededError
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        const error: any = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        error.code = 22;
        throw error;
      });

      // This should fallback to memory storage
      const result = storageManager.setItem('test-key', 'test-value');
      expect(result).toBe(true);
      expect(storageManager.isUsingMemoryFallback()).toBe(true);
      
      // Should still be able to retrieve from memory
      const value = storageManager.getItem('test-key');
      expect(value).toBe('test-value');

      // Restore
      localStorage.setItem = originalSetItem;
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', async () => {
      storageManager.setItem('key1', 'value1');
      storageManager.setItem('key2', 'value2');
      
      const stats = await storageManager.getStorageStats();
      
      expect(stats.itemCount).toBeGreaterThanOrEqual(2);
      expect(stats.estimatedSize).toBeGreaterThan(0);
      expect(typeof stats.usingMemoryFallback).toBe('boolean');
    });
  });

  describe('isLocalStorageAvailable', () => {
    it('should detect localStorage availability', () => {
      const isAvailable = storageManager.isLocalStorageAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });
  });
});
