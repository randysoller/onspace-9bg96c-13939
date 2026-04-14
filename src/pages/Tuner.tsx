
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Mic, MicOff, Music, Volume2, X, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGuitarString } from '@/hooks/useGuitarString';

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
    name: 'open-e',
    label: 'Open E',
    strings: [
      { string: 6, note: 'E2', freq: 82.41, display: 'E' },
      { string: 5, note: 'B2', freq: 123.47, display: 'B' },
      { string: 4, note: 'E3', freq: 164.81, display: 'E' },
      { string: 3, note: 'G#3', freq: 207.65, display: 'G#' },
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
  {
    // Chromatic: no string targets — detects any note across all octaves
    name: 'chromatic',
    label: 'Chromatic',
    strings: [],
  },
];

// ─── Environment Sensitivity Presets ────────────────────

const SENSITIVITY_PRESETS = {
  quiet:  { rmsBase: 0.003, confidenceGate: 0.40, deadZone: 3 },
  normal: { rmsBase: 0.005, confidenceGate: 0.50, deadZone: 4 },
  noisy:  { rmsBase: 0.012, confidenceGate: 0.60, deadZone: 6 },
} as const;
type EnvPreset = keyof typeof SENSITIVITY_PRESETS;

const PRESET_META: Record<EnvPreset, { label: string; icon: string; desc: string }> = {
  quiet:  { label: 'Quiet Room',  icon: '🤫', desc: 'Silent practice · no background noise' },
  normal: { label: 'Normal Room', icon: '🏠', desc: 'Typical home or studio environment' },
  noisy:  { label: 'Noisy Room',  icon: '🎸', desc: 'Band practice · ambient noise present' },
};

const FREQ_HISTORY_SIZE = 5;
const minConfidence = 0.2;

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

function autoCorrelate(buffer: Float32Array, sampleRate: number, expectedFreq?: number): PitchResult | null {
  // Use a sub-window for consistent, efficient analysis (4096 samples is plenty for guitar)
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

  // Apply Hanning window for cleaner spectral analysis
  const windowed = new Float32Array(windowSize);
  for (let i = 0; i < windowSize; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (windowSize - 1)));
    windowed[i] = buffer[offset + i] * w;
  }

  // Optimized lag range for guitar: ~60 Hz to ~1400 Hz
  const minLag = Math.max(1, Math.floor(sampleRate / 1500));
  const maxLag = Math.min(halfSize - 1, Math.ceil(sampleRate / 55));

  // Normalized Square Difference Function (NSDF)
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

  // Find first zero crossing after minLag
  let firstZero = minLag;
  while (firstZero <= maxLag && nsdf[firstZero] > 0) {
    firstZero++;
  }

  // Collect all positive-region peaks
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
    if (peakVal >= minConfidence) {
      peaks.push({ tau: peakTau, val: peakVal });
    }
  }

  if (peaks.length === 0) return null;

  // Pick first peak above its applicable threshold (lowest frequency = fundamental).
  // Problem 1 fix: lower threshold for on-target peaks helps weak fundamentals beat harmonics.
  // Problem 6 fix: raise threshold for wound-string frequencies (55–200 Hz) to aggressively
  // reject false early NSDF peaks caused by the stronger harmonics on wound strings (E2/A2/D3).
  // Priority: ON_TARGET (0.32) always overrides WOUND_STRING (0.50) when both apply.
  const ON_TARGET_THRESHOLD = 0.32;    // easier bar for confirmed-fundamental peaks
  const WOUND_STRING_THRESHOLD = 0.50; // harder bar for wound-string off-target peaks
  const OFF_TARGET_THRESHOLD = 0.42;   // original threshold for plain-string off-target peaks
  let bestTau = -1;
  let bestVal = -Infinity;
  for (const p of peaks) {
    const peakFreq = sampleRate / p.tau;
    // Base threshold: wound strings need a higher bar to reject false harmonic peaks
    let peakThreshold = (peakFreq >= 55 && peakFreq <= 200)
      ? WOUND_STRING_THRESHOLD
      : OFF_TARGET_THRESHOLD;
    if (expectedFreq) {
      const centsDiff = Math.abs(1200 * Math.log2(peakFreq / expectedFreq));
      // On-target override: within ±200 cents of expected fundamental → lower threshold
      // This always overrides the wound-string raise so weak D3 fundamentals still win.
      if (centsDiff <= 200) {
        peakThreshold = ON_TARGET_THRESHOLD;
      }
    }
    if (p.val >= peakThreshold) {
      bestTau = p.tau;
      bestVal = p.val;
      break;
    }
  }

  // Fallback: strongest peak
  if (bestTau <= 0) {
    for (const p of peaks) {
      if (p.val > bestVal) {
        bestVal = p.val;
        bestTau = p.tau;
      }
    }
  }

  if (bestTau <= 0 || bestVal < 0.25) return null;

  // Parabolic interpolation for sub-sample precision
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
  // Guitar range ~55Hz to ~1400Hz
  if (frequency < 55 || frequency > 1400) return null;
  return { frequency, confidence: bestVal };
}

