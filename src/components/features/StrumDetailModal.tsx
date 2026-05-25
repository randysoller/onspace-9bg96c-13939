/**
 * StrumDetailModal — full-screen modal for an individual strum pattern.
 *
 * Features:
 * - Full-size SVG notation diagram with active-slot highlighting during playback
 * - Chord picker: search bar → filtered list from CHORD_DATABASE → select one chord
 * - Play/Stop button: plays pattern at metronome BPM, synced to chord audio
 * - BPM display pulled live from metronomeStore
 * - Beat count labels animate in accent color during playback
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Square, Music, ChevronDown, Search, Clock } from 'lucide-react';
import { StrumPatternDiagram } from './StrumPatternDiagram';
import { useStrumPatternAudio } from '@/hooks/useStrumPatternAudio';
import { CHORD_DATABASE } from '@/constants/chords-index';
import { useMetronomeStore } from '@/stores/metronomeStore';
import type { StrumPattern } from './StrumPatternCard';
import type { ChordData } from '@/types/chord';

const ACCENT = '#fde047'; // banana yellow

const CATEGORY_LABELS: Record<string, string> = {
  'quarter-notes': 'Quarter Notes',
  'quarters-eighths': 'Quarters & Eighths',
  'sixteenths': 'Sixteenths',
  'half-whole': 'Half & Whole Notes',
};

// Build a deduplicated list of chord names for the picker
const UNIQUE_CHORD_NAMES = Array.from(
  new Map(CHORD_DATABASE.map(c => [c.name, c])).values()
).map(c => c.name).sort();

interface Props {
  pattern: StrumPattern | null;
  onClose: () => void;
}

export function StrumDetailModal({ pattern, onClose }: Props) {
  const bpm = useMetronomeStore(s => s.bpm);

  // Chord picker state
  const [chordSearch, setChordSearch] = useState('');
  const [selectedChordName, setSelectedChordName] = useState<string | null>(null);
  const [showChordPicker, setShowChordPicker] = useState(false);

  const { isPlaying, currentSlotIdx, playPattern, stopPlayback, setSelectedChord } = useStrumPatternAudio();

  // Resolve selected chord from CHORD_DATABASE
  const selectedChord: ChordData | null = useMemo(() => {
    if (!selectedChordName) return null;
    return CHORD_DATABASE.find(c => c.name === selectedChordName) ?? null;
  }, [selectedChordName]);

  // Keep audio hook's chord ref in sync
  useEffect(() => {
    setSelectedChord(selectedChord);
  }, [selectedChord, setSelectedChord]);

  // Stop playback when modal closes
  useEffect(() => {
    return () => { stopPlayback(); };
  }, [stopPlayback]);

  const filteredChords = useMemo(() => {
    if (!chordSearch.trim()) return UNIQUE_CHORD_NAMES.slice(0, 30);
    const q = chordSearch.toLowerCase();
    return UNIQUE_CHORD_NAMES.filter(n => n.toLowerCase().includes(q)).slice(0, 40);
  }, [chordSearch]);

  const handlePlayStop = useCallback(() => {
    if (!pattern) return;
    if (isPlaying) {
      stopPlayback();
    } else {
      playPattern(pattern.notation);
    }
  }, [pattern, isPlaying, playPattern, stopPlayback]);

  const handleChordSelect = useCallback((name: string) => {
    setSelectedChordName(name);
    setShowChordPicker(false);
    setChordSearch('');
  }, []);

  if (!pattern) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="strum-detail-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl pb-safe"
          style={{ borderTopWidth: '4px', borderTopColor: ACCENT, maxHeight: '92vh', overflowY: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-5">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4 pr-8">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: ACCENT, boxShadow: `0 4px 12px ${ACCENT}44` }}
              >
                <Music className="w-5 h-5 text-black" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">{pattern.label}</h2>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {CATEGORY_LABELS[pattern.category] ?? pattern.category}
                  </span>
                  <span className="text-[10px] text-zinc-500">{pattern.style}</span>
                  <span className="text-[10px] text-zinc-500">{pattern.time_signature}</span>
                </div>
              </div>
            </div>

            {/* Notation diagram */}
            <div className="bg-zinc-950/80 rounded-xl p-3 mb-4 overflow-hidden">
              <StrumPatternDiagram
                notation={pattern.notation}
                activeSlot={currentSlotIdx}
                accentColor={ACCENT}
                compact={false}
              />
            </div>

            {/* BPM indicator */}
            <div className="flex items-center gap-1.5 mb-4">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[11px] text-zinc-400">
                Playing at <span className="font-bold" style={{ color: ACCENT }}>{bpm} BPM</span>
                {' '}— change BPM in Metronome settings
              </span>
            </div>

            {/* Chord picker */}
            <div className="mb-4">
              <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5 block">
                Chord Sound
              </label>
              <button
                onClick={() => setShowChordPicker(!showChordPicker)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-600 transition-colors text-sm"
              >
                <span className={selectedChordName ? 'text-white font-semibold' : 'text-zinc-500'}>
                  {selectedChordName ?? 'Select a chord (optional)'}
                </span>
                <ChevronDown
                  className="w-4 h-4 text-zinc-400 transition-transform"
                  style={{ transform: showChordPicker ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              <AnimatePresence>
                {showChordPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1.5 bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
                      {/* Search input */}
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700">
                        <Search className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search chords..."
                          value={chordSearch}
                          onChange={(e) => setChordSearch(e.target.value)}
                          className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
                        />
                      </div>
                      {/* Clear selection */}
                      {selectedChordName && (
                        <button
                          onClick={() => { setSelectedChordName(null); setShowChordPicker(false); }}
                          className="w-full text-left px-3 py-2 text-[12px] text-zinc-400 hover:bg-zinc-700 transition-colors border-b border-zinc-700"
                        >
                          ✕ No chord (metronome click only)
                        </button>
                      )}
                      {/* Chord list */}
                      <div className="max-h-44 overflow-y-auto">
                        {filteredChords.length === 0 ? (
                          <p className="px-3 py-3 text-[12px] text-zinc-500">No chords found</p>
                        ) : (
                          filteredChords.map(name => (
                            <button
                              key={name}
                              onClick={() => handleChordSelect(name)}
                              className="w-full text-left px-3 py-2 text-[13px] font-medium hover:bg-zinc-700 transition-colors"
                              style={{ color: name === selectedChordName ? ACCENT : '#e4e4e7' }}
                            >
                              {name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Play / Stop button */}
            <motion.button
              onClick={handlePlayStop}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                backgroundColor: isPlaying ? '#27272a' : ACCENT,
                color: isPlaying ? ACCENT : '#000000',
                border: isPlaying ? `1.5px solid ${ACCENT}` : 'none',
              }}
            >
              {isPlaying ? (
                <>
                  <Square className="w-4 h-4" fill="currentColor" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" fill="currentColor" />
                  Play Pattern
                </>
              )}
            </motion.button>

            {/* Optional instructor notes */}
            {pattern.notes && (
              <p className="mt-3 text-[11px] text-zinc-500 leading-relaxed border-t border-zinc-800 pt-3">
                <span className="font-semibold text-zinc-400">Note: </span>{pattern.notes}
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
