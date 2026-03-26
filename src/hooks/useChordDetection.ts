/**
 * FretMaster Chord Detection System — Complete Reconstruction
 * 
 * This hook implements the full 25-section specification for real-time guitar chord detection:
 * - NSDF pitch detection algorithm (Section 8)
 * - 12-bin chromagram extraction with spectral whitening (Section 9)
 * - 6-layer voice rejection pipeline (Section 10)
 * - Barre chord adaptive thresholds (Section 11)
 * - Triple-metric chord matching (binary, weighted, cosine) (Section 12)
 * - Confusion matrix tracking (Section 13)
 * - Consecutive frame debouncing with cooldown (Section 14)
 * 
 * @example
 * ```tsx
 * const { isListening, result, toggleListening } = useChordDetection({
 *   targetChord: { root: 'C', type: 'major', frets: [-1, 3, 2, 0, 1, 0], ... },
 *   onCorrect: () => console.log('Correct!'),
 *   onWrongDetected: (chord) => console.log(`Wrong: ${chord}`),
 *   sensitivity: 6,
 *   autoStart: true,
 * });
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChordData } from '@/types/chord';
import { CHORD_DATABASE } from '@/constants/chords';
import { logger } from '@/lib/logger';

export type DetectionResult = 'correct' | 'wrong' | null;

export interface AdvancedDetectionSettings {
  noiseGate: number;       // 0-100
  harmonicBoost: number;   // 0-100
  fluxTolerance: number;   // 0-100
}

interface UseChordDetectionOptions {
  onCorrect?: () => void;
  onWrongDetected?: (detectedSymbol: string) => void;
  targetChord?: ChordData | null;
  sensitivity?: number;
  autoStart?: boolean;
  advancedSettings?: AdvancedDetectionSettings | null;
}

// ============================================================================
// CONSTANTS & UTILITIES
// ============================================================================

const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]; // E2, A2, D3, G3, B3, E4
const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MATCH_THRESHOLD = 2;      // ~140ms to confirm correct (reduced from 3)
const MISS_THRESHOLD = 3;       // ~210ms to confirm wrong (increased from 2)
const MIN_ACTIVE_FRAMES = 2;    // ~140ms of signal before matches count (reduced from 3)
const SILENCE_RESET_FRAMES = 8; // ~560ms of silence to reset miss counter
const FREQ_HISTORY_SIZE = 5;

/**
 * Detect if device is mobile
 */
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Linear interpolation
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Get pitch classes (0-11) from chord frets
 */
function getChordPitchClasses(chord: ChordData): Set<number> {
  const pc = new Set<number>();
  for (let i = 0; i < 6; i++) {
    const fret = chord.frets[i];
    if (fret === null || fret < 0) continue;
    const midi = OPEN_STRING_MIDI[i] + fret;
    pc.add(((midi % 12) + 12) % 12);
  }
  return pc;
}

/**
 * Detect if chord is a barre chord (Section 11.1)
 */
function isBarreChord(chord: ChordData): boolean {
  // 1. Explicit: chord.barres array has entries
  if (chord.barres && chord.barres.length > 0) return true;
  
  // 2. Category: chord.category === 'barre'
  if (chord.category && chord.category.toLowerCase() === 'barre') return true;
  
  // 3. Heuristic: 4+ fretted strings with 3+ at the same minimum fret (>= 1)
  const fretted = chord.frets.filter(f => f !== null && f > 0) as number[];
  if (fretted.length >= 4) {
    const minFret = Math.min(...fretted);
    const sameMinCount = fretted.filter(f => f === minFret).length;
    if (sameMinCount >= 3 && minFret >= 1) return true;
  }
  
  return false;
}

// ============================================================================
// PRE-COMPUTED CHORD TEMPLATES
// ============================================================================

interface ChordTemplate {
  chord: ChordData;
  pitchClasses: Set<number>;
  chromaTemplate: Float64Array;
  isBarre: boolean;
}

const ALL_CHORD_TEMPLATES: ChordTemplate[] = (() => {
  const templates: ChordTemplate[] = [];
  const seenSymbols = new Set<string>();
  
  for (const chord of CHORD_DATABASE) {
    const symbol = `${chord.root}${chord.type}`;
    if (seenSymbols.has(symbol)) continue;
    seenSymbols.add(symbol);
    
    const pc = getChordPitchClasses(chord);
    const template = new Float64Array(12);
    for (const p of pc) template[p] = 1.0;
    
    templates.push({
      chord,
      pitchClasses: pc,
      chromaTemplate: template,
      isBarre: isBarreChord(chord),
    });
  }
  
  return templates;
})();

// ============================================================================
// SECTION 8: NSDF PITCH DETECTION ALGORITHM
// ============================================================================

/**
 * NSDF (Normalized Square Difference Function) pitch detection
 * Returns frequency in Hz, or -1 if no pitch detected
 */
