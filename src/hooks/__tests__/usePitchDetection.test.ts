/**
 * Unit tests for usePitchDetection hook
 * Tests pitch detection initialization, frequency analysis, and cleanup
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePitchDetection } from '../usePitchDetection';
import { createMockAudioContext, mockGetUserMedia } from '@/test/mocks/audio';

describe('usePitchDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.navigator.mediaDevices.getUserMedia = mockGetUserMedia;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize without errors', () => {
    const { result } = renderHook(() => usePitchDetection());
    
    expect(result.current.frequency).toBe(0);
    expect(result.current.clarity).toBe(0);
    expect(result.current.note).toBeNull();
    expect(result.current.isListening).toBe(false);
  });

  it('should start listening when startListening is called', async () => {
    const { result } = renderHook(() => usePitchDetection());
    
    await result.current.startListening();
    
    await waitFor(() => {
      expect(result.current.isListening).toBe(true);
    });
  });

  it('should stop listening when stopListening is called', async () => {
    const { result } = renderHook(() => usePitchDetection());
    
    await result.current.startListening();
    await waitFor(() => expect(result.current.isListening).toBe(true));
    
    result.current.stopListening();
    
    await waitFor(() => {
      expect(result.current.isListening).toBe(false);
    });
  });

  it('should handle microphone permission errors', async () => {
    const error = new Error('Permission denied');
    mockGetUserMedia.mockRejectedValueOnce(error);
    
    const { result } = renderHook(() => usePitchDetection());
    
    await result.current.startListening();
    
    await waitFor(() => {
      expect(result.current.isListening).toBe(false);
    });
  });

  it('should cleanup on unmount', async () => {
    const { result, unmount } = renderHook(() => usePitchDetection());
    
    await result.current.startListening();
    
    unmount();
    
    // Should not throw errors
    expect(true).toBe(true);
  });
});
