import { useState } from 'react';
import { Guitar, Search, Sliders, Bookmark, Music, BarChart3, Move } from 'lucide-react';
import { CHORD_DATABASE } from '@/constants/chords';
import { ChordData } from '@/types/chord';
import ChordDetailModal from '@/components/features/ChordDetailModal';

const STRINGS = ['E', 'A', 'D', 'G', 'B', 'e'];

interface ChordCardProps {
  chord: ChordData;
  isSelected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
}

function ChordCard({ chord, isSelected, onToggleSelect, onClick }: ChordCardProps) {
  // Determine root string index (for the blue diamond)
  const rootStringIndex = chord.rootString !== undefined ? chord.rootString : -1;

  return (
    <div 
      className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className="mt-2 flex-shrink-0"
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

        {/* Chord Diagram */}
        <div className="flex-shrink-0">
          <svg width="100" height="130" viewBox="0 0 100 130" className="select-none">
            {/* Nut (thick top line) */}
            <rect x="10" y="15" width="80" height="3" fill="currentColor" className="text-zinc-600" />

            {/* Fret lines */}
            {[1, 2, 3, 4].map((fret) => (
              <line
                key={`fret-${fret}`}
                x1="10"
                y1={15 + fret * 25}
                x2="90"
                y2={15 + fret * 25}
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
                y1="15"
                x2={10 + string * 16}
                y2="115"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-zinc-600"
              />
            ))}

            {/* Muted/Open markers above nut */}
            {chord.frets.map((fret, idx) => {
              if (fret === -1) {
                // Muted - X
                return (
                  <text
                    key={`marker-${idx}`}
                    x={10 + idx * 16}
                    y="10"
                    textAnchor="middle"
                    className="text-zinc-500 text-[8px] font-bold"
                  >
                    ✕
                  </text>
                );
              } else if (fret === 0) {
                // Open - circle
                return (
                  <circle
                    key={`marker-${idx}`}
                    cx={10 + idx * 16}
                    cy={7}
                    r="3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-zinc-500"
                  />
                );
              }
              return null;
            })}

            {/* Finger dots */}
            {chord.frets.map((fret, stringIdx) => {
              if (fret > 0) {
                const isRoot = stringIdx === rootStringIndex;
                const fingerNum = chord.fingers?.[stringIdx];

                if (isRoot) {
                  // Root note - blue diamond (larger, with finger number)
                  return (
                    <g key={`dot-${stringIdx}`}>
                      <path
                        d={`M ${10 + stringIdx * 16} ${15 + (fret - 0.5) * 25 - 13} 
                            L ${10 + stringIdx * 16 + 13} ${15 + (fret - 0.5) * 25} 
                            L ${10 + stringIdx * 16} ${15 + (fret - 0.5) * 25 + 13} 
                            L ${10 + stringIdx * 16 - 13} ${15 + (fret - 0.5) * 25} Z`}
                        fill="currentColor"
                        className="text-cyan-500"
                      />
                      {fingerNum && fingerNum > 0 && (
                        <text
                          x={10 + stringIdx * 16}
                          y={15 + (fret - 0.5) * 25 + 1}
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
                        cy={15 + (fret - 0.5) * 25}
                        r="8"
                        fill="currentColor"
                        className="text-amber-500"
                      />
                      {fingerNum && fingerNum > 0 && (
                        <text
                          x={10 + stringIdx * 16}
                          y={15 + (fret - 0.5) * 25 + 1}
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

            {/* Barres */}
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
                  y1={15 + (barreFret - 0.5) * 25}
                  x2={10 + maxString * 16}
                  y2={15 + (barreFret - 0.5) * 25}
                  stroke="currentColor"
                  strokeWidth="7"
                  strokeLinecap="round"
                  className="text-amber-500"
                />
              );
            })}
          </svg>
        </div>

        {/* Chord Info */}
        <div className="flex-1 min-w-0 py-2">
          <div className="text-3xl font-black text-white mb-0.5">
            {chord.root}
          </div>
          <div className="text-xs text-zinc-600 mb-1">Open Chords</div>
          <div className="text-sm text-zinc-400">
            {chord.root} {chord.type === 'major' ? 'Major' : chord.type === 'minor' ? 'Minor' : chord.type}
          </div>
        </div>

        {/* Tablature */}
        <div className="bg-white rounded-md px-2.5 py-2 text-[10px] font-mono self-start shadow-lg flex-shrink-0">
          {chord.frets.map((fret, idx) => (
            <div key={idx} className="flex gap-1.5 items-center py-[1px]">
              <span className="text-zinc-800 font-bold w-2">{STRINGS[idx]}</span>
              <span className="text-zinc-400">—</span>
              <span className="text-zinc-900 font-bold w-2 text-center">
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

        {/* Preset Dropdown */}
        <div className="mb-4">
          <button className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 flex items-center justify-between hover:bg-zinc-900 transition-colors">
            <div className="flex items-center gap-2.5">
              <Bookmark className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-300">EASY START - Presets</span>
              <span className="bg-zinc-800 text-zinc-500 text-xs font-bold px-2 py-0.5 rounded">
                {selectedChords.size}
              </span>
            </div>
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
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
          <div className="text-center py-16 text-zinc-600">
            No chords found matching your criteria.
          </div>
        )}
      </div>

      {/* Chord Detail Modal */}
      {detailModalChord && (
        <ChordDetailModal
          chord={detailModalChord}
          isOpen={!!detailModalChord}
          onClose={() => setDetailModalChord(null)}
          currentIndex={detailModalIndex}
          totalChords={filteredChords.length}
        />
      )}
    </div>
  );
}
