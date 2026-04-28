/**
 * HorizontalScaleFretboard
 *
 * Renders the same visual language as SVGChordDiagram (size="md") but rotated 90°:
 *   • Strings → horizontal rows (6 rows, top = high e, bottom = low E)
 *   • Frets   → vertical columns (5 visible slots)
 *   • Nut     → thick vertical bar on the LEFT when startFret ≤ 1
 *   • Fret wires: stroke="white", same as SVGChordDiagram
 *   • String stroke widths: [3.1, 2.5, 1.9, 1.4, 0.9, 0.7] (thick E → thin e), inverted top→bottom
 *   • Root fretted  → solid cyan diamond  (#06b6d4), white label
 *   • Root open     → hollow cyan diamond outline, white label
 *   • Scale fretted → solid amber circle  (#f59e0b), white label
 *   • Scale open    → hollow amber circle outline, white label
 *   • Open strings sit LEFT of the nut in a dedicated column
 *
 * Playback highlight:
 *   • activeDotIdx = index into the frequency-sorted ascending dot array
 *   • Matching dot gets a bright white outer ring to follow audio playback
 */

export interface FretDot {
  /** 0 = high e (SVG top row), 5 = low E (SVG bottom row) */
  string: number;
  /** Absolute fret number (0 = open string, 1+ = fretted) */
  fret: number;
  /** Display label: finger number, note name, or degree */
  label: string;
  isRoot: boolean;
  isOpenString: boolean;
}

interface HorizontalScaleFretboardProps {
  dots: FretDot[];
  startFret: number;
  positionLabel?: string;
  /**
   * Index (into the frequency-sorted ascending order of dots) of the note
   * currently being played.  When set, a bright white ring is drawn around
   * that dot so the highlight follows audio playback.
   * Uses the same sort as useScalePatternAudio: ascending absolute pitch.
   */
  activeDotIdx?: number | null;
}

// ── Colours matching SVGChordDiagram exactly ──────────────────────────────────
const CYAN      = '#06b6d4';           // LIB_DIAMOND_COLOR
const AMBER     = 'hsl(38 92% 50%)';   // LIB_CIRCLE_COLOR  = amber-500
const WHITE     = '#ffffff';
const FRET_WIRE = 'white';             // SVGChordDiagram: stroke="white"
const STR_CLR   = 'hsl(33 14% 72%)';   // SVGChordDiagram string colour
const NUT_CLR   = 'hsl(36 33% 93%)';   // SVGChordDiagram nut colour
const INLAY_CLR = 'hsl(30 15% 50%)';   // SVGChordDiagram fret inlay dots
const FRET_NUM_CLR = 'hsl(33 14% 72%)';// position label colour

// ── String stroke widths: index 0 = high e (top row), 5 = low E (bottom row)
// SVGChordDiagram STRING_WIDTHS is [3.1,2.5,1.9,1.4,0.9,0.7] for strings 0–5
// where 0 = low E in SVGChordDiagram. We INVERT for horizontal (top = thin e).
const STRING_WIDTHS = [0.7, 0.9, 1.4, 1.9, 2.5, 3.1]; // top(e) → bottom(E)

// ── Layout ────────────────────────────────────────────────────────────────────
const NUM_STRINGS = 6;
const NUM_FRETS   = 5;   // visible fret slots (matches SVGChordDiagram numFrets=5)

// SVGChordDiagram md: dotRadius=9.5, diamond dr = r*1.38 ≈ 13.1
const DOT_R   = 9.5;    // fretted scale circle radius
const DIA_H   = 13.1;   // fretted root diamond half-extent
const OPEN_R  = 6.65;   // open string: r * 0.7 (SVGChordDiagram head-indicator size)
const OPEN_DH = 10.4;   // open root diamond: OPEN_R * 1.56
const FONT_SZ_SMALL = 11; // label inside larger diamonds
const FONT_SZ = 13;        // label inside circles (r*1.37)
const FRET_LABEL_SZ = 13;  // per-fret number labels below diagram (+2 from 11)

// Padding
const TOP_PAD    = 20;    // above top string (room for open-position fret number label)
const BOT_PAD    = 38;   // increased to fit per-fret number labels well below the bottommost dots
const RIGHT_PAD  = 10;

