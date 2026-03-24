import { memo, useCallback, type ChangeEvent } from 'react';
import { Edit3 } from 'lucide-react';
import { DOT_COLORS } from '@/constants/fretboard';
import type { ColorOption, ChordShape } from '@/types/fretboard';

interface DotAppearanceControlsProps {
  selectedColor: ColorOption;
  selectedShape: ChordShape;
  customLabel: string;
  onColorChange: (color: ColorOption) => void;
  onShapeChange: (shape: ChordShape) => void;
  onLabelChange: (label: string) => void;
}

export const DotAppearanceControls = memo(({
  selectedColor,
  selectedShape,
  customLabel,
  onColorChange,
  onShapeChange,
  onLabelChange,
}: DotAppearanceControlsProps) => {
  const handleLabelChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    onLabelChange(e.target.value);
  }, [onLabelChange]);

  return (
    <div className="space-y-6">
      {/* DOT APPEARANCE */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <Edit3 className="w-4 h-4 text-zinc-400" aria-hidden="true" />
          <h2 className="text-sm font-semibold uppercase text-zinc-400 tracking-wide">Dot Appearance</h2>
        </div>
        
        <p className="text-xs text-zinc-600 mb-4">
          Configure the color, shape, and label for the next dot you place.
        </p>

        <div className="space-y-4">
          <div>
            <label id="dot-color-label" className="text-xs text-zinc-500 mb-2 block uppercase tracking-wide">Dot Color</label>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="dot-color-label">
              {DOT_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => onColorChange(color)}
                  className={`w-10 h-10 rounded ${color.class} ${
                    selectedColor.name === color.name
                      ? 'ring-2 ring-offset-2 ring-offset-zinc-900 ring-amber-500'
                      : ''
                  } transition-all hover:scale-110`}
                  title={color.name}
                  aria-label={`Select ${color.name} color`}
                  aria-pressed={selectedColor.name === color.name}
                />
              ))}
            </div>
          </div>

          <div>
            <label id="dot-shape-label" className="text-xs text-zinc-500 mb-2 block uppercase tracking-wide">Dot Shape</label>
            <div className="flex gap-2" role="group" aria-labelledby="dot-shape-label">
              <button
                onClick={() => onShapeChange('circle')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded border transition-all ${
                  selectedShape === 'circle'
                    ? 'bg-amber-500 border-amber-500 text-zinc-950 font-semibold'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                }`}
                aria-label="Select circle shape"
                aria-pressed={selectedShape === 'circle'}
              >
                <div className="w-4 h-4 rounded-full bg-current opacity-40" aria-hidden="true" />
                Circle
              </button>

              <button
                onClick={() => onShapeChange('diamond')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded border transition-all ${
                  selectedShape === 'diamond'
                    ? 'bg-amber-500 border-amber-500 text-zinc-950 font-semibold'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                }`}
                aria-label="Select diamond shape"
                aria-pressed={selectedShape === 'diamond'}
              >
                <div className="w-3 h-3 rotate-45 bg-current opacity-40" aria-hidden="true" />
                Diamond
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOM FRET LABEL */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <label htmlFor="custom-label" className="text-xs text-zinc-500 mb-1.5 block uppercase tracking-wide">
          Custom Fret Label <span className="text-zinc-700">(Override finger #)</span>
        </label>
        <input
          id="custom-label"
          type="text"
          value={customLabel}
          onChange={handleLabelChange}
          className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
          placeholder="e.g. 1/2"
          maxLength={3}
          aria-describedby="custom-label-help"
        />
        <p id="custom-label-help" className="text-xs text-zinc-600 mt-1.5">
          Override the finger number with a custom label (max 3 characters)
        </p>
      </div>
    </div>
  );
});

DotAppearanceControls.displayName = 'DotAppearanceControls';
