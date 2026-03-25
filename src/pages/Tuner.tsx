import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Mic, MicOff, Music, ChevronDown, Crosshair, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import CalibrationWizard from '@/components/features/CalibrationWizard';

// ─── Constants ───────────────────────────────────────────

const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

type GuitarString = { string: number; note: string; freq: number; display: string };

interface TuningPreset {
  name: string;
  label: string;
  strings: GuitarString[];
}

const TUNING_PRESETS: TuningPreset[] = [
  {
    name: 'standard',
    label: 'Standard',
    strings: [
      { string: 6, note: 'E2', freq: 82.41, display: 'E' },
      { string: 5, note: 'A2', freq: 110.00, display: 'A' },
      { string: 4, note: 'D3', freq: 146.83, display: 'D' },
      { string: 3, note: 'G3', freq: 196.00, display: 'G' },
      { string: 2, note: 'B3', freq: 246.94, display: 'B' },
      { string: 1, note: 'E4', freq: 329.63, display: 'E' },
    ],
  },
  {
    name: 'half-step-down',
    label: '½ Step Down',
    strings: [
      { string: 6, note: 'Eb2', freq: 77.78, display: 'E♭' },
      { string: 5, note: 'Ab2', freq: 103.83, display: 'A♭' },
      { string: 4, note: 'Db3', freq: 138.59, display: 'D♭' },
      { string: 3, note: 'Gb3', freq: 185.00, display: 'G♭' },
      { string: 2, note: 'Bb3', freq: 233.08, display: 'B♭' },
      { string: 1, note: 'Eb4', freq: 311.13, display: 'E♭' },
    ],
  },
  {
    name: 'drop-d',
    label: 'Drop D',
    strings: [
      { string: 6, note: 'D2', freq: 73.42, display: 'D' },
      { string: 5, note: 'A2', freq: 110.00, display: 'A' },
      { string: 4, note: 'D3', freq: 146.83, display: 'D' },
      { string: 3, note: 'G3', freq: 196.00, display: 'G' },
      { string: 2, note: 'B3', freq: 246.94, display: 'B' },
      { string: 1, note: 'E4', freq: 329.63, display: 'E' },
    ],
  },
  {
    name: 'dadgad',
    label: 'DADGAD',
    strings: [
      { string: 6, note: 'D2', freq: 73.42, display: 'D' },
      { string: 5, note: 'A2', freq: 110.00, display: 'A' },
      { string: 4, note: 'D3', freq: 146.83, display: 'D' },
      { string: 3, note: 'G3', freq: 196.00, display: 'G' },
      { string: 2, note: 'A3', freq: 220.00, display: 'A' },
      { string: 1, note: 'D4', freq: 293.66, display: 'D' },
    ],
  },
];

// ─── Pitch detection utilities ───────────────────────────

function frequencyToNoteInfo(freq: number): { note: string; octave: number; cents: number; noteIndex: number } {
  const semitoneOffset = 12 * Math.log2(freq / 440);
  const roundedSemitone = Math.round(semitoneOffset);
  const cents = Math.round((semitoneOffset - roundedSemitone) * 100);
  const rawIndex = roundedSemitone + 9;
  const noteIndex = ((rawIndex % 12) + 12) % 12;
  const octave = Math.floor((roundedSemitone + 9) / 12) + 4;
  return { note: NOTE_STRINGS[noteIndex], octave, cents, noteIndex };
}

interface PitchResult {
  frequency: number;
  confidence: number;
}

