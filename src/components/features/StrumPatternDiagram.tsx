/**
 * StrumPatternDiagram — SVG music notation renderer for strum patterns.
 *
 * Each pattern is an 8-slot array representing eighth-note positions across
 * one 4/4 measure: [beat1, 1+, beat2, 2+, beat3, 3+, beat4, 4+]
 *
 * Slot values:
 *   'H'  — half note downstroke (held 2 beats, renders open note head)
 *   'D'  — quarter note downstroke
 *   'U'  — quarter note upstroke
 *   'DU' — eighth-note pair (down on beat, up on +)
 *   '_'  — rest
 *
 * ── Notation rules (music-standard) ──────────────────────────────────────────
 *
 * IMPLICIT EIGHTH PAIRS:
 *   When D appears at an even slot AND U appears at the immediately following
 *   odd slot, they are rendered as a beamed eighth-note pair — two filled note
 *   heads, both stems pointing UP, connected by a thick horizontal beam at the
 *   top. They share one slot column drawn across both slot positions.
 *
 * TIED QUARTER NOTES:
 *   When a rest (_) appears at an even slot (beat 1/2/3/4) AND the prior two
 *   slots formed an eighth-note pair (e.g. D at slot 4, U at slot 5 → rest at
 *   slot 6), that beat MUST show a tied quarter note head. This tells the player
 *   to count beat N while letting the previous note ring — no new stroke occurs.
 *   Visual: filled oval note head (no stem, no V/Λ), a tie arc curving from the
 *   previous U note head to this head, beat label below.
 *
 * COVERED REST (blank):
 *   An odd-slot rest (_) after a quarter note (D or U, not part of a pair) is
 *   completely blank — the quarter note's duration covers the "+" subdivision.
 *
 * BEAT LABELS:
 *   Even slots: "1" / "2" / "3" / "4"
 *   Odd slots:  "and" (not the beat number again)
 *   DU / implicit pair: "{n} and" centered across the pair
 *   Tied quarter: just the beat number (e.g. "4"), no direction word
 *
 * Visual style: music-standard notation on dark background.
 */

import React from 'react';

export type StrumSlot = 'H' | 'D' | 'U' | 'DU' | '_';

interface Props {
  notation: StrumSlot[];
  activeSlot?: number; // index 0–7, -1 or undefined = none active
  accentColor?: string;
  compact?: boolean; // responsive fill for card view
}

// Beat labels per slot index — odd slots say "and", not the beat number again
const BEAT_LABELS  = ['1', 'and', '2', 'and', '3', 'and', '4', 'and'];
// Beat NUMBER only (1–4), used for paired/tied label construction
const BEAT_NUMBERS = ['1', '1',   '2', '2',   '3', '3',   '4', '4'];

// ── SVG layout constants ──────────────────────────────────────────────────────
const SLOT_W = 52;
const SVG_W  = SLOT_W * 8; // 416
const SVG_H  = 122;

const STEM_TOP       = 6;
const NOTE_HEAD_Y    = 38;
const NOTE_HEAD_R    = 9;
const STEM_X_OFFSET  = NOTE_HEAD_R - 1; // stem attaches to right side of head

// V / Λ symbol constants
const V_TOP_Y    = NOTE_HEAD_Y + NOTE_HEAD_R + 10; // 57
const V_BOTTOM_Y = V_TOP_Y + 20;                   // 77
const V_HALF_W   = 7;
const V_STROKE   = 2.5;

// Text rows
const DIR_LABEL_Y  = V_BOTTOM_Y + 16; // 93
const BEAT_LABEL_Y = DIR_LABEL_Y + 17; // 110

// Colors
const INACTIVE_NOTE_COLOR  = '#e4e4e7'; // zinc-200
const INACTIVE_LABEL_COLOR = '#d4d4d8'; // zinc-300

function slotCenterX(i: number): number {
  return i * SLOT_W + SLOT_W / 2;
}

function downVPath(cx: number, halfW: number = V_HALF_W): string {
  return `M ${cx - halfW} ${V_TOP_Y} L ${cx} ${V_BOTTOM_Y} L ${cx + halfW} ${V_TOP_Y}`;
}

function upVPath(cx: number, halfW: number = V_HALF_W): string {
  return `M ${cx - halfW} ${V_BOTTOM_Y} L ${cx} ${V_TOP_Y} L ${cx + halfW} ${V_BOTTOM_Y}`;
}

/**
 * Pre-process notation to find implicit eighth-note pairs.
 * Returns a Set of EVEN slot indices where D is followed by U at slot+1.
 * The odd slot (slot+1) is consumed by the pair — skip it during individual render.
 */
