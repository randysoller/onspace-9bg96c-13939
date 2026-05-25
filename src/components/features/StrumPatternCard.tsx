/**
 * StrumPatternCard — compact card shown in the Strum Vault grid.
 * Displays the pattern label, compact SVG notation, category, style badges.
 * Tapping opens the StrumDetailModal.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { StrumPatternDiagramCompact, type StrumSlot } from './StrumPatternDiagram';

export interface StrumPattern {
  id: string;
  sheet_number: number;
  pattern_number: number;
  label: string;
  time_signature: string;
  category: string;
  style: string;
  notation: StrumSlot[];
  notes?: string;
}

interface Props {
  pattern: StrumPattern;
  onTap: (pattern: StrumPattern) => void;
  accentColor?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'quarter-notes': 'Quarters',
  'quarters-eighths': 'Qtrs + 8ths',
  'sixteenths': 'Sixteenths',
  'half-whole': 'Half / Whole',
};

export function StrumPatternCard({ pattern, onTap, accentColor = '#fde047' }: Props) {
  return (
    <motion.button
      onClick={() => onTap(pattern)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="w-full text-left bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 cursor-pointer hover:border-zinc-700 transition-colors group"
      style={{ borderTopWidth: '3px', borderTopColor: accentColor }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-bold text-white">{pattern.label}</span>
        <div className="flex items-center gap-1.5">
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
          >
            {CATEGORY_LABELS[pattern.category] ?? pattern.category}
          </span>
        </div>
      </div>

      {/* Compact notation diagram */}
      <div className="overflow-hidden rounded-lg bg-zinc-950/60 p-1.5">
        <StrumPatternDiagramCompact notation={pattern.notation} accentColor={accentColor} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-zinc-500">{pattern.style}</span>
        <span className="text-[10px] text-zinc-500">{pattern.time_signature}</span>
      </div>
    </motion.button>
  );
}
