/**
 * HorizontalScaleFretboard — compact horizontal SVG fretboard diagram.
 *
 * Layout:
 *   • Optional open-string zone on the far left (before the nut)
 *   • Nut (thick vertical line) when startFret === 0, otherwise a fret-number label
 *   • 5 fret columns (slots between wires)
 *   • 6 strings run horizontally: stringIndex 0 = high e (top), 5 = low E (bottom)
 *   • String stroke widths increase top→bottom (thin e → thick E)
 *
 * Dot styles:
 *   Root fretted    → solid cyan diamond,  white label
 *   Root open       → hollow cyan diamond outline, white label
 *   Scale fretted   → solid amber circle,  white label
 *   Scale open      → hollow amber circle outline, white label
 */

export interface FretDot {
  stringIndex: number; // 0 = high e (SVG top), 5 = low E (SVG bottom)
  fret: number;        // absolute fret (0 = open string)
  label: string;
  isRoot: boolean;
  isOpenString: boolean; // true when fret === 0
}

interface HorizontalScaleFretboardProps {
  dots: FretDot[];
  startFret: number;     // first fret of the visible window (0 = open position shown)
  positionLabel?: string;
}

// ── Visual constants ──────────────────────────────────────────────────────────

const OPEN_ZONE_W = 28;   // width of the open-string column (left of nut)
const NUT_W = 4;           // nut bar width
const RIGHT_PAD = 6;
const TOP_PAD = 12;
const BOTTOM_PAD = 12;
const LEFT_NUM_W = 28;     // width reserved for fret-number label (when no nut)

const NUM_STRINGS = 6;
const NUM_FRETS = 5;       // visible fret slots

// String stroke widths (index 0 = high e top, index 5 = low E bottom)
const STRING_WIDTHS = [0.7, 1.0, 1.35, 1.75, 2.2, 2.9];

const DOT_R = 10;          // circle radius for fretted notes
const DIA_HALF = 11;       // half-width/height of diamond
const OPEN_R = 9;          // radius for open-string circles
const OPEN_DIA_HALF = 10;  // half of open-string diamond

// colours
const CYAN = '#06b6d4';
const AMBER = '#f59e0b';
const WHITE = '#ffffff';

// ── SVG dimensions (computed) ─────────────────────────────────────────────────

// Total width = open zone (when fret 0 window) + nut/label + fret area + right pad
// We always allocate both zones; open zone is simply unused when no open dots exist
const SVG_W = OPEN_ZONE_W + NUT_W + NUM_FRETS * 55 + RIGHT_PAD; // ~322px
const SVG_H = 90;

const FRET_AREA_LEFT = OPEN_ZONE_W + NUT_W; // x where fret column 0 starts
const FRET_AREA_W = NUM_FRETS * 55;
const FRET_W = FRET_AREA_W / NUM_FRETS;     // width of one fret slot
const FRET_AREA_H = SVG_H - TOP_PAD - BOTTOM_PAD;
const STR_H = FRET_AREA_H / (NUM_STRINGS - 1);

// Center x of fret slot (0-based offset from startFret)
const fretX = (fretOffset: number) =>
  FRET_AREA_LEFT + fretOffset * FRET_W + FRET_W / 2;

// y of a string
const stringY = (strIdx: number) => TOP_PAD + strIdx * STR_H;

// ── Diamond polygon points ─────────────────────────────────────────────────────

