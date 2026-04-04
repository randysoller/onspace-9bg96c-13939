export type ChordCategory = 'open' | 'barre' | 'movable' | 'custom';
export type BarreRoot = 6 | 5 | 4;

export type ChordType =
  | 'major' | 'minor' | 'augmented' | 'slash' | 'diminished'
  | 'sus2' | 'sus4' | 'major6' | 'minor6' | 'major7' | 'dominant7' | 'minor7' | 'aug7'
  | 'halfDim7' | 'dim7' | 'add9'
  | 'major9' | '9th' | 'minor9'
  | 'major11' | '11th' | 'minor11'
  | 'major13' | '13th' | 'minor13';

export interface ChordData {
  id: string;
  name: string;
  symbol: string;
  category: ChordCategory;
  type: ChordType;
  frets: number[];        // length 6, index 0=low E, 5=high E. -1 = muted
  fingers: number[];      // fingering indicators
  baseFret: number;       // position on neck (1 = open position)
  barres?: number[];      // fret numbers that are barred
  rootString?: BarreRoot; // which string group the root is on
  rootNoteString: number; // 0-indexed string where root note lives (0=low E, 5=high E)
}

export type TimerDuration = 0 | 2 | 5 | 10;

export const CHORD_TYPE_LABELS: Record<ChordType | 'all', string> = {
  all: 'All Types',
  major: 'Major',
  minor: 'Minor',
  augmented: 'Augmented',
  slash: 'Slash',
  diminished: 'Diminished',
  sus2: 'Suspended 2',
  sus4: 'Suspended 4',
  major6: 'Major 6',
  minor6: 'Minor 6',
  major7: 'Major 7',
  dominant7: 'Dominant 7th',
  minor7: 'Minor 7',
  aug7: 'Augmented 7th',
  halfDim7: 'Minor 7♭5',
  dim7: 'Diminished 7',
  add9: 'Add 9',
  major9: 'Major 9',
  '9th': 'Dominant 9th',
  minor9: 'Minor 9',
  major11: 'Major 11',
  '11th': 'Dominant 11th',
  minor11: 'Minor 11',
  major13: 'Major 13',
  '13th': 'Dominant 13th',
  minor13: 'Minor 13',
};

export const CATEGORY_LABELS: Record<ChordCategory | 'all', string> = {
  all: 'All Chords',
  open: 'Open Chords',
  barre: 'Barre Chords',
  movable: 'Movable Chords',
  custom: 'My Chords',
};

export const BARRE_ROOT_LABELS: Record<BarreRoot | 'all', string> = {
  all: 'All Roots',
  6: 'Root 6th String',
  5: 'Root 5th String',
  4: 'Root 4th String',
};

export function getChordCategoryLabel(chord: ChordData): string {
  if (chord.category === 'custom') return 'Custom';
  if (chord.category === 'movable' && chord.rootString) return `Root ${chord.rootString} Movable`;
  if (chord.category === 'barre' && chord.rootString) return `Root ${chord.rootString} Barre`;
  return CATEGORY_LABELS[chord.category];
}
