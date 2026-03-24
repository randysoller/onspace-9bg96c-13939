// Fretboard visual constants
export const FRET_SPACING = 55;
export const STRING_SPACING = 45;
export const BASE_X = 40;
export const BASE_Y = 92;
export const NUT_Y = 88;
export const MARKER_RADIUS = 14;
export const STRING_HEADER_Y = 40;
export const STRING_LABEL_Y = 25;

// Preview diagram constants
export const PREVIEW_FRET_SPACING = 45;
export const PREVIEW_STRING_SPACING = 24;
export const PREVIEW_BASE_X = 30;
export const PREVIEW_BASE_Y = 20;
export const PREVIEW_MARKER_RADIUS = 10;

// String names
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

// Color palette for dots
export const DOT_COLORS = [
  { name: 'Orange', value: '#f59e0b', class: 'bg-amber-500' },
  { name: 'Cyan', value: '#06b6d4', class: 'bg-cyan-500' },
  { name: 'Green', value: '#10b981', class: 'bg-emerald-500' },
  { name: 'Emerald', value: '#14b8a6', class: 'bg-teal-500' },
  { name: 'Purple', value: '#a855f7', class: 'bg-purple-500' },
  { name: 'Orange-Red', value: '#f97316', class: 'bg-orange-500' },
  { name: 'Pink', value: '#ec4899', class: 'bg-pink-500' },
  { name: 'Teal', value: '#14b8a6', class: 'bg-teal-400' },
  { name: 'Yellow', value: '#eab308', class: 'bg-yellow-500' },
  { name: 'Blue', value: '#3b82f6', class: 'bg-blue-500' },
  { name: 'White', value: '#ffffff', class: 'bg-white' },
  { name: 'Gray', value: '#64748b', class: 'bg-slate-500' },
] as const;

// Chord metadata
export const CHORD_CATEGORIES = ['Open Chords', 'Barre Chords', 'Power Chords', 'Jazz Chords', 'Custom'];
export const CHORD_TYPES = ['Major', 'Minor', '7th', 'Major 7th', 'Minor 7th', 'Diminished', 'Augmented', 'Sus2', 'Sus4'];
