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
 *   '_'  — rest (renders as blank — no marker, no beat label)
 *
 * Visual style: music-standard notation on dark background.
 * - Note heads: white filled, tilted ellipse (~20° tilt, music-standard oval)
 * - Stems: vertical line from right side of note head going up
 * - Downstroke: bold "V" shape below note head
 * - Upstroke: inverted "V" (Λ shape) below note head
 * - Direction word: "down" / "up" / "down up" between arrow and beat label
 * - Rest slots: completely invisible — no SVG elements rendered
 * - Beat labels: only on active (non-rest) slots; DU uses "{n} and" format
 *
 * During playback, `activeSlot` highlights the current slot in the accent color.
 */

import React from 'react';

export type StrumSlot = 'H' | 'D' | 'U' | 'DU' | '_';

interface Props {
  notation: StrumSlot[];
  activeSlot?: number; // index 0–7, -1 or undefined = none active
  accentColor?: string;
  compact?: boolean; // smaller render for card view
}

// Beat number for each slot index (0-indexed)
const BEAT_NUMBERS = ['1', '1', '2', '2', '3', '3', '4', '4'];

// SVG layout constants
const SLOT_W = 38;
const SVG_W = SLOT_W * 8; // 304
const SVG_H = 110;

// Y positions — extra height added for direction word row below the V symbol
const STEM_TOP = 6;           // top of stem
const NOTE_HEAD_Y = 34;       // vertical center of note head
const NOTE_HEAD_R = 7;        // note head radius
const STEM_X_OFFSET = NOTE_HEAD_R - 1; // stem attaches to right side of head

// V symbol — larger, further from note head, heavier stroke
const V_TOP_Y = NOTE_HEAD_Y + NOTE_HEAD_R + 10; // 51 — more gap from note head
const V_BOTTOM_Y = V_TOP_Y + 16;               // 67 — taller V
const V_HALF_W = 11;          // wider V (was 8)
const V_STROKE = 3.0;         // heavier stroke (was 2.5)

// Text rows below V symbol
const DIR_LABEL_Y = V_BOTTOM_Y + 13;  // 80 — direction word ("down", "up", "down up")
const BEAT_LABEL_Y = DIR_LABEL_Y + 14; // 94 — beat number ("1", "2 and", etc.)

// Colors
const INACTIVE_NOTE_COLOR = '#e4e4e7'; // zinc-200 — near-white on dark bg
const INACTIVE_LABEL_COLOR = '#a1a1aa'; // zinc-400

function slotCenterX(slotIndex: number): number {
  return slotIndex * SLOT_W + SLOT_W / 2;
}

/**
 * "V" downstroke path: two lines from top-left and top-right meeting at bottom apex.
 * Standard music notation downstroke symbol.
 */
function downVPath(cx: number): string {
  return `M ${cx - V_HALF_W} ${V_TOP_Y} L ${cx} ${V_BOTTOM_Y} L ${cx + V_HALF_W} ${V_TOP_Y}`;
}

/**
 * Inverted V (Λ) upstroke path: two lines from bottom meeting at top apex.
 */
function upVPath(cx: number): string {
  return `M ${cx - V_HALF_W} ${V_BOTTOM_Y} L ${cx} ${V_TOP_Y} L ${cx + V_HALF_W} ${V_BOTTOM_Y}`;
}

/** Beat label text for a given slot — DU slots show "{n} and", others show beat number only */
function beatLabel(slotIndex: number, slot: StrumSlot): string {
  const num = BEAT_NUMBERS[slotIndex];
  return slot === 'DU' ? `${num} and` : num;
}

interface SlotRenderProps {
  slot: StrumSlot;
  slotIndex: number;
  isActive: boolean;
  color: string;
}

