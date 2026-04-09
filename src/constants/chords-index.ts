/**
 * Combined chord database barrel
 * Merges the main chord library with extended chord families
 */
import { CHORD_DATABASE as BASE_CHORDS } from './chords';
import {
  AUG7SHARP9_E6_MOVABLE,
  AUG7SHARP9_A5_MOVABLE,
  DOM7SHARP9_E6_BARRE,
  DOM7SHARP9_A5_MOVABLE,
} from './chords-extended';

export const CHORD_DATABASE = [
  ...BASE_CHORDS,
  ...AUG7SHARP9_E6_MOVABLE,
  ...AUG7SHARP9_A5_MOVABLE,
  ...DOM7SHARP9_E6_BARRE,
  ...DOM7SHARP9_A5_MOVABLE,
];
