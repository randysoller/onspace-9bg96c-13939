/**
 * ScaleTabNotation — Sequential Guitar Tab
 *
 * Renders guitar tablature as a TIME-SEQUENCE staff (not chord stacking):
 *   • Each note occupies a unique horizontal column (time position)
 *   • Natural scale run order: low E string ascending → A → D → G → B → high e
 *   • Split into TWO staves stacked vertically so ALL notes fit without scrolling
 *   • White background, black monospace text — matches ChordDetailModal style
 *
 * String convention (input, matches HorizontalScaleFretboard):
 *   0 = high e    5 = low E
 *
 * Visual convention (standard guitar tab — top string = high e):
 *   Row 0 (top)    = high e  (input string 0)
 *   Row 5 (bottom) = low E   (input string 5)
 */

interface TabDot {
  /** 0 = high e, 5 = low E */
  string: number;
  fret: number;
  isOpenString?: boolean;
}

interface ScaleTabNotationProps {
  dots: TabDot[];
}

// ── Display order: top of tab (high e, index 0) → bottom (low E, index 5) ────
const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'] as const;

// ── SVG layout constants ───────────────────────────────────────────────────────
const STRING_H   = 11;   // px between string lines (compacted from 14)
const LABEL_W    = 22;   // px for "e/B/G/D/A/E" label column
const NOTE_W     = 22;   // px per time-column (note slot)
const DASH_CHAR  = '–';  // en-dash for string lines

// Derived
const STAFF_H    = STRING_H * 5;    // total height between top and bottom string (5 gaps × 11 = 55)
const SVG_PAD_T  = 6;               // top padding inside staff SVG
const SVG_PAD_B  = 10;              // bottom padding
const INNER_H    = SVG_PAD_T + STAFF_H + SVG_PAD_B; // height of one staff SVG (6+55+10=71)

// ── Build the sequential note list ────────────────────────────────────────────
//
// Natural guitar scale run order:
//   1. Sort by string DESCENDING (5=low E first → 0=high e last)
//   2. Within each string, sort by fret ASCENDING
//
function buildNoteSequence(dots: TabDot[]): Array<{ string: number; fret: number }> {
  const byString: Map<number, number[]> = new Map();
  for (let s = 0; s < 6; s++) byString.set(s, []);

  for (const dot of dots) {
    if (dot.string >= 0 && dot.string <= 5) {
      byString.get(dot.string)!.push(dot.fret);
    }
  }

  // Sort each string's frets ascending
  for (const [, frets] of byString) {
    frets.sort((a, b) => a - b);
  }

  // Flatten: string 5 (low E) first → string 0 (high e) last
  const sequence: Array<{ string: number; fret: number }> = [];
  for (let s = 5; s >= 0; s--) {
    for (const fret of byString.get(s) ?? []) {
      sequence.push({ string: s, fret });
    }
  }
  return sequence;
}

// ── Single staff SVG ──────────────────────────────────────────────────────────
//
// Renders one staff containing `notes` placed at sequential column positions.
// `staffIndex` is 0 or 1 (used only for the "Tab" label placement on last staff).

interface StaffProps {
  notes: Array<{ string: number; fret: number }>;
  isLast: boolean;
}

function TabStaff({ notes, isLast }: StaffProps) {
  const numCols    = notes.length;
  const svgW       = LABEL_W + numCols * NOTE_W + NOTE_W; // extra NOTE_W trailing dash room
  const svgH       = INNER_H;

  // y centre for each string row — standard tab convention:
  //   s=0 (high e) → TOP (smallest y),  s=5 (low E) → BOTTOM (largest y)
  const strY = (s: number) => SVG_PAD_T + s * STRING_H;

  // Map each note to its column: note i → x = LABEL_W + i * NOTE_W + NOTE_W/2
  const noteColX = (col: number) => LABEL_W + col * NOTE_W + NOTE_W / 2;

  // Which columns have a note on each string (for dash-vs-number rendering)
  const colsByString: Map<number, Set<number>> = new Map();
  for (let s = 0; s < 6; s++) colsByString.set(s, new Set());
  notes.forEach(({ string, fret: _f }, col) => {
    colsByString.get(string)!.add(col);
  });

  // Build per-column note lookup: col → { string, fret }
  const colNote: Map<number, { string: number; fret: number }> = new Map();
  notes.forEach((n, col) => colNote.set(col, n));

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width="100%"
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* ── String name labels (left column) ── */}
      {STRING_NAMES.map((name, idx) => {
        // idx 0 = high e (top), idx 5 = low E (bottom)
        // string number = idx (our convention: 0=high e, 5=low E)
        const s = idx;
        const y = strY(s);
        return (
          <text
            key={`sn-${s}`}
            x={LABEL_W - 4}
            y={y}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={10}
            fontWeight={700}
            fill="#27272a"
            fontFamily="ui-monospace, 'Courier New', monospace"
          >
            {name}
          </text>
        );
      })}

      {/* ── String lines + fret numbers ── */}
      {Array.from({ length: 6 }, (_, idx) => {
        const s = idx; // 0 = high e, 5 = low E
        const y = strY(s);
        const lineXStart = LABEL_W;
        const lineXEnd   = LABEL_W + numCols * NOTE_W + NOTE_W * 0.6;

        return (
          <g key={`str-${s}`}>
            {/* Continuous string line */}
            <line
              x1={lineXStart}
              y1={y}
              x2={lineXEnd}
              y2={y}
              stroke="#a1a1aa"
              strokeWidth={0.75}
            />

            {/* Fret numbers — only at columns where this string has a note */}
            {notes.map(({ string, fret }, col) => {
              if (string !== s) return null;
              const cx = noteColX(col);
              const label = String(fret);
              // White knock-out rect behind the number so it sits cleanly on the string line
              const rectW = fret >= 10 ? 14 : 10;
              return (
                <g key={`note-${col}`}>
                  <rect
                    x={cx - rectW / 2}
                    y={y - 7}
                    width={rectW}
                    height={15}
                    fill="white"
                  />
                  <text
                    x={cx}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={12}
                    fontWeight={700}
                    fill="#18181b"
                    fontFamily="ui-monospace, 'Courier New', monospace"
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* ── "Tab" label below last staff only ── */}
      {isLast && (
        <text
          x={svgW / 2}
          y={svgH - 1}
          textAnchor="middle"
          dominantBaseline="auto"
          fontSize={11}
          fontWeight={700}
          fill="#18181b"
          fontFamily="ui-monospace, 'Courier New', monospace"
        >
          Tab
        </text>
      )}
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ScaleTabNotation({ dots }: ScaleTabNotationProps) {
  const sequence = buildNoteSequence(dots);

  if (sequence.length === 0) return null;

  // Split into two halves so both staves fit without scrolling
  const half      = Math.ceil(sequence.length / 2);
  const staffOne  = sequence.slice(0, half);
  const staffTwo  = sequence.slice(half);

  return (
    <div
      className="bg-white rounded-lg shadow-lg w-full overflow-hidden"
      style={{ paddingTop: 6, paddingBottom: 4, paddingLeft: 6, paddingRight: 6 }}
    >
      {/* Staff 1 */}
      <TabStaff notes={staffOne} isLast={staffTwo.length === 0} />

      {/* Staff 2 — separator line between staves */}
      {staffTwo.length > 0 && (
        <>
          <div style={{ height: 14 }} />
          <TabStaff notes={staffTwo} isLast={true} />
        </>
      )}
    </div>
  );
}
