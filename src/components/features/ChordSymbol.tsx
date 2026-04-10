/**
 * ChordSymbol — renders a chord symbol with accidentals and quality indicators
 * displayed 2px smaller than the surrounding text for proper musical typography.
 *
 * Reduced characters (all at calc(1em - 2px)):
 *   b   — flat sign
 *   #   — sharp sign
 *   maj — major quality (matched before 'm' to avoid partial match)
 *   M   — uppercase major indicator (e.g. mM7)
 *   +   — augmented indicator
 *   °   — diminished indicator
 *   m   — minor indicator
 */

const REDUCED_CHARS = new Set(['b', '#', 'maj', 'M', '+', '°', 'm']);

// 'maj' must precede 'm' so the three-char token is consumed first.
const SYMBOL_SPLIT_RE = /(maj|m|M|b|#|\+|°)/;

interface ChordSymbolProps {
  symbol: string;
  className?: string;
}

export function ChordSymbol({ symbol, className }: ChordSymbolProps) {
  const parts = symbol.split(SYMBOL_SPLIT_RE);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (REDUCED_CHARS.has(part)) {
          return (
            <span
              key={i}
              style={{ fontSize: 'calc(1em - 2px)', lineHeight: 1 }}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
