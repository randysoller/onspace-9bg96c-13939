/**
 * VerticalNeckFretboard
 *
 * Renders a full 13-fret guitar neck oriented vertically:
 *   • Nut at the top
 *   • Frets run downward (fret 1 just below nut, fret 13 at bottom)
 *   • Strings run left-to-right: low E (thickest) on left → high e on right
 *
 * Visual language mirrors HorizontalScaleFretboard exactly:
 *   • White fret wires           (matching SVGChordDiagram / HorizontalScaleFretboard)
 *   • Light string lines         hsl(33 14% 72%)
 *   • Cream nut bar              hsl(36 33% 93%)
 *   • Muted brown inlay dots     hsl(30 15% 50%) @ 45% opacity
 *   • Filled cyan diamond        = root note   (no label)
 *   • Filled amber circle        = scale note  (no label)
 *   • Wrapped dots (frets that exceeded 13 and folded back by -12)
 *     are rendered at 65% opacity to signal the octave wrapping
 *
 * String index convention (matches HorizontalScaleFretboard & ScaleDetailModal):
 *   0 = high e (rightmost)   5 = low E (leftmost)
 */

export interface NeckDot {
  /** 0 = high e (right), 5 = low E (left) */
  string: number;
  /** 1–13 (already wrapped; 0 = open string, excluded from this view) */
  fret: number;
  isRoot: boolean;
  /** true when this dot originated from a fret > 13 that was folded back by -12 */
  isWrapped?: boolean;
}

interface Props {
  dots: NeckDot[];
}

// ── SVG coordinate constants ───────────────────────────────────────────────────
const L  = 28;   // left padding  — room for fret-number labels
const R  = 8;    // right padding
const T  = 38;   // top padding   — room for string-name labels + nut
const B  = 18;   // bottom padding
const FH = 40;   // fret height   — px per fret cell
const SW = 44;   // string spacing — px between adjacent string lines

const N_FRETS   = 13;
const N_STRINGS = 6;

const NECK_W = (N_STRINGS - 1) * SW;  // 5 × 44 = 220
const NECK_H = N_FRETS * FH;           // 13 × 40 = 520

const VB_W = L + NECK_W + R;           // 256
const VB_H = T + NECK_H + B;           // 576

// ── Visual constants — matching HorizontalScaleFretboard exactly ──────────────
const CYAN      = '#06b6d4';           // root diamond fill
const AMBER     = 'hsl(38 92% 50%)';  // scale circle fill  (amber-500)
const FRET_WIRE = 'white';            // matches HorizontalScaleFretboard FRET_WIRE
const STR_CLR   = 'hsl(33 14% 72%)'; // matches HorizontalScaleFretboard STR_CLR
const NUT_CLR   = 'hsl(36 33% 93%)'; // matches HorizontalScaleFretboard NUT_CLR
const INLAY_CLR = 'hsl(30 15% 50%)'; // matches HorizontalScaleFretboard INLAY_CLR
const LABEL_CLR = 'hsl(33 14% 72%)'; // fret numbers and string names

const DOT_R = 9.5;   // scale circle radius (matches HorizontalScaleFretboard)
const DIA_H = 13.1;  // diamond half-extent (DOT_R × 1.38, matches HSF)

/** SVG polygon points for a diamond centred at (cx,cy) with half-extent h */
function diamondPoints(cx: number, cy: number, h: number): string {
  return `${cx},${cy - h} ${cx + h},${cy} ${cx},${cy + h} ${cx - h},${cy}`;
}

// ── String metadata (left → right order) ──────────────────────────────────────
// STRING_WIDTHS in HorizontalScaleFretboard: [0.7, 0.9, 1.4, 1.9, 2.5, 3.1]
// top(e)→bottom(E). For vertical neck left(E)→right(e) we reverse this.
const STRING_META = [
  { s: 5, name: 'E', strokeW: 3.1 },  // low E  (leftmost, thickest)
  { s: 4, name: 'A', strokeW: 2.5 },
  { s: 3, name: 'D', strokeW: 1.9 },
  { s: 2, name: 'G', strokeW: 1.4 },
  { s: 1, name: 'B', strokeW: 0.9 },
  { s: 0, name: 'e', strokeW: 0.7 },  // high e (rightmost, thinnest)
] as const;

