
/**
 * StrumVault — Strum Pattern Vault page.
 *
 * Layout:
 * - Page header (banana yellow accent)
 * - Preset dropdown (3 named pack slots + custom name + Supabase cloud save)
 * - Filter rail: Rhythm Type + Style
 * - 2-column pattern grid with checkboxes
 * - StrumDetailModal on card tap
 *
 * Preset storage strategy:
 * - Authenticated: Supabase user_presets table
 *   filters: { strumPatternIds: string[] }
 *   settings: { type: 'strum-vault' }
 * - Unauthenticated fallback: localStorage 'guitar-growth-strum-pack-assignments'
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders, ChevronLeft, RotateCcw, Package, ChevronDown,
  ChevronRight, Save, Bookmark, CheckCircle2, Pencil, X,
  Star, Sparkles, Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useStrumVaultStore, type RhythmTypeFilter, type StyleFilter } from '@/stores/strumVaultStore';
import { StrumPatternCard, type StrumPattern } from '@/components/features/StrumPatternCard';
import { StrumDetailModal } from '@/components/features/StrumDetailModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';
import { presetsApi } from '@/lib/api/presets';
import { toast } from 'sonner';

const ACCENT = '#fde047';
const LS_PACK_KEY = 'guitar-growth-strum-pack-assignments';

// ── Named pack slot definitions ─────────────────────────────────────────────

interface PackDef {
  id: string;
  title: string;
  description: string;
  IconComponent: React.ElementType;
  accentColor: string;
  saveBtnColor: string;
  loadBtnColor: string;
}

const STRUM_PACKS: PackDef[] = [
  {
    id: 'beginner-starter',
    title: 'Beginner Starter Pack',
    description: 'The essential strum patterns every new player needs to get their first songs sounding right.',
    IconComponent: Star,
    accentColor: 'from-amber-500 to-orange-500',
    saveBtnColor: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/30',
    loadBtnColor: 'bg-amber-500 hover:bg-amber-600 text-zinc-950',
  },
  {
    id: 'rhythm-essentials',
    title: 'Rhythm Essentials',
    description: 'Core patterns that cover folk, pop, and rock — versatile rhythms you\'ll use in real songs.',
    IconComponent: Sparkles,
    accentColor: 'from-emerald-500 to-teal-500',
    saveBtnColor: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30',
    loadBtnColor: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  },
  {
    id: 'advanced-grooves',
    title: 'Advanced Grooves',
    description: 'Syncopated and genre-specific patterns for players ready to take their rhythm to the next level.',
    IconComponent: Zap,
    accentColor: 'from-purple-500 to-indigo-500',
    saveBtnColor: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-purple-500/30',
    loadBtnColor: 'bg-purple-500 hover:bg-purple-600 text-white',
  },
];

// ── Filter config ────────────────────────────────────────────────────────────

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

// ── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchStrumPatterns(): Promise<StrumPattern[]> {
  const { data, error } = await supabase
    .from('strum_patterns')
    .select('*')
    .order('sheet_number', { ascending: true })
    .order('pattern_number', { ascending: true });

  if (error) throw error;
  return (data ?? []) as StrumPattern[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadLocalPacks(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(LS_PACK_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalPacks(packs: Record<string, string[]>) {
  localStorage.setItem(LS_PACK_KEY, JSON.stringify(packs));
}

// ── Component ────────────────────────────────────────────────────────────────

export default function StrumVault() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  const {
    rhythmType, style, setRhythmType, setStyle, reset,
    selectedPatternIds, togglePatternSelection, setSelectedPatternIds, clearSelection,
  } = useStrumVaultStore();

  // ── Preset UI state ──────────────────────────────────────────────────────
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [packAssignments, setPackAssignments] = useState<Record<string, string[]>>(loadLocalPacks);
  const [editingPackId, setEditingPackId] = useState<string | null>(null);
  const [activePresetName, setActivePresetName] = useState<string | null>(null);
  const [cloudPresets, setCloudPresets] = useState<Array<{ id: string; name: string; patternIds: string[] }>>([]);

  // ── Modal state ──────────────────────────────────────────────────────────
  const [selectedPattern, setSelectedPattern] = useState<StrumPattern | null>(null);

  // Derived selection set
  const selectedIds = useMemo(() => new Set(selectedPatternIds), [selectedPatternIds]);

  // ── Fetch patterns ───────────────────────────────────────────────────────
  const { data: patterns = [], isLoading, error } = useQuery<StrumPattern[], Error>({ // Add explicit type parameters here
    queryKey: ['strum-patterns'],
    queryFn: fetchStrumPatterns,
    staleTime: 10 * 60_000,
  });

  // ── Load cloud presets when user logs in ─────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    presetsApi.getUserPresets(user.id).then((presets) => {
      const strumPresets = presets
        .filter((p: any) => p.settings?.type === 'strum-vault')
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          patternIds: p.filters?.strumPatternIds ?? [],
        }));
      setCloudPresets(strumPresets);
    }).catch(console.error);
  }, [user?.id]);

  // ── Filtered list ─────────────────────────────────────────────────────
  const filteredPatterns = useMemo(() => {
    return patterns.filter(p => {
      if (rhythmType !== 'all' && p.category !== rhythmType) return false;
      if (style !== 'all' && p.style !== style) return false;
      return true;
    });
  }, [patterns, rhythmType, style]);

  const hasActiveFilters = rhythmType !== 'all' || style !== 'all';

  // ── Pack save / load ─────────────────────────────────────────────────────
  const handleSaveToPackSlot = useCallback((packId: string) => {
    if (selectedIds.size === 0) { toast.error('Select at least one pattern first'); return; }
    const updated = { ...packAssignments, [packId]: Array.from(selectedIds) };
    setPackAssignments(updated);
    saveLocalPacks(updated);
    const packTitle = STRUM_PACKS.find(p => p.id === packId)?.title ?? packId;
    setEditingPackId(null);
    clearSelection();
    toast.success(`${selectedIds.size} patterns saved to "${packTitle}"`);
  }, [selectedIds, packAssignments, clearSelection]);

  const handleLoadPackSlot = useCallback((packId: string) => {
    const ids = packAssignments[packId];
    if (!ids || ids.length === 0) return;
    setSelectedPatternIds(ids);
    setActivePresetName(packId);
    setShowPresetMenu(false);
    toast.success(`Loaded ${ids.length} patterns`);
  }, [packAssignments, setSelectedPatternIds]);

  const handleEditPackSlot = useCallback((packId: string) => {
    const ids = packAssignments[packId];
    if (ids?.length) setSelectedPatternIds(ids);
    setEditingPackId(packId);
    setShowPresetMenu(false);
    const packTitle = STRUM_PACKS.find(p => p.id === packId)?.title ?? packId;
    toast.success(`Editing "${packTitle}" — adjust selection then re-save`);
  }, [packAssignments, setSelectedPatternIds]);

  const handleClearPackSlot = useCallback((packId: string) => {
    setPackAssignments(prev => {
      const updated = { ...prev };
      delete updated[packId];
      saveLocalPacks(updated);
      return updated;
    });
    if (activePresetName === packId) setActivePresetName(null);
    if (editingPackId === packId) setEditingPackId(null);
    toast.success('Pack cleared');
  }, [activePresetName, editingPackId]);

  // ── Cloud preset save ────────────────────────────────────────────────────
  const handleCreateCloudPreset = useCallback(async () => {
    if (!newPresetName.trim()) { toast.error('Enter a preset name'); return; }
    if (selectedIds.size === 0) { toast.error('Select at least one pattern'); return; }

    if (user?.id) {
      // Save to Supabase
      const saved = await presetsApi.createPreset({
        user_id: user.id,
        name: newPresetName.trim(),
        filters: { strumPatternIds: Array.from(selectedIds) },
        settings: { type: 'strum-vault' },
      });
      setCloudPresets(prev => [...prev, {
        id: saved.id,
        name: saved.name,
        patternIds: saved.filters?.strumPatternIds ?? [],
      }]);
      toast.success(`Preset "${newPresetName.trim()}" saved to cloud`);
    } else {
      // Fallback: localStorage
      const lsKey = 'guitar-growth-strum-custom-presets';
      const existing = (() => { try { return JSON.parse(localStorage.getItem(lsKey) ?? '[]'); } catch { return []; } })();
      existing.push({ id: Date.now().toString(), name: newPresetName.trim(), patternIds: Array.from(selectedIds) });
      localStorage.setItem(lsKey, JSON.stringify(existing));
      setCloudPresets(existing);
      toast.success(`Preset "${newPresetName.trim()}" saved locally`);
    }
    setNewPresetName('');
    setShowPresetMenu(false);
    clearSelection();
  }, [newPresetName, selectedIds, user?.id, clearSelection]);

  const handleLoadCloudPreset = useCallback((preset: { id: string; name: string; patternIds: string[] }) => {
    setSelectedPatternIds(preset.patternIds);
    setActivePresetName(preset.name);
    setShowPresetMenu(false);
    toast.success(`Loaded "${preset.name}" — ${preset.patternIds.length} patterns`);
  }, [setSelectedPatternIds]);

  // ── Close preset menu on outside click ──────────────────────────────────
  const presetMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (presetMenuRef.current && !presetMenuRef.current.contains(e.target as Node)) {
        setShowPresetMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Page title ───────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = 'Strum Pattern Vault | Guitar Growth';
    return () => { document.title = 'Guitar Growth'; };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pb-28">

      {/* ── Page header ── */}
      <div
        className="border-b border-zinc-800 px-4 pt-4 pb-5"
        style={{ borderTopWidth: '3px', borderTopColor: ACCENT }}
      >
        <div className="max-w-2xl mx-auto">
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
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white leading-tight">Strum Pattern Vault</h1>
              <p className="text-sm text-zinc-400 mt-0.5">Every rhythm pattern you need, organized and playable.</p>
            </div>
            {!isLoading && !error && (
              <span className="flex-shrink-0 text-[13px] font-semibold text-zinc-100 bg-zinc-700/80 px-2.5 py-0.5 rounded-full">
                {filteredPatterns.length}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5">

        {/* ── Edit Pack Banner ── */}
        {editingPackId && (() => {
          const pack = STRUM_PACKS.find(p => p.id === editingPackId);
          return pack ? (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5">
              <Pencil className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-400">Editing Pack</p>
                <p className="text-sm font-bold text-white truncate">{pack.title}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-amber-400/80">{selectedIds.size} selected</span>
                <button onClick={() => setEditingPackId(null)} className="text-amber-400/60 hover:text-amber-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : null;
        })()}

        {/* ── Preset Dropdown ── */}
        <div className="mb-4 relative" ref={presetMenuRef}>
          <button
            onClick={() => setShowPresetMenu(prev => !prev)}
            className={`w-full border rounded-lg px-4 py-3 flex items-center justify-between transition-colors ${
              showPresetMenu ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Package className="w-4 h-4" style={{ color: ACCENT }} />
              <span className="text-sm font-semibold text-zinc-200">
                {activePresetName
                  ? (STRUM_PACKS.find(p => p.id === activePresetName)?.title ?? activePresetName)
                  : 'Choose a Strum Pack'}
              </span>
              {selectedIds.size > 0 && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded border"
                  style={{ backgroundColor: `${ACCENT}22`, color: ACCENT, borderColor: `${ACCENT}55` }}
                >
                  {selectedIds.size} selected
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${showPresetMenu ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {showPresetMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 z-20 overflow-hidden"
              >

                {/* ── Curated Packs — Load ── */}
                <div className="p-3 border-b border-zinc-800">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 mb-2">
                    Curated Packs
                  </div>
                  <div className="space-y-2">
                    {STRUM_PACKS.map((pack) => {
                      const assigned = packAssignments[pack.id];
                      const isPopulated = assigned && assigned.length > 0;
                      const isActive = activePresetName === pack.id;
                      const { IconComponent } = pack;
                      return (
                        <div
                          key={pack.id}
                          onClick={() => isPopulated && handleLoadPackSlot(pack.id)}
                          className={`relative flex items-center gap-3 bg-zinc-950 border rounded-lg p-3 overflow-hidden transition-all ${
                            isPopulated
                              ? isActive ? 'border-amber-500/50 cursor-pointer' : 'border-zinc-700 hover:border-zinc-600 cursor-pointer'
                              : 'border-zinc-800 cursor-default'
                          }`}
                        >
                          {/* Accent bar */}
                          <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg bg-gradient-to-b ${pack.accentColor}`} />
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ml-1 bg-zinc-800 text-zinc-400">
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-white">{pack.title}</span>
                              {isPopulated ? (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-zinc-800 text-zinc-300 border-zinc-700">
                                  {assigned.length} patterns
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-zinc-800/50 text-zinc-500 border-zinc-700">
                                  Empty
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{pack.description}</p>
                          </div>
                          {isPopulated ? (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isActive && <CheckCircle2 className="w-4 h-4" style={{ color: ACCENT }} />}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditPackSlot(pack.id); }}
                                className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                aria-label={`Edit ${pack.title}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleClearPackSlot(pack.id); }}
                                className="text-zinc-600 hover:text-zinc-400 text-[10px] underline underline-offset-2 transition-colors"
                              >
                                Clear
                              </button>
                            </div>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-zinc-700 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Save Selection to Pack ── */}
                <div className="p-3 border-b border-zinc-800">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 mb-2">
                    Save Selected Patterns to a Pack
                  </div>
                  {selectedIds.size === 0 ? (
                    <p className="text-xs text-zinc-600 px-1 mb-3">
                      Select patterns using the checkboxes, then tap a pack slot to save.
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-400 px-1 mb-3 font-medium">
                      {selectedIds.size} pattern{selectedIds.size !== 1 ? 's' : ''} selected — choose a pack slot:
                    </p>
                  )}
                  <div className="space-y-2 mb-3">
                    {STRUM_PACKS.map((pack) => {
                      const assigned = packAssignments[pack.id];
                      const isPopulated = assigned && assigned.length > 0;
                      const { IconComponent } = pack;
                      return (
                        <button
                          key={pack.id}
                          onClick={() => handleSaveToPackSlot(pack.id)}
                          disabled={selectedIds.size === 0}
                          className={`w-full relative flex items-center gap-3 border rounded-lg px-3 py-2.5 overflow-hidden transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                            editingPackId === pack.id
                              ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                              : selectedIds.size > 0
                              ? `${pack.saveBtnColor} border`
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}
                        >
                          <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg bg-gradient-to-b ${pack.accentColor}`} />
                          <div className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center ml-1 bg-zinc-800 text-zinc-400">
                            <IconComponent className="w-3 h-3" />
                          </div>
                          <span className="flex-1 text-left text-xs font-semibold">{pack.title}</span>
                          {isPopulated && (
                            <span className="text-[10px] text-zinc-400 shrink-0">{assigned.length} saved</span>
                          )}
                          <Save className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom preset name */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-px bg-zinc-800" />
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest whitespace-nowrap">or name your own</span>
                    <div className="flex-1 h-px bg-zinc-800" />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Custom preset name..."
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreateCloudPreset(); }}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <button
                      onClick={handleCreateCloudPreset}
                      disabled={!newPresetName.trim() || selectedIds.size === 0}
                      className="px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: !newPresetName.trim() || selectedIds.size === 0 ? '#27272a' : ACCENT,
                        color: !newPresetName.trim() || selectedIds.size === 0 ? '#52525b' : '#000',
                      }}
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                  {!user && (
                    <p className="text-[10px] text-zinc-600 mt-1.5 px-1">
                      Sign in to sync presets across devices
                    </p>
                  )}
                </div>

                {/* ── Saved cloud presets ── */}
                {cloudPresets.length > 0 ? (
                  <div className="p-3">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 mb-2">
                      Saved Presets
                    </div>
                    <div className="space-y-1">
                      {cloudPresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handleLoadCloudPreset(preset)}
                          className="w-full text-left flex items-center justify-between px-3 py-2.5 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Bookmark className="w-3.5 h-3.5 text-zinc-600" />
                            <span className="text-sm text-white font-medium">{preset.name}</span>
                          </div>
                          <span className="text-xs text-zinc-500">{preset.patternIds.length} patterns</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-3 text-center">
                    <p className="text-xs text-zinc-600">No saved presets yet — select patterns and save above</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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

          {/* Reset + clear selection row */}
          <div className="flex items-center gap-4">
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
            {selectedIds.size > 0 && (
              <motion.button
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => { clearSelection(); setActivePresetName(null); }}
                className="flex items-center gap-1.5 text-[11px] transition-colors"
                style={{ color: ACCENT }}
              >
                <X className="w-3 h-3" />
                Clear {selectedIds.size} selected
              </motion.button>
            )}
          </div>
        </div>

        {/* ── Results count ── */}
        {!isLoading && !error && (
          <p className="text-[11px] text-zinc-500 mb-3">
            {filteredPatterns.length} pattern{filteredPatterns.length !== 1 ? 's' : ''}
            {hasActiveFilters ? ' matching filters' : ' total'}
          </p>
        )}

        {/* ── Loading / Error / Empty states ── */}
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

        {/* ── 2-column pattern grid ── */}
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
                  isSelected={selectedIds.has(pattern.id)}
                  onTap={setSelectedPattern}
                  onToggleSelect={() => togglePatternSelection(pattern.id)}
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
