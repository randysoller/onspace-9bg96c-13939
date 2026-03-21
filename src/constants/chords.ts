import { ChordData } from '@/types/chord';

export const CHORD_DATABASE: ChordData[] = [
  // C Major family
  { root: 'C', type: 'major', category: 'Major', frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], rootString: 1 },
  { root: 'C', type: 'minor', category: 'Minor', frets: [-1, 3, 1, 0, 1, 3], fingers: [0, 3, 1, 0, 1, 4], rootString: 1 },
  { root: 'C', type: '7', category: 'Dominant', frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], rootString: 1 },
  { root: 'C', type: 'maj7', category: 'Major', frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], rootString: 1 },
  
  // D Major family
  { root: 'D', type: 'major', category: 'Major', frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], rootString: 2 },
  { root: 'D', type: 'minor', category: 'Minor', frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], rootString: 2 },
  { root: 'D', type: '7', category: 'Dominant', frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], rootString: 2 },
  { root: 'D', type: 'maj7', category: 'Major', frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1], barres: [1], rootString: 2 },
  
  // E Major family
  { root: 'E', type: 'major', category: 'Major', frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], rootString: 0 },
  { root: 'E', type: 'minor', category: 'Minor', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], rootString: 0 },
  { root: 'E', type: '7', category: 'Dominant', frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], rootString: 0 },
  { root: 'E', type: 'maj7', category: 'Major', frets: [0, 2, 1, 1, 0, 0], fingers: [0, 3, 1, 2, 0, 0], rootString: 0 },
  
  // F Major family
  { root: 'F', type: 'major', category: 'Major', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barres: [1], rootString: 0 },
  { root: 'F', type: 'minor', category: 'Minor', frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], barres: [1], rootString: 0 },
  { root: 'F', type: '7', category: 'Dominant', frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], barres: [1], rootString: 0 },
  
  // G Major family
  { root: 'G', type: 'major', category: 'Major', frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], rootString: 0 },
  { root: 'G', type: 'minor', category: 'Minor', frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], barres: [3], rootString: 0 },
  { root: 'G', type: '7', category: 'Dominant', frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], rootString: 0 },
  { root: 'G', type: 'maj7', category: 'Major', frets: [3, 2, 0, 0, 0, 2], fingers: [3, 1, 0, 0, 0, 2], rootString: 0 },
  
  // A Major family
  { root: 'A', type: 'major', category: 'Major', frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], rootString: 1 },
  { root: 'A', type: 'minor', category: 'Minor', frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], rootString: 1 },
  { root: 'A', type: '7', category: 'Dominant', frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], rootString: 1 },
  { root: 'A', type: 'maj7', category: 'Major', frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0], rootString: 1 },
  
  // B Major family
  { root: 'B', type: 'major', category: 'Major', frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 3, 3, 3, 1], barres: [2], rootString: 1 },
  { root: 'B', type: 'minor', category: 'Minor', frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barres: [2], rootString: 1 },
  { root: 'B', type: '7', category: 'Dominant', frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], rootString: 1 },
  
  // Sharps/Flats - C#/Db
  { root: 'C#', type: 'major', category: 'Major', frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 3, 3, 3, 1], barres: [4], rootString: 1 },
  { root: 'C#', type: 'minor', category: 'Minor', frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], barres: [4], rootString: 1 },
  
  // D#/Eb
  { root: 'D#', type: 'major', category: 'Major', frets: [-1, -1, 1, 3, 4, 3], fingers: [0, 0, 1, 2, 4, 3], rootString: 2 },
  { root: 'D#', type: 'minor', category: 'Minor', frets: [-1, -1, 1, 3, 4, 2], fingers: [0, 0, 1, 3, 4, 2], rootString: 2 },
  
  // F#/Gb
  { root: 'F#', type: 'major', category: 'Major', frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], barres: [2], rootString: 0 },
  { root: 'F#', type: 'minor', category: 'Minor', frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], barres: [2], rootString: 0 },
  
  // G#/Ab
  { root: 'G#', type: 'major', category: 'Major', frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], barres: [4], rootString: 0 },
  { root: 'G#', type: 'minor', category: 'Minor', frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], barres: [4], rootString: 0 },
  
  // A#/Bb
  { root: 'A#', type: 'major', category: 'Major', frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 3, 3, 3, 1], barres: [1], rootString: 1 },
  { root: 'A#', type: 'minor', category: 'Minor', frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], barres: [1], rootString: 1 },
  
  // Extended chords
  { root: 'C', type: 'm7', category: 'Minor', frets: [-1, 3, 1, 3, 1, 3], fingers: [0, 3, 1, 4, 1, 4], barres: [1], rootString: 1 },
  { root: 'C', type: 'sus4', category: 'Suspended', frets: [-1, 3, 3, 0, 1, 1], fingers: [0, 2, 3, 0, 1, 1], barres: [1], rootString: 1 },
  { root: 'C', type: 'sus2', category: 'Suspended', frets: [-1, 3, 0, 0, 3, 3], fingers: [0, 2, 0, 0, 3, 4], rootString: 1 },
  { root: 'D', type: 'm7', category: 'Minor', frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 3, 1, 2], rootString: 2 },
  { root: 'E', type: 'm7', category: 'Minor', frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], rootString: 0 },
  { root: 'G', type: 'sus4', category: 'Suspended', frets: [3, 3, 0, 0, 1, 3], fingers: [2, 3, 0, 0, 1, 4], rootString: 0 },
  { root: 'A', type: 'sus4', category: 'Suspended', frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 4, 0], rootString: 1 },
];

export const CHORD_ROOTS: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const CHORD_CATEGORIES = [
  'Major',
  'Minor',
  'Dominant',
  'Suspended',
  'Augmented',
  'Diminished',
];

export const CHORD_TYPES = [
  'major',
  'minor',
  '7',
  'maj7',
  'm7',
  'sus4',
  'sus2',
  'dim',
  'aug',
];
