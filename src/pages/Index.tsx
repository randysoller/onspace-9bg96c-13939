import { useNavigate } from 'react-router-dom';
import { Grid3x3, Music2, ChevronRight, Scale } from 'lucide-react';
import { useBackendSync } from '@/hooks/useBackendSync';

export default function Index() {
  const navigate = useNavigate();
  
  // Sync user data from backend when authenticated
  useBackendSync();

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="container mx-auto px-4 pt-4 pb-10 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            What Do You Want to
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold text-amber-500">
            Play Today?
          </h2>
        </div>

        {/* Practice Mode Cards */}
        <div className="space-y-3">
          {/* Chords Card */}
          <button
            onClick={() => navigate('/chord-setup')}
            className="w-full text-left bg-zinc-900/50 border border-zinc-800 border-t-4 border-t-emerald-500 rounded-xl p-5 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10 transition-all group cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-start gap-4 mb-2">
              <div className="flex-shrink-0 w-14 h-14 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Grid3x3 className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">Chords</h3>
                <p className="text-sm leading-relaxed">
                  <span className="font-bold text-emerald-400">Play your first real sounds.</span>{' '}
                  <span className="text-zinc-400">Learn chords with guidance, feedback, and real progress you can feel.</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-emerald-500 group-hover:text-emerald-400 font-semibold text-sm transition-all group-hover:gap-2">
              Start
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Chord Progressions Card */}
          <button
            onClick={() => navigate('/progression-setup')}
            className="w-full text-left bg-zinc-900/50 border border-zinc-800 border-t-4 border-t-purple-500 rounded-xl p-5 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all group cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-start gap-4 mb-2">
              <div className="flex-shrink-0 w-14 h-14 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Music2 className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Chord Progressions</h3>
                <p className="text-sm leading-relaxed">
                  <span className="font-bold text-purple-400">Where chords become music.</span>{' '}
                  <span className="text-zinc-400">Practice smooth transitions and play progressions that actually sound like songs.</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-purple-500 group-hover:text-purple-400 font-semibold text-sm transition-all group-hover:gap-2">
              Start
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Scales Card */}
          <button
            onClick={() => navigate('/scale-setup')}
            className="w-full text-left bg-zinc-900/50 border border-zinc-800 border-t-4 border-t-cyan-500 rounded-xl p-5 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10 transition-all group cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-start gap-4 mb-2">
              <div className="flex-shrink-0 w-14 h-14 bg-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Scale className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">Scales</h3>
                <p className="text-sm leading-relaxed">
                  <span className="font-bold text-cyan-400">Unlock the fretboard.</span>{' '}
                  <span className="text-zinc-400">Learn scales visually and turn them into riffs, solos, and real expression.</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-cyan-500 group-hover:text-cyan-400 font-semibold text-sm transition-all group-hover:gap-2">
              Start
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
