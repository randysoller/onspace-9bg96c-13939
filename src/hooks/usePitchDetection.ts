/**
 * Custom hook for pitch detection using YIN algorithm
 * Optimized for mobile browsers with proper AudioContext lifecycle management
 * 
 * @example
 * ```tsx
 * const { frequency, note, cents, clarity, isDetecting } = usePitchDetection({
 *   enabled: true,
 *   onPitchDetected: (data) => console.log(data),
 * });
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';
import type { PitchData } from '@/lib/audio/pitch-detection-worklet';
import { detectDeviceCapabilities } from '@/lib/audio/device-detection';

interface UsePitchDetectionOptions {
  enabled?: boolean;
  minFrequency?: number;
  maxFrequency?: number;
  threshold?: number; // YIN threshold (0.1-0.3, lower = stricter)
  updateInterval?: number;
  onPitchDetected?: (data: PitchData) => void;
  calibrationHz?: number;
  noiseGateThreshold?: number;
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
  audioLevel: number;
  isAboveNoiseGate: boolean;
  calibrationSuggestion: {
    averageRatio: number;
    recommendedCalibrationHz: number;
  } | null;
}

/**
 * Kalman Filter for optimal frequency smoothing
 * Better than EMA for tracking with minimal lag
 */
class KalmanFilter {
  private x: number = 0; // Estimated frequency
  private p: number = 1; // Estimation error covariance
  private q: number = 0.01; // Process noise (how much we trust new measurements)
  private r: number = 0.1; // Measurement noise (sensor accuracy)
  private isInitialized: boolean = false;

  update(measurement: number): number {
    if (!this.isInitialized) {
      this.x = measurement;
      this.isInitialized = true;
      return this.x;
    }

    // Prediction
    const p_pred = this.p + this.q;

    // Update
    const k = p_pred / (p_pred + this.r); // Kalman gain
    this.x = this.x + k * (measurement - this.x);
    this.p = (1 - k) * p_pred;

    return this.x;
  }

