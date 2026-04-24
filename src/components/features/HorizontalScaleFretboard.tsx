/**
 * HorizontalScaleFretboard
 *
 * A dark-background SVG fretboard matching the visual language of SVGChordDiagram:
 *   • Strings run as horizontal rows (6 rows, top = high e, bottom = low E)
 *   • Frets run as vertical columns (5 visible fret slots)
 *   • Nut = thick vertical bar on the LEFT when startFret === 1 (or 0)
 *   • String stroke widths increase top→bottom (thin e → thick E)
 *   • Dot style mirrors SVGChordDiagram:
 *       Root fretted    → solid cyan diamond  (#06b6d4), white label
 *       Root open       → hollow cyan diamond outline, white label
 *       Scale fretted   → solid amber circle  (#f59e0b), white label
 *       Scale open      → hollow amber circle outline, white label
 *   • Dark fretboard background matches ChordDetailModal card colour
 */

export interface FretDot {
  /** 0 = high e (SVG top), 5 = low E (SVG bottom) */
  string: number;
  /** Absolute fret number (1+ = fretted; 0 = open string; displayed in open zone) */
  fret: number;
  /** Display label (finger number, note name, or degree) */
  label: string;
  isRoot: boolean;
  isOpenString: boolean;
}

interface HorizontalScaleFretboardProps {
  dots: FretDot[];
  startFret: number;
  positionLabel?: string;
}

// ── Colours ───────────────────────────────────────────────────────────────────
const CYAN     = '#06b6d4';   // matches SVGChordDiagram LIB_DIAMOND_COLOR
const AMBER    = '#f59e0b';   // matches SVGChordDiagram LIB_CIRCLE_COLOR
const WHITE    = '#ffffff';
const FRET_CLR = 'hsl(240 5% 26%)';     // subtle fret wire on dark bg
const STR_CLR  = 'hsl(33 14% 65%)';     // beige-ish string colour
const NUT_CLR  = 'hsl(36 33% 88%)';     // near-white nut bar
const BG_CLR   = '#09090b';             // zinc-950 to match card bg
const LABEL_CLR = 'hsl(30 15% 45%)';    // fret number label

// ── String stroke widths (index 0 = high e, index 5 = low E) ─────────────────
// Matches SVGChordDiagram STRING_WIDTHS ratios
const STRING_WIDTHS = [0.7, 0.9, 1.4, 1.9, 2.5, 3.1];

// ── Layout constants ──────────────────────────────────────────────────────────
const NUM_STRINGS = 6;
const NUM_FRETS   = 5;   // visible fret slots

// Open-string column (left of nut); only shown when any open dots exist
const OPEN_ZONE_W = 32;
const NUT_W       = 5;
const TOP_PAD     = 16;
const BOT_PAD     = 16;
const LEFT_PAD    = 8;   // padding before open zone / fret label
const RIGHT_PAD   = 8;

const FRET_SLOT_W = 52;  // width of each fret slot
const FRET_AREA_W = NUM_FRETS * FRET_SLOT_W;

const SVG_H = 92;
const GRID_H = SVG_H - TOP_PAD - BOT_PAD;
const STR_STEP = GRID_H / (NUM_STRINGS - 1);

// Dot sizes — mirror SVGChordDiagram size="md" (dotRadius=9.5, diamond*1.38=13.1)
const DOT_R   = 9.5;
const DIA_H   = 11;    // diamond half-extent for fretted root
const OPEN_R  = 8.5;   // open-string circle radius
const OPEN_DH = 9.5;   // open-string diamond half-extent
const FONT_SZ = 9;     // label font-size (matches md config ~r*1.0)

// ── Geometry helpers ──────────────────────────────────────────────────────────

/** x-left of the open-string zone */
const OPEN_X_START = LEFT_PAD;
/** x of the nut bar left edge */
const NUT_X = LEFT_PAD + OPEN_ZONE_W;
/** x where fret area starts (right of nut) */
const FRET_X0 = NUT_X + NUT_W;
/** Total SVG width */
const SVG_W = FRET_X0 + FRET_AREA_W + RIGHT_PAD;

/** Centre x of a fret slot (0-indexed slot offset from startFret) */
const fretCX = (slot: number) => FRET_X0 + slot * FRET_SLOT_W + FRET_SLOT_W / 2;
/** y centre of a string row */
const strCY = (s: number) => TOP_PAD + s * STR_STEP;

