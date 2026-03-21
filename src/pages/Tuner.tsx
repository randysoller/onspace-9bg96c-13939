import { useState } from 'react';
import { useTunerStore, TUNING_PRESETS, TuningPreset } from '@/stores/tunerStore';
import { useReferenceTone } from '@/hooks/useReferenceTone';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';

const NOTE_FREQUENCIES: Record<string, number> = {
  'E': 82.41, 'A': 110.00, 'D': 146.83, 'G': 196.00, 'B': 246.94,
  'Eb': 77.78, 'Ab': 103.83, 'Db': 138.59, 'Gb': 185.00, 'Bb': 233.08,
  'C': 130.81, 'F': 174.61,
};

export default function Tuner() {
  const {
    isActive,
    currentNote,
    centOffset,
    tuning,
    setIsActive,
    setTuning,
  } = useTunerStore();

  const { playTone, stopTone } = useReferenceTone();
  const [playingString, setPlayingString] = useState<number | null>(null);

  const handleToggleTuner = () => {
    setIsActive(!isActive);
  };

  const handlePlayReferenceTone = (note: string, stringIndex: number) => {
    if (playingString === stringIndex) {
      stopTone();
      setPlayingString(null);
    } else {
      const frequency = NOTE_FREQUENCIES[note];
      if (frequency) {
        playTone(frequency);
        setPlayingString(stringIndex);
      }
    }
  };

  const currentTuning = TUNING_PRESETS[tuning];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-amber-500 mb-8">Guitar Tuner</h1>

      {/* Tuning Preset Selector */}
      <div className="mb-8">
        <label className="text-sm text-zinc-400 mb-2 block">Tuning Preset</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TUNING_PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              size="sm"
              variant={tuning === key ? 'default' : 'outline'}
              onClick={() => setTuning(key as TuningPreset)}
              className={tuning === key ? 'bg-amber-500 hover:bg-amber-600' : ''}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Tuner Display */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8 mb-8">
        <div className="text-center mb-8">
          <Button
            size="lg"
            onClick={handleToggleTuner}
            className={isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}
          >
            {isActive ? (
              <>
                <MicOff className="w-5 h-5 mr-2" />
                Stop Tuner
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Start Tuner
              </>
            )}
          </Button>
        </div>

        {isActive && (
          <div className="text-center">
            <div className="text-6xl font-bold text-amber-500 mb-4">
              {currentNote || '—'}
            </div>
            <div className="text-2xl text-zinc-400 mb-8">
              {centOffset !== 0 && (
                <span className={centOffset > 0 ? 'text-red-400' : 'text-blue-400'}>
                  {centOffset > 0 ? '+' : ''}{centOffset.toFixed(0)} cents
                </span>
              )}
            </div>

            {/* Cent Meter */}
            <div className="max-w-md mx-auto">
              <div className="relative h-12 bg-zinc-800 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1 h-full bg-white/30" />
                </div>
                <div
                  className="absolute top-0 bottom-0 w-2 bg-amber-500 transition-all"
                  style={{
                    left: `calc(50% + ${(centOffset / 50) * 50}%)`,
                    transform: 'translateX(-50%)',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* String Reference Tones */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">Reference Tones</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {currentTuning.notes.map((note, index) => (
            <Button
              key={index}
              variant="outline"
              className={`h-20 flex flex-col items-center justify-center ${
                playingString === index ? 'bg-amber-500/20 border-amber-500' : ''
              }`}
              onClick={() => handlePlayReferenceTone(note, index)}
            >
              <Volume2 className="w-5 h-5 mb-1" />
              <span className="text-lg font-semibold">{note}</span>
              <span className="text-xs text-zinc-400">String {6 - index}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