function findImplicitPairs(slots: StrumSlot[]): Set<number> {
  const pairs = new Set<number>();
  for (let i = 0; i <= 6; i += 2) {
    if (slots[i] === 'D' && slots[i + 1] === 'U') {
      pairs.add(i);
    }
  }
  return pairs;
}

/**
 * Returns true if an even-slot rest should render as a tied quarter note.
 * Condition: slot i is '_', i is even, AND the prior two slots (i-2, i-1)
 * were an implicit eighth pair (D at i-2, U at i-1).
 */
function isTiedQuarter(slots: StrumSlot[], i: number, pairs: Set<number>): boolean {
  if (i % 2 !== 0) return false;
  if (slots[i] !== '_') return false;
  const priorEven = i - 2;
  return priorEven >= 0 && pairs.has(priorEven);
}

// ── Slot renderers ────────────────────────────────────────────────────────────

function renderHalfNote(cx: number, isActive: boolean, color: string, label: string): React.ReactNode {
  const noteColor  = isActive ? color : INACTIVE_NOTE_COLOR;
  const labelColor = isActive ? color : INACTIVE_LABEL_COLOR;
  return (
    <g>
      <line x1={cx + STEM_X_OFFSET} y1={STEM_TOP} x2={cx + STEM_X_OFFSET} y2={NOTE_HEAD_Y - NOTE_HEAD_R + 1}
        stroke={noteColor} strokeWidth={2} strokeLinecap="round" />
      <ellipse cx={cx} cy={NOTE_HEAD_Y} rx={NOTE_HEAD_R + 1} ry={NOTE_HEAD_R - 2.5}
        fill="none" stroke={noteColor} strokeWidth={2}
        transform={`rotate(-20, ${cx}, ${NOTE_HEAD_Y})`} />
      {/* Dashed hold bridge spanning 2 beats */}
      <line x1={cx + NOTE_HEAD_R + 2} y1={NOTE_HEAD_Y} x2={cx + SLOT_W * 3.4} y2={NOTE_HEAD_Y}
        stroke={noteColor} strokeWidth={0.8} strokeDasharray="3 3" opacity={0.5} />
      <path d={downVPath(cx)} stroke={noteColor} strokeWidth={V_STROKE} fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      <text x={cx} y={DIR_LABEL_Y} textAnchor="middle" fontSize={12} fill={labelColor}
        fontFamily="DM Sans, sans-serif" fontWeight="600">down</text>
      <text x={cx} y={BEAT_LABEL_Y} textAnchor="middle" fontSize={14} fill={labelColor}
        fontFamily="DM Sans, sans-serif" fontWeight={isActive ? '700' : '600'}>{label}</text>
    </g>
  );
}

function renderQuarterDown(cx: number, isActive: boolean, color: string, label: string): React.ReactNode {
  const noteColor  = isActive ? color : INACTIVE_NOTE_COLOR;
  const labelColor = isActive ? color : INACTIVE_LABEL_COLOR;
  return (
    <g>
      <line x1={cx + STEM_X_OFFSET} y1={STEM_TOP} x2={cx + STEM_X_OFFSET} y2={NOTE_HEAD_Y - NOTE_HEAD_R + 1}
        stroke={noteColor} strokeWidth={2} strokeLinecap="round" />
      <ellipse cx={cx} cy={NOTE_HEAD_Y} rx={NOTE_HEAD_R + 1} ry={NOTE_HEAD_R - 2.5}
        fill={noteColor} stroke={noteColor} strokeWidth={0.5}
        transform={`rotate(-20, ${cx}, ${NOTE_HEAD_Y})`} />
      <path d={downVPath(cx)} stroke={noteColor} strokeWidth={V_STROKE} fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      <text x={cx} y={DIR_LABEL_Y} textAnchor="middle" fontSize={12} fill={labelColor}
        fontFamily="DM Sans, sans-serif" fontWeight="600">down</text>
      <text x={cx} y={BEAT_LABEL_Y} textAnchor="middle" fontSize={14} fill={labelColor}
        fontFamily="DM Sans, sans-serif" fontWeight={isActive ? '700' : '600'}>{label}</text>
    </g>
  );
}

