/**
 * Volume Control Component
 * 
 * Global audio volume slider with mute button
 * Compact mode shows vertical slider on toggle
 */

import { useState } from 'react';
import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { useAudioStore } from '@/stores/audioStore';

interface VolumeControlProps {
  compact?: boolean;
  className?: string;
}

export function VolumeControl({ compact = false, className = '' }: VolumeControlProps) {
  const { volume, muted, setVolume, toggleMute } = useAudioStore();
  const [showSlider, setShowSlider] = useState(false);

  const getVolumeIcon = () => {
    if (muted) return VolumeX;
    if (volume > 0.5) return Volume2;
    return Volume1;
  };

  const VolumeIcon = getVolumeIcon();

  if (compact) {
    // Compact mode: vertical slider on toggle
    return (
      <div className={`relative ${className}`}>
        {/* Volume Button - Green when active */}
        <button
          onClick={() => setShowSlider(!showSlider)}
          className={`
            p-2 rounded-lg transition-all active:scale-95 border
            ${showSlider
              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500'
              : 'bg-[hsl(var(--bg-surface))] hover:bg-[hsl(var(--bg-overlay))] border-[hsl(var(--border-subtle))]'
            }
          `}
          aria-label={muted ? 'Unmute' : 'Adjust volume'}
        >
          <VolumeIcon
            className={`w-5 h-5 ${
              showSlider ? 'text-emerald-500' : muted ? 'text-[hsl(var(--text-muted))]' : 'text-[hsl(var(--text-subtle))]'
            }`}
          />
        </button>

        {/* Vertical Slider Popup - Below button */}
        {showSlider && (
          <div className="absolute top-full right-0 mt-2 bg-[hsl(var(--bg-elevated))] border border-[hsl(var(--border-default))] rounded-lg shadow-lg p-3 flex flex-col items-center gap-2">
            {/* Vertical Slider */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="
                w-[32px] h-32 bg-transparent appearance-none cursor-pointer
                [writing-mode:vertical-lr] [direction:rtl]
                [&::-webkit-slider-runnable-track]:w-[8px]
                [&::-webkit-slider-runnable-track]:h-32
                [&::-webkit-slider-runnable-track]:ml-[12px]
                [&::-webkit-slider-runnable-track]:bg-[hsl(var(--bg-surface))]
                [&::-webkit-slider-runnable-track]:rounded-lg
                [&::-webkit-slider-runnable-track]:border-0
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:w-[26px]
                [&::-webkit-slider-thumb]:h-[26px]
                [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:bg-[hsl(var(--color-primary))]
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:border-[3px]
                [&::-webkit-slider-thumb]:border-white
                [&::-webkit-slider-thumb]:ml-[-9px]
                [&::-webkit-slider-thumb]:transition-none
                [&::-webkit-slider-thumb]:active:scale-100
                [&::-moz-range-track]:w-[8px]
                [&::-moz-range-track]:h-32
                [&::-moz-range-track]:ml-[12px]
                [&::-moz-range-track]:bg-[hsl(var(--bg-surface))]
                [&::-moz-range-track]:rounded-lg
                [&::-moz-range-track]:border-0
                [&::-moz-range-thumb]:w-[26px]
                [&::-moz-range-thumb]:h-[26px]
                [&::-moz-range-thumb]:rounded-full 
                [&::-moz-range-thumb]:bg-[hsl(var(--color-primary))]
                [&::-moz-range-thumb]:border-[3px]
                [&::-moz-range-thumb]:border-white
                [&::-moz-range-thumb]:ml-[-9px]
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:shadow-lg
                [&::-moz-range-thumb]:transition-none
              "
              aria-label="Volume"
            />
            {/* Volume Percentage */}
            <span className="text-xs text-[hsl(var(--text-subtle))] font-medium">
              {Math.round(volume * 100)}%
            </span>
          </div>
        )}
      </div>
    );
  }

  // Non-compact mode: horizontal slider always visible
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

      {/* Volume Percentage */}
      <span className="text-xs text-[hsl(var(--text-subtle))] font-medium min-w-[2.5rem] text-right">
        {Math.round(volume * 100)}%
      </span>
    </div>
  );
}
