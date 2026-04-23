/**
 * Shared chord-filtering utilities used by ChordLibrary, ChordSetup (practiceStore),
 * and any future pages that need key-based chord filtering.
 *
 * All functions are pure (no side-effects, no imports from stores/components) so
 * they can be safely used in useMemo callbacks and Zustand actions alike.
 */

import { Scale, Note } from '@tonaljs/tonal';

// Chromatic scale used for semitone index lookups (canonical mixed sharp/flat form).
const CHROMATIC_SCALE = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

/**
 * Returns the semitone index (0-11) of the root note of a chord symbol.
 * Returns -1 if the symbol cannot be parsed.
 *
 * Examples: "C" → 0, "F#" → 6, "Bb" → 10, "Am7" → 9
 */
export function chordRootSemitone(symbol: string): number {
  const m = symbol.match(/^([A-G])([#b]?)/);
  if (!m) return -1;
  let s = NOTE_SEMITONE[m[1]] ?? -1;
  if (s < 0) return -1;
  if (m[2] === '#') s = (s + 1) % 12;
  if (m[2] === 'b') s = (s + 11) % 12;
  return s;
}

/**
 * Builds the set of 7 diatonic semitone values for a major key using Tonal.js.
 *
 * @param noteName - A note name matching CHROMATIC_SCALE entries (e.g. "C", "F#", "Bb")
 * @returns Set of 7 semitone indices (0–11), or null if noteName is unrecognised.
 *
 * Examples:
 *   buildMajorScaleNotes("C")  → Set {0, 2, 4, 5, 7, 9, 11}   (C D E F G A B)
 *   buildMajorScaleNotes("G")  → Set {7, 9, 11, 0, 2, 4, 6}   (G A B C D E F#)
 *   buildMajorScaleNotes("F#") → Set {6, 8, 10, 11, 1, 3, 5}  (F# G# A# B C# D# E#)
 */
export function buildMajorScaleNotes(noteName: string): Set<number> | null {
  // Validate the note name is in our canonical chromatic scale first
  if (!(CHROMATIC_SCALE as readonly string[]).includes(noteName)) return null;
  const scaleData = Scale.get(`${noteName} major`);
  if (!scaleData.notes || scaleData.notes.length === 0) return null;
  // Convert Tonal note names to semitone indices (0–11), handling enharmonics
  return new Set(
    scaleData.notes.map((n) => {
      const pc = Note.get(n).chroma;
      return pc ?? 0;
    })
  );
}

/**
 * Returns true when the chord's root note is diatonic to the provided scale.
 * Convenience wrapper used in filter predicates.
 */
export function isChordInScale(symbol: string, scaleNotes: Set<number>): boolean {
  const semitone = chordRootSemitone(symbol);
  return semitone >= 0 && scaleNotes.has(semitone);
}