function renderSlot({ slot, slotIndex, isActive, color }: SlotRenderProps): React.ReactNode {
  const cx = slotCenterX(slotIndex);
  const noteColor = isActive ? color : INACTIVE_NOTE_COLOR;
  const labelColor = isActive ? color : INACTIVE_LABEL_COLOR;

  // Rest: render nothing — completely blank column
  if (slot === '_') return null;

  const bl = beatLabel(slotIndex, slot);

  // Half note: open note head + stem + V + dashed hold line + direction word + beat label
  if (slot === 'H') {
    return (
      <g key={slotIndex}>
        {/* Stem */}
        <line
          x1={cx + STEM_X_OFFSET}
          y1={STEM_TOP}
          x2={cx + STEM_X_OFFSET}
          y2={NOTE_HEAD_Y - NOTE_HEAD_R + 1}
          stroke={noteColor}
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* Open note head (half note = unfilled) */}
        <ellipse
          cx={cx}
          cy={NOTE_HEAD_Y}
          rx={NOTE_HEAD_R + 1}
          ry={NOTE_HEAD_R - 1.5}
          fill="none"
          stroke={noteColor}
          strokeWidth={2}
          transform={`rotate(-20, ${cx}, ${NOTE_HEAD_Y})`}
        />
        {/* Dashed hold bridge extending to the right */}
        <line
          x1={cx + NOTE_HEAD_R + 2}
          y1={NOTE_HEAD_Y}
          x2={cx + SLOT_W * 3.4}
          y2={NOTE_HEAD_Y}
          stroke={noteColor}
          strokeWidth={0.8}
          strokeDasharray="3 3"
          opacity={0.5}
        />
        {/* V downstroke symbol */}
        <path d={downVPath(cx)} stroke={noteColor} strokeWidth={V_STROKE} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Direction word */}
        <text x={cx} y={DIR_LABEL_Y} textAnchor="middle" fontSize={8} fill={labelColor} fontFamily="DM Sans, sans-serif" fontWeight="500" letterSpacing="0.3">
          down
        </text>
        {/* Beat label */}
        <text x={cx} y={BEAT_LABEL_Y} textAnchor="middle" fontSize={10} fill={labelColor} fontFamily="DM Sans, sans-serif" fontWeight={isActive ? '700' : '500'}>
          {bl}
        </text>
      </g>
    );
  }

  // Quarter note downstroke: filled note head + stem + V + direction word + beat label
  if (slot === 'D') {
    return (
      <g key={slotIndex}>
        {/* Stem */}
        <line
          x1={cx + STEM_X_OFFSET}
          y1={STEM_TOP}
          x2={cx + STEM_X_OFFSET}
          y2={NOTE_HEAD_Y - NOTE_HEAD_R + 1}
          stroke={noteColor}
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* Filled note head — tilted ellipse (~20°, music-notation standard oval) */}
        <ellipse
          cx={cx}
          cy={NOTE_HEAD_Y}
          rx={NOTE_HEAD_R + 1}
          ry={NOTE_HEAD_R - 2}
          fill={noteColor}
          stroke={noteColor}
          strokeWidth={0.5}
          transform={`rotate(-20, ${cx}, ${NOTE_HEAD_Y})`}
        />
        {/* V downstroke symbol */}
        <path d={downVPath(cx)} stroke={noteColor} strokeWidth={V_STROKE} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Direction word */}
        <text x={cx} y={DIR_LABEL_Y} textAnchor="middle" fontSize={8} fill={labelColor} fontFamily="DM Sans, sans-serif" fontWeight="500" letterSpacing="0.3">
          down
        </text>
        {/* Beat label */}
        <text x={cx} y={BEAT_LABEL_Y} textAnchor="middle" fontSize={10} fill={labelColor} fontFamily="DM Sans, sans-serif" fontWeight={isActive ? '700' : '500'}>
          {bl}
        </text>
      </g>
    );
  }

  // Quarter note upstroke: filled note head (stem down) + inverted V + direction word + beat label
  if (slot === 'U') {
    return (
      <g key={slotIndex}>
        {/* Stem from left side going down for upstroke */}
        <line
          x1={cx - STEM_X_OFFSET}
          y1={NOTE_HEAD_Y + NOTE_HEAD_R - 1}
          x2={cx - STEM_X_OFFSET}
          y2={NOTE_HEAD_Y + NOTE_HEAD_R + 22}
          stroke={noteColor}
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* Filled note head */}
        <ellipse
          cx={cx}
          cy={NOTE_HEAD_Y}
          rx={NOTE_HEAD_R + 1}
          ry={NOTE_HEAD_R - 2}
          fill={noteColor}
          stroke={noteColor}
          strokeWidth={0.5}
          transform={`rotate(-20, ${cx}, ${NOTE_HEAD_Y})`}
        />
        {/* Inverted V (Λ) upstroke symbol */}
        <path d={upVPath(cx)} stroke={noteColor} strokeWidth={V_STROKE} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Direction word */}
        <text x={cx} y={DIR_LABEL_Y} textAnchor="middle" fontSize={8} fill={labelColor} fontFamily="DM Sans, sans-serif" fontWeight="500" letterSpacing="0.3">
          up
        </text>
        {/* Beat label */}
        <text x={cx} y={BEAT_LABEL_Y} textAnchor="middle" fontSize={10} fill={labelColor} fontFamily="DM Sans, sans-serif" fontWeight={isActive ? '700' : '500'}>
          {bl}
        </text>
      </g>
    );
  }

  // Eighth-note pair (DU): two beamed notes, V under first, Λ under second,
  // "down up" direction label, "{n} and" beat label
  if (slot === 'DU') {
    const cx1 = cx - 9;  // down note (beat)
    const cx2 = cx + 9;  // up note (the "and")
    const beamY = STEM_TOP + 3;

    // V under down note — same size as quarter note V
    const vCx1 = cx1;
    const vCx2 = cx2;
    // Scale V slightly smaller so both fit side-by-side within SLOT_W
    const duHalfW = V_HALF_W - 2; // 9px
    const duStroke = V_STROKE - 0.2; // 2.8

    return (
      <g key={slotIndex}>
        {/* Beam connecting both stems at top */}
        <rect
          x={cx1 + STEM_X_OFFSET - 1}
          y={beamY}
          width={cx2 - cx1 + 2}
          height={3.5}
          fill={noteColor}
          rx={1}
        />
        {/* Stem 1 (down note) */}
        <line
          x1={cx1 + STEM_X_OFFSET}
          y1={beamY + 3}
          x2={cx1 + STEM_X_OFFSET}
          y2={NOTE_HEAD_Y - NOTE_HEAD_R + 2}
          stroke={noteColor}
          strokeWidth={2}
        />
        {/* Stem 2 (up note) */}
        <line
          x1={cx2 + STEM_X_OFFSET}
          y1={beamY + 3}
          x2={cx2 + STEM_X_OFFSET}
          y2={NOTE_HEAD_Y - NOTE_HEAD_R + 2}
          stroke={noteColor}
          strokeWidth={2}
        />
        {/* Note head 1 — down — 20° tilt */}
        <ellipse
          cx={cx1}
          cy={NOTE_HEAD_Y}
          rx={NOTE_HEAD_R}
          ry={NOTE_HEAD_R - 2}
          fill={noteColor}
          transform={`rotate(-20, ${cx1}, ${NOTE_HEAD_Y})`}
        />
        {/* Note head 2 — up — 20° tilt */}
        <ellipse
          cx={cx2}
          cy={NOTE_HEAD_Y}
          rx={NOTE_HEAD_R}
          ry={NOTE_HEAD_R - 2}
          fill={noteColor}
          transform={`rotate(-20, ${cx2}, ${NOTE_HEAD_Y})`}
        />
        {/* V under down note */}
        <path
          d={`M ${vCx1 - duHalfW} ${V_TOP_Y} L ${vCx1} ${V_BOTTOM_Y} L ${vCx1 + duHalfW} ${V_TOP_Y}`}
          stroke={noteColor}
          strokeWidth={duStroke}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Λ under up note */}
        <path
          d={`M ${vCx2 - duHalfW} ${V_BOTTOM_Y} L ${vCx2} ${V_TOP_Y} L ${vCx2 + duHalfW} ${V_BOTTOM_Y}`}
          stroke={noteColor}
          strokeWidth={duStroke}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Direction word — centered across both notes */}
        <text x={cx} y={DIR_LABEL_Y} textAnchor="middle" fontSize={8} fill={labelColor} fontFamily="DM Sans, sans-serif" fontWeight="500" letterSpacing="0.3">
          down up
        </text>
        {/* Beat label — "{n} and" format */}
        <text x={cx} y={BEAT_LABEL_Y} textAnchor="middle" fontSize={10} fill={labelColor} fontFamily="DM Sans, sans-serif" fontWeight={isActive ? '700' : '500'}>
          {bl}
        </text>
      </g>
    );
  }

  return null;
}

