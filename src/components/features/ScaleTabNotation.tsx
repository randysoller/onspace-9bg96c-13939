/**
 * ScaleTabNotation — Sequential Guitar Tab with Playback Highlight
 *
 * Renders guitar tablature as a TIME-SEQUENCE staff:
 *   • Each note occupies a unique horizontal column (time position)
 *   • Note order matches useScalePatternAudio exactly:
 *       frequency-sorted ascending (lowest pitch → highest pitch)
 *       so currentNoteIdx aligns perfectly with the playing note
 *   • Open strings (fret 0) render as '0' at the correct string row
 *   • Split into TWO staves stacked vertically so ALL notes fit without scrolling
 *   • White background, black monospace text — matches ChordDetailModal style
 *   • Active note column highlighted in cyan during playback
 *
 * String convention (input, matches HorizontalScaleFretboard):
 *   0 = high e    5 = low E
 *
 * Visual convention (standard guitar tab):
 *   Row 0 (top)    = high e  (input string 0)
 *   Row 5 (bottom) = low E   (input string 5)
 *
 * Frequency sort uses simple semitone counting (open string + fret offset)
 * matching the same formula used in useScalePatternAudio via getNoteFrequency.
 */

interface TabDot {
  /** 0 = high e, 5 = low E */
  string: number;
  fret: number;
  isOpenString?: boolean;
}

interface ScaleTabNotationProps {
  dots: TabDot[];
  /** Index into the frequency-sorted ascending sequence — highlights that column */
  currentNoteIdx?: number | null;
}

// ── Display order: top of tab (high e, index 0) → bottom (low E, index 5) ────
const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'] as const;

// ── Open string semitone values (string 0=high e … string 5=low E) ──────────
// Used to sort dots by absolute pitch — matches shared-singleton convention
// after index reversal (we store OPEN_SEM[s] for s=0 (high e) … s=5 (low E)):
//   string 0 (high e) → MIDI ~64 (+4 semitones from C4)
//   string 5 (low  E) → MIDI ~40 (+4 semitones from C2)
// We just need relative ordering so we use open+fret semitones directly.
const OPEN_STRING_SEM = [64, 59, 55, 50, 45, 40] as const; // e B G D A E (absolute MIDI approx)

// ── SVG layout constants ───────────────────────────────────────────────────────
const STRING_H  = 11;    // px between string lines
const LABEL_W   = 22;    // px for "e/B/G/D/A/E" label column
const NOTE_W    = 22;    // px per time-column (note slot)

// Derived
const STAFF_H   = STRING_H * 5;        // 5 gaps × 11 = 55px
const SVG_PAD_T = 6;                   // top padding inside staff SVG
const SVG_PAD_B = 10;                  // bottom padding
const INNER_H   = SVG_PAD_T + STAFF_H + SVG_PAD_B; // 71px per staff

// Highlight colours
const HIGHLIGHT_BG   = '#06b6d4';  // cyan-500
const HIGHLIGHT_TEXT = '#ffffff';  // white on cyan
const NORMAL_TEXT    = '#18181b';  // zinc-900

// ── Build the sequential note list (FREQUENCY-SORTED ascending) ───────────────
//
// Matches useScalePatternAudio sort order exactly:
//   absolutePitch(dot) = OPEN_STRING_SEM[dot.string] + dot.fret
//   Sort ascending → lowest note first
//
// This ensures currentNoteIdx from the audio hook indexes the SAME note
// in both the tab staff and the fretboard highlight.
//
function buildNoteSequence(dots: TabDot[]): Array<{ string: number; fret: number }> {
  // Include ALL dots (fret 0 = open string renders as '0')
  const valid = dots.filter((d) => d.string >= 0 && d.string <= 5);

  // Sort by absolute pitch ascending (lowest → highest)
  const sorted = [...valid].sort((a, b) => {
    const pitchA = OPEN_STRING_SEM[a.string] + a.fret;
    const pitchB = OPEN_STRING_SEM[b.string] + b.fret;
    return pitchA - pitchB;
  });

  return sorted.map((d) => ({ string: d.string, fret: d.fret }));
}

// ── Single staff SVG ──────────────────────────────────────────────────────────

