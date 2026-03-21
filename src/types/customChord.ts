export interface CustomChordMarker {
  string: number;
  fret: number;
  finger?: number;
}

export interface CustomChordBarre {
  fromString: number;
  toString: number;
  fret: number;
  finger?: number;
}

export interface CustomChordData {
  id: string;
  name: string;
  root: string;
  type: string;
  markers: CustomChordMarker[];
  barres?: CustomChordBarre[];
  baseFret?: number;
  createdAt: number;
  updatedAt: number;
}
