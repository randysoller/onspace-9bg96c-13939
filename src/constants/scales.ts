// PROGRESSION PRACTICE — MUSIC THEORY DATA
// Complete circle of fifths, scales, progressions, and style categories

import type { ChordData } from '@/types/chord';
import { CHORD_DATABASE } from './chords';
import { useCustomChordStore } from '@/stores/customChordStore';
import { customToLibraryChord } from '@/types/customChord';

// ========== NOTE SYSTEM ==========

export const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
export const FLAT_NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'Cb'] as const;
export type NoteName = (typeof NOTE_NAMES)[number];

// Note frequencies (Hz) for octave 1
export const NOTE_FREQUENCIES: Record<string, number> = {
  'C': 32.70,
  'C#': 34.65,
  'Db': 34.65,
  'D': 36.71,
  'D#': 38.89,
  'Eb': 38.89,
  'E': 41.20,
  'F': 43.65,
  'F#': 46.25,
  'Gb': 46.25,
  'G': 49.00,
  'G#': 51.91,
  'Ab': 51.91,
  'A': 55.00,
  'A#': 58.27,
  'Bb': 58.27,
  'B': 61.74,
  'Cb': 61.74,
};

// ========== CHORD QUALITY SYSTEM ==========

export type ChordQuality = 'maj' | 'min' | 'dim' | 'aug' | 'dom7' | 'maj7' | 'min7' | 'halfDim7' | 'dim7' | 'sus4';

export const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  maj: '',
  min: 'm',
  dim: 'dim',
  aug: '+',
  dom7: '7',
  maj7: 'maj7',
  min7: 'm7',
  halfDim7: 'm7b5',
  dim7: 'dim7',
  sus4: 'sus4',
};

// ========== KEY SIGNATURES (Circle of Fifths) ==========

export interface KeySignature {
  display: string;
  noteName: NoteName;
  useFlats: boolean;
  type: 'none' | 'sharp' | 'flat';
  count: number;
  notes: string[];
}

export const KEY_SIGNATURES: KeySignature[] = [
  // No accidentals
  { display: 'C', noteName: 'C', useFlats: false, type: 'none', count: 0, notes: [] },
  
  // Sharps (clockwise on circle of fifths)
  { display: 'G', noteName: 'G', useFlats: false, type: 'sharp', count: 1, notes: ['F♯'] },
  { display: 'D', noteName: 'D', useFlats: false, type: 'sharp', count: 2, notes: ['F♯', 'C♯'] },
  { display: 'A', noteName: 'A', useFlats: false, type: 'sharp', count: 3, notes: ['F♯', 'C♯', 'G♯'] },
  { display: 'E', noteName: 'E', useFlats: false, type: 'sharp', count: 4, notes: ['F♯', 'C♯', 'G♯', 'D♯'] },
  { display: 'B', noteName: 'B', useFlats: false, type: 'sharp', count: 5, notes: ['F♯', 'C♯', 'G♯', 'D♯', 'A♯'] },
  { display: 'F♯', noteName: 'F#', useFlats: false, type: 'sharp', count: 6, notes: ['F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯'] },
  { display: 'C♯', noteName: 'C#', useFlats: false, type: 'sharp', count: 7, notes: ['F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯', 'B♯'] },
  
  // Flats (counterclockwise on circle of fifths)
  { display: 'F', noteName: 'F', useFlats: true, type: 'flat', count: 1, notes: ['B♭'] },
  { display: 'B♭', noteName: 'Bb', useFlats: true, type: 'flat', count: 2, notes: ['B♭', 'E♭'] },
  { display: 'E♭', noteName: 'Eb', useFlats: true, type: 'flat', count: 3, notes: ['B♭', 'E♭', 'A♭'] },
  { display: 'A♭', noteName: 'Ab', useFlats: true, type: 'flat', count: 4, notes: ['B♭', 'E♭', 'A♭', 'D♭'] },
  { display: 'D♭', noteName: 'C#', useFlats: true, type: 'flat', count: 5, notes: ['B♭', 'E♭', 'A♭', 'D♭', 'G♭'] },
  { display: 'G♭', noteName: 'F#', useFlats: true, type: 'flat', count: 6, notes: ['B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭'] },
  { display: 'C♭', noteName: 'B', useFlats: true, type: 'flat', count: 7, notes: ['B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭', 'F♭'] },
];

// ========== SCALE INTERVAL PATTERNS (for fretboard visualization and playback) ==========