function autoCorrelate(buffer: Float32Array, sampleRate: number): PitchResult | null {
  const windowSize = Math.min(buffer.length, 4096);
  const offset = Math.floor((buffer.length - windowSize) / 2);

  let rms = 0;
  for (let i = offset; i < offset + windowSize; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / windowSize);
  const rmsThreshold = (globalThis as any).__tunerRmsThreshold ?? 0.008;
  if (rms < rmsThreshold) return null;

  const halfSize = Math.floor(windowSize / 2);

  // Apply Hanning window
  const windowed = new Float32Array(windowSize);
  for (let i = 0; i < windowSize; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (windowSize - 1)));
    windowed[i] = buffer[offset + i] * w;
  }

  const minLag = Math.max(1, Math.floor(sampleRate / 1500));
  const maxLag = Math.min(halfSize - 1, Math.ceil(sampleRate / 55));

  // NSDF
  const nsdf = new Float32Array(halfSize);
  for (let tau = minLag; tau <= maxLag; tau++) {
    let acf = 0;
    let divisor = 0;
    const len = windowSize - tau;
    for (let i = 0; i < len; i++) {
      acf += windowed[i] * windowed[i + tau];
      divisor += windowed[i] * windowed[i] + windowed[i + tau] * windowed[i + tau];
    }
    nsdf[tau] = divisor > 0 ? (2 * acf) / divisor : 0;
  }

  const threshold = 0.42;
  const peaks: { tau: number; val: number }[] = [];

  let firstZero = minLag;
  while (firstZero <= maxLag && nsdf[firstZero] > 0) {
    firstZero++;
  }

  let idx = firstZero;
  while (idx <= maxLag) {
    while (idx <= maxLag && nsdf[idx] <= 0) idx++;
    let peakTau = idx;
    let peakVal = nsdf[idx] ?? 0;
    while (idx <= maxLag && nsdf[idx] > 0) {
      if (nsdf[idx] > peakVal) {
        peakVal = nsdf[idx];
        peakTau = idx;
      }
      idx++;
    }
    if (peakVal >= 0.2) {
      peaks.push({ tau: peakTau, val: peakVal });
    }
  }

  if (peaks.length === 0) return null;

  let bestTau = -1;
  let bestVal = -Infinity;
  for (const p of peaks) {
    if (p.val >= threshold) {
      bestTau = p.tau;
      bestVal = p.val;
      break;
    }
  }

  if (bestTau <= 0) {
    for (const p of peaks) {
      if (p.val > bestVal) {
        bestVal = p.val;
        bestTau = p.tau;
      }
    }
  }

  if (bestTau <= 0 || bestVal < 0.25) return null;

  // Parabolic interpolation
  let refinedTau = bestTau;
  if (bestTau > minLag && bestTau < maxLag) {
    const prev = nsdf[bestTau - 1];
    const curr = nsdf[bestTau];
    const next = nsdf[bestTau + 1];
    const denominator = 2 * (2 * curr - prev - next);
    if (Math.abs(denominator) > 1e-10) {
      refinedTau = bestTau + (prev - next) / denominator;
    }
  }

  const frequency = sampleRate / refinedTau;
  if (frequency < 55 || frequency > 1400) return null;
  return { frequency, confidence: bestVal };
}

function findClosestString(freq: number, strings: GuitarString[]): GuitarString | null {
  let closest = strings[0];
  let minDist = Infinity;
  for (const gs of strings) {
    const dist = Math.abs(1200 * Math.log2(freq / gs.freq));
    if (dist < minDist) {
      minDist = dist;
      closest = gs;
    }
  }
  return minDist < 400 ? closest : null;
}

// ─── Component ───────────────────────────────────────────

