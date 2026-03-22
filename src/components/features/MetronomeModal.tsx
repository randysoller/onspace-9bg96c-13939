import { Music, X, Play, Square, Volume2, VolumeX } from 'lucide-react';
import { useMetronomeStore } from '@/stores/metronomeStore';
import { useMetronomeUIStore } from '@/stores/metronomeUIStore';
import { useAudioStore } from '@/stores/audioStore';
import { useMetronomeAudio } from '@/hooks/useMetronomeAudio';

export default function MetronomeModal() {
  const { isOpen, closeMetronome } = useMetronomeUIStore();
  const {
    isPlaying,
    bpm,
    beatsPerMeasure,
    currentBeat,
    soundType,
    accentFirstBeat,
    subdivision,
    setIsPlaying,
    setBpm,
    setBeatsPerMeasure,
    setSoundType,
    setAccentFirstBeat,
    setSubdivision,
  } = useMetronomeStore();
  const { metronomeVolume, setMetronomeVolume } = useAudioStore();
  
  // Initialize metronome audio hook
  useMetronomeAudio();

  const handleTempoChange = (newTempo: number) => {
    setBpm(Math.max(20, Math.min(250, newTempo)));
  };

  const getTempoLabel = (tempo: number): string => {
    if (tempo < 60) return 'Grave';
    if (tempo < 76) return 'Largo';
    if (tempo < 108) return 'Adagio';
    if (tempo < 120) return 'Moderato';
    if (tempo < 168) return 'Allegro';
    if (tempo < 200) return 'Presto';
    return 'Prestissimo';
  };

  const quickTempos = [40, 60, 80, 100, 120, 140, 180];
  const timeSignatures = [2, 3, 4, 6];
  const sounds: Array<{ value: typeof soundType; label: string }> = [
    { value: 'click', label: 'Click' },
    { value: 'woodBlock', label: 'Wood Block' },
    { value: 'hiHat', label: 'Hi-Hat' },
    { value: 'sideStick', label: 'Side Stick' },
    { value: 'voice', label: 'Voice' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={closeMetronome}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-lg pointer-events-auto shadow-2xl">
          {/* Header */}
          <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
            <button
              onClick={closeMetronome}
              className="p-1 hover:bg-zinc-900 rounded transition-colors"
            >
              <X className="w-9 h-9 text-zinc-400" />
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-wider text-zinc-200">Metronome</span>
            </div>
            
            <div className="w-5" />
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Tempo */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Tempo</span>
                <div className="text-right">
                  <span className="text-xs text-zinc-500 mr-2">{getTempoLabel(bpm)}</span>
                  <span className="text-lg font-bold text-amber-500">{bpm}</span>
                  <span className="text-xs text-zinc-500 ml-1">BPM</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => handleTempoChange(bpm - 1)}
                  className="w-8 h-8 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded flex items-center justify-center transition-colors"
                >
                  <span className="text-zinc-400 text-lg leading-none">−</span>
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min="20"
                    max="250"
                    value={bpm}
                    onChange={(e) => handleTempoChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
                  />
                </div>
                
                <button
                  onClick={() => handleTempoChange(bpm + 1)}
                  className="w-8 h-8 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded flex items-center justify-center transition-colors"
                >
                  <span className="text-zinc-400 text-lg leading-none">+</span>
                </button>
              </div>

              {/* Quick Tempo Buttons */}
              <div className="grid grid-cols-7 gap-2">
                {quickTempos.map((t) => (
                  <button
                    key={t}
                    onClick={() => setBpm(t)}
                    className={`py-2 px-2 rounded font-bold text-sm transition-all ${
                      bpm === t
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Signature */}
            <div>
              <div className="mb-3">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Beats Per Measure</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {timeSignatures.map((beats) => (
                  <button
                    key={beats}
                    onClick={() => setBeatsPerMeasure(beats)}
                    className={`py-2.5 rounded font-bold transition-all ${
                      beatsPerMeasure === beats
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {beats}/4
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
                    key={s.value}
                    onClick={() => setSoundType(s.value)}
                    className={`py-2.5 rounded font-semibold text-sm transition-all ${
                      soundType === s.value
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subdivision */}
            <div>
              <div className="mb-3">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Subdivision</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSubdivision('quarter')}
                  className={`py-2.5 rounded font-semibold text-sm transition-all ${
                    subdivision === 'quarter'
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  ♩ Quarter
                </button>
                <button
                  onClick={() => setSubdivision('eighth')}
                  className={`py-2.5 rounded font-semibold text-sm transition-all ${
                    subdivision === 'eighth'
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  ♪ Eighth
                </button>
                <button
                  onClick={() => setSubdivision('sixteenth')}
                  className={`py-2.5 rounded font-semibold text-sm transition-all ${
                    subdivision === 'sixteenth'
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  ♬ Sixteenth
                </button>
              </div>
            </div>

            {/* Accent First Beat */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Accent First Beat</span>
                <button
                  onClick={() => setAccentFirstBeat(!accentFirstBeat)}
                  className={`px-4 py-2 rounded font-semibold text-sm transition-all ${
                    accentFirstBeat
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {accentFirstBeat ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            {/* Volume */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Volume</span>
                <span className="text-sm font-bold text-amber-500">{Math.round(metronomeVolume * 100)}%</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-zinc-500" />
                
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={metronomeVolume * 100}
                    onChange={(e) => setMetronomeVolume(Number(e.target.value) / 100)}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Play/Stop Button */}
            <div>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-full font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isPlaying
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-5 h-5" fill="currentColor" />
                    Stop
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
                  {Array.from({ length: beatsPerMeasure }, (_, i) => i + 1).map((beat) => (
                    <div
                      key={beat}
                      className={`w-2 h-2 rounded-full transition-all ${
                        beat === currentBeat + 1
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
    </>
  );
}
