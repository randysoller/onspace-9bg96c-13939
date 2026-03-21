import { useMetronomeStore } from '@/stores/metronomeStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music2, Zap } from 'lucide-react';

interface MetronomePreset {
  id: string;
  name: string;
  tempo: number;
  timeSignature: { beats: number; noteValue: number };
  description: string;
}

const METRONOME_PRESETS: MetronomePreset[] = [
  {
    id: 'slow-practice',
    name: 'Slow Practice',
    tempo: 60,
    timeSignature: { beats: 4, noteValue: 4 },
    description: 'Perfect for learning new material'
  },
  {
    id: 'moderate',
    name: 'Moderate',
    tempo: 100,
    timeSignature: { beats: 4, noteValue: 4 },
    description: 'Standard practice tempo'
  },
  {
    id: 'rock',
    name: 'Rock Standard',
    tempo: 120,
    timeSignature: { beats: 4, noteValue: 4 },
    description: 'Typical rock song tempo'
  },
  {
    id: 'waltz',
    name: 'Waltz',
    tempo: 90,
    timeSignature: { beats: 3, noteValue: 4 },
    description: 'Classic 3/4 waltz time'
  },
  {
    id: 'fast-rock',
    name: 'Fast Rock',
    tempo: 140,
    timeSignature: { beats: 4, noteValue: 4 },
    description: 'Uptempo rock and punk'
  },
  {
    id: 'jazz-swing',
    name: 'Jazz Swing',
    tempo: 160,
    timeSignature: { beats: 4, noteValue: 4 },
    description: 'Medium swing feel'
  },
  {
    id: 'shuffle',
    name: 'Shuffle',
    tempo: 120,
    timeSignature: { beats: 12, noteValue: 8 },
    description: 'Blues shuffle in 12/8'
  },
  {
    id: 'country',
    name: 'Country/Folk',
    tempo: 110,
    timeSignature: { beats: 2, noteValue: 4 },
    description: 'Two-step feel'
  },
  {
    id: 'speed',
    name: 'Speed Training',
    tempo: 180,
    timeSignature: { beats: 4, noteValue: 4 },
    description: 'Build your technique'
  }
];

export const MetronomeDropdown = () => {
  const { setBpm, setTimeSignature } = useMetronomeStore();

  const handlePresetChange = (presetId: string) => {
    const preset = METRONOME_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setBpm(preset.tempo);
      setTimeSignature(preset.timeSignature.beats, preset.timeSignature.noteValue);
    }
  };

  return (
    <div className="relative">
      <Select onValueChange={handlePresetChange}>
        <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-white">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <SelectValue placeholder="Quick Presets" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {METRONOME_PRESETS.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {preset.name}
                    <span className="text-amber-500 text-xs font-bold">
                      {preset.tempo} BPM
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500">{preset.description}</div>
                </div>
                <div className="text-xs text-zinc-600 font-mono">
                  {preset.timeSignature.beats}/{preset.timeSignature.noteValue}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