export const SCALE_INTERVALS = {
  major: [0, 2, 4, 5, 7, 9, 11],                    // W-W-H-W-W-W-H
  minor: [0, 2, 3, 5, 7, 8, 10],                    // W-H-W-W-H-W-W (natural minor)
  pentatonicMajor: [0, 2, 4, 7, 9],                 // Major pentatonic
  pentatonicMinor: [0, 3, 5, 7, 10],                // Minor pentatonic
  blues: [0, 3, 5, 6, 7, 10],                       // Minor pentatonic + blue note
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],            // Natural minor with raised 7th
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],             // Natural minor with raised 6th and 7th
} as const;

// ========== SCALE DEFINITIONS (for chord progressions) ==========

export interface ScaleDegree {
  interval: number;        // semitones from root (0–11)
  quality: ChordQuality;
  roman: string;
}

export interface ScaleDefinition {
  id: string;
  name: string;
  degrees: ScaleDegree[];
}

export const SCALES: ScaleDefinition[] = [
  {
    id: 'major',
    name: 'Major Scale',
    degrees: [
      { interval: 0, quality: 'maj', roman: 'I' },
      { interval: 2, quality: 'min', roman: 'ii' },
      { interval: 4, quality: 'min', roman: 'iii' },
      { interval: 5, quality: 'maj', roman: 'IV' },
      { interval: 7, quality: 'maj', roman: 'V' },
      { interval: 9, quality: 'min', roman: 'vi' },
      { interval: 11, quality: 'dim', roman: 'vii°' },
    ],
  },
  {
    id: 'natural-minor',
    name: 'Natural Minor',
    degrees: [
      { interval: 0, quality: 'min', roman: 'i' },
      { interval: 2, quality: 'dim', roman: 'ii°' },
      { interval: 3, quality: 'maj', roman: 'III' },
      { interval: 5, quality: 'min', roman: 'iv' },
      { interval: 7, quality: 'min', roman: 'v' },
      { interval: 8, quality: 'maj', roman: 'VI' },
      { interval: 10, quality: 'maj', roman: 'VII' },
    ],
  },
  {
    id: 'harmonic-minor',
    name: 'Harmonic Minor',
    degrees: [
      { interval: 0, quality: 'min', roman: 'i' },
      { interval: 2, quality: 'dim', roman: 'ii°' },
      { interval: 3, quality: 'aug', roman: 'III+' },
      { interval: 5, quality: 'min', roman: 'iv' },
      { interval: 7, quality: 'maj', roman: 'V' },
      { interval: 8, quality: 'maj', roman: 'VI' },
      { interval: 11, quality: 'dim', roman: 'vii°' },
    ],
  },
  {
    id: 'melodic-minor',
    name: 'Melodic Minor',
    degrees: [
      { interval: 0, quality: 'min', roman: 'i' },
      { interval: 2, quality: 'min', roman: 'ii' },
      { interval: 3, quality: 'aug', roman: 'III+' },
      { interval: 5, quality: 'maj', roman: 'IV' },
      { interval: 7, quality: 'maj', roman: 'V' },
      { interval: 9, quality: 'dim', roman: 'vi°' },
      { interval: 11, quality: 'dim', roman: 'vii°' },
    ],
  },
  {
    id: 'harmonic-major',
    name: 'Harmonic Major',
    degrees: [
      { interval: 0, quality: 'maj', roman: 'I' },
      { interval: 2, quality: 'dim', roman: 'ii°' },
      { interval: 4, quality: 'min', roman: 'iii' },
      { interval: 5, quality: 'min', roman: 'iv' },
      { interval: 7, quality: 'maj', roman: 'V' },
      { interval: 8, quality: 'maj', roman: 'VI' },
      { interval: 11, quality: 'dim', roman: 'vii°' },
    ],
  },
  {
    id: 'double-harmonic-major',
    name: 'Double Harmonic Major',
    degrees: [
      { interval: 0, quality: 'maj', roman: 'I' },
      { interval: 1, quality: 'maj', roman: 'II' },
      { interval: 4, quality: 'min', roman: 'iii' },
      { interval: 5, quality: 'min', roman: 'iv' },
      { interval: 7, quality: 'maj', roman: 'V' },
      { interval: 8, quality: 'maj', roman: 'VI' },
      { interval: 11, quality: 'dim', roman: 'vii°' },
    ],
  },
];

// ========== COMMON PROGRESSIONS ==========

