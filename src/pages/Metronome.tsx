import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Music, Volume2, VolumeX, Play, Pause } from 'lucide-react';

export default function Metronome() {
  const navigate = useNavigate();
  
  const [tempo, setTempo] = useState(100);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [sound, setSound] = useState('Wood Block');
  const [volume, setVolume] = useState(75);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(1);

  const tempoLabels: { [key: number]: string } = {
    40: 'Grave',
    60: 'Largo',
    76: 'Adagio',
    108: 'Moderato',
    120: 'Allegro',
    168: 'Presto',
    200: 'Prestissimo',
  };

  const getTempoLabel = (bpm: number): string => {
    if (bpm < 60) return 'Grave';
    if (bpm < 76) return 'Largo';
    if (bpm < 108) return 'Adagio';
    if (bpm < 120) return 'Moderato';
    if (bpm < 168) return 'Allegro';
    if (bpm < 200) return 'Presto';
    return 'Prestissimo';
  };

  const quickTempos = [60, 80, 100, 120, 140, 160];
  const timeSignatures = ['2/4', '3/4', '4/4', '6/8', '12/8'];
  const sounds = ['Click', 'Wood Block', 'Hi-Hat', 'Sidestick', 'Voice Count'];

  const handleTempoChange = (newTempo: number) => {
    setTempo(Math.max(40, Math.min(240, newTempo)));
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 pb-24">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-lg my-auto">
        {/* Header */}
        <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="p-1 hover:bg-zinc-900 rounded transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
          
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold uppercase tracking-wider text-zinc-200">Metronome</span>
          </div>
          
          <div className="w-5" /> {/* Spacer for alignment */}
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Tempo */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Tempo</span>
              <div className="text-right">
                <span className="text-xs text-zinc-500 mr-2">{getTempoLabel(tempo)}</span>
                <span className="text-lg font-bold text-amber-500">{tempo}</span>
                <span className="text-xs text-zinc-500 ml-1">BPM</span>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => handleTempoChange(tempo - 1)}
                className="w-8 h-8 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded flex items-center justify-center transition-colors"
              >
                <span className="text-zinc-400 text-lg leading-none">−</span>
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="40"
                  max="240"
                  value={tempo}
                  onChange={(e) => handleTempoChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-track]:bg-amber-500/30"
                  style={{
                    background: `linear-gradient(to right, rgb(245, 158, 11) 0%, rgb(245, 158, 11) ${((tempo - 40) / 200) * 100}%, rgb(39, 39, 42) ${((tempo - 40) / 200) * 100}%, rgb(39, 39, 42) 100%)`
                  }}
                />
              </div>
              
              <button
                onClick={() => handleTempoChange(tempo + 1)}
                className="w-8 h-8 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded flex items-center justify-center transition-colors"
              >
                <span className="text-zinc-400 text-lg leading-none">+</span>
              </button>
            </div>

            {/* Quick Tempo Buttons */}
            <div className="grid grid-cols-6 gap-2 mb-3">
              {quickTempos.map((t) => (
                <button
                  key={t}
                  onClick={() => setTempo(t)}
                  className={`py-2 px-3 rounded font-bold text-sm transition-all ${
                    tempo === t
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Tap Tempo */}
            <button className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-500 font-bold text-sm rounded transition-colors">
              TAP TEMPO
            </button>
          </div>

          {/* Time Signature */}
          <div>
            <div className="mb-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Time Signature</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {timeSignatures.map((sig) => (
                <button
                  key={sig}
                  onClick={() => setTimeSignature(sig)}
                  className={`py-2.5 rounded font-bold transition-all ${
                    timeSignature === sig
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {sig}
                </button>
              ))}
            </div>
          </div>

          {/* Sound */}
          <div>
            <div className="mb-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Sound</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {sounds.map((s) => (
                <button
                  key={s}
                  onClick={() => setSound(s)}
                  className={`py-2.5 rounded font-semibold text-sm transition-all ${
                    sound === s
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Volume */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Volume</span>
              <span className="text-sm font-bold text-amber-500">{volume}%</span>
            </div>
            
            <div className="flex items-center gap-3">
              <VolumeX className="w-4 h-4 text-zinc-500" />
              
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
                  style={{
                    background: `linear-gradient(to right, rgb(245, 158, 11) 0%, rgb(245, 158, 11) ${volume}%, rgb(39, 39, 42) ${volume}%, rgb(39, 39, 42) 100%)`
                  }}
                />
              </div>
              
              <Volume2 className="w-4 h-4 text-zinc-500" />
            </div>
          </div>

          {/* Play Button */}
          <div>
            <button
              onClick={handlePlayPause}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5" fill="currentColor" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" fill="currentColor" />
                  Play
                </>
              )}
            </button>

            {/* Beat Indicators */}
            {isPlaying && (
              <div className="flex items-center justify-center gap-3 mt-4">
                {[1, 2, 3, 4].map((beat) => (
                  <div
                    key={beat}
                    className={`w-2 h-2 rounded-full transition-all ${
                      beat === currentBeat
                        ? 'bg-emerald-500 scale-150'
                        : 'bg-zinc-700'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
