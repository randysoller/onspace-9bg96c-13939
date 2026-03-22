import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { X, Music, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePitchDetection } from '@/hooks/usePitchDetection';
import { useReferenceTone } from '@/hooks/useReferenceTone';
import { useDetectionSettingsStore } from '@/stores/detectionSettingsStore';
import { useTunerStore, TUNING_PRESETS, TuningPreset } from '@/stores/tunerStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Tuner() {
  const navigate = useNavigate();
  const { sensitivity, setSensitivity } = useDetectionSettingsStore();
  const { playTone, stopTone } = useReferenceTone();
  const { tuning, setTuning } = useTunerStore();
  const [selectedString, setSelectedString] = useState<number | null>(null);

  const { isListening, currentPitch, permissionDenied, audioLevel } = usePitchDetection({
    sensitivity,
    autoStart: true,
  });

  const detectedFrequency = currentPitch?.frequency || null;
  const detectedNote = currentPitch ? `${currentPitch.noteName}${currentPitch.octave}` : null;
  const cents = currentPitch?.cents || 0;

  // Hold note display to prevent flashing when pitch dies out
  const [displayedNote, setDisplayedNote] = useState<string>('');
  const noteHoldTimeoutRef = useRef<number | null>(null);

  // Hold in-tune circle to prevent flashing
  const [showInTuneCircle, setShowInTuneCircle] = useState(false);
  const inTuneHoldTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (detectedNote) {
      // Immediately update to new note
      setDisplayedNote(detectedNote);
      
      // Clear any existing timeout
      if (noteHoldTimeoutRef.current) {
        clearTimeout(noteHoldTimeoutRef.current);
        noteHoldTimeoutRef.current = null;
      }
    } else {
      // When detection stops, hold the last note for 400ms before clearing
      if (displayedNote && !noteHoldTimeoutRef.current) {
        noteHoldTimeoutRef.current = window.setTimeout(() => {
          setDisplayedNote('');
          noteHoldTimeoutRef.current = null;
        }, 400);
      }
    }
  }, [detectedNote, displayedNote]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (noteHoldTimeoutRef.current) {
        clearTimeout(noteHoldTimeoutRef.current);
      }
      if (inTuneHoldTimeoutRef.current) {
        clearTimeout(inTuneHoldTimeoutRef.current);
      }
    };
  }, []);

  // Hold in-tune circle display to prevent flashing
  useEffect(() => {
    if (isInTune) {
      // Immediately show circle when in tune
      setShowInTuneCircle(true);
      
      // Clear any existing timeout
      if (inTuneHoldTimeoutRef.current) {
        clearTimeout(inTuneHoldTimeoutRef.current);
        inTuneHoldTimeoutRef.current = null;
      }
    } else {
      // When out of tune, hold the circle for 400ms before hiding
      if (showInTuneCircle && !inTuneHoldTimeoutRef.current) {
        inTuneHoldTimeoutRef.current = window.setTimeout(() => {
          setShowInTuneCircle(false);
          inTuneHoldTimeoutRef.current = null;
        }, 400);
      }
    }
  }, [isInTune, showInTuneCircle]);

  const currentTuning = TUNING_PRESETS[tuning];
  const strings = currentTuning.notes.map((note, index) => ({
    number: 6 - index,
    note: note,
    freq: currentTuning.freqs[index],
  }));

  const stringTimeoutRef = useRef<number | null>(null);

  const handleStringClick = (stringData: typeof strings[0]) => {
    // Stop any currently playing tone to prevent overlap
    stopTone();
    
    // Clear any existing timeout
    if (stringTimeoutRef.current) {
      clearTimeout(stringTimeoutRef.current);
    }
    
    setSelectedString(stringData.number);
    playTone(stringData.freq);
    
    // Let the tone play its full 3-second duration naturally
    stringTimeoutRef.current = window.setTimeout(() => {
      setSelectedString(null);
      stringTimeoutRef.current = null;
    }, 3000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (stringTimeoutRef.current) {
        clearTimeout(stringTimeoutRef.current);
      }
    };
  }, []);

  // Generate frequency bars (showing pitch deviation) - Memoized for performance
  const bars = useMemo(() => {
    const bars = [];
    const totalBars = 50;
    const centerBar = 25;
    
    // Calculate which bar should be lit based on cents offset
    // Map cents (-50 to +50) to bar position (0 to 50)
    const centPosition = Math.round((cents / 100) * totalBars + centerBar);
    
    for (let i = 0; i < totalBars; i++) {
      const distance = Math.abs(i - centerBar);
      let color = 'bg-emerald-500';
      
      if (distance > 2) {
        color = 'bg-yellow-500';
      }
      if (distance > 8) {
        color = 'bg-red-500';
      }
      
      // Light up the bar if it's at the current cent position (only when frequency is detected)
      const isActive = detectedFrequency && Math.abs(i - centPosition) <= 1;
      
      // Middle bar is 25% taller (75px vs 60px) and 10px thick (2 points thicker than 8px)
      const isMiddleBar = i === centerBar;
      const barHeight = isMiddleBar ? 'h-[75px]' : 'h-12';
      const barWidth = isMiddleBar ? 'w-2.5' : 'w-1.5';
      
      bars.push(
        <div
          key={i}
          className={`${barWidth} ${barHeight} ${color} transition-opacity duration-100 ${
            isActive ? 'opacity-100' : 'opacity-30'
          }`}
        />
      );
    }
    
    return bars;
  }, [cents, detectedFrequency]);

  // Get note color based on tuning accuracy
  const getNoteColor = () => {
    if (!detectedFrequency) return 'text-zinc-700';
    const absCents = Math.abs(cents);
    if (absCents <= 5) return 'text-emerald-500';
    if (absCents <= 15) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Check if note is in tune (within ±5 cents)
  const isInTune = detectedFrequency && Math.abs(cents) <= 5;
  
  // Extract just the note name without octave (use held note for display)
  const noteNameOnly = displayedNote ? displayedNote.replace(/[0-9]/g, '') : '';

  return (
    <div className="bg-black text-white min-h-[calc(100vh-8rem)]">
      <div className="container mx-auto px-4 py-4 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-zinc-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
          
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-500">Guitar Tuner</span>
          </div>
          
          <div className="w-9" />
        </div>

        {/* Title & Tuning Selector */}
        <div className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-black mb-3">
            Tune Your <span className="text-amber-500">Guitar</span>
          </h1>
          
          {/* Tuning Selector */}
          <div className="flex justify-center mb-2">
            <Select value={tuning} onValueChange={(value) => setTuning(value as TuningPreset)}>
              <SelectTrigger className="w-[280px] bg-zinc-900 border-zinc-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {(Object.keys(TUNING_PRESETS) as TuningPreset[]).map((key) => (
                  <SelectItem key={key} value={key} className="text-white hover:bg-zinc-800">
                    <span className="font-bold">{TUNING_PRESETS[key].name}</span>
                    <span className="text-zinc-500 ml-2">{TUNING_PRESETS[key].notes.join(' ')}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pitch Detection Display */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-4">
          {/* Note Name Display with Circle - Fixed height to prevent layout shift */}
          <div className="text-center mb-6 relative">
            <div className="relative inline-flex items-center justify-center bg-black rounded-2xl px-12 py-8" style={{ minHeight: '180px', minWidth: '200px' }}>
              {/* Circle indicator when in tune */}
              {showInTuneCircle && (
                <div className="absolute inset-4 border-4 border-emerald-500 rounded-full animate-pulse" />
              )}
              
              {/* Note Name - always rendered with fixed height */}
              <div className={`text-8xl md:text-9xl font-black transition-colors duration-200 ${
                getNoteColor()
              }`} style={{ minHeight: '120px', minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {noteNameOnly || '\u00A0'}
              </div>
            </div>
            
            {/* Only show permission error */}
            {permissionDenied && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <div className="text-sm font-bold text-red-500">Microphone access denied</div>
                <div className="text-xs text-red-400 mt-1">Please allow microphone access in your browser settings</div>
              </div>
            )}
          </div>

          {/* Frequency Bars - Always visible with fixed height */}
          <div className="flex items-center justify-center gap-0.5 mb-4" style={{ minHeight: '48px' }}>
            {bars}
          </div>

          {/* Cents Indicator */}
          <div className="flex items-center justify-between text-base text-white mb-4 -mt-4">
            <span className="flex items-center gap-1">
              Flat
              <span className="text-xl">♭</span>
            </span>
            <span className={`font-bold transition-colors ${
              Math.abs(cents) < 5 ? 'text-emerald-500' : 
              Math.abs(cents) < 15 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {cents > 0 ? '+' : ''}{cents} cents
            </span>
            <span className="flex items-center gap-1">
              Sharp
              <span className="text-xl">♯</span>
            </span>
          </div>

          {/* Mic Sensitivity */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mic className="w-6 h-6 text-amber-500" />
              <span className="text-sm font-bold uppercase tracking-wider text-white">Sensitivity</span>
              <span className="ml-auto text-sm font-bold text-white">{sensitivity}</span>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="1"
                max="10"
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Strings Section */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center justify-center mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Reference Tones</h2>
          </div>

          <div className="flex gap-1.5 overflow-x-auto">
            {strings.map((string) => (
              <button
                key={string.number}
                onClick={() => handleStringClick(string)}
                className={`flex-1 min-w-[50px] border rounded-lg px-2 py-3 transition-all ${
                  selectedString === string.number
                    ? 'bg-amber-500 border-amber-500 text-zinc-950'
                    : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white'
                }`}
              >
                <div className={`text-[10px] mb-1 ${
                  selectedString === string.number ? 'text-zinc-950/70' : 'text-zinc-500'
                }`}>{string.number}</div>
                <div className="text-lg font-black">{string.note}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
