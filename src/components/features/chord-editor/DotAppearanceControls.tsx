import { memo, useCallback } from 'react';
import { Edit3 } from 'lucide-react';
import { DOT_COLORS } from '@/constants/fretboard';

interface DotAppearanceControlsProps {
  selectedColor: typeof DOT_COLORS[number];
  selectedShape: 'circle' | 'diamond';
  customLabel: string;
  onColorChange: (color: typeof DOT_COLORS[number]) => void;
  onShapeChange: (shape: 'circle' | 'diamond') => void;
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
  const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onLabelChange(e.target.value);
  }, [onLabelChange]);

  return (
    <div className="space-y-6">
      {/* DOT APPEARANCE */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <Edit3 className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold uppercase text-zinc-400 tracking-wide">Dot Appearance</h2>
        </div>
        
        <p className="text-xs text-zinc-600 mb-4">
          Configure the color, shape, and label for the next dot you place.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 mb-2 block uppercase tracking-wide">Dot Color</label>
            <div className="flex flex-wrap gap-2">
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
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-2 block uppercase tracking-wide">Dot Shape</label>
            <div className="flex gap-2">
              <button
                onClick={() => onShapeChange('circle')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded border transition-all ${
                  selectedShape === 'circle'
                    ? 'bg-amber-500 border-amber-500 text-zinc-950 font-semibold'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-current opacity-40" />
                Circle
              </button>

              <button
                onClick={() => onShapeChange('diamond')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded border transition-all ${
                  selectedShape === 'diamond'
                    ? 'bg-amber-500 border-amber-500 text-zinc-950 font-semibold'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <div className="w-3 h-3 rotate-45 bg-current opacity-40" />
                Diamond
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOM FRET LABEL */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <label className="text-xs text-zinc-500 mb-1.5 block uppercase tracking-wide">
          Custom Fret Label <span className="text-zinc-700">(Override finger #)</span>
        </label>
        <input
          type="text"
          value={customLabel}
          onChange={handleLabelChange}
          className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
          placeholder="e.g. 1/2"
        />
      </div>
    </div>
  );
});

DotAppearanceControls.displayName = 'DotAppearanceControls';
