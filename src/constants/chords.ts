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
  { id: 'open-asus2', name: 'Asus2', symbol: 'Asus2', category: 'open', type: 'sus2',
    frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 2, 3, 0, 0], baseFret: 1, rootNoteString: 1 },
  { id: 'open-asus4', name: 'Asus4', symbol: 'Asus4', category: 'open', type: 'sus4',
    frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 4, 0], baseFret: 1, rootNoteString: 1 },
  { id: 'open-csus2', name: 'Csus2', symbol: 'Csus2', category: 'open', type: 'sus2',
    frets: [-1, 3, 0, 0, 3, 3], fingers: [0, 2, 0, 0, 3, 4], baseFret: 1, rootNoteString: 1 },
  { id: 'open-csus4', name: 'Csus4', symbol: 'Csus4', category: 'open', type: 'sus4',
    frets: [-1, 3, 3, 0, 1, 1], fingers: [0, 2, 3, 0, 1, 1], baseFret: 1, rootNoteString: 1 },
  { id: 'open-dsus2', name: 'Dsus2', symbol: 'Dsus2', category: 'open', type: 'sus2',
    frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0], baseFret: 1, rootNoteString: 2 },
  { id: 'open-dsus4', name: 'Dsus4', symbol: 'Dsus4', category: 'open', type: 'sus4',
    frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3], baseFret: 1, rootNoteString: 2 },
  { id: 'open-esus4', name: 'Esus4', symbol: 'Esus4', category: 'open', type: 'sus4',
    frets: [0, 2, 2, 2, 0, 0], fingers: [0, 1, 1, 1, 0, 0], baseFret: 1, rootNoteString: 0 },
  { id: 'open-gsus4', name: 'Gsus4', symbol: 'Gsus4', category: 'open', type: 'sus4',
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
  // BARRE CHORDS - Major (E-shape, Root 6)
  // Barre at fret N: frets [N, N+2, N+2, N+1, N, N], fingers [1,3,4,2,1,1]
  // 6th string notes: F=1, F#/Gb=2, G=3, Ab/G#=4, A=5, Bb/A#=6,
  //                   B/Cb=7, C/B#=8, Db/C#=9, D=10, Eb/D#=11, E=12
  // ============================================================================

  // F  (fret 1)
  { id: 'barre-f-major', name: 'F Major Root 6 Barre', symbol: 'F', category: 'barre', type: 'major',
    frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },

  // F# / Gb  (fret 2)
  { id: 'barre-fsharp-major', name: 'F# Major Root 6 Barre', symbol: 'F#', category: 'barre', type: 'major',
    frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barres: [2],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-gb-major', name: 'Gb Major Root 6 Barre', symbol: 'Gb', category: 'barre', type: 'major',
    frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barres: [2],
    rootString: 6, rootNoteString: 0 },

  // G  (fret 3)
  { id: 'barre-g-major-e6', name: 'G Major Root 6 Barre', symbol: 'G', category: 'barre', type: 'major',
    frets: [3, 5, 5, 4, 3, 3], fingers: [1, 3, 4, 2, 1, 1], baseFret: 3, barres: [3],
    rootString: 6, rootNoteString: 0 },

  // G# / Ab  (fret 4)
  { id: 'barre-gsharp-major', name: 'G# Major Root 6 Barre', symbol: 'G#', category: 'barre', type: 'major',
    frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], baseFret: 4, barres: [4],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-ab-major', name: 'Ab Major Root 6 Barre', symbol: 'Ab', category: 'barre', type: 'major',
    frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], baseFret: 4, barres: [4],
    rootString: 6, rootNoteString: 0 },

  // A  (fret 5)
  { id: 'barre-a-major', name: 'A Major Root 6 Barre', symbol: 'A', category: 'barre', type: 'major',
    frets: [5, 7, 7, 6, 5, 5], fingers: [1, 3, 4, 2, 1, 1], baseFret: 5, barres: [5],
    rootString: 6, rootNoteString: 0 },

  // A# / Bb  (fret 6)
  { id: 'barre-asharp-major', name: 'A# Major Root 6 Barre', symbol: 'A#', category: 'barre', type: 'major',
    frets: [6, 8, 8, 7, 6, 6], fingers: [1, 3, 4, 2, 1, 1], baseFret: 6, barres: [6],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-bb-major-e6', name: 'Bb Major Root 6 Barre', symbol: 'Bb', category: 'barre', type: 'major',
    frets: [6, 8, 8, 7, 6, 6], fingers: [1, 3, 4, 2, 1, 1], baseFret: 6, barres: [6],
    rootString: 6, rootNoteString: 0 },

  // B / Cb  (fret 7)
  { id: 'barre-b-major-e6', name: 'B Major Root 6 Barre', symbol: 'B', category: 'barre', type: 'major',
    frets: [7, 9, 9, 8, 7, 7], fingers: [1, 3, 4, 2, 1, 1], baseFret: 7, barres: [7],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-cb-major', name: 'Cb Major Root 6 Barre', symbol: 'Cb', category: 'barre', type: 'major',
    frets: [7, 9, 9, 8, 7, 7], fingers: [1, 3, 4, 2, 1, 1], baseFret: 7, barres: [7],
    rootString: 6, rootNoteString: 0 },

  // C / B#  (fret 8)
  { id: 'barre-c-major-e6', name: 'C Major Root 6 Barre', symbol: 'C', category: 'barre', type: 'major',
    frets: [8, 10, 10, 9, 8, 8], fingers: [1, 3, 4, 2, 1, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-bsharp-major', name: 'B# Major Root 6 Barre', symbol: 'B#', category: 'barre', type: 'major',
    frets: [8, 10, 10, 9, 8, 8], fingers: [1, 3, 4, 2, 1, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },

  // C# / Db  (fret 9)
  { id: 'barre-csharp-major-e6', name: 'C# Major Root 6 Barre', symbol: 'C#', category: 'barre', type: 'major',
    frets: [9, 11, 11, 10, 9, 9], fingers: [1, 3, 4, 2, 1, 1], baseFret: 9, barres: [9],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-db-major-e6', name: 'Db Major Root 6 Barre', symbol: 'Db', category: 'barre', type: 'major',
    frets: [9, 11, 11, 10, 9, 9], fingers: [1, 3, 4, 2, 1, 1], baseFret: 9, barres: [9],
    rootString: 6, rootNoteString: 0 },

  // D  (fret 10)
  { id: 'barre-d-major-e6', name: 'D Major Root 6 Barre', symbol: 'D', category: 'barre', type: 'major',
    frets: [10, 12, 12, 11, 10, 10], fingers: [1, 3, 4, 2, 1, 1], baseFret: 10, barres: [10],
    rootString: 6, rootNoteString: 0 },

  // D# / Eb  (fret 11)
  { id: 'barre-dsharp-major-e6', name: 'D# Major Root 6 Barre', symbol: 'D#', category: 'barre', type: 'major',
    frets: [11, 13, 13, 12, 11, 11], fingers: [1, 3, 4, 2, 1, 1], baseFret: 11, barres: [11],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-eb-major-e6', name: 'Eb Major Root 6 Barre', symbol: 'Eb', category: 'barre', type: 'major',
    frets: [11, 13, 13, 12, 11, 11], fingers: [1, 3, 4, 2, 1, 1], baseFret: 11, barres: [11],
    rootString: 6, rootNoteString: 0 },

  // E  (fret 12 — octave)
  { id: 'barre-e-major-e6-12', name: 'E Major Root 6 Barre', symbol: 'E', category: 'barre', type: 'major',
    frets: [12, 14, 14, 13, 12, 12], fingers: [1, 3, 4, 2, 1, 1], baseFret: 12, barres: [12],
    rootString: 6, rootNoteString: 0 },

  // Fb (enharmonic E)  (fret 12)
  { id: 'barre-fb-major', name: 'Fb Major Root 6 Barre', symbol: 'Fb', category: 'barre', type: 'major',
    frets: [12, 14, 14, 13, 12, 12], fingers: [1, 3, 4, 2, 1, 1], baseFret: 12, barres: [12],
    rootString: 6, rootNoteString: 0 },

  // E# (enharmonic F)  (fret 1 — same as F)
  { id: 'barre-esharp-major', name: 'E# Major Root 6 Barre', symbol: 'E#', category: 'barre', type: 'major',
    frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },

  // ── Legacy A-shape root-5 barre (kept for compatibility) ──────────────────
  { id: 'barre-bb-major', name: 'Bb Major (A-shape)', symbol: 'Bb', category: 'barre', type: 'major',
    frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barres: [1],
    rootString: 5, rootNoteString: 1 },

  // ============================================================================
  // BARRE CHORDS - Major (A-shape, Root 5)
  // Barre at fret N: frets [-1, N, N+2, N+2, N+2, -1], fingers [0,1,3,3,3,0]
  // 5th string notes: Bb=1, B=2, C=3, Db/C#=4, D=5, Eb/D#=6,
  //                   E=7, F=8, F#/Gb=9, G=10, Ab/G#=11, A=12
  // ============================================================================

  // Bb / A#  (fret 1)
  { id: 'barre-r5-bb-major', name: 'Bb Major Root 5 Barre', symbol: 'Bb', category: 'barre', type: 'major',
    frets: [-1, 1, 3, 3, 3, -1], fingers: [0, 1, 3, 3, 3, 0], baseFret: 1, barres: [1, 3],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-asharp-major', name: 'A# Major Root 5 Barre', symbol: 'A#', category: 'barre', type: 'major',
    frets: [-1, 1, 3, 3, 3, -1], fingers: [0, 1, 3, 3, 3, 0], baseFret: 1, barres: [1, 3],
    rootString: 5, rootNoteString: 1 },

  // B  (fret 2)
  { id: 'barre-r5-b-major', name: 'B Major Root 5 Barre', symbol: 'B', category: 'barre', type: 'major',
    frets: [-1, 2, 4, 4, 4, -1], fingers: [0, 1, 3, 3, 3, 0], baseFret: 2, barres: [2, 4],
    rootString: 5, rootNoteString: 1 },

  // C  (fret 3)
  { id: 'barre-r5-c-major', name: 'C Major Root 5 Barre', symbol: 'C', category: 'barre', type: 'major',
    frets: [-1, 3, 5, 5, 5, -1], fingers: [0, 1, 3, 3, 3, 0], baseFret: 3, barres: [3, 5],
    rootString: 5, rootNoteString: 1 },

  // C# / Db  (fret 4)
  { id: 'barre-r5-csharp-major', name: 'C# Major Root 5 Barre', symbol: 'C#', category: 'barre', type: 'major',
    frets: [-1, 4, 6, 6, 6, -1], fingers: [0, 1, 3, 3, 3, 0], baseFret: 4, barres: [4, 6],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-db-major', name: 'Db Major Root 5 Barre', symbol: 'Db', category: 'barre', type: 'major',
    frets: [-1, 4, 6, 6, 6, -1], fingers: [0, 1, 3, 3, 3, 0], baseFret: 4, barres: [4, 6],
    rootString: 5, rootNoteString: 1 },

  // D  (fret 5)
  { id: 'barre-r5-d-major', name: 'D Major Root 5 Barre', symbol: 'D', category: 'barre', type: 'major',
    frets: [-1, 5, 7, 7, 7, -1], fingers: [0, 1, 3, 3, 3, 0], baseFret: 5, barres: [5, 7],
    rootString: 5, rootNoteString: 1 },

  // Eb / D#  (fret 6)
  { id: 'barre-r5-eb-major', name: 'Eb Major Root 5 Barre', symbol: 'Eb', category: 'barre', type: 'major',
    frets: [-1, 6, 8, 8, 8, -1], fingers: [0, 1, 3, 3, 3, 0], baseFret: 6, barres: [6, 8],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-dsharp-major', name: 'D# Major Root 5 Barre', symbol: 'D#', category: 'barre', type: 'major',
    frets: [-1, 6, 8, 8, 8, -1], fingers: [0, 1, 3, 3, 3, 0], baseFret: 6, barres: [6, 8],
    rootString: 5, rootNoteString: 1 },

  // E  (fret 7)
  { id: 'barre-r5-e-major', name: 'E Major Root 5 Barre', symbol: 'E', category: 'barre', type: 'major',
    frets: [-1, 7, 9, 9, 9, -1], fingers: [0, 1, 3, 3, 3, 0], baseFret: 7, barres: [7, 9],
    rootString: 5, rootNoteString: 1 },

  // F  (fret 8)
  { id: 'barre-r5-f-major', name: 'F Major Root 5 Barre', symbol: 'F', category: 'barre', type: 'major',
    frets: [-1, 8, 10, 10, 10, -1], fingers: [0, 1, 3, 3, 3, 0], baseFret: 8, barres: [8, 10],
    rootString: 5, rootNoteString: 1 },

  // F# / Gb  (fret 9)
  { id: 'barre-r5-fsharp-major', name: 'F# Major Root 5 Barre', symbol: 'F#', category: 'barre', type: 'major',
    frets: [-1, 9, 11, 11, 11, -1], fingers: [0, 1, 3, 3, 3, 0], baseFret: 9, barres: [9, 11],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-gb-major', name: 'Gb Major Root 5 Barre', symbol: 'Gb', category: 'barre', type: 'major',
    frets: [-1, 9, 11, 11, 11, -1], fingers: [0, 1, 3, 3, 3, 0], baseFret: 9, barres: [9, 11],
    rootString: 5, rootNoteString: 1 },

  // G  (fret 10)
  { id: 'barre-r5-g-major', name: 'G Major Root 5 Barre', symbol: 'G', category: 'barre', type: 'major',
    frets: [-1, 10, 12, 12, 12, -1], fingers: [0, 1, 3, 3, 3, 0], baseFret: 10, barres: [10, 12],
    rootString: 5, rootNoteString: 1 },

  // Ab / G#  (fret 11)
  { id: 'barre-r5-ab-major', name: 'Ab Major Root 5 Barre', symbol: 'Ab', category: 'barre', type: 'major',
    frets: [-1, 11, 13, 13, 13, -1], fingers: [0, 1, 3, 3, 3, 0], baseFret: 11, barres: [11, 13],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-gsharp-major', name: 'G# Major Root 5 Barre', symbol: 'G#', category: 'barre', type: 'major',
    frets: [-1, 11, 13, 13, 13, -1], fingers: [0, 1, 3, 3, 3, 0], baseFret: 11, barres: [11, 13],
    rootString: 5, rootNoteString: 1 },

  // A  (fret 12 — octave)
  { id: 'barre-r5-a-major', name: 'A Major Root 5 Barre', symbol: 'A', category: 'barre', type: 'major',
    frets: [-1, 12, 14, 14, 14, -1], fingers: [0, 1, 3, 3, 3, 0], baseFret: 12, barres: [12, 14],
    rootString: 5, rootNoteString: 1 },

  // ============================================================================
  // BARRE CHORDS - Minor (A-shape, Root 5)
  // Barre at fret N: frets [-1, N, N+2, N+2, N+1, -1], fingers [0,1,3,4,2,0]
  // 5th string notes: Bb=1, B=2, C=3, Db/C#=4, D=5, Eb/D#=6,
  //                   E=7, F=8, F#/Gb=9, G=10, Ab/G#=11, A=12
  // ============================================================================

  // Bb / A#  (fret 1)
  { id: 'barre-r5-bb-minor', name: 'Bb Minor Root 5 Barre', symbol: 'Bbm', category: 'barre', type: 'minor',
    frets: [-1, 1, 3, 3, 2, -1], fingers: [0, 1, 3, 4, 2, 0], baseFret: 1, barres: [1, 3],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-asharp-minor', name: 'A# Minor Root 5 Barre', symbol: 'A#m', category: 'barre', type: 'minor',
    frets: [-1, 1, 3, 3, 2, -1], fingers: [0, 1, 3, 4, 2, 0], baseFret: 1, barres: [1, 3],
    rootString: 5, rootNoteString: 1 },

  // B  (fret 2)
  { id: 'barre-r5-b-minor', name: 'B Minor Root 5 Barre', symbol: 'Bm', category: 'barre', type: 'minor',
    frets: [-1, 2, 4, 4, 3, -1], fingers: [0, 1, 3, 4, 2, 0], baseFret: 2, barres: [2, 4],
    rootString: 5, rootNoteString: 1 },

  // C  (fret 3)
  { id: 'barre-r5-c-minor', name: 'C Minor Root 5 Barre', symbol: 'Cm', category: 'barre', type: 'minor',
    frets: [-1, 3, 5, 5, 4, -1], fingers: [0, 1, 3, 4, 2, 0], baseFret: 3, barres: [3, 5],
    rootString: 5, rootNoteString: 1 },

  // C# / Db  (fret 4)
  { id: 'barre-r5-csharp-minor', name: 'C# Minor Root 5 Barre', symbol: 'C#m', category: 'barre', type: 'minor',
    frets: [-1, 4, 6, 6, 5, -1], fingers: [0, 1, 3, 4, 2, 0], baseFret: 4, barres: [4, 6],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-db-minor', name: 'Db Minor Root 5 Barre', symbol: 'Dbm', category: 'barre', type: 'minor',
    frets: [-1, 4, 6, 6, 5, -1], fingers: [0, 1, 3, 4, 2, 0], baseFret: 4, barres: [4, 6],
    rootString: 5, rootNoteString: 1 },

  // D  (fret 5)
  { id: 'barre-r5-d-minor', name: 'D Minor Root 5 Barre', symbol: 'Dm', category: 'barre', type: 'minor',
    frets: [-1, 5, 7, 7, 6, -1], fingers: [0, 1, 3, 4, 2, 0], baseFret: 5, barres: [5, 7],
    rootString: 5, rootNoteString: 1 },

  // Eb / D#  (fret 6)
  { id: 'barre-r5-eb-minor', name: 'Eb Minor Root 5 Barre', symbol: 'Ebm', category: 'barre', type: 'minor',
    frets: [-1, 6, 8, 8, 7, -1], fingers: [0, 1, 3, 4, 2, 0], baseFret: 6, barres: [6, 8],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-dsharp-minor', name: 'D# Minor Root 5 Barre', symbol: 'D#m', category: 'barre', type: 'minor',
    frets: [-1, 6, 8, 8, 7, -1], fingers: [0, 1, 3, 4, 2, 0], baseFret: 6, barres: [6, 8],
    rootString: 5, rootNoteString: 1 },

  // E  (fret 7)
  { id: 'barre-r5-e-minor', name: 'E Minor Root 5 Barre', symbol: 'Em', category: 'barre', type: 'minor',
    frets: [-1, 7, 9, 9, 8, -1], fingers: [0, 1, 3, 4, 2, 0], baseFret: 7, barres: [7, 9],
    rootString: 5, rootNoteString: 1 },

  // F  (fret 8)
  { id: 'barre-r5-f-minor', name: 'F Minor Root 5 Barre', symbol: 'Fm', category: 'barre', type: 'minor',
    frets: [-1, 8, 10, 10, 9, -1], fingers: [0, 1, 3, 4, 2, 0], baseFret: 8, barres: [8, 10],
    rootString: 5, rootNoteString: 1 },

  // F# / Gb  (fret 9)
  { id: 'barre-r5-fsharp-minor', name: 'F# Minor Root 5 Barre', symbol: 'F#m', category: 'barre', type: 'minor',
    frets: [-1, 9, 11, 11, 10, -1], fingers: [0, 1, 3, 4, 2, 0], baseFret: 9, barres: [9, 11],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-gb-minor', name: 'Gb Minor Root 5 Barre', symbol: 'Gbm', category: 'barre', type: 'minor',
    frets: [-1, 9, 11, 11, 10, -1], fingers: [0, 1, 3, 4, 2, 0], baseFret: 9, barres: [9, 11],
    rootString: 5, rootNoteString: 1 },

  // G  (fret 10)
  { id: 'barre-r5-g-minor', name: 'G Minor Root 5 Barre', symbol: 'Gm', category: 'barre', type: 'minor',
    frets: [-1, 10, 12, 12, 11, -1], fingers: [0, 1, 3, 4, 2, 0], baseFret: 10, barres: [10, 12],
    rootString: 5, rootNoteString: 1 },

  // Ab / G#  (fret 11)
  { id: 'barre-r5-ab-minor', name: 'Ab Minor Root 5 Barre', symbol: 'Abm', category: 'barre', type: 'minor',
    frets: [-1, 11, 13, 13, 12, -1], fingers: [0, 1, 3, 4, 2, 0], baseFret: 11, barres: [11, 13],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-gsharp-minor', name: 'G# Minor Root 5 Barre', symbol: 'G#m', category: 'barre', type: 'minor',
    frets: [-1, 11, 13, 13, 12, -1], fingers: [0, 1, 3, 4, 2, 0], baseFret: 11, barres: [11, 13],
    rootString: 5, rootNoteString: 1 },

  // A  (fret 12 — octave)
  { id: 'barre-r5-a-minor', name: 'A Minor Root 5 Barre', symbol: 'Am', category: 'barre', type: 'minor',
    frets: [-1, 12, 14, 14, 13, -1], fingers: [0, 1, 3, 4, 2, 0], baseFret: 12, barres: [12, 14],
    rootString: 5, rootNoteString: 1 },

  // ============================================================================
  // BARRE CHORDS - Dominant 7th (A-shape, Root 5)
  // Barre at fret N: frets [-1, N, N+2, N, N+2, -1], fingers [0,1,3,1,4,0]
  // 5th string notes: Bb=1, B=2, C=3, Db/C#=4, D=5, Eb/D#=6,
  //                   E=7, F=8, F#/Gb=9, G=10, Ab/G#=11, A=12
  // ============================================================================

  // Bb / A#  (fret 1)
  { id: 'barre-r5-bb-dom7', name: 'Bb Dominant 7th Root 5 Barre', symbol: 'Bb7', category: 'barre', type: 'dominant7',
    frets: [-1, 1, 3, 1, 3, -1], fingers: [0, 1, 3, 1, 4, 0], baseFret: 1, barres: [1],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-asharp-dom7', name: 'A# Dominant 7th Root 5 Barre', symbol: 'A#7', category: 'barre', type: 'dominant7',
    frets: [-1, 1, 3, 1, 3, -1], fingers: [0, 1, 3, 1, 4, 0], baseFret: 1, barres: [1],
    rootString: 5, rootNoteString: 1 },

  // B  (fret 2)
  { id: 'barre-r5-b-dom7', name: 'B Dominant 7th Root 5 Barre', symbol: 'B7', category: 'barre', type: 'dominant7',
    frets: [-1, 2, 4, 2, 4, -1], fingers: [0, 1, 3, 1, 4, 0], baseFret: 2, barres: [2],
    rootString: 5, rootNoteString: 1 },

  // C  (fret 3)
  { id: 'barre-r5-c-dom7', name: 'C Dominant 7th Root 5 Barre', symbol: 'C7', category: 'barre', type: 'dominant7',
    frets: [-1, 3, 5, 3, 5, -1], fingers: [0, 1, 3, 1, 4, 0], baseFret: 3, barres: [3],
    rootString: 5, rootNoteString: 1 },

  // C# / Db  (fret 4)
  { id: 'barre-r5-csharp-dom7', name: 'C# Dominant 7th Root 5 Barre', symbol: 'C#7', category: 'barre', type: 'dominant7',
    frets: [-1, 4, 6, 4, 6, -1], fingers: [0, 1, 3, 1, 4, 0], baseFret: 4, barres: [4],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-db-dom7', name: 'Db Dominant 7th Root 5 Barre', symbol: 'Db7', category: 'barre', type: 'dominant7',
    frets: [-1, 4, 6, 4, 6, -1], fingers: [0, 1, 3, 1, 4, 0], baseFret: 4, barres: [4],
    rootString: 5, rootNoteString: 1 },

  // D  (fret 5)
  { id: 'barre-r5-d-dom7', name: 'D Dominant 7th Root 5 Barre', symbol: 'D7', category: 'barre', type: 'dominant7',
    frets: [-1, 5, 7, 5, 7, -1], fingers: [0, 1, 3, 1, 4, 0], baseFret: 5, barres: [5],
    rootString: 5, rootNoteString: 1 },

  // Eb / D#  (fret 6)
  { id: 'barre-r5-eb-dom7', name: 'Eb Dominant 7th Root 5 Barre', symbol: 'Eb7', category: 'barre', type: 'dominant7',
    frets: [-1, 6, 8, 6, 8, -1], fingers: [0, 1, 3, 1, 4, 0], baseFret: 6, barres: [6],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-dsharp-dom7', name: 'D# Dominant 7th Root 5 Barre', symbol: 'D#7', category: 'barre', type: 'dominant7',
    frets: [-1, 6, 8, 6, 8, -1], fingers: [0, 1, 3, 1, 4, 0], baseFret: 6, barres: [6],
    rootString: 5, rootNoteString: 1 },

  // E  (fret 7)
  { id: 'barre-r5-e-dom7', name: 'E Dominant 7th Root 5 Barre', symbol: 'E7', category: 'barre', type: 'dominant7',
    frets: [-1, 7, 9, 7, 9, -1], fingers: [0, 1, 3, 1, 4, 0], baseFret: 7, barres: [7],
    rootString: 5, rootNoteString: 1 },

  // F  (fret 8)
  { id: 'barre-r5-f-dom7', name: 'F Dominant 7th Root 5 Barre', symbol: 'F7', category: 'barre', type: 'dominant7',
    frets: [-1, 8, 10, 8, 10, -1], fingers: [0, 1, 3, 1, 4, 0], baseFret: 8, barres: [8],
    rootString: 5, rootNoteString: 1 },

  // F# / Gb  (fret 9)
  { id: 'barre-r5-fsharp-dom7', name: 'F# Dominant 7th Root 5 Barre', symbol: 'F#7', category: 'barre', type: 'dominant7',
    frets: [-1, 9, 11, 9, 11, -1], fingers: [0, 1, 3, 1, 4, 0], baseFret: 9, barres: [9],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-gb-dom7', name: 'Gb Dominant 7th Root 5 Barre', symbol: 'Gb7', category: 'barre', type: 'dominant7',
    frets: [-1, 9, 11, 9, 11, -1], fingers: [0, 1, 3, 1, 4, 0], baseFret: 9, barres: [9],
    rootString: 5, rootNoteString: 1 },

  // G  (fret 10)
  { id: 'barre-r5-g-dom7', name: 'G Dominant 7th Root 5 Barre', symbol: 'G7', category: 'barre', type: 'dominant7',
    frets: [-1, 10, 12, 10, 12, -1], fingers: [0, 1, 3, 1, 4, 0], baseFret: 10, barres: [10],
    rootString: 5, rootNoteString: 1 },

  // Ab / G#  (fret 11)
  { id: 'barre-r5-ab-dom7', name: 'Ab Dominant 7th Root 5 Barre', symbol: 'Ab7', category: 'barre', type: 'dominant7',
    frets: [-1, 11, 13, 11, 13, -1], fingers: [0, 1, 3, 1, 4, 0], baseFret: 11, barres: [11],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-gsharp-dom7', name: 'G# Dominant 7th Root 5 Barre', symbol: 'G#7', category: 'barre', type: 'dominant7',
    frets: [-1, 11, 13, 11, 13, -1], fingers: [0, 1, 3, 1, 4, 0], baseFret: 11, barres: [11],
    rootString: 5, rootNoteString: 1 },

  // A  (fret 12 — octave)
  { id: 'barre-r5-a-dom7', name: 'A Dominant 7th Root 5 Barre', symbol: 'A7', category: 'barre', type: 'dominant7',
    frets: [-1, 12, 14, 12, 14, -1], fingers: [0, 1, 3, 1, 4, 0], baseFret: 12, barres: [12],
    rootString: 5, rootNoteString: 1 },

  // ============================================================================
  // BARRE CHORDS - Major 7th (A-shape, Root 5)
  // Barre at fret N: frets [-1, N, N+2, N+1, N+2, -1], fingers [0,1,3,2,4,0]
  // 5th string notes: Bb=1, B=2, C=3, Db/C#=4, D=5, Eb/D#=6,
  //                   E=7, F=8, F#/Gb=9, G=10, Ab/G#=11, A=12
  // ============================================================================

  // Bb / A#  (fret 1)
  { id: 'barre-r5-bb-maj7', name: 'Bb Major 7th Root 5 Barre', symbol: 'Bbmaj7', category: 'barre', type: 'major7',
    frets: [-1, 1, 3, 2, 3, -1], fingers: [0, 1, 3, 2, 4, 0], baseFret: 1, barres: [1],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-asharp-maj7', name: 'A# Major 7th Root 5 Barre', symbol: 'A#maj7', category: 'barre', type: 'major7',
    frets: [-1, 1, 3, 2, 3, -1], fingers: [0, 1, 3, 2, 4, 0], baseFret: 1, barres: [1],
    rootString: 5, rootNoteString: 1 },

  // B  (fret 2)
  { id: 'barre-r5-b-maj7', name: 'B Major 7th Root 5 Barre', symbol: 'Bmaj7', category: 'barre', type: 'major7',
    frets: [-1, 2, 4, 3, 4, -1], fingers: [0, 1, 3, 2, 4, 0], baseFret: 2, barres: [2],
    rootString: 5, rootNoteString: 1 },

  // C  (fret 3)
  { id: 'barre-r5-c-maj7', name: 'C Major 7th Root 5 Barre', symbol: 'Cmaj7', category: 'barre', type: 'major7',
    frets: [-1, 3, 5, 4, 5, -1], fingers: [0, 1, 3, 2, 4, 0], baseFret: 3, barres: [3],
    rootString: 5, rootNoteString: 1 },

  // C# / Db  (fret 4)
  { id: 'barre-r5-csharp-maj7', name: 'C# Major 7th Root 5 Barre', symbol: 'C#maj7', category: 'barre', type: 'major7',
    frets: [-1, 4, 6, 5, 6, -1], fingers: [0, 1, 3, 2, 4, 0], baseFret: 4, barres: [4],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-db-maj7', name: 'Db Major 7th Root 5 Barre', symbol: 'Dbmaj7', category: 'barre', type: 'major7',
    frets: [-1, 4, 6, 5, 6, -1], fingers: [0, 1, 3, 2, 4, 0], baseFret: 4, barres: [4],
    rootString: 5, rootNoteString: 1 },

  // D  (fret 5)
  { id: 'barre-r5-d-maj7', name: 'D Major 7th Root 5 Barre', symbol: 'Dmaj7', category: 'barre', type: 'major7',
    frets: [-1, 5, 7, 6, 7, -1], fingers: [0, 1, 3, 2, 4, 0], baseFret: 5, barres: [5],
    rootString: 5, rootNoteString: 1 },

  // Eb / D#  (fret 6)
  { id: 'barre-r5-eb-maj7', name: 'Eb Major 7th Root 5 Barre', symbol: 'Ebmaj7', category: 'barre', type: 'major7',
    frets: [-1, 6, 8, 7, 8, -1], fingers: [0, 1, 3, 2, 4, 0], baseFret: 6, barres: [6],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-dsharp-maj7', name: 'D# Major 7th Root 5 Barre', symbol: 'D#maj7', category: 'barre', type: 'major7',
    frets: [-1, 6, 8, 7, 8, -1], fingers: [0, 1, 3, 2, 4, 0], baseFret: 6, barres: [6],
    rootString: 5, rootNoteString: 1 },

  // E  (fret 7)
  { id: 'barre-r5-e-maj7', name: 'E Major 7th Root 5 Barre', symbol: 'Emaj7', category: 'barre', type: 'major7',
    frets: [-1, 7, 9, 8, 9, -1], fingers: [0, 1, 3, 2, 4, 0], baseFret: 7, barres: [7],
    rootString: 5, rootNoteString: 1 },

  // F  (fret 8)
  { id: 'barre-r5-f-maj7', name: 'F Major 7th Root 5 Barre', symbol: 'Fmaj7', category: 'barre', type: 'major7',
    frets: [-1, 8, 10, 9, 10, -1], fingers: [0, 1, 3, 2, 4, 0], baseFret: 8, barres: [8],
    rootString: 5, rootNoteString: 1 },

  // F# / Gb  (fret 9)
  { id: 'barre-r5-fsharp-maj7', name: 'F# Major 7th Root 5 Barre', symbol: 'F#maj7', category: 'barre', type: 'major7',
    frets: [-1, 9, 11, 10, 11, -1], fingers: [0, 1, 3, 2, 4, 0], baseFret: 9, barres: [9],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-gb-maj7', name: 'Gb Major 7th Root 5 Barre', symbol: 'Gbmaj7', category: 'barre', type: 'major7',
    frets: [-1, 9, 11, 10, 11, -1], fingers: [0, 1, 3, 2, 4, 0], baseFret: 9, barres: [9],
    rootString: 5, rootNoteString: 1 },

  // G  (fret 10)
  { id: 'barre-r5-g-maj7', name: 'G Major 7th Root 5 Barre', symbol: 'Gmaj7', category: 'barre', type: 'major7',
    frets: [-1, 10, 12, 11, 12, -1], fingers: [0, 1, 3, 2, 4, 0], baseFret: 10, barres: [10],
    rootString: 5, rootNoteString: 1 },

  // Ab / G#  (fret 11)
  { id: 'barre-r5-ab-maj7', name: 'Ab Major 7th Root 5 Barre', symbol: 'Abmaj7', category: 'barre', type: 'major7',
    frets: [-1, 11, 13, 12, 13, -1], fingers: [0, 1, 3, 2, 4, 0], baseFret: 11, barres: [11],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-gsharp-maj7', name: 'G# Major 7th Root 5 Barre', symbol: 'G#maj7', category: 'barre', type: 'major7',
    frets: [-1, 11, 13, 12, 13, -1], fingers: [0, 1, 3, 2, 4, 0], baseFret: 11, barres: [11],
    rootString: 5, rootNoteString: 1 },

  // A  (fret 12 — octave)
  { id: 'barre-r5-a-maj7', name: 'A Major 7th Root 5 Barre', symbol: 'Amaj7', category: 'barre', type: 'major7',
    frets: [-1, 12, 14, 13, 14, -1], fingers: [0, 1, 3, 2, 4, 0], baseFret: 12, barres: [12],
    rootString: 5, rootNoteString: 1 },

  // ============================================================================
  // BARRE CHORDS - Minor 7th (A-shape, Root 5)
  // Barre at fret N: frets [-1, N, N+2, N, N+1, N], fingers [0,1,3,1,2,1]
  // 5th string notes: Bb=1, B=2, C=3, Db/C#=4, D=5, Eb/D#=6,
  //                   E=7, F=8, F#/Gb=9, G=10, Ab/G#=11, A=12
  // ============================================================================

  // Bb / A#  (fret 1)
  { id: 'barre-r5-bb-min7', name: 'Bb Minor 7th Root 5 Barre', symbol: 'Bbm7', category: 'barre', type: 'minor7',
    frets: [-1, 1, 3, 1, 2, 1], fingers: [0, 1, 3, 1, 2, 1], baseFret: 1, barres: [1],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-asharp-min7', name: 'A# Minor 7th Root 5 Barre', symbol: 'A#m7', category: 'barre', type: 'minor7',
    frets: [-1, 1, 3, 1, 2, 1], fingers: [0, 1, 3, 1, 2, 1], baseFret: 1, barres: [1],
    rootString: 5, rootNoteString: 1 },

  // B  (fret 2)
  { id: 'barre-r5-b-min7', name: 'B Minor 7th Root 5 Barre', symbol: 'Bm7', category: 'barre', type: 'minor7',
    frets: [-1, 2, 4, 2, 3, 2], fingers: [0, 1, 3, 1, 2, 1], baseFret: 2, barres: [2],
    rootString: 5, rootNoteString: 1 },

  // C  (fret 3)
  { id: 'barre-r5-c-min7', name: 'C Minor 7th Root 5 Barre', symbol: 'Cm7', category: 'barre', type: 'minor7',
    frets: [-1, 3, 5, 3, 4, 3], fingers: [0, 1, 3, 1, 2, 1], baseFret: 3, barres: [3],
    rootString: 5, rootNoteString: 1 },

  // C# / Db  (fret 4)
  { id: 'barre-r5-csharp-min7', name: 'C# Minor 7th Root 5 Barre', symbol: 'C#m7', category: 'barre', type: 'minor7',
    frets: [-1, 4, 6, 4, 5, 4], fingers: [0, 1, 3, 1, 2, 1], baseFret: 4, barres: [4],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-db-min7', name: 'Db Minor 7th Root 5 Barre', symbol: 'Dbm7', category: 'barre', type: 'minor7',
    frets: [-1, 4, 6, 4, 5, 4], fingers: [0, 1, 3, 1, 2, 1], baseFret: 4, barres: [4],
    rootString: 5, rootNoteString: 1 },

  // D  (fret 5)
  { id: 'barre-r5-d-min7', name: 'D Minor 7th Root 5 Barre', symbol: 'Dm7', category: 'barre', type: 'minor7',
    frets: [-1, 5, 7, 5, 6, 5], fingers: [0, 1, 3, 1, 2, 1], baseFret: 5, barres: [5],
    rootString: 5, rootNoteString: 1 },

  // Eb / D#  (fret 6)
  { id: 'barre-r5-eb-min7', name: 'Eb Minor 7th Root 5 Barre', symbol: 'Ebm7', category: 'barre', type: 'minor7',
    frets: [-1, 6, 8, 6, 7, 6], fingers: [0, 1, 3, 1, 2, 1], baseFret: 6, barres: [6],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-dsharp-min7', name: 'D# Minor 7th Root 5 Barre', symbol: 'D#m7', category: 'barre', type: 'minor7',
    frets: [-1, 6, 8, 6, 7, 6], fingers: [0, 1, 3, 1, 2, 1], baseFret: 6, barres: [6],
    rootString: 5, rootNoteString: 1 },

  // E  (fret 7)
  { id: 'barre-r5-e-min7', name: 'E Minor 7th Root 5 Barre', symbol: 'Em7', category: 'barre', type: 'minor7',
    frets: [-1, 7, 9, 7, 8, 7], fingers: [0, 1, 3, 1, 2, 1], baseFret: 7, barres: [7],
    rootString: 5, rootNoteString: 1 },

  // F  (fret 8)
  { id: 'barre-r5-f-min7', name: 'F Minor 7th Root 5 Barre', symbol: 'Fm7', category: 'barre', type: 'minor7',
    frets: [-1, 8, 10, 8, 9, 8], fingers: [0, 1, 3, 1, 2, 1], baseFret: 8, barres: [8],
    rootString: 5, rootNoteString: 1 },

  // F# / Gb  (fret 9)
  { id: 'barre-r5-fsharp-min7', name: 'F# Minor 7th Root 5 Barre', symbol: 'F#m7', category: 'barre', type: 'minor7',
    frets: [-1, 9, 11, 9, 10, 9], fingers: [0, 1, 3, 1, 2, 1], baseFret: 9, barres: [9],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-gb-min7', name: 'Gb Minor 7th Root 5 Barre', symbol: 'Gbm7', category: 'barre', type: 'minor7',
    frets: [-1, 9, 11, 9, 10, 9], fingers: [0, 1, 3, 1, 2, 1], baseFret: 9, barres: [9],
    rootString: 5, rootNoteString: 1 },

  // G  (fret 10)
  { id: 'barre-r5-g-min7', name: 'G Minor 7th Root 5 Barre', symbol: 'Gm7', category: 'barre', type: 'minor7',
    frets: [-1, 10, 12, 10, 11, 10], fingers: [0, 1, 3, 1, 2, 1], baseFret: 10, barres: [10],
    rootString: 5, rootNoteString: 1 },

  // Ab / G#  (fret 11)
  { id: 'barre-r5-ab-min7', name: 'Ab Minor 7th Root 5 Barre', symbol: 'Abm7', category: 'barre', type: 'minor7',
    frets: [-1, 11, 13, 11, 12, 11], fingers: [0, 1, 3, 1, 2, 1], baseFret: 11, barres: [11],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-gsharp-min7', name: 'G# Minor 7th Root 5 Barre', symbol: 'G#m7', category: 'barre', type: 'minor7',
    frets: [-1, 11, 13, 11, 12, 11], fingers: [0, 1, 3, 1, 2, 1], baseFret: 11, barres: [11],
    rootString: 5, rootNoteString: 1 },

  // A  (fret 12 — octave)
  { id: 'barre-r5-a-min7', name: 'A Minor 7th Root 5 Barre', symbol: 'Am7', category: 'barre', type: 'minor7',
    frets: [-1, 12, 14, 12, 13, 12], fingers: [0, 1, 3, 1, 2, 1], baseFret: 12, barres: [12],
    rootString: 5, rootNoteString: 1 },

  // ============================================================================
  // BARRE CHORDS - Dominant 7th Full Barre (A-shape, Root 5) — 6-string voicing
  // Barre at fret N: frets [-1, N, N+2, N, N+2, N], fingers [0,1,3,1,4,1]
  // 5th string notes: Bb=1, B=2, C=3, Db/C#=4, D=5, Eb/D#=6,
  //                   E=7, F=8, F#/Gb=9, G=10, Ab/G#=11, A=12
  // ============================================================================

  // Bb / A#  (fret 1)
  { id: 'barre-r5-bb-dom7b', name: 'Bb Dominant 7th Root 5 Barre', symbol: 'Bb7', category: 'barre', type: 'dominant7',
    frets: [-1, 1, 3, 1, 3, 1], fingers: [0, 1, 3, 1, 4, 1], baseFret: 1, barres: [1],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-asharp-dom7b', name: 'A# Dominant 7th Root 5 Barre', symbol: 'A#7', category: 'barre', type: 'dominant7',
    frets: [-1, 1, 3, 1, 3, 1], fingers: [0, 1, 3, 1, 4, 1], baseFret: 1, barres: [1],
    rootString: 5, rootNoteString: 1 },

  // B  (fret 2)
  { id: 'barre-r5-b-dom7b', name: 'B Dominant 7th Root 5 Barre', symbol: 'B7', category: 'barre', type: 'dominant7',
    frets: [-1, 2, 4, 2, 4, 2], fingers: [0, 1, 3, 1, 4, 1], baseFret: 2, barres: [2],
    rootString: 5, rootNoteString: 1 },

  // C  (fret 3)
  { id: 'barre-r5-c-dom7b', name: 'C Dominant 7th Root 5 Barre', symbol: 'C7', category: 'barre', type: 'dominant7',
    frets: [-1, 3, 5, 3, 5, 3], fingers: [0, 1, 3, 1, 4, 1], baseFret: 3, barres: [3],
    rootString: 5, rootNoteString: 1 },

  // C# / Db  (fret 4)
  { id: 'barre-r5-csharp-dom7b', name: 'C# Dominant 7th Root 5 Barre', symbol: 'C#7', category: 'barre', type: 'dominant7',
    frets: [-1, 4, 6, 4, 6, 4], fingers: [0, 1, 3, 1, 4, 1], baseFret: 4, barres: [4],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-db-dom7b', name: 'Db Dominant 7th Root 5 Barre', symbol: 'Db7', category: 'barre', type: 'dominant7',
    frets: [-1, 4, 6, 4, 6, 4], fingers: [0, 1, 3, 1, 4, 1], baseFret: 4, barres: [4],
    rootString: 5, rootNoteString: 1 },

  // D  (fret 5)
  { id: 'barre-r5-d-dom7b', name: 'D Dominant 7th Root 5 Barre', symbol: 'D7', category: 'barre', type: 'dominant7',
    frets: [-1, 5, 7, 5, 7, 5], fingers: [0, 1, 3, 1, 4, 1], baseFret: 5, barres: [5],
    rootString: 5, rootNoteString: 1 },

  // Eb / D#  (fret 6)
  { id: 'barre-r5-eb-dom7b', name: 'Eb Dominant 7th Root 5 Barre', symbol: 'Eb7', category: 'barre', type: 'dominant7',
    frets: [-1, 6, 8, 6, 8, 6], fingers: [0, 1, 3, 1, 4, 1], baseFret: 6, barres: [6],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-dsharp-dom7b', name: 'D# Dominant 7th Root 5 Barre', symbol: 'D#7', category: 'barre', type: 'dominant7',
    frets: [-1, 6, 8, 6, 8, 6], fingers: [0, 1, 3, 1, 4, 1], baseFret: 6, barres: [6],
    rootString: 5, rootNoteString: 1 },

  // E  (fret 7)
  { id: 'barre-r5-e-dom7b', name: 'E Dominant 7th Root 5 Barre', symbol: 'E7', category: 'barre', type: 'dominant7',
    frets: [-1, 7, 9, 7, 9, 7], fingers: [0, 1, 3, 1, 4, 1], baseFret: 7, barres: [7],
    rootString: 5, rootNoteString: 1 },

  // F  (fret 8)
  { id: 'barre-r5-f-dom7b', name: 'F Dominant 7th Root 5 Barre', symbol: 'F7', category: 'barre', type: 'dominant7',
    frets: [-1, 8, 10, 8, 10, 8], fingers: [0, 1, 3, 1, 4, 1], baseFret: 8, barres: [8],
    rootString: 5, rootNoteString: 1 },

  // F# / Gb  (fret 9)
  { id: 'barre-r5-fsharp-dom7b', name: 'F# Dominant 7th Root 5 Barre', symbol: 'F#7', category: 'barre', type: 'dominant7',
    frets: [-1, 9, 11, 9, 11, 9], fingers: [0, 1, 3, 1, 4, 1], baseFret: 9, barres: [9],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-gb-dom7b', name: 'Gb Dominant 7th Root 5 Barre', symbol: 'Gb7', category: 'barre', type: 'dominant7',
    frets: [-1, 9, 11, 9, 11, 9], fingers: [0, 1, 3, 1, 4, 1], baseFret: 9, barres: [9],
    rootString: 5, rootNoteString: 1 },

  // G  (fret 10)
  { id: 'barre-r5-g-dom7b', name: 'G Dominant 7th Root 5 Barre', symbol: 'G7', category: 'barre', type: 'dominant7',
    frets: [-1, 10, 12, 10, 12, 10], fingers: [0, 1, 3, 1, 4, 1], baseFret: 10, barres: [10],
    rootString: 5, rootNoteString: 1 },

  // Ab / G#  (fret 11)
  { id: 'barre-r5-ab-dom7b', name: 'Ab Dominant 7th Root 5 Barre', symbol: 'Ab7', category: 'barre', type: 'dominant7',
    frets: [-1, 11, 13, 11, 13, 11], fingers: [0, 1, 3, 1, 4, 1], baseFret: 11, barres: [11],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-gsharp-dom7b', name: 'G# Dominant 7th Root 5 Barre', symbol: 'G#7', category: 'barre', type: 'dominant7',
    frets: [-1, 11, 13, 11, 13, 11], fingers: [0, 1, 3, 1, 4, 1], baseFret: 11, barres: [11],
    rootString: 5, rootNoteString: 1 },

  // A  (fret 12 — octave)
  { id: 'barre-r5-a-dom7b', name: 'A Dominant 7th Root 5 Barre', symbol: 'A7', category: 'barre', type: 'dominant7',
    frets: [-1, 12, 14, 12, 14, 12], fingers: [0, 1, 3, 1, 4, 1], baseFret: 12, barres: [12],
    rootString: 5, rootNoteString: 1 },

  // ============================================================================
  // BARRE CHORDS - Minor (E-shape, Root 6)
  // Barre at fret N: frets [N, N+2, N+2, N, N, N], fingers [1,3,4,1,1,1]
  // ============================================================================

  // Fm  (fret 1)
  { id: 'barre-e6-fm', name: 'F Minor Root 6 Barre', symbol: 'Fm', category: 'barre', type: 'minor',
    frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },

  // F#m / Gbm  (fret 2)
  { id: 'barre-e6-fsharpm', name: 'F# Minor Root 6 Barre', symbol: 'F#m', category: 'barre', type: 'minor',
    frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2, barres: [2],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-gbm', name: 'Gb Minor Root 6 Barre', symbol: 'Gbm', category: 'barre', type: 'minor',
    frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2, barres: [2],
    rootString: 6, rootNoteString: 0 },

  // Gm  (fret 3)
  { id: 'barre-e6-gm', name: 'G Minor Root 6 Barre', symbol: 'Gm', category: 'barre', type: 'minor',
    frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3, barres: [3],
    rootString: 6, rootNoteString: 0 },

  // G#m / Abm  (fret 4)
  { id: 'barre-e6-gsharpm', name: 'G# Minor Root 6 Barre', symbol: 'G#m', category: 'barre', type: 'minor',
    frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4, barres: [4],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-abm', name: 'Ab Minor Root 6 Barre', symbol: 'Abm', category: 'barre', type: 'minor',
    frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4, barres: [4],
    rootString: 6, rootNoteString: 0 },

  // Am  (fret 5)
  { id: 'barre-e6-am', name: 'A Minor Root 6 Barre', symbol: 'Am', category: 'barre', type: 'minor',
    frets: [5, 7, 7, 5, 5, 5], fingers: [1, 3, 4, 1, 1, 1], baseFret: 5, barres: [5],
    rootString: 6, rootNoteString: 0 },

  // A#m / Bbm  (fret 6)
  { id: 'barre-e6-asharpm', name: 'A# Minor Root 6 Barre', symbol: 'A#m', category: 'barre', type: 'minor',
    frets: [6, 8, 8, 6, 6, 6], fingers: [1, 3, 4, 1, 1, 1], baseFret: 6, barres: [6],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-bbm', name: 'Bb Minor Root 6 Barre', symbol: 'Bbm', category: 'barre', type: 'minor',
    frets: [6, 8, 8, 6, 6, 6], fingers: [1, 3, 4, 1, 1, 1], baseFret: 6, barres: [6],
    rootString: 6, rootNoteString: 0 },

  // Bm / Cbm  (fret 7)
  { id: 'barre-e6-bm', name: 'B Minor Root 6 Barre', symbol: 'Bm', category: 'barre', type: 'minor',
    frets: [7, 9, 9, 7, 7, 7], fingers: [1, 3, 4, 1, 1, 1], baseFret: 7, barres: [7],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-cbm', name: 'Cb Minor Root 6 Barre', symbol: 'Cbm', category: 'barre', type: 'minor',
    frets: [7, 9, 9, 7, 7, 7], fingers: [1, 3, 4, 1, 1, 1], baseFret: 7, barres: [7],
    rootString: 6, rootNoteString: 0 },

  // Cm / B#m  (fret 8)
  { id: 'barre-e6-cm', name: 'C Minor Root 6 Barre', symbol: 'Cm', category: 'barre', type: 'minor',
    frets: [8, 10, 10, 8, 8, 8], fingers: [1, 3, 4, 1, 1, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-bsharpm', name: 'B# Minor Root 6 Barre', symbol: 'B#m', category: 'barre', type: 'minor',
    frets: [8, 10, 10, 8, 8, 8], fingers: [1, 3, 4, 1, 1, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },

  // C#m / Dbm  (fret 9)
  { id: 'barre-e6-csharpm', name: 'C# Minor Root 6 Barre', symbol: 'C#m', category: 'barre', type: 'minor',
    frets: [9, 11, 11, 9, 9, 9], fingers: [1, 3, 4, 1, 1, 1], baseFret: 9, barres: [9],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-dbm', name: 'Db Minor Root 6 Barre', symbol: 'Dbm', category: 'barre', type: 'minor',
    frets: [9, 11, 11, 9, 9, 9], fingers: [1, 3, 4, 1, 1, 1], baseFret: 9, barres: [9],
    rootString: 6, rootNoteString: 0 },

  // Dm  (fret 10)
  { id: 'barre-e6-dm', name: 'D Minor Root 6 Barre', symbol: 'Dm', category: 'barre', type: 'minor',
    frets: [10, 12, 12, 10, 10, 10], fingers: [1, 3, 4, 1, 1, 1], baseFret: 10, barres: [10],
    rootString: 6, rootNoteString: 0 },

  // D#m / Ebm  (fret 11)
  { id: 'barre-e6-dsharpm', name: 'D# Minor Root 6 Barre', symbol: 'D#m', category: 'barre', type: 'minor',
    frets: [11, 13, 13, 11, 11, 11], fingers: [1, 3, 4, 1, 1, 1], baseFret: 11, barres: [11],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-ebm', name: 'Eb Minor Root 6 Barre', symbol: 'Ebm', category: 'barre', type: 'minor',
    frets: [11, 13, 13, 11, 11, 11], fingers: [1, 3, 4, 1, 1, 1], baseFret: 11, barres: [11],
    rootString: 6, rootNoteString: 0 },

  // Em  (fret 12 — octave)
  { id: 'barre-e6-em-12', name: 'E Minor Root 6 Barre', symbol: 'Em', category: 'barre', type: 'minor',
    frets: [12, 14, 14, 12, 12, 12], fingers: [1, 3, 4, 1, 1, 1], baseFret: 12, barres: [12],
    rootString: 6, rootNoteString: 0 },

  // Fbm (enharmonic Em)  (fret 12)
  { id: 'barre-e6-fbm', name: 'Fb Minor Root 6 Barre', symbol: 'Fbm', category: 'barre', type: 'minor',
    frets: [12, 14, 14, 12, 12, 12], fingers: [1, 3, 4, 1, 1, 1], baseFret: 12, barres: [12],
    rootString: 6, rootNoteString: 0 },

  // E#m (enharmonic Fm)  (fret 1)
  { id: 'barre-e6-esharpm', name: 'E# Minor Root 6 Barre', symbol: 'E#m', category: 'barre', type: 'minor',
    frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },

  // ============================================================================
  // BARRE CHORDS - Dominant 7th (E-shape, Root 6)
  // Barre at fret N: frets [N, N+2, N, N+1, N, N], fingers [1,3,1,2,1,1]
  // ============================================================================

  // F7  (fret 1)
  { id: 'barre-e6-f7', name: 'F Dominant 7th Root 6 Barre', symbol: 'F7', category: 'barre', type: 'dominant7',
    frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },

  // F#7 / Gb7  (fret 2)
  { id: 'barre-e6-fsharp7', name: 'F# Dominant 7th Root 6 Barre', symbol: 'F#7', category: 'barre', type: 'dominant7',
    frets: [2, 4, 2, 3, 2, 2], fingers: [1, 3, 1, 2, 1, 1], baseFret: 2, barres: [2],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-gb7', name: 'Gb Dominant 7th Root 6 Barre', symbol: 'Gb7', category: 'barre', type: 'dominant7',
    frets: [2, 4, 2, 3, 2, 2], fingers: [1, 3, 1, 2, 1, 1], baseFret: 2, barres: [2],
    rootString: 6, rootNoteString: 0 },

  // G7  (fret 3)
  { id: 'barre-e6-g7', name: 'G Dominant 7th Root 6 Barre', symbol: 'G7', category: 'barre', type: 'dominant7',
    frets: [3, 5, 3, 4, 3, 3], fingers: [1, 3, 1, 2, 1, 1], baseFret: 3, barres: [3],
    rootString: 6, rootNoteString: 0 },

  // G#7 / Ab7  (fret 4)
  { id: 'barre-e6-gsharp7', name: 'G# Dominant 7th Root 6 Barre', symbol: 'G#7', category: 'barre', type: 'dominant7',
    frets: [4, 6, 4, 5, 4, 4], fingers: [1, 3, 1, 2, 1, 1], baseFret: 4, barres: [4],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-ab7', name: 'Ab Dominant 7th Root 6 Barre', symbol: 'Ab7', category: 'barre', type: 'dominant7',
    frets: [4, 6, 4, 5, 4, 4], fingers: [1, 3, 1, 2, 1, 1], baseFret: 4, barres: [4],
    rootString: 6, rootNoteString: 0 },

  // A7  (fret 5)
  { id: 'barre-e6-a7', name: 'A Dominant 7th Root 6 Barre', symbol: 'A7', category: 'barre', type: 'dominant7',
    frets: [5, 7, 5, 6, 5, 5], fingers: [1, 3, 1, 2, 1, 1], baseFret: 5, barres: [5],
    rootString: 6, rootNoteString: 0 },

  // A#7 / Bb7  (fret 6)
  { id: 'barre-e6-asharp7', name: 'A# Dominant 7th Root 6 Barre', symbol: 'A#7', category: 'barre', type: 'dominant7',
    frets: [6, 8, 6, 7, 6, 6], fingers: [1, 3, 1, 2, 1, 1], baseFret: 6, barres: [6],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-bb7', name: 'Bb Dominant 7th Root 6 Barre', symbol: 'Bb7', category: 'barre', type: 'dominant7',
    frets: [6, 8, 6, 7, 6, 6], fingers: [1, 3, 1, 2, 1, 1], baseFret: 6, barres: [6],
    rootString: 6, rootNoteString: 0 },

  // B7 / Cb7  (fret 7)
  { id: 'barre-e6-b7', name: 'B Dominant 7th Root 6 Barre', symbol: 'B7', category: 'barre', type: 'dominant7',
    frets: [7, 9, 7, 8, 7, 7], fingers: [1, 3, 1, 2, 1, 1], baseFret: 7, barres: [7],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-cb7', name: 'Cb Dominant 7th Root 6 Barre', symbol: 'Cb7', category: 'barre', type: 'dominant7',
    frets: [7, 9, 7, 8, 7, 7], fingers: [1, 3, 1, 2, 1, 1], baseFret: 7, barres: [7],
    rootString: 6, rootNoteString: 0 },

  // C7 / B#7  (fret 8)
  { id: 'barre-e6-c7', name: 'C Dominant 7th Root 6 Barre', symbol: 'C7', category: 'barre', type: 'dominant7',
    frets: [8, 10, 8, 9, 8, 8], fingers: [1, 3, 1, 2, 1, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-bsharp7', name: 'B# Dominant 7th Root 6 Barre', symbol: 'B#7', category: 'barre', type: 'dominant7',
    frets: [8, 10, 8, 9, 8, 8], fingers: [1, 3, 1, 2, 1, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },

  // C#7 / Db7  (fret 9)
  { id: 'barre-e6-csharp7', name: 'C# Dominant 7th Root 6 Barre', symbol: 'C#7', category: 'barre', type: 'dominant7',
    frets: [9, 11, 9, 10, 9, 9], fingers: [1, 3, 1, 2, 1, 1], baseFret: 9, barres: [9],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-db7', name: 'Db Dominant 7th Root 6 Barre', symbol: 'Db7', category: 'barre', type: 'dominant7',
    frets: [9, 11, 9, 10, 9, 9], fingers: [1, 3, 1, 2, 1, 1], baseFret: 9, barres: [9],
    rootString: 6, rootNoteString: 0 },

  // D7  (fret 10)
  { id: 'barre-e6-d7', name: 'D Dominant 7th Root 6 Barre', symbol: 'D7', category: 'barre', type: 'dominant7',
    frets: [10, 12, 10, 11, 10, 10], fingers: [1, 3, 1, 2, 1, 1], baseFret: 10, barres: [10],
    rootString: 6, rootNoteString: 0 },

  // D#7 / Eb7  (fret 11)
  { id: 'barre-e6-dsharp7', name: 'D# Dominant 7th Root 6 Barre', symbol: 'D#7', category: 'barre', type: 'dominant7',
    frets: [11, 13, 11, 12, 11, 11], fingers: [1, 3, 1, 2, 1, 1], baseFret: 11, barres: [11],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-eb7', name: 'Eb Dominant 7th Root 6 Barre', symbol: 'Eb7', category: 'barre', type: 'dominant7',
    frets: [11, 13, 11, 12, 11, 11], fingers: [1, 3, 1, 2, 1, 1], baseFret: 11, barres: [11],
    rootString: 6, rootNoteString: 0 },

  // E7  (fret 12 — octave)
  { id: 'barre-e6-e7-12', name: 'E Dominant 7th Root 6 Barre', symbol: 'E7', category: 'barre', type: 'dominant7',
    frets: [12, 14, 12, 13, 12, 12], fingers: [1, 3, 1, 2, 1, 1], baseFret: 12, barres: [12],
    rootString: 6, rootNoteString: 0 },

  // Fb7 (enharmonic E7)  (fret 12)
  { id: 'barre-e6-fb7', name: 'Fb Dominant 7th Root 6 Barre', symbol: 'Fb7', category: 'barre', type: 'dominant7',
    frets: [12, 14, 12, 13, 12, 12], fingers: [1, 3, 1, 2, 1, 1], baseFret: 12, barres: [12],
    rootString: 6, rootNoteString: 0 },

  // E#7 (enharmonic F7)  (fret 1)
  { id: 'barre-e6-esharp7', name: 'E# Dominant 7th Root 6 Barre', symbol: 'E#7', category: 'barre', type: 'dominant7',
    frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },

  // ============================================================================
  // BARRE CHORDS - Minor 7th (E-shape, Root 6)
  // Barre at fret N: frets [N, N+2, N, N, N, N], fingers [1,3,1,1,1,1]
  // ============================================================================

  // Fm7  (fret 1)
  { id: 'barre-e6-fm7', name: 'F Minor 7th Root 6 Barre', symbol: 'Fm7', category: 'barre', type: 'minor7',
    frets: [1, 3, 1, 1, 1, 1], fingers: [1, 3, 1, 1, 1, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },

  // F#m7 / Gbm7  (fret 2)
  { id: 'barre-e6-fsharpm7', name: 'F# Minor 7th Root 6 Barre', symbol: 'F#m7', category: 'barre', type: 'minor7',
    frets: [2, 4, 2, 2, 2, 2], fingers: [1, 3, 1, 1, 1, 1], baseFret: 2, barres: [2],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-gbm7', name: 'Gb Minor 7th Root 6 Barre', symbol: 'Gbm7', category: 'barre', type: 'minor7',
    frets: [2, 4, 2, 2, 2, 2], fingers: [1, 3, 1, 1, 1, 1], baseFret: 2, barres: [2],
    rootString: 6, rootNoteString: 0 },

  // Gm7  (fret 3)
  { id: 'barre-e6-gm7', name: 'G Minor 7th Root 6 Barre', symbol: 'Gm7', category: 'barre', type: 'minor7',
    frets: [3, 5, 3, 3, 3, 3], fingers: [1, 3, 1, 1, 1, 1], baseFret: 3, barres: [3],
    rootString: 6, rootNoteString: 0 },

  // G#m7 / Abm7  (fret 4)
  { id: 'barre-e6-gsharpm7', name: 'G# Minor 7th Root 6 Barre', symbol: 'G#m7', category: 'barre', type: 'minor7',
    frets: [4, 6, 4, 4, 4, 4], fingers: [1, 3, 1, 1, 1, 1], baseFret: 4, barres: [4],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-abm7', name: 'Ab Minor 7th Root 6 Barre', symbol: 'Abm7', category: 'barre', type: 'minor7',
    frets: [4, 6, 4, 4, 4, 4], fingers: [1, 3, 1, 1, 1, 1], baseFret: 4, barres: [4],
    rootString: 6, rootNoteString: 0 },

  // Am7  (fret 5)
  { id: 'barre-e6-am7', name: 'A Minor 7th Root 6 Barre', symbol: 'Am7', category: 'barre', type: 'minor7',
    frets: [5, 7, 5, 5, 5, 5], fingers: [1, 3, 1, 1, 1, 1], baseFret: 5, barres: [5],
    rootString: 6, rootNoteString: 0 },

  // A#m7 / Bbm7  (fret 6)
  { id: 'barre-e6-asharpm7', name: 'A# Minor 7th Root 6 Barre', symbol: 'A#m7', category: 'barre', type: 'minor7',
    frets: [6, 8, 6, 6, 6, 6], fingers: [1, 3, 1, 1, 1, 1], baseFret: 6, barres: [6],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-bbm7', name: 'Bb Minor 7th Root 6 Barre', symbol: 'Bbm7', category: 'barre', type: 'minor7',
    frets: [6, 8, 6, 6, 6, 6], fingers: [1, 3, 1, 1, 1, 1], baseFret: 6, barres: [6],
    rootString: 6, rootNoteString: 0 },

  // Bm7 / Cbm7  (fret 7)
  { id: 'barre-e6-bm7', name: 'B Minor 7th Root 6 Barre', symbol: 'Bm7', category: 'barre', type: 'minor7',
    frets: [7, 9, 7, 7, 7, 7], fingers: [1, 3, 1, 1, 1, 1], baseFret: 7, barres: [7],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-cbm7', name: 'Cb Minor 7th Root 6 Barre', symbol: 'Cbm7', category: 'barre', type: 'minor7',
    frets: [7, 9, 7, 7, 7, 7], fingers: [1, 3, 1, 1, 1, 1], baseFret: 7, barres: [7],
    rootString: 6, rootNoteString: 0 },

  // Cm7 / B#m7  (fret 8)
  { id: 'barre-e6-cm7', name: 'C Minor 7th Root 6 Barre', symbol: 'Cm7', category: 'barre', type: 'minor7',
    frets: [8, 10, 8, 8, 8, 8], fingers: [1, 3, 1, 1, 1, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-bsharpm7', name: 'B# Minor 7th Root 6 Barre', symbol: 'B#m7', category: 'barre', type: 'minor7',
    frets: [8, 10, 8, 8, 8, 8], fingers: [1, 3, 1, 1, 1, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },

  // C#m7 / Dbm7  (fret 9)
  { id: 'barre-e6-csharpm7', name: 'C# Minor 7th Root 6 Barre', symbol: 'C#m7', category: 'barre', type: 'minor7',
    frets: [9, 11, 9, 9, 9, 9], fingers: [1, 3, 1, 1, 1, 1], baseFret: 9, barres: [9],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-dbm7', name: 'Db Minor 7th Root 6 Barre', symbol: 'Dbm7', category: 'barre', type: 'minor7',
    frets: [9, 11, 9, 9, 9, 9], fingers: [1, 3, 1, 1, 1, 1], baseFret: 9, barres: [9],
    rootString: 6, rootNoteString: 0 },

  // Dm7  (fret 10)
  { id: 'barre-e6-dm7', name: 'D Minor 7th Root 6 Barre', symbol: 'Dm7', category: 'barre', type: 'minor7',
    frets: [10, 12, 10, 10, 10, 10], fingers: [1, 3, 1, 1, 1, 1], baseFret: 10, barres: [10],
    rootString: 6, rootNoteString: 0 },

  // D#m7 / Ebm7  (fret 11)
  { id: 'barre-e6-dsharpm7', name: 'D# Minor 7th Root 6 Barre', symbol: 'D#m7', category: 'barre', type: 'minor7',
    frets: [11, 13, 11, 11, 11, 11], fingers: [1, 3, 1, 1, 1, 1], baseFret: 11, barres: [11],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-ebm7', name: 'Eb Minor 7th Root 6 Barre', symbol: 'Ebm7', category: 'barre', type: 'minor7',
    frets: [11, 13, 11, 11, 11, 11], fingers: [1, 3, 1, 1, 1, 1], baseFret: 11, barres: [11],
    rootString: 6, rootNoteString: 0 },

  // Em7  (fret 12 — octave)
  { id: 'barre-e6-em7-12', name: 'E Minor 7th Root 6 Barre', symbol: 'Em7', category: 'barre', type: 'minor7',
    frets: [12, 14, 12, 12, 12, 12], fingers: [1, 3, 1, 1, 1, 1], baseFret: 12, barres: [12],
    rootString: 6, rootNoteString: 0 },

  // Fbm7 (enharmonic Em7)  (fret 12)
  { id: 'barre-e6-fbm7', name: 'Fb Minor 7th Root 6 Barre', symbol: 'Fbm7', category: 'barre', type: 'minor7',
    frets: [12, 14, 12, 12, 12, 12], fingers: [1, 3, 1, 1, 1, 1], baseFret: 12, barres: [12],
    rootString: 6, rootNoteString: 0 },

  // E#m7 (enharmonic Fm7)  (fret 1)
  { id: 'barre-e6-esharpm7', name: 'E# Minor 7th Root 6 Barre', symbol: 'E#m7', category: 'barre', type: 'minor7',
    frets: [1, 3, 1, 1, 1, 1], fingers: [1, 3, 1, 1, 1, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },

  // ============================================================================
  // BARRE CHORDS - Major 7th (E-shape, Root 6)
  // Barre at fret N: frets [N, N+2, N+1, N+1, N, N], fingers [1,3,2,2,1,1]
  // 6th string notes: F=1, F#/Gb=2, G=3, Ab/G#=4, A=5, Bb/A#=6,
  //                   B/Cb=7, C/B#=8, Db/C#=9, D=10, Eb/D#=11, E=12
  // ============================================================================

  // F  (fret 1)
  { id: 'barre-e6-fmaj7', name: 'F Major 7th Root 6 Barre', symbol: 'Fmaj7', category: 'barre', type: 'major7',
    frets: [1, 3, 2, 2, 1, 1], fingers: [1, 3, 2, 2, 1, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },

  // F# / Gb  (fret 2)
  { id: 'barre-e6-fsharpmaj7', name: 'F# Major 7th Root 6 Barre', symbol: 'F#maj7', category: 'barre', type: 'major7',
    frets: [2, 4, 3, 3, 2, 2], fingers: [1, 3, 2, 2, 1, 1], baseFret: 2, barres: [2],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-gbmaj7', name: 'Gb Major 7th Root 6 Barre', symbol: 'Gbmaj7', category: 'barre', type: 'major7',
    frets: [2, 4, 3, 3, 2, 2], fingers: [1, 3, 2, 2, 1, 1], baseFret: 2, barres: [2],
    rootString: 6, rootNoteString: 0 },

  // G  (fret 3)
  { id: 'barre-e6-gmaj7', name: 'G Major 7th Root 6 Barre', symbol: 'Gmaj7', category: 'barre', type: 'major7',
    frets: [3, 5, 4, 4, 3, 3], fingers: [1, 3, 2, 2, 1, 1], baseFret: 3, barres: [3],
    rootString: 6, rootNoteString: 0 },

  // G# / Ab  (fret 4)
  { id: 'barre-e6-gsharpmaj7', name: 'G# Major 7th Root 6 Barre', symbol: 'G#maj7', category: 'barre', type: 'major7',
    frets: [4, 6, 5, 5, 4, 4], fingers: [1, 3, 2, 2, 1, 1], baseFret: 4, barres: [4],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-abmaj7', name: 'Ab Major 7th Root 6 Barre', symbol: 'Abmaj7', category: 'barre', type: 'major7',
    frets: [4, 6, 5, 5, 4, 4], fingers: [1, 3, 2, 2, 1, 1], baseFret: 4, barres: [4],
    rootString: 6, rootNoteString: 0 },

  // A  (fret 5)
  { id: 'barre-e6-amaj7', name: 'A Major 7th Root 6 Barre', symbol: 'Amaj7', category: 'barre', type: 'major7',
    frets: [5, 7, 6, 6, 5, 5], fingers: [1, 3, 2, 2, 1, 1], baseFret: 5, barres: [5],
    rootString: 6, rootNoteString: 0 },

  // A# / Bb  (fret 6)
  { id: 'barre-e6-asharpmaj7', name: 'A# Major 7th Root 6 Barre', symbol: 'A#maj7', category: 'barre', type: 'major7',
    frets: [6, 8, 7, 7, 6, 6], fingers: [1, 3, 2, 2, 1, 1], baseFret: 6, barres: [6],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-bbmaj7', name: 'Bb Major 7th Root 6 Barre', symbol: 'Bbmaj7', category: 'barre', type: 'major7',
    frets: [6, 8, 7, 7, 6, 6], fingers: [1, 3, 2, 2, 1, 1], baseFret: 6, barres: [6],
    rootString: 6, rootNoteString: 0 },

  // B / Cb  (fret 7)
  { id: 'barre-e6-bmaj7', name: 'B Major 7th Root 6 Barre', symbol: 'Bmaj7', category: 'barre', type: 'major7',
    frets: [7, 9, 8, 8, 7, 7], fingers: [1, 3, 2, 2, 1, 1], baseFret: 7, barres: [7],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-cbmaj7', name: 'Cb Major 7th Root 6 Barre', symbol: 'Cbmaj7', category: 'barre', type: 'major7',
    frets: [7, 9, 8, 8, 7, 7], fingers: [1, 3, 2, 2, 1, 1], baseFret: 7, barres: [7],
    rootString: 6, rootNoteString: 0 },

  // C / B#  (fret 8)
  { id: 'barre-e6-cmaj7', name: 'C Major 7th Root 6 Barre', symbol: 'Cmaj7', category: 'barre', type: 'major7',
    frets: [8, 10, 9, 9, 8, 8], fingers: [1, 3, 2, 2, 1, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-bsharpmaj7', name: 'B# Major 7th Root 6 Barre', symbol: 'B#maj7', category: 'barre', type: 'major7',
    frets: [8, 10, 9, 9, 8, 8], fingers: [1, 3, 2, 2, 1, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },

  // C# / Db  (fret 9)
  { id: 'barre-e6-csharpmaj7', name: 'C# Major 7th Root 6 Barre', symbol: 'C#maj7', category: 'barre', type: 'major7',
    frets: [9, 11, 10, 10, 9, 9], fingers: [1, 3, 2, 2, 1, 1], baseFret: 9, barres: [9],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-dbmaj7', name: 'Db Major 7th Root 6 Barre', symbol: 'Dbmaj7', category: 'barre', type: 'major7',
    frets: [9, 11, 10, 10, 9, 9], fingers: [1, 3, 2, 2, 1, 1], baseFret: 9, barres: [9],
    rootString: 6, rootNoteString: 0 },

  // D  (fret 10)
  { id: 'barre-e6-dmaj7', name: 'D Major 7th Root 6 Barre', symbol: 'Dmaj7', category: 'barre', type: 'major7',
    frets: [10, 12, 11, 11, 10, 10], fingers: [1, 3, 2, 2, 1, 1], baseFret: 10, barres: [10],
    rootString: 6, rootNoteString: 0 },

  // D# / Eb  (fret 11)
  { id: 'barre-e6-dsharpmaj7', name: 'D# Major 7th Root 6 Barre', symbol: 'D#maj7', category: 'barre', type: 'major7',
    frets: [11, 13, 12, 12, 11, 11], fingers: [1, 3, 2, 2, 1, 1], baseFret: 11, barres: [11],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-ebmaj7', name: 'Eb Major 7th Root 6 Barre', symbol: 'Ebmaj7', category: 'barre', type: 'major7',
    frets: [11, 13, 12, 12, 11, 11], fingers: [1, 3, 2, 2, 1, 1], baseFret: 11, barres: [11],
    rootString: 6, rootNoteString: 0 },

  // E  (fret 12 — octave)
  { id: 'barre-e6-emaj7-12', name: 'E Major 7th Root 6 Barre', symbol: 'Emaj7', category: 'barre', type: 'major7',
    frets: [12, 14, 13, 13, 12, 12], fingers: [1, 3, 2, 2, 1, 1], baseFret: 12, barres: [12],
    rootString: 6, rootNoteString: 0 },

  // Fb (enharmonic E)  (fret 12)
  { id: 'barre-e6-fbmaj7', name: 'Fb Major 7th Root 6 Barre', symbol: 'Fbmaj7', category: 'barre', type: 'major7',
    frets: [12, 14, 13, 13, 12, 12], fingers: [1, 3, 2, 2, 1, 1], baseFret: 12, barres: [12],
    rootString: 6, rootNoteString: 0 },

  // E# (enharmonic F)  (fret 1)
  { id: 'barre-e6-esharpmaj7', name: 'E# Major 7th Root 6 Barre', symbol: 'E#maj7', category: 'barre', type: 'major7',
    frets: [1, 3, 2, 2, 1, 1], fingers: [1, 3, 2, 2, 1, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },

  // ============================================================================
  // BARRE CHORDS - Dominant 9th (E-shape, Root 6)
  // Barre at fret N: frets [N, N+2, N, N+1, N, N+2], fingers [1,3,1,2,1,4]
  // 6th string notes: F=1, F#/Gb=2, G=3, Ab/G#=4, A=5, Bb/A#=6,
  //                   B/Cb=7, C/B#=8, Db/C#=9, D=10, Eb/D#=11, E=12
  // ============================================================================

  // F  (fret 1)
  { id: 'barre-e6-f9', name: 'F Dominant 9th Root 6 Barre', symbol: 'F9', category: 'barre', type: '9th',
    frets: [1, 3, 1, 2, 1, 3], fingers: [1, 3, 1, 2, 1, 4], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },

  // F# / Gb  (fret 2)
  { id: 'barre-e6-fsharp9', name: 'F# Dominant 9th Root 6 Barre', symbol: 'F#9', category: 'barre', type: '9th',
    frets: [2, 4, 2, 3, 2, 4], fingers: [1, 3, 1, 2, 1, 4], baseFret: 2, barres: [2],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-gb9', name: 'Gb Dominant 9th Root 6 Barre', symbol: 'Gb9', category: 'barre', type: '9th',
    frets: [2, 4, 2, 3, 2, 4], fingers: [1, 3, 1, 2, 1, 4], baseFret: 2, barres: [2],
    rootString: 6, rootNoteString: 0 },

  // G  (fret 3)
  { id: 'barre-e6-g9', name: 'G Dominant 9th Root 6 Barre', symbol: 'G9', category: 'barre', type: '9th',
    frets: [3, 5, 3, 4, 3, 5], fingers: [1, 3, 1, 2, 1, 4], baseFret: 3, barres: [3],
    rootString: 6, rootNoteString: 0 },

  // G# / Ab  (fret 4)
  { id: 'barre-e6-gsharp9', name: 'G# Dominant 9th Root 6 Barre', symbol: 'G#9', category: 'barre', type: '9th',
    frets: [4, 6, 4, 5, 4, 6], fingers: [1, 3, 1, 2, 1, 4], baseFret: 4, barres: [4],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-ab9', name: 'Ab Dominant 9th Root 6 Barre', symbol: 'Ab9', category: 'barre', type: '9th',
    frets: [4, 6, 4, 5, 4, 6], fingers: [1, 3, 1, 2, 1, 4], baseFret: 4, barres: [4],
    rootString: 6, rootNoteString: 0 },

  // A  (fret 5)
  { id: 'barre-e6-a9', name: 'A Dominant 9th Root 6 Barre', symbol: 'A9', category: 'barre', type: '9th',
    frets: [5, 7, 5, 6, 5, 7], fingers: [1, 3, 1, 2, 1, 4], baseFret: 5, barres: [5],
    rootString: 6, rootNoteString: 0 },

  // A# / Bb  (fret 6)
  { id: 'barre-e6-asharp9', name: 'A# Dominant 9th Root 6 Barre', symbol: 'A#9', category: 'barre', type: '9th',
    frets: [6, 8, 6, 7, 6, 8], fingers: [1, 3, 1, 2, 1, 4], baseFret: 6, barres: [6],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-bb9', name: 'Bb Dominant 9th Root 6 Barre', symbol: 'Bb9', category: 'barre', type: '9th',
    frets: [6, 8, 6, 7, 6, 8], fingers: [1, 3, 1, 2, 1, 4], baseFret: 6, barres: [6],
    rootString: 6, rootNoteString: 0 },

  // B / Cb  (fret 7)
  { id: 'barre-e6-b9', name: 'B Dominant 9th Root 6 Barre', symbol: 'B9', category: 'barre', type: '9th',
    frets: [7, 9, 7, 8, 7, 9], fingers: [1, 3, 1, 2, 1, 4], baseFret: 7, barres: [7],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-cb9', name: 'Cb Dominant 9th Root 6 Barre', symbol: 'Cb9', category: 'barre', type: '9th',
    frets: [7, 9, 7, 8, 7, 9], fingers: [1, 3, 1, 2, 1, 4], baseFret: 7, barres: [7],
    rootString: 6, rootNoteString: 0 },

  // C / B#  (fret 8)
  { id: 'barre-e6-c9', name: 'C Dominant 9th Root 6 Barre', symbol: 'C9', category: 'barre', type: '9th',
    frets: [8, 10, 8, 9, 8, 10], fingers: [1, 3, 1, 2, 1, 4], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-bsharp9', name: 'B# Dominant 9th Root 6 Barre', symbol: 'B#9', category: 'barre', type: '9th',
    frets: [8, 10, 8, 9, 8, 10], fingers: [1, 3, 1, 2, 1, 4], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },

  // C# / Db  (fret 9)
  { id: 'barre-e6-csharp9', name: 'C# Dominant 9th Root 6 Barre', symbol: 'C#9', category: 'barre', type: '9th',
    frets: [9, 11, 9, 10, 9, 11], fingers: [1, 3, 1, 2, 1, 4], baseFret: 9, barres: [9],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-db9', name: 'Db Dominant 9th Root 6 Barre', symbol: 'Db9', category: 'barre', type: '9th',
    frets: [9, 11, 9, 10, 9, 11], fingers: [1, 3, 1, 2, 1, 4], baseFret: 9, barres: [9],
    rootString: 6, rootNoteString: 0 },

  // D  (fret 10)
  { id: 'barre-e6-d9', name: 'D Dominant 9th Root 6 Barre', symbol: 'D9', category: 'barre', type: '9th',
    frets: [10, 12, 10, 11, 10, 12], fingers: [1, 3, 1, 2, 1, 4], baseFret: 10, barres: [10],
    rootString: 6, rootNoteString: 0 },

  // D# / Eb  (fret 11)
  { id: 'barre-e6-dsharp9', name: 'D# Dominant 9th Root 6 Barre', symbol: 'D#9', category: 'barre', type: '9th',
    frets: [11, 13, 11, 12, 11, 13], fingers: [1, 3, 1, 2, 1, 4], baseFret: 11, barres: [11],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-eb9', name: 'Eb Dominant 9th Root 6 Barre', symbol: 'Eb9', category: 'barre', type: '9th',
    frets: [11, 13, 11, 12, 11, 13], fingers: [1, 3, 1, 2, 1, 4], baseFret: 11, barres: [11],
    rootString: 6, rootNoteString: 0 },

  // E  (fret 12 — octave)
  { id: 'barre-e6-e9-12', name: 'E Dominant 9th Root 6 Barre', symbol: 'E9', category: 'barre', type: '9th',
    frets: [12, 14, 12, 13, 12, 14], fingers: [1, 3, 1, 2, 1, 4], baseFret: 12, barres: [12],
    rootString: 6, rootNoteString: 0 },

  // Fb (enharmonic E)  (fret 12)
  { id: 'barre-e6-fb9', name: 'Fb Dominant 9th Root 6 Barre', symbol: 'Fb9', category: 'barre', type: '9th',
    frets: [12, 14, 12, 13, 12, 14], fingers: [1, 3, 1, 2, 1, 4], baseFret: 12, barres: [12],
    rootString: 6, rootNoteString: 0 },

  // E# (enharmonic F)  (fret 1)
  { id: 'barre-e6-esharp9', name: 'E# Dominant 9th Root 6 Barre', symbol: 'E#9', category: 'barre', type: '9th',
    frets: [1, 3, 1, 2, 1, 3], fingers: [1, 3, 1, 2, 1, 4], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },

  // ============================================================================
  // BARRE CHORDS - Dominant 11th (E-shape, Root 6)
  // Barre at fret N: frets [N, N, N, N+2, N, N+2], fingers [1,1,1,3,1,4]
  // 6th string notes: F=1, F#/Gb=2, G=3, Ab/G#=4, A=5, Bb/A#=6,
  //                   B/Cb=7, C/B#=8, Db/C#=9, D=10, Eb/D#=11, E=12
  // ============================================================================

  // F  (fret 1)
  { id: 'barre-e6-f11', name: 'F Dominant 11th Root 6 Barre', symbol: 'F11', category: 'barre', type: '11th',
    frets: [1, 1, 1, 3, 1, 3], fingers: [1, 1, 1, 3, 1, 4], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },

  // F# / Gb  (fret 2)
  { id: 'barre-e6-fsharp11', name: 'F# Dominant 11th Root 6 Barre', symbol: 'F#11', category: 'barre', type: '11th',
    frets: [2, 2, 2, 4, 2, 4], fingers: [1, 1, 1, 3, 1, 4], baseFret: 2, barres: [2],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-gb11', name: 'Gb Dominant 11th Root 6 Barre', symbol: 'Gb11', category: 'barre', type: '11th',
    frets: [2, 2, 2, 4, 2, 4], fingers: [1, 1, 1, 3, 1, 4], baseFret: 2, barres: [2],
    rootString: 6, rootNoteString: 0 },

  // G  (fret 3)
  { id: 'barre-e6-g11', name: 'G Dominant 11th Root 6 Barre', symbol: 'G11', category: 'barre', type: '11th',
    frets: [3, 3, 3, 5, 3, 5], fingers: [1, 1, 1, 3, 1, 4], baseFret: 3, barres: [3],
    rootString: 6, rootNoteString: 0 },

  // G# / Ab  (fret 4)
  { id: 'barre-e6-gsharp11', name: 'G# Dominant 11th Root 6 Barre', symbol: 'G#11', category: 'barre', type: '11th',
    frets: [4, 4, 4, 6, 4, 6], fingers: [1, 1, 1, 3, 1, 4], baseFret: 4, barres: [4],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-ab11', name: 'Ab Dominant 11th Root 6 Barre', symbol: 'Ab11', category: 'barre', type: '11th',
    frets: [4, 4, 4, 6, 4, 6], fingers: [1, 1, 1, 3, 1, 4], baseFret: 4, barres: [4],
    rootString: 6, rootNoteString: 0 },

  // A  (fret 5)
  { id: 'barre-e6-a11', name: 'A Dominant 11th Root 6 Barre', symbol: 'A11', category: 'barre', type: '11th',
    frets: [5, 5, 5, 7, 5, 7], fingers: [1, 1, 1, 3, 1, 4], baseFret: 5, barres: [5],
    rootString: 6, rootNoteString: 0 },

  // A# / Bb  (fret 6)
  { id: 'barre-e6-asharp11', name: 'A# Dominant 11th Root 6 Barre', symbol: 'A#11', category: 'barre', type: '11th',
    frets: [6, 6, 6, 8, 6, 8], fingers: [1, 1, 1, 3, 1, 4], baseFret: 6, barres: [6],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-bb11', name: 'Bb Dominant 11th Root 6 Barre', symbol: 'Bb11', category: 'barre', type: '11th',
    frets: [6, 6, 6, 8, 6, 8], fingers: [1, 1, 1, 3, 1, 4], baseFret: 6, barres: [6],
    rootString: 6, rootNoteString: 0 },

  // B / Cb  (fret 7)
  { id: 'barre-e6-b11', name: 'B Dominant 11th Root 6 Barre', symbol: 'B11', category: 'barre', type: '11th',
    frets: [7, 7, 7, 9, 7, 9], fingers: [1, 1, 1, 3, 1, 4], baseFret: 7, barres: [7],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-cb11', name: 'Cb Dominant 11th Root 6 Barre', symbol: 'Cb11', category: 'barre', type: '11th',
    frets: [7, 7, 7, 9, 7, 9], fingers: [1, 1, 1, 3, 1, 4], baseFret: 7, barres: [7],
    rootString: 6, rootNoteString: 0 },

  // C / B#  (fret 8)
  { id: 'barre-e6-c11', name: 'C Dominant 11th Root 6 Barre', symbol: 'C11', category: 'barre', type: '11th',
    frets: [8, 8, 8, 10, 8, 10], fingers: [1, 1, 1, 3, 1, 4], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-bsharp11', name: 'B# Dominant 11th Root 6 Barre', symbol: 'B#11', category: 'barre', type: '11th',
    frets: [8, 8, 8, 10, 8, 10], fingers: [1, 1, 1, 3, 1, 4], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },

  // C# / Db  (fret 9)
  { id: 'barre-e6-csharp11', name: 'C# Dominant 11th Root 6 Barre', symbol: 'C#11', category: 'barre', type: '11th',
    frets: [9, 9, 9, 11, 9, 11], fingers: [1, 1, 1, 3, 1, 4], baseFret: 9, barres: [9],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-db11', name: 'Db Dominant 11th Root 6 Barre', symbol: 'Db11', category: 'barre', type: '11th',
    frets: [9, 9, 9, 11, 9, 11], fingers: [1, 1, 1, 3, 1, 4], baseFret: 9, barres: [9],
    rootString: 6, rootNoteString: 0 },

  // D  (fret 10)
  { id: 'barre-e6-d11', name: 'D Dominant 11th Root 6 Barre', symbol: 'D11', category: 'barre', type: '11th',
    frets: [10, 10, 10, 12, 10, 12], fingers: [1, 1, 1, 3, 1, 4], baseFret: 10, barres: [10],
    rootString: 6, rootNoteString: 0 },

  // D# / Eb  (fret 11)
  { id: 'barre-e6-dsharp11', name: 'D# Dominant 11th Root 6 Barre', symbol: 'D#11', category: 'barre', type: '11th',
    frets: [11, 11, 11, 13, 11, 13], fingers: [1, 1, 1, 3, 1, 4], baseFret: 11, barres: [11],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-eb11', name: 'Eb Dominant 11th Root 6 Barre', symbol: 'Eb11', category: 'barre', type: '11th',
    frets: [11, 11, 11, 13, 11, 13], fingers: [1, 1, 1, 3, 1, 4], baseFret: 11, barres: [11],
    rootString: 6, rootNoteString: 0 },

  // E  (fret 12 — octave)
  { id: 'barre-e6-e11-12', name: 'E Dominant 11th Root 6 Barre', symbol: 'E11', category: 'barre', type: '11th',
    frets: [12, 12, 12, 14, 12, 14], fingers: [1, 1, 1, 3, 1, 4], baseFret: 12, barres: [12],
    rootString: 6, rootNoteString: 0 },

  // Fb (enharmonic E)  (fret 12)
  { id: 'barre-e6-fb11', name: 'Fb Dominant 11th Root 6 Barre', symbol: 'Fb11', category: 'barre', type: '11th',
    frets: [12, 12, 12, 14, 12, 14], fingers: [1, 1, 1, 3, 1, 4], baseFret: 12, barres: [12],
    rootString: 6, rootNoteString: 0 },

  // E# (enharmonic F)  (fret 1)
  { id: 'barre-e6-esharp11', name: 'E# Dominant 11th Root 6 Barre', symbol: 'E#11', category: 'barre', type: '11th',
    frets: [1, 1, 1, 3, 1, 3], fingers: [1, 1, 1, 3, 1, 4], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },

  // ============================================================================
  // BARRE CHORDS - Dominant 13th (E-shape, Root 6)
  // Barre at fret N: frets [N, N+2, N, N+1, N+2, N], fingers [1,3,1,2,4,1]
  // 6th string notes: F=1, F#/Gb=2, G=3, Ab/G#=4, A=5, Bb/A#=6,
  //                   B/Cb=7, C/B#=8, Db/C#=9, D=10, Eb/D#=11, E=12
  // ============================================================================

  // F  (fret 1)
  { id: 'barre-e6-f13', name: 'F Dominant 13th Root 6 Barre', symbol: 'F13', category: 'barre', type: '13th',
    frets: [1, 3, 1, 2, 3, 1], fingers: [1, 3, 1, 2, 4, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },

  // F# / Gb  (fret 2)
  { id: 'barre-e6-fsharp13', name: 'F# Dominant 13th Root 6 Barre', symbol: 'F#13', category: 'barre', type: '13th',
    frets: [2, 4, 2, 3, 4, 2], fingers: [1, 3, 1, 2, 4, 1], baseFret: 2, barres: [2],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-gb13', name: 'Gb Dominant 13th Root 6 Barre', symbol: 'Gb13', category: 'barre', type: '13th',
    frets: [2, 4, 2, 3, 4, 2], fingers: [1, 3, 1, 2, 4, 1], baseFret: 2, barres: [2],
    rootString: 6, rootNoteString: 0 },

  // G  (fret 3)
  { id: 'barre-e6-g13', name: 'G Dominant 13th Root 6 Barre', symbol: 'G13', category: 'barre', type: '13th',
    frets: [3, 5, 3, 4, 5, 3], fingers: [1, 3, 1, 2, 4, 1], baseFret: 3, barres: [3],
    rootString: 6, rootNoteString: 0 },

  // G# / Ab  (fret 4)
  { id: 'barre-e6-gsharp13', name: 'G# Dominant 13th Root 6 Barre', symbol: 'G#13', category: 'barre', type: '13th',
    frets: [4, 6, 4, 5, 6, 4], fingers: [1, 3, 1, 2, 4, 1], baseFret: 4, barres: [4],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-ab13', name: 'Ab Dominant 13th Root 6 Barre', symbol: 'Ab13', category: 'barre', type: '13th',
    frets: [4, 6, 4, 5, 6, 4], fingers: [1, 3, 1, 2, 4, 1], baseFret: 4, barres: [4],
    rootString: 6, rootNoteString: 0 },

  // A  (fret 5)
  { id: 'barre-e6-a13', name: 'A Dominant 13th Root 6 Barre', symbol: 'A13', category: 'barre', type: '13th',
    frets: [5, 7, 5, 6, 7, 5], fingers: [1, 3, 1, 2, 4, 1], baseFret: 5, barres: [5],
    rootString: 6, rootNoteString: 0 },

  // A# / Bb  (fret 6)
  { id: 'barre-e6-asharp13', name: 'A# Dominant 13th Root 6 Barre', symbol: 'A#13', category: 'barre', type: '13th',
    frets: [6, 8, 6, 7, 8, 6], fingers: [1, 3, 1, 2, 4, 1], baseFret: 6, barres: [6],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-bb13', name: 'Bb Dominant 13th Root 6 Barre', symbol: 'Bb13', category: 'barre', type: '13th',
    frets: [6, 8, 6, 7, 8, 6], fingers: [1, 3, 1, 2, 4, 1], baseFret: 6, barres: [6],
    rootString: 6, rootNoteString: 0 },

  // B / Cb  (fret 7)
  { id: 'barre-e6-b13', name: 'B Dominant 13th Root 6 Barre', symbol: 'B13', category: 'barre', type: '13th',
    frets: [7, 9, 7, 8, 9, 7], fingers: [1, 3, 1, 2, 4, 1], baseFret: 7, barres: [7],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-cb13', name: 'Cb Dominant 13th Root 6 Barre', symbol: 'Cb13', category: 'barre', type: '13th',
    frets: [7, 9, 7, 8, 9, 7], fingers: [1, 3, 1, 2, 4, 1], baseFret: 7, barres: [7],
    rootString: 6, rootNoteString: 0 },

  // C / B#  (fret 8)
  { id: 'barre-e6-c13', name: 'C Dominant 13th Root 6 Barre', symbol: 'C13', category: 'barre', type: '13th',
    frets: [8, 10, 8, 9, 10, 8], fingers: [1, 3, 1, 2, 4, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-bsharp13', name: 'B# Dominant 13th Root 6 Barre', symbol: 'B#13', category: 'barre', type: '13th',
    frets: [8, 10, 8, 9, 10, 8], fingers: [1, 3, 1, 2, 4, 1], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },

  // C# / Db  (fret 9)
  { id: 'barre-e6-csharp13', name: 'C# Dominant 13th Root 6 Barre', symbol: 'C#13', category: 'barre', type: '13th',
    frets: [9, 11, 9, 10, 11, 9], fingers: [1, 3, 1, 2, 4, 1], baseFret: 9, barres: [9],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-db13', name: 'Db Dominant 13th Root 6 Barre', symbol: 'Db13', category: 'barre', type: '13th',
    frets: [9, 11, 9, 10, 11, 9], fingers: [1, 3, 1, 2, 4, 1], baseFret: 9, barres: [9],
    rootString: 6, rootNoteString: 0 },

  // D  (fret 10)
  { id: 'barre-e6-d13', name: 'D Dominant 13th Root 6 Barre', symbol: 'D13', category: 'barre', type: '13th',
    frets: [10, 12, 10, 11, 12, 10], fingers: [1, 3, 1, 2, 4, 1], baseFret: 10, barres: [10],
    rootString: 6, rootNoteString: 0 },

  // D# / Eb  (fret 11)
  { id: 'barre-e6-dsharp13', name: 'D# Dominant 13th Root 6 Barre', symbol: 'D#13', category: 'barre', type: '13th',
    frets: [11, 13, 11, 12, 13, 11], fingers: [1, 3, 1, 2, 4, 1], baseFret: 11, barres: [11],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-eb13', name: 'Eb Dominant 13th Root 6 Barre', symbol: 'Eb13', category: 'barre', type: '13th',
    frets: [11, 13, 11, 12, 13, 11], fingers: [1, 3, 1, 2, 4, 1], baseFret: 11, barres: [11],
    rootString: 6, rootNoteString: 0 },

  // E  (fret 12 — octave)
  { id: 'barre-e6-e13-12', name: 'E Dominant 13th Root 6 Barre', symbol: 'E13', category: 'barre', type: '13th',
    frets: [12, 14, 12, 13, 14, 12], fingers: [1, 3, 1, 2, 4, 1], baseFret: 12, barres: [12],
    rootString: 6, rootNoteString: 0 },

  // Fb (enharmonic E)  (fret 12)
  { id: 'barre-e6-fb13', name: 'Fb Dominant 13th Root 6 Barre', symbol: 'Fb13', category: 'barre', type: '13th',
    frets: [12, 14, 12, 13, 14, 12], fingers: [1, 3, 1, 2, 4, 1], baseFret: 12, barres: [12],
    rootString: 6, rootNoteString: 0 },

  // E# (enharmonic F)  (fret 1)
  { id: 'barre-e6-esharp13', name: 'E# Dominant 13th Root 6 Barre', symbol: 'E#13', category: 'barre', type: '13th',
    frets: [1, 3, 1, 2, 3, 1], fingers: [1, 3, 1, 2, 4, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },

  // ============================================================================
  // BARRE CHORDS - Minor 9th (E-shape, Root 6)
  // Barre at fret N: frets [N, N+2, N, N, N, N+2], fingers [1,3,1,1,1,4]
  // 6th string notes: F=1, F#/Gb=2, G=3, Ab/G#=4, A=5, Bb/A#=6,
  //                   B/Cb=7, C/B#=8, Db/C#=9, D=10, Eb/D#=11, E=12
  // ============================================================================

  // F  (fret 1)
  { id: 'barre-e6-fm9', name: 'F Minor 9 Root 6 Barre', symbol: 'Fm9', category: 'barre', type: 'minor9',
    frets: [1, 3, 1, 1, 1, 3], fingers: [1, 3, 1, 1, 1, 4], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },

  // F# / Gb  (fret 2)
  { id: 'barre-e6-fsharpm9', name: 'F# Minor 9 Root 6 Barre', symbol: 'F#m9', category: 'barre', type: 'minor9',
    frets: [2, 4, 2, 2, 2, 4], fingers: [1, 3, 1, 1, 1, 4], baseFret: 2, barres: [2],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-gbm9', name: 'Gb Minor 9 Root 6 Barre', symbol: 'Gbm9', category: 'barre', type: 'minor9',
    frets: [2, 4, 2, 2, 2, 4], fingers: [1, 3, 1, 1, 1, 4], baseFret: 2, barres: [2],
    rootString: 6, rootNoteString: 0 },

  // G  (fret 3)
  { id: 'barre-e6-gm9', name: 'G Minor 9 Root 6 Barre', symbol: 'Gm9', category: 'barre', type: 'minor9',
    frets: [3, 5, 3, 3, 3, 5], fingers: [1, 3, 1, 1, 1, 4], baseFret: 3, barres: [3],
    rootString: 6, rootNoteString: 0 },

  // G# / Ab  (fret 4)
  { id: 'barre-e6-gsharpm9', name: 'G# Minor 9 Root 6 Barre', symbol: 'G#m9', category: 'barre', type: 'minor9',
    frets: [4, 6, 4, 4, 4, 6], fingers: [1, 3, 1, 1, 1, 4], baseFret: 4, barres: [4],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-abm9', name: 'Ab Minor 9 Root 6 Barre', symbol: 'Abm9', category: 'barre', type: 'minor9',
    frets: [4, 6, 4, 4, 4, 6], fingers: [1, 3, 1, 1, 1, 4], baseFret: 4, barres: [4],
    rootString: 6, rootNoteString: 0 },

  // A  (fret 5)
  { id: 'barre-e6-am9', name: 'A Minor 9 Root 6 Barre', symbol: 'Am9', category: 'barre', type: 'minor9',
    frets: [5, 7, 5, 5, 5, 7], fingers: [1, 3, 1, 1, 1, 4], baseFret: 5, barres: [5],
    rootString: 6, rootNoteString: 0 },

  // A# / Bb  (fret 6)
  { id: 'barre-e6-asharpm9', name: 'A# Minor 9 Root 6 Barre', symbol: 'A#m9', category: 'barre', type: 'minor9',
    frets: [6, 8, 6, 6, 6, 8], fingers: [1, 3, 1, 1, 1, 4], baseFret: 6, barres: [6],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-bbm9', name: 'Bb Minor 9 Root 6 Barre', symbol: 'Bbm9', category: 'barre', type: 'minor9',
    frets: [6, 8, 6, 6, 6, 8], fingers: [1, 3, 1, 1, 1, 4], baseFret: 6, barres: [6],
    rootString: 6, rootNoteString: 0 },

  // B / Cb  (fret 7)
  { id: 'barre-e6-bm9', name: 'B Minor 9 Root 6 Barre', symbol: 'Bm9', category: 'barre', type: 'minor9',
    frets: [7, 9, 7, 7, 7, 9], fingers: [1, 3, 1, 1, 1, 4], baseFret: 7, barres: [7],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-cbm9', name: 'Cb Minor 9 Root 6 Barre', symbol: 'Cbm9', category: 'barre', type: 'minor9',
    frets: [7, 9, 7, 7, 7, 9], fingers: [1, 3, 1, 1, 1, 4], baseFret: 7, barres: [7],
    rootString: 6, rootNoteString: 0 },

  // C / B#  (fret 8)
  { id: 'barre-e6-cm9', name: 'C Minor 9 Root 6 Barre', symbol: 'Cm9', category: 'barre', type: 'minor9',
    frets: [8, 10, 8, 8, 8, 10], fingers: [1, 3, 1, 1, 1, 4], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-bsharpm9', name: 'B# Minor 9 Root 6 Barre', symbol: 'B#m9', category: 'barre', type: 'minor9',
    frets: [8, 10, 8, 8, 8, 10], fingers: [1, 3, 1, 1, 1, 4], baseFret: 8, barres: [8],
    rootString: 6, rootNoteString: 0 },

  // C# / Db  (fret 9)
  { id: 'barre-e6-csharpm9', name: 'C# Minor 9 Root 6 Barre', symbol: 'C#m9', category: 'barre', type: 'minor9',
    frets: [9, 11, 9, 9, 9, 11], fingers: [1, 3, 1, 1, 1, 4], baseFret: 9, barres: [9],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-dbm9', name: 'Db Minor 9 Root 6 Barre', symbol: 'Dbm9', category: 'barre', type: 'minor9',
    frets: [9, 11, 9, 9, 9, 11], fingers: [1, 3, 1, 1, 1, 4], baseFret: 9, barres: [9],
    rootString: 6, rootNoteString: 0 },

  // D  (fret 10)
  { id: 'barre-e6-dm9', name: 'D Minor 9 Root 6 Barre', symbol: 'Dm9', category: 'barre', type: 'minor9',
    frets: [10, 12, 10, 10, 10, 12], fingers: [1, 3, 1, 1, 1, 4], baseFret: 10, barres: [10],
    rootString: 6, rootNoteString: 0 },

  // D# / Eb  (fret 11)
  { id: 'barre-e6-dsharpm9', name: 'D# Minor 9 Root 6 Barre', symbol: 'D#m9', category: 'barre', type: 'minor9',
    frets: [11, 13, 11, 11, 11, 13], fingers: [1, 3, 1, 1, 1, 4], baseFret: 11, barres: [11],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-e6-ebm9', name: 'Eb Minor 9 Root 6 Barre', symbol: 'Ebm9', category: 'barre', type: 'minor9',
    frets: [11, 13, 11, 11, 11, 13], fingers: [1, 3, 1, 1, 1, 4], baseFret: 11, barres: [11],
    rootString: 6, rootNoteString: 0 },

  // E  (fret 12 — octave)
  { id: 'barre-e6-em9-12', name: 'E Minor 9 Root 6 Barre', symbol: 'Em9', category: 'barre', type: 'minor9',
    frets: [12, 14, 12, 12, 12, 14], fingers: [1, 3, 1, 1, 1, 4], baseFret: 12, barres: [12],
    rootString: 6, rootNoteString: 0 },

  // Fb (enharmonic E)  (fret 12)
  { id: 'barre-e6-fbm9', name: 'Fb Minor 9 Root 6 Barre', symbol: 'Fbm9', category: 'barre', type: 'minor9',
    frets: [12, 14, 12, 12, 12, 14], fingers: [1, 3, 1, 1, 1, 4], baseFret: 12, barres: [12],
    rootString: 6, rootNoteString: 0 },

  // E# (enharmonic F)  (fret 1)
  { id: 'barre-e6-esharpm9', name: 'E# Minor 9 Root 6 Barre', symbol: 'E#m9', category: 'barre', type: 'minor9',
    frets: [1, 3, 1, 1, 1, 3], fingers: [1, 3, 1, 1, 1, 4], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },

  // ============================================================================
  // BARRE CHORDS - Sus2 (A-shape, Root 5)
  // Barre at fret N: frets [-1, N, N+2, N+2, N, N], fingers [0,1,3,4,1,1]
  // Dual barres at N and N+2 (index finger + ring/pinky pair)
  // 5th string notes: Bb=1, B=2, C=3, Db/C#=4, D=5, Eb/D#=6,
  //                   E=7, F=8, F#/Gb=9, G=10, Ab/G#=11, A=12
  // ============================================================================

  // Bb / A#  (fret 1)
  { id: 'barre-r5-bb-sus2', name: 'Bb Sus2 Root 5 Barre', symbol: 'Bbsus2', category: 'barre', type: 'sus2',
    frets: [-1, 1, 3, 3, 1, 1], fingers: [0, 1, 3, 4, 1, 1], baseFret: 1, barres: [1, 3],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-asharp-sus2', name: 'A# Sus2 Root 5 Barre', symbol: 'A#sus2', category: 'barre', type: 'sus2',
    frets: [-1, 1, 3, 3, 1, 1], fingers: [0, 1, 3, 4, 1, 1], baseFret: 1, barres: [1, 3],
    rootString: 5, rootNoteString: 1 },

  // B  (fret 2)
  { id: 'barre-r5-b-sus2', name: 'B Sus2 Root 5 Barre', symbol: 'Bsus2', category: 'barre', type: 'sus2',
    frets: [-1, 2, 4, 4, 2, 2], fingers: [0, 1, 3, 4, 1, 1], baseFret: 2, barres: [2, 4],
    rootString: 5, rootNoteString: 1 },

  // C  (fret 3)
  { id: 'barre-r5-c-sus2', name: 'C Sus2 Root 5 Barre', symbol: 'Csus2', category: 'barre', type: 'sus2',
    frets: [-1, 3, 5, 5, 3, 3], fingers: [0, 1, 3, 4, 1, 1], baseFret: 3, barres: [3, 5],
    rootString: 5, rootNoteString: 1 },

  // C# / Db  (fret 4)
  { id: 'barre-r5-csharp-sus2', name: 'C# Sus2 Root 5 Barre', symbol: 'C#sus2', category: 'barre', type: 'sus2',
    frets: [-1, 4, 6, 6, 4, 4], fingers: [0, 1, 3, 4, 1, 1], baseFret: 4, barres: [4, 6],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-db-sus2', name: 'Db Sus2 Root 5 Barre', symbol: 'Dbsus2', category: 'barre', type: 'sus2',
    frets: [-1, 4, 6, 6, 4, 4], fingers: [0, 1, 3, 4, 1, 1], baseFret: 4, barres: [4, 6],
    rootString: 5, rootNoteString: 1 },

  // D  (fret 5)
  { id: 'barre-r5-d-sus2', name: 'D Sus2 Root 5 Barre', symbol: 'Dsus2', category: 'barre', type: 'sus2',
    frets: [-1, 5, 7, 7, 5, 5], fingers: [0, 1, 3, 4, 1, 1], baseFret: 5, barres: [5, 7],
    rootString: 5, rootNoteString: 1 },

  // Eb / D#  (fret 6)
  { id: 'barre-r5-eb-sus2', name: 'Eb Sus2 Root 5 Barre', symbol: 'Ebsus2', category: 'barre', type: 'sus2',
    frets: [-1, 6, 8, 8, 6, 6], fingers: [0, 1, 3, 4, 1, 1], baseFret: 6, barres: [6, 8],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-dsharp-sus2', name: 'D# Sus2 Root 5 Barre', symbol: 'D#sus2', category: 'barre', type: 'sus2',
    frets: [-1, 6, 8, 8, 6, 6], fingers: [0, 1, 3, 4, 1, 1], baseFret: 6, barres: [6, 8],
    rootString: 5, rootNoteString: 1 },

  // E  (fret 7)
  { id: 'barre-r5-e-sus2', name: 'E Sus2 Root 5 Barre', symbol: 'Esus2', category: 'barre', type: 'sus2',
    frets: [-1, 7, 9, 9, 7, 7], fingers: [0, 1, 3, 4, 1, 1], baseFret: 7, barres: [7, 9],
    rootString: 5, rootNoteString: 1 },

  // F  (fret 8)
  { id: 'barre-r5-f-sus2', name: 'F Sus2 Root 5 Barre', symbol: 'Fsus2', category: 'barre', type: 'sus2',
    frets: [-1, 8, 10, 10, 8, 8], fingers: [0, 1, 3, 4, 1, 1], baseFret: 8, barres: [8, 10],
    rootString: 5, rootNoteString: 1 },

  // F# / Gb  (fret 9)
  { id: 'barre-r5-fsharp-sus2', name: 'F# Sus2 Root 5 Barre', symbol: 'F#sus2', category: 'barre', type: 'sus2',
    frets: [-1, 9, 11, 11, 9, 9], fingers: [0, 1, 3, 4, 1, 1], baseFret: 9, barres: [9, 11],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-gb-sus2', name: 'Gb Sus2 Root 5 Barre', symbol: 'Gbsus2', category: 'barre', type: 'sus2',
    frets: [-1, 9, 11, 11, 9, 9], fingers: [0, 1, 3, 4, 1, 1], baseFret: 9, barres: [9, 11],
    rootString: 5, rootNoteString: 1 },

  // G  (fret 10)
  { id: 'barre-r5-g-sus2', name: 'G Sus2 Root 5 Barre', symbol: 'Gsus2', category: 'barre', type: 'sus2',
    frets: [-1, 10, 12, 12, 10, 10], fingers: [0, 1, 3, 4, 1, 1], baseFret: 10, barres: [10, 12],
    rootString: 5, rootNoteString: 1 },

  // Ab / G#  (fret 11)
  { id: 'barre-r5-ab-sus2', name: 'Ab Sus2 Root 5 Barre', symbol: 'Absus2', category: 'barre', type: 'sus2',
    frets: [-1, 11, 13, 13, 11, 11], fingers: [0, 1, 3, 4, 1, 1], baseFret: 11, barres: [11, 13],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-gsharp-sus2', name: 'G# Sus2 Root 5 Barre', symbol: 'G#sus2', category: 'barre', type: 'sus2',
    frets: [-1, 11, 13, 13, 11, 11], fingers: [0, 1, 3, 4, 1, 1], baseFret: 11, barres: [11, 13],
    rootString: 5, rootNoteString: 1 },

  // A  (fret 12 — octave)
  { id: 'barre-r5-a-sus2', name: 'A Sus2 Root 5 Barre', symbol: 'Asus2', category: 'barre', type: 'sus2',
    frets: [-1, 12, 14, 14, 12, 12], fingers: [0, 1, 3, 4, 1, 1], baseFret: 12, barres: [12, 14],
    rootString: 5, rootNoteString: 1 },

  // ============================================================================
  // BARRE CHORDS - Suspended 4 (A-shape, Root 5)
  // Barre at fret N: frets [-1, N, N+2, N+2, N+3, -1], fingers [0,1,3,3,4,0]
  // Barre bar on strings 2-3 (both at N+2); index on string 1 at N; pinky on string 4 at N+3
  // 5th string notes: Bb=1, B=2, C=3, Db/C#=4, D=5, Eb/D#=6,
  //                   E=7, F=8, F#/Gb=9, G=10, Ab/G#=11, A=12
  // ============================================================================

  // Bb / A#  (fret 1)
  { id: 'barre-r5-bb-sus4', name: 'Bb Suspended 4 Root 5 Barre', symbol: 'Bbsus4', category: 'barre', type: 'sus4',
    frets: [-1, 1, 3, 3, 4, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 1, barres: [1, 3],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-asharp-sus4', name: 'A# Suspended 4 Root 5 Barre', symbol: 'A#sus4', category: 'barre', type: 'sus4',
    frets: [-1, 1, 3, 3, 4, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 1, barres: [1, 3],
    rootString: 5, rootNoteString: 1 },

  // B  (fret 2)
  { id: 'barre-r5-b-sus4', name: 'B Suspended 4 Root 5 Barre', symbol: 'Bsus4', category: 'barre', type: 'sus4',
    frets: [-1, 2, 4, 4, 5, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 2, barres: [2, 4],
    rootString: 5, rootNoteString: 1 },

  // B  (fret 2) — Cb enharmonic
  { id: 'barre-r5-cb-sus4', name: 'Cb Suspended 4 Root 5 Barre', symbol: 'Cbsus4', category: 'barre', type: 'sus4',
    frets: [-1, 2, 4, 4, 5, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 2, barres: [2, 4],
    rootString: 5, rootNoteString: 1 },

  // C  (fret 3)
  { id: 'barre-r5-c-sus4', name: 'C Suspended 4 Root 5 Barre', symbol: 'Csus4', category: 'barre', type: 'sus4',
    frets: [-1, 3, 5, 5, 6, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 3, barres: [3, 5],
    rootString: 5, rootNoteString: 1 },

  // C  (fret 3) — B# enharmonic
  { id: 'barre-r5-bsharp-sus4', name: 'B# Suspended 4 Root 5 Barre', symbol: 'B#sus4', category: 'barre', type: 'sus4',
    frets: [-1, 3, 5, 5, 6, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 3, barres: [3, 5],
    rootString: 5, rootNoteString: 1 },

  // C# / Db  (fret 4)
  { id: 'barre-r5-csharp-sus4', name: 'C# Suspended 4 Root 5 Barre', symbol: 'C#sus4', category: 'barre', type: 'sus4',
    frets: [-1, 4, 6, 6, 7, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 4, barres: [4, 6],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-db-sus4', name: 'Db Suspended 4 Root 5 Barre', symbol: 'Dbsus4', category: 'barre', type: 'sus4',
    frets: [-1, 4, 6, 6, 7, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 4, barres: [4, 6],
    rootString: 5, rootNoteString: 1 },

  // D  (fret 5)
  { id: 'barre-r5-d-sus4', name: 'D Suspended 4 Root 5 Barre', symbol: 'Dsus4', category: 'barre', type: 'sus4',
    frets: [-1, 5, 7, 7, 8, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 5, barres: [5, 7],
    rootString: 5, rootNoteString: 1 },

  // Eb / D#  (fret 6)
  { id: 'barre-r5-eb-sus4', name: 'Eb Suspended 4 Root 5 Barre', symbol: 'Ebsus4', category: 'barre', type: 'sus4',
    frets: [-1, 6, 8, 8, 9, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 6, barres: [6, 8],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-dsharp-sus4', name: 'D# Suspended 4 Root 5 Barre', symbol: 'D#sus4', category: 'barre', type: 'sus4',
    frets: [-1, 6, 8, 8, 9, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 6, barres: [6, 8],
    rootString: 5, rootNoteString: 1 },

  // Eb / D#  (fret 6) — Fb enharmonic
  { id: 'barre-r5-fb-sus4', name: 'Fb Suspended 4 Root 5 Barre', symbol: 'Fbsus4', category: 'barre', type: 'sus4',
    frets: [-1, 6, 8, 8, 9, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 6, barres: [6, 8],
    rootString: 5, rootNoteString: 1 },

  // E  (fret 7)
  { id: 'barre-r5-e-sus4', name: 'E Suspended 4 Root 5 Barre', symbol: 'Esus4', category: 'barre', type: 'sus4',
    frets: [-1, 7, 9, 9, 10, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 7, barres: [7, 9],
    rootString: 5, rootNoteString: 1 },

  // F  (fret 8)
  { id: 'barre-r5-f-sus4', name: 'F Suspended 4 Root 5 Barre', symbol: 'Fsus4', category: 'barre', type: 'sus4',
    frets: [-1, 8, 10, 10, 11, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 8, barres: [8, 10],
    rootString: 5, rootNoteString: 1 },

  // F  (fret 8) — E# enharmonic
  { id: 'barre-r5-esharp-sus4', name: 'E# Suspended 4 Root 5 Barre', symbol: 'E#sus4', category: 'barre', type: 'sus4',
    frets: [-1, 8, 10, 10, 11, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 8, barres: [8, 10],
    rootString: 5, rootNoteString: 1 },

  // F# / Gb  (fret 9)
  { id: 'barre-r5-fsharp-sus4', name: 'F# Suspended 4 Root 5 Barre', symbol: 'F#sus4', category: 'barre', type: 'sus4',
    frets: [-1, 9, 11, 11, 12, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 9, barres: [9, 11],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-gb-sus4', name: 'Gb Suspended 4 Root 5 Barre', symbol: 'Gbsus4', category: 'barre', type: 'sus4',
    frets: [-1, 9, 11, 11, 12, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 9, barres: [9, 11],
    rootString: 5, rootNoteString: 1 },

  // G  (fret 10)
  { id: 'barre-r5-g-sus4', name: 'G Suspended 4 Root 5 Barre', symbol: 'Gsus4', category: 'barre', type: 'sus4',
    frets: [-1, 10, 12, 12, 13, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 10, barres: [10, 12],
    rootString: 5, rootNoteString: 1 },

  // Ab / G#  (fret 11)
  { id: 'barre-r5-ab-sus4', name: 'Ab Suspended 4 Root 5 Barre', symbol: 'Absus4', category: 'barre', type: 'sus4',
    frets: [-1, 11, 13, 13, 14, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 11, barres: [11, 13],
    rootString: 5, rootNoteString: 1 },
  { id: 'barre-r5-gsharp-sus4', name: 'G# Suspended 4 Root 5 Barre', symbol: 'G#sus4', category: 'barre', type: 'sus4',
    frets: [-1, 11, 13, 13, 14, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 11, barres: [11, 13],
    rootString: 5, rootNoteString: 1 },

  // A  (fret 12 — octave)
  { id: 'barre-r5-a-sus4', name: 'A Suspended 4 Root 5 Barre', symbol: 'Asus4', category: 'barre', type: 'sus4',
    frets: [-1, 12, 14, 14, 15, -1], fingers: [0, 1, 3, 3, 4, 0], baseFret: 12, barres: [12, 14],
    rootString: 5, rootNoteString: 1 },

  // ============================================================================
  // BARRE CHORDS - Minor (legacy A-shape entries kept below)
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
  { id: 'barre-fsus4', name: 'Fsus4', symbol: 'Fsus4', category: 'barre', type: 'sus4',
    frets: [1, 3, 3, 3, 1, 1], fingers: [1, 2, 3, 4, 1, 1], baseFret: 1, barres: [1],
    rootString: 6, rootNoteString: 0 },
  { id: 'barre-bbsus4', name: 'Bbsus4', symbol: 'Bbsus4', category: 'barre', type: 'sus4',
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
