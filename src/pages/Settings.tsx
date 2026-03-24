import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useAudioStore } from '@/stores/audioStore';
import { useMetronomeStore } from '@/stores/metronomeStore';
import { useTunerStore } from '@/stores/tunerStore';
import { useDetectionSettingsStore } from '@/stores/detectionSettingsStore';
import { settingsApi } from '@/lib/api/settings';
import { ArrowLeft, Save, Volume2, Sliders, Music, Bell, Clock } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatReminderTime, type PracticeReminderSettings, type ReminderFrequency } from '@/lib/practice-reminder';
import { 
  isPushNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission,
  testNotification,
  playNotificationSound,
  schedulePracticeReminder,
  type PracticeNotificationData 
} from '@/lib/push-notifications';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const audioStore = useAudioStore();
  const metronomeStore = useMetronomeStore();
  const tunerStore = useTunerStore();
  const detectionStore = useDetectionSettingsStore();

  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // FIX #7: Track unsaved changes

  // Practice reminder state
  const [reminderSettings, setReminderSettings] = useState<PracticeReminderSettings>(() => {
    const stored = localStorage.getItem('practiceReminderSettings');
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      enabled: false,
      frequency: 'daily' as ReminderFrequency,
      reminderTime: '09:00',
    };
  });

  // Notification settings
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);
  const [notificationSound, setNotificationSound] = useState<'default' | 'chime' | 'guitar' | 'none'>('chime');
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission());
  const [testingNotification, setTestingNotification] = useState(false);

  // Load notification settings
  useEffect(() => {
    const storedPush = localStorage.getItem('pushNotificationsEnabled');
    if (storedPush) setPushNotificationsEnabled(JSON.parse(storedPush));
    
    const storedSound = localStorage.getItem('notificationSound');
    if (storedSound) setNotificationSound(storedSound as any);
  }, []);

  // Save notification settings
  useEffect(() => {
    localStorage.setItem('pushNotificationsEnabled', JSON.stringify(pushNotificationsEnabled));
  }, [pushNotificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('notificationSound', notificationSound);
  }, [notificationSound]);

  // Save reminder settings to localStorage and schedule push notifications
  useEffect(() => {
    localStorage.setItem('practiceReminderSettings', JSON.stringify(reminderSettings));
    
    // Schedule push notification if enabled
    if (reminderSettings.enabled && pushNotificationsEnabled && notificationPermission.granted) {
      const practiceData: PracticeNotificationData = {
        currentStreak: 0, // Replace with actual streak from store
        totalSessions: 0, // Replace with actual count
        averageAccuracy: 0, // Replace with actual average
      };
      schedulePracticeReminder(reminderSettings, practiceData);
    }
  }, [reminderSettings, pushNotificationsEnabled, notificationPermission]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user]);

  // FIX #7: Track changes to settings
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [
    audioStore.chordVolume,
    audioStore.referenceToneVolume,
    metronomeStore.bpm,
    metronomeStore.sound,
    metronomeStore.volume,
    tunerStore.calibration,
    detectionStore.sensitivity,
    detectionStore.noiseGate,
  ]);

  // FIX #7: Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleRequestNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(getNotificationPermission());
    if (granted) {
      setPushNotificationsEnabled(true);
      toast.success('Notifications enabled!');
    } else {
      toast.error('Notification permission denied');
    }
  };

  const handleTestNotification = async () => {
    setTestingNotification(true);
    try {
      const practiceData: PracticeNotificationData = {
        currentStreak: 5,
        totalSessions: 42,
        averageAccuracy: 87.5,
      };
      await testNotification(practiceData);
      playNotificationSound(notificationSound);
      toast.success('Test notification sent!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send test notification');
    } finally {
      setTestingNotification(false);
    }
  };

  const handlePlaySound = () => {
    playNotificationSound(notificationSound);
  };

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
      setHasUnsavedChanges(false); // FIX #7: Clear unsaved changes flag
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to save settings:', errorMessage);
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
                min={20}
                max={250}
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

        {/* Practice Reminders */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" aria-hidden="true" />
              <h2 className="text-lg font-bold">Practice Reminders</h2>
            </div>
            {isPushNotificationSupported() && (
              <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                Push Supported
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="enable-reminders" className="text-sm text-zinc-400">Enable Reminders</label>
              <button
                id="enable-reminders"
                onClick={() => setReminderSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative w-14 h-8 rounded-full transition-colors min-w-[56px] ${
                  reminderSettings.enabled ? 'bg-amber-500' : 'bg-zinc-700'
                }`}
                role="switch"
                aria-checked={reminderSettings.enabled}
                aria-label="Toggle practice reminders"
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    reminderSettings.enabled ? 'translate-x-6' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>

            {reminderSettings.enabled && (
              <>
                <div>
                  <label htmlFor="reminder-time" className="text-sm text-zinc-400 mb-2 block flex items-center gap-2">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    Reminder Time
                  </label>
                  <input
                    id="reminder-time"
                    type="time"
                    value={reminderSettings.reminderTime}
                    onChange={(e) => setReminderSettings(prev => ({ ...prev, reminderTime: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 min-h-[44px]"
                    aria-label="Select reminder time"
                  />
                  <span className="text-xs text-zinc-500 mt-1 block">
                    You'll receive a reminder at this time
                  </span>
                </div>

                <div>
                  <label htmlFor="reminder-frequency" className="text-sm text-zinc-400 mb-2 block">Frequency</label>
                  <Select
                    value={reminderSettings.frequency}
                    onValueChange={(value: ReminderFrequency) => setReminderSettings(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger id="reminder-frequency" className="w-full bg-zinc-800 border-zinc-700" aria-label="Select reminder frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="every-other-day">Every Other Day</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3">
                  <p className="text-xs text-zinc-400">
                    <span className="font-semibold text-amber-500">Next reminder:</span>{' '}
                    {reminderSettings.enabled && reminderSettings.lastPracticeDate ? (
                      formatReminderTime(
                        new Date(
                          new Date(reminderSettings.lastPracticeDate).getTime() + 
                          (reminderSettings.frequency === 'daily' ? 86400000 : 
                           reminderSettings.frequency === 'every-other-day' ? 172800000 : 604800000)
                        ).getTime()
                      )
                    ) : (
                      `Tomorrow at ${reminderSettings.reminderTime}`
                    )}
                  </p>
                </div>

                {/* Push Notifications */}
                {isPushNotificationSupported() && (
                  <div className="space-y-4 border-t border-zinc-800 pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <label htmlFor="enable-push" className="text-sm text-zinc-400 flex items-center gap-2">
                        <Bell className="w-4 h-4" aria-hidden="true" />
                        Browser Push Notifications
                      </label>
                      {notificationPermission.granted ? (
                        <button
                          id="enable-push"
                          onClick={() => setPushNotificationsEnabled(!pushNotificationsEnabled)}
                          className={`relative w-14 h-8 rounded-full transition-colors min-w-[56px] ${
                            pushNotificationsEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                          }`}
                          role="switch"
                          aria-checked={pushNotificationsEnabled}
                          aria-label="Toggle push notifications"
                        >
                          <span
                            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                              pushNotificationsEnabled ? 'translate-x-6' : ''
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                      ) : (
                        <button
                          onClick={handleRequestNotificationPermission}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-sm font-semibold rounded-lg transition-colors min-h-[44px]"
                          aria-label="Enable push notifications"
                        >
                          Enable Push
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {notificationPermission.granted 
                        ? 'Receive reminders even when the app is closed'
                        : 'Enable browser notifications to get reminders outside the app'
                      }
                    </p>

                    {pushNotificationsEnabled && (
                      <>
                        <div>
                          <label htmlFor="notification-sound" className="text-sm text-zinc-400 mb-2 block flex items-center gap-2">
                            <Volume2 className="w-4 h-4" aria-hidden="true" />
                            Notification Sound
                          </label>
                          <div className="flex gap-2">
                            <Select
                              value={notificationSound}
                              onValueChange={(value: any) => setNotificationSound(value)}
                            >
                              <SelectTrigger id="notification-sound" className="flex-1 bg-zinc-800 border-zinc-700" aria-label="Select notification sound">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="default">Default Beep</SelectItem>
                                <SelectItem value="chime">Gentle Chime</SelectItem>
                                <SelectItem value="guitar">Guitar Pluck</SelectItem>
                                <SelectItem value="none">Silent</SelectItem>
                              </SelectContent>
                            </Select>
                            <button
                              onClick={handlePlaySound}
                              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                              aria-label="Preview notification sound"
                            >
                              <Volume2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={handleTestNotification}
                          disabled={testingNotification}
                          className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-semibold py-3 rounded-lg transition-colors min-h-[44px] flex items-center justify-center gap-2"
                          aria-label="Send test notification"
                        >
                          {testingNotification ? <LoadingSpinner size="sm" /> : <Bell className="w-4 h-4" />}
                          {testingNotification ? 'Sending...' : 'Send Test Notification'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          aria-live="polite"
        >
          {saving ? <LoadingSpinner size="sm" /> : <Save className="w-5 h-5" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        <p className="text-xs text-zinc-500 text-center">
          Settings are automatically synced across all your devices
        </p>
      </div>
    </div>
  );
}