export default function Tuner() {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [selectedTuning, setSelectedTuning] = useState<TuningPreset>(TUNING_PRESETS[0]);
  const [tuningDropdownOpen, setTuningDropdownOpen] = useState(false);
  const tuningDropdownRef = useRef<HTMLDivElement | null>(null);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [noteInfo, setNoteInfo] = useState<{ note: string; octave: number; cents: number } | null>(null);
  const [closestString, setClosestString] = useState<GuitarString | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [selectedString, setSelectedString] = useState<number | null>(null);
  const [inTuneConfirmed, setInTuneConfirmed] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [sensitivity, setSensitivity] = useState(() => {
    const saved = localStorage.getItem('tuner-mic-sensitivity');
    return saved !== null ? Number(saved) : 60;
  });

  const startedRef = useRef(false);
  const inTuneStartRef = useRef<number | null>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioBufferRef = useRef<Float32Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Pitch detection loop
  const detectPitch = useCallback(() => {
    if (!analyserRef.current || !audioBufferRef.current || !audioContextRef.current) {
      console.log('[Tuner] detectPitch: Missing refs, skipping frame');
      animationFrameRef.current = requestAnimationFrame(detectPitch);
      return;
    }

    analyserRef.current.getFloatTimeDomainData(audioBufferRef.current);
    const result = autoCorrelate(audioBufferRef.current, audioContextRef.current.sampleRate);

    if (result && result.frequency > 0) {
      setFrequency(result.frequency);
      const info = frequencyToNoteInfo(result.frequency);
      setNoteInfo(info);
      const closest = findClosestString(result.frequency, selectedTuning.strings);
      setClosestString(closest);

      // Auto-select string
      if (autoDetect && closest) {
        setSelectedString(closest.string);
      }

      // Check in-tune state
      if (Math.abs(info.cents) <= 5) {
        if (inTuneStartRef.current === null) {
          inTuneStartRef.current = performance.now();
        } else if (performance.now() - (inTuneStartRef.current || 0) > 500) {
          setInTuneConfirmed(true);
        }
      } else {
        inTuneStartRef.current = null;
        setInTuneConfirmed(false);
      }
    } else {
      setFrequency(null);
      setNoteInfo(null);
      setClosestString(null);
      inTuneStartRef.current = null;
      setInTuneConfirmed(false);
    }

    animationFrameRef.current = requestAnimationFrame(detectPitch);
  }, [selectedTuning, autoDetect]);

  // Start/stop listening
  const toggleListening = useCallback(async () => {
    if (isListening) {
      // Stop
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      analyserRef.current = null;
      audioBufferRef.current = null;
      setIsListening(false);
      setFrequency(null);
      setNoteInfo(null);
      setClosestString(null);
      setInTuneConfirmed(false);
    } else {
      // Start
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
        streamRef.current = stream;

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 8192;
        analyser.smoothingTimeConstant = 0;
        analyserRef.current = analyser;

        audioBufferRef.current = new Float32Array(analyser.fftSize);

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        setIsListening(true);
        setPermissionDenied(false);
        console.log('[Tuner] Microphone started, sample rate:', audioContext.sampleRate);
        animationFrameRef.current = requestAnimationFrame(detectPitch);
      } catch (err) {
        console.error('[Tuner] Microphone access error:', err);
        setPermissionDenied(true);
        toast.error('Microphone access denied. Please allow microphone access in your browser settings.');
      }
    }
  }, [isListening, detectPitch]);

  // Update RMS threshold when sensitivity changes
  useEffect(() => {
    const mappedThreshold = 0.001 + (1 - sensitivity / 100) * 0.04;
    (globalThis as any).__tunerRmsThreshold = mappedThreshold;
    localStorage.setItem('tuner-mic-sensitivity', sensitivity.toString());
  }, [sensitivity]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tuningDropdownRef.current && !tuningDropdownRef.current.contains(e.target as Node)) {
        setTuningDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-start on mount
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      console.log('[Tuner] Auto-starting microphone...');
      toggleListening();
    }
  }, [toggleListening]);

  // Play reference tone
  const playReferenceTone = useCallback((frequency: number) => {
    try {
      // Stop any existing tone
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      if (gainRef.current) {
        gainRef.current.disconnect();
        gainRef.current = null;
      }

      // Create audio context if needed (for reference tones)
      const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();

      // Create oscillator + gain
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.value = 0.3; // Volume
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      oscillatorRef.current = osc;
      gainRef.current = gain;
      
      osc.start();
      
      // Auto-stop after 1 second
      setTimeout(() => {
        if (oscillatorRef.current) {
          try {
            oscillatorRef.current.stop();
            oscillatorRef.current.disconnect();
          } catch (e) {
            // Already stopped
          }
          oscillatorRef.current = null;
        }
        if (gainRef.current) {
          gainRef.current.disconnect();
          gainRef.current = null;
        }
      }, 1000);
      
      console.log('[Tuner] Playing reference tone:', frequency, 'Hz');
    } catch (err) {
      console.error('[Tuner] Error playing reference tone:', err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Calculate cents offset for each string
  const stringCentsOffsets = useMemo(() => {
    if (!frequency || !closestString) return {};
    
    const offsets: Record<number, number> = {};
    selectedTuning.strings.forEach(str => {
      const cents = Math.round(1200 * Math.log2(frequency / str.freq));
      offsets[str.string] = cents;
    });
    return offsets;
  }, [frequency, closestString, selectedTuning.strings]);

  // Visual pitch meter bars
  const pitchMeterBars = useMemo(() => {
    const bars = [];
    const totalBars = 41; // Centered meter with 41 bars
    const centerIndex = 20;
    
    for (let i = 0; i < totalBars; i++) {
      const distanceFromCenter = Math.abs(i - centerIndex);
      let color = 'bg-zinc-800';
      
      if (noteInfo && closestString) {
        const barCents = ((i - centerIndex) / centerIndex) * 50; // -50 to +50 cents
        const currentCents = noteInfo.cents;
        
        // Highlight bars based on current cents
        if (Math.abs(barCents - currentCents) < 2.5) {
          if (Math.abs(currentCents) <= 5) {
            color = 'bg-emerald-500';
          } else if (Math.abs(currentCents) <= 15) {
            color = 'bg-yellow-500';
          } else {
            color = 'bg-red-500';
          }
        } else if (distanceFromCenter < 3) {
          color = 'bg-zinc-700';
        }
      }
      
      bars.push(
        <div
          key={i}
          className={`w-1 h-12 rounded-full transition-colors duration-100 ${color}`}
        />
      );
    }
    return bars;
  }, [noteInfo, closestString]);

  return (
    <div className="bg-black text-white min-h-screen pb-24">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Tune Your <span className="text-amber-500">Guitar</span>
          </h1>
          
          {/* Tuning Selector */}
          <div className="flex justify-center">
            <div className="relative" ref={tuningDropdownRef}>
              <button
                onClick={() => setTuningDropdownOpen(!tuningDropdownOpen)}
                className="flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <span className="font-bold text-lg">{selectedTuning.label}</span>
                <span className="text-zinc-500 text-sm tracking-wider">
                  {selectedTuning.strings.map(s => s.display).join(' ')}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-amber-500 transition-transform ${
                    tuningDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              {tuningDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-2 left-0 right-0 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden z-10 shadow-2xl"
                >
                  {TUNING_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setSelectedTuning(preset);
                        setTuningDropdownOpen(false);
                      }}
                      className="w-full px-6 py-4 text-left hover:bg-zinc-800 transition-colors"
                    >
                      <div className="font-bold text-lg">{preset.label}</div>
                      <div className="text-sm text-zinc-500 tracking-wider">
                        {preset.strings.map(s => s.display).join(' ')}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
          
          <p className="text-sm text-zinc-500 mt-4">
            Play a string and the tuner will detect the pitch.
          </p>
        </div>

        {/* Main Display Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 mb-6">
          {/* Note Display with Octave */}
          <div className="text-center mb-6">
            <div className={`text-8xl md:text-9xl font-black transition-colors duration-200 ${
              !noteInfo ? 'text-zinc-800' :
              Math.abs(noteInfo.cents) <= 5 ? 'text-emerald-500' :
              Math.abs(noteInfo.cents) <= 15 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {noteInfo ? (
                <>
                  {noteInfo.note}
                  <sub className="text-4xl md:text-5xl">{noteInfo.octave}</sub>
                </>
              ) : (
                <span className="text-zinc-800">—</span>
              )}
            </div>
          </div>

          {/* Frequency + Target */}
          <div className="text-center mb-6 space-y-1">
            <div className={`text-xl font-mono ${noteInfo ? 'text-white' : 'text-zinc-700'}`}>
              {frequency ? `${frequency.toFixed(1)} Hz` : '0.0 Hz'}
            </div>
            {closestString && (
              <div className="text-sm text-zinc-500">
                Target: {closestString.note} ({closestString.freq.toFixed(1)} Hz)
              </div>
            )}
          </div>

          {/* Visual Pitch Meter */}
          <div className="mb-6">
            <div className="flex justify-center items-end gap-0.5 h-16">
              {pitchMeterBars}
            </div>
          </div>

          {/* Cents Display */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-between text-sm text-zinc-500 mb-2">
              <span>♭ Flat</span>
              <span className={`font-bold text-2xl ${
                !noteInfo ? 'text-zinc-700' :
                Math.abs(noteInfo.cents) <= 5 ? 'text-emerald-500' :
                Math.abs(noteInfo.cents) <= 15 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {noteInfo ? `${noteInfo.cents > 0 ? '+' : ''}${noteInfo.cents} cents` : '0 cents'}
              </span>
              <span>Sharp ♯</span>
            </div>
          </div>

          {/* IN TUNE Message */}
          {inTuneConfirmed && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl mb-6"
            >
              <div className="text-2xl font-black text-emerald-500 flex items-center justify-center gap-2">
                IN TUNE <Check className="w-6 h-6" />
              </div>
            </motion.div>
          )}

          {/* Mic Sensitivity */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Mic className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                MIC SENSITIVITY
              </span>
              <span className="ml-auto text-sm font-bold text-white">{sensitivity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
            />
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Calibration */}
          <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-3">
              <Crosshair className="w-5 h-5 text-amber-500" />
              <span className="font-bold uppercase tracking-wider text-sm">Calibration</span>
            </div>
            <button
              onClick={() => setShowCalibration(true)}
              className="px-4 py-2 border-2 border-amber-500 text-amber-500 rounded-lg font-bold hover:bg-amber-500/10 transition-colors text-sm"
            >
              <Crosshair className="w-4 h-4 inline mr-1" />
              Calibrate
            </button>
          </div>

          {permissionDenied && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="text-red-500 text-sm font-bold text-center">
                Microphone access denied. Please enable microphone permissions.
              </div>
            </div>
          )}
        </div>

        {/* Strings Section */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">STRINGS</h2>
            <button
              onClick={() => setAutoDetect(!autoDetect)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                autoDetect
                  ? 'bg-amber-500 text-zinc-950'
                  : 'border-2 border-amber-500 text-amber-500 hover:bg-amber-500/10'
              }`}
            >
              <Mic className="w-4 h-4 inline mr-1" />
              Auto-Detect
            </button>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {selectedTuning.strings.map((string) => {
              const isSelected = selectedString === string.string;
              const isClosest = closestString?.string === string.string;
              const centsOffset = stringCentsOffsets[string.string];
              const hasOffset = centsOffset !== undefined && Math.abs(centsOffset) < 400;
              
              return (
                <button
                  key={string.string}
                  onClick={() => {
                    setSelectedString(isSelected ? null : string.string);
                    playReferenceTone(string.freq);
                  }}
                  className={`relative border-2 rounded-xl px-2 py-4 transition-all ${
                    isSelected && isClosest
                      ? 'bg-emerald-500/20 border-emerald-500'
                      : isSelected
                      ? 'bg-zinc-800 border-zinc-600'
                      : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800'
                  }`}
                >
                  {isSelected && isClosest && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                  )}
                  
                  <div className="text-[10px] mb-1 text-zinc-500">String {string.string}</div>
                  <div className="text-2xl font-black">{string.display}</div>
                  
                  {hasOffset && (
                    <div className={`text-xs mt-1 font-mono ${
                      Math.abs(centsOffset) <= 5
                        ? 'text-emerald-500'
                        : Math.abs(centsOffset) <= 20
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}>
                      {centsOffset > 0 ? '+' : ''}{centsOffset}¢
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calibration Wizard */}
      <CalibrationWizard open={showCalibration} onClose={() => setShowCalibration(false)} />
    </div>
  );
}
