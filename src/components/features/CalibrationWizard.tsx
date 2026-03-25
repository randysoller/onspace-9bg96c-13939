import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Check, AlertCircle, Trash2, Upload, Zap } from 'lucide-react';

type WizardStep = 'intro' | 'silence' | 'strum' | 'results' | 'save';

interface MeasuredData {
  noiseFloorRms: number;
  signalRms: number;
  signalCrest: number;
  signalFlux: number;
  suggestedNoiseGate: number;
  suggestedHarmonicBoost: number;
  suggestedFluxTolerance: number;
}

interface CalibrationWizardProps {
  open: boolean;
  onClose: () => void;
}

export default function CalibrationWizard({ open, onClose }: CalibrationWizardProps) {
  const [step, setStep] = useState<WizardStep>('intro');
  const [measuring, setMeasuring] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [measured, setMeasured] = useState<MeasuredData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const measureIntervalRef = useRef<number>(0);
  const rmsValuesRef = useRef<number[]>([]);

  const cleanup = useCallback(() => {
    if (measureIntervalRef.current) {
      clearInterval(measureIntervalRef.current);
      measureIntervalRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) {
      cleanup();
      setStep('intro');
      setMeasured(null);
      setError(null);
      setMeasuring(false);
    }
    return () => {
      cleanup();
    };
  }, [open, cleanup]);

  const startMeasurement = useCallback(async (phase: 'silence' | 'strum') => {
    setError(null);
    setMeasuring(true);
    rmsValuesRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const ctx = new AudioContext();
      if (ctx.state === 'suspended') await ctx.resume();
      ctxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 8192;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);
      analyserRef.current = analyser;

      const durationSec = phase === 'silence' ? 3 : 5;
      let elapsed = 0;
      setCountdown(durationSec);

      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      measureIntervalRef.current = window.setInterval(() => {
        if (!analyserRef.current || !ctxRef.current) return;
        elapsed += 80;

        const timeBuf = new Float32Array(analyserRef.current.fftSize);
        analyserRef.current.getFloatTimeDomainData(timeBuf);
        let rmsSum = 0;
        for (let i = 0; i < timeBuf.length; i++) rmsSum += timeBuf[i] * timeBuf[i];
        const rms = Math.sqrt(rmsSum / timeBuf.length);
        rmsValuesRef.current.push(rms);

        if (elapsed >= durationSec * 1000) {
          clearInterval(measureIntervalRef.current);
          clearInterval(countdownInterval);
          measureIntervalRef.current = 0;
          setMeasuring(false);

          const avgRms = rmsValuesRef.current.length > 0
            ? rmsValuesRef.current.reduce((a, b) => a + b, 0) / rmsValuesRef.current.length
            : 0;

          if (phase === 'silence') {
            setMeasured(prev => ({
              ...(prev ?? {
                noiseFloorRms: 0,
                signalRms: 0,
                signalCrest: 0,
                signalFlux: 0,
                suggestedNoiseGate: 50,
                suggestedHarmonicBoost: 50,
                suggestedFluxTolerance: 50,
              }),
              noiseFloorRms: avgRms,
            }));
            cleanup();
            setStep('strum');
          } else {
            const noiseFloor = measured?.noiseFloorRms ?? 0.005;
            const snr = avgRms > 0 && noiseFloor > 0 ? avgRms / noiseFloor : 10;
            const suggestedNoiseGate = Math.round(
              Math.min(90, Math.max(15, snr > 20 ? 75 : snr > 10 ? 60 : snr > 5 ? 45 : 30))
            );

            setMeasured({
              noiseFloorRms: noiseFloor,
              signalRms: avgRms,
              signalCrest: 3,
              signalFlux: 2,
              suggestedNoiseGate,
              suggestedHarmonicBoost: 50,
              suggestedFluxTolerance: 50,
            });
            cleanup();
            setStep('results');
          }
        }
      }, 80);
    } catch (e) {
      console.error('Calibration mic error:', e);
      setError('Microphone access denied. Please allow mic access and try again.');
      setMeasuring(false);
      cleanup();
    }
  }, [cleanup, measured]);

  const handleApplySettings = useCallback(() => {
    if (!measured) return;
    
    // Apply calibration settings
    const mappedThreshold = measured.suggestedNoiseGate / 100 * 0.04;
    (globalThis as any).__tunerRmsThreshold = mappedThreshold;
    localStorage.setItem('tuner-mic-sensitivity', measured.suggestedNoiseGate.toString());
    
    onClose();
  }, [measured, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div className="font-black text-lg">Calibration Wizard</div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {error && (
          <div className="m-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-500">{error}</span>
          </div>
        )}

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Intro */}
            {step === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-black mb-2">Auto-Tune Detection Settings</h3>
                  <p className="text-sm text-zinc-400">
                    This wizard measures your environment and guitar signal to find optimal detection settings.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">Measure silence (3 seconds)</div>
                      <div className="text-sm text-zinc-500">Don't play anything</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">Strum your guitar (5 seconds)</div>
                      <div className="text-sm text-zinc-500">Play normal chords</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">Review and apply settings</div>
                      <div className="text-sm text-zinc-500">Optimized for your setup</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep('silence')}
                  className="w-full py-3 bg-amber-500 text-zinc-950 rounded-lg font-bold hover:bg-amber-400 transition-colors"
                >
                  Start Calibration
                </button>
              </motion.div>
            )}

            {/* Step 2: Silence */}
            {step === 'silence' && (
              <motion.div
                key="silence"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-xl font-black mb-2">Measuring Silence</h3>
                  <p className="text-sm text-zinc-400">Don't play anything for 3 seconds</p>
                </div>

                {measuring && (
                  <div className="text-center">
                    <div className="text-6xl font-black text-amber-500 mb-4">{countdown}</div>
                    <div className="flex justify-center">
                      <Mic className="w-12 h-12 text-amber-500 animate-pulse" />
                    </div>
                  </div>
                )}

                {!measuring && (
                  <button
                    onClick={() => startMeasurement('silence')}
                    className="w-full py-3 bg-amber-500 text-zinc-950 rounded-lg font-bold hover:bg-amber-400 transition-colors"
                  >
                    Start Measuring
                  </button>
                )}
              </motion.div>
            )}

            {/* Step 3: Strum */}
            {step === 'strum' && (
              <motion.div
                key="strum"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-xl font-black mb-2">Strum Your Guitar</h3>
                  <p className="text-sm text-zinc-400">Play normal chords for 5 seconds</p>
                </div>

                {measuring && (
                  <div className="text-center">
                    <div className="text-6xl font-black text-emerald-500 mb-4">{countdown}</div>
                    <div className="flex justify-center">
                      <Mic className="w-12 h-12 text-emerald-500 animate-pulse" />
                    </div>
                  </div>
                )}

                {!measuring && (
                  <button
                    onClick={() => startMeasurement('strum')}
                    className="w-full py-3 bg-emerald-500 text-zinc-950 rounded-lg font-bold hover:bg-emerald-400 transition-colors"
                  >
                    Start Measuring
                  </button>
                )}
              </motion.div>
            )}

            {/* Step 4: Results */}
            {step === 'results' && measured && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-black mb-2">Calibration Complete</h3>
                  <p className="text-sm text-zinc-400">Recommended sensitivity: {measured.suggestedNoiseGate}%</p>
                </div>

                <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Noise Floor:</span>
                    <span className="font-mono">{measured.noiseFloorRms.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Signal Level:</span>
                    <span className="font-mono">{measured.signalRms.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">SNR:</span>
                    <span className="font-mono">
                      {((measured.signalRms / measured.noiseFloorRms) || 0).toFixed(1)}x
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleApplySettings}
                  className="w-full py-3 bg-emerald-500 text-zinc-950 rounded-lg font-bold hover:bg-emerald-400 transition-colors"
                >
                  Apply Settings
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
