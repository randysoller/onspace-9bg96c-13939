/**
 * ScaleTabNotation
 *
 * Custom SVG guitar tab staff renderer for CAGED scale box patterns.
 *
 * Note ordering: natural scale run as a guitarist would play it —
 *   low E string (5) first → high e string (0) last; within each string, ascending fret.
 *
 * All notes from the CAGED box are included (no single-octave limit).
 *
 * String mapping:
 *   Our convention: 0 = high e (SVG top row), 5 = low E (SVG bottom row)
 *   Tab staff:      top line = high e, bottom line = low E  (standard notation)
 *   → string 0 renders on the TOP line, string 5 on the BOTTOM line.
 *
 * Fret numbers are rendered on their respective string line.
 * The staff is horizontally scrollable when notes exceed the container width.
 */

interface TabDot {
  /** 0 = high e, 5 = low E (matches HorizontalScaleFretboard convention) */
  string: number;
  /** Absolute fret number (0 = open string) */
  fret: number;
  isOpenString?: boolean;
}

interface ScaleTabNotationProps {
  dots: TabDot[];
}

// ── Layout constants ───────────────────────────────────────────────────────────
const N_STRINGS  = 6;
const STR_GAP    = 14;    // px between adjacent string lines
const NOTE_W     = 36;    // px per note column
const LEFT_PAD   = 40;    // room for TAB label + opening bar
const TOP_PAD    = 14;    // above top string
const BOT_PAD    = 14;    // below bottom string
const TAIL_PAD   = 14;    // right of last note

const TAB_H = TOP_PAD + (N_STRINGS - 1) * STR_GAP + BOT_PAD; // 14 + 70 + 14 = 98

const STR_COLOR  = '#52525b'; // zinc-600
const BAR_COLOR  = '#71717a'; // zinc-500
const NUM_COLOR  = '#e4e4e7'; // zinc-200 — high contrast for readability
const TAB_LABEL  = '#a1a1aa'; // zinc-400
const BG_COLOR   = '#09090b'; // zinc-950 — erase string line behind fret number

// ── Coordinate helpers ─────────────────────────────────────────────────────────

/** y-centre of a string line (0 = high e = top, 5 = low E = bottom) */
function strY(s: number): number {
  return TOP_PAD + s * STR_GAP;
}

/** x-centre of the i-th note column */
function noteX(i: number): number {
  return LEFT_PAD + i * NOTE_W + NOTE_W / 2;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ScaleTabNotation({ dots }: ScaleTabNotationProps) {
  // Natural scale run order: low E first (string 5 → 0), ascending fret within string
  const sorted = [...dots].sort((a, b) => {
    if (a.string !== b.string) return b.string - a.string; // string 5 before string 0
    return a.fret - b.fret;
  });

  const totalW = LEFT_PAD + sorted.length * NOTE_W + TAIL_PAD;

  return (
    <div
      className="w-full overflow-x-auto rounded"
      style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
    >
      <svg
        width={totalW}
        height={TAB_H}
        viewBox={`0 0 ${totalW} ${TAB_H}`}
        aria-label="Guitar tab notation for scale pattern"
        style={{ display: 'block', minWidth: totalW }}
      >
        {/* ── TAB label — vertical letters on the left ─────────────────── */}
        {(['T', 'A', 'B'] as const).map((letter, li) => (
          <text
            key={letter}
            x={8}
            y={strY(li + 1) + 4}
            fontSize={11}
            fontWeight={800}
            fill={TAB_LABEL}
            fontFamily="ui-monospace, monospace"
            textAnchor="middle"
          >
            {letter}
          </text>
        ))}

        {/* ── String lines ─────────────────────────────────────────────── */}
        {Array.from({ length: N_STRINGS }).map((_, s) => (
          <line
            key={`sl-${s}`}
            x1={LEFT_PAD - 6}
            y1={strY(s)}
            x2={totalW - TAIL_PAD / 2}
            y2={strY(s)}
            stroke={STR_COLOR}
            strokeWidth={s === 5 ? 1.4 : 0.9}  // thicker low E line
          />
        ))}

        {/* ── Opening bar line ─────────────────────────────────────────── */}
        <line
          x1={LEFT_PAD - 6}
          y1={strY(0)}
          x2={LEFT_PAD - 6}
          y2={strY(N_STRINGS - 1)}
          stroke={BAR_COLOR}
          strokeWidth={1.5}
        />

        {/* ── Fret numbers on string lines ─────────────────────────────── */}
        {sorted.map((dot, i) => {
          const x   = noteX(i);
          const y   = strY(dot.string);
          const lbl = String(dot.fret);
          // Wider bg rect for 2-digit fret numbers
          const bgW = lbl.length >= 2 ? 20 : 13;

          return (
            <g key={i}>
              {/* Erase string line behind the number for clean readability */}
              <rect
                x={x - bgW / 2}
                y={y - 8}
                width={bgW}
                height={14}
                fill={BG_COLOR}
              />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontSize={11}
                fontWeight={700}
                fill={NUM_COLOR}
                fontFamily="ui-monospace, 'DM Mono', monospace"
                style={{ fontFeatureSettings: '"tnum"' }}
              >
                {lbl}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