// Open-string zone (left of nut)
const OPEN_ZONE_W = 34;
const LEFT_PAD    = 4;   // before open zone

// Nut
const NUT_W   = 6;
const NUT_CLR_FILL = NUT_CLR;

// Fret slot width — cumulative −19% from original 52 (47→42)
const FRET_SLOT_W = 42;

// ── Derived geometry ──────────────────────────────────────────────────────────
// STRING_ROW_H 18→23: increases total SVG height by ~21% (140→170)
const SVG_H    = TOP_PAD + BOT_PAD + NUM_STRINGS * 23; // = 20+38+138 = 196
const GRID_H   = SVG_H - TOP_PAD - BOT_PAD;
const STR_STEP = GRID_H / (NUM_STRINGS - 1);

const OPEN_X   = LEFT_PAD + OPEN_ZONE_W / 2;       // cx for open-string dots
const NUT_X    = LEFT_PAD + OPEN_ZONE_W;            // left edge of nut
const FRET_X0  = NUT_X + NUT_W;                    // left edge of fret area
const SVG_W    = FRET_X0 + NUM_FRETS * FRET_SLOT_W + RIGHT_PAD;

/** y-centre of a string row (0 = high e at top, 5 = low E at bottom) */
const strCY  = (s: number) => TOP_PAD + s * STR_STEP;
/** x-centre of a fret slot (0-indexed from startFret) */
const fretCX = (slot: number) => FRET_X0 + slot * FRET_SLOT_W + FRET_SLOT_W / 2;

/** SVG polygon points for a diamond centred at (cx,cy) with half-extent h */
function diamondPoints(cx: number, cy: number, h: number): string {
  return `${cx},${cy - h} ${cx + h},${cy} ${cx},${cy + h} ${cx - h},${cy}`;
}

// SVGChordDiagram inlay frets (single dot at these absolute frets)
const INLAY_SINGLE = [3, 5, 7, 9, 15, 17, 19, 21];
const INLAY_DOUBLE = [12, 24];

// ── Open-string semitone table (matches ScaleTabNotation + audio hook sort) ──
// Used to build a frequency-sorted index so activeDotIdx maps correctly.
const OPEN_SEM_H = [64, 59, 55, 50, 45, 40] as const; // e B G D A E (absolute MIDI approx)

/**
 * Build a Map<originalDotArrayIndex, frequencySortedPosition>.
 * This lets the fretboard know which dot index corresponds to the audio hook's
 * currentNoteIdx (which is also frequency-sorted ascending).
 */
