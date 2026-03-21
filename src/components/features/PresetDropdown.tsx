import { usePresetStore } from '@/stores/presetStore';
import { usePracticeStore } from '@/stores/practiceStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bookmark } from 'lucide-react';

interface Preset {
  id: string;
  name: string;
  description: string;
  filters: {
    category?: string;
    types?: string[];
    keys?: string[];
  };
}

const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'beginner',
    name: 'Beginner Basics',
    description: 'Essential open chords for beginners',
    filters: {
      types: ['major', 'minor'],
      keys: ['C', 'G', 'D', 'A', 'E']
    }
  },
  {
    id: 'barre',
    name: 'Barre Chords',
    description: 'Moveable barre chord shapes',
    filters: {
      types: ['major', 'minor', '7']
    }
  },
  {
    id: 'jazz',
    name: 'Jazz Essentials',
    description: 'Common jazz voicings',
    filters: {
      types: ['maj7', 'min7', 'dom7', '9', '13']
    }
  },
  {
    id: 'power',
    name: 'Power Chords',
    description: 'Rock and metal power chords',
    filters: {
      types: ['5']
    }
  },
  {
    id: 'extended',
    name: 'Extended Chords',
    description: 'Advanced voicings with extensions',
    filters: {
      types: ['9', '11', '13', 'add9']
    }
  },
  {
    id: 'diminished',
    name: 'Diminished & Augmented',
    description: 'Altered chord qualities',
    filters: {
      types: ['dim', 'aug', 'dim7', 'm7b5']
    }
  }
];

export const PresetDropdown = () => {
  const { activePreset, setActivePreset } = usePresetStore();
  const { setFilters } = usePracticeStore();

  const handlePresetChange = (presetId: string) => {
    if (presetId === 'none') {
      setActivePreset(null);
      setFilters({});
      return;
    }

    const preset = DEFAULT_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setActivePreset(presetId);
      setFilters(preset.filters);
    }
  };

  return (
    <div className="relative">
      <Select value={activePreset || 'none'} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-white">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-amber-500" />
            <SelectValue placeholder="Select a preset" />
            {activePreset && (
              <span className="ml-auto px-2 py-0.5 bg-amber-500/20 text-amber-500 text-xs font-bold rounded">
                {DEFAULT_PRESETS.find(p => p.id === activePreset)?.name || 'Active'}
              </span>
            )}
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <div>
              <div className="font-medium">No Preset</div>
              <div className="text-xs text-zinc-500">Use custom filters</div>
            </div>
          </SelectItem>
          {DEFAULT_PRESETS.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              <div>
                <div className="font-medium">{preset.name}</div>
                <div className="text-xs text-zinc-500">{preset.description}</div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