/** Diamond polygon points string */
function diamond(cx: number, cy: number, half: number): string {
  return `${cx},${cy - half} ${cx + half},${cy} ${cx},${cy + half} ${cx - half},${cy}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HorizontalScaleFretboard({
  dots,
  startFret,
  positionLabel,
}: HorizontalScaleFretboardProps) {
  const openDots    = dots.filter((d) => d.isOpenString);
  const frettedDots = dots.filter((d) => !d.isOpenString);
  const hasNut = startFret <= 1; // show nut when window begins at fret 0 or 1

  return (
    <div className="w-full">
      {positionLabel && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 px-0.5">
          {positionLabel}
        </p>
      )}
      <div
        className="rounded-lg overflow-hidden"
        style={{ background: BG_CLR }}
      >
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width="100%"
          style={{ display: 'block', height: SVG_H }}
          aria-label={positionLabel ?? 'Scale pattern'}
        >
          {/* ── Nut (when open/1st-fret position) ──────────────────────── */}
          {hasNut && (
            <rect
              x={NUT_X}
              y={TOP_PAD - 4}
              width={NUT_W}
              height={GRID_H + 8}
              fill={NUT_CLR}
              rx={1}
            />
          )}

          {/* ── Fret wires (vertical) ──────────────────────────────────── */}
          {Array.from({ length: NUM_FRETS + 1 }).map((_, i) => (
            <line
              key={`fw-${i}`}
              x1={FRET_X0 + i * FRET_SLOT_W}
              y1={TOP_PAD - 2}
              x2={FRET_X0 + i * FRET_SLOT_W}
              y2={TOP_PAD + GRID_H + 2}
              stroke={FRET_CLR}
              strokeWidth={i === 0 && !hasNut ? 2.5 : 1.5}
            />
          ))}

          {/* ── Fret position number label (when not at nut) ───────────── */}
          {!hasNut && (
            <text
              x={FRET_X0 - 6}
              y={TOP_PAD + GRID_H / 2}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={9}
              fontWeight={700}
              fill={LABEL_CLR}
              fontFamily="monospace"
            >
              {startFret}fr
            </text>
          )}

          {/* ── String lines (horizontal, full width) ───────────────────── */}
          {Array.from({ length: NUM_STRINGS }).map((_, s) => (
            <line
              key={`str-${s}`}
              x1={hasNut ? NUT_X + NUT_W : FRET_X0}
              y1={strCY(s)}
              x2={FRET_X0 + FRET_AREA_W}
              y2={strCY(s)}
              stroke={STR_CLR}
              strokeWidth={STRING_WIDTHS[s]}
              strokeOpacity={0.9}
            />
          ))}

          {/* Extend strings into open zone when nut is visible */}
          {hasNut && openDots.length > 0 &&
            Array.from({ length: NUM_STRINGS }).map((_, s) => (
              <line
                key={`str-open-${s}`}
                x1={OPEN_X_START + 4}
                y1={strCY(s)}
                x2={NUT_X}
                y2={strCY(s)}
                stroke={STR_CLR}
                strokeWidth={STRING_WIDTHS[s] * 0.6}
                strokeOpacity={0.5}
              />
            ))
          }

          {/* ── Open-string dots (left of nut) ─────────────────────────── */}
          {openDots.map((dot, i) => {
            const cx = OPEN_X_START + OPEN_ZONE_W / 2;
            const cy = strCY(dot.stringIndex ?? dot.string);
            const lbl = dot.label ?? '';
            const fs = lbl.length > 2 ? FONT_SZ - 2 : FONT_SZ;

            return dot.isRoot ? (
              <g key={`oroot-${i}`}>
                <polygon
                  points={diamond(cx, cy, OPEN_DH)}
                  fill="none"
                  stroke={CYAN}
                  strokeWidth={2}
                />
                {lbl && (
                  <text x={cx} y={cy + fs * 0.38} textAnchor="middle"
                    fontSize={fs} fontWeight={800} fill={WHITE}
                    fontFamily="DM Sans, sans-serif">
                    {lbl}
                  </text>
                )}
              </g>
            ) : (
              <g key={`oscale-${i}`}>
                <circle cx={cx} cy={cy} r={OPEN_R} fill="none" stroke={AMBER} strokeWidth={2} />
                {lbl && (
                  <text x={cx} y={cy + fs * 0.38} textAnchor="middle"
                    fontSize={fs} fontWeight={800} fill={WHITE}
                    fontFamily="DM Sans, sans-serif">
                    {lbl}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Fretted dots ────────────────────────────────────────────── */}
          {frettedDots.map((dot, i) => {
            const slot = dot.fret - startFret;
            if (slot < 0 || slot >= NUM_FRETS) return null;

            const cx = fretCX(slot);
            const cy = strCY(dot.stringIndex ?? dot.string);
            const lbl = dot.label ?? '';
            const fs = lbl.length > 2 ? FONT_SZ - 1 : FONT_SZ + 1;

            return dot.isRoot ? (
              <g key={`froot-${i}`}>
                <polygon points={diamond(cx, cy, DIA_H)} fill={CYAN} />
                {lbl && (
                  <text x={cx} y={cy + fs * 0.38} textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fs} fontWeight={900} fill={WHITE}
                    fontFamily="DM Sans, sans-serif"
                    style={{ fontFeatureSettings: '"tnum"' }}>
                    {lbl}
                  </text>
                )}
              </g>
            ) : (
              <g key={`fscale-${i}`}>
                <circle cx={cx} cy={cy} r={DOT_R} fill={AMBER} />
                {lbl && (
                  <text x={cx} y={cy + fs * 0.38} textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fs} fontWeight={900} fill={WHITE}
                    fontFamily="DM Sans, sans-serif"
                    style={{ fontFeatureSettings: '"tnum"' }}>
                    {lbl}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
