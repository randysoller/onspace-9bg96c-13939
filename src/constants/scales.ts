export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonicMajor: [0, 2, 4, 7, 9],
  pentatonicMinor: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
};

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const NOTE_FREQUENCIES: Record<string, number> = {
  'C': 16.35,
  'C#': 17.32,
  'D': 18.35,
  'D#': 19.45,
  'E': 20.60,
  'F': 21.83,
  'F#': 23.12,
  'G': 24.50,
  'G#': 25.96,
  'A': 27.50,
  'A#': 29.14,
  'B': 30.87,
};
