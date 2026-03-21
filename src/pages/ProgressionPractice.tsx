import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, ChevronRight, RotateCcw, Play } from 'lucide-react';

const PROGRESSION = [
  { numeral: 'I', name: 'C', fullName: 'C Major' },
  { numeral: 'IV', name: 'F', fullName: 'F Major' },
  { numeral: 'V', name: 'G', fullName: 'G Major' },
  { numeral: 'I', name: 'C', fullName: 'C Major' },
];

export default function ProgressionPractice() {
  const navigate = useNavigate();
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  
  const currentChord = PROGRESSION[currentChordIndex];

  const handleNext = () => {
    setCurrentChordIndex((prev) => (prev + 1) % PROGRESSION.length);
  };

  const handleReset = () => {
    setCurrentChordIndex(0);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top Bar */}
      <div className="border-b border-zinc-800 bg-black px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/progression-setup')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          <div className="text-sm text-zinc-500">
            <span className="text-emerald-500 font-semibold">● Listening</span> — play the chord
          </div>
        </div>
      </div>

      {/* Progression Display */}
      <div className="border-b border-zinc-800 bg-zinc-900/30 px-4 py-6">
        <div className="flex items-center justify-center gap-4">
          {PROGRESSION.map((chord, idx) => (
            <div
              key={idx}
              className={`relative px-6 py-3 rounded-lg border-2 transition-all ${
                idx === currentChordIndex
                  ? 'bg-amber-500 border-amber-500 text-zinc-950 scale-110'
                  : idx < currentChordIndex
                  ? 'bg-zinc-800 border-emerald-500 text-zinc-300'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-500'
              }`}
            >
              <div className="text-xs font-semibold mb-1 text-center">{chord.numeral}</div>
              <div className="text-2xl font-black text-center">{chord.name}</div>
              
              {idx < currentChordIndex && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-4 text-sm text-zinc-500">
          Chord {currentChordIndex + 1} of {PROGRESSION.length}
        </div>
      </div>

      {/* Main Display */}
      <div className="flex items-center justify-center min-h-[calc(100vh-280px)] py-12">
        <div className="text-center">
          <div className="text-9xl font-black text-white mb-4">
            {currentChord.name}
          </div>
          <div className="text-2xl text-zinc-500 mb-2">
            {currentChord.fullName}
          </div>
          <div className="text-lg text-zinc-600">
            {currentChord.numeral} in C Major
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 px-4 py-4">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleReset}
            className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-zinc-400" />
          </button>

          <button
            className="flex-1 max-w-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-500 font-bold py-4 px-8 rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            <Volume2 className="w-5 h-5" />
            Play Chord
          </button>

          <button
            onClick={handleNext}
            className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-bold py-4 px-8 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
