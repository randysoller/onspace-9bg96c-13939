import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Music2, Shapes, Layers, Play } from 'lucide-react';
import { CHORD_DATABASE } from '@/constants/chords';
import { usePracticeStore } from '@/stores/practiceStore';

export default function Home() {
  const navigate = useNavigate();
  const { setPracticeChords } = usePracticeStore();
  
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedShapes, setSelectedShapes] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string | null>(null);

  // Filter chords based on selections
  const filteredChords = useMemo(() => {
    return CHORD_DATABASE.filter(chord => {
      if (selectedKey && selectedKey !== 'All' && chord.root !== selectedKey) return false;
      if (selectedShapes && selectedShapes !== 'All Shapes') {
        // Add shape filtering logic here if needed
      }
      if (selectedTypes && selectedTypes !== 'All Types') {
        if (selectedTypes === 'Major' && chord.type !== 'major') return false;
        if (selectedTypes === 'Minor' && chord.type !== 'minor') return false;
        // Add more type filters as needed
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
          <h1 className="text-5xl md:text-6xl font-black mb-3">
            Master Every Chord.
          </h1>
          <h2 className="text-5xl md:text-6xl font-black text-amber-500 mb-6">
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

          {/* Filter Row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Chords in a Key */}
            <button className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-2 hover:bg-zinc-900 transition-colors">
              <Music2 className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-300 flex-1 text-left">Chords in a Key</span>
              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* All Shapes */}
            <button className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-2 hover:bg-zinc-900 transition-colors">
              <Shapes className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-300 flex-1 text-left">All Shapes</span>
              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* All Types */}
            <button className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-2 hover:bg-zinc-900 transition-colors">
              <Layers className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-300 flex-1 text-left">All Types</span>
              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chords Available Count */}
        <div className="mb-6">
          <span className="text-amber-500 font-bold text-sm">{filteredChords.length}</span>
          <span className="text-zinc-500 text-sm"> chords available</span>
        </div>

        {/* Ready to Practice Panel */}
        <div className="bg-zinc-900/50 border-2 border-amber-500/30 rounded-lg p-6">
          <div className="flex items-center gap-2.5 mb-6">
            <Play className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold uppercase tracking-wide">Ready to Practice</h2>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Category</span>
              <span className="text-white font-medium">All Chords</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Type</span>
              <span className="text-white font-medium">All Types</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Key</span>
              <span className="text-white font-medium">All</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Available chords</span>
              <span className="text-amber-500 font-bold text-lg">{filteredChords.length}</span>
            </div>
          </div>

          <button
            onClick={handleStartPractice}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-bold text-lg py-4 rounded-lg flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-amber-500/20"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            START PRACTICE
          </button>
        </div>
      </div>
    </div>
  );
}
