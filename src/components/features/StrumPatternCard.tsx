/**
 * StrumPatternCard — 2-column grid card for Strum Vault.
 *
 * Layout:
 * - Checkbox top-left (stops propagation — toggles selection only)
 * - Pattern label + category badge in header row
 * - Compact SVG notation diagram
 * - Style + time signature footer
 * - Tapping anywhere except checkbox opens the StrumDetailModal
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
  isSelected: boolean;
  onTap: (pattern: StrumPattern) => void;
  onToggleSelect: () => void;
  accentColor?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'quarter-notes': 'Quarters',
  'quarters-eighths': 'Qtrs + 8ths',
  'sixteenths': 'Sixteenths',
  'half-whole': 'Half / Whole',
};

export function StrumPatternCard({
  pattern,
  isSelected,
  onTap,
  onToggleSelect,
  accentColor = '#fde047',
}: Props) {
  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.15 }}
      onClick={() => onTap(pattern)}
      className="w-full text-left bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 cursor-pointer hover:border-zinc-700 transition-colors group"
      style={{
        borderTopWidth: '3px',
        borderTopColor: isSelected ? accentColor : 'rgba(63,63,70,0.6)',
      }}
    >
      {/* Header row: checkbox + label + category badge */}
      <div className="flex items-start gap-2 mb-2">
        {/* Checkbox — stops propagation so card tap still opens modal */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
          className="flex-shrink-0 mt-[1px]"
          aria-label={isSelected ? 'Deselect pattern' : 'Select pattern'}
        >
          <div
            className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
            style={{
              backgroundColor: isSelected ? accentColor : 'transparent',
              borderColor: isSelected ? accentColor : '#52525b',
            }}
          >
            {isSelected && (
              <svg className="w-3 h-3" style={{ color: '#000' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </button>

        {/* Pattern label */}
        <span className="flex-1 text-[13px] font-bold text-white leading-tight">{pattern.label}</span>

        {/* Category badge */}
        <span
          className="flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
        >
          {CATEGORY_LABELS[pattern.category] ?? pattern.category}
        </span>
      </div>

      {/* Compact notation diagram */}
      <div className="overflow-hidden rounded-lg bg-zinc-950/60 p-1.5">
        <StrumPatternDiagramCompact notation={pattern.notation} accentColor={accentColor} />
      </div>

      {/* Footer: time signature only (category removed) */}
      <div className="flex items-center justify-end mt-2">
        <span className="text-[12px] font-semibold text-zinc-300">{pattern.time_signature}</span>
      </div>
    </motion.div>
  );
}
