/**
 * Volume Control Component
 * 
 * Global audio volume slider with mute button
 * Compact mode for practice page (no percentage label)
 */

import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { useAudioStore } from '@/stores/audioStore';

interface VolumeControlProps {
  compact?: boolean;
  className?: string;
}

export function VolumeControl({ compact = false, className = '' }: VolumeControlProps) {
  const { volume, muted, setVolume, toggleMute } = useAudioStore();

  const getVolumeIcon = () => {
    if (muted) return VolumeX;
    if (volume > 0.5) return Volume2;
    return Volume1;
  };

  const VolumeIcon = getVolumeIcon();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Mute/Unmute Button */}
      <button
        onClick={toggleMute}
        className="p-1.5 hover:bg-[hsl(var(--bg-surface))] rounded transition-colors"
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        <VolumeIcon
          className={`w-4 h-4 ${
            muted ? 'text-[hsl(var(--text-muted))]' : 'text-[hsl(var(--text-subtle))]'
          }`}
        />
      </button>

      {/* Volume Slider */}
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="
          w-20 h-1 bg-[hsl(var(--bg-surface))] rounded-lg appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none 
          [&::-webkit-slider-thumb]:w-3 
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full 
          [&::-webkit-slider-thumb]:bg-[hsl(var(--color-primary))]
          [&::-moz-range-thumb]:w-3 
          [&::-moz-range-thumb]:h-3
          [&::-moz-range-thumb]:rounded-full 
          [&::-moz-range-thumb]:bg-[hsl(var(--color-primary))]
          [&::-moz-range-thumb]:border-0
        "
        aria-label="Volume"
      />

      {/* Volume Percentage (hidden in compact mode) */}
      {!compact && (
        <span className="text-xs text-[hsl(var(--text-subtle))] font-medium min-w-[2.5rem] text-right">
          {Math.round(volume * 100)}%
        </span>
      )}
    </div>
  );
}