  reset(): void {
    this.x = 0;
    this.p = 1;
    this.isInitialized = false;
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

export function usePitchDetection(options: UsePitchDetectionOptions = {}): PitchDetectionResult {
  const {
    enabled = false,
    minFrequency = 70,
    maxFrequency = 400,
    threshold = 0.15, // YIN default threshold
    updateInterval = 50,
    onPitchDetected,
    calibrationHz = 440,
    noiseGateThreshold = 0.01,
  } = options;

  // Device capabilities
  const deviceCaps = detectDeviceCapabilities();

  // State
  const [frequency, setFrequency] = useState(0);
  const [note, setNote] = useState('');
  const [octave, setOctave] = useState(0);
  const [cents, setCents] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isAboveNoiseGate, setIsAboveNoiseGate] = useState(false);
  const [calibrationSuggestion, setCalibrationSuggestion] = useState<{
    averageRatio: number;
    recommendedCalibrationHz: number;
  } | null>(null);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastUpdateRef = useRef(0);
  
  // Filters
  const frequencyMedian = useRef(new MedianFilter(3));
  const frequencyKalman = useRef(new KalmanFilter());
  const centsMedian = useRef(new MedianFilter(3));
  const centsKalman = useRef(new KalmanFilter());

  /**
   * Handle audio level updates
   */
  const handleAudioLevelUpdate = useCallback((level: number) => {
    setAudioLevel(level);
    setIsAboveNoiseGate(level >= noiseGateThreshold);
  }, [noiseGateThreshold]);

  /**
   * Handle pitch updates with adaptive filtering
   */
  const handlePitchUpdate = useCallback((data: PitchData & { audioLevel?: number }) => {
    const now = performance.now();
    
    // Update audio level
    if (data.audioLevel !== undefined) {
      handleAudioLevelUpdate(data.audioLevel);
    }
    
    // Throttle updates
    if (now - lastUpdateRef.current < updateInterval) {
      return;
    }
    lastUpdateRef.current = now;

    // Noise gate check
    if (data.audioLevel !== undefined && data.audioLevel < noiseGateThreshold) {
      setFrequency(0);
      setNote('');
      setOctave(0);
      setCents(0);
      setClarity(0);
      return;
    }

    // Apply median filter → Kalman filter for optimal smoothing
    const medianFreq = frequencyMedian.current.update(data.frequency);
    const smoothedFreq = frequencyKalman.current.update(medianFreq);
    
    const medianCents = centsMedian.current.update(data.note.cents);
    const smoothedCents = centsKalman.current.update(medianCents);

    // Update state
    setFrequency(smoothedFreq);
    setCents(Math.round(smoothedCents));
    setNote(data.note.name);
    setOctave(data.note.octave);
    setClarity(data.clarity);

    // Callback
    if (onPitchDetected) {
      onPitchDetected({
        ...data,
        frequency: smoothedFreq,
        note: {
          ...data.note,
          cents: Math.round(smoothedCents),
        },
      });
    }
  }, [updateInterval, noiseGateThreshold, onPitchDetected, handleAudioLevelUpdate]);

  /**
   * Handle performance stats
   */
  const handlePerformanceUpdate = useCallback((stats: any) => {
    setPerformanceStats(stats);
    logger.debug('Pitch detection performance', {
      avgProcessTime: `${stats.avgProcessTime.toFixed(2)}ms`,
      processCount: stats.processCount,
      skipCount: stats.skipCount,
    });
  }, []);

  /**
   * Resume suspended AudioContext (iOS Safari workaround)
   */
  const resumeAudioContext = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
        logger.info('AudioContext resumed');
      } catch (err) {
        logger.error('Failed to resume AudioContext', err);
      }
    }
  }, []);

  /**
   * Initialize pitch detection
   */
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let mounted = true;

    const initialize = async () => {
      try {
        // Request microphone with optimal settings
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            // Don't specify sampleRate - let browser choose
            // We'll detect the actual rate and adapt
          },
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        // Create AudioContext without forcing sample rate
        // CRITICAL: Let browser choose optimal rate, then detect it
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
          latencyHint: 'interactive',
        });

        audioContextRef.current = audioContext;

        // CRITICAL: Get ACTUAL sample rate (might differ from requested)
        const actualSampleRate = audioContext.sampleRate;
        logger.info('AudioContext created', {
          requestedSampleRate: deviceCaps.recommendedSampleRate,
          actualSampleRate: actualSampleRate,
          mismatch: actualSampleRate !== deviceCaps.recommendedSampleRate,
        });

        // Load YIN worklet
        await audioContext.audioWorklet.addModule('/yin-pitch-detector.js');

        // CRITICAL: Calculate optimal buffer size for ACTUAL sample rate
        const periodsRequired = 4;
        const minBufferSize = Math.ceil((periodsRequired / minFrequency) * actualSampleRate);
        const optimalBufferSize = Math.pow(2, Math.ceil(Math.log2(minBufferSize)));
        const clampedBufferSize = Math.max(4096, Math.min(16384, optimalBufferSize));

        // Create worklet node with ACTUAL sample rate
        const workletNode = new AudioWorkletNode(audioContext, 'yin-pitch-detector', {
          numberOfInputs: 1,
          numberOfOutputs: 0,
          processorOptions: {
            sampleRate: actualSampleRate, // Use actual, not requested
            minFrequency,
            maxFrequency,
            threshold,
            bufferSize: clampedBufferSize,
            calibrationHz,
            noiseGateThreshold,
          },
        });

        workletNodeRef.current = workletNode;

        // Listen for messages from worklet
        workletNode.port.onmessage = (event) => {
          if (event.data.type === 'pitch') {
            handlePitchUpdate(event.data);
          } else if (event.data.type === 'performance') {
            handlePerformanceUpdate(event.data);
          } else if (event.data.type === 'audioLevel') {
            handleAudioLevelUpdate(event.data.level);
          } else if (event.data.type === 'actualSampleRate') {
            const mismatch = event.data.sampleRate !== actualSampleRate;
            logger.info('Worklet sample rate verification', {
              workletRate: event.data.sampleRate,
              contextRate: actualSampleRate,
              globalRate: event.data.globalSampleRate,
              match: !mismatch,
            });
            if (mismatch) {
              logger.warn('Sample rate mismatch detected!', {
                expected: actualSampleRate,
                actual: event.data.sampleRate,
                errorPercent: ((event.data.sampleRate / actualSampleRate - 1) * 100).toFixed(2) + '%',
              });
            }
          } else if (event.data.type === 'calibrationSuggestion') {
            setCalibrationSuggestion({
              averageRatio: event.data.averageRatio,
              recommendedCalibrationHz: event.data.recommendedCalibrationHz,
            });
            logger.warn('Auto-calibration suggested', {
              offset: ((event.data.averageRatio - 1) * 100).toFixed(2) + '%',
              currentCal: calibrationHz,
              recommended: event.data.recommendedCalibrationHz,
            });
          } else if (event.data.type === 'debug') {
            logger.debug('YIN debug', event.data);
          }
        };

        // Create source and connect
        const source = audioContext.createMediaStreamSource(stream);
        sourceNodeRef.current = source;
        source.connect(workletNode);

        // Resume context if suspended (iOS Safari)
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        setIsDetecting(true);
        setError(null);

        logger.info('YIN pitch detection initialized', {
          requestedSampleRate: deviceCaps.recommendedSampleRate,
          actualSampleRate: actualSampleRate,
          bufferSize: clampedBufferSize,
          calculatedBufferSize: optimalBufferSize,
          isMobile: deviceCaps.isMobile,
          threshold,
          minFrequency,
          maxFrequency,
        });

        // Add visibility change listener to handle tab switching
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            resumeAudioContext();
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup visibility listener
        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      } catch (err) {
        if (!mounted) return;

        const message = err instanceof Error ? err.message : 'Failed to initialize pitch detection';
        logger.error('Pitch detection initialization failed', err);
        setError(message);
        setIsDetecting(false);
      }
    };

    const cleanup = initialize();

    // Cleanup on unmount
    return () => {
      mounted = false;
      cleanup?.then(cleanupFn => cleanupFn?.());

      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }

      if (workletNodeRef.current) {
        workletNodeRef.current.disconnect();
        workletNodeRef.current.port.onmessage = null;
        workletNodeRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
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
      setClarity(0);
      setAudioLevel(0);
      setIsAboveNoiseGate(false);

      // Reset filters
      frequencyMedian.current.reset();
      frequencyKalman.current.reset();
      centsMedian.current.reset();
      centsKalman.current.reset();
    };
  }, [
    enabled,
    minFrequency,
    maxFrequency,
    threshold,
    calibrationHz,
    noiseGateThreshold,
    handlePitchUpdate,
    handlePerformanceUpdate,
    handleAudioLevelUpdate,
    resumeAudioContext,
  ]);

  /**
   * Update worklet config when parameters change
   */
  useEffect(() => {
    if (workletNodeRef.current && isDetecting) {
      workletNodeRef.current.port.postMessage({
        type: 'config',
        minFrequency,
        maxFrequency,
        threshold,
        calibrationHz,
        noiseGateThreshold,
      });
    }
  }, [minFrequency, maxFrequency, threshold, calibrationHz, noiseGateThreshold, isDetecting]);

  return {
    frequency,
    note,
    octave,
    cents,
    clarity,
    isDetecting,
    error,
    performanceStats,
    audioLevel,
    isAboveNoiseGate,
    calibrationSuggestion,
  };
}
