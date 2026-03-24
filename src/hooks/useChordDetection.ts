/**
 * Custom hook for real-time guitar chord detection using NSDF pitch detection
 * Analyzes audio input and compares detected notes against target chord
 * 
 * @example
 * ```tsx
 * const targetChord = { symbol: 'C', frets: [null, 3, 2, 0, 1, 0], ... };
 * 
 * const { isListening, result, detectedNotes, startListening, stopListening } = useChordDetection({
 *   targetChord,
 *   sensitivity: 6,
 *   onCorrect: () => {
 *     console.log('Correct chord played!');
 *     playSuccessSound();
 *   },
 *   onWrongDetected: (notes) => {
 *     console.log(`Wrong notes detected: ${notes}`);
 *   },
 * });
 * 
 * return (
 *   <div>
 *     <button onClick={startListening}>Start Detection</button>
 *     {result === 'correct' && <p className="text-green-500">✓ Correct!</p>}
 *     {result === 'wrong' && <p className="text-red-500">✗ Try again</p>}
 *     <p>Detected: {detectedNotes.join(', ')}</p>
 *   </div>
 * );
 * ```
 * 
 * @param options - Configuration options for chord detection
 * @param options.targetChord - The chord to detect (ChordData with frets array)
 * @param options.onCorrect - Callback fired when correct chord is detected
 * @param options.onWrongDetected - Callback fired when wrong notes detected, receives detected note names
 * @param options.sensitivity - Detection sensitivity 1-10, higher = more forgiving (default: 6)
 * @param options.autoStart - If true, starts listening automatically on mount (default: false)
 * @param options.advancedSettings - Optional advanced detection settings (noiseGate, harmonicBoost, fluxTolerance)
 * 
 * @returns Chord detection state and controls
 * @returns isListening - True if microphone is active and analyzing chords
 * @returns result - Detection result: 'correct', 'wrong', or null
 * @returns permissionDenied - True if microphone permission was denied
 * @returns detectedNotes - Array of recently detected note names (last 6 notes)
 * @returns startListening - Function to start chord detection and request microphone access
 * @returns stopListening - Function to stop detection and release microphone
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChordData } from '@/types/chord';

export type DetectionResult = 'correct' | 'wrong' | null;

export interface AdvancedDetectionSettings {
  noiseGate: number;
  harmonicBoost: number;
  fluxTolerance: number;
}

interface UseChordDetectionOptions {
  onCorrect?: () => void;
  onWrongDetected?: (detectedSymbol: string) => void;
  targetChord?: ChordData | null;
  sensitivity?: number;
  autoStart?: boolean;
  advancedSettings?: AdvancedDetectionSettings | null;
}

const STANDARD_TUNING_FREQ = {
  'E2': 82.41, 'A2': 110.00, 'D3': 146.83, 'G3': 196.00, 'B3': 246.94, 'E4': 329.63
};

// NSDF (Normalized Square Difference Function) for pitch detection
function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
  const SIZE = buffer.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  const nsdf = new Float32Array(MAX_SAMPLES);
  
  // Calculate NSDF
  for (let tau = 0; tau < MAX_SAMPLES; tau++) {
    let acf = 0;
    let divisorM = 0;
    
    for (let i = 0; i < MAX_SAMPLES; i++) {
      acf += buffer[i] * buffer[i + tau];
      divisorM += buffer[i] * buffer[i] + buffer[i + tau] * buffer[i + tau];
    }
    
    nsdf[tau] = divisorM > 0 ? (2 * acf) / divisorM : 0;
  }
  
  // Find peaks in NSDF
  const peaks: number[] = [];
  let prevValue = nsdf[0];
  
  for (let i = 1; i < nsdf.length - 1; i++) {
    const currentValue = nsdf[i];
    const nextValue = nsdf[i + 1];
    
    if (currentValue > prevValue && currentValue > nextValue && currentValue > 0) {
      peaks.push(i);
    }
    
    prevValue = currentValue;
  }
  
  // Find the highest peak above threshold
  let bestPeak = -1;
  let bestValue = 0.1; // Threshold
  
  for (const peak of peaks) {
    if (nsdf[peak] > bestValue) {
      bestValue = nsdf[peak];
      bestPeak = peak;
    }
  }
  
  if (bestPeak === -1) return null;
  
  // Parabolic interpolation for better accuracy
  const y1 = nsdf[bestPeak - 1];
  const y2 = nsdf[bestPeak];
  const y3 = nsdf[bestPeak + 1];
  const betterPeak = bestPeak + (y3 - y1) / (2 * (2 * y2 - y1 - y3));
  
  return sampleRate / betterPeak;
}

function getNoteName(frequency: number): string {
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75);
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const halfSteps = Math.round(12 * Math.log2(frequency / C0));
  const octave = Math.floor(halfSteps / 12);
  const note = noteNames[halfSteps % 12];
  
  return `${note}${octave}`;
}

export function useChordDetection({
  onCorrect,
  onWrongDetected,
  targetChord,
  sensitivity = 6,
  autoStart = false,
  advancedSettings = null,
}: UseChordDetectionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<DetectionResult>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [detectedNotes, setDetectedNotes] = useState<string[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const detectionBufferRef = useRef<string[]>([]);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current || !targetChord) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      return;
    }

    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    
    analyser.getFloatTimeDomainData(buffer);
    
    // Apply noise gate
    const noiseGate = advancedSettings?.noiseGate || 0.01;
    const maxAmplitude = Math.max(...buffer.map(Math.abs));
    
    if (maxAmplitude < noiseGate) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      return;
    }
    
    // Detect pitch
    const frequency = detectPitch(buffer, audioContextRef.current.sampleRate);
    
    if (frequency) {
      const noteName = getNoteName(frequency);
      setDetectedNotes(prev => [...prev.slice(-5), noteName]);
      
      // Add to detection buffer
      detectionBufferRef.current.push(noteName);
      if (detectionBufferRef.current.length > 10) {
        detectionBufferRef.current.shift();
      }
      
      // Check if we have enough consistent detections
      if (detectionBufferRef.current.length >= 5) {
        const targetNotes = new Set<string>();
        
        // Build expected notes from target chord
        const STANDARD_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];
        targetChord.frets.forEach((fret, idx) => {
          if (fret !== null && fret !== -1) {
            const baseFreq = STANDARD_TUNING_FREQ[STANDARD_TUNING[idx] as keyof typeof STANDARD_TUNING_FREQ];
            if (baseFreq) {
              const noteFreq = baseFreq * Math.pow(2, fret / 12);
              targetNotes.add(getNoteName(noteFreq));
            }
          }
        });
        
        // Check if detected notes match target chord (with tolerance)
        const recentNotes = new Set(detectionBufferRef.current.slice(-8));
        const matchCount = Array.from(targetNotes).filter(note => recentNotes.has(note)).length;
        const matchRatio = targetNotes.size > 0 ? matchCount / targetNotes.size : 0;
        
        const threshold = Math.max(0.4, 0.8 - (sensitivity - 6) * 0.05);
        
        if (matchRatio >= threshold) {
          setResult('correct');
          detectionBufferRef.current = [];
          if (onCorrect) {
            onCorrect();
          }
        } else if (recentNotes.size >= 2) {
          setResult('wrong');
          if (onWrongDetected) {
            onWrongDetected(Array.from(recentNotes).join(', '));
          }
        }
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [targetChord, sensitivity, advancedSettings, onCorrect, onWrongDetected]);

  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsListening(false);
    setResult(null);
    setDetectedNotes([]);
    detectionBufferRef.current = [];
  }, []);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      streamRef.current = stream;
      setIsListening(true);
      setPermissionDenied(false);
      setResult(null);
      detectionBufferRef.current = [];
      
      // Start analysis loop
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    } catch (error) {
      console.error('Microphone access denied:', error);
      setPermissionDenied(true);
    }
  }, [analyzeAudio]);

  useEffect(() => {
    if (autoStart) {
      startListening();
    }
    return () => {
      stopListening();
    };
  }, [autoStart, startListening, stopListening]);

  return {
    isListening,
    result,
    permissionDenied,
    detectedNotes,
    startListening,
    stopListening,
  };
}