// ── Coordinate helpers ─────────────────────────────────────────────────────────

/** SVG x for a given code-string index (s=5 → left, s=0 → right) */
function xStr(s: number): number {
  return L + (5 - s) * SW;
}

/** SVG y for the centre of a fret cell (fret 1-based) */
function yDot(f: number): number {
  return T + (f - 0.5) * FH;
}

/** SVG y for a fret wire (0 = nut-edge, 1–13 = fret wires) */
function yWire(f: number): number {
  return T + f * FH;
}

// Standard guitar neck inlays
const SINGLE_INLAY_FRETS = [3, 5, 7, 9];

export default function VerticalNeckFretboard({ dots }: Props) {
  const midX = L + NECK_W / 2;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      aria-label="Full 13-fret neck map with all CAGED scale patterns overlaid"
      style={{ display: 'block' }}
    >
      {/* ── String-name labels (top) ────────────────────────────────────── */}
      {STRING_META.map(({ s, name }, col) => (
        <text
          key={`sn-${s}`}
          x={L + col * SW}
          y={T - 22}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill={LABEL_CLR}
          fontFamily="ui-monospace, monospace"
        >
          {name}
        </text>
      ))}

      {/* ── Nut (cream bar just above fret 1, matches HorizontalScaleFretboard) */}
      <rect
        x={L - 1}
        y={T - 7}
        width={NECK_W + 2}
        height={7}
        fill={NUT_CLR}
        rx={1}
      />

      {/* ── Fret wires 1–13 (white, matching HorizontalScaleFretboard) ──── */}
      {Array.from({ length: N_FRETS }, (_, i) => i + 1).map((f) => (
        <line
          key={`fw-${f}`}
          x1={L}
          y1={yWire(f)}
          x2={L + NECK_W}
          y2={yWire(f)}
          stroke={FRET_WIRE}
          strokeWidth={f === 12 ? 2 : 1.5}
        />
      ))}

      {/* ── String lines (light colour, matching HorizontalScaleFretboard) ─ */}
      {STRING_META.map(({ s, strokeW }) => (
        <line
          key={`sl-${s}`}
          x1={xStr(s)}
          y1={T - 7}
          x2={xStr(s)}
          y2={T + NECK_H}
          stroke={STR_CLR}
          strokeWidth={strokeW}
        />
      ))}

      {/* ── Neck inlay markers (muted brown, matching HorizontalScaleFretboard) */}
      {SINGLE_INLAY_FRETS.map((f) => (
        <circle
          key={`inlay-${f}`}
          cx={midX}
          cy={yDot(f)}
          r={4.5}
          fill={INLAY_CLR}
          fillOpacity={0.45}
        />
      ))}
      {/* Double inlay at fret 12 */}
      <circle cx={L + SW * 1.5} cy={yDot(12)} r={4.5} fill={INLAY_CLR} fillOpacity={0.45} />
      <circle cx={L + SW * 3.5} cy={yDot(12)} r={4.5} fill={INLAY_CLR} fillOpacity={0.45} />

      {/* ── Fret-number labels (left margin) ─────────────────────────────── */}
      {[1, 3, 5, 7, 9, 12, 13].map((f) => (
        <text
          key={`fl-${f}`}
          x={L - 5}
          y={yDot(f) + 4}
          textAnchor="end"
          fontSize={9}
          fill={LABEL_CLR}
          fillOpacity={0.75}
          fontFamily="ui-monospace, monospace"
        >
          {f}
        </text>
      ))}

      {/* ── Scale dots ──────────────────────────────────────────────────── */}
      {dots.map((dot, i) => {
        const cx = xStr(dot.string);
        const cy = yDot(dot.fret);
        const op = dot.isWrapped ? 0.65 : 1;

        return dot.isRoot ? (
          // Filled cyan diamond — matches HorizontalScaleFretboard fretted root
          <polygon
            key={i}
            points={diamondPoints(cx, cy, DIA_H)}
            fill={CYAN}
            opacity={op}
          />
        ) : (
          // Filled amber circle — matches HorizontalScaleFretboard fretted scale note
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={DOT_R}
            fill={AMBER}
            opacity={op}
          />
        );
      })}
    </svg>
  );
}
