/**
 * StrumVault — Strum Pattern Vault page.
 *
 * Layout:
 * - Page header with banana yellow accent and tagline
 * - Filter rail: Rhythm Type + Style
 * - Pattern card grid (2 columns on mobile, 2–3 on desktop)
 * - Empty state when no patterns match filters
 * - StrumDetailModal opens on card tap
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sliders, ChevronLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useStrumVaultStore, type RhythmTypeFilter, type StyleFilter } from '@/stores/strumVaultStore';
import { StrumPatternCard, type StrumPattern } from '@/components/features/StrumPatternCard';
import { StrumDetailModal } from '@/components/features/StrumDetailModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const ACCENT = '#fde047';

const RHYTHM_TYPES: { value: RhythmTypeFilter; label: string }[] = [
  { value: 'all', label: 'All Rhythms' },
  { value: 'quarter-notes', label: 'Quarter Notes' },
  { value: 'quarters-eighths', label: 'Qtrs + 8ths' },
  { value: 'sixteenths', label: 'Sixteenths' },
  { value: 'half-whole', label: 'Half & Whole' },
];

const STYLES: { value: StyleFilter; label: string }[] = [
  { value: 'all', label: 'All Styles' },
  { value: 'Rock', label: 'Rock' },
  { value: 'Pop', label: 'Pop' },
  { value: 'Folk', label: 'Folk' },
  { value: 'Country', label: 'Country' },
  { value: 'Blues', label: 'Blues' },
  { value: 'Jazz', label: 'Jazz' },
  { value: 'Latin', label: 'Latin' },
  { value: 'Funk', label: 'Funk' },
  { value: 'R&B', label: 'R&B' },
];

async function fetchStrumPatterns(): Promise<StrumPattern[]> {
  const { data, error } = await supabase
    .from('strum_patterns')
    .select('*')
    .order('sheet_number', { ascending: true })
    .order('pattern_number', { ascending: true });

  if (error) throw error;
  return (data ?? []) as StrumPattern[];
}

export default function StrumVault() {
  const navigate = useNavigate();
  const { rhythmType, style, setRhythmType, setStyle, reset } = useStrumVaultStore();
  const [selectedPattern, setSelectedPattern] = useState<StrumPattern | null>(null);

  const { data: patterns = [], isLoading, error } = useQuery({
    queryKey: ['strum-patterns'],
    queryFn: fetchStrumPatterns,
    staleTime: 10 * 60_000, // 10 min — static content
  });

  // Client-side filter (all data loaded once)
  const filteredPatterns = useMemo(() => {
    return patterns.filter(p => {
      if (rhythmType !== 'all' && p.category !== rhythmType) return false;
      if (style !== 'all' && p.style !== style) return false;
      return true;
    });
  }, [patterns, rhythmType, style]);

  const hasActiveFilters = rhythmType !== 'all' || style !== 'all';

  return (
    <div className="min-h-screen bg-black text-white pb-28">
      {/* ── Page header ── */}
      <div
        className="border-b border-zinc-800 px-4 pt-4 pb-5"
        style={{ borderTopWidth: '3px', borderTopColor: ACCENT }}
      >
        <div className="max-w-2xl mx-auto">
          {/* Back nav */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
              style={{ backgroundColor: ACCENT, boxShadow: `0 4px 16px ${ACCENT}44` }}
            >
              <Sliders className="w-6 h-6 text-black" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white leading-tight">Strum Pattern Vault</h1>
              <p className="text-sm text-zinc-400 mt-0.5">Every rhythm pattern you need, organized and playable.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        {/* ── Filter rail ── */}
        <div className="space-y-3 mb-5">
          {/* Rhythm Type */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Rhythm Type</p>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {RHYTHM_TYPES.map(rt => {
                const isActive = rhythmType === rt.value;
                return (
                  <button
                    key={rt.value}
                    onClick={() => setRhythmType(rt.value)}
                    className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all"
                    style={{
                      backgroundColor: isActive ? ACCENT : '#27272a',
                      color: isActive ? '#000000' : '#a1a1aa',
                      border: isActive ? 'none' : '1px solid #3f3f46',
                    }}
                  >
                    {rt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Style</p>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {STYLES.map(st => {
                const isActive = style === st.value;
                return (
                  <button
                    key={st.value}
                    onClick={() => setStyle(st.value)}
                    className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all"
                    style={{
                      backgroundColor: isActive ? ACCENT : '#27272a',
                      color: isActive ? '#000000' : '#a1a1aa',
                      border: isActive ? 'none' : '1px solid #3f3f46',
                    }}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset filters */}
          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={reset}
              className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset filters
            </motion.button>
          )}
        </div>

        {/* ── Results count ── */}
        {!isLoading && !error && (
          <p className="text-[11px] text-zinc-500 mb-3">
            {filteredPatterns.length} pattern{filteredPatterns.length !== 1 ? 's' : ''}
            {hasActiveFilters ? ' matching filters' : ' total'}
          </p>
        )}

        {/* ── States ── */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner aria-label="Loading strum patterns" />
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-sm">Failed to load strum patterns.</p>
          </div>
        )}

        {!isLoading && !error && filteredPatterns.length === 0 && (
          <div className="text-center py-16">
            <Sliders className="w-10 h-10 mx-auto mb-3" style={{ color: ACCENT, opacity: 0.4 }} />
            <p className="text-zinc-400 text-sm font-medium mb-1">No patterns found</p>
            <p className="text-zinc-600 text-xs">Try adjusting your filters</p>
          </div>
        )}

        {/* ── Pattern grid ── */}
        {!isLoading && !error && filteredPatterns.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPatterns.map((pattern, i) => (
              <motion.div
                key={pattern.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
              >
                <StrumPatternCard
                  pattern={pattern}
                  onTap={setSelectedPattern}
                  accentColor={ACCENT}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Detail modal ── */}
      <StrumDetailModal
        pattern={selectedPattern}
        onClose={() => setSelectedPattern(null)}
      />
    </div>
  );
}
