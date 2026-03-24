/**
 * Mock implementations for Web Audio API
 * Used in tests that interact with audio features
 */

import { vi } from 'vitest';

export const createMockAudioContext = () => ({
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { 
      value: 440,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    type: 'sine',
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    gain: { 
      value: 1,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
  })),
  createAnalyser: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteTimeDomainData: vi.fn(),
    getFloatTimeDomainData: vi.fn((buffer: Float32Array) => {
      // Simulate silence
      buffer.fill(0);
    }),
  })),
  createBiquadFilter: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    frequency: { value: 440 },
    Q: { value: 1 },
    type: 'lowpass',
  })),
  destination: {},
  currentTime: 0,
  sampleRate: 44100,
  close: vi.fn(),
  resume: vi.fn(),
  suspend: vi.fn(),
  state: 'running',
});

export const createMockMediaStream = () => ({
  getTracks: vi.fn(() => [
    {
      stop: vi.fn(),
      kind: 'audio',
      enabled: true,
    },
  ]),
  getAudioTracks: vi.fn(() => [
    {
      stop: vi.fn(),
      kind: 'audio',
      enabled: true,
    },
  ]),
});

export const mockGetUserMedia = vi.fn().mockResolvedValue(createMockMediaStream());

// Mock pitch detection results
export const mockPitchDetectionResults = {
  silence: { frequency: 0, clarity: 0, note: null },
  eString: { frequency: 82.41, clarity: 0.95, note: 'E' },
  aString: { frequency: 110.0, clarity: 0.92, note: 'A' },
  dString: { frequency: 146.83, clarity: 0.94, note: 'D' },
  gString: { frequency: 196.0, clarity: 0.93, note: 'G' },
  bString: { frequency: 246.94, clarity: 0.91, note: 'B' },
  highEString: { frequency: 329.63, clarity: 0.96, note: 'E' },
};