export interface ProgressionPreset {
  id: string;
  name: string;
  degrees: number[];        // 0-based indices into scale.degrees
  romanDisplay: string;
  scaleId?: string;         // Optional: force specific scale
}

export const COMMON_PROGRESSIONS: ProgressionPreset[] = [
  { id: 'I-IV-V-I', name: 'I – IV – V – I', degrees: [0, 3, 4, 0], romanDisplay: 'I – IV – V – I' },
  { id: 'I-V-vi-IV', name: 'I – V – vi – IV', degrees: [0, 4, 5, 3], romanDisplay: 'I – V – vi – IV' },
  { id: 'I-IV-vi-V', name: 'I – IV – vi – V', degrees: [0, 3, 5, 4], romanDisplay: 'I – IV – vi – V' },
  { id: 'ii-V-I', name: 'ii – V – I', degrees: [1, 4, 0], romanDisplay: 'ii – V – I' },
  { id: 'I-vi-IV-V', name: 'I – vi – IV – V', degrees: [0, 5, 3, 4], romanDisplay: 'I – vi – IV – V' },
  { id: 'vi-IV-I-V', name: 'vi – IV – I – V', degrees: [5, 3, 0, 4], romanDisplay: 'vi – IV – I – V' },
  { id: 'I-iii-IV-V', name: 'I – iii – IV – V', degrees: [0, 2, 3, 4], romanDisplay: 'I – iii – IV – V' },
  { id: 'I-IV-V-IV', name: 'I – IV – V – IV', degrees: [0, 3, 4, 3], romanDisplay: 'I – IV – V – IV' },
  { id: 'i-iv-v', name: 'i – iv – v', degrees: [0, 3, 4], romanDisplay: 'i – iv – v' },
  { id: 'i-VI-III-VII', name: 'i – VI – III – VII', degrees: [0, 5, 2, 6], romanDisplay: 'i – VI – III – VII' },
  { id: 'i-iv-VII-III', name: 'i – iv – VII – III', degrees: [0, 3, 6, 2], romanDisplay: 'i – iv – VII – III' },
  { id: 'I-ii-iii-IV-V', name: 'I – ii – iii – IV – V', degrees: [0, 1, 2, 3, 4], romanDisplay: 'I – ii – iii – IV – V' },
  {
    id: '12-bar-blues',
    name: '12-Bar Blues',
    degrees: [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4],
    romanDisplay: 'I-I-I-I-IV-IV-I-I-V-IV-I-V',
  },
];

// ========== STYLE PROGRESSIONS (13 Genres) ==========

export interface StyleCategory {
  id: string;
  name: string;
  emoji: string;
  bpmRange: { min: number; max: number; default: number };
  progressions: ProgressionPreset[];
}

