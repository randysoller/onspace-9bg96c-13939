
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
    noteValue,
    currentBeat,
    soundType,
    accentFirstBeat,
    subdivision,
    setIsPlaying,
    setBpm,
    setTimeSignature,
    setSoundType,
    setAccentFirstBeat,
    setSubdivision,
    swingEnabled,
    setSwingEnabled,
  } = useMetronomeStore();
  const { metronomeVolume, setMetronomeVolume } = useAudioStore();

  // Tap Tempo: track timestamps of recent taps
  const tapTimestampsRef = useRef<number[]>([]);

  // Long-press refs for − / + BPM buttons
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleTapTempo = () => {
    const now = Date.now();
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
      setBpm(Math.max(20, Math.min(300, computedBpm)));
    }
  };

  const handleTempoChange = (newTempo: number) => {
    setBpm(Math.max(20, Math.min(300, newTempo)));
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    if (longPressIntervalRef.current) clearInterval(longPressIntervalRef.current);
    longPressTimerRef.current = null;
    longPressIntervalRef.current = null;
  };

  const handleBpmPointerDown = (delta: number) => {
    // Immediate single step on press
    handleTempoChange(bpm + delta);
    // After 600ms hold, begin auto-repeating at 150ms intervals
    longPressTimerRef.current = setTimeout(() => {
      longPressIntervalRef.current = setInterval(() => {
        // Use getState() to avoid stale closure over bpm
        const current = useMetronomeStore.getState().bpm;
        setBpm(Math.max(20, Math.min(300, current + delta)));
      }, 150);
    }, 600);
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

  // All supported time signatures ordered by numerator ascending
  const timeSignatures = [
    { beats: 2, noteValue: 4, display: '2/4' },
    { beats: 3, noteValue: 4, display: '3/4' },
    { beats: 4, noteValue: 4, display: '4/4' },
    { beats: 5, noteValue: 4, display: '5/4' },
    { beats: 5, noteValue: 8, display: '5/8' },
    { beats: 6, noteValue: 8, display: '6/8' },
    { beats: 7, noteValue: 4, display: '7/4' },
    { beats: 7, noteValue: 8, display: '7/8' },
    { beats: 12, noteValue: 8, display: '12/8' },
    { beats: 12, noteValue: 4, display: '12/4' },
  ];

  const currentTimeSigValue = `${beatsPerMeasure}/${noteValue}`;

  const sounds: Array<{ value: typeof soundType; label: string }> = [
    { value: 'click', label: 'Click' },
    { value: 'woodBlock', label: 'Wood Block' },
    { value: 'hiHat', label: 'Hi-Hat' },
    { value: 'sideStick', label: 'Side Stick' },
    { value: 'voiceCount', label: 'Voice Count' },
  ];

  const subdivisions = [
    { value: 'quarter' as const, label: '♩ Quarter' },
    { value: 'eighth' as const, label: '♪ Eighth' },
    { value: 'triplet' as const, label: '♪ Triplet' },
    { value: 'sixteenth' as const, label: '♬ Sixteenth' },
  ];

  // Short description shown below the Beat Division dropdown — updates with selection
  const SUBDIVISION_DESCRIPTIONS: Record<typeof subdivision, string> = {
    quarter:   '1 click per beat',
    eighth:    '2 clicks per beat',
    triplet:   '3 clicks per beat',
    sixteenth: '4 clicks per beat',
  };

  // Beat indicator dot shared class helper
  const beatDotClass = (beat: number, sizeClass: string) => {
    const isCurrentBeat = isPlaying && beat === currentBeat + 1;
    return `flex items-center justify-center font-bold rounded transition-all ${sizeClass} ${
      isCurrentBeat ? 'bg-emerald-500 text-zinc-950 scale-110' : 'bg-zinc-800 text-zinc-400'
    }`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70]"
        onClick={closeMetronome}
      />

      {/* Modal — full-screen on mobile, centered card on desktop */}
      <div className="fixed inset-0 z-[80] pointer-events-none md:flex md:items-center md:justify-center md:p-4">
        <div className="w-full h-full md:max-w-md md:h-auto md:min-h-[820px] md:max-h-[95vh] bg-zinc-950 border-0 md:border md:border-zinc-800 rounded-none md:rounded-lg pointer-events-auto shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <button
              onClick={closeMetronome}
              className="p-1 hover:bg-zinc-900 rounded transition-colors"
            >
              <X className="w-9 h-9 text-zinc-400" />
            </button>
            <span className="text-sm font-bold uppercase tracking-wider text-zinc-200">Metronome</span>
            <div className="w-9" />
          </div>

          {/* Scrollable content — min-h-0 is required so flex-1 shrinks correctly inside overflow-y-auto */}
          <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-4 pt-12 pb-3 flex flex-col h-full">

            {/* Spacer above BPM — equal to flex-1 below, vertically centers BPM between header and slider */}
            <div className="flex-1" />

            {/* Tempo — BPM number row only (slider moved below spacer for desktop centering) */}
            <div className="mb-2">
              {/* BPM row: [Tempo label] [Allegro] [centered BPM number] [BPM unit] */}
              <div className="relative flex items-center gap-2 mb-2">
                <span className="text-xs text-amber-500 uppercase tracking-wider flex-shrink-0">Tempo</span>
                <span className="text-sm text-zinc-300 flex-shrink-0">{getTempoLabel(bpm)}</span>
                {/* BPM number absolutely centered in the row */}
                <span className="absolute left-1/2 -translate-x-1/2 text-[68px] font-bold text-amber-500 leading-none pointer-events-none">
                  {bpm}
                </span>
                <span className="flex-1" />
                <span className="text-xs text-amber-500 uppercase tracking-wider flex-shrink-0 self-end mb-1">BPM</span>
              </div>
            </div>



            {/* Spacer 1 — equal flex-1 spacers above and below middle block center it vertically */}
            <div className="flex-1" />

            {/* Slider row — extracted from Tempo section so desktop spacer can center it */}
            <div className="flex items-center gap-3 mb-3">
              <button
                onPointerDown={() => handleBpmPointerDown(-1)}
                onPointerUp={clearLongPress}
                onPointerLeave={clearLongPress}
                className="w-12 h-12 bg-amber-500/20 hover:bg-amber-500/30 active:bg-amber-500/40 border border-amber-500/40 rounded flex items-center justify-center transition-colors flex-shrink-0 select-none"
              >
                <span className="text-amber-400 text-3xl leading-none select-none">−</span>
              </button>

              <input
                type="range"
                min="20"
                max="300"
                value={bpm}
                onChange={(e) => handleTempoChange(Number(e.target.value))}
                className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 md:[&::-webkit-slider-thumb]:w-10 md:[&::-webkit-slider-thumb]:h-10 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
              />

              <button
                onPointerDown={() => handleBpmPointerDown(1)}
                onPointerUp={clearLongPress}
                onPointerLeave={clearLongPress}
                className="w-12 h-12 bg-amber-500/20 hover:bg-amber-500/30 active:bg-amber-500/40 border border-amber-500/40 rounded flex items-center justify-center transition-colors flex-shrink-0 select-none"
              >
                <span className="text-amber-400 text-3xl leading-none select-none">+</span>
              </button>
            </div>

            {/* Middle block — Quick Presets + Time Sig/Sound + Subdivision/Accent */}
            {/* flex-1 removed: desktop spacers handle vertical distribution instead */}
            <div className="flex flex-col gap-3">
              {/* Quick Presets dropdown */}
              <MetronomeDropdown />

              {/* Time Signature + Sound — side by side */}
              <div className="grid grid-cols-2 gap-4">
                {/* Time Signature */}
                <div>
                  <span className="text-xs text-amber-500 uppercase tracking-wider block mb-1.5">Time Signature</span>
                  <Select
                    value={currentTimeSigValue}
                    onValueChange={(val) => {
                      const sig = timeSignatures.find(s => `${s.beats}/${s.noteValue}` === val);
                      if (sig) setTimeSignature(sig.beats, sig.noteValue);
                    }}
                  >
                    <SelectTrigger className="w-full bg-zinc-900 border-zinc-700 text-white h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      className="bg-zinc-900 border-zinc-700 z-[200]"
                      position="popper"
                    >
                      {timeSignatures.map((sig) => (
                        <SelectItem
                          key={`${sig.beats}/${sig.noteValue}`}
                          value={`${sig.beats}/${sig.noteValue}`}
                          className="text-zinc-200 focus:bg-zinc-800 focus:text-white py-3"
                        >
                          {sig.display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sound */}
                <div>
                  <span className="text-xs text-amber-500 uppercase tracking-wider block mb-1.5">Sound</span>
                  <Select
                    value={soundType}
                    onValueChange={(val) => setSoundType(val as typeof soundType)}
                  >
                    <SelectTrigger className="w-full bg-zinc-900 border-zinc-700 text-white h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      className="bg-zinc-900 border-zinc-700 z-[200]"
                      position="popper"
                    >
                      {sounds.map((s) => (
                        <SelectItem
                          key={s.value}
                          value={s.value}
                          className="text-zinc-200 focus:bg-zinc-800 focus:text-white py-3"
                        >
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Subdivision + Accent — side by side */}
              <div className="grid grid-cols-2 gap-4">
                {/* Subdivision */}
                <div>
                  <span className="text-xs text-amber-500 uppercase tracking-wider block mb-1.5">Beat Division</span>
                  <Select
                    value={subdivision}
                    onValueChange={(val) => setSubdivision(val as typeof subdivision)}
                  >
                    <SelectTrigger className="w-full bg-zinc-900 border-zinc-700 text-white h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      className="bg-zinc-900 border-zinc-700 z-[200]"
                      position="popper"
                    >
                      {subdivisions.map((s) => (
                        <SelectItem
                          key={s.value}
                          value={s.value}
                          className="text-zinc-200 focus:bg-zinc-800 focus:text-white py-3"
                        >
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1.5 text-[10px] text-zinc-400 leading-tight">
                    {SUBDIVISION_DESCRIPTIONS[subdivision]}
                  </p>
                </div>

                {/* Accent */}
                <div>
                  <span className="text-xs text-amber-500 uppercase tracking-wider block mb-1.5">
                    {beatsPerMeasure === 5 ? 'Accent 1 & 3' : beatsPerMeasure === 6 ? 'Accent 1 & 4' : beatsPerMeasure === 7 ? 'Accent 1 & 5' : beatsPerMeasure === 12 ? 'Accent 1,4,7,10' : 'Accent Beat 1'}
                  </span>
                  <button
                    onClick={() => setAccentFirstBeat(!accentFirstBeat)}
                    className={`w-full h-10 rounded font-semibold text-sm transition-all ${
                      accentFirstBeat
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700'
                    }`}
                  >
                    {accentFirstBeat ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
            </div>

            {/* Spacer 2 — equal flex-1 spacers above and below middle block center it vertically */}
            <div className="flex-1" />

          </div>
          </div>

          {/* Bottom section — pb-20 on mobile clears the MobileTabBar (~64px) */}
          <div className="flex-shrink-0 px-4 pb-20 md:pb-6 pt-3 border-t border-zinc-800/50">

            {/* Tap Tempo + Swing — relative container with explicit height so both buttons can be absolutely placed */}
            {/* Swing: absolute right-4 (right edge with 16px padding) */}
            {/* Tap Tempo: absolute left-1/2 -translate-x-1/2 (horizontally centered) */}
            <div className="mb-6 relative h-[80px]">
              <button
                onClick={handleTapTempo}
                className="absolute left-1/2 -translate-x-1/2 h-[80px] px-4 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 active:bg-amber-500/40 border border-amber-500/40 text-amber-400 font-semibold text-[17px] tracking-wide whitespace-nowrap transition-all select-none"
              >
                Tap Tempo
              </button>

              {/* Swing toggle — right-aligned with 16px edge padding, height matches Tap Tempo */}
              <button
                onClick={() => {
                  if (!swingEnabled) {
                    setSwingEnabled(true);
                    setSubdivision('eighth');
                  } else {
                    setSwingEnabled(false);
                    // Revert to quarter notes when swing is disabled
                    setSubdivision('quarter');
                  }
                }}
                title={subdivision !== 'eighth' ? 'Swing applies to Eighth subdivision' : 'Toggle swing feel'}
                className={`absolute right-4 h-[80px] flex flex-col items-center justify-center gap-1 px-4 rounded-lg border font-semibold text-xs tracking-wide transition-all select-none cursor-pointer ${
                  swingEnabled
                    ? 'bg-amber-500/30 border-amber-500/60 text-amber-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                } ${subdivision !== 'eighth' ? 'opacity-50' : ''}`}
              >
                <span className="text-base">♪♩</span>
                <span style={{ color: 'white' }}>Swing</span>
                <span className={`text-[10px] ${swingEnabled ? 'text-amber-400' : 'text-amber-500'}`}>
                  {swingEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            {/* Beat Indicators — anchored just above the volume slider (~24px gap via mb-6) */}
            <div className="flex items-center justify-center mb-6">
              {beatsPerMeasure === 5 ? (
                // 5/4 and 5/8: 2+3 grouping — accents on beats 1 and 3
                <div className="flex items-center">
                  {[1, 2].map((beat) => (
                    <div key={beat} className={`mr-1.5 ${beatDotClass(beat, 'min-w-[32px] h-8 text-xs')}`}>
                      {beat}
                    </div>
                  ))}
                  <div className="w-4" />
                  {[3, 4, 5].map((beat) => (
                    <div key={beat} className={`mr-1.5 last:mr-0 ${beatDotClass(beat, 'min-w-[32px] h-8 text-xs')}`}>
                      {beat}
                    </div>
                  ))}
                </div>
              ) : beatsPerMeasure === 6 ? (
                // 6/8: two groups of 3 — accents on beats 1 and 4
                <div className="flex items-center">
                  {[1, 2, 3].map((beat) => (
                    <div key={beat} className={`mr-1.5 ${beatDotClass(beat, 'min-w-[28px] h-8 text-xs')}`}>
                      {beat}
                    </div>
                  ))}
                  <div className="w-4" />
                  {[4, 5, 6].map((beat) => (
                    <div key={beat} className={`mr-1.5 last:mr-0 ${beatDotClass(beat, 'min-w-[28px] h-8 text-xs')}`}>
                      {beat}
                    </div>
                  ))}
                </div>
              ) : beatsPerMeasure === 7 ? (
                // 7/4 and 7/8: 4+3 grouping — accents on beats 1 and 5
                <div className="flex items-center">
                  {[1, 2, 3, 4].map((beat) => (
                    <div key={beat} className={`mr-1 ${beatDotClass(beat, 'min-w-[26px] h-8 text-xs')}`}>
                      {beat}
                    </div>
                  ))}
                  <div className="w-4" />
                  {[5, 6, 7].map((beat) => (
                    <div key={beat} className={`mr-1 last:mr-0 ${beatDotClass(beat, 'min-w-[26px] h-8 text-xs')}`}>
                      {beat}
                    </div>
                  ))}
                </div>
              ) : beatsPerMeasure === 12 ? (
                // 12/8 and 12/4: four groups of 3 with wider gaps between groups
                <div className="flex items-center">
                  {[[1,2,3],[4,5,6],[7,8,9],[10,11,12]].map((group, gi) => (
                    <div key={gi} className="flex items-center">
                      {gi > 0 && <div className="w-3" />}
                      {group.map((beat) => (
                        <div key={beat} className={`mr-1 last:mr-0 ${beatDotClass(beat, 'min-w-[20px] h-7 text-xs px-0.5')}`}>
                          {beat}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                // All other time signatures: flat list
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: beatsPerMeasure }, (_, i) => i + 1).map((beat) => (
                    <div key={beat} className={beatDotClass(beat, 'min-w-[36px] h-9 text-sm')}>
                      {beat}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Volume — slider on top, label row below */}
            <div>
              <input
                type="range"
                min="0"
                max="100"
                value={metronomeVolume * 100}
                onChange={(e) => setMetronomeVolume(Number(e.target.value) / 100)}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer mb-1.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 md:[&::-webkit-slider-thumb]:w-10 md:[&::-webkit-slider-thumb]:h-10 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-xs text-zinc-400 uppercase tracking-wider">Volume</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold text-amber-500">{Math.round(metronomeVolume * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Play / Stop — 70% width, 20% taller (py-5) */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`mt-4 w-[70%] mx-auto font-bold py-5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
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
