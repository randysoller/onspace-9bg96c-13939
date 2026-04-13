import { useRef } from 'react';
import { X, Play, Square, Volume2 } from 'lucide-react';
import { useMetronomeStore } from '@/stores/metronomeStore';
import { useMetronomeUIStore } from '@/stores/metronomeUIStore';
import { useAudioStore } from '@/stores/audioStore';
import { MetronomeDropdown } from '@/components/features/MetronomeDropdown';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  const subdivisions = [
    { value: 'quarter', label: '♩ Quarter' },
    { value: 'eighth', label: '♪ Eighth' },
    { value: 'sixteenth', label: '♬ Sixteenth' },
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
            <span className="text-sm font-bold uppercase tracking-wider text-zinc-200">Metronome</span>
            <div className="w-9" />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-20 md:pb-4">

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

              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => handleTempoChange(bpm - 1)}
                  className="w-8 h-8 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <span className="text-zinc-400 text-lg leading-none">−</span>
                </button>

                <input
                  type="range"
                  min="20"
                  max="250"
                  value={bpm}
                  onChange={(e) => handleTempoChange(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
                />

                <button
                  onClick={() => handleTempoChange(bpm + 1)}
                  className="w-8 h-8 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <span className="text-zinc-400 text-lg leading-none">+</span>
                </button>
              </div>

              {/* Presets dropdown replaces 7 quick-tempo pill buttons */}
              <MetronomeDropdown />
            </div>

            {/* Time Signature + Sound — side by side */}
            <div className="grid grid-cols-2 gap-3">
              {/* Time Signature */}
              <div>
                <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-1.5">Time Sig</span>
                <Select
                  value={String(beatsPerMeasure)}
                  onValueChange={(val) => setBeatsPerMeasure(Number(val))}
                >
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-700 text-white h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {timeSignatures.map((sig) => (
                      <SelectItem
                        key={sig.beats}
                        value={String(sig.beats)}
                        className="text-zinc-200 focus:bg-zinc-800 focus:text-white"
                      >
                        {sig.display}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sound */}
              <div>
                <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-1.5">Sound</span>
                <Select
                  value={soundType}
                  onValueChange={(val) => setSoundType(val as typeof soundType)}
                >
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-700 text-white h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {sounds.map((s) => (
                      <SelectItem
                        key={s.value}
                        value={s.value}
                        className="text-zinc-200 focus:bg-zinc-800 focus:text-white"
                      >
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subdivision */}
            <div>
              <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-1.5">Subdivision</span>
              <Select
                value={subdivision}
                onValueChange={(val) => setSubdivision(val as typeof subdivision)}
              >
                <SelectTrigger className="w-full bg-zinc-900 border-zinc-700 text-white h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {subdivisions.map((s) => (
                    <SelectItem
                      key={s.value}
                      value={s.value}
                      className="text-zinc-200 focus:bg-zinc-800 focus:text-white"
                    >
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Accent + Tap Tempo — unchanged */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between bg-zinc-900 rounded px-3 py-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wider leading-tight">
                  {beatsPerMeasure === 12 ? 'Accent\n1,4,7,10' : 'Accent\nBeat 1'}
                </span>
                <button
                  onClick={() => setAccentFirstBeat(!accentFirstBeat)}
                  className={`px-3 py-1 rounded font-semibold text-sm transition-all ${
                    accentFirstBeat
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {accentFirstBeat ? 'On' : 'Off'}
                </button>
              </div>

              <button
                onClick={handleTapTempo}
                className="py-2 rounded bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-600 text-zinc-200 font-bold text-sm tracking-wide transition-all select-none"
              >
                Tap Tempo
              </button>
            </div>

            {/* Beat Indicators — unchanged */}
            <div className="flex items-center justify-center gap-1 py-1">
              {Array.from({ length: beatsPerMeasure }, (_, i) => i + 1).map((beat) => {
                const isCurrentBeat = isPlaying && beat === currentBeat + 1;
                return (
                  <div
                    key={beat}
                    className={`flex items-center justify-center font-bold rounded transition-all ${
                      isCurrentBeat
                        ? 'bg-emerald-500 text-zinc-950 scale-110'
                        : 'bg-zinc-800 text-zinc-500'
                    } ${
                      beatsPerMeasure === 12
                        ? 'min-w-[20px] h-6 text-xs px-0.5'
                        : 'min-w-[28px] h-7 text-xs'
                    }`}
                  >
                    {beat}
                  </div>
                );
              })}
            </div>

            {/* Volume — unchanged */}
            <div>
              <div className="mb-1.5">
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

            {/* Play / Stop — unchanged */}
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
    </>
  );
}
