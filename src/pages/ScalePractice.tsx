import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, Save } from 'lucide-react';
import { ScaleFretboard } from '@/components/features/ScaleFretboard';
import { useScaleAudio } from '@/hooks/useScaleAudio';
import { useAuthStore } from '@/stores/authStore';
import { scalePracticeApi } from '@/lib/api/scalePractice';
import { toast } from 'sonner';

export default function ScalePractice() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { playScale, stopScale, isPlaying } = useScaleAudio();

  const state = location.state as {
    rootNote: string;
    scaleType: string;
    scaleName: string;
    scaleIntervals: number[];
    bpm: number;
  };

  const [sessionStarted, setSessionStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [notesPlayed, setNotesPlayed] = useState(0);
  const [currentBpm, setCurrentBpm] = useState(state?.bpm || 120);

  useEffect(() => {
    if (!state) {
      navigate('/scale-setup');
      return;
    }

    // Start session
    setSessionStarted(true);
    setStartTime(new Date());
  }, [state]);

  useEffect(() => {
    if (!sessionStarted) return;

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStarted]);

  const handlePlayScale = async () => {
    if (isPlaying) {
      stopScale();
    } else {
      await playScale(state.rootNote, state.scaleIntervals, currentBpm);
      setNotesPlayed(prev => prev + state.scaleIntervals.length);
    }
  };

  const handleReset = () => {
    setElapsedTime(0);
    setNotesPlayed(0);
    setStartTime(new Date());
    stopScale();
  };

  const handleSaveSession = async () => {
    if (!user) {
      toast.error('Please sign in to save your progress');
      return;
    }

    try {
      await scalePracticeApi.createSession({
        user_id: user.id,
        scale_name: state.rootNote + ' ' + state.scaleName,
        scale_type: state.scaleType,
        duration_seconds: elapsedTime,
        notes_played: notesPlayed,
        accuracy: 100, // Manual practice, assume 100%
        started_at: startTime?.toISOString() || new Date().toISOString(),
        ended_at: new Date().toISOString(),
      });

      toast.success('Practice session saved!');
      navigate('/');
    } catch (err) {
      console.error('Failed to save session:', err);
      toast.error('Failed to save session');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!state) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-black px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/scale-setup')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-xl font-bold">Scale Practice</h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-cyan-500">{formatTime(elapsedTime)}</div>
            <div className="text-xs text-zinc-500 mt-1">Practice Time</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-500">{notesPlayed}</div>
            <div className="text-xs text-zinc-500 mt-1">Notes Played</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-500">{currentBpm}</div>
            <div className="text-xs text-zinc-500 mt-1">BPM</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Fretboard */}
          <div className="flex items-center justify-center">
            <div className="bg-zinc-900 border border-cyan-500/30 rounded-xl p-6">
              <ScaleFretboard
                scaleName={state.scaleName}
                rootNote={state.rootNote}
                scaleNotes={state.scaleIntervals}
                size="lg"
                showName={true}
              />
            </div>
          </div>

          {/* Right: Controls */}
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-bold text-white mb-4">Playback Controls</h3>
              
              {/* BPM Adjustment */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Playback Speed
                </label>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={currentBpm}
                  onChange={(e) => setCurrentBpm(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                  <span>Slow</span>
                  <span className="text-cyan-500 font-bold">{currentBpm} BPM</span>
                  <span>Fast</span>
                </div>
              </div>

              {/* Play/Pause Button */}
              <button
                onClick={handlePlayScale}
                disabled={isPlaying}
                className={`w-full font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors mb-3 ${
                  isPlaying
                    ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                    : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Play Scale
                  </>
                )}
              </button>

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Reset Session
              </button>
            </div>

            {/* Practice Tips */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-bold text-white mb-3">Practice Tips</h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 font-bold">•</span>
                  <span>Start slow and focus on clean finger placement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 font-bold">•</span>
                  <span>Practice ascending and descending patterns</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 font-bold">•</span>
                  <span>Use a metronome to keep steady timing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 font-bold">•</span>
                  <span>Gradually increase speed as you build muscle memory</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 font-bold">•</span>
                  <span>Try different positions along the neck</span>
                </li>
              </ul>
            </div>

            {/* Save Session */}
            {user && (
              <button
                onClick={handleSaveSession}
                className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-5 h-5" />
                Save Session
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
