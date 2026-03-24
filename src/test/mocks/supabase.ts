/**
 * Mock Supabase client for testing
 * Provides in-memory database simulation
 */

import { vi } from 'vitest';

// Mock data store
const mockDataStore = {
  profiles: new Map(),
  practice_sessions: new Map(),
  custom_chords: new Map(),
  user_settings: new Map(),
  achievements: new Map(),
};

// Mock Supabase client
export const createMockSupabaseClient = () => ({
  from: vi.fn((table: string) => ({
    select: vi.fn((query?: string) => ({
      eq: vi.fn((column: string, value: any) => ({
        single: vi.fn(() => ({
          data: mockDataStore[table as keyof typeof mockDataStore].get(value),
          error: null,
        })),
        data: Array.from(mockDataStore[table as keyof typeof mockDataStore].values()),
        error: null,
      })),
      order: vi.fn(() => ({
        limit: vi.fn(() => ({
          data: Array.from(mockDataStore[table as keyof typeof mockDataStore].values()),
          error: null,
        })),
      })),
      data: Array.from(mockDataStore[table as keyof typeof mockDataStore].values()),
      error: null,
    })),
    insert: vi.fn((data: any) => ({
      select: vi.fn(() => ({
        single: vi.fn(() => {
          const id = crypto.randomUUID();
          const record = { ...data, id };
          mockDataStore[table as keyof typeof mockDataStore].set(id, record);
          return { data: record, error: null };
        }),
      })),
    })),
    update: vi.fn((data: any) => ({
      eq: vi.fn((column: string, value: any) => ({
        select: vi.fn(() => ({
          single: vi.fn(() => {
            const existing = mockDataStore[table as keyof typeof mockDataStore].get(value);
            const updated = { ...existing, ...data };
            mockDataStore[table as keyof typeof mockDataStore].set(value, updated);
            return { data: updated, error: null };
          }),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn((column: string, value: any) => {
        mockDataStore[table as keyof typeof mockDataStore].delete(value);
        return { data: null, error: null };
      }),
    })),
  })),
  auth: {
    signUp: vi.fn((credentials: any) => ({
      data: { user: { id: 'mock-user-id', email: credentials.email }, session: {} },
      error: null,
    })),
    signInWithPassword: vi.fn((credentials: any) => ({
      data: { user: { id: 'mock-user-id', email: credentials.email }, session: {} },
      error: null,
    })),
    signOut: vi.fn(() => ({ error: null })),
    getSession: vi.fn(() => ({
      data: { session: { user: { id: 'mock-user-id' } } },
      error: null,
    })),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  storage: {
    from: vi.fn((bucket: string) => ({
      upload: vi.fn(() => ({
        data: { path: 'mock-path' },
        error: null,
      })),
      getPublicUrl: vi.fn((path: string) => ({
        data: { publicUrl: `https://mock-storage.com/${bucket}/${path}` },
      })),
    })),
  },
  functions: {
    invoke: vi.fn((functionName: string, options?: any) => ({
      data: { success: true },
      error: null,
    })),
  },
});

// Helper to reset mock data
export const resetMockData = () => {
  Object.keys(mockDataStore).forEach(key => {
    mockDataStore[key as keyof typeof mockDataStore].clear();
  });
};

// Helper to seed mock data
export const seedMockData = (table: keyof typeof mockDataStore, data: any[]) => {
  data.forEach(item => {
    mockDataStore[table].set(item.id, item);
  });
};
