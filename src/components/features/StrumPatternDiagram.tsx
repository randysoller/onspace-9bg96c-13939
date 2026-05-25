/**
 * StrumPatternDiagram — SVG music notation renderer for strum patterns.
 *
 * Each pattern is an 8-slot array representing eighth-note positions across
 * one 4/4 measure: [beat1, 1+, beat2, 2+, beat3, 3+, beat4, 4+]
 *
 * Slot values:
 *   'H'  — half note downstroke (held 2 beats, renders across 4 slots)
 *   'D'  — quarter note downstroke
 *   'U'  — quarter note upstroke (rare)
 *   'DU' — eighth-note pair (down on beat, up on +)
 *   '_'  — rest / inferred hold
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

const BEAT_LABELS = ['1', '+', '2', '+', '3', '+', '4', '+'];
const FULL_BEAT_LABELS = ['1', '1+', '2', '2+', '3', '3+', '4', '4+'];

// SVG layout constants
const SLOT_W = 38;
const SVG_W = SLOT_W * 8; // 304
const SVG_H = 96;

// Y positions
const STEM_TOP = 8;
const NOTE_HEAD_Y = 32;
const NOTE_HEAD_R = 6;
const STEM_BOTTOM = NOTE_HEAD_Y - NOTE_HEAD_R; // 26
const ARROW_Y = NOTE_HEAD_Y + NOTE_HEAD_R + 6;  // 44
const BEAM_Y = STEM_TOP + 4; // for beamed eighth pairs
const BEAT_LABEL_Y = SVG_H - 8;

const INACTIVE_NOTE_COLOR = '#a1a1aa'; // zinc-400
const INACTIVE_LABEL_COLOR = '#52525b'; // zinc-600
const REST_COLOR = '#3f3f46'; // zinc-700

function slotCenterX(slotIndex: number): number {
  return slotIndex * SLOT_W + SLOT_W / 2;
}

// Down arrow path from a center X
function downArrowPath(cx: number, y: number, size = 9): string {
  const half = size / 2;
  return `M ${cx} ${y} L ${cx - half} ${y - size} M ${cx} ${y} L ${cx + half} ${y - size} M ${cx} ${y} L ${cx} ${y - size * 1.6}`;
}

// Up arrow path from a center X
function upArrowPath(cx: number, y: number, size = 9): string {
  const half = size / 2;
  return `M ${cx} ${y} L ${cx - half} ${y + size} M ${cx} ${y} L ${cx + half} ${y + size} M ${cx} ${y} L ${cx} ${y + size * 1.6}`;
}

interface SlotRenderProps {
  slot: StrumSlot;
  slotIndex: number;
  isActive: boolean;
  color: string;
  labelColor: string;
}

function renderSlot({ slot, slotIndex, isActive, color, labelColor }: SlotRenderProps): React.ReactNode {
  const cx = slotCenterX(slotIndex);
  const label = BEAT_LABELS[slotIndex];

  if (slot === '_') {
    return (
      <g key={slotIndex}>
        {/* Ghost rest marker — short dash */}
        <line
          x1={cx - 6}
          y1={NOTE_HEAD_Y}
          x2={cx + 6}
          y2={NOTE_HEAD_Y}
          stroke={REST_COLOR}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <text x={cx} y={BEAT_LABEL_Y} textAnchor="middle" fontSize={9} fill={INACTIVE_LABEL_COLOR} fontFamily="DM Sans, sans-serif">
          {label}
        </text>
      </g>
    );
  }

  if (slot === 'H') {
    // Half note: open note head + long stem (spans 2 beats visually)
    const isActiveDue = isActive;
    const noteColor = isActiveDue ? color : INACTIVE_NOTE_COLOR;
    const lbColor = isActiveDue ? color : INACTIVE_LABEL_COLOR;
    return (
      <g key={slotIndex}>
        {/* Stem */}
        <line x1={cx + NOTE_HEAD_R - 1} y1={STEM_TOP} x2={cx + NOTE_HEAD_R - 1} y2={NOTE_HEAD_Y} stroke={noteColor} strokeWidth={1.8} />
        {/* Open note head */}
        <ellipse
          cx={cx}
          cy={NOTE_HEAD_Y}
          rx={NOTE_HEAD_R + 1}
          ry={NOTE_HEAD_R - 1}
          fill="none"
          stroke={noteColor}
          strokeWidth={1.8}
        />
        {/* Duration bridge — thin line extending right to show hold */}
        <line x1={cx + NOTE_HEAD_R + 1} y1={NOTE_HEAD_Y} x2={cx + SLOT_W * 3.5} y2={NOTE_HEAD_Y} stroke={noteColor} strokeWidth={0.8} strokeDasharray="3 3" />
        {/* Down arrow */}
        <path d={downArrowPath(cx, ARROW_Y + 2)} stroke={noteColor} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        {/* Beat label */}
        <text x={cx} y={BEAT_LABEL_Y} textAnchor="middle" fontSize={9} fill={lbColor} fontFamily="DM Sans, sans-serif" fontWeight={isActiveDue ? '700' : '400'}>
          {label}
        </text>
      </g>
    );
  }

  if (slot === 'D') {
    const noteColor = isActive ? color : INACTIVE_NOTE_COLOR;
    const lbColor = isActive ? color : INACTIVE_LABEL_COLOR;
    return (
      <g key={slotIndex}>
        {/* Stem */}
        <line x1={cx + NOTE_HEAD_R - 1} y1={STEM_TOP} x2={cx + NOTE_HEAD_R - 1} y2={NOTE_HEAD_Y} stroke={noteColor} strokeWidth={1.8} />
        {/* Filled note head */}
        <ellipse cx={cx} cy={NOTE_HEAD_Y} rx={NOTE_HEAD_R + 1} ry={NOTE_HEAD_R - 1} fill={noteColor} stroke={noteColor} strokeWidth={1} />
        {/* Down arrow */}
        <path d={downArrowPath(cx, ARROW_Y + 2)} stroke={noteColor} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        <text x={cx} y={BEAT_LABEL_Y} textAnchor="middle" fontSize={9} fill={lbColor} fontFamily="DM Sans, sans-serif" fontWeight={isActive ? '700' : '400'}>
          {label}
        </text>
      </g>
    );
  }

  if (slot === 'U') {
    const noteColor = isActive ? color : INACTIVE_NOTE_COLOR;
    const lbColor = isActive ? color : INACTIVE_LABEL_COLOR;
    return (
      <g key={slotIndex}>
        {/* Stem — goes down for upstroke */}
        <line x1={cx - NOTE_HEAD_R + 1} y1={NOTE_HEAD_Y} x2={cx - NOTE_HEAD_R + 1} y2={STEM_TOP + 4} stroke={noteColor} strokeWidth={1.8} />
        <ellipse cx={cx} cy={NOTE_HEAD_Y} rx={NOTE_HEAD_R + 1} ry={NOTE_HEAD_R - 1} fill={noteColor} stroke={noteColor} strokeWidth={1} />
        {/* Up arrow */}
        <path d={upArrowPath(cx, ARROW_Y - 4)} stroke={noteColor} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        <text x={cx} y={BEAT_LABEL_Y} textAnchor="middle" fontSize={9} fill={lbColor} fontFamily="DM Sans, sans-serif" fontWeight={isActive ? '700' : '400'}>
          {label}
        </text>
      </g>
    );
  }

  if (slot === 'DU') {
    // Eighth pair: two note heads, beamed at top, down+up arrows
    const noteColor = isActive ? color : INACTIVE_NOTE_COLOR;
    const lbColor = isActive ? color : INACTIVE_LABEL_COLOR;
    const cx2 = cx + SLOT_W * 0.48; // second note of the pair
    // First note head (downstroke)
    const cx1 = cx - SLOT_W * 0.15;
    return (
      <g key={slotIndex}>
        {/* Beam across top */}
        <line x1={cx1 + NOTE_HEAD_R - 1} y1={BEAM_Y} x2={cx2 + NOTE_HEAD_R - 1} y2={BEAM_Y} stroke={noteColor} strokeWidth={2.5} />
        {/* Stem 1 */}
        <line x1={cx1 + NOTE_HEAD_R - 1} y1={BEAM_Y} x2={cx1 + NOTE_HEAD_R - 1} y2={NOTE_HEAD_Y} stroke={noteColor} strokeWidth={1.8} />
        {/* Stem 2 */}
        <line x1={cx2 + NOTE_HEAD_R - 1} y1={BEAM_Y} x2={cx2 + NOTE_HEAD_R - 1} y2={NOTE_HEAD_Y} stroke={noteColor} strokeWidth={1.8} />
        {/* Note head 1 — down */}
        <ellipse cx={cx1} cy={NOTE_HEAD_Y} rx={NOTE_HEAD_R} ry={NOTE_HEAD_R - 1.5} fill={noteColor} />
        {/* Note head 2 — up */}
        <ellipse cx={cx2} cy={NOTE_HEAD_Y} rx={NOTE_HEAD_R} ry={NOTE_HEAD_R - 1.5} fill={noteColor} />
        {/* Down arrow under note 1 */}
        <path d={downArrowPath(cx1, ARROW_Y + 2, 7)} stroke={noteColor} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        {/* Up arrow under note 2 */}
        <path d={upArrowPath(cx2, ARROW_Y - 4, 7)} stroke={noteColor} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        {/* Beat label */}
        <text x={cx} y={BEAT_LABEL_Y} textAnchor="middle" fontSize={9} fill={lbColor} fontFamily="DM Sans, sans-serif" fontWeight={isActive ? '700' : '400'}>
          {label}
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

  const scale = compact ? 0.75 : 1;
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
        {/* Slot dividers */}
        {Array.from({ length: 9 }, (_, i) => (
          <line
            key={`div-${i}`}
            x1={i * SLOT_W}
            y1={0}
            x2={i * SLOT_W}
            y2={SVG_H - 16}
            stroke="#27272a"
            strokeWidth={i % 2 === 0 ? 1 : 0.5}
          />
        ))}

        {/* Active slot highlight background */}
        {activeSlot >= 0 && activeSlot < 8 && (
          <rect
            x={activeSlot * SLOT_W + 1}
            y={0}
            width={SLOT_W - 2}
            height={SVG_H - 14}
            fill={accentColor}
            opacity={0.12}
            rx={3}
          />
        )}

        {/* Render each slot */}
        {slots.map((slot, i) =>
          renderSlot({
            slot,
            slotIndex: i,
            isActive: i === activeSlot,
            color: accentColor,
            labelColor: i === activeSlot ? accentColor : INACTIVE_LABEL_COLOR,
          })
        )}

        {/* Bottom beat label separator line */}
        <line x1={0} y1={SVG_H - 18} x2={SVG_W} y2={SVG_H - 18} stroke="#27272a" strokeWidth={0.5} />
      </svg>
    </div>
  );
}

// Compact version for card grid
export function StrumPatternDiagramCompact({ notation, accentColor = '#fde047' }: { notation: StrumSlot[]; accentColor?: string }) {
  return <StrumPatternDiagram notation={notation} accentColor={accentColor} compact />;
}
