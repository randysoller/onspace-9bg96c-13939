import { Link } from 'react-router-dom';
import { Music, ChevronRight, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PracticeLanding() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">
          Choose Your Practice Mode
        </h1>
        <p className="text-xl text-zinc-400">
          What do you want to <span className="text-amber-500 font-semibold">play today?</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Chord Practice Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-transparent rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative bg-zinc-900/50 border border-zinc-800 rounded-lg p-8 hover:border-amber-500/30 transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <Music className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold text-white">Chords</h2>
            </div>

            <p className="text-zinc-400 mb-6 leading-relaxed">
              Study individual chords with timed reveals, audio playback, and real-time microphone detection. Filter by category, type, and root string.
            </p>

            <Link to="/practice">
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                Start Practice
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Chord Library Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative bg-zinc-900/50 border border-zinc-800 rounded-lg p-8 hover:border-blue-500/30 transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <Library className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-white">Library</h2>
            </div>

            <p className="text-zinc-400 mb-6 leading-relaxed">
              Browse the complete chord library with 400+ variations. Filter by root note, category, and chord type. Play any chord instantly.
            </p>

            <Link to="/library">
              <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold">
                Browse Library
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
