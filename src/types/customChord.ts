import type { ChordType, ChordCategory } from './chord';

export type DotShape = 'circle' | 'diamond';

export interface FretMarker {
  fret: number;     // 1-based relative fret number
  string: number;   // 0-based string index (0=low E, 5=high E)
  finger: number;   // 0 = no label, 1-4 = finger number
  color: string;    // HSL or hex color string
  shape: DotShape;  // circle (normal) or diamond (root)
  label: string;    // custom text label (overrides finger number)
}

export interface CustomChordData {
  id: string;
  name: string;
  symbol: string;
  baseFret: number;
  numFrets: number;
  mutedStrings: Set<number>;
  openStrings: Set<number>;
  openDiamonds: Set<number>;     // open strings rendered as blue diamonds (root)
  markers: FretMarker[];
  barres: { fret: number; fromString: number; toString: number; color: string }[];
  chordType?: ChordType;
  chordCategory?: ChordCategory;
  sourceChordId?: string;        // links back to original standard chord when edited
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_DOT_COLOR = 'hsl(38 75% 52%)';
export const DEFAULT_ROOT_COLOR = 'hsl(200 80% 62%)';
export const DEFAULT_BARRE_COLOR = 'hsl(38 75% 52%)';

export const PRESET_COLORS = [
  'hsl(38 75% 52%)', 'hsl(200 80% 62%)', '#ef4444', '#22c55e',
  '#a855f7', '#f97316', '#ec4899', '#14b8a6',
  '#eab308', '#6366f1', '#f8fafc', '#64748b',
];

// Convert CustomChordData to ChordData-compatible format
export function customToLibraryChord(custom: CustomChordData): any {
  // Build frets array
  const frets = new Array(6).fill(0);
  const fingers = new Array(6).fill(0);
  
  // Set muted and open strings
  custom.mutedStrings.forEach(s => { frets[s] = -1; });
  custom.openStrings.forEach(s => { frets[s] = 0; });
  
  // Set fretted notes
  custom.markers.forEach(m => {
    const absoluteFret = custom.baseFret + m.fret - 1;
    frets[m.string] = absoluteFret;
    fingers[m.string] = m.finger;
  });
  
  // Convert barres to absolute fret numbers
  const barres = custom.barres.map(b => custom.baseFret + b.fret - 1);
  
  // Determine root note string
  const rootNoteString = (() => {
    // Check open diamonds
    const openRoot = Array.from(custom.openDiamonds)[0];
    if (openRoot !== undefined) return openRoot;
    
    // Check diamond markers
    const diamondMarker = custom.markers.find(m => m.shape === 'diamond');
    if (diamondMarker) return diamondMarker.string;
    
    // Default to first non-muted string
    return frets.findIndex(f => f !== -1);
  })();
  
  return {
    id: custom.id,
    name: custom.name,
    symbol: custom.symbol,
    category: custom.chordCategory || 'custom',
    type: custom.chordType || 'major',
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