// Note-lock helper: computes the equal-temperament reference frequency for a note+octave.
// Used to calculate cents-from-lock for release threshold comparison.
function lockedNoteFreq(note: string, octave: number): number {
  const idx = NOTE_STRINGS.indexOf(note as typeof NOTE_STRINGS[number]);
  // Semitones from A4: each octave is 12 semitones, A is index 9
  return 440 * Math.pow(2, ((octave - 4) * 12 + (idx - 9)) / 12);
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

export default function TunerPanel() {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [selectedTuning, setSelectedTuning] = useState<TuningPreset>(TUNING_PRESETS[0]);
  const [tuningDropdownOpen, setTuningDropdownOpen] = useState(false);
  const tuningDropdownRef = useRef<HTMLDivElement>(null);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [noteInfo, setNoteInfo] = useState<{ note: string; octave: number; cents: number } | null>(null);
  const [closestString, setClosestString] = useState<GuitarString | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [selectedString, setSelectedString] = useState<GuitarString | null>(null);
  const [playingString, setPlayingString] = useState<number | null>(null);
  const [inTuneConfirmed, setInTuneConfirmed] = useState(false);
  // inTuneActive: true while absCents <= 5 (drives counter + pulse)
  const [inTuneActive, setInTuneActive] = useState(false);
  const [heldSeconds, setHeldSeconds] = useState(0);
  // pulseKey: incremented false→true on inTuneConfirmed to re-mount pulse ring
  const [pulseKey, setPulseKey] = useState(0);
  // Environment preset — drives rmsThreshold, confidence gate, and dead-zone simultaneously
  const [envPreset, setEnvPreset] = useState<EnvPreset>(() =>
    (localStorage.getItem('tuner-env-preset') as EnvPreset | null) ?? 'normal'
  );
  const confidenceGateRef = useRef(SENSITIVITY_PRESETS.normal.confidenceGate);
  const deadZoneCentsRef  = useRef(SENSITIVITY_PRESETS.normal.deadZone);
  const rmsBaseRef        = useRef(SENSITIVITY_PRESETS.normal.rmsBase);
  const startedRef = useRef(false);
  const inTuneStartRef = useRef<number>(0);
  const inTuneSoundPlayedRef = useRef(false);
  const selectedStringRef = useRef<GuitarString | null>(null);
  const selectedTuningRef = useRef<TuningPreset>(TUNING_PRESETS[0]);

  const [displayNote, setDisplayNote] = useState<{ note: string; octave: number; cents: number } | null>(null);
  const [displayFreq, setDisplayFreq] = useState<number | null>(null);
  const [displayClosest, setDisplayClosest] = useState<GuitarString | null>(null);
  const holdTimerRef = useRef<number>(0);
  const smoothedFreqRef = useRef<number | null>(null);
  // Frequency history buffer for median filtering / outlier rejection
  const freqHistoryRef = useRef<number[]>([]);
  const confidenceHistoryRef = useRef<number[]>([]);
  // Option 4: track last displayed cents for dead-zone hysteresis
  const lastDisplayedCentsRef = useRef<number | null>(null);

  // Problem 5: debounce closest-string switching to prevent cents graph zigzag
  // when detection alternates between D3/D4 or other adjacent octaves.
  const lastDisplayedClosestRef = useRef<GuitarString | null>(null);
  const displayClosestSwitchedAtRef = useRef<number>(0);

  // Note-lock stabilization: mimics professional hardware tuner behavior.
  // Lock activates after 3+ consecutive frames agree on the same note (name+octave).
  // Lock releases only when smoothed frequency drifts >50 cents from the locked note.
  const noteLockRef = useRef<{ note: string; octave: number; refFreq: number } | null>(null);
  const consecutiveCountRef = useRef(0);
  const lastNoteKeyRef = useRef('');

  useEffect(() => { selectedStringRef.current = selectedString; }, [selectedString]);
  useEffect(() => { selectedTuningRef.current = selectedTuning; }, [selectedTuning]);

  // Sync all three detect-loop parameters when environment preset changes.
  // Refs are read inside the RAF loop, so no restart is needed — takes effect next tick.
  useEffect(() => {
    const cfg = SENSITIVITY_PRESETS[envPreset];
    confidenceGateRef.current = cfg.confidenceGate;
    deadZoneCentsRef.current  = cfg.deadZone;
    rmsBaseRef.current        = cfg.rmsBase;
    localStorage.setItem('tuner-env-preset', envPreset);
  }, [envPreset]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tuningDropdownRef.current && !tuningDropdownRef.current.contains(e.target as Node)) {
        setTuningDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeStrings = useMemo(() => selectedTuning.strings, [selectedTuning]);
  const isChromatic = selectedTuning.name === 'chromatic';

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);
  const bufferRef = useRef<Float32Array | null>(null);

  const { playString: playGuitarString } = useGuitarString();

  const chimeCtxRef = useRef<AudioContext | null>(null);
  const getChimeCtx = useCallback(() => {
    if (!chimeCtxRef.current || chimeCtxRef.current.state === 'closed') {
      chimeCtxRef.current = new AudioContext();
    }
    if (chimeCtxRef.current.state === 'suspended') {
      chimeCtxRef.current.resume();
    }
    return chimeCtxRef.current;
  }, []);

  const playCowbellSound = useCallback(() => {
    try {
      const ctx = getChimeCtx();
      const now = ctx.currentTime;
      const duration = 1.4;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.5, now);
      masterGain.gain.setTargetAtTime(0.0001, now + 0.06, duration * 0.28);
      masterGain.connect(ctx.destination);

      const highShelf = ctx.createBiquadFilter();
      highShelf.type = 'highshelf';
      highShelf.frequency.value = 3000;
      highShelf.gain.value = 4;
      highShelf.connect(masterGain);

      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 800;
      hp.Q.value = 0.5;
      hp.connect(highShelf);

      const partials = [
        { freq: 1568, amp: 0.40, decay: 0.45 },
        { freq: 2350, amp: 0.25, decay: 0.32 },
        { freq: 3136, amp: 0.15, decay: 0.22 },
        { freq: 4700, amp: 0.06, decay: 0.14 },
      ];
      partials.forEach(({ freq, amp, decay }) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.setValueAtTime(amp, now);
        g.gain.setTargetAtTime(0.0001, now + 0.02, duration * decay);
        osc.connect(g);
        g.connect(hp);
        osc.start(now);
        osc.stop(now + duration);
      });

      const tLen = Math.floor(ctx.sampleRate * 0.006);
      const tBuf = ctx.createBuffer(1, tLen, ctx.sampleRate);
      const tData = tBuf.getChannelData(0);
      for (let i = 0; i < tLen; i++) tData[i] = (Math.random() * 2 - 1) * 0.15;
      const tSrc = ctx.createBufferSource();
      tSrc.buffer = tBuf;
      const tBP = ctx.createBiquadFilter();
      tBP.type = 'bandpass';
      tBP.frequency.value = 4000;
      tBP.Q.value = 2;
      const tGain = ctx.createGain();
      tGain.gain.setValueAtTime(0.12, now);
      tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      tSrc.connect(tBP);
      tBP.connect(tGain);
      tGain.connect(hp);
      tSrc.start(now);
    } catch (e) {
      console.log('Chime sound error:', e);
    }
  }, [getChimeCtx]);

  const playReferenceTone = useCallback((gs: GuitarString) => {
    playGuitarString({ frequency: gs.freq, duration: 3.0, volume: 0.891 }); // -1.0 dB
    setPlayingString(gs.string);
    setTimeout(() => setPlayingString((prev) => prev === gs.string ? null : prev), 2200);
  }, [playGuitarString]);

  const stopListening = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = 0;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    bufferRef.current = null;
    smoothedFreqRef.current = null;
    freqHistoryRef.current = [];
    confidenceHistoryRef.current = [];
    lastDisplayedCentsRef.current = null;
    lastDisplayedClosestRef.current = null;
    displayClosestSwitchedAtRef.current = 0;
    noteLockRef.current = null;
    consecutiveCountRef.current = 0;
    lastNoteKeyRef.current = '';
    setIsListening(false);
    setFrequency(null);
    setNoteInfo(null);
    setClosestString(null);
    setDisplayNote(null);
    setDisplayFreq(null);
    setDisplayClosest(null);
    setInTuneConfirmed(false);
    setInTuneActive(false);
    setHeldSeconds(0);
  }, []);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: { ideal: 1 },
        },
      });
      const ctx = new AudioContext();

      const source = ctx.createMediaStreamSource(stream);

      // High-pass to remove sub-bass rumble
      const highPass = ctx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = 50;
      highPass.Q.value = 0.71;
      source.connect(highPass);

      // Notch out 50/60 Hz mains hum
      const notch1 = ctx.createBiquadFilter();
      notch1.type = 'notch';
      notch1.frequency.value = 50;
      notch1.Q.value = 12;
      highPass.connect(notch1);

      const notch2 = ctx.createBiquadFilter();
      notch2.type = 'notch';
      notch2.frequency.value = 60;
      notch2.Q.value = 12;
      notch1.connect(notch2);

      // Mild boost in guitar fundamental range (80-500 Hz)
      const midBoost = ctx.createBiquadFilter();
      midBoost.type = 'peaking';
      // Lowered from 200 Hz to 150 Hz: D3 (147 Hz) is now at the boost center
      // instead of its first harmonic D4 (294 Hz), reducing octave-jump frequency.
      // Q widened from 0.5 to 0.35 so the boost is flatter across the wound-string
      // range (80–300 Hz) rather than selectively amplifying specific harmonics.
      midBoost.frequency.value = 150;
      midBoost.Q.value = 0.35;
      midBoost.gain.value = 3;
      notch2.connect(midBoost);

      // Reduce high-frequency noise above guitar range
      const lowPass = ctx.createBiquadFilter();
      lowPass.type = 'lowpass';
      lowPass.frequency.value = 4000;
      lowPass.Q.value = 0.5;
      midBoost.connect(lowPass);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 8192;
      analyser.smoothingTimeConstant = 0;
      lowPass.connect(analyser);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      mediaStreamRef.current = stream;
      sourceRef.current = source;
      bufferRef.current = new Float32Array(analyser.fftSize);

      getChimeCtx();

      setIsListening(true);
      setPermissionDenied(false);

      const detect = () => {
        if (!analyserRef.current || !bufferRef.current || !audioCtxRef.current) return;

        analyserRef.current.getFloatTimeDomainData(bufferRef.current);
        // Problem 1: pass the previous frame's known expected frequency so autoCorrelate
        // can bias peak selection toward the fundamental lag, reducing octave-jump frequency.
        // Uses selectedString first, then the debounced closest string from the prior frame.
        const expectedFreq =
          selectedStringRef.current?.freq ??
          lastDisplayedClosestRef.current?.freq ??
          undefined;

        // Wound-string RMS scaling: E2/A2/D3/G3 (< 200 Hz) produce less RMS energy at the
        // pickup than plain treble strings. A 30% lower gate prevents valid wound-string signals
        // from being silenced by a threshold calibrated for higher-output plain strings.
        // Guard: only applies when expectedFreq is known (not chromatic mode or first frame).
        // Base threshold driven by active environment preset (quiet/normal/noisy).
        let rmsThreshold = rmsBaseRef.current;
        if (expectedFreq !== undefined && expectedFreq < 200) {
          rmsThreshold *= 0.70;
        }
        (globalThis as any).__tunerRmsThreshold = rmsThreshold;

        const pitchResult = autoCorrelate(bufferRef.current, audioCtxRef.current.sampleRate, expectedFreq);

        if (pitchResult) {
          const { frequency: rawFreq, confidence } = pitchResult;

          // ─── Outlier Rejection via Median Filter ───
          const history = freqHistoryRef.current;
          const confHistory = confidenceHistoryRef.current;

          // Check if this reading is an outlier (octave jump, harmonic artifact)
          let isOutlier = false;
          if (history.length >= 3) {
            // Compute median of recent readings
            const sorted = [...history].sort((a, b) => a - b);
            const median = sorted[Math.floor(sorted.length / 2)];
            const ratio = rawFreq / median;
            // Reject if more than ~4 semitones from median (ratio ~1.26)
            // unless confidence is very high (strong new note)
            if ((ratio > 1.28 || ratio < 0.78) && confidence < 0.7) {
              isOutlier = true;
            }
            // Also reject likely octave errors (ratio near 2 or 0.5) with low confidence
            if ((ratio > 1.9 && ratio < 2.1) || (ratio > 0.48 && ratio < 0.52)) {
              if (confidence < 0.75) isOutlier = true;
            }
          }

          if (isOutlier) {
            // Skip this reading entirely
            rafRef.current = requestAnimationFrame(detect);
            return;
          }

          // Option 2: Confidence gating — hold last displayed value for weak/unreliable frames.
          // Value driven by active environment preset: quiet=0.4, normal=0.5, noisy=0.6
          const CONFIDENCE_GATE = confidenceGateRef.current;
          if (confidence < CONFIDENCE_GATE) {
            rafRef.current = requestAnimationFrame(detect);
            return;
          }

          // Add to history buffer
          history.push(rawFreq);
          confHistory.push(confidence);
          if (history.length > FREQ_HISTORY_SIZE) history.shift();
          if (confHistory.length > FREQ_HISTORY_SIZE) confHistory.shift();

          // ─── Fixed EMA Smoothing (α = 0.2) with Octave-Boundary Snap (Problem 3) ───
          // Normal operation: 80% old + 20% new per frame — smooth transitions.
          // Problem 3: when rawFreq is near 2× or 0.5× the expected string's frequency,
          // bypass EMA and snap directly. Without this, an octave error takes ~15 frames
          // (~250ms) to resolve, rendering the cents graph unreadable during the crossing.
          const EMA_ALPHA = 0.2;
          let freq = rawFreq;
          if (smoothedFreqRef.current !== null) {
            const ratio = rawFreq / smoothedFreqRef.current;

            // Octave-boundary snap: fires when rawFreq lands near an octave multiple of
            // the expected string, meaning the detector just jumped to/from a harmonic.
            let snapToRaw = false;
            if (expectedFreq) {
              const ratioToExpected = rawFreq / expectedFreq;
              // 1.8–2.2× = near one octave above; 0.45–0.55× = near one octave below
              if ((ratioToExpected > 1.8 && ratioToExpected < 2.2) ||
                  (ratioToExpected > 0.45 && ratioToExpected < 0.55)) {
                snapToRaw = true;
              }
            }

            if (snapToRaw || ratio > 1.5 || ratio < 0.67) {
              // Purge stale history on octave snap OR any other large note change
              freqHistoryRef.current = [rawFreq];
              confidenceHistoryRef.current = [confidence];
            }

            // Apply snap or EMA — snap lets note-lock immediately see the new octave
            // rather than evaluating ambiguous intermediate frequencies for many frames.
            freq = snapToRaw
              ? rawFreq
              : smoothedFreqRef.current * (1 - EMA_ALPHA) + rawFreq * EMA_ALPHA;
          }

          smoothedFreqRef.current = freq;
          const info = frequencyToNoteInfo(freq);
          const closest = findClosestString(freq, selectedTuningRef.current.strings);

          // Problem 5: debounce closest-string switching — hold current string for ≥500ms
          // before accepting a switch, so the cents graph reference doesn't zigzag when
          // detection alternates between D3 and D4 frame-by-frame.
          const CLOSEST_DEBOUNCE_MS = 500;
          let effectiveClosest = closest;
          if (closest) {
            if (!lastDisplayedClosestRef.current) {
              // First reading after silence — initialize immediately, no debounce needed
              lastDisplayedClosestRef.current = closest;
            } else if (closest.string !== lastDisplayedClosestRef.current.string) {
              const nowMs = performance.now();
              if (nowMs - displayClosestSwitchedAtRef.current < CLOSEST_DEBOUNCE_MS) {
                // Too soon — hold the existing closest string to stabilize the graph
                effectiveClosest = lastDisplayedClosestRef.current;
              } else {
                // Enough time has passed — accept the new string and record the switch time
                displayClosestSwitchedAtRef.current = nowMs;
                lastDisplayedClosestRef.current = closest;
              }
            }
          }

          // ─── Note-Lock Stabilization ───
          // Professional hardware tuners lock to a note after consistent detection
          // and only release when pitch genuinely moves to a new note (>50 cents drift).
          const detectedKey = `${info.note}${info.octave}`;

          // Problem 4: require 5 consecutive frames (instead of 3) to lock when the
          // detected note is the same letter name as the expected string but a different
          // octave. This prevents the note-lock from latching onto D4 during the
          // transient attack of a plucked D3, where harmonics temporarily peak first.
          const expectedForLock = selectedStringRef.current ?? lastDisplayedClosestRef.current;
          let lockThreshold = 3;
          if (expectedForLock) {
            const expLockInfo = frequencyToNoteInfo(expectedForLock.freq);
            if (info.note === expLockInfo.note && info.octave !== expLockInfo.octave) {
              lockThreshold = 5; // same note name, different octave = octave confusion
            }
          }

          if (noteLockRef.current !== null) {
            const centsFromLock = 1200 * Math.log2(freq / noteLockRef.current.refFreq);
            // Wound strings (< 200 Hz) use a tighter 40-cent release threshold so harmonic
            // interference at the D3/D4 boundary releases the lock sooner than the 50-cent
            // default used for plain treble strings.
            const lockReleaseThreshold = noteLockRef.current.refFreq < 200 ? 40 : 50;
            if (Math.abs(centsFromLock) > lockReleaseThreshold) {
              // Pitch has genuinely moved: release lock and start counting new note
              noteLockRef.current = null;
              consecutiveCountRef.current = 1;
              lastNoteKeyRef.current = detectedKey;
            } else if (detectedKey !== `${noteLockRef.current.note}${noteLockRef.current.octave}`) {
              // Stray frame near semitone boundary: suppress update, hold last display
              rafRef.current = requestAnimationFrame(detect);
              return;
            }
            // else: matches locked note — fall through to dead-zone + state update
          } else {
            // Not locked: count consecutive frames with the same note
            if (detectedKey === lastNoteKeyRef.current) {
              consecutiveCountRef.current++;
            } else {
              consecutiveCountRef.current = 1;
              lastNoteKeyRef.current = detectedKey;
            }
            // Activate lock after lockThreshold consistent frames (3 normal, 5 for octave-confused notes)
            if (consecutiveCountRef.current >= lockThreshold) {
              noteLockRef.current = {
                note: info.note,
                octave: info.octave,
                refFreq: lockedNoteFreq(info.note, info.octave),
              };
            }
          }

          // Option 4: Dead-zone hysteresis — suppress micro-jitter within ±N cents of last display.
          // Value driven by active environment preset: quiet=3, normal=4, noisy=6
          const DEAD_ZONE_CENTS = deadZoneCentsRef.current;
          // Use effectiveClosest (debounced) so the dead-zone reference matches the display reference
          const targetForDeadZone = selectedStringRef.current ?? effectiveClosest;
          const newCentsDisplay = targetForDeadZone
            ? Math.round(1200 * Math.log2(freq / targetForDeadZone.freq))
            : info.cents;
          if (
            lastDisplayedCentsRef.current !== null &&
            Math.abs(newCentsDisplay - lastDisplayedCentsRef.current) <= DEAD_ZONE_CENTS
          ) {
            // Within dead zone: skip state update but keep RAF running
            rafRef.current = requestAnimationFrame(detect);
            return;
          }
          lastDisplayedCentsRef.current = newCentsDisplay;

          setFrequency(freq);
          setNoteInfo(info);
          setClosestString(closest);
          setDisplayNote(info);
          setDisplayFreq(freq);
          setDisplayClosest(effectiveClosest);
          if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = 0; }

          const target = selectedStringRef.current ?? closest;
          const centsOff = target ? Math.round(1200 * Math.log2(freq / target.freq)) : info.cents;
          const absCents = Math.abs(centsOff);
          if (absCents <= 5) {
            if (inTuneStartRef.current === 0) inTuneStartRef.current = performance.now();
            setInTuneActive(true);
            if (!inTuneSoundPlayedRef.current && performance.now() - inTuneStartRef.current >= 500) {
              inTuneSoundPlayedRef.current = true;
              setInTuneConfirmed(true);
              playCowbellSound();
            }
          } else if (absCents > 12) {
            inTuneStartRef.current = 0;
            inTuneSoundPlayedRef.current = false;
            setInTuneActive(false);
            setInTuneConfirmed(false);
          }
        } else {
          setFrequency(null);
          setNoteInfo(null);
          setClosestString(null);
          if (!holdTimerRef.current) {
            holdTimerRef.current = window.setTimeout(() => {
              setDisplayNote(null);
              setDisplayFreq(null);
              setDisplayClosest(null);
              smoothedFreqRef.current = null;
              freqHistoryRef.current = [];
              confidenceHistoryRef.current = [];
              lastDisplayedCentsRef.current = null;
              lastDisplayedClosestRef.current = null;
              displayClosestSwitchedAtRef.current = 0;
              noteLockRef.current = null;
              consecutiveCountRef.current = 0;
              lastNoteKeyRef.current = '';
              holdTimerRef.current = 0;
              setInTuneActive(false);
              setHeldSeconds(0);
            }, 400);
          }
        }

        rafRef.current = requestAnimationFrame(detect);
      };

      rafRef.current = requestAnimationFrame(detect);
    } catch {
      setPermissionDenied(true);
      setIsListening(false);
    }
  }, [getChimeCtx, playCowbellSound, stopListening]);

  // Update held-seconds counter every 250ms while in-tune zone is active
  useEffect(() => {
    if (!inTuneActive) { setHeldSeconds(0); return; }
    const interval = setInterval(() => {
      if (inTuneStartRef.current > 0) {
        setHeldSeconds(Math.floor((performance.now() - inTuneStartRef.current) / 1000));
      }
    }, 250);
    return () => clearInterval(interval);
  }, [inTuneActive]);

  // Increment pulseKey each time inTuneConfirmed transitions false→true
  // This re-mounts the pulse ring motion.div, triggering the one-shot animation
  useEffect(() => {
    if (inTuneConfirmed) setPulseKey((k) => k + 1);
  }, [inTuneConfirmed]);

  useEffect(() => {
    const warmUp = () => {
      getChimeCtx();
      window.removeEventListener('click', warmUp);
      window.removeEventListener('touchstart', warmUp);
    };
    window.addEventListener('click', warmUp, { once: true });
    window.addEventListener('touchstart', warmUp, { once: true });
    return () => {
      window.removeEventListener('click', warmUp);
      window.removeEventListener('touchstart', warmUp);
    };
  }, [getChimeCtx]);

  // Auto-start listening when component mounts
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      startListening();
    }
    return () => {
      stopListening();
    };
  }, [startListening, stopListening]);

  const shownNote = displayNote;
  const shownFreq = displayFreq;
  const shownClosest = displayClosest;

  const cents = shownNote?.cents ?? 0;
  const isInTune = Math.abs(cents) <= 5;
  const isClose = Math.abs(cents) <= 15;

  const targetString = selectedString ?? shownClosest;
  const centsFromTarget = targetString && shownFreq
    ? Math.round(1200 * Math.log2(shownFreq / targetString.freq))
    : cents;
  const isTargetInTune = Math.abs(centsFromTarget) <= 5;
  const isTargetClose = Math.abs(centsFromTarget) <= 15;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 80 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed inset-x-0 top-0 bottom-[56px] sm:bottom-0 z-40 flex flex-col bg-[hsl(var(--bg-base))]"
      >
        {/* Scrollable tuner content */}
        <div className="flex-1 overflow-y-auto stage-gradient">
          {/* Header */}
          <div className="relative px-4 sm:px-6 pt-8 pb-4 text-center max-w-3xl mx-auto">
            {/* Close button */}
            <button
              onClick={() => { stopListening(); navigate(-1); }}
              className="absolute top-8 left-4 sm:left-6 flex items-center justify-center size-10 sm:size-8 rounded-lg hover:bg-[hsl(var(--color-primary)/0.12)] transition-colors active:scale-90 z-10"
              title="Close tuner"
            >
              <X className="size-6 text-[hsl(var(--color-primary))]" />
            </button>
            <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--color-primary)/0.3)] bg-[hsl(var(--color-primary)/0.08)] px-4 py-1.5 mb-4">
              <Music className="size-3.5 text-[hsl(var(--color-primary))]" />
              <span className="text-xs font-body font-medium text-[hsl(var(--color-primary))]">Guitar Tuner</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight">
              <span className="text-zinc-300">Tune Your </span>
              <span className="text-gradient">Guitar</span>
            </h1>

            {/* Tuning preset selector */}
            <div className="mt-4 flex justify-center">
              <div ref={tuningDropdownRef} className="relative">
                <button
                  onClick={() => setTuningDropdownOpen((o) => !o)}
                  className="inline-flex items-center gap-3 rounded-lg border-2 border-zinc-700/60 bg-[hsl(var(--bg-elevated)/0.6)] backdrop-blur-sm px-5 py-3 min-h-[48px] transition-all hover:bg-[hsl(var(--bg-overlay))] active:scale-95"
                >
                  <span className="font-display text-base font-bold text-zinc-300">
                    {selectedTuning.label}
                  </span>
                  <span className="text-sm font-body text-zinc-400">
                    {selectedTuning.name === 'chromatic'
                      ? 'All notes · All octaves'
                      : selectedTuning.strings.map((s) => s.display).join(' ')}
                  </span>
                  <ChevronDown className={`size-7 text-[hsl(var(--color-primary))] transition-transform duration-200 ${tuningDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={3} />
                </button>

                {tuningDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-50 top-full mt-1 left-1/2 -translate-x-1/2 w-72 rounded-xl border-2 border-zinc-700/70 bg-[hsl(var(--bg-elevated))] backdrop-blur-xl shadow-xl overflow-hidden"
                  >
                    {TUNING_PRESETS.map((preset) => {
                      const isActive = selectedTuning.name === preset.name;
                      return (
                        <button
                          key={preset.name}
                          onClick={() => {
                            setSelectedTuning(preset);
                            setSelectedString(null);
                            setTuningDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-5 py-3.5 min-h-[48px] transition-colors ${
                            isActive
                              ? 'bg-[hsl(var(--color-primary)/0.1)]'
                              : 'hover:bg-[hsl(var(--bg-overlay))]'
                          }`}
                        >
                          <div className="text-left">
                            <p className={`font-display text-base font-bold ${
                              isActive ? 'text-[hsl(var(--color-primary))]' : 'text-zinc-300'
                            }`}>
                              {preset.label}
                            </p>
                            <p className="text-sm font-body text-zinc-400">
                              {preset.name === 'chromatic'
                                ? 'Any note · Any instrument'
                                : preset.strings.map((s) => s.note).join(' – ')}
                            </p>
                          </div>
                          {isActive && (
                            <span className="size-2 rounded-full bg-[hsl(var(--color-primary))]" />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            </div>

            <p className="mt-3 text-sm font-body text-zinc-400">
              Play a string and the tuner will detect the pitch.
            </p>
          </div>

          <div className="px-4 sm:px-6 pb-2 max-w-xl mx-auto space-y-2">
            {permissionDenied && (
              <div className="flex items-center gap-2 rounded-lg bg-[hsl(var(--semantic-error)/0.1)] border border-[hsl(var(--semantic-error)/0.25)] px-4 py-2.5 text-center justify-center">
                <MicOff className="size-4 text-[hsl(var(--semantic-error))] shrink-0" />
                <span className="text-xs sm:text-sm font-body text-[hsl(var(--semantic-error))]">
                  Microphone access denied. Please allow mic access in browser settings.
                </span>
              </div>
            )}

            {/* Main tuner display */}
            <div className="rounded-xl border-2 border-zinc-700/60 bg-[hsl(var(--bg-elevated)/0.6)] backdrop-blur-sm p-2 sm:p-3">
              <div className="space-y-1">
                {/* Detected note */}
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    {/* Persistent steady ring — shows while pitch is within ±2 cents */}
                    <motion.div
                      className="absolute rounded-full border-[3px] border-[hsl(142_71%_45%)] pointer-events-none"
                      style={{ width: 86, height: 86 }}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={Math.abs(centsFromTarget) <= 2 && shownNote
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 0, scale: 0.85 }
                      }
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                    />
                    {/* One-shot pulse ring — re-mounts (via key) on each in-tune confirmation */}
                    {pulseKey > 0 && (
                      <motion.div
                        key={pulseKey}
                        className="absolute rounded-full border-[3px] border-[hsl(142_71%_55%)] pointer-events-none"
                        style={{ width: 86, height: 86 }}
                        initial={{ scale: 1, opacity: 0.85 }}
                        animate={{ scale: 1.6, opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    )}
                    <p className={`font-display text-4xl sm:text-5xl font-extrabold leading-none transition-colors duration-300 ${
                      !shownNote
                        ? 'text-[hsl(var(--text-muted)/0.25)]'
                        : isTargetInTune
                        ? 'text-[hsl(142_71%_45%)]'
                        : isTargetClose
                        ? 'text-[hsl(45_93%_47%)]'
                        : 'text-[rgb(220,38,38)]'
                    }`}>
                      {shownNote ? (
                        <>{shownNote.note}<span className="text-xl sm:text-2xl opacity-50">{shownNote.octave}</span></>
                      ) : (
                        <>—</>
                      )}
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-body text-zinc-400 tabular-nums transition-opacity duration-300" style={{ opacity: shownFreq ? 1 : 0.3 }}>
                    {shownFreq ? `${shownFreq.toFixed(1)} Hz` : '— Hz'}
                  </p>
                  <p className={`mt-1 text-sm font-body text-zinc-500 h-5 transition-opacity duration-200 ${targetString && shownNote ? 'opacity-100' : 'opacity-0'}`}>
                    {targetString ? `Target: ${targetString.note} (${targetString.freq.toFixed(1)} Hz)` : '\u00A0'}
                  </p>
                </div>

                {/* Segmented cents meter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-[2px] px-1">
                    {Array.from({ length: 41 }, (_, i) => {
                      const segCents = (i - 20) * 2.5;
                      const isCenter = i === 20;
                      const absSegCents = Math.abs(segCents);

                      let hue: string;
                      if (absSegCents <= 5) hue = '142 71% 45%';
                      else if (absSegCents <= 15) hue = '45 93% 47%';
                      else hue = '0 72% 51%';

                      const cur = shownNote ? centsFromTarget : 0;
                      const hasSignal = !!shownNote;
                      let lit = false;
                      if (hasSignal) {
                        if (isCenter && Math.abs(cur) < 2.5) {
                          lit = true;
                        } else if (cur > 0 && segCents > 0 && segCents <= cur + 1.25) {
                          lit = true;
                        } else if (cur < 0 && segCents < 0 && segCents >= cur - 1.25) {
                          lit = true;
                        }
                        // This condition seems to overlap with the first 'if (isCenter...)' condition
                        // but it ensures the center is lit if within 5 cents, not just 2.5
                        if (isCenter && Math.abs(cur) <= 5) lit = true;
                      }

                      return (
                        <div
                          key={i}
                          className="rounded-sm transition-all duration-150"
                          style={{
                            width: isCenter ? 5 : 3,
                            height: isCenter ? 50 : absSegCents <= 5 ? 41 : absSegCents <= 15 ? 36 : 31,
                            backgroundColor: lit
                              ? `hsl(${hue})`
                              : `hsl(${hue} / 0.12)`,
                            boxShadow: lit
                              ? `0 0 8px hsl(${hue} / 0.5), 0 0 2px hsl(${hue} / 0.3)`
                              : 'none',
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center text-[12px] font-body text-zinc-500">
                    <span>♭ Flat</span>
                    <span className={`font-display text-sm font-bold tabular-nums transition-colors duration-300 ${
                      !shownNote ? 'text-[hsl(var(--text-muted)/0.4)]' : isTargetInTune ? 'text-[hsl(142_71%_45%)]' : isTargetClose ? 'text-[hsl(var(--color-emphasis))]' : 'text-zinc-300'
                    }`}>
                      {shownNote ? `${centsFromTarget > 0 ? '+' : ''}${centsFromTarget} cents` : '0 cents'}
                    </span>
                    <span>Sharp ♯</span>
                  </div>
                </div>

                {/* Status text — fixed height to prevent layout shift */}
                <div className="text-center h-4 flex items-center justify-center">
                  {shownNote && isTargetInTune ? (
                    <motion.p
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="font-display text-lg font-bold text-[hsl(142_71%_45%)] uppercase tracking-wider"
                      style={{ textShadow: '0 0 20px hsl(142 71% 45% / 0.3)' }}
                    >
                      In Tune ✓{heldSeconds > 0 ? ` · ${heldSeconds}s` : ''}
                    </motion.p>
                  ) : shownNote ? (
                    <p className="font-body text-sm text-zinc-400">
                      {centsFromTarget < 0 ? 'Tune up ↑' : 'Tune down ↓'}
                    </p>
                  ) : null}
                </div>

                {/* Environment Sensitivity Presets */}
                <div className="space-y-2 !mt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-display font-semibold text-[hsl(var(--text-subtle))] uppercase tracking-wider flex items-center gap-1.5">
                      <Mic className="size-3.5" />
                      Environment
                    </label>
                    <span className="text-[10px] font-body text-zinc-500">
                      {PRESET_META[envPreset].desc}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(Object.keys(SENSITIVITY_PRESETS) as EnvPreset[]).map((key) => {
                      const meta = PRESET_META[key];
                      const isActive = envPreset === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setEnvPreset(key)}
                          className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 min-h-[56px] border-2 transition-all duration-200 active:scale-95 ${
                            isActive
                              ? 'border-[hsl(var(--color-primary))] bg-[hsl(var(--color-primary)/0.12)] text-[hsl(var(--color-primary))]'
                              : 'border-zinc-700/50 bg-[hsl(var(--bg-surface)/0.4)] text-zinc-400 hover:bg-[hsl(var(--bg-overlay))] hover:border-zinc-600'
                          }`}
                        >
                          <span className="text-base leading-none">{meta.icon}</span>
                          <span className={`text-[10px] font-display font-bold leading-tight text-center ${
                            isActive ? 'text-[hsl(var(--color-primary))]' : 'text-zinc-300'
                          }`}>
                            {meta.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* String selector + reference tones */}
            {isChromatic ? (
              /* Chromatic mode: no string targeting, show info panel */
              <div className="rounded-xl border-2 border-zinc-700/60 bg-[hsl(var(--bg-elevated)/0.6)] backdrop-blur-sm p-2 sm:p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Music className="size-3.5 text-[hsl(var(--color-primary))]" />
                  <h3 className="font-display text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                    Chromatic Mode
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].map((n) => {
                    const isDetectedNote = shownNote?.note === n;
                    return (
                      <span
                        key={n}
                        className={`rounded-md px-2 py-0.5 text-xs font-display font-bold transition-all duration-150 ${
                          isDetectedNote
                            ? isTargetInTune
                              ? 'bg-[hsl(142_71%_45%/0.2)] text-[hsl(142_71%_45%)] border border-[hsl(142_71%_45%/0.5)]'
                              : isTargetClose
                              ? 'bg-[hsl(45_93%_47%/0.15)] text-[hsl(45_93%_47%)] border border-[hsl(45_93%_47%/0.4)]'
                              : 'bg-[hsl(0_72%_51%/0.15)] text-[rgb(220,38,38)] border border-[hsl(0_72%_51%/0.4)]'
                            : 'bg-[hsl(var(--bg-surface))] text-zinc-500 border border-transparent'
                        }`}
                      >
                        {n}
                      </span>
                    );
                  })}
                </div>
                <p className="mt-2 text-[10px] font-body text-zinc-500">
                  Detects any note across all octaves. Suitable for any instrument.
                </p>
              </div>
            ) : (
            <div className="rounded-xl border-2 border-zinc-700/60 bg-[hsl(var(--bg-elevated)/0.6)] backdrop-blur-sm p-2 sm:p-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                  Strings
                </h3>
                <button
                  onClick={() => setSelectedString(null)}
                  className={`rounded-lg px-2 py-1 text-xs font-display font-bold transition-all active:scale-95 min-h-[32px] ${
                    !selectedString
                      ? 'bg-[hsl(var(--color-primary)/0.15)] text-[hsl(var(--color-primary))] border border-[hsl(var(--color-primary)/0.3)]'
                      : 'bg-[hsl(var(--bg-surface))] text-zinc-400 hover:bg-[hsl(var(--bg-overlay))] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Mic className="size-3.5" />
                    Auto-Detect
                  </div>
                </button>
              </div>
              <div className="flex gap-0.5">
                {activeStrings.map((gs) => {
                  const isActive = selectedString?.string === gs.string;
                  const isDetected = !selectedString && shownClosest?.string === gs.string && isListening && shownFreq !== null;
                  const isPlaying = playingString === gs.string;
                  const stringCents = shownFreq ? Math.round(1200 * Math.log2(shownFreq / gs.freq)) : null;
                  const stringInTune = stringCents !== null && Math.abs(stringCents) <= 5;
                  const stringClose = stringCents !== null && Math.abs(stringCents) <= 15;
                  return (
                    <button
                      key={gs.string}
                      className={`
                        flex-1 flex flex-col items-center rounded-lg px-0.5 py-0.5 transition-all duration-200 cursor-pointer min-h-[32px] active:scale-95
                        ${(isActive || isDetected) && stringInTune
                          ? 'bg-[hsl(142_71%_45%/0.18)] border-2 border-[hsl(142_71%_45%/0.5)] shadow-[0_0_14px_hsl(142_71%_45%/0.3)]'
                          : isActive
                          ? 'bg-[hsl(var(--color-primary)/0.15)] border-2 border-[hsl(var(--color-primary))]'
                          : isDetected
                          ? 'bg-[hsl(var(--color-primary)/0.08)] border border-[hsl(var(--color-primary)/0.3)]'
                          : 'bg-[hsl(var(--bg-surface))] border border-transparent hover:bg-[hsl(var(--bg-overlay))]'
                        }
                      `}
                      onClick={() => {
                        setSelectedString(isActive ? null : gs);
                        playReferenceTone(gs);
                      }}
                    >
                      {/* String gauge — realistic wound/plain representation */}
                      <div className="flex items-center justify-center w-full h-[4px] mb-0.5">
                        <div
                          className="w-4/5 rounded-full"
                          style={{
                            height: [0, 1.5, 2, 2, 3.5, 4.5, 5][gs.string],
                            background: (isActive || isDetected) && stringInTune
                              ? 'linear-gradient(180deg, hsl(142 71% 58%), hsl(142 71% 38%), hsl(142 71% 58%))'
                              : isActive
                              ? 'linear-gradient(180deg, hsl(38 75% 65%), hsl(38 75% 45%), hsl(38 75% 65%))'
                              : gs.string >= 4
                              ? 'repeating-linear-gradient(90deg, hsl(40 22% 72%) 0px, hsl(33 14% 52%) 1px, hsl(40 22% 74%) 2px, hsl(33 14% 56%) 3px)'
                              : 'linear-gradient(180deg, hsl(40 10% 82%), hsl(33 8% 58%), hsl(40 10% 82%))',
                            boxShadow: (isActive || isDetected) && stringInTune
                              ? '0 0 8px hsl(142 71% 45% / 0.5)'
                              : gs.string >= 4
                              ? '0 0.5px 1px hsl(0 0% 0% / 0.3)'
                              : 'none',
                          }}
                        />
                      </div>
                      <span className="text-[8px] font-body text-zinc-400 text-center leading-none">
                        <span className="block">Str{gs.string}</span>
                      </span>
                      <span className={`font-display text-[14px] sm:text-[18px] font-bold leading-tight ${
                        isActive
                          ? 'text-[hsl(var(--color-primary))]'
                          : isDetected
                          ? stringInTune
                            ? 'text-[hsl(142_71%_45%)]'
                            : stringClose
                            ? 'text-[hsl(45_93%_47%)]'
                            : 'text-[rgb(220,38,38)]'
                          : 'text-zinc-300'
                      }`}>
                        <span className="sm:hidden">{gs.display}</span>
                        <span className="hidden sm:inline">{gs.note}</span>
                      </span>

                      <span className={`text-[8px] font-display font-bold tabular-nums mt-0 h-2.5 transition-colors duration-200 ${
                        stringCents === null
                          ? 'text-transparent'
                          : stringInTune
                          ? 'text-[hsl(142_71%_45%)]'
                          : stringClose
                          ? 'text-[hsl(var(--color-emphasis))]'
                          : 'text-[hsl(var(--text-muted)/0.7)]'
                      }`}>
                        {stringCents !== null
                          ? stringInTune
                            ? '✓'
                            : `${stringCents > 0 ? '+' : ''}${stringCents}c`
                          : '—'}
                      </span>
                      <Volume2 className={`size-2.5 mt-0 transition-colors ${
                        isPlaying 
                          ? 'text-amber-500 animate-pulse' 
                          : 'text-amber-500/60'
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
