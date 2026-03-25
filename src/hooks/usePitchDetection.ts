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

interface UsePitchDetectionOptions {
  enabled?: boolean;
  minFrequency?: number;
  maxFrequency?: number;
  sampleRate?: number;
  clarity?: number;
  updateInterval?: number;
  onPitchDetected?: (data: PitchData) => void;
  useWorklet?: boolean; // Option to force main thread processing
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
 * Custom hook for real-time pitch detection
 */
export function usePitchDetection(options: UsePitchDetectionOptions = {}): PitchDetectionResult {
  const {
    enabled = false,
    minFrequency = 60,
    maxFrequency = 1400,
    sampleRate = 48000,
    clarity = 0.85,
    updateInterval = 100,
    onPitchDetected,
    useWorklet = true,
  } = options;

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
  const frequencySmoother = useRef(new ExponentialMovingAverage(0.25)); // Smooth frequency
  const centsSmoother = useRef(new ExponentialMovingAverage(0.35)); // Smooth cents slightly more
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

    // Apply exponential smoothing to frequency and cents
    const smoothedFrequency = frequencySmoother.current.update(data.frequency);
    const smoothedCents = centsSmoother.current.update(data.note.cents);

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
      
      // Reset smoothers
      frequencySmoother.current.reset();
      centsSmoother.current.reset();
    };
  }, [
    enabled,
    sampleRate,
    minFrequency,
    maxFrequency,
    clarity,
    useWorklet,
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
      });
    }
  }, [minFrequency, maxFrequency, clarity, isDetecting]);

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