function renderQuarterUp(cx: number, isActive: boolean, color: string, label: string): React.ReactNode {
  const noteColor  = isActive ? color : INACTIVE_NOTE_COLOR;
  const labelColor = isActive ? color : INACTIVE_LABEL_COLOR;
  return (
    <g>
      {/* Standalone upstroke: stem points DOWN from left side */}
      <line x1={cx - STEM_X_OFFSET} y1={NOTE_HEAD_Y + NOTE_HEAD_R - 1}
        x2={cx - STEM_X_OFFSET} y2={NOTE_HEAD_Y + NOTE_HEAD_R + 22}
        stroke={noteColor} strokeWidth={2} strokeLinecap="round" />
      <ellipse cx={cx} cy={NOTE_HEAD_Y} rx={NOTE_HEAD_R + 1} ry={NOTE_HEAD_R - 2.5}
        fill={noteColor} stroke={noteColor} strokeWidth={0.5}
        transform={`rotate(-20, ${cx}, ${NOTE_HEAD_Y})`} />
      <path d={upVPath(cx)} stroke={noteColor} strokeWidth={V_STROKE} fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      <text x={cx} y={DIR_LABEL_Y} textAnchor="middle" fontSize={12} fill={labelColor}
        fontFamily="DM Sans, sans-serif" fontWeight="600">up</text>
      <text x={cx} y={BEAT_LABEL_Y} textAnchor="middle" fontSize={14} fill={labelColor}
        fontFamily="DM Sans, sans-serif" fontWeight={isActive ? '700' : '600'}>{label}</text>
    </g>
  );
}

/**
 * Renders an implicit D+U eighth-note pair spanning even slot i and odd slot i+1.
 * Both stems point UP, connected by a horizontal beam at the top.
 * V (down) under the D note head, Λ (up) under the U note head.
 * Label: "{beatNum} and" centered across the pair.
 */
function renderImplicitPair(
  evenIdx: number,
  isActive: boolean,
  color: string
): React.ReactNode {
  const cx = slotCenterX(evenIdx);     // center of even slot
  const noteColor  = isActive ? color : INACTIVE_NOTE_COLOR;
  const labelColor = isActive ? color : INACTIVE_LABEL_COLOR;

  // Two note heads close together — nearly touching, music-standard beam pair
  const cx1 = cx - 9;  // D (beat position)
  const cx2 = cx + 9;  // U ("and" position)

  const duNoteRx = 8;
  const duNoteRy = 5.5;

  // Stems attach to right edge of each note head, both go UP to shared beam
  const stem1X = cx1 + duNoteRx - 1;
  const stem2X = cx2 + duNoteRx - 1;
  const beamY  = STEM_TOP;
  const beamH  = 3.5;
  const stemY1 = beamY + beamH;
  const stemY2 = NOTE_HEAD_Y - duNoteRx + 2;

  const duHalfW = 5;
  const duStroke = 2.2;
  const beatNum = BEAT_NUMBERS[evenIdx];

  return (
    <g>
      {/* Beam */}
      <rect x={stem1X - 1} y={beamY} width={stem2X - stem1X + 2} height={beamH}
        fill={noteColor} rx={1} />
      {/* Stem 1 — up */}
      <line x1={stem1X} y1={stemY1} x2={stem1X} y2={stemY2}
        stroke={noteColor} strokeWidth={2} strokeLinecap="round" />
      {/* Stem 2 — up */}
      <line x1={stem2X} y1={stemY1} x2={stem2X} y2={stemY2}
        stroke={noteColor} strokeWidth={2} strokeLinecap="round" />
      {/* Note head 1 (D) */}
      <ellipse cx={cx1} cy={NOTE_HEAD_Y} rx={duNoteRx} ry={duNoteRy}
        fill={noteColor} transform={`rotate(-20, ${cx1}, ${NOTE_HEAD_Y})`} />
      {/* Note head 2 (U) */}
      <ellipse cx={cx2} cy={NOTE_HEAD_Y} rx={duNoteRx} ry={duNoteRy}
        fill={noteColor} transform={`rotate(-20, ${cx2}, ${NOTE_HEAD_Y})`} />
      {/* V — under D note */}
      <path d={`M ${cx1 - duHalfW} ${V_TOP_Y} L ${cx1} ${V_BOTTOM_Y} L ${cx1 + duHalfW} ${V_TOP_Y}`}
        stroke={noteColor} strokeWidth={duStroke} fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Λ — under U note */}
      <path d={`M ${cx2 - duHalfW} ${V_BOTTOM_Y} L ${cx2} ${V_TOP_Y} L ${cx2 + duHalfW} ${V_BOTTOM_Y}`}
        stroke={noteColor} strokeWidth={duStroke} fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Direction: "down-up" centered across pair */}
      <text x={cx} y={DIR_LABEL_Y} textAnchor="middle" fontSize={12} fill={labelColor}
        fontFamily="DM Sans, sans-serif" fontWeight="600">down-up</text>
      {/* Beat label: "{n} and" centered */}
      <text x={cx} y={BEAT_LABEL_Y} textAnchor="middle" fontSize={14} fill={labelColor}
        fontFamily="DM Sans, sans-serif" fontWeight={isActive ? '700' : '600'}>
        {beatNum} and
      </text>
    </g>
  );
}