function diamondPoints(cx: number, cy: number, half: number): string {
  return `${cx},${cy - half} ${cx + half},${cy} ${cx},${cy + half} ${cx - half},${cy}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HorizontalScaleFretboard({
  dots,
  startFret,
  positionLabel,
}: HorizontalScaleFretboardProps) {
  const openDots = dots.filter((d) => d.isOpenString);
  const frettedDots = dots.filter((d) => !d.isOpenString);
  const hasNut = startFret === 0;

  return (
    <div className="w-full">
      {positionLabel && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5 px-1">
          {positionLabel}
        </p>
      )}
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full"
        style={{ height: SVG_H }}
      >
        {/* ── String lines (full width, including open zone) ─────────── */}
        {Array.from({ length: NUM_STRINGS }).map((_, strIdx) => (
          <line
            key={`str-${strIdx}`}
            x1={hasNut ? OPEN_ZONE_W + NUT_W : LEFT_NUM_W}
            y1={stringY(strIdx)}
            x2={FRET_AREA_LEFT + FRET_AREA_W}
            y2={stringY(strIdx)}
            stroke="#a1a1aa"
            strokeWidth={STRING_WIDTHS[strIdx]}
          />
        ))}

        {/* Extend strings into open zone when open position */}
        {hasNut &&
          Array.from({ length: NUM_STRINGS }).map((_, strIdx) => (
            <line
              key={`str-open-${strIdx}`}
              x1={4}
              y1={stringY(strIdx)}
              x2={OPEN_ZONE_W}
              y2={stringY(strIdx)}
              stroke="#71717a"
              strokeWidth={STRING_WIDTHS[strIdx] * 0.7}
            />
          ))}

        {/* ── Nut or fret-number label ────────────────────────────────── */}
        {hasNut ? (
          <rect
            x={OPEN_ZONE_W}
            y={TOP_PAD - 4}
            width={NUT_W}
            height={FRET_AREA_H + 8}
            fill="#d4d4d8"
            rx={1}
          />
        ) : (
          <text
            x={LEFT_NUM_W / 2}
            y={TOP_PAD + FRET_AREA_H / 2 + 4}
            fill="#71717a"
            fontSize={10}
            fontWeight="700"
            textAnchor="middle"
            fontFamily="monospace"
          >
            {startFret}
          </text>
        )}

        {/* ── Fret wires (vertical lines) ────────────────────────────── */}
        {Array.from({ length: NUM_FRETS + 1 }).map((_, i) => (
          <line
            key={`fret-${i}`}
            x1={FRET_AREA_LEFT + i * FRET_W}
            y1={TOP_PAD - 2}
            x2={FRET_AREA_LEFT + i * FRET_W}
            y2={TOP_PAD + FRET_AREA_H + 2}
            stroke="#52525b"
            strokeWidth={1.5}
          />
        ))}

        {/* ── Open-string dots (left of nut) ─────────────────────────── */}
        {openDots.map((dot, i) => {
          const cx = OPEN_ZONE_W / 2;
          const cy = stringY(dot.stringIndex);
          const fontSize = dot.label.length > 2 ? 6 : 8;

          if (dot.isRoot) {
            // Hollow cyan diamond outline
            return (
              <g key={`open-root-${i}`}>
                <polygon
                  points={diamondPoints(cx, cy, OPEN_DIA_HALF)}
                  fill="none"
                  stroke={CYAN}
                  strokeWidth={1.8}
                />
                <text
                  x={cx}
                  y={cy + fontSize * 0.38}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fontWeight="800"
                  fill={WHITE}
                  fontFamily="system-ui, sans-serif"
                >
                  {dot.label}
                </text>
              </g>
            );
          } else {
            // Hollow amber circle outline
            return (
              <g key={`open-scale-${i}`}>
                <circle cx={cx} cy={cy} r={OPEN_R} fill="none" stroke={AMBER} strokeWidth={1.8} />
                <text
                  x={cx}
                  y={cy + fontSize * 0.38}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fontWeight="800"
                  fill={WHITE}
                  fontFamily="system-ui, sans-serif"
                >
                  {dot.label}
                </text>
              </g>
            );
          }
        })}

        {/* ── Fretted dots ─────────────────────────────────────────────── */}
        {frettedDots.map((dot, i) => {
          const fretOffset = dot.fret - startFret; // 0-based slot index
          if (fretOffset < 0 || fretOffset >= NUM_FRETS) return null;

          const cx = fretX(fretOffset);
          const cy = stringY(dot.stringIndex);
          const fontSize = dot.label.length > 2 ? 7 : 9;

          if (dot.isRoot) {
            // Solid cyan diamond
            return (
              <g key={`fret-root-${i}`}>
                <polygon points={diamondPoints(cx, cy, DIA_HALF)} fill={CYAN} />
                <text
                  x={cx}
                  y={cy + fontSize * 0.38}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fontWeight="800"
                  fill={WHITE}
                  fontFamily="system-ui, sans-serif"
                >
                  {dot.label}
                </text>
              </g>
            );
          } else {
            // Solid amber circle
            return (
              <g key={`fret-scale-${i}`}>
                <circle cx={cx} cy={cy} r={DOT_R} fill={AMBER} />
                <text
                  x={cx}
                  y={cy + fontSize * 0.38}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fontWeight="800"
                  fill={WHITE}
                  fontFamily="system-ui, sans-serif"
                >
                  {dot.label}
                </text>
              </g>
            );
          }
        })}
      </svg>
    </div>
  );
}
