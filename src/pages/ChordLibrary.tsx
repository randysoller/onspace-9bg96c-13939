import { useState } from 'react';
import { Guitar, Search, Sliders, Bookmark, Music, BarChart3, Move, Volume2, Library, MousePointer, Plus, Save } from 'lucide-react';
import { CHORD_DATABASE } from '@/constants/chords';
import { ChordData } from '@/types/chord';
import ChordDetailModal from '@/components/features/ChordDetailModal';
import { useChordAudio } from '@/hooks/useChordAudio';
import { usePresetStore } from '@/stores/presetStore'; // FIX #4: Import preset store
import { toast } from 'sonner'; // FIX #4: Import toast for notifications

const STRINGS = ['E', 'A', 'D', 'G', 'B', 'e'];
const REVERSED_STRINGS = ['e', 'B', 'G', 'D', 'A', 'E']; // High to low for tablature display

interface ChordCardProps {
  chord: ChordData;
  isSelected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
}

function ChordCard({ chord, isSelected, onToggleSelect, onClick }: ChordCardProps) {
  const { playChord } = useChordAudio();
  // Determine root string index (for the blue diamond)
  const rootStringIndex = chord.rootNoteString;

  return (
    <div 
      className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Left column: Checkbox + Play button stacked */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            className="flex-shrink-0"
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              isSelected 
                ? 'bg-amber-500 border-amber-500' 
                : 'border-zinc-700 hover:border-zinc-600'
            }`}>
              {isSelected && (
                <svg className="w-3 h-3 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>

          {/* Play Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              playChord(chord);
            }}
            className="flex-shrink-0 p-2 bg-zinc-800 hover:bg-amber-500 text-zinc-400 hover:text-zinc-950 rounded-lg transition-all group"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Chord Info */}
        <div className="flex-1 min-w-0 py-2">
          <div className="text-3xl font-black text-white mb-0.5">
            {chord.symbol}
          </div>
          <div className="text-xs text-zinc-600 uppercase tracking-wide mb-1">
            {chord.category === 'open' ? 'Open Chords' : chord.category === 'barre' ? 'Barre Chords' : chord.category === 'movable' ? 'Movable Chords' : 'Custom Chords'}
          </div>
          <div className="text-sm text-zinc-400">
            {chord.name}
          </div>
        </div>

        {/* Chord Diagram */}
        <div className="flex-shrink-0 -ml-[19px]">
          <svg width="100" height="135" viewBox="0 0 100 135" className="select-none">
            {/* Nut (thick top line) */}
            <rect x="10" y="20" width="80" height="3" fill="currentColor" className="text-zinc-600" />

            {/* Fret lines */}
            {[1, 2, 3, 4].map((fret) => (
              <line
                key={`fret-${fret}`}
                x1="10"
                y1={20 + fret * 25}
                x2="90"
                y2={20 + fret * 25}
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-zinc-600"
              />
            ))}

            {/* String lines */}
            {[0, 1, 2, 3, 4, 5].map((string) => (
              <line
                key={`string-${string}`}
                x1={10 + string * 16}
                y1="20"
                x2={10 + string * 16}
                y2="120"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-zinc-600"
              />
            ))}

            {/* Muted/Open markers above nut */}
            {chord.frets.map((fret, idx) => {
              if (fret === -1) {
                // Muted string - gray X matching fret/string color, same size as open circles
                return (
                  <text
                    key={`marker-${idx}`}
                    x={10 + idx * 16}
                    y="12"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#71717a"
                    className="font-bold"
                    style={{ fontSize: '20px' }}
                  >
                    ✕
                  </text>
                );
              } else if (fret === 0) {
                const isRoot = idx === rootStringIndex;
                if (isRoot) {
                  // Open root note - blue diamond (5% reduction: 7.98 * 0.95 = 7.581)
                  return (
                    <path
                      key={`marker-${idx}`}
                      d={`M ${10 + idx * 16} ${12 - 7.581} 
                          L ${10 + idx * 16 + 7.581} ${12} 
                          L ${10 + idx * 16} ${12 + 7.581} 
                          L ${10 + idx * 16 - 7.581} ${12} Z`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-cyan-500"
                    />
                  );
                } else {
                  // Open - orange circle border (10% smaller: 7.2 * 0.9 = 6.48)
                  return (
                    <circle
                      key={`marker-${idx}`}
                      cx={10 + idx * 16}
                      cy={12}
                      r="6.48"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-amber-500"
                    />
                  );
                }
              }
              return null;
            })}

            {/* Barres (drawn first so they appear behind) */}
            {chord.barres?.map((barreFret, barreIdx) => {
              const stringsOnBarre = chord.frets
                .map((f, idx) => (f === barreFret ? idx : -1))
                .filter(idx => idx !== -1);
              
              if (stringsOnBarre.length < 2) return null;
              
              const minString = Math.min(...stringsOnBarre);
              const maxString = Math.max(...stringsOnBarre);

              return (
                <line
                  key={`barre-${barreIdx}`}
                  x1={10 + minString * 16}
                  y1={20 + (barreFret - 0.5) * 25}
                  x2={10 + maxString * 16}
                  y2={20 + (barreFret - 0.5) * 25}
                  stroke="currentColor"
                  strokeWidth="7"
                  strokeLinecap="round"
                  className="text-amber-500"
                />
              );
            })}

            {/* Finger dots */}
            {chord.frets.map((fret, stringIdx) => {
              if (fret > 0) {
                const isRoot = stringIdx === rootStringIndex;
                const fingerNum = chord.fingers?.[stringIdx];

                if (isRoot) {
                  // Root note - blue diamond (5% reduction: 12.9675 * 0.95 = 12.319125)
                  return (
                    <g key={`dot-${stringIdx}`}>
                      <path
                        d={`M ${10 + stringIdx * 16} ${20 + (fret - 0.5) * 25 - 12.319125} 
                            L ${10 + stringIdx * 16 + 12.319125} ${20 + (fret - 0.5) * 25} 
                            L ${10 + stringIdx * 16} ${20 + (fret - 0.5) * 25 + 12.319125} 
                            L ${10 + stringIdx * 16 - 12.319125} ${20 + (fret - 0.5) * 25} Z`}
                        fill="currentColor"
                        className="text-cyan-500"
                      />
                      {fingerNum && fingerNum > 0 && (
                        <text
                          x={10 + stringIdx * 16}
                          y={20 + (fret - 0.5) * 25 + 1}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-white text-[11px] font-black"
                        >
                          {fingerNum}
                        </text>
                      )}
                    </g>
                  );
                } else {
                  // Regular finger dot - orange circle with number
                  return (
                    <g key={`dot-${stringIdx}`}>
                      <circle
                        cx={10 + stringIdx * 16}
                        cy={20 + (fret - 0.5) * 25}
                        r="8"
                        fill="currentColor"
                        className="text-amber-500"
                      />
                      {fingerNum && fingerNum > 0 && (
                        <text
                          x={10 + stringIdx * 16}
                          y={20 + (fret - 0.5) * 25 + 1}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-white text-[11px] font-black"
                        >
                          {fingerNum}
                        </text>
                      )}
                    </g>
                  );
                }
              }
              return null;
            })}
          </svg>
        </div>

        {/* Tablature */}
        <div className="bg-white rounded-md px-2.5 py-2 text-[10px] font-mono self-start shadow-lg flex-shrink-0">
          {[...chord.frets].reverse().map((fret, idx) => (
            <div key={idx} className="flex gap-1.5 items-center py-[1px]">
              <span className="text-zinc-800 font-bold w-2">{REVERSED_STRINGS[idx]}</span>
              <span className="text-zinc-400">—</span>
              <span className="text-zinc-900 font-bold w-2.5 text-center text-xs">
                {fret === -1 ? 'x' : fret === 0 ? '0' : fret}
              </span>
              <span className="text-zinc-400">—</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChordLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedChords, setSelectedChords] = useState<Set<number>>(new Set());
  const [detailModalChord, setDetailModalChord] = useState<ChordData | null>(null);
  const [detailModalIndex, setDetailModalIndex] = useState(0);
  const [showPresetMenu, setShowPresetMenu] = useState(false); // FIX #4: Show/hide preset menu
  const [newPresetName, setNewPresetName] = useState(''); // FIX #4: New preset name
  const { presets: userPresets, addPreset } = usePresetStore(); // FIX #4: Access preset store
  const { playChord } = useChordAudio(); // Add chord audio playback

  // Filter chords based on search and category
  const filteredChords = CHORD_DATABASE.filter((chord) => {
    const searchMatch = !searchQuery || 
      `${chord.root}${chord.type}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    const categoryMatch = selectedCategories.length === 0 || 
      selectedCategories.some(cat => {
        if (cat === 'Open') return chord.frets.includes(0);
        if (cat === 'Barre') return chord.barres && chord.barres.length > 0;
        if (cat === 'Movable') return !chord.frets.includes(0) && chord.frets.every(f => f !== -1 || true);
        return true;
      });

    return searchMatch && categoryMatch;
  });

  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleChordSelection = (index: number) => {
    setSelectedChords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleChordClick = (chord: ChordData, index: number) => {
    setDetailModalChord(chord);
    setDetailModalIndex(index);
  };

  const handleNextChord = () => {
    if (detailModalIndex < filteredChords.length - 1) {
      const nextIndex = detailModalIndex + 1;
      setDetailModalIndex(nextIndex);
      setDetailModalChord(filteredChords[nextIndex]);
    }
  };

  const handlePreviousChord = () => {
    if (detailModalIndex > 0) {
      const prevIndex = detailModalIndex - 1;
      setDetailModalIndex(prevIndex);
      setDetailModalChord(filteredChords[prevIndex]);
    }
  };

  // FIX #4: Handle preset creation
  const handleCreatePreset = async () => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    if (selectedChords.size === 0) {
      toast.error('Please select at least one chord');
      return;
    }

    try {
      const chordIndices = Array.from(selectedChords);
      const chordNames = chordIndices.map(idx => {
        const chord = CHORD_DATABASE[idx];
        return `${chord.root}${chord.type === 'major' ? '' : chord.type}`;
      });

      await addPreset(newPresetName, chordIndices.map(String));

      toast.success(`Preset "${newPresetName}" created with ${selectedChords.size} chords`);
      setNewPresetName('');
      setShowPresetMenu(false);
      setSelectedChords(new Set());
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create preset';
      toast.error(errorMessage);
    }
  };

  // FIX #4: Load preset
  const handleLoadPreset = (presetName: string) => {
    const preset = userPresets.find(p => p.name === presetName);
    if (preset) {
      // Convert stored chord IDs back to indices
      const indices = new Set<number>();
      preset.chordIds.forEach(idStr => {
        const idx = parseInt(idStr, 10);
        if (!isNaN(idx) && idx >= 0 && idx < CHORD_DATABASE.length) {
          indices.add(idx);
        }
      });
      
      setSelectedChords(indices);
      setSelectedPreset(presetName);
      setShowPresetMenu(false);
      toast.success(`Loaded preset "${presetName}" with ${indices.size} chords`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Guitar className="w-7 h-7 text-amber-500" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Chord Library</h1>
          <p className="text-sm text-zinc-500">
            Browse all 124 chord diagrams — tap the checkbox to select chords for a practice preset
          </p>
        </div>

        {/* Preset Dropdown - FIX #4: Make functional */}
        <div className="mb-4 relative">
          <button 
            onClick={() => setShowPresetMenu(!showPresetMenu)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 flex items-center justify-between hover:bg-zinc-900 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Bookmark className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-300">
                {selectedPreset || 'EASY START - Presets'}
              </span>
              <span className="bg-zinc-800 text-zinc-500 text-xs font-bold px-2 py-0.5 rounded">
                {selectedChords.size}
              </span>
            </div>
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Preset Menu */}
          {showPresetMenu && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-10 overflow-hidden">
              {/* Create New Preset */}
              <div className="p-4 border-b border-zinc-800">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Create New Preset</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Preset name..."
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleCreatePreset}
                    disabled={!newPresetName.trim() || selectedChords.size === 0}
                    className="bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-bold px-4 py-2 rounded text-sm transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
                {selectedChords.size === 0 && (
                  <p className="text-xs text-zinc-600 mt-1">Select chords below to create a preset</p>
                )}
              </div>

              {/* Saved Presets */}
              {userPresets && userPresets.length > 0 && (
                <div className="p-2">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wide px-2 py-1">Your Presets</div>
                  {userPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleLoadPreset(preset.name)}
                      className="w-full text-left px-3 py-2 hover:bg-zinc-800 rounded transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white font-medium">{preset.name}</span>
                        <span className="text-xs text-zinc-500">{preset.chordIds?.length || 0} chords</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {(!userPresets || userPresets.length === 0) && (
                <div className="p-4 text-center">
                  <p className="text-sm text-zinc-500">No saved presets yet</p>
                  <p className="text-xs text-zinc-600 mt-1">Select chords and create your first preset above</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-4 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              placeholder="Search chords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
          <button className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 hover:bg-zinc-900 transition-colors">
            <Sliders className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategories([])}
            className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
              selectedCategories.length === 0
                ? 'bg-amber-500 text-zinc-950'
                : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
            }`}
          >
            All
          </button>

          <button
            onClick={() => toggleCategoryFilter('Open')}
            className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap flex items-center gap-2 transition-all ${
              selectedCategories.includes('Open')
                ? 'bg-amber-500 text-zinc-950'
                : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            Open
          </button>

          <button
            onClick={() => toggleCategoryFilter('Barre')}
            className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap flex items-center gap-2 transition-all ${
              selectedCategories.includes('Barre')
                ? 'bg-amber-500 text-zinc-950'
                : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Barre
          </button>

          <button
            onClick={() => toggleCategoryFilter('Movable')}
            className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap flex items-center gap-2 transition-all ${
              selectedCategories.includes('Movable')
                ? 'bg-amber-500 text-zinc-950'
                : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            Movable
          </button>
        </div>

        {/* Results Count & Legend */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-amber-500 font-bold">{filteredChords.length}</span>
            <span className="text-zinc-500"> chords</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-zinc-500">Finger Position</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rotate-45 bg-cyan-500" />
              <span className="text-zinc-500">Root Note</span>
            </div>
          </div>
        </div>

        {/* Chord List */}
        <div className="space-y-3">
          {filteredChords.map((chord, index) => (
            <ChordCard
              key={index}
              chord={chord}
              isSelected={selectedChords.has(index)}
              onToggleSelect={() => toggleChordSelection(index)}
              onClick={() => handleChordClick(chord, index)}
            />
          ))}
        </div>

        {filteredChords.length === 0 && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-12 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/10 rounded-full mb-4">
                <Library className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Chords Found</h3>
              <p className="text-zinc-400 max-w-md mx-auto mb-6">
                Try adjusting your search or filters to find chords. You can search by chord name (like "Cmaj7") or browse by category.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-left">
                <div className="flex items-start gap-3">
                  <Search className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-white mb-1">Search by Name</div>
                    <div className="text-xs text-zinc-400">
                      Type chord names like "Am", "G7", or "Cmaj7" to find specific chords quickly
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-left">
                <div className="flex items-start gap-3">
                  <MousePointer className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-white mb-1">Filter by Type</div>
                    <div className="text-xs text-zinc-400">
                      Use Open, Barre, or Movable filters to narrow down chord variations
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chord Detail Modal */}
      {detailModalChord && (
        <ChordDetailModal
          chord={detailModalChord}
          isOpen={!!detailModalChord}
          onClose={() => setDetailModalChord(null)}
          onPlay={() => playChord(detailModalChord)}
          onNext={handleNextChord}
          onPrevious={handlePreviousChord}
          currentIndex={detailModalIndex}
          totalChords={filteredChords.length}
        />
      )}
    </div>
  );
}