function buildSortedIndexMap(dots: FretDot[]): Map<number, number> {
  const indexed = dots.map((d, i) => ({ d, i }));
  const sorted  = [...indexed].sort((a, b) => {
    const pa = OPEN_SEM_H[a.d.string] + a.d.fret;
    const pb = OPEN_SEM_H[b.d.string] + b.d.fret;
    return pa - pb;
  });
  const map = new Map<number, number>();
  sorted.forEach(({ i }, sortedPos) => map.set(i, sortedPos));
  return map;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HorizontalScaleFretboard({
  dots,
  startFret,
  positionLabel,
  activeDotIdx = null,
}: HorizontalScaleFretboardProps) {
  // Build sorted-position lookup so we can find which dot matches activeDotIdx
  const sortedPosMap = activeDotIdx != null ? buildSortedIndexMap(dots) : null;

  const openDots    = dots.filter((d) => d.isOpenString);
  const frettedDots = dots.filter((d) => !d.isOpenString);

  // Show nut when window starts at fret 0 or 1 (same logic as SVGChordDiagram baseFret===1)
  const showNut    = startFret <= 1;
  const showFretNr = !showNut; // used for fret-wire stroke-width emphasis on barre positions

  return (
    <div className="w-full">
      {positionLabel && (
        <p className="text-[14px] font-bold uppercase tracking-widest text-zinc-400 mb-1 px-0.5">
          {positionLabel}
        </p>
      )}
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        style={{ display: 'block' }}
        aria-label={positionLabel ?? 'Scale pattern'}
      >
        {/* ── Nut (thick vertical bar, mirrors SVGChordDiagram nut rect) ───── */}
        {showNut && (
          <rect
            x={NUT_X}
            y={TOP_PAD - 4}
            width={NUT_W}
            height={GRID_H + 8}
            fill={NUT_CLR_FILL}
            rx={1}
          />
        )}

        {/* ── Fret wires (vertical lines = SVGChordDiagram horizontal fret lines) */}
        {Array.from({ length: NUM_FRETS + 1 }).map((_, i) => (
          <line
            key={`fw-${i}`}
            x1={FRET_X0 + i * FRET_SLOT_W}
            y1={TOP_PAD - 2}
            x2={FRET_X0 + i * FRET_SLOT_W}
            y2={TOP_PAD + GRID_H + 2}
            stroke={FRET_WIRE}
            strokeWidth={i === 0 && showFretNr ? 2.5 : 2}
          />
        ))}

        {/* ── Per-fret number labels below each column ────────────────────── */}
        {/* Renders absolute fret numbers (e.g. 3 4 5 6 7) so players can    */}
        {/* immediately locate the pattern on the neck without counting frets */}
        {Array.from({ length: NUM_FRETS }).map((_, i) => (
          <text
            key={`fnum-${i}`}
            x={fretCX(i)}
            y={TOP_PAD + GRID_H + 31}
            textAnchor="middle"
            fontSize={FRET_LABEL_SZ}
            fontWeight={600}
            fill={FRET_NUM_CLR}
            fillOpacity={0.75}
            fontFamily="DM Sans, sans-serif"
          >
            {startFret + i}
          </text>
        ))}

        {/* ── Fret inlay dots (horizontal = map absolute frets to slot centres) ─ */}
        {Array.from({ length: NUM_FRETS }).map((_, i) => {
          const absFret = startFret + i;
          const cx      = fretCX(i);
          const midY    = TOP_PAD + GRID_H / 2;  // centre of the 6 strings

          if (INLAY_SINGLE.includes(absFret)) {
            return (
              <circle
                key={`inlay-${i}`}
                cx={cx}
                cy={midY}
                r={DOT_R / 2}
                fill={INLAY_CLR}
                fillOpacity={0.45}
              />
            );
          }
          if (INLAY_DOUBLE.includes(absFret)) {
            const off = STR_STEP * 1.2;
            return (
              <g key={`inlay-${i}`}>
                <circle cx={cx} cy={midY - off} r={DOT_R / 2} fill={INLAY_CLR} fillOpacity={0.45} />
                <circle cx={cx} cy={midY + off} r={DOT_R / 2} fill={INLAY_CLR} fillOpacity={0.45} />
              </g>
            );
          }
          return null;
        })}

        {/* ── String lines (horizontal rows, mirrors SVGChordDiagram vertical strings) */}
        {Array.from({ length: NUM_STRINGS }).map((_, s) => (
          <line
            key={`str-${s}`}
            x1={showNut ? FRET_X0 : FRET_X0}
            y1={strCY(s)}
            x2={FRET_X0 + NUM_FRETS * FRET_SLOT_W}
            y2={strCY(s)}
            stroke={STR_CLR}
            strokeWidth={STRING_WIDTHS[s]}
            strokeOpacity={1}
          />
        ))}

        {/* Extend strings into open zone (dimmed) */}
        {showNut && Array.from({ length: NUM_STRINGS }).map((_, s) => (
          <line
            key={`str-open-${s}`}
            x1={LEFT_PAD + 4}
            y1={strCY(s)}
            x2={NUT_X}
            y2={strCY(s)}
            stroke={STR_CLR}
            strokeWidth={STRING_WIDTHS[s] * 0.55}
            strokeOpacity={0.4}
          />
        ))}

        {/* ── Open-string dots (left of nut, mirrors SVGChordDiagram head indicators) */}
        {openDots.map((dot, arrIdx) => {
          const cy  = strCY(dot.string);
          const lbl = dot.label ?? '';
          const fs  = lbl.length > 2 ? FONT_SZ_SMALL - 1 : FONT_SZ_SMALL;
          // Resolve original index in the full `dots` array for highlight lookup
          const originalIdx = dots.indexOf(dot);
          const isActive = activeDotIdx != null && sortedPosMap?.get(originalIdx) === activeDotIdx;

          return dot.isRoot ? (
            // Hollow cyan diamond — mirrors SVGChordDiagram openDiamonds
            <g key={`oroot-${arrIdx}`}>
              {/* Active highlight: bright white outer ring */}
              {isActive && (
                <polygon
                  points={diamondPoints(OPEN_X, cy, OPEN_DH + 5)}
                  fill="none"
                  stroke="white"
                  strokeWidth={2.5}
                  opacity={0.9}
                />
              )}
              <polygon
                points={diamondPoints(OPEN_X, cy, OPEN_DH)}
                fill="none"
                stroke={isActive ? '#22d3ee' : CYAN}
                strokeWidth={2.5}
              />
              {lbl && (
                <text
                  x={OPEN_X}
                  y={cy + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={fs}
                  fontWeight={900}
                  fill={WHITE}
                  fontFamily="DM Sans, sans-serif"
                >
                  {lbl}
                </text>
              )}
            </g>
          ) : (
            // Hollow amber circle — mirrors SVGChordDiagram openStrings
            <g key={`oscale-${arrIdx}`}>
              {/* Active highlight: bright white outer ring */}
              {isActive && (
                <circle cx={OPEN_X} cy={cy} r={OPEN_R + 5} fill="none" stroke="white" strokeWidth={2} opacity={0.9} />
              )}
              <circle cx={OPEN_X} cy={cy} r={OPEN_R} fill="none" stroke={isActive ? '#fbbf24' : AMBER} strokeWidth={2.5} />
              {lbl && (
                <text
                  x={OPEN_X}
                  y={cy + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={fs}
                  fontWeight={900}
                  fill={WHITE}
                  fontFamily="DM Sans, sans-serif"
                >
                  {lbl}
                </text>
              )}
            </g>
          );
        })}

        {/* ── Fretted dots (mirrors SVGChordDiagram markers section) ──────────── */}
        {frettedDots.map((dot, i) => {
          const slot = dot.fret - startFret;
          if (slot < 0 || slot >= NUM_FRETS) return null;

          const cx  = fretCX(slot);
          const cy  = strCY(dot.string);
          const lbl = dot.label ?? '';
          // Resolve original index in the full `dots` array for highlight lookup
          const originalIdx = dots.indexOf(dot);
          const isActive = activeDotIdx != null && sortedPosMap?.get(originalIdx) === activeDotIdx;

          return dot.isRoot ? (
            // Solid cyan diamond — mirrors SVGChordDiagram diamond marker
            <g key={`froot-${i}`}>
              {/* Active highlight: white outer ring + brighter fill */}
              {isActive && (
                <polygon
                  points={diamondPoints(cx, cy, DIA_H + 5)}
                  fill="none"
                  stroke="white"
                  strokeWidth={2.5}
                  opacity={0.95}
                />
              )}
              <polygon points={diamondPoints(cx, cy, DIA_H)} fill={isActive ? '#22d3ee' : CYAN} />
              {lbl && (
                <text
                  x={cx}
                  y={cy + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={FONT_SZ_SMALL}
                  fontWeight={900}
                  fill={WHITE}
                  fontFamily="DM Sans, sans-serif"
                  style={{ fontFeatureSettings: '"tnum"' }}
                >
                  {lbl}
                </text>
              )}
            </g>
          ) : (
            // Solid amber circle — mirrors SVGChordDiagram circle marker
            <g key={`fscale-${i}`}>
              {/* Active highlight: white outer ring + brighter fill */}
              {isActive && (
                <circle cx={cx} cy={cy} r={DOT_R + 5} fill="none" stroke="white" strokeWidth={2.5} opacity={0.95} />
              )}
              <circle cx={cx} cy={cy} r={DOT_R} fill={isActive ? '#fbbf24' : AMBER} />
              {lbl && (
                <text
                  x={cx}
                  y={cy + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={FONT_SZ}
                  fontWeight={900}
                  fill={WHITE}
                  fontFamily="DM Sans, sans-serif"
                  style={{ fontFeatureSettings: '"tnum"' }}
                >
                  {lbl}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