function autoCorrelateNSDF(buffer: Float32Array, sampleRate: number, rmsThreshold: number): number {
  const N = Math.min(buffer.length, 4096);
  const startIdx = Math.floor((buffer.length - N) / 2);
  const subBuffer = buffer.slice(startIdx, startIdx + N);
  
  // RMS gate
  let rmsSum = 0;
  for (let i = 0; i < N; i++) rmsSum += subBuffer[i] * subBuffer[i];
  const rms = Math.sqrt(rmsSum / N);
  if (rms < rmsThreshold) return -1;
  
  // Apply Hanning window
  const windowed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
    windowed[i] = subBuffer[i] * w;
  }
  
  // NSDF computation
  const minLag = Math.floor(sampleRate / 1500);
  const maxLag = Math.ceil(sampleRate / 60);
  const nsdf = new Float64Array(maxLag + 1);
  
  for (let tau = minLag; tau <= maxLag; tau++) {
    let acf = 0;
    let norm = 0;
    for (let i = 0; i < N - tau; i++) {
      acf += windowed[i] * windowed[i + tau];
      norm += windowed[i] * windowed[i] + windowed[i + tau] * windowed[i + tau];
    }
    nsdf[tau] = norm > 0 ? (2 * acf) / norm : 0;
  }
  
  // Peak picking
  const minConfidence = 0.2;
  const primaryThreshold = 0.42;
  const rejectThreshold = 0.3;
  
  // Find first zero crossing
  let zeroIdx = minLag;
  while (zeroIdx < maxLag && nsdf[zeroIdx] > 0) zeroIdx++;
  
  // Collect peaks
  const peaks: { lag: number; value: number }[] = [];
  for (let i = zeroIdx + 1; i < maxLag - 1; i++) {
    if (nsdf[i] > nsdf[i - 1] && nsdf[i] > nsdf[i + 1] && nsdf[i] >= minConfidence) {
      peaks.push({ lag: i, value: nsdf[i] });
    }
  }
  
  if (peaks.length === 0) return -1;
  
  // Select first peak above primary threshold (fundamental)
  let bestPeak = peaks.find(p => p.value >= primaryThreshold);
  if (!bestPeak) {
    // Fallback: strongest peak
    bestPeak = peaks.reduce((a, b) => (a.value > b.value ? a : b));
  }
  
  if (bestPeak.value < rejectThreshold) return -1;
  
  // Parabolic interpolation
  const tau = bestPeak.lag;
  const alpha = nsdf[tau - 1];
  const beta = nsdf[tau];
  const gamma = nsdf[tau + 1];
  const refinedTau = tau + (alpha - gamma) / (2 * (2 * beta - alpha - gamma));
  
  const freq = sampleRate / refinedTau;
  
  // Reject if outside guitar range
  if (freq < 60 || freq > 1400) return -1;
  
  return freq;
}

// ============================================================================
// SECTION 9: CHROMA EXTRACTION
// ============================================================================

/**
 * Extract 12-bin chromagram from FFT frequency data
 * Returns normalized chromagram [C, C#, D, ..., B], or null if energy too low
 */