interface StaffProps {
  notes: Array<{ string: number; fret: number }>;
  /** Offset of this staff's first note within the full sequence (for highlight mapping) */
  startOffset: number;
  /** Index of the currently-highlighted note in the full sequence, or null */
  activeIdx: number | null | undefined;
  isLast: boolean;
}

function TabStaff({ notes, startOffset, activeIdx, isLast }: StaffProps) {
  const numCols = notes.length;
  const svgW    = LABEL_W + numCols * NOTE_W + NOTE_W * 0.6;
  const svgH    = INNER_H;

  // y centre for each string row — standard tab: s=0 (high e) at top
  const strY = (s: number) => SVG_PAD_T + s * STRING_H;

  // x centre for a column
  const noteColX = (col: number) => LABEL_W + col * NOTE_W + NOTE_W / 2;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width="100%"
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* ── String name labels (left column) ── */}
      {STRING_NAMES.map((name, idx) => (
        <text
          key={`sn-${idx}`}
          x={LABEL_W - 4}
          y={strY(idx)}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize={10}
          fontWeight={700}
          fill="#27272a"
          fontFamily="ui-monospace, 'Courier New', monospace"
        >
          {name}
        </text>
      ))}

      {/* ── String lines ── */}
      {Array.from({ length: 6 }, (_, idx) => {
        const y        = strY(idx);
        const lineXEnd = LABEL_W + numCols * NOTE_W + NOTE_W * 0.6;
        return (
          <line
            key={`str-${idx}`}
            x1={LABEL_W}
            y1={y}
            x2={lineXEnd}
            y2={y}
            stroke="#a1a1aa"
            strokeWidth={0.75}
          />
        );
      })}

      {/* ── Per-column highlight + fret number ── */}
      {notes.map(({ string: s, fret }, col) => {
        const globalIdx  = startOffset + col;
        const isActive   = activeIdx != null && globalIdx === activeIdx;
        const cx         = noteColX(col);
        const y          = strY(s);
        const label      = String(fret); // fret 0 → '0' for open strings
        const rectW      = fret >= 10 ? 14 : 10;

        return (
          <g key={`note-${col}`}>
            {isActive ? (
              /* Highlighted column: cyan pill that spans the full string-line height */
              <>
                {/* Cyan pill background */}
                <rect
                  x={cx - rectW / 2 - 1}
                  y={y - 8}
                  width={rectW + 2}
                  height={16}
                  rx={3}
                  fill={HIGHLIGHT_BG}
                />
                <text
                  x={cx}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={12}
                  fontWeight={700}
                  fill={HIGHLIGHT_TEXT}
                  fontFamily="ui-monospace, 'Courier New', monospace"
                >
                  {label}
                </text>
              </>
            ) : (
              /* Normal column: white knockout rect so number sits cleanly on the string line */
              <>
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
                  fill={NORMAL_TEXT}
                  fontFamily="ui-monospace, 'Courier New', monospace"
                >
                  {label}
                </text>
              </>
            )}
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

export default function ScaleTabNotation({ dots, currentNoteIdx }: ScaleTabNotationProps) {
  const sequence = buildNoteSequence(dots);

  if (sequence.length === 0) return null;

  // Split into two halves so both staves fit without scrolling
  const half     = Math.ceil(sequence.length / 2);
  const staffOne = sequence.slice(0, half);
  const staffTwo = sequence.slice(half);

  return (
    <div
      className="bg-white rounded-lg shadow-lg w-full overflow-hidden"
      style={{ paddingTop: 6, paddingBottom: 4, paddingLeft: 6, paddingRight: 6 }}
    >
      {/* Staff 1 — notes 0 … half-1 */}
      <TabStaff
        notes={staffOne}
        startOffset={0}
        activeIdx={currentNoteIdx ?? null}
        isLast={staffTwo.length === 0}
      />

      {/* Staff 2 — notes half … end */}
      {staffTwo.length > 0 && (
        <>
          <div style={{ height: 14 }} />
          <TabStaff
            notes={staffTwo}
            startOffset={half}
            activeIdx={currentNoteIdx ?? null}
            isLast={true}
          />
        </>
      )}
    </div>
  );
}
