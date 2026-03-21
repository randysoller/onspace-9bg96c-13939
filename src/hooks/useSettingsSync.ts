import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAudioStore } from '@/stores/audioStore';
import { useMetronomeStore } from '@/stores/metronomeStore';
import { useTunerStore } from '@/stores/tunerStore';
import { useDetectionSettingsStore } from '@/stores/detectionSettingsStore';
import { usePracticeStore } from '@/stores/practiceStore';
import { settingsApi } from '@/lib/api/settings';

export const useSettingsSync = () => {
  const { user } = useAuthStore();
  const audioStore = useAudioStore();
  const metronomeStore = useMetronomeStore();
  const tunerStore = useTunerStore();
  const detectionStore = useDetectionSettingsStore();
  const practiceStore = usePracticeStore();

  useEffect(() => {
    if (!user) return;

    // Load settings from backend
    const loadSettings = async () => {
      try {
        const settings = await settingsApi.getUserSettings(user.id);
        
        if (settings) {
          // Apply settings to stores
          audioStore.setChordVolume(settings.chord_volume / 100);
          audioStore.setReferenceToneVolume(settings.reference_tone_volume / 100);
          
          metronomeStore.setBpm(settings.metronome_bpm);
          metronomeStore.setSound(settings.metronome_sound as any);
          metronomeStore.setTimeSignature(settings.metronome_time_signature as any);
          metronomeStore.setVolume(settings.metronome_volume / 100);
          
          tunerStore.setCalibration(settings.tuner_calibration);
          tunerStore.setAutoListen(settings.tuner_auto_listen);
          
          detectionStore.setSensitivity(settings.detection_sensitivity);
          detectionStore.setNoiseGate(settings.detection_noise_gate / 100);
          
          practiceStore.setShowDiagrams(settings.show_diagrams);
          
          console.log('Settings loaded from backend');
        } else {
          // Create initial settings from current local state
          await syncSettings();
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };

    loadSettings();

    // Sync settings to backend on changes (debounced)
    const syncTimeout = setTimeout(() => {
      syncSettings();
    }, 2000);

    return () => clearTimeout(syncTimeout);
  }, [user]);

  const syncSettings = async () => {
    if (!user) return;

    try {
      await settingsApi.syncSettings(user.id, {
        user_id: user.id,
        metronome_bpm: metronomeStore.getState().bpm,
        metronome_sound: metronomeStore.getState().sound,
        metronome_time_signature: metronomeStore.getState().timeSignature,
        metronome_volume: Math.round(metronomeStore.getState().volume * 100),
        tuner_calibration: tunerStore.getState().calibration,
        tuner_auto_listen: tunerStore.getState().autoListen,
        detection_sensitivity: detectionStore.getState().sensitivity,
        detection_noise_gate: Math.round(detectionStore.getState().noiseGate * 100),
        chord_volume: Math.round(audioStore.getState().chordVolume * 100),
        reference_tone_volume: Math.round(audioStore.getState().referenceToneVolume * 100),
        show_diagrams: practiceStore.getState().showDiagrams,
        auto_advance: false,
        skill_level: 'beginner',
      });
      
      console.log('Settings synced to backend');
    } catch (err) {
      console.error('Failed to sync settings:', err);
    }
  };

  return { syncSettings };
};