export const STYLE_PROGRESSIONS: StyleCategory[] = [
  {
    id: 'blues',
    name: 'Blues',
    emoji: '🎸',
    bpmRange: { min: 80, max: 120, default: 95 },
    progressions: [
      {
        id: 'blues-12bar',
        name: '12-Bar Blues',
        degrees: [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4],
        romanDisplay: 'I-I-I-I-IV-IV-I-I-V-IV-I-V',
      },
      { id: 'blues-quick', name: 'Quick Change Blues', degrees: [0, 3, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4], romanDisplay: 'I-IV-I-I-IV-IV-I-I-V-IV-I-V' },
      { id: 'blues-8bar', name: '8-Bar Blues', degrees: [0, 0, 3, 3, 0, 0, 4, 3], romanDisplay: 'I-I-IV-IV-I-I-V-IV' },
      { id: 'blues-minor', name: 'Minor Blues', degrees: [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4], romanDisplay: 'i-i-i-i-iv-iv-i-i-v-iv-i-v', scaleId: 'natural-minor' },
    ],
  },
  {
    id: 'jazz',
    name: 'Jazz',
    emoji: '🎷',
    bpmRange: { min: 100, max: 180, default: 130 },
    progressions: [
      { id: 'jazz-ii-V-I', name: 'ii – V – I', degrees: [1, 4, 0], romanDisplay: 'ii – V – I' },
      { id: 'jazz-I-vi-ii-V', name: 'I – vi – ii – V', degrees: [0, 5, 1, 4], romanDisplay: 'I – vi – ii – V' },
      { id: 'jazz-iii-vi-ii-V', name: 'iii – vi – ii – V', degrees: [2, 5, 1, 4], romanDisplay: 'iii – vi – ii – V' },
      { id: 'jazz-rhythm', name: 'Rhythm Changes', degrees: [0, 5, 1, 4, 0, 5, 1, 4], romanDisplay: 'I-vi-ii-V-I-vi-ii-V' },
    ],
  },
  {
    id: 'pop',
    name: 'Pop',
    emoji: '🎤',
    bpmRange: { min: 100, max: 130, default: 115 },
    progressions: [
      { id: 'pop-4chords', name: 'Four Chords', degrees: [0, 4, 5, 3], romanDisplay: 'I – V – vi – IV' },
      { id: 'pop-50s', name: '50s Progression', degrees: [0, 5, 3, 4], romanDisplay: 'I – vi – IV – V' },
      { id: 'pop-sensitive', name: 'Sensitive Female', degrees: [5, 3, 0, 4], romanDisplay: 'vi – IV – I – V' },
      { id: 'pop-canon', name: 'Canon', degrees: [0, 4, 5, 2, 3, 0, 3, 4], romanDisplay: 'I-V-vi-iii-IV-I-IV-V' },
    ],
  },
  {
    id: 'rock',
    name: 'Rock',
    emoji: '🤘',
    bpmRange: { min: 110, max: 150, default: 125 },
    progressions: [
      { id: 'rock-classic', name: 'Classic Rock', degrees: [0, 3, 6, 4], romanDisplay: 'I – IV – ♭VII – IV' },
      { id: 'rock-iv-I-V', name: 'IV – I – V', degrees: [3, 0, 4], romanDisplay: 'IV – I – V' },
      { id: 'rock-I-♭VII-IV', name: 'I – ♭VII – IV', degrees: [0, 6, 3], romanDisplay: 'I – ♭VII – IV' },
      { id: 'rock-anthemic', name: 'Anthemic Rock', degrees: [0, 4, 5, 3], romanDisplay: 'I – V – vi – IV' },
    ],
  },
  {
    id: 'country',
    name: 'Country',
    emoji: '🤠',
    bpmRange: { min: 100, max: 140, default: 115 },
    progressions: [
      { id: 'country-classic', name: 'Classic Country', degrees: [0, 3, 4], romanDisplay: 'I – IV – V' },
      { id: 'country-I-IV-I-V', name: 'I – IV – I – V', degrees: [0, 3, 0, 4], romanDisplay: 'I – IV – I – V' },
      { id: 'country-ballad', name: 'Country Ballad', degrees: [0, 5, 3, 4], romanDisplay: 'I – vi – IV – V' },
      { id: 'country-train', name: 'Train Beat', degrees: [0, 0, 3, 3, 0, 0, 4, 4], romanDisplay: 'I-I-IV-IV-I-I-V-V' },
    ],
  },
  {
    id: 'reggae',
    name: 'Reggae',
    emoji: '🌴',
    bpmRange: { min: 70, max: 100, default: 80 },
    progressions: [
      { id: 'reggae-I-V-vi-IV', name: 'Reggae Four Chords', degrees: [0, 4, 5, 3], romanDisplay: 'I – V – vi – IV' },
      { id: 'reggae-roots', name: 'Roots Reggae', degrees: [0, 3, 4], romanDisplay: 'I – IV – V' },
      { id: 'reggae-one-drop', name: 'One Drop', degrees: [0, 5, 3, 4], romanDisplay: 'I – vi – IV – V' },
    ],
  },
  {
    id: 'hiphop',
    name: 'Hip Hop',
    emoji: '🎧',
    bpmRange: { min: 80, max: 115, default: 90 },
    progressions: [
      { id: 'hiphop-trap', name: 'Trap', degrees: [5, 3, 0, 4], romanDisplay: 'vi – IV – I – V' },
      { id: 'hiphop-boom', name: 'Boom Bap', degrees: [0, 5, 3, 4], romanDisplay: 'I – vi – IV – V' },
      { id: 'hiphop-dark', name: 'Dark Hip Hop', degrees: [0, 3, 5, 4], romanDisplay: 'i – iv – vi – v', scaleId: 'natural-minor' },
      { id: 'hiphop-808', name: '808 Progression', degrees: [5, 3, 0, 4], romanDisplay: 'vi – IV – I – V' },
    ],
  },
  {
    id: 'rnb',
    name: 'R&B',
    emoji: '🎵',
    bpmRange: { min: 60, max: 100, default: 75 },
    progressions: [
      { id: 'rnb-ii-V-I', name: 'R&B ii – V – I', degrees: [1, 4, 0], romanDisplay: 'ii – V – I' },
      { id: 'rnb-I-iii-IV-V', name: 'I – iii – IV – V', degrees: [0, 2, 3, 4], romanDisplay: 'I – iii – IV – V' },
      { id: 'rnb-vi-ii-V-I', name: 'vi – ii – V – I', degrees: [5, 1, 4, 0], romanDisplay: 'vi – ii – V – I' },
    ],
  },
  {
    id: 'latin',
    name: 'Latin',
    emoji: '💃',
    bpmRange: { min: 90, max: 140, default: 110 },
    progressions: [
      { id: 'latin-bossa', name: 'Bossa Nova', degrees: [0, 1, 0, 1], romanDisplay: 'I – ii – I – ii' },
      { id: 'latin-salsa', name: 'Salsa', degrees: [0, 3, 4], romanDisplay: 'I – IV – V' },
      { id: 'latin-rumba', name: 'Rumba', degrees: [0, 5, 1, 4], romanDisplay: 'I – vi – ii – V' },
      { id: 'latin-montuno', name: 'Montuno', degrees: [0, 4, 0, 4], romanDisplay: 'I – V – I – V' },
    ],
  },
  {
    id: 'funk',
    name: 'Funk',
    emoji: '🕺',
    bpmRange: { min: 100, max: 130, default: 110 },
    progressions: [
      { id: 'funk-groove', name: 'Funk Groove', degrees: [0, 3, 0, 3], romanDisplay: 'I – IV – I – IV' },
      { id: 'funk-ii-V', name: 'Funk ii – V', degrees: [1, 4, 1, 4], romanDisplay: 'ii – V – ii – V' },
      { id: 'funk-vamp', name: 'Funk Vamp', degrees: [0, 6, 3, 0], romanDisplay: 'I – ♭VII – IV – I' },
    ],
  },
  {
    id: 'neosoul',
    name: 'Neo Soul',
    emoji: '✨',
    bpmRange: { min: 65, max: 95, default: 78 },
    progressions: [
      { id: 'neosoul-ii-V-I', name: 'Neo Soul ii – V – I', degrees: [1, 4, 0], romanDisplay: 'ii – V – I' },
      { id: 'neosoul-iii-vi-ii-V', name: 'iii – vi – ii – V', degrees: [2, 5, 1, 4], romanDisplay: 'iii – vi – ii – V' },
      { id: 'neosoul-I-iii-IV-iv', name: 'I – iii – IV – iv', degrees: [0, 2, 3, 3], romanDisplay: 'I – iii – IV – iv' },
      { id: 'neosoul-vi-ii-V-I', name: 'vi – ii – V – I', degrees: [5, 1, 4, 0], romanDisplay: 'vi – ii – V – I' },
    ],
  },
  {
    id: 'bluegrass',
    name: 'Bluegrass',
    emoji: '🪕',
    bpmRange: { min: 120, max: 180, default: 140 },
    progressions: [
      { id: 'bluegrass-I-IV-V', name: 'Bluegrass I – IV – V', degrees: [0, 3, 4, 0], romanDisplay: 'I – IV – V – I' },
      { id: 'bluegrass-I-V-I', name: 'I – V – I', degrees: [0, 4, 0], romanDisplay: 'I – V – I' },
      { id: 'bluegrass-gospel', name: 'Gospel', degrees: [0, 0, 3, 3, 0, 0, 4, 4], romanDisplay: 'I-I-IV-IV-I-I-V-V' },
    ],
  },
  {
    id: 'folk',
    name: 'Folk',
    emoji: '🪗',
    bpmRange: { min: 90, max: 130, default: 105 },
    progressions: [
      { id: 'folk-I-IV-V', name: 'Folk I – IV – V', degrees: [0, 3, 4], romanDisplay: 'I – IV – V' },
      { id: 'folk-I-V-vi-IV', name: 'Folk Four Chords', degrees: [0, 4, 5, 3], romanDisplay: 'I – V – vi – IV' },
      { id: 'folk-I-iii-IV-V', name: 'I – iii – IV – V', degrees: [0, 2, 3, 4], romanDisplay: 'I – iii – IV – V' },
      { id: 'folk-circle', name: 'Circle', degrees: [0, 5, 1, 4], romanDisplay: 'I – vi – ii – V' },
    ],
  },
];

