// Comprehensive type definitions for fretboard and chord editor

export type StringState = 'none' | 'open-circle' | 'muted' | 'open-diamond';
export type ChordShape = 'circle' | 'diamond';
export type FingerType = 1 | 2 | 3 | 4 | 'T';

export interface DotMarker {
  string: number;
  fret: number;
  finger: FingerType;
  color: string;
  shape: ChordShape;
  label?: string;
}

export interface BarreMarker {
  fret: number;
  fromString: number;
  toString: number;
  finger: FingerType;
}

export interface ColorOption {
  name: string;
  value: string;
}

export interface ChordEditorState {
  baseFret: number;
  visibleFrets: number;
  markers: DotMarker[];
  barres: BarreMarker[];
  openStrings: StringState[];
  selectedFinger: FingerType;
  selectedColor: ColorOption;
  selectedShape: ChordShape;
  customLabel: string;
  barreMode: boolean;
  barreFret: number | null;
  barreFirstString: number | null;
}

export interface ChordInfo {
  name: string;
  symbol: string;
  category: string;
  type: string;
}

export interface FretboardInteraction {
  onFretClick: (string: number, fret: number) => void;
  onStringHeaderClick: (string: number) => void;
  onMarkerClick: (string: number, fret: number) => void;
  onBarreDoubleClick: (index: number) => void;
}

export interface KeyboardNavigationState {
  selectedString: number | null;
  selectedFret: number | null;
  isNavigating: boolean;
}
