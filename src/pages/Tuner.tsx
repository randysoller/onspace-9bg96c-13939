import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { X, Music, Mic, Settings, Check, RotateCcw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePitchDetection } from '@/hooks/usePitchDetection';
import { useReferenceTone } from '@/hooks/useReferenceTone';
import { useTunerStore, TUNING_PRESETS, TuningPreset } from '@/stores/tunerStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Tuner() {
  const navigate = useNavigate();
  const { playTone, stopTone } = useReferenceTone();
  const { 
    tuning, 
    setTuning,
    calibrationHz,
    isCalibrating,
    calibrationDetections,
    setIsCalibrating,
    addCalibrationDetection,
    setCalibrationHz,
    resetCalibration,
    clearCalibrationDetections,
  } = useTunerStore();
  
  const [selectedString, setSelectedString] = useState<number | null>(null);
  const [noiseGate, setNoiseGate] = useState(0.015);

  // NSDF pitch detection (original working algorithm)
  const { 
    frequency, 
    note, 
    octave, 
    cents, 
    clarity, 
    isDetecting, 
    error, 
    performanceStats, 
    audioLevel, 
    isAboveNoiseGate,
  } = usePitchDetection({
    enabled: true,
    minFrequency: 70,
    maxFrequency: 400,
    threshold: 0.85, // NSDF clarity threshold
    calibrationHz,
    noiseGateThreshold: noiseGate,
    updateInterval: 50,
  });

  const detectedFrequency = frequency > 0 ? frequency : null;
  const detectedNote = note && octave > 0 ? `${note}${octave}` : null;

  // Calibration logic
  useEffect(() => {
    if (isCalibrating && detectedFrequency && note === 'A' && octave === 4) {
      addCalibrationDetection(detectedFrequency);
    }
  }, [isCalibrating, detectedFrequency, note, octave, addCalibrationDetection]);

  const averageCalibrationHz = useMemo(() => {
    if (calibrationDetections.length === 0) return calibrationHz;
    const sum = calibrationDetections.reduce((a, b) => a + b, 0);
    return Math.round(sum / calibrationDetections.length * 10) / 10;
  }, [calibrationDetections, calibrationHz]);

  const handleStartCalibration = () => {
    setIsCalibrating(true);
    clearCalibrationDetections();
    toast.info('Calibration mode: Play an A4 note (440Hz)');
  };

  const handleConfirmCalibration = () => {
    if (calibrationDetections.length < 3) {
      toast.error('Need at least 3 stable detections. Keep playing A4...');
      return;
    }
    
    setCalibrationHz(averageCalibrationHz);
    setIsCalibrating(false);
    toast.success(`Calibration set to A${averageCalibrationHz}Hz`);
  };

  const handleCancelCalibration = () => {
    setIsCalibrating(false);
    clearCalibrationDetections();
    toast.info('Calibration cancelled');
  };



  // In-tune detection with hysteresis
  const IN_TUNE_ENTER_THRESHOLD = 5;
  const IN_TUNE_EXIT_THRESHOLD = 10;
  
  const [isInTuneState, setIsInTuneState] = useState(false);
  
  useEffect(() => {
    if (!detectedFrequency) {
      setIsInTuneState(false);
      return;
    }
    
    const absCents = Math.abs(cents);
    
    if (!isInTuneState) {
      if (absCents <= IN_TUNE_ENTER_THRESHOLD) {
        setIsInTuneState(true);
      }
    } else {
      if (absCents > IN_TUNE_EXIT_THRESHOLD) {
        setIsInTuneState(false);
      }
    }
  }, [cents, detectedFrequency, isInTuneState]);
  
  const isInTune = isInTuneState;

  // Display note with hold
  const [displayedNote, setDisplayedNote] = useState<string>('');
  const noteHoldTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (detectedNote) {
      setDisplayedNote(detectedNote);
      if (noteHoldTimeoutRef.current) {
        clearTimeout(noteHoldTimeoutRef.current);
        noteHoldTimeoutRef.current = null;
      }
    } else if (displayedNote) {
      if (!noteHoldTimeoutRef.current) {
        noteHoldTimeoutRef.current = window.setTimeout(() => {
          setDisplayedNote('');
          noteHoldTimeoutRef.current = null;
        }, 400);
      }
    }
  }, [detectedNote, displayedNote]);

  // In-tune circle with hold
  const [showInTuneCircle, setShowInTuneCircle] = useState(false);
  const inTuneHoldTimeoutRef = useRef<number | null>(null);
  const wasInTuneRef = useRef(false);

  useEffect(() => {
    if (isInTune) {
      if (!wasInTuneRef.current) {
        setShowInTuneCircle(true);
        wasInTuneRef.current = true;
      }
      
      if (inTuneHoldTimeoutRef.current) {
        clearTimeout(inTuneHoldTimeoutRef.current);
        inTuneHoldTimeoutRef.current = null;
      }
    } else if (wasInTuneRef.current) {
      wasInTuneRef.current = false;
      
      if (!inTuneHoldTimeoutRef.current) {
        inTuneHoldTimeoutRef.current = window.setTimeout(() => {
          setShowInTuneCircle(false);
          inTuneHoldTimeoutRef.current = null;
        }, 400);
      }
    }
  }, [isInTune]);

  useEffect(() => {
    return () => {
      if (noteHoldTimeoutRef.current) clearTimeout(noteHoldTimeoutRef.current);
      if (inTuneHoldTimeoutRef.current) clearTimeout(inTuneHoldTimeoutRef.current);
    };
  }, []);

  const currentTuning = TUNING_PRESETS[tuning];
  const strings = currentTuning.notes.map((note, index) => ({
    number: 6 - index,
    note: note,
    freq: currentTuning.freqs[index],
  }));

  const stringTimeoutRef = useRef<number | null>(null);

  const handleStringClick = (stringData: typeof strings[0]) => {
    stopTone();
    if (stringTimeoutRef.current) {
      clearTimeout(stringTimeoutRef.current);
    }
    
    setSelectedString(stringData.number);
    playTone(stringData.freq);
    
    stringTimeoutRef.current = window.setTimeout(() => {
      setSelectedString(null);
      stringTimeoutRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (stringTimeoutRef.current) {
        clearTimeout(stringTimeoutRef.current);
      }
    };
  }, []);

  // Frequency bars (pitch deviation display)
  const bars = useMemo(() => {
    const bars = [];
    const totalBars = 50;
    const centerBar = 25;
    
    const centPosition = Math.round((cents / 100) * totalBars + centerBar);
    
    for (let i = 0; i < totalBars; i++) {
      const distance = Math.abs(i - centerBar);
      let color = 'bg-emerald-500';
      
      if (distance > 2) color = 'bg-yellow-500';
      if (distance > 8) color = 'bg-red-500';
      
      const isActive = detectedFrequency && Math.abs(i - centPosition) <= 1;
      
      const normalizedDistance = distance / centerBar;
      const heightMultiplier = 1 - (normalizedDistance * normalizedDistance * 0.85);
      const centerBarHeight = 94;
      const maxSaucerHeight = 70;
      const minHeight = 20;
      
      const barHeightPx = i === centerBar 
        ? centerBarHeight 
        : Math.round(minHeight + (maxSaucerHeight - minHeight) * heightMultiplier);
      
      const isMiddleBar = i === centerBar;
      const barWidth = isMiddleBar ? 'w-2.5' : 'w-1.5';
      
      bars.push(
        <div
          key={i}
          className={`${barWidth} ${color} transition-opacity duration-100 ${
            isActive ? 'opacity-100' : 'opacity-30'
          }`}
          style={{ height: `${barHeightPx}px` }}
        />
      );
    }
    
    return bars;
  }, [cents, detectedFrequency]);

  const getNoteColor = () => {
    if (!detectedFrequency) return 'text-zinc-700';
    const absCents = Math.abs(cents);
    if (absCents <= 5) return 'text-emerald-500';
    if (absCents <= 15) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const noteNameOnly = displayedNote ? displayedNote.replace(/[0-9]/g, '') : '';

  return (
    <div className="bg-black text-white min-h-[calc(100vh-8rem)]">
      <div className="container mx-auto px-4 py-4 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-0">
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

        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-black mb-1">
            Tune Your <span className="text-amber-500">Guitar</span>
          </h1>
          
          <div className="flex justify-center mb-0">
            <Select value={tuning} onValueChange={(value) => setTuning(value as TuningPreset)}>
              <SelectTrigger className="w-[280px] bg-zinc-900 border-zinc-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {(Object.keys(TUNING_PRESETS) as TuningPreset[]).map((key) => (
                  <SelectItem key={key} value={key} className="text-white hover:bg-zinc-800 text-lg">
                    <span className="font-bold">{TUNING_PRESETS[key].name}</span>
                    <span className="text-zinc-500 ml-2">{TUNING_PRESETS[key].notes.join(' ')}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Display */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-4">
          {/* Note Display */}
          <div className="text-center mb-6 relative">
            <div className="relative inline-flex items-center justify-center bg-black rounded-2xl px-12 py-8" style={{ minHeight: '180px', minWidth: '200px' }}>
              {showInTuneCircle && (
                <div className="absolute inset-4 border-4 border-emerald-500 rounded-full animate-pulse" />
              )}
              
              <div className={`text-8xl md:text-9xl font-black transition-colors duration-200 ${
                getNoteColor()
              }`} style={{ minHeight: '120px', minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {noteNameOnly || '\u00A0'}
              </div>
            </div>
            
            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-red-500 text-sm font-bold mb-1">
                  <AlertCircle className="w-4 h-4" />
                  {error.includes('denied') || error.includes('permission') 
                    ? 'Microphone Access Denied' 
                    : 'Detection Error'}
                </div>
                <div className="text-xs text-red-400 text-center">
                  {error.includes('denied') || error.includes('permission')
                    ? 'Please allow microphone access in your browser settings and reload the page'
                    : error}
                </div>
              </div>
            )}
            
            {/* Detection Status */}
            {!error && isDetecting && (
              <div className="mt-2">
                {isCalibrating && (
                  <div className="mb-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-lg">
                    <div className="flex items-center justify-center gap-2 text-amber-500 text-xs font-bold mb-1">
                      <Settings className="w-3 h-3 animate-spin" />
                      <span>CALIBRATION MODE</span>
                    </div>
                    <div className="text-center text-xs text-amber-400">
                      Play A4 note • {calibrationDetections.length} detections • Target: {averageCalibrationHz}Hz
                    </div>
                  </div>
                )}
                
                {!isCalibrating && (
                  <div className="flex items-center justify-center gap-2 text-emerald-500 text-xs">
                    <Mic className="w-3 h-3" />
                    <span className="font-medium">Listening...</span>
                  </div>
                )}
              </div>
            )}          
          </div>

          {/* Frequency Bars */}
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



          {/* Noise Gate Control */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold uppercase tracking-wider text-white">Noise Gate</span>
              <span className="ml-auto text-sm font-bold text-white">{(noiseGate * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.05"
              step="0.001"
              value={noiseGate}
              onChange={(e) => setNoiseGate(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500"
            />
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-zinc-600">Very Sensitive</span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full transition-colors ${
                  isAboveNoiseGate ? 'bg-emerald-500' : 'bg-zinc-700'
                }`} />
                <span className={isAboveNoiseGate ? 'text-emerald-500' : 'text-zinc-600'}>
                  {isAboveNoiseGate ? 'Signal' : 'Quiet'}
                </span>
              </div>
              <span className="text-zinc-600">Less Sensitive</span>
            </div>
          </div>

          {/* Audio Level Meter */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-500">Input Level</span>
              <span className="text-xs font-bold text-white">{(audioLevel * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden relative">
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
                style={{ left: `${(noiseGate / 0.05) * 100}%` }}
              />
              <div 
                className={`h-full transition-all duration-100 ${
                  audioLevel >= noiseGate ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-zinc-700'
                }`}
                style={{ width: `${Math.min(100, (audioLevel / 0.05) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-zinc-600 mt-1">
              {isAboveNoiseGate 
                ? 'Signal detected - tuner active' 
                : 'Play louder or lower the noise gate threshold'}
            </p>
          </div>



          {/* Clarity Indicator */}
          {isDetecting && detectedFrequency && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-500">Clarity</span>
                <span className={`text-xs font-bold ${
                  clarity >= 0.85 ? 'text-emerald-500' :
                  clarity >= 0.70 ? 'text-amber-500' : 
                  'text-red-500'
                }`}>
                  {(clarity * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    clarity >= 0.85 ? 'bg-emerald-500' :
                    clarity >= 0.70 ? 'bg-amber-500' : 
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, clarity * 100)}%` }}
                />
              </div>
            </div>
          )}
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
