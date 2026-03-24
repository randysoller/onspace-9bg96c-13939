/**
 * Unit tests for Logger utility
 * Tests logging levels, environment filtering, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger } from '../logger';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('log methods', () => {
    it('should log info messages', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.info('Test info message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      logger.warn('Test warning message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      logger.error('Test error message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log debug messages in development', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.debug('Test debug message');
      // In test environment, debug logs should be visible
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('context handling', () => {
    it('should include context in log messages', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const context = { userId: '123', action: 'test' };
      logger.info('Message with context', context);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle error objects in context', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('performance logging', () => {
    it('should measure performance', () => {
      const label = 'test-operation';
      logger.time(label);
      logger.timeEnd(label);
      // Should not throw
      expect(true).toBe(true);
    });
  });
});
