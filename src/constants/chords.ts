import type { ChordData } from '@/types/chord';

export const CHORD_DATABASE: ChordData[] = [
  // ============================================================================
  // OPEN CHORDS - Major
  // ============================================================================
  { id: 'open-c-major', name: 'C Major', symbol: 'C', category: 'open', type: 'major',
    frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1, rootNoteString: 1 },
  { id: 'open-d-major', name: 'D Major', symbol: 'D', category: 'open', type: 'major',
    frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], baseFret: 1, rootNoteString: 2 },
  { id: 'open-e-major', name: 'E Major', symbol: 'E', category: 'open', type: 'major',
    frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], baseFret: 1, rootNoteString: 0 },
  { id: 'open-g-major', name: 'G Major', symbol: 'G', category: 'open', type: 'major',
    frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4], baseFret: 1, rootNoteString: 0 },
  { id: 'open-a-major', name: 'A Major', symbol: 'A', category: 'open', type: 'major',
    frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 2, 1, 3, 0], baseFret: 1, rootNoteString: 1 },

  // ============================================================================
  // OPEN CHORDS - Minor
  // ============================================================================
  { id: 'open-am', name: 'A Minor', symbol: 'Am', category: 'open', type: 'minor',
    frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], baseFret: 1, rootNoteString: 1 },
  { id: 'open-dm', name: 'D Minor', symbol: 'Dm', category: 'open', type: 'minor',
    frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], baseFret: 1, rootNoteString: 2 },
  { id: 'open-em', name: 'E Minor', symbol: 'Em', category: 'open', type: 'minor',
    frets: [0, 2, 2, 0, 0, 0], fingers: [0, 1, 2, 0, 0, 0], baseFret: 1, rootNoteString: 0 },

  // ============================================================================
  // OPEN CHORDS - Dominant 7th
  // ============================================================================
  { id: 'open-a7', name: 'A7', symbol: 'A7', category: 'open', type: 'dominant7',
    frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], baseFret: 1, rootNoteString: 1 },
  { id: 'open-b7', name: 'B7', symbol: 'B7', category: 'open', type: 'dominant7',
    frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], baseFret: 1, rootNoteString: 1 },
  { id: 'open-c7', name: 'C7', symbol: 'C7', category: 'open', type: 'dominant7',
    frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], baseFret: 1, rootNoteString: 1 },
  { id: 'open-d7', name: 'D7', symbol: 'D7', category: 'open', type: 'dominant7',
    frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], baseFret: 1, rootNoteString: 2 },
  { id: 'open-e7', name: 'E7', symbol: 'E7', category: 'open', type: 'dominant7',
    frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], baseFret: 1, rootNoteString: 0 },
  { id: 'open-g7', name: 'G7', symbol: 'G7', category: 'open', type: 'dominant7',
    frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], baseFret: 1, rootNoteString: 0 },

  // ============================================================================
  // OPEN CHORDS - Major 7th
  // ============================================================================
  { id: 'open-amaj7', name: 'Amaj7', symbol: 'Amaj7', category: 'open', type: 'major7',
    frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0], baseFret: 1, rootNoteString: 1 },
  { id: 'open-cmaj7', name: 'Cmaj7', symbol: 'Cmaj7', category: 'open', type: 'major7',
    frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], baseFret: 1, rootNoteString: 1 },
  { id: 'open-dmaj7', name: 'Dmaj7', symbol: 'Dmaj7', category: 'open', type: 'major7',
    frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1], baseFret: 1, rootNoteString: 2 },
  { id: 'open-emaj7', name: 'Emaj7', symbol: 'Emaj7', category: 'open', type: 'major7',
    frets: [0, 2, 1, 1, 0, 0], fingers: [0, 3, 1, 2, 0, 0], baseFret: 1, rootNoteString: 0 },
  { id: 'open-gmaj7', name: 'Gmaj7', symbol: 'Gmaj7', category: 'open', type: 'major7',
    frets: [3, 2, 0, 0, 0, 2], fingers: [3, 1, 0, 0, 0, 2], baseFret: 1, rootNoteString: 0 },

  // ============================================================================
  // OPEN CHORDS - Minor 7th
  // ============================================================================
  { id: 'open-am7', name: 'Am7', symbol: 'Am7', category: 'open', type: 'minor7',
    frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], baseFret: 1, rootNoteString: 1 },
  { id: 'open-dm7', name: 'Dm7', symbol: 'Dm7', category: 'open', type: 'minor7',
    frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], baseFret: 1, rootNoteString: 2 },
  { id: 'open-em7', name: 'Em7', symbol: 'Em7', category: 'open', type: 'minor7',
    frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], baseFret: 1, rootNoteString: 0 },

  // ============================================================================
  // OPEN CHORDS - Suspended
  // ============================================================================
  { id: 'open-asus2', name: 'Asus2', symbol: 'Asus2', category: 'open', type: 'suspended',
    frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 2, 3, 0, 0], baseFret: 1, rootNoteString: 1 },
  { id: 'open-asus4', name: 'Asus4', symbol: 'Asus4', category: 'open', type: 'suspended',
    frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 4, 0], baseFret: 1, rootNoteString: 1 },
  { id: 'open-csus2', name: 'Csus2', symbol: 'Csus2', category: 'open', type: 'suspended',
    frets: [-1, 3, 0, 0, 3, 3], fingers: [0, 2, 0, 0, 3, 4], baseFret: 1, rootNoteString: 1 },
  { id: 'open-csus4', name: 'Csus4', symbol: 'Csus4', category: 'open', type: 'suspended',
    frets: [-1, 3, 3, 0, 1, 1], fingers: [0, 2, 3, 0, 1, 1], baseFret: 1, rootNoteString: 1 },
  { id: 'open-dsus2', name: 'Dsus2', symbol: 'Dsus2', category: 'open', type: 'suspended',
    frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0], baseFret: 1, rootNoteString: 2 },
  { id: 'open-dsus4', name: 'Dsus4', symbol: 'Dsus4', category: 'open', type: 'suspended',
    frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3], baseFret: 1, rootNoteString: 2 },
  { id: 'open-esus4', name: 'Esus4', symbol: 'Esus4', category: 'open', type: 'suspended',
    frets: [0, 2, 2, 2, 0, 0], fingers: [0, 1, 1, 1, 0, 0], baseFret: 1, rootNoteString: 0 },
  { id: 'open-gsus4', name: 'Gsus4', symbol: 'Gsus4', category: 'open', type: 'suspended',
    frets: [3, 3, 0, 0, 1, 3], fingers: [2, 3, 0, 0, 1, 4], baseFret: 1, rootNoteString: 0 },

  // ============================================================================
  // OPEN CHORDS - Augmented
  // ============================================================================
  { id: 'open-caug', name: 'Caug', symbol: 'Caug', category: 'open', type: 'augmented',
    frets: [-1, 3, 2, 1, 1, 0], fingers: [0, 4, 3, 1, 2, 0], baseFret: 1, rootNoteString: 1 },
  { id: 'open-eaug', name: 'Eaug', symbol: 'Eaug', category: 'open', type: 'augmented',
    frets: [0, 3, 2, 1, 1, 0], fingers: [0, 4, 3, 1, 2, 0], baseFret: 1, rootNoteString: 0 },

  // ============================================================================
  // OPEN CHORDS - Diminished
  // ============================================================================
  { id: 'open-adim', name: 'Adim', symbol: 'Adim', category: 'open', type: 'diminished',
    frets: [-1, 0, 1, 2, 1, 2], fingers: [0, 0, 1, 3, 1, 4], baseFret: 1, rootNoteString: 1 },
  { id: 'open-bdim', name: 'Bdim', symbol: 'Bdim', category: 'open', type: 'diminished',
    frets: [-1, 2, 0, 1, 0, 1], fingers: [0, 3, 0, 1, 0, 2], baseFret: 1, rootNoteString: 1 },
  { id: 'open-edim', name: 'Edim', symbol: 'Edim', category: 'open', type: 'diminished',
    frets: [-1, -1, 2, 3, 2, 3], fingers: [0, 0, 1, 3, 2, 4], baseFret: 1, rootNoteString: 2 },

  // ============================================================================
  // OPEN CHORDS - Slash Chords
  // ============================================================================
  { id: 'open-c-g', name: 'C/G', symbol: 'C/G', category: 'open', type: 'slash',
    frets: [3, 3, 2, 0, 1, 0], fingers: [3, 4, 2, 0, 1, 0], baseFret: 1, rootNoteString: 0 },
  { id: 'open-d-f#', name: 'D/F#', symbol: 'D/F#', category: 'open', type: 'slash',
    frets: [2, -1, 0, 2, 3, 2], fingers: [1, 0, 0, 2, 4, 3], baseFret: 1, rootNoteString: 0 },
  { id: 'open-g-b', name: 'G/B', symbol: 'G/B', category: 'open', type: 'slash',
    frets: [-1, 2, 0, 0, 0, 3], fingers: [0, 2, 0, 0, 0, 4], baseFret: 1, rootNoteString: 1 },

  // ============================================================================
  // OPEN CHORDS - Extended (9th, Aug7, HalfDim7, Dim7)
  // ============================================================================
  { id: 'open-a9', name: 'A9', symbol: 'A9', category: 'open', type: '9th',
    frets: [-1, 0, 2, 4, 2, 3], fingers: [0, 0, 1, 3, 2, 4], baseFret: 1, rootNoteString: 1 },
  { id: 'open-e9', name: 'E9', symbol: 'E9', category: 'open', type: '9th',
    frets: [0, 2, 0, 1, 0, 2], fingers: [0, 2, 0, 1, 0, 3], baseFret: 1, rootNoteString: 0 },
  { id: 'open-caug7', name: 'Caug7', symbol: 'Caug7', category: 'open', type: 'aug7',
    frets: [-1, 3, 2, 3, 1, 4], fingers: [0, 3, 2, 4, 1, 5], baseFret: 1, rootNoteString: 1 },
  { id: 'open-am7b5', name: 'Am7b5', symbol: 'Am7b5', category: 'open', type: 'halfDim7',
    frets: [-1, 0, 1, 0, 1, 3], fingers: [0, 0, 1, 0, 2, 4], baseFret: 1, rootNoteString: 1 },
  { id: 'open-adim7', name: 'Adim7', symbol: 'Adim7', category: 'open', type: 'dim7',
    frets: [-1, 0, 1, 2, 1, 2], fingers: [0, 0, 1, 3, 2, 4], baseFret: 1, rootNoteString: 1 },

  // ============================================================================
  // BARRE CHORDS - Major
  // ============================================================================
  { id: 'barre-f-major', name: 'F Major', symbol: 'F', category: 'barre', type: 'major',
    frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-bb-major', name: 'Bb Major', symbol: 'Bb', category: 'barre', type: 'major',
    frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barres: [1],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-a-major', name: 'A Major (Barre)', symbol: 'A', category: 'barre', type: 'major',
    frets: [5, 7, 7, 6, 5, 5], fingers: [1, 3, 4, 2, 1, 1], baseFret: 5, barres: [5],
    rootString: 6, rootNoteString: 0 },

  // ============================================================================
  // BARRE CHORDS - Minor
  // ============================================================================
  { id: 'barre-fm', name: 'F Minor', symbol: 'Fm', category: 'barre', type: 'minor',
    frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-bbm', name: 'Bb Minor', symbol: 'Bbm', category: 'barre', type: 'minor',
    frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barres: [1],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-bm', name: 'B Minor', symbol: 'Bm', category: 'barre', type: 'minor',
    frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2, barres: [2],
    rootString: 5, rootNoteString: 1 },

  // ============================================================================
  // BARRE CHORDS - Dominant 7th
  // ============================================================================
  { id: 'barre-f7', name: 'F7', symbol: 'F7', category: 'barre', type: 'dominant7',
    frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-bb7', name: 'Bb7', symbol: 'Bb7', category: 'barre', type: 'dominant7',
    frets: [-1, 1, 3, 1, 3, 1], fingers: [0, 1, 3, 1, 4, 1], baseFret: 1, barres: [1],
    rootString: 5, rootNoteString: 1 },

  // ============================================================================
  // BARRE CHORDS - Major 7th
  // ============================================================================
  { id: 'barre-fmaj7', name: 'Fmaj7', symbol: 'Fmaj7', category: 'barre', type: 'major7',
    frets: [1, 3, 2, 2, 1, 1], fingers: [1, 4, 2, 3, 1, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-bbmaj7', name: 'Bbmaj7', symbol: 'Bbmaj7', category: 'barre', type: 'major7',
    frets: [-1, 1, 3, 2, 3, 1], fingers: [0, 1, 3, 2, 4, 1], baseFret: 1, barres: [1],
    rootString: 5, rootNoteString: 1 },

  // ============================================================================
  // BARRE CHORDS - Minor 7th
  // ============================================================================
  { id: 'barre-fm7', name: 'Fm7', symbol: 'Fm7', category: 'barre', type: 'minor7',
    frets: [1, 3, 1, 1, 1, 1], fingers: [1, 3, 1, 1, 1, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-bbm7', name: 'Bbm7', symbol: 'Bbm7', category: 'barre', type: 'minor7',
    frets: [-1, 1, 3, 1, 2, 1], fingers: [0, 1, 4, 1, 2, 1], baseFret: 1, barres: [1],
    rootString: 5, rootNoteString: 1 },

  // ============================================================================
  // BARRE CHORDS - Suspended
  // ============================================================================
  { id: 'barre-fsus4', name: 'Fsus4', symbol: 'Fsus4', category: 'barre', type: 'suspended',
    frets: [1, 3, 3, 3, 1, 1], fingers: [1, 2, 3, 4, 1, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-bbsus4', name: 'Bbsus4', symbol: 'Bbsus4', category: 'barre', type: 'suspended',
    frets: [-1, 1, 3, 3, 4, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barres: [1],
    rootString: 5, rootNoteString: 1 },

  // ============================================================================
  // BARRE CHORDS - Extended
  // ============================================================================
  { id: 'barre-f9', name: 'F9', symbol: 'F9', category: 'barre', type: '9th',
    frets: [1, 3, 1, 2, 1, 3], fingers: [1, 3, 1, 2, 1, 4], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-faug7', name: 'Faug7', symbol: 'Faug7', category: 'barre', type: 'aug7',
    frets: [1, 4, 1, 2, 2, 1], fingers: [1, 4, 1, 2, 3, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-fm7b5', name: 'Fm7b5', symbol: 'Fm7b5', category: 'barre', type: 'halfDim7',
    frets: [1, 3, 1, 2, 4, 1], fingers: [1, 2, 1, 3, 4, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-fdim7', name: 'Fdim7', symbol: 'Fdim7', category: 'barre', type: 'dim7',
    frets: [-1, -1, 3, 4, 3, 4], fingers: [0, 0, 1, 3, 2, 4], baseFret: 1,
    rootString: 4, rootNoteString: 2 },

  // ============================================================================
  // MOVABLE CHORDS - Major
  // ============================================================================
  { id: 'mov-c-major-8', name: 'C Major (8th pos)', symbol: 'C', category: 'movable', type: 'major',
    frets: [8, 10, 10, 9, 8, 8], fingers: [1, 3, 4, 2, 1, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },
  { id: 'mov-d-major-5', name: 'D Major (5th pos)', symbol: 'D', category: 'movable', type: 'major',
    frets: [-1, 5, 7, 7, 7, 5], fingers: [0, 1, 2, 3, 4, 1], baseFret: 5, barres: [5],
    rootString: 5, rootNoteString: 1 },
  { id: 'mov-e-major-7', name: 'E Major (7th pos)', symbol: 'E', category: 'movable', type: 'major',
    frets: [-1, 7, 9, 9, 9, 7], fingers: [0, 1, 2, 3, 4, 1], baseFret: 7, barres: [7],
    rootString: 5, rootNoteString: 1 },

  // ============================================================================
  // MOVABLE CHORDS - Minor
  // ============================================================================
  { id: 'mov-c-minor-8', name: 'C Minor (8th pos)', symbol: 'Cm', category: 'movable', type: 'minor',
    frets: [8, 10, 10, 8, 8, 8], fingers: [1, 3, 4, 1, 1, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },
  { id: 'mov-d-minor-5', name: 'D Minor (5th pos)', symbol: 'Dm', category: 'movable', type: 'minor',
    frets: [-1, 5, 7, 7, 6, 5], fingers: [0, 1, 3, 4, 2, 1], baseFret: 5, barres: [5],
    rootString: 5, rootNoteString: 1 },

  // ============================================================================
  // MOVABLE CHORDS - Dominant 7th
  // ============================================================================
  { id: 'mov-c7-8', name: 'C7 (8th pos)', symbol: 'C7', category: 'movable', type: 'dominant7',
    frets: [8, 10, 8, 9, 8, 8], fingers: [1, 3, 1, 2, 1, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },
  { id: 'mov-d7-5', name: 'D7 (5th pos)', symbol: 'D7', category: 'movable', type: 'dominant7',
    frets: [-1, 5, 7, 5, 7, 5], fingers: [0, 1, 3, 1, 4, 1], baseFret: 5, barres: [5],
    rootString: 5, rootNoteString: 1 },

  // ============================================================================
  // MOVABLE CHORDS - Major 7th
  // ============================================================================
  { id: 'mov-cmaj7-8', name: 'Cmaj7 (8th pos)', symbol: 'Cmaj7', category: 'movable', type: 'major7',
    frets: [8, 10, 9, 9, 8, 8], fingers: [1, 4, 2, 3, 1, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },
  { id: 'mov-dmaj7-5', name: 'Dmaj7 (5th pos)', symbol: 'Dmaj7', category: 'movable', type: 'major7',
    frets: [-1, 5, 7, 6, 7, 5], fingers: [0, 1, 3, 2, 4, 1], baseFret: 5, barres: [5],
    rootString: 5, rootNoteString: 1 },

  // ============================================================================
  // MOVABLE CHORDS - Minor 7th
  // ============================================================================
  { id: 'mov-cm7-8', name: 'Cm7 (8th pos)', symbol: 'Cm7', category: 'movable', type: 'minor7',
    frets: [8, 10, 8, 8, 8, 8], fingers: [1, 3, 1, 1, 1, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },
  { id: 'mov-dm7-5', name: 'Dm7 (5th pos)', symbol: 'Dm7', category: 'movable', type: 'minor7',
    frets: [-1, 5, 7, 5, 6, 5], fingers: [0, 1, 4, 1, 2, 1], baseFret: 5, barres: [5],
    rootString: 5, rootNoteString: 1 },

  // ============================================================================
  // MOVABLE CHORDS - Extended
  // ============================================================================
  { id: 'mov-c9-8', name: 'C9 (8th pos)', symbol: 'C9', category: 'movable', type: '9th',
    frets: [8, 10, 8, 9, 8, 10], fingers: [1, 3, 1, 2, 1, 4], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },
  { id: 'mov-c11-8', name: 'C11 (8th pos)', symbol: 'C11', category: 'movable', type: '11th',
    frets: [8, 10, 8, 9, 11, 8], fingers: [1, 2, 1, 3, 4, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },
  { id: 'mov-c13-8', name: 'C13 (8th pos)', symbol: 'C13', category: 'movable', type: '13th',
    frets: [8, 10, 8, 9, 10, 10], fingers: [1, 3, 1, 2, 4, 4], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },
  { id: 'mov-caug7-8', name: 'Caug7 (8th pos)', symbol: 'Caug7', category: 'movable', type: 'aug7',
    frets: [8, 11, 8, 9, 9, 8], fingers: [1, 4, 1, 2, 3, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },
  { id: 'mov-cm7b5-8', name: 'Cm7b5 (8th pos)', symbol: 'Cm7b5', category: 'movable', type: 'halfDim7',
    frets: [8, 10, 8, 9, 11, 8], fingers: [1, 2, 1, 3, 4, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },
  { id: 'mov-cdim7-8', name: 'Cdim7 (8th pos)', symbol: 'Cdim7', category: 'movable', type: 'dim7',
    frets: [-1, -1, 11, 12, 11, 12], fingers: [0, 0, 1, 3, 2, 4], baseFret: 8,
    rootString: 4, rootNoteString: 2 },
];