// ========== CHORD RESOLUTION FUNCTIONS ==========

export interface ScaleChordInfo {
  roman: string;
  chordSymbol: string;
  noteName: NoteName;
  quality: ChordQuality;
  degreeIndex: number;
}

export function resolveScaleChords(key: NoteName, scale: ScaleDefinition, useFlats = false): ScaleChordInfo[] {
  const rootIndex = NOTE_NAMES.indexOf(key);
  const nameSource = useFlats ? FLAT_NOTE_NAMES : NOTE_NAMES;

  return scale.degrees.map((degree, degreeIndex) => {
    const noteIndex = (rootIndex + degree.interval) % 12;
    const noteName = nameSource[noteIndex] as NoteName;
    const chordSymbol = noteName + QUALITY_SUFFIX[degree.quality];

    return {
      roman: degree.roman,
      chordSymbol,
      noteName: NOTE_NAMES[noteIndex],
      quality: degree.quality,
      degreeIndex,
    };
  });
}

export function resolvePresetChordSymbols(
  preset: ProgressionPreset,
  key: NoteName,
  selectedScale: ScaleDefinition,
  useFlats = false
): string {
  const scale = preset.scaleId ? SCALES.find((s) => s.id === preset.scaleId) ?? selectedScale : selectedScale;
  const scaleChords = resolveScaleChords(key, scale, useFlats);
  return preset.degrees.map((degreeIdx) => scaleChords[degreeIdx]?.chordSymbol ?? '?').join(' – ');
}