function extractChroma(
  freqData: Float32Array,
  analyser: AnalyserNode,
  sensitivity: number,
  nsdfPitch: number,
  isMobile: boolean = false
): Float64Array | null {
  const t = (sensitivity - 1) / 9;
  // Very relaxed thresholds for mobile compatibility
  const dbFloor = lerp(-50, -80, t);
  const noiseGateEnergy = isMobile ? lerp(4, 1, t) : lerp(10, 2.5, t); // Mobile: 50% of desktop threshold
  
  const sampleRate = analyser.context.sampleRate;
  const fftSize = analyser.fftSize;
  const binWidth = sampleRate / fftSize;
  
  // Spectral whitening - compute octave band averages
  const octaveBands = [70, 140, 280, 560, 1120, 2500];
  const bandEnergy = new Float32Array(octaveBands.length);
  const bandCounts = new Float32Array(octaveBands.length);
  
  for (let i = 0; i < freqData.length; i++) {
    const freq = i * binWidth;
    if (freq < 70 || freq > 2500) continue;
    const db = freqData[i];
    if (db < dbFloor) continue;
    
    const linear = Math.pow(10, db / 20);
    for (let b = 0; b < octaveBands.length; b++) {
      if (freq < octaveBands[b]) {
        bandEnergy[b] += linear;
        bandCounts[b]++;
        break;
      }
    }
  }
  
  const bandAverage = new Float32Array(octaveBands.length);
  for (let b = 0; b < octaveBands.length; b++) {
    bandAverage[b] = bandCounts[b] > 0 ? bandEnergy[b] / bandCounts[b] : 1;
  }
  
  // Initialize chromagram
  const chroma = new Float64Array(12);
  let totalEnergy = 0;
  
  // Frequency weighting
  const getWeight = (freq: number) => Math.max(0.3, Math.min(2.5, Math.exp(-0.0012 * (freq - 100))));
  
  // Gaussian chroma interpolation
  const sigma = 0.35;
  for (let i = 0; i < freqData.length; i++) {
    const freq = i * binWidth;
    if (freq < 70 || freq > 2500) continue;
    const db = freqData[i];
    if (db < dbFloor) continue;
    
    // Spectral whitening normalization
    let normFactor = 1.0;
    for (let b = 0; b < octaveBands.length; b++) {
      if (freq < octaveBands[b]) {
        normFactor = Math.min(5.0, 1.0 / (bandAverage[b] || 1.0));
        break;
      }
    }
    
    const linear = Math.pow(10, db / 20) * normFactor;
    const weight = getWeight(freq);
    const weightedEnergy = linear * weight;
    
    totalEnergy += weightedEnergy;
    
    // Convert to fractional pitch class
    const semitones = 12 * Math.log2(freq / 440);
    const pitchClass = ((semitones + 9) % 12 + 12) % 12;
    
    // Distribute via Gaussian kernel
    for (let pc = 0; pc < 12; pc++) {
      let dist = Math.abs(pc - pitchClass);
      if (dist > 6) dist = 12 - dist; // Wrap around circle
      const gaussWeight = Math.exp(-(dist * dist) / (2 * sigma * sigma));
      if (gaussWeight > 0.01) {
        chroma[pc] += weightedEnergy * gaussWeight;
      }
    }
  }
  
  // Noise gate (very relaxed for mobile)
  const effectiveNoiseGate = isMobile ? noiseGateEnergy * 0.3 : noiseGateEnergy * 0.7; // Mobile: 70% reduction
  if (totalEnergy < effectiveNoiseGate) return null;
  
  // Harmonic series reinforcement
  for (let pc = 0; pc < 12; pc++) {
    if (chroma[pc] > 0.01) {
      const h3 = (pc + 7) % 12; // 3rd harmonic (perfect 5th)
      const h5 = (pc + 4) % 12; // 5th harmonic (major 3rd)
      const h3strength = chroma[h3];
      const h5strength = chroma[h5];
      chroma[pc] += (h3strength + h5strength) * 0.15;
    }
  }
  
  // NSDF pitch boost
  if (nsdfPitch > 0) {
    const semitoneOffset = 12 * Math.log2(nsdfPitch / 440);
    const roundedSemitone = Math.round(semitoneOffset);
    const pitchClass = ((roundedSemitone + 9) % 12 + 12) % 12;
    const maxChroma = Math.max(...chroma);
    chroma[pitchClass] += maxChroma * 0.30;
    chroma[(pitchClass + 7) % 12] += maxChroma * 0.10; // 3rd harmonic
    chroma[(pitchClass + 4) % 12] += maxChroma * 0.08; // 5th harmonic
  }
  
  // Normalize
  const maxVal = Math.max(...chroma);
  if (maxVal > 0) {
    for (let i = 0; i < 12; i++) chroma[i] /= maxVal;
  }
  
  return chroma;
}

// ============================================================================
// SECTION 10: SIX-LAYER VOICE REJECTION PIPELINE
// ============================================================================

/**
 * Layer 2: Spectral Flatness Gate
 * Rejects broadband noise (plosives, claps, breath)
 */
function computeSpectralFlatness(freqData: Float32Array, analyser: AnalyserNode): number {
  const sampleRate = analyser.context.sampleRate;
  const fftSize = analyser.fftSize;
  const binWidth = sampleRate / fftSize;
  
  const minBin = Math.floor(70 / binWidth);
  const maxBin = Math.floor(2500 / binWidth);
  
  let logSum = 0;
  let linSum = 0;
  let count = 0;
  
  for (let i = minBin; i < maxBin; i++) {
    if (freqData[i] > -80) {
      const linMag = Math.pow(10, freqData[i] / 20);
      logSum += Math.log(linMag + 1e-12);
      linSum += linMag;
      count++;
    }
  }
  
  if (count === 0) return 1.0;
  
  const geometricMean = Math.exp(logSum / count);
  const arithmeticMean = linSum / count;
  
  return geometricMean / arithmeticMean;
}

/**
 * Layer 3: Spectral Crest Factor Gate
 * Rejects voice (broad formants) vs guitar (sharp peaks)
 */
function computeSpectralCrest(freqData: Float32Array, analyser: AnalyserNode): number {
  const sampleRate = analyser.context.sampleRate;
  const fftSize = analyser.fftSize;
  const binWidth = sampleRate / fftSize;
  
  const minBin = Math.floor(70 / binWidth);
  const maxBin = Math.floor(2500 / binWidth);
  
  let maxLin = 0;
  let sum = 0;
  let count = 0;
  
  for (let i = minBin; i < maxBin; i++) {
    if (freqData[i] > -80) {
      const linMag = Math.pow(10, freqData[i] / 20);
      if (linMag > maxLin) maxLin = linMag;
      sum += linMag;
      count++;
    }
  }
  
  if (count === 0) return 0;
  
  const meanLin = sum / count;
  return maxLin / meanLin;
}

/**
 * Layer 4: Formant Detection Gate
 * Identifies human voice spectral envelope (F1/F2 two-hump pattern)
 */