/**
 * Renders a DU slot (explicit single-slot eighth pair).
 * Same visual as implicit pair but centered on one slot column.
 */
function renderDUSlot(cx: number, isActive: boolean, color: string, label: string): React.ReactNode {
  const noteColor  = isActive ? color : INACTIVE_NOTE_COLOR;
  const labelColor = isActive ? color : INACTIVE_LABEL_COLOR;

  const cx1 = cx - 9;
  const cx2 = cx + 9;
  const duNoteRx = 8;
  const duNoteRy = 5.5;
  const stem1X = cx1 + duNoteRx - 1;
  const stem2X = cx2 + duNoteRx - 1;
  const beamY  = STEM_TOP;
  const beamH  = 3.5;
  const stemY1 = beamY + beamH;
  const stemY2 = NOTE_HEAD_Y - duNoteRx + 2;
  const duHalfW = 5;
  const duStroke = 2.2;

  return (
    <g>
      <rect x={stem1X - 1} y={beamY} width={stem2X - stem1X + 2} height={beamH}
        fill={noteColor} rx={1} />
      <line x1={stem1X} y1={stemY1} x2={stem1X} y2={stemY2}
        stroke={noteColor} strokeWidth={2} strokeLinecap="round" />
      <line x1={stem2X} y1={stemY1} x2={stem2X} y2={stemY2}
        stroke={noteColor} strokeWidth={2} strokeLinecap="round" />
      <ellipse cx={cx1} cy={NOTE_HEAD_Y} rx={duNoteRx} ry={duNoteRy}
        fill={noteColor} transform={`rotate(-20, ${cx1}, ${NOTE_HEAD_Y})`} />
      <ellipse cx={cx2} cy={NOTE_HEAD_Y} rx={duNoteRx} ry={duNoteRy}
        fill={noteColor} transform={`rotate(-20, ${cx2}, ${NOTE_HEAD_Y})`} />
      <path d={`M ${cx1 - duHalfW} ${V_TOP_Y} L ${cx1} ${V_BOTTOM_Y} L ${cx1 + duHalfW} ${V_TOP_Y}`}
        stroke={noteColor} strokeWidth={duStroke} fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${cx2 - duHalfW} ${V_BOTTOM_Y} L ${cx2} ${V_TOP_Y} L ${cx2 + duHalfW} ${V_BOTTOM_Y}`}
        stroke={noteColor} strokeWidth={duStroke} fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      <text x={cx} y={DIR_LABEL_Y} textAnchor="middle" fontSize={12} fill={labelColor}
        fontFamily="DM Sans, sans-serif" fontWeight="600">down-up</text>
      <text x={cx} y={BEAT_LABEL_Y} textAnchor="middle" fontSize={14} fill={labelColor}
        fontFamily="DM Sans, sans-serif" fontWeight={isActive ? '700' : '600'}>{label}</text>
    </g>
  );
}

/**
 * Renders a tied quarter note at an even-slot rest that follows an eighth-note pair.
 * No stem, no direction arrow, no direction word.
 * A curved tie arc connects from the prior U note head (at slot i-1) to this head.
 * Beat label below.
 */
function renderTiedQuarter(
  slotIndex: number,
  isActive: boolean,
  color: string
): React.ReactNode {
  const cx        = slotCenterX(slotIndex);
  const priorCx2  = slotCenterX(slotIndex - 1) + 9; // cx2 of the prior pair's U note
  const noteColor  = isActive ? color : INACTIVE_NOTE_COLOR;
  const labelColor = isActive ? color : INACTIVE_LABEL_COLOR;
  const beatNum   = BEAT_NUMBERS[slotIndex];

  // Tie arc: SVG cubic bezier curving below note heads
  const tieY1 = NOTE_HEAD_Y + NOTE_HEAD_R + 1;
  const tieY2 = NOTE_HEAD_Y + NOTE_HEAD_R + 1;
  const tieMidY = tieY1 + 9; // arc depth
  const tiePath = `M ${priorCx2} ${tieY1} Q ${(priorCx2 + cx) / 2} ${tieMidY} ${cx} ${tieY2}`;

  return (
    <g>
      {/* Tie arc — curved line below note heads */}
      <path d={tiePath} stroke={noteColor} strokeWidth={1.5} fill="none"
        strokeLinecap="round" opacity={0.85} />
      {/* Tied note head — filled oval, no stem */}
      <ellipse cx={cx} cy={NOTE_HEAD_Y} rx={NOTE_HEAD_R + 1} ry={NOTE_HEAD_R - 2.5}
        fill={noteColor} stroke={noteColor} strokeWidth={0.5}
        transform={`rotate(-20, ${cx}, ${NOTE_HEAD_Y})`} />
      {/* Beat label only — no direction word, no V/Λ */}
      <text x={cx} y={BEAT_LABEL_Y} textAnchor="middle" fontSize={14} fill={labelColor}
        fontFamily="DM Sans, sans-serif" fontWeight={isActive ? '700' : '600'}>{beatNum}</text>
    </g>
  );
}

// ── Main diagram component ────────────────────────────────────────────────────

export function StrumPatternDiagram({
  notation,
  activeSlot = -1,
  accentColor = '#fde047',
  compact = false,
}: Props) {
  const slots: StrumSlot[] = [...notation];
  while (slots.length < 8) slots.push('_');

  // Find all implicit D+U eighth-note pairs
  const implicitPairs = findImplicitPairs(slots);

  const svgProps = compact
    ? { width: '100%', height: undefined, style: { display: 'block' } }
    : { width: SVG_W, height: SVG_H, style: { display: 'block', minWidth: SVG_W } };

  return (
    <div className={compact ? 'w-full' : 'w-full overflow-x-auto'}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="xMidYMid meet"
        {...svgProps}
        aria-label="Strum pattern notation"
      >
        {/* Active slot highlight */}
        {activeSlot >= 0 && activeSlot < 8 && (
          <rect
            x={activeSlot * SLOT_W + 1} y={0}
            width={SLOT_W - 2} height={SVG_H - 10}
            fill={accentColor} opacity={0.15} rx={3}
          />
        )}

        {slots.map((slot, i) => {
          const cx       = slotCenterX(i);
          const isActive = i === activeSlot;
          const color    = accentColor;
          const label    = BEAT_LABELS[i];

          // ── Skip: odd slot consumed by an implicit pair ──────────────────
          if (i % 2 === 1 && implicitPairs.has(i - 1)) {
            return null;
          }

          // ── Implicit eighth-note pair (D at even + U at odd) ─────────────
          if (implicitPairs.has(i)) {
            return (
              <g key={i}>
                {renderImplicitPair(i, isActive, color)}
              </g>
            );
          }

          // ── Tied quarter note (even rest after an implicit pair) ──────────
          if (isTiedQuarter(slots, i, implicitPairs)) {
            return (
              <g key={i}>
                {renderTiedQuarter(i, isActive, color)}
              </g>
            );
          }

          // ── Standard rest — blank ─────────────────────────────────────────
          if (slot === '_') return null;

          // ── Half note ────────────────────────────────────────────────────
          if (slot === 'H') {
            return <g key={i}>{renderHalfNote(cx, isActive, color, label)}</g>;
          }

          // ── Quarter down ─────────────────────────────────────────────────
          if (slot === 'D') {
            return <g key={i}>{renderQuarterDown(cx, isActive, color, label)}</g>;
          }

          // ── Quarter up ───────────────────────────────────────────────────
          if (slot === 'U') {
            return <g key={i}>{renderQuarterUp(cx, isActive, color, label)}</g>;
          }

          // ── Explicit DU slot ─────────────────────────────────────────────
          if (slot === 'DU') {
            const duLabel = `${BEAT_NUMBERS[i]} and`;
            return <g key={i}>{renderDUSlot(cx, isActive, color, duLabel)}</g>;
          }

          return null;
        })}

        {/* Separator line above direction + beat labels */}
        <line
          x1={0} y1={DIR_LABEL_Y - 7}
          x2={SVG_W} y2={DIR_LABEL_Y - 7}
          stroke="#3f3f46" strokeWidth={0.5}
        />
      </svg>
    </div>
  );
}

// Compact version for card grid
export function StrumPatternDiagramCompact({
  notation,
  accentColor = '#fde047',
}: {
  notation: StrumSlot[];
  accentColor?: string;
}) {
  return (
    <StrumPatternDiagram
      notation={notation}
      accentColor={accentColor}
      compact
    />
  );
}
