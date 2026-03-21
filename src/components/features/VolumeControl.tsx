import { useAudioStore } from '@/stores/audioStore';
import { Volume2, Volume1, VolumeX } from 'lucide-react';

interface VolumeControlProps {
  compact?: boolean;
}

export default function VolumeControl({ compact = false }: VolumeControlProps) {
  const { masterVolume, setMasterVolume } = useAudioStore();

  const VolumeIcon = masterVolume === 0 ? VolumeX : masterVolume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setMasterVolume(masterVolume === 0 ? 0.7 : 0)}
        className="text-zinc-400 hover:text-white transition-colors"
        aria-label="Toggle mute"
      >
        <VolumeIcon className="w-5 h-5" />
      </button>

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={masterVolume}
        onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
        className={`${compact ? 'w-24' : 'w-28'} accent-amber-500`}
        aria-label="Volume"
      />

      {!compact && (
        <span className="text-sm text-zinc-400 w-10">
          {Math.round(masterVolume * 100)}%
        </span>
      )}
    </div>
  );
}
