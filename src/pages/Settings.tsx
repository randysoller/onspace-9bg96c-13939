import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useAudioStore } from '@/stores/audioStore';
import { useMetronomeStore } from '@/stores/metronomeStore';
import { useTunerStore } from '@/stores/tunerStore';
import { useDetectionSettingsStore } from '@/stores/detectionSettingsStore';
import { settingsApi } from '@/lib/api/settings';
import { ArrowLeft, Save, Volume2, Sliders, Music } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const audioStore = useAudioStore();
  const metronomeStore = useMetronomeStore();
  const tunerStore = useTunerStore();
  const detectionStore = useDetectionSettingsStore();

  const [saving, setSaving] = useState(false);

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
        metronome_bpm: metronomeStore.bpm,
        metronome_sound: metronomeStore.sound,
        metronome_time_signature: metronomeStore.timeSignature,
        metronome_volume: Math.round(metronomeStore.volume * 100),
        tuner_calibration: tunerStore.calibration,
        tuner_auto_listen: tunerStore.autoListen,
        detection_sensitivity: detectionStore.sensitivity,
        detection_noise_gate: Math.round(detectionStore.noiseGate * 100),
        chord_volume: Math.round(audioStore.chordVolume * 100),
        reference_tone_volume: Math.round(audioStore.referenceToneVolume * 100),
        show_diagrams: true,
        auto_advance: false,
        skill_level: 'beginner',
      });

      toast.success('Settings saved successfully');
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error('Failed to save settings');
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
          <div className="w-20" />
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Audio Settings */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold">Audio</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Chord Volume</label>
              <Slider
                value={[audioStore.chordVolume * 100]}
                onValueChange={([value]) => audioStore.setChordVolume(value / 100)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <span className="text-xs text-zinc-500 mt-1 block">
                {Math.round(audioStore.chordVolume * 100)}%
              </span>
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Reference Tone Volume</label>
              <Slider
                value={[audioStore.referenceToneVolume * 100]}
                onValueChange={([value]) => audioStore.setReferenceToneVolume(value / 100)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <span className="text-xs text-zinc-500 mt-1 block">
                {Math.round(audioStore.referenceToneVolume * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Metronome Settings */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Music className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold">Metronome</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">BPM</label>
              <Slider
                value={[metronomeStore.bpm]}
                onValueChange={([value]) => metronomeStore.setBpm(value)}
                min={40}
                max={240}
                step={1}
                className="w-full"
              />
              <span className="text-xs text-zinc-500 mt-1 block">
                {metronomeStore.bpm} BPM
              </span>
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Sound</label>
              <Select
                value={metronomeStore.sound}
                onValueChange={(value: any) => metronomeStore.setSound(value)}
              >
                <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="click">Click</SelectItem>
                  <SelectItem value="beep">Beep</SelectItem>
                  <SelectItem value="wood">Wood</SelectItem>
                  <SelectItem value="clave">Clave</SelectItem>
                  <SelectItem value="cowbell">Cowbell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Volume</label>
              <Slider
                value={[metronomeStore.volume * 100]}
                onValueChange={([value]) => metronomeStore.setVolume(value / 100)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <span className="text-xs text-zinc-500 mt-1 block">
                {Math.round(metronomeStore.volume * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Tuner Settings */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold">Tuner</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Calibration (A4 Hz)</label>
              <Slider
                value={[tunerStore.calibration]}
                onValueChange={([value]) => tunerStore.setCalibration(value)}
                min={430}
                max={450}
                step={1}
                className="w-full"
              />
              <span className="text-xs text-zinc-500 mt-1 block">
                {tunerStore.calibration} Hz
              </span>
            </div>
          </div>
        </div>

        {/* Detection Settings */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold">Detection</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Sensitivity</label>
              <Slider
                value={[detectionStore.sensitivity]}
                onValueChange={([value]) => detectionStore.setSensitivity(value)}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <span className="text-xs text-zinc-500 mt-1 block">
                Level {detectionStore.sensitivity}
              </span>
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Noise Gate</label>
              <Slider
                value={[detectionStore.noiseGate * 100]}
                onValueChange={([value]) => detectionStore.setNoiseGate(value / 100)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <span className="text-xs text-zinc-500 mt-1 block">
                {Math.round(detectionStore.noiseGate * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        <p className="text-xs text-zinc-500 text-center">
          Settings are automatically synced across all your devices
        </p>
      </div>
    </div>
  );
}
