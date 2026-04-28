/**
 * ScaleTabNotation
 *
 * Displays guitar tab in ChordDetailModal style:
 *   • White background, black/dark monospace text
 *   • One row per string (e → E, high to low — matching ChordDetailModal string order)
 *   • Multiple fret numbers per string separated by dashes
 *   • No horizontal scrolling — all notes visible at once
 *
 * String convention (matches HorizontalScaleFretboard + ScaleDetailModal):
 *   0 = high e (top row)    5 = low E (bottom row)
 *
 * Note order within each string row: ascending fret (left = lower fret)
 */

interface TabDot {
  /** 0 = high e, 5 = low E */
  string: number;
  fret: number;
  isOpenString?: boolean;
}

interface ScaleTabNotationProps {
  dots: TabDot[];
}

// String names displayed in the label column (index 0 = high e, index 5 = low E)
const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'] as const;

export default function ScaleTabNotation({ dots }: ScaleTabNotationProps) {
  // Group dots by string index, sort each group ascending by fret
  const byString: number[][] = Array.from({ length: 6 }, () => []);

  for (const dot of dots) {
    if (dot.string >= 0 && dot.string <= 5) {
      byString[dot.string].push(dot.fret);
    }
  }
  // Sort each string's frets ascending
  byString.forEach((frets) => frets.sort((a, b) => a - b));

  return (
    <div className="bg-white rounded-lg px-3 py-2 pb-3 font-mono shadow-lg w-full">
      {/* ── One row per string, high e (0) → low E (5) ── */}
      {STRING_NAMES.map((name, s) => {
        const frets = byString[s];
        return (
          <div key={s} className="flex items-center py-0.5 gap-0">
            {/* String name label */}
            <span className="text-zinc-800 font-bold w-5 flex-shrink-0 text-sm leading-none">
              {name}
            </span>

            {/* Opening dash */}
            <span className="text-zinc-400 text-sm">—</span>

            {frets.length === 0 ? (
              /* Unused string: flat line */
              <span className="text-zinc-300 text-sm">——</span>
            ) : (
              /* Fret numbers separated by dashes */
              frets.map((fret, fi) => (
                <span key={fi} className="flex items-center">
                  <span
                    className="text-zinc-900 font-bold text-sm text-center leading-none"
                    style={{ minWidth: fret >= 10 ? '1.5rem' : '1rem' }}
                  >
                    {fret}
                  </span>
                  <span className="text-zinc-400 text-sm">—</span>
                </span>
              ))
            )}
          </div>
        );
      })}

      {/* ── TAB label at bottom, centred — matches ChordDetailModal ── */}
      <div className="text-center text-black font-bold mt-2" style={{ fontSize: '18px' }}>
        Tab
      </div>
    </div>
  );
}
