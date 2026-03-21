import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useAudioStore } from '@/stores/audioStore';
import { useMetronomeStore } from '@/stores/metronomeStore';
import { useTunerStore } from '@/stores/tunerStore';
import { useDetectionSettingsStore } from '@/stores/detectionSettingsStore';
import { settingsApi } from '@/lib/api/settings';
import { ArrowLeft, Save, Volume2, Music, Mic, Target } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const { chordVolume, referenceToneVolume, setChordVolume, setReferenceToneVolume } = useAudioStore();
  const { bpm, sound, timeSignature, volume, setBpm, setSound, setTimeSignature, setVolume } = useMetronomeStore();
  const { calibration, autoListen, setCalibration, setAutoListen } = useTunerStore();
  const { sensitivity, noiseGate, setSensitivity, setNoiseGate } = useDetectionSettingsStore();
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await settingsApi.syncSettings(user.id, {
        user_id: user.id,
        metronome_bpm: bpm,
        metronome_sound: sound,
        metronome_time_signature: timeSignature,
        metronome_volume: Math.round(volume * 100),
        tuner_calibration: calibration,
        tuner_auto_listen: autoListen,
        detection_sensitivity: sensitivity,
        detection_noise_gate: Math.round(noiseGate * 100),
        chord_volume: Math.round(chordVolume * 100),
        reference_tone_volume: Math.round(referenceToneVolume * 100),
        show_diagrams: true,
        auto_advance: false,
        skill_level: 'beginner',
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-black px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Audio Settings */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold">Audio Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Chord Volume</label>
              <input
                type="range"
                min="0"
                max="100"
                value={chordVolume * 100}
                onChange={(e) => setChordVolume(Number(e.target.value) / 100)}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
              />
              <div className="text-xs text-zinc-500 mt-1">{Math.round(chordVolume * 100)}%</div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Reference Tone Volume</label>
              <input
                type="range"
                min="0"
                max="100"
                value={referenceToneVolume * 100}
                onChange={(e) => setReferenceToneVolume(Number(e.target.value) / 100)}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
              />
              <div className="text-xs text-zinc-500 mt-1">{Math.round(referenceToneVolume * 100)}%</div>
            </div>
          </div>
        </div>

        {/* Metronome Settings */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Music className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold">Metronome Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Default BPM</label>
              <input
                type="number"
                min="40"
                max="240"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Sound</label>
              <select
                value={sound}
                onChange={(e) => setSound(e.target.value as any)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="click">Click</option>
                <option value="wood">Wood Block</option>
                <option value="hihat">Hi-Hat</option>
                <option value="sidestick">Sidestick</option>
                <option value="voice">Voice Count</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Time Signature</label>
              <select
                value={timeSignature}
                onChange={(e) => setTimeSignature(e.target.value as any)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="4/4">4/4</option>
                <option value="3/4">3/4</option>
                <option value="6/8">6/8</option>
                <option value="2/4">2/4</option>
                <option value="5/4">5/4</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Volume</label>
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
              />
              <div className="text-xs text-zinc-500 mt-1">{Math.round(volume * 100)}%</div>
            </div>
          </div>
        </div>

        {/* Tuner Settings */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold">Tuner Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Calibration (A4 = Hz)</label>
              <input
                type="number"
                min="430"
                max="450"
                value={calibration}
                onChange={(e) => setCalibration(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400">Auto Listen</label>
              <button
                onClick={() => setAutoListen(!autoListen)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  autoListen ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                    autoListen ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Detection Settings */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold">Detection Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Sensitivity</label>
              <input
                type="range"
                min="1"
                max="10"
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
              />
              <div className="text-xs text-zinc-500 mt-1">Level {sensitivity}</div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Noise Gate</label>
              <input
                type="range"
                min="0"
                max="100"
                value={noiseGate * 100}
                onChange={(e) => setNoiseGate(Number(e.target.value) / 100)}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
              />
              <div className="text-xs text-zinc-500 mt-1">{Math.round(noiseGate * 100)}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
