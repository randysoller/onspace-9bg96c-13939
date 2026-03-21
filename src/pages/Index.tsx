import { useNavigate } from 'react-router-dom';
import { Grid3x3, Music2, ChevronRight } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            What Do You Want to
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold text-amber-500">
            Play Today?
          </h2>
        </div>

        {/* Practice Mode Cards */}
        <div className="space-y-6">
          {/* Chords Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-emerald-500/40 transition-all group">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-14 h-14 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Grid3x3 className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">Chords</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Study individual chords with timed reveals, audio playback, and real-time microphone detection. Filter by category, type, and root string.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/chord-setup')}
              className="flex items-center gap-1.5 text-emerald-500 hover:text-emerald-400 font-semibold text-sm transition-colors group-hover:gap-2"
            >
              Start
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Chord Progressions Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/40 transition-all group">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-14 h-14 bg-purple-500 rounded-lg flex items-center justify-center">
                <Music2 className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">Chord Progressions</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Practice chord transitions in any key. Choose from common progressions, chord progressions by style of music or build your own.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/progression-setup')}
              className="flex items-center gap-1.5 text-purple-500 hover:text-purple-400 font-semibold text-sm transition-colors group-hover:gap-2"
            >
              Start
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
