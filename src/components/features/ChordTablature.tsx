import { ChordData } from '@/types/chord';

interface ChordTablatureProps {
  chord: ChordData;
}

const TUNING = ['E', 'A', 'D', 'G', 'B', 'E'];

export const ChordTablature = ({ chord }: ChordTablatureProps) => {
  return (
    <div className="font-mono text-sm bg-zinc-900/50 border border-zinc-800 rounded p-4">
      {chord.frets.map((fret, index) => (
        <div key={index} className="flex items-center gap-3 mb-1">
          <span className="text-amber-500 font-bold w-4">{TUNING[index]}</span>
          <span className="text-zinc-600">|--</span>
          <span className="text-white font-bold">
            {fret === -1 ? 'X' : fret === 0 ? '0' : fret}
          </span>
          <span className="text-zinc-600">--|</span>
        </div>
      ))}
      <div className="mt-3 text-xs text-zinc-500">
        {chord.root} {chord.type}
      </div>
    </div>
  );
};
