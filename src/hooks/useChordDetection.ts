/**
 * Custom hook for real-time guitar chord detection using chromagram analysis
 * Uses industry-standard chroma features + template matching for accurate chord recognition
 * 
 * @example
 * ```tsx
 * const targetChord = { symbol: 'C', frets: [null, 3, 2, 0, 1, 0], ... };
 * 
 * const { isListening, result, detectedNotes, detectedChord, confidence, startListening, stopListening } = useChordDetection({
 *   targetChord,
 *   sensitivity: 6,
 *   onCorrect: () => {
 *     console.log('Correct chord played!');
 *     playSuccessSound();
 *   },
 *   onWrongDetected: (chord) => {
 *     console.log(`Wrong chord detected: ${chord}`);
 *   },
 * });
 * 
 * return (
 *   <div>
 *     <button onClick={startListening}>Start Detection</button>
 *     {result === 'correct' && <p className="text-green-500">✓ Correct!</p>}
 *     {result === 'wrong' && <p className="text-red-500">✗ Try again</p>}
 *     <p>Detected: {detectedChord || 'None'} ({(confidence * 100).toFixed(0)}%)</p>
 *     <p>Notes: {detectedNotes.join(', ')}</p>
 *   </div>
 * );
 * ```
 * 
 * @param options - Configuration options for chord detection
 * @param options.targetChord - The chord to detect (ChordData with frets array)
 * @param options.onCorrect - Callback fired when correct chord is detected
 * @param options.onWrongDetected - Callback fired when wrong chord detected, receives detected chord name
 * @param options.sensitivity - Detection sensitivity 1-10, higher = more forgiving (default: 6)
 * @param options.autoStart - If true, starts listening automatically on mount (default: false)
 * @param options.advancedSettings - Optional advanced detection settings (noiseGate, harmonicBoost, fluxTolerance)
 * 
 * @returns Chord detection state and controls
 * @returns isListening - True if microphone is active and analyzing chords
 * @returns result - Detection result: 'correct', 'wrong', or null
 * @returns permissionDenied - True if microphone permission was denied
 * @returns detectedNotes - Array of detected note names in current chord
 * @returns detectedChord - Full chord name with root (e.g., "C major", "Am7")
 * @returns confidence - Confidence score 0-1 for current detection
 * @returns startListening - Function to start chord detection and request microphone access
 * @returns stopListening - Function to stop detection and release microphone
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChordData } from '@/types/chord';
import { extractChromagram, getDominantPitchClasses, pitchClassesToNotes, findBestRotation, CHROMA_NOTES } from '@/lib/audio/chromagram';
import { CHORD_TEMPLATES, type ChordTemplate } from '@/lib/audio/chord-templates';
import { logger } from '@/lib/logger';
import { useMemo } from 'react';

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
  allowedCategories?: Set<ChordTemplate['category']>;
}

const STANDARD_TUNING_FREQ = {
  'E2': 82.41, 'A2': 110.00, 'D3': 146.83, 'G3': 196.00, 'B3': 246.94, 'E4': 329.63
};

/**
 * Get expected notes from chord frets
 */
function getExpectedNotesFromChord(chord: ChordData): Set<string> {
  const expectedNotes = new Set<string>();
  const STANDARD_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];
  
  chord.frets.forEach((fret, idx) => {
    if (fret !== null && fret !== -1) {
      const baseFreq = STANDARD_TUNING_FREQ[STANDARD_TUNING[idx] as keyof typeof STANDARD_TUNING_FREQ];
      if (baseFreq) {
        const noteFreq = baseFreq * Math.pow(2, fret / 12);
        const noteName = getNoteName(noteFreq);
        // Strip octave for comparison
        const noteWithoutOctave = noteName.replace(/\d+$/, '');
        expectedNotes.add(noteWithoutOctave);
      }
    }
  });
  
  return expectedNotes;
}

