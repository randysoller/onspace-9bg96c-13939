import { useRef } from 'react';
import { PRESET_COLORS } from '@/types/customChord';
import type { DotShape } from '@/types/customChord';
import { Circle, Diamond } from 'lucide-react';

interface ColorShapePickerProps {
  selectedColor: string;
  selectedShape: DotShape;
  onColorChange: (color: string) => void;
  onShapeChange: (shape: DotShape) => void;
}

export default function ColorShapePicker({
  selectedColor,
  selectedShape,
  onColorChange,
  onShapeChange,
}: ColorShapePickerProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      {/* DOT COLOR */}
      <div>
        <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[hsl(var(--text-muted))] mb-2">
          Dot Color
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onColorChange(color)}
              className={`size-7 rounded-md border-2 transition-all duration-150 hover:scale-110 ${
                selectedColor === color
                  ? 'border-white shadow-[0_0_8px_rgba(255,255,255,0.3)] scale-110'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}

          {/* Custom color input */}
          <div className="relative">
            <button
              type="button"
              onClick={() => colorInputRef.current?.click()}
              className={`size-7 rounded-md border-2 border-dashed border-[hsl(var(--border-default))] flex items-center justify-center text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-subtle))] hover:scale-110 transition-all ${
                !PRESET_COLORS.includes(selectedColor)
                  ? 'border-white scale-110'
                  : ''
              }`}
              aria-label="Pick custom color"
            >
              <span className="text-sm font-bold leading-none">+</span>
            </button>
            <input
              ref={colorInputRef}
              type="color"
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              value={selectedColor.startsWith('#') ? selectedColor : '#f59e0b'}
              onChange={(e) => onColorChange(e.target.value)}
              aria-label="Custom color picker"
            />
          </div>
        </div>
      </div>

      {/* DOT SHAPE */}
      <div>
        <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[hsl(var(--text-muted))] mb-2">
          Dot Shape
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onShapeChange('circle')}
            className={`rounded-md px-3 py-1.5 text-xs font-body font-medium flex items-center gap-1.5 transition-all ${
              selectedShape === 'circle'
                ? 'bg-[hsl(var(--color-primary))] text-[hsl(var(--bg-base))]'
                : 'bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--bg-overlay))]'
            }`}
          >
            <Circle className="w-3.5 h-3.5" />
            Circle
          </button>
          <button
            type="button"
            onClick={() => onShapeChange('diamond')}
            className={`rounded-md px-3 py-1.5 text-xs font-body font-medium flex items-center gap-1.5 transition-all ${
              selectedShape === 'diamond'
                ? 'bg-[hsl(var(--color-primary))] text-[hsl(var(--bg-base))]'
                : 'bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--bg-overlay))]'
            }`}
          >
            <Diamond className="w-3.5 h-3.5" />
            Diamond
          </button>
        </div>
      </div>
    </div>
  );
}