function computeFormantScore(freqData: Float32Array, analyser: AnalyserNode): number {
  const sampleRate = analyser.context.sampleRate;
  const fftSize = analyser.fftSize;
  const binWidth = sampleRate / fftSize;
  
  const minBin = Math.floor(200 / binWidth);
  const maxBin = Math.floor(3000 / binWidth);
  
  // Heavy moving average smoothing (~100 Hz window)
  const windowSize = Math.floor(100 / binWidth);
  const smoothed = new Float32Array(maxBin - minBin);
  
  for (let i = 0; i < smoothed.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - windowSize); j < Math.min(smoothed.length, i + windowSize); j++) {
      const bin = minBin + j;
      if (freqData[bin] > -80) {
        sum += Math.pow(10, freqData[bin] / 20);
        count++;
      }
    }
    smoothed[i] = count > 0 ? sum / count : 0;
  }
  
  // Find F1 peak (300-900 Hz)
  const f1MinIdx = Math.floor((300 - 200) / binWidth);
  const f1MaxIdx = Math.floor((900 - 200) / binWidth);
  let f1Peak = 0;
  let f1Idx = 0;
  for (let i = f1MinIdx; i < f1MaxIdx && i < smoothed.length; i++) {
    if (smoothed[i] > f1Peak) {
      f1Peak = smoothed[i];
      f1Idx = i;
    }
  }
  
  // Find F2 peak (900-2500 Hz)
  const f2MinIdx = Math.floor((900 - 200) / binWidth);
  const f2MaxIdx = Math.floor((2500 - 200) / binWidth);
  let f2Peak = 0;
  let f2Idx = 0;
  for (let i = f2MinIdx; i < f2MaxIdx && i < smoothed.length; i++) {
    if (smoothed[i] > f2Peak) {
      f2Peak = smoothed[i];
      f2Idx = i;
    }
  }
  
  if (f1Peak === 0 || f2Peak === 0) return 0;
  
  // Find valley between peaks
  let valley = Infinity;
  for (let i = f1Idx; i < f2Idx && i < smoothed.length; i++) {
    if (smoothed[i] < valley) valley = smoothed[i];
  }
  
  const f1Prominence = f1Peak / (valley || 0.001);
  const f2Prominence = f2Peak / (valley || 0.001);
  
  // Measure bandwidth at 70% of peak height
  const f1Threshold = f1Peak * 0.7;
  let f1Start = f1Idx;
  let f1End = f1Idx;
  while (f1Start > f1MinIdx && smoothed[f1Start] > f1Threshold) f1Start--;
  while (f1End < f1MaxIdx && smoothed[f1End] > f1Threshold) f1End++;
  const f1Bandwidth = (f1End - f1Start) * binWidth;
  
  const f2Threshold = f2Peak * 0.7;
  let f2Start = f2Idx;
  let f2End = f2Idx;
  while (f2Start > f2MinIdx && smoothed[f2Start] > f2Threshold) f2Start--;
  while (f2End < f2MaxIdx && smoothed[f2End] > f2Threshold) f2End++;
  const f2Bandwidth = (f2End - f2Start) * binWidth;
  
  const peakSeparation = Math.abs(f2Idx - f1Idx) * binWidth;
  
  // Voice requires strong two-peak pattern
  const isVoice = f1Prominence > 1.4 && f2Prominence > 1.3 &&
                  f1Bandwidth >= 60 && f2Bandwidth >= 40 &&
                  peakSeparation > 300;
  
  if (!isVoice) return 0;
  
  const prominenceScore = (f1Prominence + f2Prominence) / 4;
  const bandwidthScore = (f1Bandwidth + f2Bandwidth) / 200;
  
  return Math.min(1.0, prominenceScore + bandwidthScore);
}

/**
 * Layer 5: Spectral Flux Gate
 * Rejects rapidly changing spectral content (voice shifts, mouth sounds)
 */
function computeSpectralFlux(
  freqData: Float32Array,
  prevFreqData: Float32Array | null,
  analyser: AnalyserNode
): number {
  if (!prevFreqData) return -1; // Skip on first frame
  
  const sampleRate = analyser.context.sampleRate;
  const fftSize = analyser.fftSize;
  const binWidth = sampleRate / fftSize;
  
  const minBin = Math.floor(70 / binWidth);
  const maxBin = Math.floor(2500 / binWidth);
  
  let fluxSum = 0;
  let count = 0;
  
  for (let i = minBin; i < maxBin; i++) {
    const diff = freqData[i] - prevFreqData[i];
    if (diff > 0) { // Half-wave rectified
      fluxSum += diff;
      count++;
    }
  }
  
  return count > 0 ? fluxSum / count : 0;
}

// ============================================================================
// SECTION 12: TRIPLE-METRIC CHORD MATCHING
// ============================================================================

/**
 * Match chromagram against expected pitch classes
 * Returns true if match, false otherwise
 */
