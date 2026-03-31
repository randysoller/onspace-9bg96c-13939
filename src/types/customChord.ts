import type { ChordType, ChordCategory, ChordData } from './chord';

export type DotShape = 'circle' | 'diamond';

export interface FretMarker {
  fret: number;     // 1-based fret number (relative to display, NOT absolute)
  string: number;   // 0-based string index (0=low E, 5=high E)
  finger: number;   // 0 = no label, 1-4 = finger number
  color: string;    // CSS color string (HSL or hex)
  shape: DotShape;  // circle or diamond
  label: string;    // custom text label (overrides finger number display if non-empty)
}

export interface CustomChordData {
  id: string;
  name: string;
  symbol: string;
  baseFret: number;
  numFrets: number;                    // how many frets to show (default 5, range 3-7)
  mutedStrings: Set<number>;           // string indices that are muted (X)
  openStrings: Set<number>;            // string indices that are open (O)
  openDiamonds: Set<number>;           // open strings shown as blue-outlined diamonds (root indicator)
  markers: FretMarker[];
  barres: { fret: number; fromString: number; toString: number; color: string }[];
  chordType?: ChordType;               // optional classification
  chordCategory?: ChordCategory;       // optional classification
  sourceChordId?: string;              // if cloned from a standard library chord
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_DOT_COLOR = 'hsl(38 75% 52%)';   // amber/gold
export const DEFAULT_ROOT_COLOR = 'hsl(200 80% 62%)';  // sky blue
export const DEFAULT_BARRE_COLOR = 'hsl(38 75% 52%)';  // amber/gold

export const PRESET_COLORS = [
  'hsl(38 75% 52%)',   // amber (primary — matches library)
  'hsl(200 80% 62%)',  // sky blue (root — matches library)
  '#ef4444',           // red
  '#22c55e',           // green
  '#a855f7',           // purple
  '#f97316',           // orange
  '#ec4899',           // pink
  '#14b8a6',           // teal
  '#eab308',           // yellow
  '#6366f1',           // indigo
  '#f8fafc',           // white
  '#64748b',           // slate
];

export function createBlankChord(): CustomChordData {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    symbol: '',
    baseFret: 1,
    numFrets: 5,
    mutedStrings: new Set<number>(),
    openStrings: new Set<number>(),
    openDiamonds: new Set<number>(),
    markers: [],
    barres: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Convert CustomChordData back into a ChordData-compatible object for the library grid.
export function customToLibraryChord(custom: CustomChordData): ChordData & {
  isCustom: true;
  customMarkers: FretMarker[];
  customBarres: CustomChordData['barres'];
  customMutedStrings: number[];
  customOpenStrings: number[];
  customOpenDiamonds: number[];
  numFrets: number;
  sourceChordId?: string;
} {
  // 1. Initialize frets and fingers
  const frets: number[] = [-1, -1, -1, -1, -1, -1];
  const fingers: number[] = [0, 0, 0, 0, 0, 0];

  // 2. Mark muted strings
  custom.mutedStrings.forEach(s => { frets[s] = -1; });

  // 3. Mark open strings
  custom.openStrings.forEach(s => { frets[s] = 0; });

  // 4. For each marker: compute absoluteFret, store in frets/fingers (lowest fret per string wins)
  custom.markers.forEach(m => {
    const absoluteFret = custom.baseFret + m.fret - 1;
    if (frets[m.string] === -1 || absoluteFret < frets[m.string] || frets[m.string] === 0) {
      frets[m.string] = absoluteFret;
      fingers[m.string] = m.finger;
    }
  });

  // 5. Build standard barres array
  const barres = custom.barres.map(b => custom.baseFret + b.fret - 1);

  // 6. Determine rootNoteString
  const diamondMarker = custom.markers.find(m => m.shape === 'diamond');
  const openDiamondArr = Array.from(custom.openDiamonds);
  const rootNoteString = diamondMarker
    ? diamondMarker.string
    : openDiamondArr.length > 0
    ? openDiamondArr[0]
    : 0;

  return {
    id: custom.id,
    name: custom.name,
    symbol: custom.symbol,
    category: custom.chordCategory ?? 'custom',
    type: custom.chordType ?? 'major',
    frets,
    fingers,
    baseFret: custom.baseFret,
    barres: barres.length > 0 ? barres : undefined,
    rootNoteString,
    isCustom: true,
    customMarkers: custom.markers,
    customBarres: custom.barres,
    customMutedStrings: Array.from(custom.mutedStrings),
    customOpenStrings: Array.from(custom.openStrings),
    customOpenDiamonds: Array.from(custom.openDiamonds),
    numFrets: custom.numFrets,
    sourceChordId: custom.sourceChordId,
  };
}
