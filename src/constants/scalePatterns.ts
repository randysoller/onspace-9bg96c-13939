/**
 * scalePatterns.ts
 *
 * Hard-coded 5-position CAGED box patterns for:
 *   • Major scale           (getMajorScalePatterns)
 *   • Natural Minor scale   (getMinorScalePatterns)
 *   • Major Pentatonic      (getMajorPentPatterns)
 *   • Minor Pentatonic      (getMinorPentPatterns)
 *
 * Each pattern stores dots relative to a base fret when the root = G (semitone 7).
 * getMajorScalePatterns / getMinorScalePatterns / etc. transpose to any root by
 * shifting the base fret by the semitone difference from G.
 *
 * All other scales fall back to the algorithmic box-position generator in
 * ScaleDetailModal.tsx.
 *
 * String index convention (mirrors HorizontalScaleFretboard):
 *   0 = high e (SVG top row, thinnest)
 *   5 = low  E (SVG bottom row, thickest)
 */

export interface PatternDot {
  /** 0 = high e (SVG top row), 5 = low E (SVG bottom row) */
  string: number;
  /** 0-based slot within the 5-fret window (0 = lowest visible fret) */
  relFret: number;
  /** 1–4 finger number */
  finger: number;
  isRoot: boolean;
}

export interface BoxPattern {
  /** Base fret of the 5-fret window when the root is G */
  baseFretForG: number;
  dots: PatternDot[];
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function patternLabel(idx: number, baseFret: number): string {
  const roman = ['I', 'II', 'III', 'IV', 'V'][idx] ?? String(idx + 1);
  const fretLabel = baseFret <= 1 ? 'Open' : `Fret ${baseFret}`;
  return `Pattern ${roman} — ${fretLabel}`;
}

// ── G Major CAGED 5-position patterns ────────────────────────────────────────
//
// G Major: G A B C D E F#  (intervals 0,2,4,5,7,9,11)
// Fret positions of G (root): str5=3, str4=10, str3=5, str2=0/12, str1=8, str0=3

export const MAJOR_PATTERNS: readonly BoxPattern[] = [
  // Pattern I  (E-shape, window frets 2–6 for G major, root on low E fret 3 & high e fret 3)
  {
    baseFretForG: 2,
    dots: [
      // high e (str 0): fret2=f1, fret3=root♦f2, fret5=f4 — relFrets 0,1,3
      { string: 0, relFret: 0, finger: 1, isRoot: false },
      { string: 0, relFret: 1, finger: 2, isRoot: true  },
      { string: 0, relFret: 3, finger: 4, isRoot: false },
      // B (str 1): fret3=f2, fret5=f4 — relFrets 1,3
      { string: 1, relFret: 1, finger: 2, isRoot: false },
      { string: 1, relFret: 3, finger: 4, isRoot: false },
      // G (str 2): fret2=f1, fret4=f3, fret5=f4 — relFrets 0,2,3
      { string: 2, relFret: 0, finger: 1, isRoot: false },
      { string: 2, relFret: 2, finger: 3, isRoot: false },
      { string: 2, relFret: 3, finger: 4, isRoot: false },
      // D (str 3): fret2=f1, fret4=f3, fret5=root♦f4 — relFrets 0,2,3
      { string: 3, relFret: 0, finger: 1, isRoot: false },
      { string: 3, relFret: 2, finger: 3, isRoot: false },
      { string: 3, relFret: 3, finger: 4, isRoot: true  },
      // A (str 4): fret2=f1, fret3=f2, fret5=f4 — relFrets 0,1,3
      { string: 4, relFret: 0, finger: 1, isRoot: false },
      { string: 4, relFret: 1, finger: 2, isRoot: false },
      { string: 4, relFret: 3, finger: 4, isRoot: false },
      // low E (str 5): fret3=root♦f1, fret5=f3 — relFrets 1,3
      { string: 5, relFret: 1, finger: 1, isRoot: true  },
      { string: 5, relFret: 3, finger: 3, isRoot: false },
    ],
  },

  // Pattern II  (E-shape, window frets 5–9 for G major)
  {
    baseFretForG: 5,
    dots: [
      // high e (str 0): fret5=f1, fret7=f3, fret8=f4
      { string: 0, relFret: 0, finger: 1, isRoot: false },
      { string: 0, relFret: 2, finger: 3, isRoot: false },
      { string: 0, relFret: 3, finger: 4, isRoot: false },
      // B (str 1): fret5=f1, fret6=f2, fret8=f4
      { string: 1, relFret: 0, finger: 1, isRoot: false },
      { string: 1, relFret: 1, finger: 2, isRoot: false },
      { string: 1, relFret: 3, finger: 4, isRoot: false },
      // G (str 2): fret5=f1, fret6=f2, fret8=root♦
      { string: 2, relFret: 0, finger: 1, isRoot: false },
      { string: 2, relFret: 1, finger: 2, isRoot: false },
      { string: 2, relFret: 3, finger: 4, isRoot: true  },
      // D (str 3): fret5=f1, fret7=f3, fret9=f5 (slot4) — use 0,2,4
      { string: 3, relFret: 0, finger: 1, isRoot: false },
      { string: 3, relFret: 2, finger: 3, isRoot: false },
      { string: 3, relFret: 4, finger: 4, isRoot: false },
      // A (str 4): fret5=f1, fret7=f3, fret8=root♦
      { string: 4, relFret: 0, finger: 1, isRoot: false },
      { string: 4, relFret: 2, finger: 3, isRoot: false },
      { string: 4, relFret: 3, finger: 4, isRoot: true  },
      // low E (str 5): fret5=f1, fret7=f3, fret8=f4
      { string: 5, relFret: 0, finger: 1, isRoot: false },
      { string: 5, relFret: 2, finger: 3, isRoot: false },
      { string: 5, relFret: 3, finger: 4, isRoot: false },
    ],
  },

  // Pattern III  (D-shape, window frets 7–11 for G major)
  {
    baseFretForG: 7,
    dots: [
      // high e (str 0): fret7=f1, fret8=f2, fret10=f4
      { string: 0, relFret: 0, finger: 1, isRoot: false },
      { string: 0, relFret: 1, finger: 2, isRoot: false },
      { string: 0, relFret: 3, finger: 4, isRoot: false },
      // B (str 1): fret8=f2, fret10=f4
      { string: 1, relFret: 1, finger: 2, isRoot: false },
      { string: 1, relFret: 3, finger: 4, isRoot: false },
      // G (str 2): fret7=f1, fret9=f3, fret10=f4
      { string: 2, relFret: 0, finger: 1, isRoot: false },
      { string: 2, relFret: 2, finger: 3, isRoot: false },
      { string: 2, relFret: 3, finger: 4, isRoot: false },
      // D (str 3): fret7=f1, fret9=f3, fret10=f4
      { string: 3, relFret: 0, finger: 1, isRoot: false },
      { string: 3, relFret: 2, finger: 3, isRoot: false },
      { string: 3, relFret: 3, finger: 4, isRoot: false },
      // A (str 4): fret7=root♦, fret9=f3, fret10=f4
      { string: 4, relFret: 0, finger: 1, isRoot: true  },
      { string: 4, relFret: 2, finger: 3, isRoot: false },
      { string: 4, relFret: 3, finger: 4, isRoot: false },
      // low E (str 5): fret7=f1, fret8=f2, fret10=f4
      { string: 5, relFret: 0, finger: 1, isRoot: false },
      { string: 5, relFret: 1, finger: 2, isRoot: false },
      { string: 5, relFret: 3, finger: 4, isRoot: false },
    ],
  },

  // Pattern IV  (C-shape, window frets 9–13 for G major)
  {
    baseFretForG: 9,
    dots: [
      // high e (str 0): fret10=f2, fret12=f4
      { string: 0, relFret: 1, finger: 1, isRoot: false },
      { string: 0, relFret: 3, finger: 3, isRoot: false },
      // B (str 1): fret10=f2, fret12=f4, fret13=f5 (slot4)
      { string: 1, relFret: 1, finger: 1, isRoot: false },
      { string: 1, relFret: 3, finger: 3, isRoot: false },
      { string: 1, relFret: 4, finger: 4, isRoot: false },
      // G (str 2): fret9=f1, fret11=f3, fret12=root♦
      { string: 2, relFret: 0, finger: 1, isRoot: false },
      { string: 2, relFret: 2, finger: 3, isRoot: false },
      { string: 2, relFret: 3, finger: 4, isRoot: true  },
      // D (str 3): fret9=f1, fret11=f3, fret12=f4
      { string: 3, relFret: 0, finger: 1, isRoot: false },
      { string: 3, relFret: 2, finger: 3, isRoot: false },
      { string: 3, relFret: 3, finger: 4, isRoot: false },
      // A (str 4): fret9=f1, fret10=f2, fret12=root♦
      { string: 4, relFret: 0, finger: 1, isRoot: false },
      { string: 4, relFret: 1, finger: 2, isRoot: false },
      { string: 4, relFret: 3, finger: 4, isRoot: true  },
      // low E (str 5): fret10=f2, fret12=f4
      { string: 5, relFret: 1, finger: 2, isRoot: false },
      { string: 5, relFret: 3, finger: 4, isRoot: false },
    ],
  },

  // Pattern V  (A-shape, window frets 12–16 for G major)
  {
    baseFretForG: 12,
    dots: [
      // high e (str 0): fret12=f1, fret14=f3, fret15=root♦
      { string: 0, relFret: 0, finger: 1, isRoot: false },
      { string: 0, relFret: 2, finger: 3, isRoot: false },
      { string: 0, relFret: 3, finger: 4, isRoot: true  },
      // B (str 1): fret12=f1, fret13=f2, fret15=f4
      { string: 1, relFret: 0, finger: 1, isRoot: false },
      { string: 1, relFret: 1, finger: 2, isRoot: false },
      { string: 1, relFret: 3, finger: 4, isRoot: false },
      // G (str 2): fret12=root♦, fret13=f2, fret15=f4
      { string: 2, relFret: 0, finger: 1, isRoot: true  },
      { string: 2, relFret: 1, finger: 2, isRoot: false },
      { string: 2, relFret: 3, finger: 4, isRoot: false },
      // D (str 3): fret12=f1, fret14=f3
      { string: 3, relFret: 0, finger: 1, isRoot: false },
      { string: 3, relFret: 2, finger: 3, isRoot: false },
      // A (str 4): fret12=f1, fret14=f3, fret15=f4
      { string: 4, relFret: 0, finger: 1, isRoot: false },
      { string: 4, relFret: 2, finger: 3, isRoot: false },
      { string: 4, relFret: 3, finger: 4, isRoot: false },
      // low E (str 5): fret12=f1, fret14=f3, fret15=root♦
      { string: 5, relFret: 0, finger: 1, isRoot: false },
      { string: 5, relFret: 2, finger: 3, isRoot: false },
      { string: 5, relFret: 3, finger: 4, isRoot: true  },
    ],
  },
] as const;

// ── G Natural Minor 5-position patterns ──────────────────────────────────────
//
// G Natural Minor (Aeolian): G A Bb C D Eb F  (intervals 0,2,3,5,7,8,10)
//
// Open-string semitones: str0(e)=4, str1(B)=11, str2(G)=7, str3(D)=2, str4(A)=9, str5(E)=4
// Root G = semitone 7.
// G on each string: str5=fret3, str4=fret10, str3=fret5, str2=open(0)/fret12, str1=fret8, str0=fret3
//
// G Natural Minor notes on each string:
//   str5(low E): G=3,A=5,Bb=6,C=8,D=10,Eb=11,F=1(13)
//   str4(A):     G=10,A=12,Bb=1,C=3,D=5,Eb=6,F=8
//   str3(D):     G=5,A=7,Bb=8,C=10,D=12,Eb=1,F=3
//   str2(G):     G=0/12,A=2,Bb=3,C=5,D=7,Eb=8,F=10
//   str1(B):     G=8,A=10,Bb=11,C=1,D=3,Eb=4,F=6
//   str0(e):     G=3,A=5,Bb=6,C=8,D=10,Eb=11,F=1(13)

export const MINOR_PATTERNS: readonly BoxPattern[] = [
  // Pattern I  (window frets 3–7, root on str5 and str3)
  {
    baseFretForG: 3,
    dots: [
      // low E (str5): G(3)=root♦f1, A(5)=f3
      { string: 5, relFret: 0, finger: 1, isRoot: true  },
      { string: 5, relFret: 2, finger: 3, isRoot: false },
      // A (str4): C(3)=f1, D(5)=f3, Eb(6)=f4
      { string: 4, relFret: 0, finger: 1, isRoot: false },
      { string: 4, relFret: 2, finger: 3, isRoot: false },
      { string: 4, relFret: 3, finger: 4, isRoot: false },
      // D (str3): F(3)=f1, G(5)=root♦f3
      { string: 3, relFret: 0, finger: 1, isRoot: false },
      { string: 3, relFret: 2, finger: 3, isRoot: true  },
      // G (str2): Bb(3)=f1, C(5)=f3
      { string: 2, relFret: 0, finger: 1, isRoot: false },
      { string: 2, relFret: 2, finger: 3, isRoot: false },
      // B (str1): D(3)=f1, Eb(4)=f2
      { string: 1, relFret: 0, finger: 1, isRoot: false },
      { string: 1, relFret: 1, finger: 2, isRoot: false },
      // e (str0): G(3)=root♦f1, A(5)=f3
      { string: 0, relFret: 0, finger: 1, isRoot: true  },
      { string: 0, relFret: 2, finger: 3, isRoot: false },
    ],
  },

  // Pattern II  (window frets 5–9)
  {
    baseFretForG: 5,
    dots: [
      // low E (str5): A(5)=f1, Bb(6)=f2, C(8)=f4
      { string: 5, relFret: 0, finger: 1, isRoot: false },
      { string: 5, relFret: 1, finger: 2, isRoot: false },
      { string: 5, relFret: 3, finger: 4, isRoot: false },
      // A (str4): D(5)=f1, Eb(6)=f2, F(8)=f4
      { string: 4, relFret: 0, finger: 1, isRoot: false },
      { string: 4, relFret: 1, finger: 2, isRoot: false },
      { string: 4, relFret: 3, finger: 4, isRoot: false },
      // D (str3): G(5)=root♦f1, A(7)=f3, Bb(8)=f4
      { string: 3, relFret: 0, finger: 1, isRoot: true  },
      { string: 3, relFret: 2, finger: 3, isRoot: false },
      { string: 3, relFret: 3, finger: 4, isRoot: false },
      // G (str2): C(5)=f1, D(7)=f3, Eb(8)=f4
      { string: 2, relFret: 0, finger: 1, isRoot: false },
      { string: 2, relFret: 2, finger: 3, isRoot: false },
      { string: 2, relFret: 3, finger: 4, isRoot: false },
      // B (str1): F(6)=f2, G(8)=root♦f4
      { string: 1, relFret: 1, finger: 2, isRoot: false },
      { string: 1, relFret: 3, finger: 4, isRoot: true  },
      // e (str0): A(5)=f1, Bb(6)=f2, C(8)=f4
      { string: 0, relFret: 0, finger: 1, isRoot: false },
      { string: 0, relFret: 1, finger: 2, isRoot: false },
      { string: 0, relFret: 3, finger: 4, isRoot: false },
    ],
  },

  // Pattern III  (window frets 8–12, root on str4 and str1)
  {
    baseFretForG: 8,
    dots: [
      // low E (str5): C(8)=f1, D(10)=f3
      { string: 5, relFret: 0, finger: 1, isRoot: false },
      { string: 5, relFret: 2, finger: 3, isRoot: false },
      // A (str4): F(8)=f1, G(10)=root♦f3
      { string: 4, relFret: 0, finger: 1, isRoot: false },
      { string: 4, relFret: 2, finger: 3, isRoot: true  },
      // D (str3): Bb(8)=f1, C(10)=f3
      { string: 3, relFret: 0, finger: 1, isRoot: false },
      { string: 3, relFret: 2, finger: 3, isRoot: false },
      // G (str2): Eb(8)=f1, F(10)=f3, G(12)=root♦ slot4
      { string: 2, relFret: 0, finger: 1, isRoot: false },
      { string: 2, relFret: 2, finger: 3, isRoot: false },
      { string: 2, relFret: 4, finger: 4, isRoot: true  },
      // B (str1): G(8)=root♦f1, A(10)=f3, Bb(11)=f4
      { string: 1, relFret: 0, finger: 1, isRoot: true  },
      { string: 1, relFret: 2, finger: 3, isRoot: false },
      { string: 1, relFret: 3, finger: 4, isRoot: false },
      // e (str0): C(8)=f1, D(10)=f3
      { string: 0, relFret: 0, finger: 1, isRoot: false },
      { string: 0, relFret: 2, finger: 3, isRoot: false },
    ],
  },

  // Pattern IV  (window frets 10–14, root on str4, str2, str0 area)
  {
    baseFretForG: 10,
    dots: [
      // low E (str5): D(10)=f1, Eb(11)=f2, F(13)=f4
      { string: 5, relFret: 0, finger: 1, isRoot: false },
      { string: 5, relFret: 1, finger: 2, isRoot: false },
      { string: 5, relFret: 3, finger: 4, isRoot: false },
      // A (str4): G(10)=root♦f1, A(12)=f3, Bb(13)=f4
      { string: 4, relFret: 0, finger: 1, isRoot: true  },
      { string: 4, relFret: 2, finger: 3, isRoot: false },
      { string: 4, relFret: 3, finger: 4, isRoot: false },
      // D (str3): C(10)=f1, D(12)=f3, Eb(13)=f4
      { string: 3, relFret: 0, finger: 1, isRoot: false },
      { string: 3, relFret: 2, finger: 3, isRoot: false },
      { string: 3, relFret: 3, finger: 4, isRoot: false },
      // G (str2): F(10)=f1, G(12)=root♦f3
      { string: 2, relFret: 0, finger: 1, isRoot: false },
      { string: 2, relFret: 2, finger: 3, isRoot: true  },
      // B (str1): A(10)=f1, Bb(11)=f2, C(13)=f4
      { string: 1, relFret: 0, finger: 1, isRoot: false },
      { string: 1, relFret: 1, finger: 2, isRoot: false },
      { string: 1, relFret: 3, finger: 4, isRoot: false },
      // e (str0): D(10)=f1, Eb(11)=f2, F(13)=f4
      { string: 0, relFret: 0, finger: 1, isRoot: false },
      { string: 0, relFret: 1, finger: 2, isRoot: false },
      { string: 0, relFret: 3, finger: 4, isRoot: false },
    ],
  },

  // Pattern V  (window frets 13–17, root on str5 and str3 an octave up)
  {
    baseFretForG: 13,
    dots: [
      // low E (str5): F(13)=f1, G(15)=root♦f3
      { string: 5, relFret: 0, finger: 1, isRoot: false },
      { string: 5, relFret: 2, finger: 3, isRoot: true  },
      // A (str4): Bb(13)=f1, C(15)=f3
      { string: 4, relFret: 0, finger: 1, isRoot: false },
      { string: 4, relFret: 2, finger: 3, isRoot: false },
      // D (str3): Eb(13)=f1, F(15)=f3, G(17)=root♦ slot4
      { string: 3, relFret: 0, finger: 1, isRoot: false },
      { string: 3, relFret: 2, finger: 3, isRoot: false },
      { string: 3, relFret: 4, finger: 4, isRoot: true  },
      // G (str2): A(14)=f2, Bb(15)=f3
      { string: 2, relFret: 1, finger: 2, isRoot: false },
      { string: 2, relFret: 2, finger: 3, isRoot: false },
      // B (str1): C(13)=f1, D(15)=f3, Eb(16)=f4
      { string: 1, relFret: 0, finger: 1, isRoot: false },
      { string: 1, relFret: 2, finger: 3, isRoot: false },
      { string: 1, relFret: 3, finger: 4, isRoot: false },
      // e (str0): F(13)=f1, G(15)=root♦f3
      { string: 0, relFret: 0, finger: 1, isRoot: false },
      { string: 0, relFret: 2, finger: 3, isRoot: true  },
    ],
  },
] as const;

// ── G Major Pentatonic 5-position patterns ────────────────────────────────────
//
// G Major Pentatonic: G A B D E  (intervals 0,2,4,7,9)
// 2 notes per string — matching standard method book box shapes.
//
// G Major Pent notes on each string:
//   str5(low E): G=3,A=5,B=7,D=10,E=12
//   str4(A):     B=2,D=5,E=7,G=10,A=12
//   str3(D):     E=2,G=5,A=7,B=9,D=12
//   str2(G):     A=2,B=4,D=7,E=9,G=12
//   str1(B):     D=3,E=5,G=8,A=10,B=12
//   str0(e):     G=3,A=5,B=7,D=10,E=12

export const MAJOR_PENT_PATTERNS: readonly BoxPattern[] = [
  // Pattern I  (window frets 2–6, root on str5 and str3)
  {
    baseFretForG: 2,
    dots: [
      // low E (str5): G(3)=root♦ slot1, A(5) slot3
      { string: 5, relFret: 1, finger: 2, isRoot: true  },
      { string: 5, relFret: 3, finger: 4, isRoot: false },
      // A (str4): B(2) slot0, D(5) slot3
      { string: 4, relFret: 0, finger: 1, isRoot: false },
      { string: 4, relFret: 3, finger: 4, isRoot: false },
      // D (str3): E(2) slot0, G(5)=root♦ slot3
      { string: 3, relFret: 0, finger: 1, isRoot: false },
      { string: 3, relFret: 3, finger: 4, isRoot: true  },
      // G (str2): A(2) slot0, B(4) slot2
      { string: 2, relFret: 0, finger: 1, isRoot: false },
      { string: 2, relFret: 2, finger: 3, isRoot: false },
      // B (str1): D(3) slot1, E(5) slot3
      { string: 1, relFret: 1, finger: 2, isRoot: false },
      { string: 1, relFret: 3, finger: 4, isRoot: false },
      // e (str0): G(3)=root♦ slot1, A(5) slot3
      { string: 0, relFret: 1, finger: 2, isRoot: true  },
      { string: 0, relFret: 3, finger: 4, isRoot: false },
    ],
  },

  // Pattern II  (window frets 4–8)
  {
    baseFretForG: 4,
    dots: [
      // low E (str5): A(5) slot1, B(7) slot3
      { string: 5, relFret: 1, finger: 2, isRoot: false },
      { string: 5, relFret: 3, finger: 4, isRoot: false },
      // A (str4): D(5) slot1, E(7) slot3
      { string: 4, relFret: 1, finger: 2, isRoot: false },
      { string: 4, relFret: 3, finger: 4, isRoot: false },
      // D (str3): G(5)=root♦ slot1, A(7) slot3
      { string: 3, relFret: 1, finger: 2, isRoot: true  },
      { string: 3, relFret: 3, finger: 4, isRoot: false },
      // G (str2): B(4) slot0, D(7) slot3
      { string: 2, relFret: 0, finger: 1, isRoot: false },
      { string: 2, relFret: 3, finger: 4, isRoot: false },
      // B (str1): E(5) slot1, G(8)=root♦ slot4
      { string: 1, relFret: 1, finger: 2, isRoot: false },
      { string: 1, relFret: 4, finger: 4, isRoot: true  },
      // e (str0): A(5) slot1, B(7) slot3
      { string: 0, relFret: 1, finger: 2, isRoot: false },
      { string: 0, relFret: 3, finger: 4, isRoot: false },
    ],
  },

  // Pattern III  (window frets 7–11)
  {
    baseFretForG: 7,
    dots: [
      // low E (str5): B(7) slot0, D(10) slot3
      { string: 5, relFret: 0, finger: 1, isRoot: false },
      { string: 5, relFret: 3, finger: 4, isRoot: false },
      // A (str4): E(7) slot0, G(10)=root♦ slot3
      { string: 4, relFret: 0, finger: 1, isRoot: false },
      { string: 4, relFret: 3, finger: 4, isRoot: true  },
      // D (str3): A(7) slot0, B(9) slot2
      { string: 3, relFret: 0, finger: 1, isRoot: false },
      { string: 3, relFret: 2, finger: 3, isRoot: false },
      // G (str2): D(7) slot0, E(9) slot2
      { string: 2, relFret: 0, finger: 1, isRoot: false },
      { string: 2, relFret: 2, finger: 3, isRoot: false },
      // B (str1): G(8)=root♦ slot1, A(10) slot3
      { string: 1, relFret: 1, finger: 2, isRoot: true  },
      { string: 1, relFret: 3, finger: 4, isRoot: false },
      // e (str0): B(7) slot0, D(10) slot3
      { string: 0, relFret: 0, finger: 1, isRoot: false },
      { string: 0, relFret: 3, finger: 4, isRoot: false },
    ],
  },

  // Pattern IV  (window frets 9–13)
  {
    baseFretForG: 9,
    dots: [
      // low E (str5): D(10) slot1, E(12) slot3
      { string: 5, relFret: 1, finger: 2, isRoot: false },
      { string: 5, relFret: 3, finger: 4, isRoot: false },
      // A (str4): G(10)=root♦ slot1, A(12) slot3
      { string: 4, relFret: 1, finger: 2, isRoot: true  },
      { string: 4, relFret: 3, finger: 4, isRoot: false },
      // D (str3): B(9) slot0, D(12) slot3
      { string: 3, relFret: 0, finger: 1, isRoot: false },
      { string: 3, relFret: 3, finger: 4, isRoot: false },
      // G (str2): E(9) slot0, G(12)=root♦ slot3
      { string: 2, relFret: 0, finger: 1, isRoot: false },
      { string: 2, relFret: 3, finger: 4, isRoot: true  },
      // B (str1): A(10) slot1, B(12) slot3
      { string: 1, relFret: 1, finger: 2, isRoot: false },
      { string: 1, relFret: 3, finger: 4, isRoot: false },
      // e (str0): D(10) slot1, E(12) slot3
      { string: 0, relFret: 1, finger: 2, isRoot: false },
      { string: 0, relFret: 3, finger: 4, isRoot: false },
    ],
  },

  // Pattern V  (window frets 12–16)
  {
    baseFretForG: 12,
    dots: [
      // low E (str5): E(12) slot0, G(15)=root♦ slot3
      { string: 5, relFret: 0, finger: 1, isRoot: false },
      { string: 5, relFret: 3, finger: 4, isRoot: true  },
      // A (str4): A(12) slot0, B(14) slot2
      { string: 4, relFret: 0, finger: 1, isRoot: false },
      { string: 4, relFret: 2, finger: 3, isRoot: false },
      // D (str3): D(12) slot0, E(14) slot2
      { string: 3, relFret: 0, finger: 1, isRoot: false },
      { string: 3, relFret: 2, finger: 3, isRoot: false },
      // G (str2): G(12)=root♦ slot0, A(14) slot2
      { string: 2, relFret: 0, finger: 1, isRoot: true  },
      { string: 2, relFret: 2, finger: 3, isRoot: false },
      // B (str1): B(12) slot0, D(15) slot3
      { string: 1, relFret: 0, finger: 1, isRoot: false },
      { string: 1, relFret: 3, finger: 4, isRoot: false },
      // e (str0): E(12) slot0, G(15)=root♦ slot3
      { string: 0, relFret: 0, finger: 1, isRoot: false },
      { string: 0, relFret: 3, finger: 4, isRoot: true  },
    ],
  },
] as const;

// ── G Minor Pentatonic 5-position patterns ────────────────────────────────────
//
// G Minor Pentatonic: G Bb C D F  (intervals 0,3,5,7,10)
// 2 notes per string — the classic blues/rock box shapes.
//
// G Minor Pent notes on each string:
//   str5(low E): G=3,Bb=6,C=8,D=10,F=1(13)
//   str4(A):     C=3,D=5,F=8,G=10,Bb=1(13)
//   str3(D):     F=3,G=5,Bb=8,C=10,D=12
//   str2(G):     Bb=3,C=5,D=7,F=10,G=0/12
//   str1(B):     D=3,F=6,G=8,Bb=11,C=1(13)
//   str0(e):     G=3,Bb=6,C=8,D=10,F=1(13)

export const MINOR_PENT_PATTERNS: readonly BoxPattern[] = [
  // Pattern I  (window frets 3–7 — "Box 1", the iconic minor pent shape)
  {
    baseFretForG: 3,
    dots: [
      // low E (str5): G(3)=root♦ slot0, Bb(6) slot3
      { string: 5, relFret: 0, finger: 1, isRoot: true  },
      { string: 5, relFret: 3, finger: 4, isRoot: false },
      // A (str4): C(3) slot0, D(5) slot2
      { string: 4, relFret: 0, finger: 1, isRoot: false },
      { string: 4, relFret: 2, finger: 3, isRoot: false },
      // D (str3): F(3) slot0, G(5)=root♦ slot2
      { string: 3, relFret: 0, finger: 1, isRoot: false },
      { string: 3, relFret: 2, finger: 3, isRoot: true  },
      // G (str2): Bb(3) slot0, C(5) slot2
      { string: 2, relFret: 0, finger: 1, isRoot: false },
      { string: 2, relFret: 2, finger: 3, isRoot: false },
      // B (str1): D(3) slot0, F(6) slot3
      { string: 1, relFret: 0, finger: 1, isRoot: false },
      { string: 1, relFret: 3, finger: 4, isRoot: false },
      // e (str0): G(3)=root♦ slot0, Bb(6) slot3
      { string: 0, relFret: 0, finger: 1, isRoot: true  },
      { string: 0, relFret: 3, finger: 4, isRoot: false },
    ],
  },

  // Pattern II  (window frets 5–9)
  {
    baseFretForG: 5,
    dots: [
      // low E (str5): Bb(6) slot1, C(8) slot3
      { string: 5, relFret: 1, finger: 2, isRoot: false },
      { string: 5, relFret: 3, finger: 4, isRoot: false },
      // A (str4): D(5) slot0, F(8) slot3
      { string: 4, relFret: 0, finger: 1, isRoot: false },
      { string: 4, relFret: 3, finger: 4, isRoot: false },
      // D (str3): G(5)=root♦ slot0, Bb(8) slot3
      { string: 3, relFret: 0, finger: 1, isRoot: true  },
      { string: 3, relFret: 3, finger: 4, isRoot: false },
      // G (str2): C(5) slot0, D(7) slot2
      { string: 2, relFret: 0, finger: 1, isRoot: false },
      { string: 2, relFret: 2, finger: 3, isRoot: false },
      // B (str1): F(6) slot1, G(8)=root♦ slot3
      { string: 1, relFret: 1, finger: 2, isRoot: false },
      { string: 1, relFret: 3, finger: 4, isRoot: true  },
      // e (str0): Bb(6) slot1, C(8) slot3
      { string: 0, relFret: 1, finger: 2, isRoot: false },
      { string: 0, relFret: 3, finger: 4, isRoot: false },
    ],
  },

  // Pattern III  (window frets 8–12)
  {
    baseFretForG: 8,
    dots: [
      // low E (str5): C(8) slot0, D(10) slot2
      { string: 5, relFret: 0, finger: 1, isRoot: false },
      { string: 5, relFret: 2, finger: 3, isRoot: false },
      // A (str4): F(8) slot0, G(10)=root♦ slot2
      { string: 4, relFret: 0, finger: 1, isRoot: false },
      { string: 4, relFret: 2, finger: 3, isRoot: true  },
      // D (str3): Bb(8) slot0, C(10) slot2
      { string: 3, relFret: 0, finger: 1, isRoot: false },
      { string: 3, relFret: 2, finger: 3, isRoot: false },
      // G (str2): F(10) slot2, G(12)=root♦ slot4
      { string: 2, relFret: 2, finger: 3, isRoot: false },
      { string: 2, relFret: 4, finger: 4, isRoot: true  },
      // B (str1): G(8)=root♦ slot0, Bb(11) slot3
      { string: 1, relFret: 0, finger: 1, isRoot: true  },
      { string: 1, relFret: 3, finger: 4, isRoot: false },
      // e (str0): C(8) slot0, D(10) slot2
      { string: 0, relFret: 0, finger: 1, isRoot: false },
      { string: 0, relFret: 2, finger: 3, isRoot: false },
    ],
  },

  // Pattern IV  (window frets 10–14)
  {
    baseFretForG: 10,
    dots: [
      // low E (str5): D(10) slot0, F(13) slot3
      { string: 5, relFret: 0, finger: 1, isRoot: false },
      { string: 5, relFret: 3, finger: 4, isRoot: false },
      // A (str4): G(10)=root♦ slot0, Bb(13) slot3
      { string: 4, relFret: 0, finger: 1, isRoot: true  },
      { string: 4, relFret: 3, finger: 4, isRoot: false },
      // D (str3): C(10) slot0, D(12) slot2
      { string: 3, relFret: 0, finger: 1, isRoot: false },
      { string: 3, relFret: 2, finger: 3, isRoot: false },
      // G (str2): F(10) slot0, G(12)=root♦ slot2
      { string: 2, relFret: 0, finger: 1, isRoot: false },
      { string: 2, relFret: 2, finger: 3, isRoot: true  },
      // B (str1): Bb(11) slot1, C(13) slot3
      { string: 1, relFret: 1, finger: 2, isRoot: false },
      { string: 1, relFret: 3, finger: 4, isRoot: false },
      // e (str0): D(10) slot0, F(13) slot3
      { string: 0, relFret: 0, finger: 1, isRoot: false },
      { string: 0, relFret: 3, finger: 4, isRoot: false },
    ],
  },

  // Pattern V  (window frets 13–17, connects back to Pattern I an octave up)
  {
    baseFretForG: 13,
    dots: [
      // low E (str5): F(13) slot0, G(15)=root♦ slot2
      { string: 5, relFret: 0, finger: 1, isRoot: false },
      { string: 5, relFret: 2, finger: 3, isRoot: true  },
      // A (str4): Bb(13) slot0, C(15) slot2
      { string: 4, relFret: 0, finger: 1, isRoot: false },
      { string: 4, relFret: 2, finger: 3, isRoot: false },
      // D (str3): F(15) slot2, G(17)=root♦ slot4
      { string: 3, relFret: 2, finger: 3, isRoot: false },
      { string: 3, relFret: 4, finger: 4, isRoot: true  },
      // G (str2): Bb(15) slot2, C(17) slot4
      { string: 2, relFret: 2, finger: 3, isRoot: false },
      { string: 2, relFret: 4, finger: 4, isRoot: false },
      // B (str1): C(13) slot0, D(15) slot2
      { string: 1, relFret: 0, finger: 1, isRoot: false },
      { string: 1, relFret: 2, finger: 3, isRoot: false },
      // e (str0): F(13) slot0, G(15)=root♦ slot2
      { string: 0, relFret: 0, finger: 1, isRoot: false },
      { string: 0, relFret: 2, finger: 3, isRoot: true  },
    ],
  },
] as const;

// ── Transposition ─────────────────────────────────────────────────────────────

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
  E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
  Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

const G_SEMITONE = 7;

export interface ResolvedPattern {
  label: string;
  baseFret: number;
  dots: Array<{
    string: number;
    fret: number;
    finger: number;
    isRoot: boolean;
    isOpenString: boolean;
  }>;
}

/** Generic transposition + resolver for any BoxPattern set */
function resolvePatternSet(
  patterns: readonly BoxPattern[],
  rootNote: string,
): ResolvedPattern[] {
  const rootSem = NOTE_TO_SEMITONE[rootNote] ?? 0;
  const shift = (rootSem - G_SEMITONE + 12) % 12;

  return patterns.map((pattern, idx) => {
    let baseFret = pattern.baseFretForG + shift;
    // Normalise into playable range 1–17
    while (baseFret > 17) baseFret -= 12;
    while (baseFret < 1)  baseFret += 12;
    // Special-case: if the G version uses fret 0 (open), keep at 0
    if (pattern.baseFretForG === 0) baseFret = 0;

    const dots = (pattern.dots as PatternDot[]).map((d) => {
      const absFret = baseFret + d.relFret;
      return {
        string: d.string,
        fret: absFret,
        finger: d.finger,
        isRoot: d.isRoot,
        isOpenString: absFret === 0,
      };
    });

    return { label: patternLabel(idx, baseFret), baseFret, dots };
  });
}

export function getMajorScalePatterns(rootNote: string): ResolvedPattern[] {
  return resolvePatternSet(MAJOR_PATTERNS, rootNote);
}

export function getMinorScalePatterns(rootNote: string): ResolvedPattern[] {
  return resolvePatternSet(MINOR_PATTERNS, rootNote);
}

export function getMajorPentPatterns(rootNote: string): ResolvedPattern[] {
  return resolvePatternSet(MAJOR_PENT_PATTERNS, rootNote);
}

export function getMinorPentPatterns(rootNote: string): ResolvedPattern[] {
  return resolvePatternSet(MINOR_PENT_PATTERNS, rootNote);
}
