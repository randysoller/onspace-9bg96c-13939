/**
 * ChordSymbol — renders a chord symbol with accidentals and quality indicators
 * displayed at calc(1em - 6px) for proper musical typography.
 *
 * Reduced tokens (all at calc(1em - 6px)):
 *   b   — flat sign
 *   #   — sharp sign
 *   maj — major quality  (matched before 'm' to avoid partial match)
 *   sus — suspended quality (e.g. sus4, sus2)
 *   add — added-tone quality (e.g. add9)
 *   M   — uppercase major indicator (e.g. mM7)
 *   +   — augmented indicator
 *   °   — diminished indicator
 *   m   — minor indicator
 */

const REDUCED_CHARS = new Set(['b', '#', 'maj', 'sus', 'add', 'M', '+', '°', 'm']);

// Multi-char tokens ('maj', 'sus', 'add') must precede 'm' so they are
// consumed as complete tokens before the single-char 'm' can match inside them.
const SYMBOL_SPLIT_RE = /(maj|sus|add|m|M|b|#|\+|°)/;

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
              style={{ fontSize: 'calc(1em - 6px)', lineHeight: 1 }}
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
