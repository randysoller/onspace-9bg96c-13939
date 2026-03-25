/**
 * Custom hook for pitch detection using audio worklet
 * 
 * Uses Audio Worklet for high-performance pitch detection in a separate thread.
 * Falls back to main thread processing if worklets are not supported.
 * 
 * @example
 * ```tsx
 * const { frequency, note, clarity, isDetecting } = usePitchDetection({
 *   enabled: true,
 *   onPitchDetected: (data) => console.log(data),
 * });
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { PitchDetectionWorklet } from '@/lib/audio/pitch-detection-worklet';
import type { PitchData } from '@/lib/audio/pitch-detection-worklet';
import { getGuitarTunerSettings, detectDeviceCapabilities } from '@/lib/audio/device-detection';

interface UsePitchDetectionOptions {
  enabled?: boolean;
  minFrequency?: number;
  maxFrequency?: number;
  sampleRate?: number;
  clarity?: number;
  updateInterval?: number;
  onPitchDetected?: (data: PitchData) => void;
  useWorklet?: boolean; // Option to force main thread processing
  optimizeForGuitar?: boolean; // Use guitar-optimized settings
}

interface PitchDetectionResult {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
  clarity: number;
  isDetecting: boolean;
  error: string | null;
  performanceStats: {
    avgProcessTime: number;
    processCount: number;
  } | null;
}

/**
 * Exponential moving average for smoothing
 */
class ExponentialMovingAverage {
  private value: number | null = null;
  private readonly alpha: number;

  constructor(smoothingFactor: number = 0.3) {
    this.alpha = smoothingFactor; // Lower = smoother
  }

  update(newValue: number): number {
    if (this.value === null) {
      this.value = newValue;
    } else {
      this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
    }
    return this.value;
  }

  reset(): void {
    this.value = null;
  }

  getValue(): number | null {
    return this.value;
  }
}

/**
 * Median filter for removing outliers
 */
class MedianFilter {
  private buffer: number[] = [];
  private readonly size: number;

  constructor(size: number = 5) {
    this.size = size;
  }

  update(value: number): number {
    this.buffer.push(value);
    if (this.buffer.length > this.size) {
      this.buffer.shift();
    }

    // Return median of buffer
    const sorted = [...this.buffer].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  reset(): void {
    this.buffer = [];
  }
}

/**
 * Custom hook for real-time pitch detection
 */
export function usePitchDetection(options: UsePitchDetectionOptions = {}): PitchDetectionResult {
  const {
    enabled = false,
    minFrequency: userMinFreq,
    maxFrequency: userMaxFreq,
    sampleRate: userSampleRate,
    clarity = 0.85,
    updateInterval: userUpdateInterval,
    onPitchDetected,
    useWorklet = true,
    optimizeForGuitar = false,
  } = options;

  // Get optimized settings if requested
  const optimizedSettings = optimizeForGuitar ? getGuitarTunerSettings() : null;
  const deviceCaps = detectDeviceCapabilities();

  // Use optimized settings or user settings
  const minFrequency = userMinFreq ?? optimizedSettings?.minFrequency ?? 60;
  const maxFrequency = userMaxFreq ?? optimizedSettings?.maxFrequency ?? 1400;
  const sampleRate = userSampleRate ?? optimizedSettings?.sampleRate ?? 48000;
  const updateInterval = userUpdateInterval ?? optimizedSettings?.updateInterval ?? 100;
  const bufferSize = optimizedSettings?.bufferSize ?? (deviceCaps.isMobile ? 4096 : 8192);
  const smoothingFactor = optimizedSettings?.smoothingFactor ?? (deviceCaps.isMobile ? 0.3 : 0.2);

  // State
  const [frequency, setFrequency] = useState(0);
  const [note, setNote] = useState('');
  const [octave, setOctave] = useState(0);
  const [cents, setCents] = useState(0);
  const [detectedClarity, setDetectedClarity] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performanceStats, setPerformanceStats] = useState<{
    avgProcessTime: number;
    processCount: number;
  } | null>(null);

  // Refs
  const workletRef = useRef<PitchDetectionWorklet | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastUpdateRef = useRef(0);
  const frequencyMedian = useRef(new MedianFilter(3)); // Remove outliers first
  const frequencySmoother = useRef(new ExponentialMovingAverage(smoothingFactor)); // Then smooth
  const centsMedian = useRef(new MedianFilter(3));
  const centsSmoother = useRef(new ExponentialMovingAverage(smoothingFactor * 1.2)); // Slightly more smoothing for cents
  const isWorkletSupported = useRef(PitchDetectionWorklet.isSupported());

