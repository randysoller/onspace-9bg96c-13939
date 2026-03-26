import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Check, AlertCircle, Trash2, Upload, Zap } from 'lucide-react';
import { usePracticeHistoryStore } from '@/stores/practiceHistoryStore';
import { useDetectionSettingsStore } from '@/stores/detectionSettingsStore';

type WizardStep = 'intro' | 'silence' | 'strum' | 'results' | 'save' | 'name-profile';

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
  const [profileName, setProfileName] = useState('');
  const { calibrationProfiles, addCalibrationProfile, deleteCalibrationProfile } = usePracticeHistoryStore();
  const { applyCalibrationProfile } = useDetectionSettingsStore();
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
          sampleRate: { ideal: 48000 },
        },
      });
      streamRef.current = stream;

      const ctx = new AudioContext();
      if (ctx.state === 'suspended') await ctx.resume();
      ctxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);

      // High-pass filter at 70Hz per spec
      const highPass = ctx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = 70;
      highPass.Q.value = 0.71;
      source.connect(highPass);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 8192;
      analyser.smoothingTimeConstant = 0.6;
      highPass.connect(analyser);
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
            // Calculate spectral features for harmonic boost and flux tolerance
            const freqBuf = new Float32Array(analyserRef.current!.frequencyBinCount);
            analyserRef.current!.getFloatFrequencyData(freqBuf);

            // Spectral crest factor (peak/mean ratio in 70-2500Hz range)
            const minBin = Math.floor(70 * analyserRef.current!.fftSize / ctxRef.current!.sampleRate);
            const maxBin = Math.floor(2500 * analyserRef.current!.fftSize / ctxRef.current!.sampleRate);
            let peak = -Infinity;
            let sum = 0;
            for (let i = minBin; i < maxBin; i++) {
              const linearMag = Math.pow(10, freqBuf[i] / 20);
              if (linearMag > peak) peak = linearMag;
              sum += linearMag;
            }
            const mean = sum / (maxBin - minBin);
            const crest = peak / (mean || 0.001);

            // Spectral flux (average positive dB change per bin)
            // (Simplified - would need previous frame in real implementation)
            const flux = 2.0; // Placeholder - full implementation needs frame history

            const noiseFloor = measured?.noiseFloorRms ?? 0.005;
            const snr = avgRms > 0 && noiseFloor > 0 ? avgRms / noiseFloor : 10;
            
            // Compute optimized settings per Section 8.2 specification
            const suggestedNoiseGate = Math.round(
              Math.min(90, Math.max(15, snr > 20 ? 75 : snr > 10 ? 60 : snr > 5 ? 45 : 30))
            );
            const suggestedHarmonicBoost = Math.round(
              Math.min(85, Math.max(20, crest > 6 ? 40 : crest > 4 ? 55 : crest > 3 ? 65 : 75))
            );
            const suggestedFluxTolerance = Math.round(
              Math.min(80, Math.max(20, flux > 3 ? 65 : flux > 2 ? 50 : flux > 1 ? 40 : 30))
            );

            setMeasured({
              noiseFloorRms: noiseFloor,
              signalRms: avgRms,
              signalCrest: crest,
              signalFlux: flux,
              suggestedNoiseGate,
              suggestedHarmonicBoost,
              suggestedFluxTolerance,
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
    
    // Apply calibration to global detection settings (affects tuner + chord detection)
    applyCalibrationProfile({
      noiseGate: measured.suggestedNoiseGate,
      harmonicBoost: measured.suggestedHarmonicBoost,
      fluxTolerance: measured.suggestedFluxTolerance,
    });
    
    onClose();
  }, [measured, onClose, applyCalibrationProfile]);

  const handleSaveProfile = useCallback(() => {
    if (!measured || !profileName.trim()) return;
    
    addCalibrationProfile({
      name: profileName.trim(),
      createdAt: Date.now(),
      noiseGate: measured.suggestedNoiseGate,
      harmonicBoost: measured.suggestedHarmonicBoost,
      fluxTolerance: measured.suggestedFluxTolerance,
      noiseFloorRms: measured.noiseFloorRms,
      signalRms: measured.signalRms,
    });
    
    applyCalibrationProfile({
      noiseGate: measured.suggestedNoiseGate,
      harmonicBoost: measured.suggestedHarmonicBoost,
      fluxTolerance: measured.suggestedFluxTolerance,
    });
    
    setProfileName('');
    onClose();
  }, [measured, profileName, addCalibrationProfile, applyCalibrationProfile, onClose]);

  const handleLoadProfile = useCallback((profile: any) => {
    applyCalibrationProfile({
      noiseGate: profile.noiseGate,
      harmonicBoost: profile.harmonicBoost,
      fluxTolerance: profile.fluxTolerance,
    });
    onClose();
  }, [applyCalibrationProfile, onClose]);

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

                {/* Saved profiles */}
                {calibrationProfiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-zinc-400">Saved Profiles</h4>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {calibrationProfiles.map((profile) => (
                        <div
                          key={profile.id}
                          className="flex items-center justify-between p-2.5 bg-zinc-800 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm truncate">{profile.name}</div>
                            <div className="text-xs text-zinc-500">
                              Noise Gate: {profile.noiseGate}%
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleLoadProfile(profile)}
                              className="p-1.5 hover:bg-zinc-700 rounded transition-colors"
                              title="Load profile"
                            >
                              <Upload className="w-3.5 h-3.5 text-emerald-500" />
                            </button>
                            <button
                              onClick={() => deleteCalibrationProfile(profile.id)}
                              className="p-1.5 hover:bg-zinc-700 rounded transition-colors"
                              title="Delete profile"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

            {/* Step 5: Name Profile */}
            {step === 'name-profile' && measured && (
              <motion.div
                key="name-profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-xl font-black mb-2">Save Calibration Profile</h3>
                  <p className="text-sm text-zinc-400">Give this profile a name</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-2">
                    Profile Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g., Living Room Setup"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep('results')}
                    className="flex-1 py-3 bg-zinc-700 text-white rounded-lg font-bold hover:bg-zinc-600 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={!profileName.trim()}
                    className="flex-1 py-3 bg-emerald-500 text-zinc-950 rounded-lg font-bold hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save & Apply
                  </button>
                </div>
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
                    <span className="font-mono">{(measured.noiseFloorRms * 1000).toFixed(2)} mRMS</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Signal Level:</span>
                    <span className="font-mono">{(measured.signalRms * 1000).toFixed(2)} mRMS</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">SNR:</span>
                    <span className="font-mono">
                      {((measured.signalRms / measured.noiseFloorRms) || 0).toFixed(1)}x
                    </span>
                  </div>
                </div>

                {/* Optimized settings display */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-zinc-400">Optimized Settings</h4>
                  <div className="bg-zinc-800 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-400">Noise Gate:</span>
                      <span className="font-bold text-amber-400">{measured.suggestedNoiseGate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-cyan-400">Harmonic Boost:</span>
                      <span className="font-bold text-cyan-400">{measured.suggestedHarmonicBoost}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-violet-400">Flux Tolerance:</span>
                      <span className="font-bold text-violet-400">{measured.suggestedFluxTolerance}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleApplySettings}
                    className="flex-1 py-3 bg-zinc-700 text-white rounded-lg font-bold hover:bg-zinc-600 transition-colors"
                  >
                    Apply Now
                  </button>
                  <button
                    onClick={() => setStep('name-profile')}
                    className="flex-1 py-3 bg-emerald-500 text-zinc-950 rounded-lg font-bold hover:bg-emerald-400 transition-colors"
                  >
                    Save Profile
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