export function resolvePresetChords(
  preset: ProgressionPreset,
  key: NoteName,
  selectedScale: ScaleDefinition,
  useFlats = false
): ScaleChordInfo[] {
  const scale = preset.scaleId ? SCALES.find((s) => s.id === preset.scaleId) ?? selectedScale : selectedScale;
  const scaleChords = resolveScaleChords(key, scale, useFlats);
  return preset.degrees.map((degreeIdx) => scaleChords[degreeIdx]).filter(Boolean);
}

// ========== CHORD LIBRARY LOOKUP ==========

export function findChordInLibrary(chordSymbol: string, quality: string): ChordData | null {
  // Build merged library
  const customChords = useCustomChordStore.getState().customChords;
  const hiddenStandardChords = useCustomChordStore.getState().hiddenStandardChords;

  const converted = customChords.map(customToLibraryChord);
  const replacedIds = new Set(customChords.filter((c) => c.sourceChordId).map((c) => c.sourceChordId!));

  const standardChords = CHORD_DATABASE.filter((c) => !replacedIds.has(c.id) && !hiddenStandardChords.has(c.id));
  const allChords = [...standardChords, ...converted] as ChordData[];

  // Quality to ChordType mapping
  const types = qualityToChordType(quality);

  // 1. Exact match
  let match = allChords.find((c) => c.symbol === chordSymbol && types.includes(c.type));
  if (match) return match;

  // 2. Enharmonic equivalents
  const enharmonics = getEnharmonicEquivalents(chordSymbol);
  for (const alt of enharmonics) {
    match = allChords.find((c) => c.symbol === alt && types.includes(c.type));
    if (match) return match;
  }

  // 3. Fallback: same root + type
  const root = chordSymbol.match(/^([A-G][#b]?)/)?.[1];
  if (root) {
    match = allChords.find((c) => c.symbol.startsWith(root) && types.includes(c.type));
    if (match) return match;
  }

  return null;
}

function qualityToChordType(quality: string): string[] {
  const map: Record<string, string[]> = {
    maj: ['major'],
    min: ['minor'],
    dim: ['diminished'],
    aug: ['augmented'],
    dom7: ['dominant7'],
    maj7: ['major7'],
    min7: ['minor7'],
    halfDim7: ['halfDim7'],
    dim7: ['dim7'],
    sus4: ['sus4', 'sus2'],
  };
  return map[quality] ?? [];
}

function getEnharmonicEquivalents(symbol: string): string[] {
  const pairs = [
    ['C#', 'Db'],
    ['D#', 'Eb'],
    ['F#', 'Gb'],
    ['G#', 'Ab'],
    ['A#', 'Bb'],
  ];
  const result: string[] = [];

  for (const [sharp, flat] of pairs) {
    if (symbol.startsWith(sharp)) {
      result.push(symbol.replace(sharp, flat));
    } else if (symbol.startsWith(flat)) {
      result.push(symbol.replace(flat, sharp));
    }
  }

  return result;
}
