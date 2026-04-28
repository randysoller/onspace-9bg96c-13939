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
 *
 * Pattern isolation:
 *   • Each dot carries patternIndices: number[] — which patterns own it
 *   • highlightedPatterns prop (Set<number>) controls opacity
 *   • Open-string dots (patternIndices=[]) are always full opacity
 *
 * Pattern brackets:
 *   • showBrackets=true draws thin vertical bars on the right SVG margin
 *   • Each bar spans the fret range of its CAGED pattern
 *   • Staggered x offsets prevent total overlap; neutral color with roman labels
 *
 * String index convention (matches HorizontalScaleFretboard & ScaleDetailModal):
 *   0 = high e (rightmost)   5 = low E (leftmost)
 */

export interface NeckDot {
  /** 0 = high e (right), 5 = low E (left) */
  string: number;
  /** 0 = open string (rendered above nut), 1–13 = fretted */
  fret: number;
  isRoot: boolean;
  /** true when fret === 0 (rendered as hollow outline above nut) */
  isOpenString?: boolean;
  /** true when this dot originated from a fret > 13 that was folded back by -12 */
  isWrapped?: boolean;
  /**
   * Which CAGED pattern indices (0–4) this dot belongs to.
   * A dot in an overlap zone will have multiple entries.
   * Open-string dots computed from music-theory have [] (universal — always full opacity).
   */
  patternIndices?: number[];
}

interface Props {
  dots: NeckDot[];
  /** Empty set or undefined → all patterns shown at full opacity */
  highlightedPatterns?: Set<number>;
}

// ── SVG coordinate constants ───────────────────────────────────────────────────
const L  = 60;   // left padding  — wider to accommodate larger fret labels (size 15) shifted further left
const R  = 16;   // right padding
const T  = 68;   // top padding   — room for string-name labels + open-string zone + nut
const B  = 18;   // bottom padding
const FH = 54;   // fret height   — px per fret cell (taller = narrower cells, matches reference photo ~1:3.1 aspect ratio)
const SW = 44;   // string spacing — px between adjacent string lines

const N_FRETS   = 12;
const N_STRINGS = 6;

const NECK_W = (N_STRINGS - 1) * SW;  // 5 × 44 = 220
const NECK_H = N_FRETS * FH;           // 12 × 54 = 648

const VB_W = L + NECK_W + R;           // 316  (60 + 220 + 36)
const VB_H = T + NECK_H + B;           // 734  (68 + 648 + 18)

// ── Visual constants — matching HorizontalScaleFretboard exactly ──────────────
const CYAN      = '#06b6d4';           // root diamond fill
const AMBER     = 'hsl(38 92% 50%)';  // scale circle fill  (amber-500)
const FRET_WIRE = 'white';            // matches HorizontalScaleFretboard FRET_WIRE
const STR_CLR   = 'hsl(33 14% 72%)'; // matches HorizontalScaleFretboard STR_CLR
const NUT_CLR   = 'hsl(36 33% 93%)'; // matches HorizontalScaleFretboard NUT_CLR
const INLAY_CLR = 'hsl(30 15% 50%)'; // matches HorizontalScaleFretboard INLAY_CLR
const LABEL_CLR = 'hsl(33 14% 72%)'; // fret numbers and string names

const DOT_R  = 14;   // fretted scale circle radius
const DIA_H  = 17.8; // fretted root diamond half-extent
const OPEN_R  = 10.65; // open-string circle radius
const OPEN_DH = 14.4; // open-string diamond half-extent

/** SVG polygon points for a diamond centred at (cx,cy) with half-extent h */
function diamondPoints(cx: number, cy: number, h: number): string {
  return `${cx},${cy - h} ${cx + h},${cy} ${cx},${cy + h} ${cx - h},${cy}`;
}

// ── String metadata (left → right order) ──────────────────────────────────────
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

/** SVG y for open-string dots (above the nut) */
function yOpen(): number {
  return T - Math.round(FH * 0.65);
}

/** SVG y for a fret wire (0 = nut-edge, 1–N_FRETS = fret wires) */
function yWire(f: number): number {
  return T + f * FH;
}

// Standard guitar neck inlays
const SINGLE_INLAY_FRETS = [3, 5, 7, 9];

// Roman numeral labels for the 5 CAGED positions
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

export default function VerticalNeckFretboard({
  dots,
  highlightedPatterns,
}: Props) {
  const midX = L + NECK_W / 2;
  const openDots    = dots.filter((d) => d.isOpenString);
  const frettedDots = dots.filter((d) => !d.isOpenString);

  // Whether any pattern is actively isolated
  const isolating = (highlightedPatterns?.size ?? 0) > 0;

  /**
   * Returns the opacity for a dot given the current isolation state.
   * Open-string dots (patternIndices=[]) are always full opacity.
   * When isolating: full if dot belongs to any highlighted pattern, else dimmed.
   */
  function dotOpacity(dot: NeckDot): number {
    if (!isolating) return 1;
    if (!dot.patternIndices || dot.patternIndices.length === 0) return 1; // open-string universal
    const isHighlighted = dot.patternIndices.some((pi) => highlightedPatterns!.has(pi));
    return isHighlighted ? 1 : 0.18;
  }

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
          y={T - 52}
          textAnchor="middle"
          fontSize={21}
          fontWeight={600}
          fill={LABEL_CLR}
          fontFamily="ui-monospace, monospace"
        >
          {name}
        </text>
      ))}

      {/* ── Nut ─────────────────────────────────────────────────────────── */}
      <rect
        x={L - 1}
        y={T - 7}
        width={NECK_W + 2}
        height={7}
        fill={NUT_CLR}
        rx={1}
      />

      {/* ── Fret wires ──────────────────────────────────────────────────── */}
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

      {/* ── String lines ────────────────────────────────────────────────── */}
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

      {/* ── Neck inlay markers ───────────────────────────────────────────── */}
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
      {[1, 3, 5, 7, 9, 12].map((f) => (
        <text
          key={`fl-${f}`}
          x={L - 38}
          y={yDot(f) + 4}
          textAnchor="end"
          fontSize={17}
          fill={LABEL_CLR}
          fillOpacity={0.75}
          fontFamily="ui-monospace, monospace"
        >
          {f}
        </text>
      ))}

      {/* ── Open-string dots — hollow outline above nut ─────────────────── */}
      {openDots.map((dot, i) => {
        const cx = xStr(dot.string);
        const cy = yOpen();
        const op = dotOpacity(dot);

        return dot.isRoot ? (
          <polygon
            key={`open-${i}`}
            points={diamondPoints(cx, cy, OPEN_DH)}
            fill="none"
            stroke={CYAN}
            strokeWidth={2.5}
            opacity={op}
          />
        ) : (
          <circle
            key={`open-${i}`}
            cx={cx}
            cy={cy}
            r={OPEN_R}
            fill="none"
            stroke={AMBER}
            strokeWidth={2.5}
            opacity={op}
          />
        );
      })}

      {/* ── Fretted dots ─────────────────────────────────────────────────── */}
      {frettedDots.map((dot, i) => {
        const cx = xStr(dot.string);
        const cy = yDot(dot.fret);
        const op = dotOpacity(dot);

        return dot.isRoot ? (
          <polygon
            key={`fret-${i}`}
            points={diamondPoints(cx, cy, DIA_H)}
            fill={CYAN}
            opacity={op}
          />
        ) : (
          <circle
            key={`fret-${i}`}
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
