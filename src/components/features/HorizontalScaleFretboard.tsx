/**
 * HorizontalScaleFretboard — compact horizontal SVG fretboard diagram.
 *
 * Layout:
 *   • 6 strings run horizontally (String 1 / high-e at top, String 6 / low-E at bottom)
 *   • Strings have increasing stroke widths (thin at top → thick at bottom)
 *   • 5 fret columns are shown per position window
 *   • Nut (thick left border) is rendered when startFret === 0
 *   • Dots carry a short text label (finger number, note name, or degree)
 *   • Root note dots are rendered in cyan; scale note dots in amber
 */

interface FretDot {
  /** 0 = String 6 (low E, bottom), 5 = String 1 (high e, top) in guitar terms.
   *  In the SVG, stringIndex 0 renders at the TOP (high e) and 5 at the BOTTOM (low E)
   *  so the visual matches how a guitarist looks down at the fretboard. */
  stringIndex: number; // 0 = high e, 5 = low E (SVG top to bottom)
  fret: number;        // absolute fret number on the neck
  label: string;       // text shown inside the dot
  isRoot: boolean;
}

interface HorizontalScaleFretboardProps {
  dots: FretDot[];
  startFret: number;  // first fret of the visible window (e.g. 5 → shows frets 5–9)
  positionLabel?: string;
}

// Visual constants
const SVG_WIDTH = 320;
const SVG_HEIGHT = 100;
const LEFT_PAD = 34;   // space for fret number label on left
const RIGHT_PAD = 8;
const TOP_PAD = 12;
const BOTTOM_PAD = 12;

const NUM_STRINGS = 6;
const NUM_FRETS = 5;   // 5 fret slots visible (startFret … startFret+4)

const FRET_AREA_WIDTH = SVG_WIDTH - LEFT_PAD - RIGHT_PAD;
const FRET_AREA_HEIGHT = SVG_HEIGHT - TOP_PAD - BOTTOM_PAD;

// Fret column width
const FRET_W = FRET_AREA_WIDTH / NUM_FRETS;
// String row height
const STR_H = FRET_AREA_HEIGHT / (NUM_STRINGS - 1);

// String stroke widths — index 0 = high e (top, thin), index 5 = low E (bottom, thick)
const STRING_WIDTHS = [0.8, 1.1, 1.4, 1.8, 2.3, 3.0];

// Dot radius
const DOT_R = 11;

export default function HorizontalScaleFretboard({
  dots,
  startFret,
  positionLabel,
}: HorizontalScaleFretboardProps) {
  // x coordinate of fret column (center of the slot between wire i and wire i+1)
  const fretX = (fretOffset: number) =>
    LEFT_PAD + fretOffset * FRET_W + FRET_W / 2;

  // y coordinate for a string (0 = high e / top, 5 = low E / bottom)
  const stringY = (strIdx: number) => TOP_PAD + strIdx * STR_H;

  return (
    <div className="w-full">
      {positionLabel && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5 px-1">
          {positionLabel}
        </p>
      )}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full"
        style={{ height: SVG_HEIGHT }}
      >
        {/* ── Nut (thick left border when open position) ───────────────── */}
        {startFret === 0 && (
          <rect
            x={LEFT_PAD - 4}
            y={TOP_PAD - 4}
            width={5}
            height={FRET_AREA_HEIGHT + 8}
            fill="#d4d4d8"
            rx={1}
          />
        )}

        {/* ── Fret wires (vertical lines) ──────────────────────────────── */}
        {Array.from({ length: NUM_FRETS + 1 }).map((_, i) => (
          <line
            key={`fret-${i}`}
            x1={LEFT_PAD + i * FRET_W}
            y1={TOP_PAD - 2}
            x2={LEFT_PAD + i * FRET_W}
            y2={TOP_PAD + FRET_AREA_HEIGHT + 2}
            stroke="#52525b"
            strokeWidth={i === 0 && startFret === 0 ? 0 : 1.5}
          />
        ))}

        {/* ── String lines (horizontal lines, thin→thick top→bottom) ─── */}
        {Array.from({ length: NUM_STRINGS }).map((_, strIdx) => (
          <line
            key={`str-${strIdx}`}
            x1={LEFT_PAD}
            y1={stringY(strIdx)}
            x2={LEFT_PAD + FRET_AREA_WIDTH}
            y2={stringY(strIdx)}
            stroke="#a1a1aa"
            strokeWidth={STRING_WIDTHS[strIdx]}
          />
        ))}

        {/* ── Fret number label (left side) ────────────────────────────── */}
        <text
          x={LEFT_PAD - 8}
          y={TOP_PAD + FRET_AREA_HEIGHT / 2 + 4}
          fill="#71717a"
          fontSize={10}
          fontWeight="700"
          textAnchor="middle"
          fontFamily="monospace"
        >
          {startFret === 0 ? 'O' : startFret}
        </text>

        {/* ── Scale dots ───────────────────────────────────────────────── */}
        {dots.map((dot, i) => {
          const fretOffset = dot.fret - startFret; // 0–4
          if (fretOffset < 0 || fretOffset >= NUM_FRETS) return null;

          const cx = fretX(fretOffset);
          const cy = stringY(dot.stringIndex);
          const fill = dot.isRoot ? '#06b6d4' : '#f59e0b';
          const textFill = dot.isRoot ? '#ffffff' : '#1c1917';
          const fontSize = dot.label.length > 2 ? 7 : 9;

          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={DOT_R} fill={fill} />
              <text
                x={cx}
                y={cy + fontSize * 0.38}
                textAnchor="middle"
                fontSize={fontSize}
                fontWeight="800"
                fill={textFill}
                fontFamily="system-ui, sans-serif"
              >
                {dot.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
