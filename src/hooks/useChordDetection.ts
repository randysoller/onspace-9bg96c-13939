/**
 * FretMaster Chord Detection System - DESKTOP + MOBILE OPTIMIZED
 * 
 * COMPLETE REWRITE for cross-platform reliability:
 * - Adaptive RMS thresholds with auto-calibration
 * - Automatic gain normalization for quiet desktop mics
 * - Browser-specific AudioContext handling (Safari, Chrome, Edge)
 * - Robust sample rate adaptation (no forced rates)
 * - User gesture-aware initialization
 * - Real-time diagnostic logging
 * 
 * FIXES:
 * ✅ Desktop microphone gain deficit (automatic boosting)
 * ✅ AudioContext autoplay policy handling
 * ✅ Sample rate normalization across devices
 * ✅ Browser-specific quirks (Safari, Chrome)
 * ✅ Adaptive threshold calibration
 * ✅ Low-latency FFT configuration
 * 
 * @example
 * ```tsx
 * const { isListening, result, toggleListening } = useChordDetection({
 *   targetChord: { root: 'C', type: 'major', ... },
 *   onCorrect: () => console.log('Correct!'),
 *   sensitivity: 6,
 *   autoStart: true,
 * });
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChordData } from '@/types/chord';
import { CHORD_DATABASE } from '@/constants/chords-index';
import { logger } from '@/lib/logger';
import { useCustomChordStore } from '@/stores/customChordStore';
import { customToLibraryChord } from '@/types/customChord';

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

// ============================================================================
// CONSTANTS & UTILITIES
// ============================================================================

const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64];
const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MATCH_THRESHOLD = 2;
const MISS_THRESHOLD = 3;
const MIN_ACTIVE_FRAMES = 2;
const SILENCE_RESET_FRAMES = 8;

// Calibration constants
const CALIBRATION_FRAMES = 30; // ~2 seconds
const MIN_CALIBRATED_RMS = 0.00005; // Absolute floor (lowered for better mobile sensitivity)

/**
 * Detect platform and browser
 */
interface PlatformInfo {
  isMobile: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isEdge: boolean;
  isFirefox: boolean;
}

