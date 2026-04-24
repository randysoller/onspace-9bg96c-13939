/**
 * scalePatterns.ts
 *
 * Hard-coded 5-position CAGED box patterns for the Major scale (from the
 * uploaded G-Major pattern sheet).  Each pattern stores:
 *   - baseFretForG  → the lowest fret of the 5-fret window when root = G
 *   - dots[]        → per-note data with relative fret offset (0–4), string
 *                     index (0 = high-e top, 5 = low-E bottom), finger number,
 *                     and whether the dot is a root note
 *
 * Transposition to any other key works by shifting baseFretForG by the
 * semitone difference between G and the target root, then wrapping into
 * a playable range (1–12).
 *
 * All other scales fall back to the algorithmic box-position generator in
 * ScaleDetailModal.tsx.
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

// ── G Major CAGED 5-position patterns ───────────────────────────────────────
//
// String index mapping (mirrors HorizontalScaleFretboard):
//   0 = high e   (thinnest, SVG top row)
//   1 = B
//   2 = G
//   3 = D
//   4 = A
//   5 = low E    (thickest, SVG bottom row)
//
// relFret 0 = lowest visible fret of the window (= baseFretForG for G)
// G root lives at: E-string fret 3, D-string fret 5, e-string fret 3
// Pattern windows start one fret below the first playable note so the
// entire 4-note span fits inside slots 0–4.

export const MAJOR_PATTERNS: readonly BoxPattern[] = [
  // ── Pattern I  (G-shape, window frets 2–6 for G major) ──────────────────
  {
    baseFretForG: 2,
    dots: [
      // high e (str 0): fret2=f1, fret3=root♦, fret5=f4
      { string: 0, relFret: 0, finger: 1, isRoot: false },
      { string: 0, relFret: 1, finger: 2, isRoot: true  },
      { string: 0, relFret: 3, finger: 4, isRoot: false },
      // B (str 1): fret3=f2, fret5=f4
      { string: 1, relFret: 1, finger: 2, isRoot: false },
      { string: 1, relFret: 3, finger: 4, isRoot: false },
      // G (str 2): fret2=f1, fret4=f3, fret5=f4
      { string: 2, relFret: 0, finger: 1, isRoot: false },
      { string: 2, relFret: 2, finger: 3, isRoot: false },
      { string: 2, relFret: 3, finger: 4, isRoot: false },
      // D (str 3): fret2=f1, fret4=f3, fret5=root♦
      { string: 3, relFret: 0, finger: 1, isRoot: false },
      { string: 3, relFret: 2, finger: 3, isRoot: false },
      { string: 3, relFret: 3, finger: 4, isRoot: true  },
      // A (str 4): fret2=f1, fret3=f2, fret5=f4
      { string: 4, relFret: 0, finger: 1, isRoot: false },
      { string: 4, relFret: 1, finger: 2, isRoot: false },
      { string: 4, relFret: 3, finger: 4, isRoot: false },
      // low E (str 5): fret3=root♦, fret5=f4
      { string: 5, relFret: 1, finger: 2, isRoot: true  },
      { string: 5, relFret: 3, finger: 4, isRoot: false },
    ],
  },

  // ── Pattern II  (E-shape, window frets 5–9 for G major) ─────────────────
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
      // G (str 2): fret4=f1, fret5=f2, fret7=f4
      { string: 2, relFret: 0, finger: 1, isRoot: false },   // fret 5
      { string: 2, relFret: 1, finger: 2, isRoot: false },
      { string: 2, relFret: 3, finger: 4, isRoot: true  },   // fret 8 → root♦
      // D (str 3): fret5=f1, fret7=f3, fret9=root♦  -- shifted: use fret 5 window
      { string: 3, relFret: 0, finger: 1, isRoot: false },
      { string: 3, relFret: 2, finger: 3, isRoot: false },
      { string: 3, relFret: 3, finger: 4, isRoot: false },
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

  // ── Pattern III  (D-shape, window frets 7–11 for G major) ───────────────
  {
    baseFretForG: 7,
    dots: [
      // high e (str 0): fret7=f1, fret8=f2, fret10=f4
      { string: 0, relFret: 0, finger: 1, isRoot: false },
      { string: 0, relFret: 1, finger: 2, isRoot: false },
      { string: 0, relFret: 3, finger: 4, isRoot: false },
      // B (str 1): fret8=f1, fret10=f3
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

  // ── Pattern IV  (C-shape, window frets 9–13 for G major) ────────────────
  {
    baseFretForG: 9,
    dots: [
      // high e (str 0): fret10=f1, fret12=root♦
      { string: 0, relFret: 1, finger: 1, isRoot: false },
      { string: 0, relFret: 3, finger: 3, isRoot: false },
      // B (str 1): fret10=f1, fret12=f3, fret13=f4
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
      // low E (str 5): fret10=f1, fret12=f3
      { string: 5, relFret: 1, finger: 2, isRoot: false },
      { string: 5, relFret: 3, finger: 4, isRoot: false },
    ],
  },

  // ── Pattern V  (A-shape, window frets 12–16 → wrap to 0–4 for G major) ──
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
      // G (str 2): fret12=root♦, fret14=f4
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

// ── Transposition ────────────────────────────────────────────────────────────

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
  E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
  Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

const G_SEMITONE = 7;

/**
 * Returns the 5 box patterns for the Major scale transposed to the given root.
 * Each returned pattern includes the absolute starting fret and dots with
 * absolute fret numbers and all display data needed by the fretboard renderer.
 */
export interface ResolvedPattern {
  label: string;
  baseFret: number;
  dots: Array<{
    string: number;
    fret: number;          // absolute fret number
    finger: number;
    isRoot: boolean;
    isOpenString: boolean;
  }>;
}

export function getMajorScalePatterns(rootNote: string): ResolvedPattern[] {
  const rootSem = NOTE_TO_SEMITONE[rootNote] ?? 0;
  const shift = (rootSem - G_SEMITONE + 12) % 12;

  return MAJOR_PATTERNS.map((pattern, idx) => {
    let baseFret = pattern.baseFretForG + shift;
    // Normalise into a reasonable playing range (1–12)
    if (baseFret > 12) baseFret -= 12;
    if (baseFret < 1) baseFret += 12;
    // Special-case open position: if baseFret ends up at 12 and G pattern
    // base was 0, keep it at 0 for open string display.
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

    const fretLabel = baseFret === 0 ? 'Open' : `Fret ${baseFret}`;
    return {
      label: `Pattern ${['I', 'II', 'III', 'IV', 'V'][idx]} — ${fretLabel}`,
      baseFret,
      dots,
    };
  });
}
