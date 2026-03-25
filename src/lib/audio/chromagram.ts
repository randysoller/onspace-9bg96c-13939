/**
 * Chromagram (Chroma Feature) Extraction
 * Maps frequency spectrum to 12 pitch classes for chord recognition
 * 
 * @module chromagram
 */

import { logger } from '../logger';

/**
 * 12-bin chroma vector representing energy in each pitch class
 * Index 0 = C, 1 = C#, 2 = D, ..., 11 = B
 */
export type ChromaVector = number[];

/**
 * Note names for each chroma bin
 */
export const CHROMA_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Convert frequency to MIDI note number
 * @param frequency - Frequency in Hz
 * @returns MIDI note number (60 = middle C)
 */
function frequencyToMidi(frequency: number): number {
  return 12 * Math.log2(frequency / 440) + 69;
}

/**
 * Convert MIDI note to pitch class (0-11)
 * @param midiNote - MIDI note number
 * @returns Pitch class (0 = C, 1 = C#, ..., 11 = B)
 */
function midiToPitchClass(midiNote: number): number {
  return Math.round(midiNote) % 12;
}

/**
 * Extract chromagram from FFT frequency data
 * 
 * Algorithm:
 * 1. For each FFT bin, convert bin index to frequency
 * 2. Convert frequency to MIDI note
 * 3. Convert MIDI note to pitch class (0-11)
 * 4. Accumulate magnitude into corresponding chroma bin
 * 5. Normalize the chroma vector
 * 
 * @param frequencyData - FFT magnitude data from AnalyserNode
 * @param sampleRate - Audio sample rate (e.g., 44100, 48000)
 * @param fftSize - FFT size (e.g., 2048, 4096)
 * @returns 12-bin chroma vector normalized to [0, 1]
 */
export function extractChromagram(
  frequencyData: Uint8Array,
  sampleRate: number,
  fftSize: number
): ChromaVector {
  // Initialize 12-bin chroma vector
  const chroma = new Array(12).fill(0);
  
  // Only analyze frequencies in musical range (60 Hz - 4000 Hz)
  const minFreq = 60;
  const maxFreq = 4000;
  
  const minBin = Math.floor((minFreq / sampleRate) * fftSize);
  const maxBin = Math.min(
    Math.ceil((maxFreq / sampleRate) * fftSize),
    frequencyData.length
  );
  
  // Accumulate energy into pitch classes
  for (let i = minBin; i < maxBin; i++) {
    // Convert bin index to frequency
    const frequency = (i * sampleRate) / fftSize;
    
    // Convert to MIDI note and pitch class
    const midiNote = frequencyToMidi(frequency);
    const pitchClass = midiToPitchClass(midiNote);
    
    // Accumulate magnitude (normalize from 0-255 to 0-1)
    const magnitude = frequencyData[i] / 255.0;
    chroma[pitchClass] += magnitude;
  }
  
  // Normalize chroma vector to [0, 1]
  const maxValue = Math.max(...chroma);
  if (maxValue > 0) {
    for (let i = 0; i < 12; i++) {
      chroma[i] /= maxValue;
    }
  }
  
  return chroma;
}

/**
 * Get dominant pitch classes from chromagram
 * @param chroma - Chroma vector
 * @param threshold - Minimum normalized energy (0-1)
 * @returns Array of pitch class indices above threshold
 */
export function getDominantPitchClasses(
  chroma: ChromaVector,
  threshold: number = 0.3
): number[] {
  const dominant: number[] = [];
  
  for (let i = 0; i < 12; i++) {
    if (chroma[i] >= threshold) {
      dominant.push(i);
    }
  }
  
  return dominant;
}

/**
 * Get note names from pitch class indices
 * @param pitchClasses - Array of pitch class indices
 * @returns Array of note names
 */
export function pitchClassesToNotes(pitchClasses: number[]): string[] {
  return pitchClasses.map(pc => CHROMA_NOTES[pc]);
}

/**
 * Shift chroma vector to different root note
 * Useful for transposition and template matching
 * @param chroma - Original chroma vector
 * @param semitones - Number of semitones to shift (positive = up, negative = down)
 * @returns Shifted chroma vector
 */
export function shiftChroma(chroma: ChromaVector, semitones: number): ChromaVector {
  const shifted = new Array(12).fill(0);
  
  for (let i = 0; i < 12; i++) {
    const newIndex = (i + semitones + 12) % 12;
    shifted[newIndex] = chroma[i];
  }
  
  return shifted;
}

/**
 * Visualize chromagram for debugging
 * @param chroma - Chroma vector
 * @returns String representation of chroma energy
 */
export function visualizeChromagram(chroma: ChromaVector): string {
  const bars = chroma.map((value, i) => {
    const barLength = Math.round(value * 10);
    const bar = '█'.repeat(barLength);
    return `${CHROMA_NOTES[i].padEnd(2)} ${bar.padEnd(10)} ${value.toFixed(2)}`;
  });
  
  return '\n' + bars.join('\n');
}

/**
 * Calculate cosine similarity between two chroma vectors
 * Used for template matching
 * 
 * @param chroma1 - First chroma vector
 * @param chroma2 - Second chroma vector (template)
 * @returns Similarity score [0, 1] where 1 = perfect match
 */
export function cosineSimilarity(chroma1: ChromaVector, chroma2: ChromaVector): number {
  if (chroma1.length !== 12 || chroma2.length !== 12) {
    logger.error('Invalid chroma vectors - must be 12 bins');
    return 0;
  }
  
  // Calculate dot product
  let dotProduct = 0;
  for (let i = 0; i < 12; i++) {
    dotProduct += chroma1[i] * chroma2[i];
  }
  
  // Calculate magnitudes
  let magnitude1 = 0;
  let magnitude2 = 0;
  for (let i = 0; i < 12; i++) {
    magnitude1 += chroma1[i] * chroma1[i];
    magnitude2 += chroma2[i] * chroma2[i];
  }
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  // Avoid division by zero
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  
  // Cosine similarity
  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Find best rotation (transposition) of template to match chroma
 * Tries all 12 possible root notes
 * 
 * @param chroma - Input chroma vector
 * @param template - Template chroma vector
 * @returns Best match { root: pitch class, similarity: score }
 */
export function findBestRotation(
  chroma: ChromaVector,
  template: ChromaVector
): { root: number; rootNote: string; similarity: number } {
  let bestRoot = 0;
  let bestSimilarity = 0;
  
  // Try all 12 rotations (transpositions)
  for (let semitones = 0; semitones < 12; semitones++) {
    const rotatedTemplate = shiftChroma(template, semitones);
    const similarity = cosineSimilarity(chroma, rotatedTemplate);
    
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestRoot = semitones;
    }
  }
  
  return {
    root: bestRoot,
    rootNote: CHROMA_NOTES[bestRoot],
    similarity: bestSimilarity,
  };
}