function matchChroma(
  chroma: Float64Array,
  expected: Set<number>,
  sensitivity: number,
  isBarre: boolean = false,
  isMobile: boolean = false
): boolean {
  const t = (sensitivity - 1) / 9;
  
  // Size bonus: larger chords are harder to match perfectly
  const sizeBonus = expected.size > 4 ? 0.06 : expected.size > 3 ? 0.04 : 0;
  
  // Barre chord threshold relaxation
  const barreChromaReduction = isBarre ? 0.06 : 0;
  const barreRatioReduction = isBarre ? 0.08 : 0;
  const barreExtraIncrease = isBarre ? 2.0 : 0;
  
  // Mobile gets MAJOR relaxation - very permissive matching
  const mobileBonus = isMobile ? 0.15 : 0; // Increased from 0.08
  const mobileRatioBonus = isMobile ? 0.20 : 0; // Increased from 0.12
  
  const chromaThreshold = lerp(0.20, 0.06, t) - sizeBonus - barreChromaReduction - mobileBonus;
  const matchRatioMin = lerp(0.60, 0.32, t) - barreRatioReduction - mobileRatioBonus; // Mobile can go as low as 0.12
  const maxExtrasBase = lerp(3, 6, t) + barreExtraIncrease + (isMobile ? 2 : 0); // Mobile: +2 extra notes allowed
  const extraPenaltyPerNote = lerp(0.06, 0.015, t) * (isMobile ? 0.5 : 1.0); // Mobile: 50% penalty reduction
  
  // Count matches and extras
  let binaryMatches = 0;
  let weightedCredit = 0;
  let extras = 0;
  
  const chromaTemplate = new Float64Array(12);
  for (const pc of expected) chromaTemplate[pc] = 1.0;
  
  for (let pc = 0; pc < 12; pc++) {
    if (expected.has(pc)) {
      // Expected note
      if (chroma[pc] >= chromaThreshold) {
        binaryMatches++;
      }
      if (chroma[pc] >= chromaThreshold * 0.6) {
        const credit = Math.min(chroma[pc] / chromaThreshold, 1.5);
        weightedCredit += credit;
      }
    } else {
      // Extra note
      if (chroma[pc] >= chromaThreshold) {
        extras++;
      }
    }
  }
  
  const binaryRatio = binaryMatches / expected.size;
  const weightedRatio = weightedCredit / expected.size;
  
  // Cosine similarity
  let dot = 0;
  let normChroma = 0;
  let normTemplate = 0;
  for (let i = 0; i < 12; i++) {
    dot += chroma[i] * chromaTemplate[i];
    normChroma += chroma[i] * chroma[i];
    normTemplate += chromaTemplate[i] * chromaTemplate[i];
  }
  const cosineSim = dot / (Math.sqrt(normChroma) * Math.sqrt(normTemplate));
  const effectiveCosineSim = cosineSim * 1.15; // Scale up
  
  // Take best of three metrics
  const effectiveRatio = Math.max(weightedRatio, binaryRatio, effectiveCosineSim);
  
  const maxExtras = Math.floor(maxExtrasBase);
  const extraPenalty = extras > maxExtras ? (extras - maxExtras) * extraPenaltyPerNote : 0;
  
  const finalRatio = effectiveRatio - extraPenalty;
  
  // Relaxed minimum binary matches requirement
  const minBinaryMatches = expected.size <= 3 ? 1 : Math.min(2, expected.size);
  
  return finalRatio >= matchRatioMin && binaryMatches >= minBinaryMatches;
}

// ============================================================================
// SECTION 13: CONFUSION MATRIX - BEST MATCH IDENTIFICATION
// ============================================================================

/**
 * Identify best-matching chord from entire library
 * Returns chord symbol or null if no match above threshold
 */
