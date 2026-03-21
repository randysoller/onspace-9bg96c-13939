export interface ChordData {
  root: string;
  type: string;
  category: string;
  frets: (number | null)[];
  fingers?: (number | null)[];
  barres?: number[];
  capo?: boolean;
  baseFret?: number;
  midi?: number[];
  rootString?: number; // Index of the string (0-5) that plays the root note
}

export interface ChordType {
  name: string;
  suffix: string;
  positions: ChordData[];
}

export interface ChordCategory {
  category: string;
  types: ChordType[];
}

export type ChordRoot = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export interface ChordFilter {
  roots: ChordRoot[];
  categories: string[];
  types: string[];
}
