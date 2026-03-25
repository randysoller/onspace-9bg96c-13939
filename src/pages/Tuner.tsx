import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Mic, MicOff, Music, X, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
    name: 'open-g',
    label: 'Open G',
    strings: [
      { string: 6, note: 'D2', freq: 73.42, display: 'D' },
      { string: 5, note: 'G2', freq: 98.00, display: 'G' },
      { string: 4, note: 'D3', freq: 146.83, display: 'D' },
      { string: 3, note: 'G3', freq: 196.00, display: 'G' },
      { string: 2, note: 'B3', freq: 246.94, display: 'B' },
      { string: 1, note: 'D4', freq: 293.66, display: 'D' },
    ],
  },
  {
    name: 'open-d',
    label: 'Open D',
    strings: [
      { string: 6, note: 'D2', freq: 73.42, display: 'D' },
      { string: 5, note: 'A2', freq: 110.00, display: 'A' },
      { string: 4, note: 'D3', freq: 146.83, display: 'D' },
      { string: 3, note: 'F#3', freq: 185.00, display: 'F#' },
      { string: 2, note: 'A3', freq: 220.00, display: 'A' },
      { string: 1, note: 'D4', freq: 293.66, display: 'D' },
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
  const [playingString, setPlayingString] = useState<number | null>(null);
  const [inTuneConfirmed, setInTuneConfirmed] = useState(false);
  const [sensitivity, setSensitivity] = useState(() => {
    const saved = localStorage.getItem('tuner-mic-sensitivity');
    return saved !== null ? Number(saved) : 60;
  });

  const sensitivityRef = useRef(60);
  const startedRef = useRef(false);
  const inTuneStartRef = useRef<number | null>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioBufferRef = useRef<Float32Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Pitch detection loop
  const detectPitch = useCallback(() => {
    if (!analyserRef.current || !audioBufferRef.current || !audioContextRef.current) {
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

      // Check in-tune state
      if (Math.abs(info.cents) <= 5) {
        if (inTuneStartRef.current === null) {
          inTuneStartRef.current = performance.now();
        } else if (performance.now() - inTuneStartRef.current > 500) {
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
  }, [selectedTuning]);

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
        animationFrameRef.current = requestAnimationFrame(detectPitch);
      } catch (err) {
        console.error('Microphone access error:', err);
        setPermissionDenied(true);
        toast.error('Microphone access denied');
      }
    }
  }, [isListening, detectPitch]);

  // Play reference tone
  const playReferenceTone = useCallback((freq: number, stringNum: number) => {
    if (!audioContextRef.current) {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = context;
    }

    const context = audioContextRef.current;

    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current = null;
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    gainNode.gain.value = 0.3;

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start();
    oscillatorRef.current = oscillator;
    gainNodeRef.current = gainNode;

    setPlayingString(stringNum);

    setTimeout(() => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
      }
      setPlayingString(null);
    }, 2000);
  }, []);

  // Update RMS threshold when sensitivity changes
  useEffect(() => {
    const mappedThreshold = 0.001 + (1 - sensitivity / 100) * 0.04;
    (globalThis as any).__tunerRmsThreshold = mappedThreshold;
    sensitivityRef.current = sensitivity;
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
      toggleListening();
    }
  }, [toggleListening]);

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
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
      }
    };
  }, []);

  const centsBarFill = useMemo(() => {
    if (!noteInfo) return 50;
    return 50 + (noteInfo.cents / 50) * 50;
  }, [noteInfo]);

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
          
          <button
            onClick={toggleListening}
            className={`p-2 rounded-lg transition-colors ${
              isListening ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-black mb-2">
            Tune Your <span className="text-amber-500">Guitar</span>
          </h1>
          
          {/* Tuning Selector */}
          <div className="flex justify-center">
            <div className="relative" ref={tuningDropdownRef}>
              <button
                onClick={() => setTuningDropdownOpen(!tuningDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <span className="font-bold">{selectedTuning.label}</span>
                <span className="text-zinc-500">{selectedTuning.strings.map(s => s.display).join(' ')}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${tuningDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {tuningDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-2 left-0 right-0 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden z-10"
                >
                  {TUNING_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setSelectedTuning(preset);
                        setTuningDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors"
                    >
                      <div className="font-bold">{preset.label}</div>
                      <div className="text-sm text-zinc-500">{preset.strings.map(s => s.display).join(' ')}</div>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Main Display */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8 mb-6">
          {/* Note Display */}
          <div className="text-center mb-6">
            <div className="relative inline-flex items-center justify-center bg-black rounded-2xl px-12 py-8" style={{ minHeight: '180px', minWidth: '200px' }}>
              {inTuneConfirmed && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-4 border-4 border-emerald-500 rounded-full"
                />
              )}
              
              <div className={`text-8xl md:text-9xl font-black transition-colors duration-200 ${
                !noteInfo ? 'text-zinc-700' :
                Math.abs(noteInfo.cents) <= 5 ? 'text-emerald-500' :
                Math.abs(noteInfo.cents) <= 15 ? 'text-yellow-500' : 'text-red-500'
              }`} style={{ minHeight: '120px', minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {noteInfo ? noteInfo.note : '\u00A0'}
              </div>
            </div>
            
            {permissionDenied && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <div className="text-red-500 text-sm font-bold text-center">
                  Microphone access denied. Please enable microphone permissions.
                </div>
              </div>
            )}
          </div>

          {/* Cents Bar */}
          <div className="mb-6">
            <div className="h-24 bg-zinc-800 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-0.5 h-full bg-white opacity-50" />
              </div>
              
              {frequency && noteInfo && (
                <motion.div
                  className={`absolute top-0 bottom-0 w-1 ${
                    Math.abs(noteInfo.cents) <= 5 ? 'bg-emerald-500' :
                    Math.abs(noteInfo.cents) <= 15 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ left: `${centsBarFill}%` }}
                  initial={false}
                  animate={{ left: `${centsBarFill}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </div>
            
            <div className="flex items-center justify-between text-sm text-zinc-500 mt-2">
              <span>♭ Flat</span>
              <span className={`font-bold ${
                !noteInfo ? 'text-zinc-600' :
                Math.abs(noteInfo.cents) <= 5 ? 'text-emerald-500' :
                Math.abs(noteInfo.cents) <= 15 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {noteInfo ? `${noteInfo.cents > 0 ? '+' : ''}${noteInfo.cents} cents` : '0 cents'}
              </span>
              <span>Sharp ♯</span>
            </div>
          </div>

          {/* Sensitivity Control */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold uppercase tracking-wider text-white">Sensitivity</span>
              <span className="ml-auto text-sm font-bold text-white">{sensitivity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
            />
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>More Sensitive</span>
              <span>Less Sensitive</span>
            </div>
          </div>

          {/* Frequency Display */}
          {frequency && (
            <div className="text-center text-sm text-zinc-500">
              {frequency.toFixed(2)} Hz
            </div>
          )}
        </div>

        {/* Strings */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
          <div className="text-center mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Reference Tones</h2>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {selectedTuning.strings.map((string) => (
              <button
                key={string.string}
                onClick={() => playReferenceTone(string.freq, string.string)}
                className={`border rounded-lg px-2 py-3 transition-all ${
                  playingString === string.string
                    ? 'bg-amber-500 border-amber-500 text-zinc-950'
                    : closestString?.string === string.string
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                    : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white'
                }`}
              >
                <div className={`text-[10px] mb-1 ${
                  playingString === string.string ? 'text-zinc-950/70' : 'text-zinc-500'
                }`}>{string.string}</div>
                <div className="text-lg font-black">{string.display}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