export function StrumPatternDiagram({ notation, activeSlot = -1, accentColor = '#fde047', compact = false }: Props) {
  // Pad or trim notation to 8 slots
  const slots: StrumSlot[] = [...notation];
  while (slots.length < 8) slots.push('_');

  const scale = compact ? 0.82 : 1;
  const displayW = SVG_W * scale;
  const displayH = SVG_H * scale;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width={displayW}
        height={displayH}
        style={{ display: 'block', minWidth: displayW }}
        aria-label="Strum pattern notation"
      >
        {/* Active slot highlight background */}
        {activeSlot >= 0 && activeSlot < 8 && (
          <rect
            x={activeSlot * SLOT_W + 1}
            y={0}
            width={SLOT_W - 2}
            height={SVG_H - 14}
            fill={accentColor}
            opacity={0.15}
            rx={3}
          />
        )}

        {/* Render each slot — rests render nothing */}
        {slots.map((slot, i) =>
          renderSlot({
            slot,
            slotIndex: i,
            isActive: i === activeSlot,
            color: accentColor,
          })
        )}

        {/* Subtle separator line above direction + beat labels */}
        <line x1={0} y1={DIR_LABEL_Y - 6} x2={SVG_W} y2={DIR_LABEL_Y - 6} stroke="#3f3f46" strokeWidth={0.5} />
      </svg>
    </div>
  );
}

// Compact version for card grid
export function StrumPatternDiagramCompact({ notation, accentColor = '#fde047' }: { notation: StrumSlot[]; accentColor?: string }) {
  return <StrumPatternDiagram notation={notation} accentColor={accentColor} compact />;
}
