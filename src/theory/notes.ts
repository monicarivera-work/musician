import { Note } from 'tonal';

export const A4_MIDI = 69;
export const A4_FREQ = 440;

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

export function midiToFreq(midi: number): number {
  return A4_FREQ * Math.pow(2, (midi - A4_MIDI) / 12);
}

/** Fractional MIDI number for a frequency, e.g. 440 Hz -> 69, 452 Hz -> 69.47. */
export function freqToMidi(freq: number): number {
  return A4_MIDI + 12 * Math.log2(freq / A4_FREQ);
}

/** Pitch class (0 = C ... 11 = B) for a note name like "F#", "Bb3", "E♭". */
export function pitchClass(name: string): number {
  const chroma = Note.chroma(toAscii(name));
  if (chroma === undefined || Number.isNaN(chroma)) {
    throw new Error(`Not a note name: ${name}`);
  }
  return chroma;
}

export function pcName(pc: number, preferFlats = false): string {
  return (preferFlats ? FLAT_NAMES : SHARP_NAMES)[mod12(pc)];
}

/** Note name with octave for a MIDI number, e.g. 60 -> "C4". */
export function midiName(midi: number, preferFlats = false): string {
  const rounded = Math.round(midi);
  return `${pcName(rounded, preferFlats)}${Math.floor(rounded / 12) - 1}`;
}

export function octaveOf(midi: number): number {
  return Math.floor(Math.round(midi) / 12) - 1;
}

/** Replace ASCII accidentals with music glyphs for display: "F#" -> "F♯", "Bb" -> "B♭". */
export function pretty(name: string): string {
  return name
    .replace(/^([A-G])##/, '$1𝄪')
    .replace(/^([A-G])bb/, '$1𝄫')
    .replace(/^([A-G])#/, '$1♯')
    .replace(/^([A-G])b/, '$1♭');
}

/** Normalize music glyphs back to ASCII for parsing. */
export function toAscii(name: string): string {
  return name.replace(/♯/g, '#').replace(/♭/g, 'b').replace(/𝄪/g, '##').replace(/𝄫/g, 'bb');
}

/** Signed distance in cents from a frequency to a target MIDI note. */
export function centsFrom(freq: number, targetMidi: number): number {
  return (freqToMidi(freq) - targetMidi) * 100;
}

/** Spell a MIDI number using the letter names of a given scale when possible. */
export function spellMidiInScale(midi: number, scaleNames: readonly string[]): string {
  const base = Math.round(midi);
  const pc = mod12(base);
  const match = scaleNames.find((n) => pitchClass(n) === pc);
  if (!match) return midiName(base);
  // The written octave follows the letter: B#3 sounds as C4, Cb4 sounds as B3.
  let octave = octaveOf(base);
  if (match.startsWith('B') && pc === 0) octave -= 1;
  if (match.startsWith('C') && pc === 11) octave += 1;
  return `${match}${octave}`;
}
