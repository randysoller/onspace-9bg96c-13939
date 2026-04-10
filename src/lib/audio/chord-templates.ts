/**
 * Chord Templates for Chromagram-based Recognition
 * Defines expected chroma patterns for common chord types
 * 
 * @module chord-templates
 */

import type { ChromaVector } from './chromagram';

/**
 * Chord template definition
 */
export interface ChordTemplate {
  name: string;
  symbol: string;
  intervals: number[]; // Semitones from root
  chroma: ChromaVector; // 12-bin normalized template
  category: 'major' | 'minor' | 'dominant' | 'diminished' | 'augmented' | 'extended';
}

/**
 * Create normalized chroma template from intervals
 * @param intervals - Array of semitone intervals from root (e.g., [0, 4, 7] for major)
 * @returns 12-bin chroma vector with 1.0 at chord tones, 0.0 elsewhere
 */
function createTemplate(intervals: number[]): ChromaVector {
  const chroma = new Array(12).fill(0);
  
  // Set chord tones to 1.0
  intervals.forEach(interval => {
    const pitchClass = interval % 12;
    chroma[pitchClass] = 1.0;
  });
  
  return chroma;
}

/**
 * All chord templates
 * Root note is always 0 (will be transposed during matching)
 */
export const CHORD_TEMPLATES: ChordTemplate[] = [
  // MAJOR CHORDS
  {
    name: 'Major',
    symbol: '',
    intervals: [0, 4, 7], // Root, Major 3rd, Perfect 5th
    chroma: createTemplate([0, 4, 7]),
    category: 'major',
  },
  {
    name: 'Major 7th',
    symbol: 'maj7',
    intervals: [0, 4, 7, 11], // + Major 7th
    chroma: createTemplate([0, 4, 7, 11]),
    category: 'major',
  },
  {
    name: 'Major 6th',    // Maps to ChordType 'major6'; displayed as e.g. 'C6'
    symbol: '6',
    intervals: [0, 4, 7, 9], // Root, Major 3rd, Perfect 5th, Major 6th
    chroma: createTemplate([0, 4, 7, 9]),
    category: 'major',
  },
  {
    name: 'Major 6 Add 9', // Maps to ChordType 'maj6add9'; displayed as e.g. 'C6/9'
    symbol: '6/9',
    intervals: [0, 4, 7, 9, 14], // Root, Major 3rd, Perfect 5th, Major 6th, Major 9th
    chroma: createTemplate([0, 2, 4, 7, 9]),
    category: 'major',
  },
  {
    name: 'Major 7♯11',   // Maps to ChordType 'maj7sharp11'; Lydian sound
    symbol: 'maj7#11',
    intervals: [0, 4, 7, 11, 18], // Root, Major 3rd, Perfect 5th, Major 7th, Augmented 11th
    chroma: createTemplate([0, 4, 6, 7, 11]),
    category: 'major',
  },
  {
    name: 'Add 9',        // Maps to ChordType 'add9'; displayed as e.g. 'Cadd9'
    symbol: 'add9',
    intervals: [0, 4, 7, 14], // Root, Major 3rd, Perfect 5th, Major 9th
    chroma: createTemplate([0, 2, 4, 7]),
    category: 'major',
  },
  
  // MINOR CHORDS
  {
    name: 'Minor',
    symbol: 'm',
    intervals: [0, 3, 7], // Root, Minor 3rd, Perfect 5th
    chroma: createTemplate([0, 3, 7]),
    category: 'minor',
  },
  {
    name: 'Minor 7th',
    symbol: 'm7',
    intervals: [0, 3, 7, 10], // + Minor 7th
    chroma: createTemplate([0, 3, 7, 10]),
    category: 'minor',
  },
  {
    name: 'Minor 6th',    // Maps to ChordType 'minor6'; displayed as e.g. 'Cm6'
    symbol: 'm6',
    intervals: [0, 3, 7, 9], // Root, Minor 3rd, Perfect 5th, Major 6th
    chroma: createTemplate([0, 3, 7, 9]),
    category: 'minor',
  },
  {
    name: 'Minor Major 7th',
    symbol: 'mM7',
    intervals: [0, 3, 7, 11], // + Major 7th
    chroma: createTemplate([0, 3, 7, 11]),
    category: 'minor',
  },
  
  // DOMINANT CHORDS
  {
    name: 'Dominant 7th',
    symbol: '7',
    intervals: [0, 4, 7, 10], // Major triad + Minor 7th
    chroma: createTemplate([0, 4, 7, 10]),
    category: 'dominant',
  },
  {
    name: 'Dominant 7th ♭5', // Maps to ChordType 'dom7b5'; tritone substitution color
    symbol: '7b5',
    intervals: [0, 4, 6, 10], // Root, Major 3rd, Diminished 5th, Minor 7th
    chroma: createTemplate([0, 4, 6, 10]),
    category: 'dominant',
  },
  {
    name: 'Dominant 7th ♯9', // Maps to ChordType 'dom7sharp9'; the 'Hendrix chord'
    symbol: '7#9',
    intervals: [0, 4, 7, 10, 15], // Root, Major 3rd, Perfect 5th, Minor 7th, Augmented 9th
    chroma: createTemplate([0, 3, 4, 7, 10]),
    category: 'dominant',
  },
  {
    name: 'Dominant 7th ♭9', // Maps to ChordType 'dom7b9'; strong resolution tension
    symbol: '7b9',
    intervals: [0, 4, 7, 10, 13], // Root, Major 3rd, Perfect 5th, Minor 7th, Minor 9th
    chroma: createTemplate([0, 1, 4, 7, 10]),
    category: 'dominant',
  },
  {
    name: 'Dominant 7th ♯5♯9', // Maps to ChordType 'dom7sharp5sharp9'; altered dominant
    symbol: '7#5#9',
    intervals: [0, 4, 8, 10, 15], // Root, Major 3rd, Augmented 5th, Minor 7th, Augmented 9th
    chroma: createTemplate([0, 3, 4, 8, 10]),
    category: 'dominant',
  },
  {
    name: 'Dominant 9th',
    symbol: '9',
    intervals: [0, 4, 7, 10, 14], // + Major 9th
    chroma: createTemplate([0, 2, 4, 7, 10]),
    category: 'dominant',
  },
  {
    name: 'Dominant 7th Sus4',
    symbol: '7sus4',
    intervals: [0, 5, 7, 10], // Suspended 4th instead of 3rd
    chroma: createTemplate([0, 5, 7, 10]),
    category: 'dominant',
  },
  
  // DIMINISHED CHORDS
  {
    name: 'Diminished',
    symbol: 'dim',
    intervals: [0, 3, 6], // Root, Minor 3rd, Diminished 5th
    chroma: createTemplate([0, 3, 6]),
    category: 'diminished',
  },
  {
    name: 'Diminished 7th',
    symbol: 'dim7',
    intervals: [0, 3, 6, 9], // + Diminished 7th (double flat 7)
    chroma: createTemplate([0, 3, 6, 9]),
    category: 'diminished',
  },
  {
    name: 'Half-Diminished 7th',
    symbol: 'm7b5',
    intervals: [0, 3, 6, 10], // + Minor 7th
    chroma: createTemplate([0, 3, 6, 10]),
    category: 'diminished',
  },
  
  // AUGMENTED CHORDS
  {
    name: 'Augmented',
    symbol: 'aug',
    intervals: [0, 4, 8], // Root, Major 3rd, Augmented 5th
    chroma: createTemplate([0, 4, 8]),
    category: 'augmented',
  },
  {
    name: 'Augmented 7th',
    symbol: 'aug7',
    intervals: [0, 4, 8, 10], // + Minor 7th
    chroma: createTemplate([0, 4, 8, 10]),
    category: 'augmented',
  },
  {
    name: 'Augmented 7th ♭9', // Maps to 'aug7b9'; altered dominant — raised 5th + minor 9th tension
    symbol: 'aug7b9',
    intervals: [0, 4, 8, 10, 13], // Root, Major 3rd, Augmented 5th, Minor 7th, Minor 9th
    chroma: createTemplate([0, 1, 4, 8, 10]), // 13 % 12 = 1 (minor 9th pitch class)
    category: 'augmented',
  },
  
  // SUSPENDED CHORDS
  {
    name: 'Suspended 2nd',
    symbol: 'sus2',
    intervals: [0, 2, 7], // Root, Major 2nd, Perfect 5th
    chroma: createTemplate([0, 2, 7]),
    category: 'major',
  },
  {
    name: 'Suspended 4th',
    symbol: 'sus4',
    intervals: [0, 5, 7], // Root, Perfect 4th, Perfect 5th
    chroma: createTemplate([0, 5, 7]),
    category: 'major',
  },
  
  // EXTENDED CHORDS
  {
    name: 'Major 9th',
    symbol: 'maj9',
    intervals: [0, 4, 7, 11, 14], // Major 7th + Major 9th
    chroma: createTemplate([0, 2, 4, 7, 11]),
    category: 'extended',
  },
  {
    name: 'Minor 9th',
    symbol: 'm9',
    intervals: [0, 3, 7, 10, 14], // Minor 7th + Major 9th
    chroma: createTemplate([0, 2, 3, 7, 10]),
    category: 'extended',
  },
  {
    name: '11th',
    symbol: '11',
    intervals: [0, 4, 7, 10, 14, 17], // 9th + Perfect 11th
    chroma: createTemplate([0, 2, 4, 5, 7, 10]),
    category: 'extended',
  },
  {
    name: '13th',
    symbol: '13',
    intervals: [0, 4, 7, 10, 14, 21], // 9th + Major 13th
    chroma: createTemplate([0, 2, 4, 7, 9, 10]),
    category: 'extended',
  },
  {
    name: 'Major 13th',   // Maps to ChordType 'major13'; Ionian/Lydian extended sound
    symbol: 'maj13',
    intervals: [0, 4, 7, 11, 14, 21], // Root, M3, P5, M7, M9, M13
    chroma: createTemplate([0, 2, 4, 7, 9, 11]),
    category: 'extended',
  },
  {
    name: 'Minor 11th',   // Maps to ChordType 'minor11'; Dorian/Phrygian suspended feel
    symbol: 'm11',
    intervals: [0, 3, 7, 10, 14, 17], // Root, m3, P5, m7, M9, P11
    chroma: createTemplate([0, 2, 3, 5, 7, 10]),
    category: 'extended',
  },
];

