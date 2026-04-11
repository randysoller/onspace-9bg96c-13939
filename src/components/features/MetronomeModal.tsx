import { useRef } from 'react';
import { X, Play, Square, Volume2 } from 'lucide-react';
import { useMetronomeStore } from '@/stores/metronomeStore';
import { useMetronomeUIStore } from '@/stores/metronomeUIStore';
import { useAudioStore } from '@/stores/audioStore';
// useMetronomeAudio is intentionally NOT imported here — it is mounted once
// at the AppLayout level to keep the audio engine alive across all routes.

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

  // Tap Tempo: track timestamps of recent taps
  const tapTimestampsRef = useRef<number[]>([]);

  const handleTapTempo = () => {
    const now = Date.now();
    // Drop taps older than 3 seconds (stale sequence)
    tapTimestampsRef.current = tapTimestampsRef.current.filter(t => now - t < 3000);
    tapTimestampsRef.current.push(now);

    const taps = tapTimestampsRef.current;
    if (taps.length >= 2) {
      // Compute average interval between consecutive taps
      let totalInterval = 0;
      for (let i = 1; i < taps.length; i++) {
        totalInterval += taps[i] - taps[i - 1];
      }
      const avgInterval = totalInterval / (taps.length - 1);
      const computedBpm = Math.round(60000 / avgInterval);
      setBpm(Math.max(20, Math.min(250, computedBpm)));
    }
  };

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
  const timeSignatures = [
    { beats: 2, display: '2/4' },
    { beats: 3, display: '3/4' },
    { beats: 4, display: '4/4' },
    { beats: 12, display: '12/8' },
  ];
  const sounds: Array<{ value: typeof soundType; label: string }> = [
    { value: 'click', label: 'Click' },
    { value: 'woodBlock', label: 'Wood Block' },
    { value: 'hiHat', label: 'Hi-Hat' },
    { value: 'sideStick', label: 'Side Stick' },
    { value: 'voiceCount', label: 'Voice Count' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70]"
        onClick={closeMetronome}
      />

      {/* Modal — full-screen on mobile, centered card on desktop */}
      <div className="fixed inset-0 z-[70] pointer-events-none md:flex md:items-center md:justify-center md:p-4">
        <div className="w-full h-full md:max-w-md md:h-auto md:max-h-[90vh] bg-zinc-950 border-0 md:border md:border-zinc-800 rounded-none md:rounded-lg pointer-events-auto shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-zinc-800 px-4 py-1.5 flex items-center justify-between flex-shrink-0">
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
          <div className="px-4 py-2.5 space-y-2.5 overflow-y-auto">
            {/* Tempo */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Tempo</span>
                <div className="text-right">
                  <span className="text-xs text-zinc-500 mr-2">{getTempoLabel(bpm)}</span>
                  <span className="text-lg font-bold text-amber-500">{bpm}</span>
                  <span className="text-xs text-zinc-500 ml-1">BPM</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-2">
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
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
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
              <div className="mb-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Time Signature</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {timeSignatures.map((sig) => (
                  <button
                    key={sig.beats}
                    onClick={() => setBeatsPerMeasure(sig.beats)}
                    className={`py-2 rounded font-bold transition-all ${
                      beatsPerMeasure === sig.beats
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {sig.display}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound */}
            <div>
              <div className="mb-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Sound</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {sounds.slice(0, 3).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSoundType(s.value)}
                    className={`py-2 rounded font-semibold text-sm transition-all ${
                      soundType === s.value
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {sounds.slice(3).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSoundType(s.value)}
                    className={`py-2 rounded font-semibold text-sm transition-all ${
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
              <div className="mb-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Subdivision</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSubdivision('quarter')}
                  className={`py-2 rounded font-semibold text-sm transition-all ${
                    subdivision === 'quarter'
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  ♩ Quarter
                </button>
                <button
                  onClick={() => setSubdivision('eighth')}
                  className={`py-2 rounded font-semibold text-sm transition-all ${
                    subdivision === 'eighth'
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  ♪ Eighth
                </button>
                <button
                  onClick={() => setSubdivision('sixteenth')}
                  className={`py-2 rounded font-semibold text-sm transition-all ${
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
                <span className="text-xs text-zinc-500 uppercase tracking-wider">
                  Accent {beatsPerMeasure === 12 ? '(1, 4, 7, 10)' : 'First Beat'}
                </span>
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

            {/* Tap Tempo */}
            <div>
              <button
                onClick={handleTapTempo}
                className="w-full py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-600 text-zinc-200 font-bold text-base tracking-wide transition-all select-none"
              >
                Tap Tempo
              </button>
            </div>

            {/* Beat Indicators - Always visible, responsive sizing for 12/8 */}
            <div className="flex items-center justify-center gap-1 py-1.5" style={{ minHeight: '48px' }}>
              {Array.from({ length: beatsPerMeasure }, (_, i) => i + 1).map((beat) => {
                const isCurrentBeat = isPlaying && (beat === currentBeat + 1);
                
                return (
                  <div
                    key={beat}
                    className={`flex items-center justify-center font-bold rounded transition-all ${
                      isCurrentBeat
                        ? 'bg-emerald-500 text-zinc-950 scale-110'
                        : 'bg-zinc-800 text-zinc-500'
                    } ${
                      beatsPerMeasure === 12 
                        ? 'min-w-[22px] h-7 text-xs px-1'
                        : 'min-w-[32px] h-8 text-sm'
                    }`}
                  >
                    {beat}
                  </div>
                );
              })}
            </div>

            {/* Volume */}
            <div>
              <div className="flex-1 relative mb-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={metronomeVolume * 100}
                  onChange={(e) => setMetronomeVolume(Number(e.target.value) / 100)}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Volume</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold text-amber-500">{Math.round(metronomeVolume * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Play/Stop Button */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-full font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
