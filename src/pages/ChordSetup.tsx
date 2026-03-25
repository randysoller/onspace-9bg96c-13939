import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Music2, Shapes, Layers, Play, CheckSquare, MousePointer, Filter } from 'lucide-react';
import { CHORD_DATABASE } from '@/constants/chords';
import { usePracticeStore } from '@/stores/practiceStore';
import { useChordTypeFilterStore, FILTER_PRESETS, type FilterPreset } from '@/stores/chordTypeFilterStore';

export default function ChordSetup() {
  const navigate = useNavigate();
  const { setPracticeChords } = usePracticeStore();
  const chordFilterStore = useChordTypeFilterStore();
  
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>('All');
  const [selectedShapes, setSelectedShapes] = useState<string>('All Shapes');
  const [selectedTypes, setSelectedTypes] = useState<string>('All Types');

  // Filter chords based on selections
  const filteredChords = useMemo(() => {
    return CHORD_DATABASE.filter(chord => {
      // Key filter
      if (selectedKey !== 'All' && chord.root !== selectedKey) return false;
      
      // Shape filter
      if (selectedShapes !== 'All Shapes') {
        if (selectedShapes === 'Open' && !chord.frets.includes(0)) return false;
        if (selectedShapes === 'Barre' && (!chord.barres || chord.barres.length === 0)) return false;
        if (selectedShapes === 'Movable' && chord.frets.includes(0)) return false;
      }
      
      // Type filter
      if (selectedTypes !== 'All Types') {
        if (selectedTypes === 'Major' && chord.type !== 'major') return false;
        if (selectedTypes === 'Minor' && chord.type !== 'minor') return false;
        if (selectedTypes === '7th' && !chord.type.includes('7')) return false;
        if (selectedTypes === 'Suspended' && !chord.type.includes('sus')) return false;
      }
      
      return true;
    });
  }, [selectedKey, selectedShapes, selectedTypes]);

  const handleStartPractice = () => {
    setPracticeChords(filteredChords);
    navigate('/practice');
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-3">
            Master Every Chord.
          </h1>
          <h2 className="text-4xl md:text-5xl font-black text-emerald-500 mb-6">
            One Fret at a Time.
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Challenge yourself with timed chord reveals. Pick a category, set your timer, and test how well you know your fretboard.
          </p>
        </div>

        {/* Filter Section */}
        <div className="space-y-4 mb-8">
          {/* Preset Dropdown */}
          <button className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3.5 flex items-center justify-between hover:bg-zinc-900 transition-colors">
            <div className="flex items-center gap-2.5">
              <Bookmark className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-300 uppercase tracking-wide">EASY START - Presets</span>
              <span className="bg-zinc-800 text-zinc-500 text-xs font-bold px-2 py-0.5 rounded">
                0
              </span>
            </div>
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Chord Type Filter */}
          <div className="relative mb-3">
            <div className="bg-zinc-900/50 border border-emerald-500/30 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-zinc-300">Chord Types</span>
                  <span className="bg-emerald-500/20 text-emerald-500 text-xs font-bold px-2 py-0.5 rounded">
                    {chordFilterStore.allowedCategories.size}/6
                  </span>
                </div>
                <div className="flex gap-1">
                  {(['beginner', 'intermediate', 'advanced', 'jazz'] as FilterPreset[]).map((preset) => {
                    const isActive = chordFilterStore.activePreset === preset;
                    return (
                      <button
                        key={preset}
                        onClick={() => chordFilterStore.setPreset(preset)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-emerald-500 text-black'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                      >
                        {preset === 'beginner' && 'Beginner'}
                        {preset === 'intermediate' && 'Inter'}
                        {preset === 'advanced' && 'Adv'}
                        {preset === 'jazz' && 'Jazz'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Chords in a Key */}
            <div className="relative">
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-300 appearance-none cursor-pointer hover:bg-zinc-900 transition-colors"
              >
                <option value="All">All Keys</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="G">G</option>
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
              <Music2 className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <svg className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* All Shapes */}
            <div className="relative">
              <select
                value={selectedShapes}
                onChange={(e) => setSelectedShapes(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-300 appearance-none cursor-pointer hover:bg-zinc-900 transition-colors"
              >
                <option value="All Shapes">All Shapes</option>
                <option value="Open">Open</option>
                <option value="Barre">Barre</option>
                <option value="Movable">Movable</option>
              </select>
              <Shapes className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <svg className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* All Types */}
            <div className="relative">
              <select
                value={selectedTypes}
                onChange={(e) => setSelectedTypes(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-300 appearance-none cursor-pointer hover:bg-zinc-900 transition-colors"
              >
                <option value="All Types">All Types</option>
                <option value="Major">Major</option>
                <option value="Minor">Minor</option>
                <option value="7th">7th</option>
                <option value="Suspended">Suspended</option>
              </select>
              <Layers className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <svg className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Empty State - No chords selected */}
        {filteredChords.length === 0 && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8 mb-6 text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full mb-4">
                <CheckSquare className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Chords Match Your Filters</h3>
              <p className="text-sm text-zinc-400 max-w-md mx-auto mb-4">
                Try adjusting your filters above to include more chords, or reset to see all available chords.
              </p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 max-w-sm mx-auto">
              <div className="flex items-start gap-3 text-left">
                <MousePointer className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-white mb-1">Quick Tip</div>
                  <div className="text-xs text-zinc-400">
                    Use the filter dropdowns to select specific keys, shapes, or chord types. The count updates in real-time!
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chords Available Count */}
        {filteredChords.length > 0 && (
          <div className="mb-6">
            <span className="text-emerald-500 font-bold text-sm">{filteredChords.length}</span>
            <span className="text-zinc-500 text-sm"> chords available</span>
          </div>
        )}

        {/* Ready to Practice Panel */}
        <div className="bg-zinc-900/50 border-2 border-emerald-500/30 rounded-lg p-6">
          <div className="flex items-center gap-2.5 mb-6">
            <Play className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-bold uppercase tracking-wide">Ready to Practice</h2>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Key</span>
              <span className="text-white font-medium">{selectedKey}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Shape</span>
              <span className="text-white font-medium">{selectedShapes}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Type</span>
              <span className="text-white font-medium">{selectedTypes}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Chord types</span>
              <span className="text-white font-medium">{chordFilterStore.allowedCategories.size} of 6</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Available chords</span>
              <span className="text-emerald-500 font-bold text-lg">{filteredChords.length}</span>
            </div>
            {chordFilterStore.allowedCategories.size < 6 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded px-3 py-2">
                <p className="text-xs text-emerald-400">
                  ⚡ {((1 - chordFilterStore.allowedCategories.size / 6) * 100).toFixed(0)}% faster detection with filtered types
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleStartPractice}
            disabled={filteredChords.length === 0}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-zinc-950 font-bold text-lg py-4 rounded-lg flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-500/20 disabled:shadow-none"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            START PRACTICE
          </button>
        </div>
      </div>
    </div>
  );
}