function detectPlatform(): PlatformInfo {
  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isChrome = /chrome/i.test(ua) && !/edge/i.test(ua);
  const isEdge = /edg/i.test(ua);
  const isFirefox = /firefox/i.test(ua);
  
  return { isMobile, isSafari, isChrome, isEdge, isFirefox };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

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

function isBarreChord(chord: ChordData): boolean {
  if (chord.barres && chord.barres.length > 0) return true;
  if (chord.category && chord.category.toLowerCase() === 'barre') return true;
  
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

// Static templates from the standard chord database (deduplicated by root+type symbol).
const STATIC_CHORD_TEMPLATES: ChordTemplate[] = (() => {
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

/**
 * Returns the merged template list: static library chords + any saved custom chords.
 * Custom chords use their actual fret positions (via customToLibraryChord) so their
 * unique voicings are recognised both as detection targets and in identifyBestMatch.
 * Called at detection time (not module load) so new custom chords appear immediately.
 */
function getEffectiveTemplates(): ChordTemplate[] {
  const { customChords } = useCustomChordStore.getState();
  if (customChords.length === 0) return STATIC_CHORD_TEMPLATES;

  // Deduplicate: custom chords keyed by their own ID override nothing in STATIC list;
  // they are simply appended so the detector can also recognise custom voicings.
  const customTemplates: ChordTemplate[] = [];
  for (const custom of customChords) {
    const chord = customToLibraryChord(custom) as ChordData;
    const pc = getChordPitchClasses(chord);
    if (pc.size === 0) continue; // skip chords with no fretted notes
    const template = new Float64Array(12);
    for (const p of pc) template[p] = 1.0;
    customTemplates.push({
      chord,
      pitchClasses: pc,
      chromaTemplate: template,
      isBarre: isBarreChord(chord),
    });
  }

  return [...STATIC_CHORD_TEMPLATES, ...customTemplates];
}

// ============================================================================
// NSDF PITCH DETECTION
// ============================================================================

function autoCorrelateNSDF(buffer: Float32Array, sampleRate: number, rmsThreshold: number): number {
  const N = Math.min(buffer.length, 4096);
  const startIdx = Math.floor((buffer.length - N) / 2);
  const subBuffer = buffer.slice(startIdx, startIdx + N);
  
  let rmsSum = 0;
  for (let i = 0; i < N; i++) rmsSum += subBuffer[i] * subBuffer[i];
  const rms = Math.sqrt(rmsSum / N);
  if (rms < rmsThreshold) return -1;
  
  const windowed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
    windowed[i] = subBuffer[i] * w;
  }
  
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
  
  const minConfidence = 0.2;
  const primaryThreshold = 0.42;
  const rejectThreshold = 0.3;
  
  let zeroIdx = minLag;
  while (zeroIdx < maxLag && nsdf[zeroIdx] > 0) zeroIdx++;
  
  const peaks: { lag: number; value: number }[] = [];
  for (let i = zeroIdx + 1; i < maxLag - 1; i++) {
    if (nsdf[i] > nsdf[i - 1] && nsdf[i] > nsdf[i + 1] && nsdf[i] >= minConfidence) {
      peaks.push({ lag: i, value: nsdf[i] });
    }
  }
  
  if (peaks.length === 0) return -1;
  
  let bestPeak = peaks.find(p => p.value >= primaryThreshold);
  if (!bestPeak) {
    bestPeak = peaks.reduce((a, b) => (a.value > b.value ? a : b));
  }
  
  if (bestPeak.value < rejectThreshold) return -1;
  
  const tau = bestPeak.lag;
  const alpha = nsdf[tau - 1];
  const beta = nsdf[tau];
  const gamma = nsdf[tau + 1];
  const refinedTau = tau + (alpha - gamma) / (2 * (2 * beta - alpha - gamma));
  
  const freq = sampleRate / refinedTau;
  if (freq < 60 || freq > 1400) return -1;
  
  return freq;
}

// ============================================================================
// CHROMA EXTRACTION
// ============================================================================

function extractChroma(
  freqData: Float32Array,
  analyser: AnalyserNode,
  sensitivity: number,
  nsdfPitch: number,
  platform: PlatformInfo
): Float64Array | null {
  const t = (sensitivity - 1) / 9;
  const dbFloor = lerp(-55, -85, t);
  const noiseGateEnergy = lerp(5, 0.8, t);
  
  const sampleRate = analyser.context.sampleRate;
  const fftSize = analyser.fftSize;
  const binWidth = sampleRate / fftSize;
  
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
  
  const chroma = new Float64Array(12);
  let totalEnergy = 0;
  
  const getWeight = (freq: number) => Math.max(0.3, Math.min(2.5, Math.exp(-0.0012 * (freq - 100))));
  
  const sigma = 0.35;
  for (let i = 0; i < freqData.length; i++) {
    const freq = i * binWidth;
    if (freq < 70 || freq > 2500) continue;
    const db = freqData[i];
    if (db < dbFloor) continue;
    
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
    
    const semitones = 12 * Math.log2(freq / 440);
    const pitchClass = ((semitones + 9) % 12 + 12) % 12;
    
    for (let pc = 0; pc < 12; pc++) {
      let dist = Math.abs(pc - pitchClass);
      if (dist > 6) dist = 12 - dist;
      const gaussWeight = Math.exp(-(dist * dist) / (2 * sigma * sigma));
      if (gaussWeight > 0.01) {
        chroma[pc] += weightedEnergy * gaussWeight;
      }
    }
  }
  
  const effectiveNoiseGate = noiseGateEnergy * 0.08; // ✅ Lowered from 0.12 for better sensitivity
  if (totalEnergy < effectiveNoiseGate) {
    return null;
  }
  
  for (let pc = 0; pc < 12; pc++) {
    if (chroma[pc] > 0.01) {
      const h3 = (pc + 7) % 12;
      const h5 = (pc + 4) % 12;
      const h3strength = chroma[h3];
      const h5strength = chroma[h5];
      chroma[pc] += (h3strength + h5strength) * 0.06;
    }
  }
  
  if (nsdfPitch > 0) {
    const semitoneOffset = 12 * Math.log2(nsdfPitch / 440);
    const roundedSemitone = Math.round(semitoneOffset);
    const pitchClass = ((roundedSemitone + 9) % 12 + 12) % 12;
    const maxChroma = Math.max(...chroma);
    chroma[pitchClass] += maxChroma * 0.15;
  }
  
  const maxVal = Math.max(...chroma);
  if (maxVal > 0) {
    for (let i = 0; i < 12; i++) chroma[i] /= maxVal;
  }
  
  return chroma;
}

// ============================================================================
// VOICE REJECTION GATES
// ============================================================================

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

function computeFormantScore(freqData: Float32Array, analyser: AnalyserNode): number {
  const sampleRate = analyser.context.sampleRate;
  const fftSize = analyser.fftSize;
  const binWidth = sampleRate / fftSize;
  
  const minBin = Math.floor(200 / binWidth);
  const maxBin = Math.floor(3000 / binWidth);
  
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
  
  let valley = Infinity;
  for (let i = f1Idx; i < f2Idx && i < smoothed.length; i++) {
    if (smoothed[i] < valley) valley = smoothed[i];
  }
  
  const f1Prominence = f1Peak / (valley || 0.001);
  const f2Prominence = f2Peak / (valley || 0.001);
  
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
  
  const isVoice = f1Prominence > 1.4 && f2Prominence > 1.3 &&
                  f1Bandwidth >= 60 && f2Bandwidth >= 40 &&
                  peakSeparation > 300;
  
  if (!isVoice) return 0;
  
  const prominenceScore = (f1Prominence + f2Prominence) / 4;
  const bandwidthScore = (f1Bandwidth + f2Bandwidth) / 200;
  
  return Math.min(1.0, prominenceScore + bandwidthScore);
}

function computeSpectralFlux(
  freqData: Float32Array,
  prevFreqData: Float32Array | null,
  analyser: AnalyserNode
): number {
  if (!prevFreqData) return -1;
  
  const sampleRate = analyser.context.sampleRate;
  const fftSize = analyser.fftSize;
  const binWidth = sampleRate / fftSize;
  
  const minBin = Math.floor(70 / binWidth);
  const maxBin = Math.floor(2500 / binWidth);
  
  let fluxSum = 0;
  let count = 0;
  
  for (let i = minBin; i < maxBin; i++) {
    const diff = freqData[i] - prevFreqData[i];
    if (diff > 0) {
      fluxSum += diff;
      count++;
    }
  }
  
  return count > 0 ? fluxSum / count : 0;
}

// ============================================================================
// CHORD MATCHING
// ============================================================================

function matchChroma(
  chroma: Float64Array,
  expected: Set<number>,
  sensitivity: number,
  isBarre: boolean = false
): boolean {
  const t = (sensitivity - 1) / 9;
  
  const sizeBonus = expected.size > 4 ? 0.02 : expected.size > 3 ? 0.01 : 0;
  const barreChromaReduction = isBarre ? 0.03 : 0;
  const barreRatioReduction = isBarre ? 0.05 : 0;
  
  const rawChromaThreshold = lerp(0.28, 0.15, t) - sizeBonus - barreChromaReduction;
  const chromaThreshold = Math.max(0.15, rawChromaThreshold);
  
  const rawMatchRatioMin = lerp(0.75, 0.50, t) - barreRatioReduction;
  const matchRatioMin = Math.max(0.50, rawMatchRatioMin);
  
  const maxExtrasBase = lerp(1, 4, t) + (isBarre ? 1.0 : 0);
  const extraPenaltyPerNote = lerp(0.15, 0.06, t);
  const wrongNotePenalty = lerp(0.25, 0.10, t);
  
  let binaryMatches = 0;
  let weightedCredit = 0;
  let extras = 0;
  let strongWrongNotes = 0;
  
  const chromaTemplate = new Float64Array(12);
  for (const pc of expected) chromaTemplate[pc] = 1.0;
  
  for (let pc = 0; pc < 12; pc++) {
    if (expected.has(pc)) {
      if (chroma[pc] >= chromaThreshold) {
        binaryMatches++;
        const credit = Math.min(chroma[pc] / chromaThreshold, 1.2);
        weightedCredit += credit;
      } else if (chroma[pc] >= chromaThreshold * 0.5) {
        weightedCredit += 0.3;
      }
    } else {
      if (chroma[pc] >= chromaThreshold) {
        extras++;
        if (chroma[pc] > 0.5) {
          strongWrongNotes++;
        }
      }
    }
  }
  
  const binaryRatio = binaryMatches / expected.size;
  const weightedRatio = weightedCredit / expected.size;
  
  let dot = 0;
  let normChroma = 0;
  let normTemplate = 0;
  for (let i = 0; i < 12; i++) {
    dot += chroma[i] * chromaTemplate[i];
    normChroma += chroma[i] * chroma[i];
    normTemplate += chromaTemplate[i] * chromaTemplate[i];
  }
  const cosineSim = dot / (Math.sqrt(normChroma) * Math.sqrt(normTemplate));
  
  const consensusRatio = (binaryRatio * 0.40) + (weightedRatio * 0.35) + (cosineSim * 0.25);
  
  const maxExtras = Math.floor(maxExtrasBase);
  const extraPenalty = extras > maxExtras ? (extras - maxExtras) * extraPenaltyPerNote : 0;
  const wrongPenalty = strongWrongNotes * wrongNotePenalty;
  
  const finalRatio = consensusRatio - extraPenalty - wrongPenalty;
  
  const minBinaryMatches = Math.max(2, Math.ceil(expected.size * 0.70));
  
  const maxStrongWrongNotes = expected.size <= 3 ? 0 : 1;
  if (strongWrongNotes > maxStrongWrongNotes) {
    return false;
  }
  
  const minCosineSim = 0.35;
  
  return finalRatio >= matchRatioMin && 
         binaryMatches >= minBinaryMatches && 
         cosineSim >= minCosineSim;
}

function identifyBestMatch(chroma: Float64Array, excludeSymbol?: string): string | null {
  let bestSim = 0;
  let bestSymbol: string | null = null;

  for (const template of getEffectiveTemplates()) {
    const symbol = `${template.chord.root}${template.chord.type}`;
    if (symbol === excludeSymbol) continue;
    
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
// MAIN HOOK - DESKTOP + MOBILE OPTIMIZED
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
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<number>(0);
  const isListeningRef = useRef(false);
  const startedRef = useRef(false);
  const pauseTimeoutRef = useRef<number | null>(null);
  
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
  
  const consecutiveMatchesRef = useRef(0);
  const consecutiveMissesRef = useRef(0);
  const activeSignalFramesRef = useRef(0);
  const silenceFramesRef = useRef(0);
  const cooldownRef = useRef(false);
  const prevFreqDataRef = useRef<Float32Array | null>(null);
  
  // CALIBRATION STATE
  const calibrationFrameCountRef = useRef(0);
  const calibrationRmsSumRef = useRef(0);
  const calibratedRmsThresholdRef = useRef<number | null>(null);
  const isCalibrating = useRef(false);
  
  const stopListening = useCallback(() => {
    console.log('🛑 Stopping detection...');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = 0;
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
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
    gainNodeRef.current = null;
    isListeningRef.current = false;
    startedRef.current = false;
    setIsListening(false);
    setResult(null);
    
    consecutiveMatchesRef.current = 0;
    consecutiveMissesRef.current = 0;
    activeSignalFramesRef.current = 0;
    silenceFramesRef.current = 0;
    cooldownRef.current = false;
    prevFreqDataRef.current = null;
    calibrationFrameCountRef.current = 0;
    calibrationRmsSumRef.current = 0;
    calibratedRmsThresholdRef.current = null;
    isCalibrating.current = false;
    
    logger.info('Detection stopped');
  }, []);
  
  const startListening = useCallback(async () => {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  FRETMASTER CHORD DETECTION - INITIALIZATION              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    if (isListeningRef.current || startedRef.current) {
      console.log('⚠️ Already started, skipping');
      return;
    }
    startedRef.current = true;
    
    const platform = detectPlatform();
    console.log('🔍 PLATFORM DETECTION:', {
      device: platform.isMobile ? '📱 Mobile' : '💻 Desktop',
      browser: platform.isSafari ? 'Safari' : platform.isChrome ? 'Chrome' : platform.isEdge ? 'Edge' : platform.isFirefox ? 'Firefox' : 'Unknown',
      userAgent: navigator.userAgent.substring(0, 100)
    });
    
    try {
      console.log('\n📡 STEP 1: Requesting microphone access...');
      
      // CRITICAL FIX #1: Adaptive audio constraints based on platform
      const audioConstraints = platform.isMobile ? {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true, // Enable AGC on mobile
        sampleRate: { ideal: 44100 },
        channelCount: { ideal: 1 },
      } : {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true, // ✅ CRITICAL: Enable AGC on desktop for quiet mics!
        sampleRate: { ideal: 48000 }, // Prefer 48kHz but don't force
        channelCount: { ideal: 1 },
      };
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });
      
      const track = stream.getAudioTracks()[0];
      const settings = track.getSettings();
      console.log('✅ Microphone granted:', {
        label: track.label,
        sampleRate: settings.sampleRate,
        channelCount: settings.channelCount,
        autoGainControl: settings.autoGainControl,
        echoCancellation: settings.echoCancellation,
        noiseSuppression: settings.noiseSuppression,
      });
      
      console.log('\n🎵 STEP 2: Creating AudioContext...');
      
      // CRITICAL FIX #2: Let browser choose optimal sample rate (no forced rate)
      const ctx = new AudioContext(); // ✅ No forced sample rate!
      
      console.log('✅ AudioContext created:', {
        sampleRate: ctx.sampleRate,
        state: ctx.state,
        baseLatency: ctx.baseLatency,
        outputLatency: ctx.outputLatency,
      });
      
      // CRITICAL FIX #3: Aggressive AudioContext resume for desktop
      if (ctx.state === 'suspended') {
        console.log('⚠️ AudioContext suspended, attempting resume...');
        try {
          await ctx.resume();
          console.log('✅ AudioContext resumed successfully');
        } catch (err) {
          console.error('❌ Failed to resume AudioContext:', err);
        }
      }
      
      // CRITICAL FIX #4: Add GainNode for desktop mic boosting
      const source = ctx.createMediaStreamSource(stream);
      const gainNode = ctx.createGain();
      
      // Adaptive gain: boost both platforms (mobile mics need help too!)
      const adaptiveGain = platform.isMobile ? 2.0 : 3.0; // ✅ 2x mobile, 3x desktop!
      gainNode.gain.value = adaptiveGain;
      console.log(`🔊 Adaptive gain applied: ${adaptiveGain}x (${platform.isMobile ? 'mobile' : 'desktop'})`);
      
      // Filter chain
      console.log('\n🎛️ STEP 3: Building filter chain...');
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
      // CRITICAL FIX #5: Optimize FFT for low latency
      analyser.fftSize = platform.isMobile ? 8192 : 16384; // Smaller FFT on mobile for lower latency
      analyser.smoothingTimeConstant = platform.isMobile ? 0.6 : 0.5; // ✅ Less smoothing on desktop for faster response
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      
      console.log('✅ Filter chain configured:', {
        fftSize: analyser.fftSize,
        smoothing: analyser.smoothingTimeConstant,
        frequencyBinCount: analyser.frequencyBinCount,
      });
      
      // Connect chain: source → gain → filters → analyser
      source.connect(gainNode);
      gainNode.connect(highPass);
      highPass.connect(notch1);
      notch1.connect(notch2);
      notch2.connect(peaking1);
      peaking1.connect(peaking2);
      peaking2.connect(lowPass);
      lowPass.connect(analyser);
      
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      streamRef.current = stream;
      gainNodeRef.current = gainNode;
      isListeningRef.current = true;
      setIsListening(true);
      setPermissionDenied(false);
      
      console.log('\n✅ INITIALIZATION COMPLETE!');
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║  STARTING DETECTION LOOP                                   ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');
      
      logger.info('Chord detection started', {
        platform: platform.isMobile ? 'mobile' : 'desktop',
        browser: platform.isSafari ? 'Safari' : platform.isChrome ? 'Chrome' : 'Other',
        sampleRate: ctx.sampleRate,
        fftSize: analyser.fftSize,
        sensitivity: sensitivityRef.current,
      });
      
      // BROWSER-SPECIFIC FIX: Safari requires resume on every user interaction
      if (platform.isSafari) {
        const resumeOnInteraction = () => {
          if (ctx.state === 'suspended') {
            console.log('🍎 Safari: Resuming AudioContext on user interaction...');
            ctx.resume();
          }
        };
        document.addEventListener('touchstart', resumeOnInteraction);
        document.addEventListener('click', resumeOnInteraction);
      }
      
      // ============================================================================
      // DETECTION LOOP - 70ms intervals (~14 Hz)
      // ============================================================================
      let frameCounter = 0;
      
      intervalRef.current = window.setInterval(() => {
        frameCounter++;
        
        if (!analyserRef.current || !audioContextRef.current || !isListeningRef.current) {
          return;
        }
        
        // CRITICAL FIX #6: Auto-resume suspended AudioContext
        if (audioContextRef.current.state !== 'running') {
          if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().catch(err => {
              console.error('❌ Failed to resume context:', err);
            });
          }
          return;
        }
        
        if (cooldownRef.current) return;
        
        const analyser = analyserRef.current;
        const timeBuf = new Float32Array(analyser.fftSize);
        const freqBuf = new Float32Array(analyser.frequencyBinCount);
        
        analyser.getFloatTimeDomainData(timeBuf);
        analyser.getFloatFrequencyData(freqBuf);
        
        const sens = sensitivityRef.current;
        const advanced = advancedSettingsRef.current;
        const tNoise = advanced?.noiseGate ? advanced.noiseGate / 100 : (sens - 1) / 9;
        const tFlux = advanced?.fluxTolerance ? advanced.fluxTolerance / 100 : (sens - 1) / 9;
        const effectiveSens = advanced?.harmonicBoost ? 1 + (advanced.harmonicBoost / 100) * 9 : sens;
        
        // ============================================================================
        // ADAPTIVE RMS THRESHOLD WITH AUTO-CALIBRATION
        // ============================================================================
        const N = Math.min(timeBuf.length, 4096);
        let rmsSum = 0;
        for (let i = 0; i < N; i++) rmsSum += timeBuf[i] * timeBuf[i];
        const rms = Math.sqrt(rmsSum / N);
        
        // CRITICAL FIX #7: Auto-calibration phase (first 30 frames = ~2 seconds)
        if (calibrationFrameCountRef.current < CALIBRATION_FRAMES) {
          calibrationRmsSumRef.current += rms;
          calibrationFrameCountRef.current++;
          
          if (calibrationFrameCountRef.current === CALIBRATION_FRAMES) {
            const avgRms = calibrationRmsSumRef.current / CALIBRATION_FRAMES;
            // Set threshold to 105% of average ambient noise (more sensitive)
            calibratedRmsThresholdRef.current = Math.max(MIN_CALIBRATED_RMS, avgRms * 1.05);
            console.log(`\n🎯 CALIBRATION COMPLETE:`);
            console.log(`   Ambient RMS: ${avgRms.toFixed(6)}`);
            console.log(`   Threshold: ${calibratedRmsThresholdRef.current.toFixed(6)}`);
            console.log(`   Platform: ${platform.isMobile ? 'Mobile' : 'Desktop'}\n`);
            isCalibrating.current = false;
          } else {
            isCalibrating.current = true;
            if (calibrationFrameCountRef.current % 10 === 0) {
              console.log(`📊 Calibrating... ${calibrationFrameCountRef.current}/${CALIBRATION_FRAMES} frames`);
            }
          }
          return; // Skip detection during calibration
        }
        
        // Use calibrated threshold or fallback (platform-specific)
        const baseRmsThreshold = 0.05 * Math.pow(0.015, tNoise);
        const rmsFallbackMultiplier = platform.isMobile ? 0.04 : 0.08; // ✅ Mobile gets 0.04x (more sensitive!)
        const rmsThreshold = calibratedRmsThresholdRef.current || (baseRmsThreshold * rmsFallbackMultiplier);
        
        // Diagnostic logging
        if (frameCounter % 50 === 0) {
          console.log(`\n📊 RMS: ${rms.toFixed(6)} vs threshold: ${rmsThreshold.toFixed(6)} ${rms >= rmsThreshold ? '✅' : '❌'}`);
          console.log(`   Calibrated: ${calibratedRmsThresholdRef.current ? 'Yes' : 'No'}`);
          console.log(`   AudioContext: ${audioContextRef.current.state}`);
          console.log(`   Gain: ${gainNodeRef.current?.gain.value}x\n`);
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
        
        // Voice rejection gates
        const spectralFlatness = computeSpectralFlatness(freqBuf, analyser);
        const maxFlatness = lerp(0.30, 0.60, tNoise) + (targetChordRef.current && isBarreChord(targetChordRef.current) ? 0.15 : 0) + 0.35;
        if (spectralFlatness > maxFlatness) {
          consecutiveMatchesRef.current = 0;
          return;
        }
        
        const minCrestRaw = lerp(2.2, 0.8, tNoise) - (targetChordRef.current && isBarreChord(targetChordRef.current) ? 1.0 : 0) - 1.0;
        const minCrest = Math.max(0.3, minCrestRaw);
        const crestFactor = computeSpectralCrest(freqBuf, analyser);
        if (crestFactor < minCrest) {
          consecutiveMatchesRef.current = 0;
          return;
        }
        
        const formantScore = computeFormantScore(freqBuf, analyser);
        const maxFormant = lerp(0.40, 0.80, tNoise) + 0.30;
        if (formantScore > maxFormant) {
          consecutiveMatchesRef.current = 0;
          return;
        }
        
        const spectralFlux = computeSpectralFlux(freqBuf, prevFreqDataRef.current, analyser);
        prevFreqDataRef.current = new Float32Array(freqBuf);
        
        if (spectralFlux >= 0) {
          const maxFlux = lerp(2.5, 5.5, tFlux) + 2.5;
          if (spectralFlux > maxFlux) {
            consecutiveMatchesRef.current = 0;
            return;
          }
        }
        
        // Pitch detection
        const nsdfPitch = autoCorrelateNSDF(timeBuf, audioContextRef.current.sampleRate, rmsThreshold);
        
        // Chroma extraction
        const chroma = extractChroma(freqBuf, analyser, effectiveSens, nsdfPitch, platform);
        if (!chroma) {
          consecutiveMatchesRef.current = 0;
          return;
        }
        
        if (activeSignalFramesRef.current < MIN_ACTIVE_FRAMES) {
          return;
        }
        
        const target = targetChordRef.current;
        if (!target) return;
        
        const expectedPitchClasses = getChordPitchClasses(target);
        const isBarre = isBarreChord(target);
        const isMatch = matchChroma(chroma, expectedPitchClasses, sens, isBarre);
        
        // Debug logging
        if (frameCounter % 20 === 0) {
          const detectedNotes = chroma.map((val, i) => ({ note: NOTE_STRINGS[i], value: val }))
            .filter(p => p.value > 0.15)
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
          console.log(`🎵 Notes: ${detectedNotes.map(p => `${p.note}(${p.value.toFixed(2)})`).join(', ')}`);
          console.log(`${isMatch ? '✅ MATCH' : '❌ NO MATCH'} | Target: ${target.symbol} | ✓${consecutiveMatchesRef.current}/${MATCH_THRESHOLD} ✗${consecutiveMissesRef.current}/${MISS_THRESHOLD}`);
        }
        
        if (isMatch) {
          consecutiveMatchesRef.current++;
          consecutiveMissesRef.current = 0;
          
          if (consecutiveMatchesRef.current >= MATCH_THRESHOLD) {
            console.log(`\n✅ CORRECT: ${target.symbol}\n`);
            setResult('correct');
            consecutiveMatchesRef.current = 0;
            consecutiveMissesRef.current = 0;
            activeSignalFramesRef.current = 0;
            cooldownRef.current = true;
            
            logger.info('Correct chord', { chord: target.symbol });
            
            if (onCorrectRef.current) {
              onCorrectRef.current();
            }
            
            if (pauseTimeoutRef.current) {
              clearTimeout(pauseTimeoutRef.current);
            }
            pauseTimeoutRef.current = window.setTimeout(() => {
              setResult(null); // ✅ Clear visual feedback after cooldown
              cooldownRef.current = false;
              pauseTimeoutRef.current = null;
            }, 1500);
          }
        } else {
          consecutiveMissesRef.current++;
          consecutiveMatchesRef.current = 0;
          
          if (consecutiveMissesRef.current >= MISS_THRESHOLD) {
            const bestMatch = identifyBestMatch(chroma, target.symbol);
            console.log(`\n❌ WRONG: Expected ${target.symbol}, detected ${bestMatch || 'unknown'}\n`);
            
            setResult('wrong');
            consecutiveMissesRef.current = 0;
            activeSignalFramesRef.current = 0;
            cooldownRef.current = true;
            
            logger.debug('Wrong chord', {
              expected: target.symbol,
              detected: bestMatch || 'unknown',
            });
            
            if (onWrongDetectedRef.current && bestMatch) {
              onWrongDetectedRef.current(bestMatch);
            }
            
            if (pauseTimeoutRef.current) {
              clearTimeout(pauseTimeoutRef.current);
            }
            pauseTimeoutRef.current = window.setTimeout(() => {
              setResult(null); // ✅ Clear "wrong" message after cooldown
              cooldownRef.current = false;
              pauseTimeoutRef.current = null;
            }, 1800);
          }
        }
      }, 70);
      
    } catch (error) {
      console.error('\n❌ ERROR:', error);
      logger.error('Microphone access failed', error);
      setPermissionDenied(true);
      startedRef.current = false;
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
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = window.setTimeout(() => {
      cooldownRef.current = false;
      pauseTimeoutRef.current = null;
    }, ms);
  }, []);
  
  // Auto-start with user gesture requirement
  useEffect(() => {
    if (autoStart && !startedRef.current) {
      // Wait for first user interaction on desktop
      const platform = detectPlatform();
      if (!platform.isMobile) {
        console.log('💻 Desktop detected: Waiting for user interaction before auto-start...');
        const handleInteraction = () => {
          console.log('👆 User interaction detected, starting...');
          setTimeout(startListening, 100);
          document.removeEventListener('click', handleInteraction);
          document.removeEventListener('touchstart', handleInteraction);
          document.removeEventListener('keydown', handleInteraction);
        };
        document.addEventListener('click', handleInteraction, { once: true });
        document.addEventListener('touchstart', handleInteraction, { once: true });
        document.addEventListener('keydown', handleInteraction, { once: true });
      } else {
        // Mobile: start immediately
        const timer = setTimeout(startListening, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [autoStart, startListening]);
  
  useEffect(() => {
    setResult(null);
    cooldownRef.current = false;
    consecutiveMatchesRef.current = 0;
    consecutiveMissesRef.current = 0;
    activeSignalFramesRef.current = 0;
    
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
  }, [targetChord]);
  
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
    startListening,
    stopListening,
    pauseDetection,
  };
}