/**
 * Convert frequency to note name
 */
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
  allowedCategories,
}: UseChordDetectionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<DetectionResult>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [detectedNotes, setDetectedNotes] = useState<string[]>([]);
  const [detectedChord, setDetectedChord] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);

  // Filter templates based on allowed categories (cached)
  const filteredTemplates = useMemo(() => {
    const startTime = performance.now();
    
    const templates = allowedCategories && allowedCategories.size > 0
      ? CHORD_TEMPLATES.filter(t => allowedCategories.has(t.category))
      : CHORD_TEMPLATES;
    
    const endTime = performance.now();
    
    logger.debug('Chord templates filtered', {
      totalTemplates: CHORD_TEMPLATES.length,
      filteredCount: templates.length,
      allowedCategories: allowedCategories ? Array.from(allowedCategories) : 'all',
      filterTime: `${(endTime - startTime).toFixed(2)}ms`,
      performanceGain: `${((1 - templates.length / CHORD_TEMPLATES.length) * 100).toFixed(0)}% reduction`,
    });
    
    return templates;
  }, [allowedCategories]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const detectionBufferRef = useRef<{
    chord: string;
    root: string;
    confidence: number;
    timestamp: number;
  }[]>([]);

  /**
   * Main audio analysis loop using chromagram
   */
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      return;
    }

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    
    // Get frequency domain data
    analyser.getByteFrequencyData(frequencyData);
    
    // Apply noise gate - check if there's sufficient signal
    const noiseGate = advancedSettings?.noiseGate || 20; // Minimum dB level
    const averageVolume = frequencyData.reduce((sum, val) => sum + val, 0) / bufferLength;
    
    if (averageVolume < noiseGate) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      return;
    }
    
    try {
      // Extract chromagram from frequency data
      const chroma = extractChromagram(
        frequencyData,
        audioContextRef.current.sampleRate,
        analyser.fftSize
      );
      
      // Find best matching chord template (using filtered set)
      let bestMatch = {
        chord: '',
        root: '',
        similarity: 0,
        template: filteredTemplates[0],
      };
      
      for (const template of filteredTemplates) {
        const match = findBestRotation(chroma, template.chroma);
        
        if (match.similarity > bestMatch.similarity) {
          bestMatch = {
            chord: template.name,
            root: match.rootNote,
            similarity: match.similarity,
            template,
          };
        }
      }
      
      // Apply sensitivity threshold
      // Higher sensitivity = lower threshold
      const minSimilarity = Math.max(0.3, 0.7 - (sensitivity - 6) * 0.05);
      
      if (bestMatch.similarity >= minSimilarity) {
        const fullChordName = `${bestMatch.root}${bestMatch.template.symbol}`;
        
        // Add to detection buffer for stability
        detectionBufferRef.current.push({
          chord: fullChordName,
          root: bestMatch.root,
          confidence: bestMatch.similarity,
          timestamp: Date.now(),
        });
        
        // Keep only last 10 detections
        if (detectionBufferRef.current.length > 10) {
          detectionBufferRef.current.shift();
        }
        
        // Check for consistent detection (last 5 detections)
        const recentDetections = detectionBufferRef.current.slice(-5);
        if (recentDetections.length >= 3) {
          // Most common chord in recent detections
          const chordCounts = new Map<string, number>();
          recentDetections.forEach(d => {
            chordCounts.set(d.chord, (chordCounts.get(d.chord) || 0) + 1);
          });
          
          let mostCommon = '';
          let maxCount = 0;
          chordCounts.forEach((count, chord) => {
            if (count > maxCount) {
              maxCount = count;
              mostCommon = chord;
            }
          });
          
          // Update state with most common chord
          if (mostCommon && maxCount >= 3) {
            const avgConfidence = recentDetections
              .filter(d => d.chord === mostCommon)
              .reduce((sum, d) => sum + d.confidence, 0) / maxCount;
            
            setDetectedChord(mostCommon);
            setConfidence(avgConfidence);
            
            // Get dominant pitch classes for display
            const dominantPitches = getDominantPitchClasses(chroma, 0.4);
            const noteNames = pitchClassesToNotes(dominantPitches);
            setDetectedNotes(noteNames);
            
            // Check if matches target chord
            if (targetChord) {
              const targetSymbol = targetChord.symbol.trim();
              const detectedSymbol = mostCommon.trim();
              
              // Simple comparison: check if detected chord contains target symbol
              // e.g., "Cmaj7" contains "C", "Am" contains "Am"
              const isMatch = 
                detectedSymbol === targetSymbol ||
                detectedSymbol.startsWith(targetSymbol) ||
                // Also check note-based matching as fallback
                checkNoteBasedMatch(targetChord, noteNames);
              
              if (isMatch && avgConfidence >= minSimilarity) {
                setResult('correct');
                detectionBufferRef.current = [];
                logger.info('Correct chord detected', {
                  target: targetSymbol,
                  detected: detectedSymbol,
                  confidence: avgConfidence,
                });
                if (onCorrect) {
                  onCorrect();
                }
              } else if (maxCount >= 4) {
                // Only mark as wrong if we're very confident it's a different chord
                setResult('wrong');
                logger.debug('Wrong chord detected', {
                  target: targetSymbol,
                  detected: detectedSymbol,
                  confidence: avgConfidence,
                });
                if (onWrongDetected) {
                  onWrongDetected(mostCommon);
                }
              }
            }
          }
        }
      } else {
        // Clear detection if similarity drops
        if (detectionBufferRef.current.length > 0) {
          const timeSinceLastDetection = Date.now() - detectionBufferRef.current[detectionBufferRef.current.length - 1].timestamp;
          if (timeSinceLastDetection > 500) {
            detectionBufferRef.current = [];
            setDetectedChord(null);
            setConfidence(0);
          }
        }
      }
    } catch (error) {
      logger.error('Chromagram analysis error', error);
    }
    
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [targetChord, sensitivity, advancedSettings, onCorrect, onWrongDetected]);

  /**
   * Fallback: Check if detected notes match expected notes from chord frets
   */
  function checkNoteBasedMatch(chord: ChordData, detectedNotes: string[]): boolean {
    const expectedNotes = getExpectedNotesFromChord(chord);
    const detectedSet = new Set(detectedNotes);
    
    // Count matching notes
    let matches = 0;
    expectedNotes.forEach(note => {
      if (detectedSet.has(note)) {
        matches++;
      }
    });
    
    const matchRatio = expectedNotes.size > 0 ? matches / expectedNotes.size : 0;
    const threshold = Math.max(0.4, 0.7 - (sensitivity - 6) * 0.05);
    
    return matchRatio >= threshold;
  }

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
    setDetectedChord(null);
    setConfidence(0);
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
      
      // Optimized settings for chord detection
      analyser.fftSize = 8192; // Higher resolution for better frequency detection
      analyser.smoothingTimeConstant = 0.7; // Moderate smoothing
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      streamRef.current = stream;
      setIsListening(true);
      setPermissionDenied(false);
      setResult(null);
      detectionBufferRef.current = [];
      
      logger.info('Chromagram-based chord detection started', {
        fftSize: analyser.fftSize,
        sampleRate: audioContext.sampleRate,
        totalTemplates: CHORD_TEMPLATES.length,
        activeTemplates: filteredTemplates.length,
        allowedCategories: allowedCategories ? Array.from(allowedCategories) : 'all',
        performanceBoost: `${((1 - filteredTemplates.length / CHORD_TEMPLATES.length) * 100).toFixed(0)}% fewer comparisons`,
      });
      
      // Start analysis loop
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    } catch (error) {
      logger.error('Microphone access denied', error);
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

  // Log when filter changes
  useEffect(() => {
    if (allowedCategories && allowedCategories.size > 0) {
      logger.info('Chord type filter updated', {
        activeCategories: Array.from(allowedCategories),
        templateCount: filteredTemplates.length,
        reductionPercent: `${((1 - filteredTemplates.length / CHORD_TEMPLATES.length) * 100).toFixed(0)}%`,
      });
    }
  }, [allowedCategories, filteredTemplates]);

  return {
    isListening,
    result,
    permissionDenied,
    detectedNotes,
    detectedChord,
    confidence,
    startListening,
    stopListening,
  };
}