  // Debounced update handler with smoothing
  const handlePitchUpdate = useCallback((data: PitchData) => {
    const now = performance.now();
    
    // Throttle updates based on updateInterval
    if (now - lastUpdateRef.current < updateInterval) {
      return;
    }
    
    lastUpdateRef.current = now;

    // Minimum clarity threshold - don't show unreliable detections
    // Map clarity 0.1-1.0 to minimum threshold (mobile-friendly)
    const minClarityThreshold = Math.max(0.1, clarity * 0.5);
    
    if (data.clarity < minClarityThreshold) {
      // Low clarity - don't update display, but don't reset smoothers
      return;
    }

    // Apply median filter first to remove outliers, then EMA smoothing
    const medianFrequency = frequencyMedian.current.update(data.frequency);
    const smoothedFrequency = frequencySmoother.current.update(medianFrequency);
    
    const medianCents = centsMedian.current.update(data.note.cents);
    const smoothedCents = centsSmoother.current.update(medianCents);

    // Only update if values changed significantly (reduce jitter)
    const freqDelta = Math.abs(smoothedFrequency - frequency);
    const centsDelta = Math.abs(smoothedCents - cents);
    
    // Update frequency if changed by more than 0.5 Hz
    if (freqDelta > 0.5 || frequency === 0) {
      setFrequency(smoothedFrequency);
    }
    
    // Update cents if changed by more than 1 cent
    if (centsDelta > 1 || cents === 0) {
      setCents(Math.round(smoothedCents)); // Round to integer cents
    }
    
    // Always update note/octave/clarity
    setNote(data.note.name);
    setOctave(data.note.octave);
    setDetectedClarity(data.clarity);

    // Call callback if provided
    if (onPitchDetected) {
      onPitchDetected({
        ...data,
        frequency: smoothedFrequency,
        note: {
          ...data.note,
          cents: smoothedCents,
        },
      });
    }
  }, [updateInterval, onPitchDetected, clarity, frequency, cents]);

  // Performance stats handler
  const handlePerformanceUpdate = useCallback((stats: any) => {
    setPerformanceStats({
      avgProcessTime: stats.avgProcessTime,
      processCount: stats.processCount,
    });
    
    logger.debug('Pitch detection performance', {
      avgProcessTime: `${stats.avgProcessTime.toFixed(2)}ms`,
      processCount: stats.processCount,
    });
  }, []);

  // Initialize pitch detection
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let mounted = true;

    const initialize = async () => {
      try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: sampleRate,
          },
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        // Use Audio Worklet if supported and enabled
        if (useWorklet && isWorkletSupported.current) {
          logger.info('Using Audio Worklet for pitch detection');
          
          const worklet = new PitchDetectionWorklet();
          workletRef.current = worklet;

          await worklet.initialize(stream, {
            sampleRate,
            minFrequency,
            maxFrequency,
            clarity,
            bufferSize, // Pass adaptive buffer size
          });

          logger.info('Pitch detection initialized with adaptive settings', {
            bufferSize,
            sampleRate,
            minFrequency,
            maxFrequency,
            isMobile: deviceCaps.isMobile,
            updateInterval,
            smoothingFactor,
          });

          worklet.addPitchListener(handlePitchUpdate);
          worklet.addPerformanceListener(handlePerformanceUpdate);

          setIsDetecting(true);
          setError(null);
        } else {
          // Fallback to main thread processing
          logger.warn('Audio Worklets not supported, using main thread processing');
          setError('Audio Worklets not supported in this browser. Performance may be reduced.');
          
          // TODO: Implement fallback to main thread processing
          // For now, just log the warning
        }
      } catch (err) {
        if (!mounted) return;

        const message = err instanceof Error ? err.message : 'Failed to initialize pitch detection';
        logger.error('Pitch detection initialization failed', err);
        setError(message);
        setIsDetecting(false);
      }
    };

    initialize();

    // Cleanup
    return () => {
      mounted = false;
      
      if (workletRef.current) {
        workletRef.current.cleanup();
        workletRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      setIsDetecting(false);
      setFrequency(0);
      setNote('');
      setOctave(0);
      setCents(0);
      setDetectedClarity(0);
      
      // Reset filters and smoothers
      frequencyMedian.current.reset();
      frequencySmoother.current.reset();
      centsMedian.current.reset();
      centsSmoother.current.reset();
    };
  }, [
    enabled,
    sampleRate,
    minFrequency,
    maxFrequency,
    clarity,
    useWorklet,
    bufferSize,
    handlePitchUpdate,
    handlePerformanceUpdate,
  ]);

  // Update worklet config when parameters change
  useEffect(() => {
    if (workletRef.current && isDetecting) {
      workletRef.current.updateConfig({
        minFrequency,
        maxFrequency,
        clarity,
        bufferSize,
      });
    }
  }, [minFrequency, maxFrequency, clarity, bufferSize, isDetecting]);

  return {
    frequency,
    note,
    octave,
    cents,
    clarity: detectedClarity,
    isDetecting,
    error,
    performanceStats,
  };
}
