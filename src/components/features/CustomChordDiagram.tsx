/**
 * CustomChordDiagram — thin compatibility wrapper around SVGChordDiagram.
 *
 * Kept so existing `import CustomChordDiagram from '@/components/features/CustomChordDiagram'`
 * call-sites continue to compile without any changes. The actual rendering
 * logic now lives in SVGChordDiagram.tsx.
 */
import { SVGChordDiagram } from '@/components/features/SVGChordDiagram';
import type { CustomChordData } from '@/types/customChord';

interface CustomChordDiagramProps {
  chord: CustomChordData;
  size?: 'sm' | 'md' | 'lg';
  /**
   * When true, overrides all marker colours with the library's standard
   * amber/cyan/white scheme so custom chords look identical to standard ones.
   */
  libraryMode?: boolean;
}

export default function CustomChordDiagram({ chord, size = 'md', libraryMode = false }: CustomChordDiagramProps) {
  return (
    <SVGChordDiagram
      chord={chord}
      isCustom
      size={size}
      libraryMode={libraryMode}
    />
  );
}