function identifyBestMatch(chroma: Float64Array, excludeSymbol?: string): string | null {
  let bestSim = 0;
  let bestSymbol: string | null = null;
  
  for (const template of ALL_CHORD_TEMPLATES) {
    const symbol = `${template.chord.root}${template.chord.type}`;
    if (symbol === excludeSymbol) continue;
    
    // Cosine similarity
    let dot = 0;
    let normChroma = 0;
    let normTemplate = 0;
    for (let i = 0; i < 12; i++) {
      dot += chroma[i] * template.chromaTemplate[i];
      normChroma += chroma[i] * chroma[i];
      normTemplate += template.chromaTemplate[i] * template.chromaTemplate[i];
    }
    const sim = dot / (Math.sqrt(normChroma) * Math.sqrt(normTemplate));
    
    if (sim > bestSim) {
      bestSim = sim;
      bestSymbol = symbol;
    }
  }
  
  return bestSim >= 0.35 ? bestSymbol : null;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

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
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number>(0);
  const isListeningRef = useRef(false);
  const startedRef = useRef(false);
  
  // Callback refs for stable closures
  const onCorrectRef = useRef(onCorrect);
  const onWrongDetectedRef = useRef(onWrongDetected);
  const targetChordRef = useRef(targetChord);
  const sensitivityRef = useRef(sensitivity);
  const advancedSettingsRef = useRef(advancedSettings);
  
  useEffect(() => { onCorrectRef.current = onCorrect; }, [onCorrect]);
  useEffect(() => { onWrongDetectedRef.current = onWrongDetected; }, [onWrongDetected]);
  useEffect(() => { targetChordRef.current = targetChord; }, [targetChord]);
  useEffect(() => { sensitivityRef.current = sensitivity; }, [sensitivity]);
  useEffect(() => { advancedSettingsRef.current = advancedSettings; }, [advancedSettings]);
  
  // Detection state
  const consecutiveMatchesRef = useRef(0);
  const consecutiveMissesRef = useRef(0);
  const activeSignalFramesRef = useRef(0);
  const silenceFramesRef = useRef(0);
  const cooldownRef = useRef(false);
  const prevFreqDataRef = useRef<Float32Array | null>(null);
  const lastDetectedChromaRef = useRef<Float64Array | null>(null);
  
  const stopListening = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    isListeningRef.current = false;
    startedRef.current = false;
    setIsListening(false);
    setResult(null);
    
    // Reset detection state
    consecutiveMatchesRef.current = 0;
    consecutiveMissesRef.current = 0;
    activeSignalFramesRef.current = 0;
    silenceFramesRef.current = 0;
    cooldownRef.current = false;
    prevFreqDataRef.current = null;
    lastDetectedChromaRef.current = null;
    
    logger.info('Chord detection stopped');
  }, []);
  
  const startListening = useCallback(async () => {
    console.log('🎯 startListening function called');
    console.log('📋 State check:', {
      isListeningRef: isListeningRef.current,
      startedRef: startedRef.current,
      willProceed: !isListeningRef.current && !startedRef.current
    });
    
    if (isListeningRef.current || startedRef.current) {
      console.log('⚠️ Already listening or started, skipping');
      return;
    }
    startedRef.current = true;
    
    const isMobile = isMobileDevice();
    console.log('📱 Device type:', isMobile ? 'Mobile' : 'Desktop');
    
    try {
      console.log('🎤 Requesting microphone access...');
      console.log('📞 Calling getUserMedia...');
      
      // Mobile-friendly audio constraints - very permissive for compatibility
      const audioConstraints = isMobile ? {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true, // Enable on mobile for better level control
        sampleRate: { ideal: 44100 },
        channelCount: { ideal: 1 },
      } : {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        sampleRate: { ideal: 48000 },
        channelCount: { ideal: 1 },
      };
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });
      console.log('✅ Microphone permission granted!', {
        tracks: stream.getTracks().length,
        audioTrack: stream.getAudioTracks()[0]?.label
      });
      
      // Mobile-compatible sample rate (fallback to hardware default)
      const sampleRate = isMobile ? undefined : 48000;
      const ctx = new AudioContext(sampleRate ? { sampleRate } : {});
      if (ctx.state === 'suspended') await ctx.resume();
      
      console.log('🎵 Audio context created:', {
        sampleRate: ctx.sampleRate,
        state: ctx.state,
        isMobile
      });
      
      const source = ctx.createMediaStreamSource(stream);
      
      // 5-stage filter chain (Section 7)
      const highPass = ctx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = 70;
      highPass.Q.value = 0.71;
      
      const notch1 = ctx.createBiquadFilter();
      notch1.type = 'notch';
      notch1.frequency.value = 50;
      notch1.Q.value = 10;
      
      const notch2 = ctx.createBiquadFilter();
      notch2.type = 'notch';
      notch2.frequency.value = 60;
      notch2.Q.value = 10;
      
      const peaking1 = ctx.createBiquadFilter();
      peaking1.type = 'peaking';
      peaking1.frequency.value = 200;
      peaking1.Q.value = 0.5;
      peaking1.gain.value = 5;
      
      const peaking2 = ctx.createBiquadFilter();
      peaking2.type = 'peaking';
      peaking2.frequency.value = 500;
      peaking2.Q.value = 0.7;
      peaking2.gain.value = 3;
      
      const lowPass = ctx.createBiquadFilter();
      lowPass.type = 'lowpass';
      lowPass.frequency.value = 3000;
      lowPass.Q.value = 0.5;
      
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 16384;
      analyser.smoothingTimeConstant = 0.65;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      
      // Connect chain
      source.connect(highPass);
      highPass.connect(notch1);
      notch1.connect(notch2);
      notch2.connect(peaking1);
      peaking1.connect(peaking2);
      peaking2.connect(lowPass);
      lowPass.connect(analyser);
      
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      streamRef.current = stream;
      isListeningRef.current = true;
      setIsListening(true);
      setPermissionDenied(false);
      
      logger.info('🎤 Chord detection started', {
        fftSize: analyser.fftSize,
        sampleRate: ctx.sampleRate,
        filterChain: '5-stage (highpass → notch×2 → peaking×2 → lowpass)',
        templates: ALL_CHORD_TEMPLATES.length,
        sensitivity: sensitivityRef.current,
        advancedSettings: advancedSettingsRef.current,
      });
      
      console.log('✅ Audio context state:', ctx.state);
      console.log('✅ Stream tracks:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, muted: t.muted })));
      
      // Analysis loop at 70ms intervals (~14 Hz)
      intervalRef.current = window.setInterval(() => {
        if (!analyserRef.current || !audioContextRef.current || !isListeningRef.current) return;
        if (audioContextRef.current.state !== 'running') return;
        if (cooldownRef.current) return;
        
        const analyser = analyserRef.current;
        const timeBuf = new Float32Array(analyser.fftSize);
        const freqBuf = new Float32Array(analyser.frequencyBinCount);
        
        analyser.getFloatTimeDomainData(timeBuf);
        analyser.getFloatFrequencyData(freqBuf);
        
        const isMobile = isMobileDevice();
        const sens = sensitivityRef.current;
        const advanced = advancedSettingsRef.current;
        const tNoise = advanced?.noiseGate ? advanced.noiseGate / 100 : (sens - 1) / 9;
        const tHarmonic = advanced?.harmonicBoost ? advanced.harmonicBoost / 100 : (sens - 1) / 9;
        const tFlux = advanced?.fluxTolerance ? advanced.fluxTolerance / 100 : (sens - 1) / 9;
        
        // Effective sensitivity for chroma extraction
        const effectiveSens = advanced?.harmonicBoost ? 1 + (advanced.harmonicBoost / 100) * 9 : sens;
        
        // LAYER 1: RMS Silence Gate (extremely relaxed for mobile)
        const baseRmsThreshold = 0.05 * Math.pow(0.02, tNoise);
        const rmsThreshold = isMobile ? baseRmsThreshold * 0.2 : baseRmsThreshold * 0.6; // Mobile: 80% reduction
        const N = Math.min(timeBuf.length, 4096);
        let rmsSum = 0;
        for (let i = 0; i < N; i++) rmsSum += timeBuf[i] * timeBuf[i];
        const rms = Math.sqrt(rmsSum / N);
        
        // DEBUG: Log RMS levels every 20 frames (~1.4s)
        if (activeSignalFramesRef.current % 20 === 0) {
          console.log(`📊 RMS: ${rms.toFixed(6)} (threshold: ${rmsThreshold.toFixed(6)})`, rms >= rmsThreshold ? '✅ PASS' : '❌ SILENT');
        }
        
        if (rms < rmsThreshold) {
          consecutiveMatchesRef.current = 0;
          activeSignalFramesRef.current = 0;
          silenceFramesRef.current++;
          
          if (silenceFramesRef.current >= SILENCE_RESET_FRAMES) {
            consecutiveMissesRef.current = 0;
          }
          return;
        }
        
        silenceFramesRef.current = 0;
        activeSignalFramesRef.current++;
        
        // LAYER 2: Spectral Flatness Gate (very relaxed for mobile)
        const spectralFlatness = computeSpectralFlatness(freqBuf, analyser);
        const maxFlatness = lerp(0.25, 0.50, tNoise) + (targetChordRef.current && isBarreChord(targetChordRef.current) ? 0.10 : 0) + (isMobile ? 0.30 : 0); // Mobile: +0.30
        if (spectralFlatness > maxFlatness) {
          if (activeSignalFramesRef.current % 20 === 0) {
            console.log(`🔊 Spectral Flatness: ${spectralFlatness.toFixed(3)} (max: ${maxFlatness.toFixed(3)}) ❌ REJECTED - broadband noise`);
          }
          consecutiveMatchesRef.current = 0;
          return;
        }
        
        // LAYER 3: Spectral Crest Factor Gate (very relaxed for mobile)
        const crestFactor = computeSpectralCrest(freqBuf, analyser);
        const minCrest = lerp(2.5, 1.2, tNoise) - (targetChordRef.current && isBarreChord(targetChordRef.current) ? 0.8 : 0) - (isMobile ? 1.0 : 0); // Mobile: -1.0
        if (crestFactor < minCrest) {
          if (activeSignalFramesRef.current % 20 === 0) {
            console.log(`📉 Spectral Crest: ${crestFactor.toFixed(2)} (min: ${minCrest.toFixed(2)}) ❌ REJECTED - voice-like spectrum`);
          }
          consecutiveMatchesRef.current = 0;
          return;
        }
        
        // LAYER 4: Formant Detection Gate (very relaxed for mobile)
        const formantScore = computeFormantScore(freqBuf, analyser);
        const maxFormant = lerp(0.35, 0.70, tNoise) + (isMobile ? 0.25 : 0); // Mobile: +0.25
        if (formantScore > maxFormant) {
          if (activeSignalFramesRef.current % 20 === 0) {
            console.log(`🗣️ Formant Score: ${formantScore.toFixed(3)} (max: ${maxFormant.toFixed(3)}) ❌ REJECTED - voice detected`);
          }
          consecutiveMatchesRef.current = 0;
          return;
        }
        
        // LAYER 5: Spectral Flux Gate
        const spectralFlux = computeSpectralFlux(freqBuf, prevFreqDataRef.current, analyser);
        prevFreqDataRef.current = new Float32Array(freqBuf);
        
        if (spectralFlux >= 0) {
          const maxFlux = lerp(2.0, 4.5, tFlux) + (isMobile ? 2.0 : 0); // Mobile: +2.0 bonus
          if (spectralFlux > maxFlux) {
            if (activeSignalFramesRef.current % 20 === 0) {
              console.log(`⚡ Spectral Flux: ${spectralFlux.toFixed(2)} (max: ${maxFlux.toFixed(2)}) ❌ REJECTED - rapid changes`);
            }
            consecutiveMatchesRef.current = 0;
            return;
          }
        }
        
        // NSDF pitch detection (supplementary)
        const nsdfPitch = autoCorrelateNSDF(timeBuf, audioContextRef.current.sampleRate, rmsThreshold);
        
        // Chroma extraction
        const chroma = extractChroma(freqBuf, analyser, effectiveSens, nsdfPitch, isMobile);
        if (!chroma) {
          if (activeSignalFramesRef.current % 20 === 0) {
            console.log('🎵 Chroma extraction: ❌ NULL - energy too low or no clear pitch classes');
          }
          consecutiveMatchesRef.current = 0;
          return;
        }
        
        // DEBUG: Log chroma values every 20 frames
        if (activeSignalFramesRef.current % 20 === 0) {
          const topPitches = chroma.map((val, i) => ({ note: NOTE_STRINGS[i], value: val }))
            .filter(p => p.value > 0.3)
            .sort((a, b) => b.value - a.value)
            .slice(0, 4);
          console.log('🎵 Detected pitch classes:', topPitches.map(p => `${p.note}(${p.value.toFixed(2)})`).join(', '));
        }
        
        lastDetectedChromaRef.current = chroma;
        
        // LAYER 6: Consecutive frame threshold
        if (activeSignalFramesRef.current < MIN_ACTIVE_FRAMES) {
          // Signal present but not sustained enough yet
          return;
        }
        
        const target = targetChordRef.current;
        if (!target) return;
        
        const expectedPitchClasses = getChordPitchClasses(target);
        const isBarre = isBarreChord(target);
        const isMatch = matchChroma(chroma, expectedPitchClasses, sens, isBarre, isMobile);
        
        // DEBUG: Log match attempts every 20 frames
        if (activeSignalFramesRef.current % 20 === 0) {
          const expectedNotes = Array.from(expectedPitchClasses).map(pc => NOTE_STRINGS[pc]).join(', ');
          console.log(`🎯 Target: ${target.root}${target.type} [${expectedNotes}] - Match: ${isMatch ? '✅ YES' : '❌ NO'}`);
        }
        
        if (isMatch) {
          consecutiveMatchesRef.current++;
          consecutiveMissesRef.current = 0;
          
          if (consecutiveMatchesRef.current >= MATCH_THRESHOLD) {
            setResult('correct');
            consecutiveMatchesRef.current = 0;
            consecutiveMissesRef.current = 0;
            activeSignalFramesRef.current = 0;
            cooldownRef.current = true;
            
            logger.info('Correct chord detected', { chord: `${target.root}${target.type}` });
            
            if (onCorrectRef.current) {
              onCorrectRef.current();
            }
            
            setTimeout(() => {
              cooldownRef.current = false;
            }, 1500);
          }
        } else {
          consecutiveMissesRef.current++;
          consecutiveMatchesRef.current = 0;
          
          if (consecutiveMissesRef.current >= MISS_THRESHOLD) {
            setResult('wrong');
            consecutiveMissesRef.current = 0;
            activeSignalFramesRef.current = 0;
            cooldownRef.current = true;
            
            // Identify best match for confusion tracking
            const bestMatch = identifyBestMatch(chroma, `${target.root}${target.type}`);
            
            logger.debug('Wrong chord detected', {
              expected: `${target.root}${target.type}`,
              detected: bestMatch || 'unknown',
            });
            
            if (onWrongDetectedRef.current && bestMatch) {
              onWrongDetectedRef.current(bestMatch);
            }
            
            setTimeout(() => {
              cooldownRef.current = false;
            }, 1800);
          }
        }
      }, 70);
    } catch (error) {
      console.error('❌ MICROPHONE ACCESS ERROR:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack'
      });
      
      logger.error('Microphone access denied', error);
      setPermissionDenied(true);
      startedRef.current = false;
      
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          console.error('🚫 User denied microphone permission');
        } else if (error.name === 'NotFoundError') {
          console.error('🎤 No microphone found on device');
        } else if (error.name === 'NotReadableError') {
          console.error('🔒 Microphone is being used by another application');
        } else {
          console.error('⚠️ Unknown microphone error:', error.name);
        }
      }
    }
  }, []);
  
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, stopListening, startListening]);
  
  const pauseDetection = useCallback((ms: number) => {
    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
    }, ms);
  }, []);
  
  // Auto-start
  useEffect(() => {
    if (autoStart && !startedRef.current) {
      const timer = setTimeout(() => {
        startListening();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoStart, startListening]);
  
  // Target chord change: reset result and cooldown
  useEffect(() => {
    setResult(null);
    cooldownRef.current = false;
  }, [targetChord]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);
  
  return {
    isListening,
    result,
    permissionDenied,
    toggleListening,
    startListening,  // Add for backwards compatibility with Practice page
    stopListening,
    pauseDetection,
  };
}
