// STRUMMING PATTERN DATA — Full reconstruction from specification

export type StrumType = 'D' | 'U' | 'Ad' | 'Au' | 'rest' | 'mute';

export interface StrummingPattern {
  id: string;
  name: string;
  description: string;
  subdivisions: number;   // 2=8ths, 3=triplets, 4=16ths
  beats: number;          // pattern length in beats
  pattern: StrumType[];   // length = beats × subdivisions
}

// Strum type display labels
export const STRUM_LABELS: Record<StrumType, string> = {
  D: '↓',
  U: '↑',
  Ad: '↓',
  Au: '↑',
  rest: '·',
  mute: '✕',
};

// Cycle order for editing
export const STRUM_CYCLE: StrumType[] = ['D', 'Ad', 'U', 'Au', 'mute', 'rest'];

export function nextStrumType(current: StrumType): StrumType {
  const idx = STRUM_CYCLE.indexOf(current);
  return STRUM_CYCLE[(idx + 1) % STRUM_CYCLE.length];
}

// Style-to-strumming-pattern mapping (2 patterns per style)
export const STYLE_STRUMMING: Record<string, StrummingPattern[]> = {
  blues: [
    {
      id: 'blues-shuffle',
      name: 'Blues Shuffle',
      description: 'Swing shuffle pattern',
      subdivisions: 3,
      beats: 4,
      pattern: ['D', 'rest', 'U', 'D', 'rest', 'U', 'D', 'rest', 'U', 'D', 'rest', 'U'],
    },
    {
      id: 'blues-straight',
      name: 'Straight Blues',
      description: 'Steady down strums',
      subdivisions: 2,
      beats: 4,
      pattern: ['D', 'rest', 'D', 'rest', 'D', 'rest', 'D', 'rest'],
    },
  ],

  jazz: [
    {
      id: 'jazz-swing',
      name: 'Jazz Swing',
      description: '2 & 4 emphasis',
      subdivisions: 2,
      beats: 4,
      pattern: ['mute', 'D', 'mute', 'D', 'mute', 'D', 'mute', 'D'],
    },
    {
      id: 'jazz-bossa',
      name: 'Bossa Nova',
      description: 'Syncopated pattern',
      subdivisions: 4,
      beats: 4,
      pattern: ['D', 'rest', 'rest', 'U', 'rest', 'D', 'rest', 'U', 'D', 'rest', 'rest', 'U', 'rest', 'D', 'rest', 'U'],
    },
  ],

  pop: [
    {
      id: 'pop-basic',
      name: 'Pop Basic',
      description: 'Down-down-up-up-down-up',
      subdivisions: 2,
      beats: 4,
      pattern: ['D', 'rest', 'D', 'U', 'rest', 'U', 'D', 'U'],
    },
    {
      id: 'pop-16th',
      name: 'Pop 16ths',
      description: 'Sixteenth note pattern',
      subdivisions: 4,
      beats: 4,
      pattern: ['D', 'rest', 'D', 'U', 'rest', 'U', 'rest', 'U', 'D', 'rest', 'D', 'U', 'rest', 'U', 'rest', 'U'],
    },
  ],

  rock: [
    {
      id: 'rock-basic',
      name: 'Rock Basic',
      description: 'Straight rock strum',
      subdivisions: 2,
      beats: 4,
      pattern: ['D', 'rest', 'D', 'U', 'D', 'U', 'D', 'U'],
    },
    {
      id: 'rock-heavy',
      name: 'Heavy Rock',
      description: 'Accented down strokes',
      subdivisions: 2,
      beats: 4,
      pattern: ['Ad', 'rest', 'Ad', 'rest', 'Ad', 'U', 'Ad', 'rest'],
    },
  ],

  country: [
    {
      id: 'country-boom-chick',
      name: 'Boom-Chick',
      description: 'Alternating bass',
      subdivisions: 2,
      beats: 4,
      pattern: ['D', 'mute', 'D', 'mute', 'D', 'mute', 'D', 'mute'],
    },
    {
      id: 'country-travis',
      name: 'Travis Picking Style',
      description: 'Fingerstyle simulation',
      subdivisions: 4,
      beats: 4,
      pattern: ['D', 'rest', 'U', 'rest', 'D', 'rest', 'U', 'rest', 'D', 'rest', 'U', 'rest', 'D', 'rest', 'U', 'rest'],
    },
  ],

  reggae: [
    {
      id: 'reggae-skank',
      name: 'Reggae Skank',
      description: 'Offbeat emphasis',
      subdivisions: 2,
      beats: 4,
      pattern: ['rest', 'D', 'rest', 'D', 'rest', 'D', 'rest', 'D'],
    },
    {
      id: 'reggae-one-drop',
      name: 'One Drop',
      description: 'Beat 3 emphasis',
      subdivisions: 2,
      beats: 4,
      pattern: ['rest', 'D', 'rest', 'D', 'Ad', 'rest', 'rest', 'D'],
    },
  ],

  hiphop: [
    {
      id: 'hiphop-trap',
      name: 'Trap Strum',
      description: 'Hi-hat simulation',
      subdivisions: 4,
      beats: 4,
      pattern: ['D', 'U', 'rest', 'U', 'D', 'U', 'rest', 'U', 'D', 'U', 'rest', 'U', 'D', 'U', 'rest', 'U'],
    },
    {
      id: 'hiphop-boom',
      name: 'Boom Bap',
      description: 'Classic hip hop',
      subdivisions: 2,
      beats: 4,
      pattern: ['D', 'rest', 'mute', 'D', 'D', 'rest', 'mute', 'D'],
    },
  ],

  rnb: [
    {
      id: 'rnb-smooth',
      name: 'R&B Smooth',
      description: 'Smooth groove',
      subdivisions: 4,
      beats: 4,
      pattern: ['D', 'rest', 'rest', 'U', 'rest', 'U', 'D', 'rest', 'rest', 'U', 'rest', 'D', 'rest', 'U', 'rest', 'rest'],
    },
    {
      id: 'rnb-neo',
      name: 'Neo Soul',
      description: 'Syncopated neo soul',
      subdivisions: 4,
      beats: 4,
      pattern: ['D', 'rest', 'U', 'rest', 'rest', 'U', 'D', 'U', 'rest', 'D', 'rest', 'U', 'rest', 'rest', 'U', 'rest'],
    },
  ],

  latin: [
    {
      id: 'latin-bossa',
      name: 'Bossa Nova',
      description: 'Brazilian rhythm',
      subdivisions: 4,
      beats: 4,
      pattern: ['D', 'rest', 'rest', 'U', 'rest', 'D', 'rest', 'U', 'D', 'rest', 'rest', 'U', 'rest', 'D', 'rest', 'U'],
    },
    {
      id: 'latin-salsa',
      name: 'Salsa',
      description: 'Montuno pattern',
      subdivisions: 2,
      beats: 4,
      pattern: ['D', 'mute', 'D', 'mute', 'D', 'mute', 'D', 'mute'],
    },
  ],

  funk: [
    {
      id: 'funk-16th',
      name: 'Funk 16ths',
      description: 'Syncopated funk',
      subdivisions: 4,
      beats: 4,
      pattern: ['D', 'mute', 'D', 'U', 'mute', 'U', 'D', 'U', 'D', 'mute', 'D', 'U', 'mute', 'U', 'D', 'U'],
    },
    {
      id: 'funk-chop',
      name: 'Funk Chop',
      description: 'Percussive mutes',
      subdivisions: 4,
      beats: 4,
      pattern: ['D', 'mute', 'mute', 'mute', 'D', 'mute', 'mute', 'mute', 'D', 'mute', 'mute', 'mute', 'D', 'mute', 'mute', 'mute'],
    },
  ],

  neosoul: [
    {
      id: 'neosoul-syncopated',
      name: 'Neo Soul Syncopated',
      description: 'Off-beat emphasis',
      subdivisions: 4,
      beats: 4,
      pattern: ['D', 'rest', 'U', 'rest', 'rest', 'U', 'D', 'U', 'rest', 'D', 'rest', 'U', 'rest', 'rest', 'U', 'rest'],
    },
    {
      id: 'neosoul-smooth',
      name: 'Neo Soul Smooth',
      description: 'Smooth flowing pattern',
      subdivisions: 4,
      beats: 4,
      pattern: ['D', 'rest', 'rest', 'U', 'D', 'rest', 'U', 'rest', 'D', 'rest', 'rest', 'U', 'D', 'rest', 'U', 'rest'],
    },
  ],

  bluegrass: [
    {
      id: 'bluegrass-boom-chick',
      name: 'Bluegrass Boom-Chick',
      description: 'Fast alternating bass',
      subdivisions: 2,
      beats: 4,
      pattern: ['D', 'mute', 'D', 'mute', 'D', 'mute', 'D', 'mute'],
    },
    {
      id: 'bluegrass-roll',
      name: 'Bluegrass Roll',
      description: 'Roll pattern',
      subdivisions: 3,
      beats: 4,
      pattern: ['D', 'U', 'D', 'D', 'U', 'D', 'D', 'U', 'D', 'D', 'U', 'D'],
    },
  ],

  folk: [
    {
      id: 'folk-basic',
      name: 'Folk Basic',
      description: 'Simple folk strum',
      subdivisions: 2,
      beats: 4,
      pattern: ['D', 'rest', 'D', 'U', 'D', 'U', 'D', 'U'],
    },
    {
      id: 'folk-waltz',
      name: 'Folk Waltz',
      description: '3/4 time pattern',
      subdivisions: 2,
      beats: 3,
      pattern: ['D', 'rest', 'D', 'U', 'D', 'U'],
    },
  ],
};

// Helper functions for custom patterns
export function getStyleStrumming(styleId: string): StrummingPattern[] {
  return STYLE_STRUMMING[styleId] ?? [];
}

export function getCustomStrumPatterns(): StrummingPattern[] {
  try {
    const raw = localStorage.getItem('fretmaster-custom-strum-patterns');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomStrumPattern(pattern: StrummingPattern): void {
  const existing = getCustomStrumPatterns();
  const idx = existing.findIndex((p) => p.id === pattern.id);
  if (idx >= 0) {
    existing[idx] = pattern;
  } else {
    existing.push(pattern);
  }
  localStorage.setItem('fretmaster-custom-strum-patterns', JSON.stringify(existing));
}

export function deleteCustomStrumPattern(id: string): void {
  const existing = getCustomStrumPatterns();
  const filtered = existing.filter((p) => p.id !== id);
  localStorage.setItem('fretmaster-custom-strum-patterns', JSON.stringify(filtered));
}