/**
 * Get templates by category
 * @param category - Chord category filter
 * @returns Filtered templates
 */
export function getTemplatesByCategory(
  category: ChordTemplate['category']
): ChordTemplate[] {
  return CHORD_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get template by name
 * @param name - Template name (case-insensitive)
 * @returns Template or undefined
 */
export function getTemplateByName(name: string): ChordTemplate | undefined {
  return CHORD_TEMPLATES.find(
    t => t.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get template by symbol
 * @param symbol - Chord symbol (e.g., 'm7', 'maj7')
 * @returns Template or undefined
 */
export function getTemplateBySymbol(symbol: string): ChordTemplate | undefined {
  return CHORD_TEMPLATES.find(t => t.symbol === symbol);
}

/**
 * Common chord progressions for validation
 * Can be used to filter unlikely chord changes
 */
export const COMMON_PROGRESSIONS = {
  // Major key progressions
  major: [
    ['I', 'IV', 'V', 'I'],      // Classic I-IV-V-I
    ['I', 'V', 'vi', 'IV'],     // Pop progression (e.g., C-G-Am-F)
    ['I', 'vi', 'IV', 'V'],     // 50s progression
    ['ii', 'V', 'I'],           // Jazz turnaround
  ],
  
  // Minor key progressions
  minor: [
    ['i', 'iv', 'v', 'i'],      // Natural minor
    ['i', 'VI', 'VII', 'i'],    // Rock progression
    ['i', 'iv', 'VII', 'III'],  // Andalusian cadence
  ],
  
  // Blues progressions
  blues: [
    ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'], // 12-bar blues
  ],
};
