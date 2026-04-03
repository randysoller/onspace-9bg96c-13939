/**
 * ChordDiagram — thin compatibility wrapper around SVGChordDiagram.
 *
 * Kept so existing `import { ChordDiagram } from '@/components/features/ChordDiagram'`
 * call-sites continue to compile without any changes. The actual rendering
 * logic now lives in SVGChordDiagram.tsx.
 */
import { memo } from 'react';
import { SVGChordDiagram } from '@/components/features/SVGChordDiagram';
import type { ChordData } from '@/types/chord';

interface ChordDiagramProps {
  chord: ChordData;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function ChordDiagramBase({ chord, size = 'md', className }: ChordDiagramProps) {
  // Standard chords always render in libraryMode (amber/cyan/white).
  // SVGChordDiagram enforces this automatically when isCustom is omitted.
  return <SVGChordDiagram chord={chord} size={size} className={className} />;
}

export const ChordDiagram = memo(ChordDiagramBase);
export default ChordDiagram;
