import { Key as TonalKey, Note } from 'tonal';
import { mod12, pitchClass, pretty, toAscii } from './notes';
import { buildScale, type BuiltScale } from './scales';

export type Mode = 'major' | 'minor';

export interface MusicKey {
  tonic: string;
  mode: Mode;
}

// Conventional spellings, indexed by pitch class: the fewest sharps or flats wins.
const MAJOR_TONICS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const MINOR_TONICS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

export const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
export const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10];

export function keyFromPc(pc: number, mode: Mode): MusicKey {
  return { tonic: (mode === 'major' ? MAJOR_TONICS : MINOR_TONICS)[mod12(pc)], mode };
}

export function normalizeKey(key: MusicKey): MusicKey {
  return keyFromPc(pitchClass(key.tonic), key.mode);
}

export function sameKey(a: MusicKey, b: MusicKey): boolean {
  return a.mode === b.mode && pitchClass(a.tonic) === pitchClass(b.tonic);
}

export function keyLabel(key: MusicKey): string {
  return `${pretty(key.tonic)} ${key.mode}`;
}

export function keyId(key: MusicKey): string {
  return `${key.tonic}-${key.mode}`;
}

export function parseKeyId(id: string): MusicKey | null {
  const m = /^([A-G](?:#|b)?)-(major|minor)$/.exec(id);
  return m ? { tonic: m[1], mode: m[2] as Mode } : null;
}

export function keyScale(key: MusicKey): BuiltScale {
  return buildScale(key.tonic, key.mode === 'major' ? 'major' : 'minor');
}

export function keyPcs(key: MusicKey): number[] {
  const t = pitchClass(key.tonic);
  return (key.mode === 'major' ? MAJOR_STEPS : MINOR_STEPS).map((s) => mod12(t + s));
}

export function relativeKey(key: MusicKey): MusicKey {
  const t = pitchClass(key.tonic);
  return key.mode === 'major' ? keyFromPc(t - 3, 'minor') : keyFromPc(t + 3, 'major');
}

export function parallelKey(key: MusicKey): MusicKey {
  return keyFromPc(pitchClass(key.tonic), key.mode === 'major' ? 'minor' : 'major');
}

/** The keys one step around the circle of fifths: one fewer and one more sharp. */
export function neighborKeys(key: MusicKey): { down: MusicKey; up: MusicKey } {
  const t = pitchClass(key.tonic);
  return { down: keyFromPc(t + 5, key.mode), up: keyFromPc(t + 7, key.mode) };
}

export interface KeySignature {
  count: number;
  kind: 'sharps' | 'flats' | 'none';
  notes: string[];
}

const SHARP_ORDER = ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'];
const FLAT_ORDER = ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb'];

export function keySignature(key: MusicKey): KeySignature {
  const t = toAscii(key.tonic);
  const alteration = key.mode === 'major' ? TonalKey.majorKey(t).alteration : TonalKey.majorKey(Note.transpose(t, '3m')).alteration;
  if (!alteration) return { count: 0, kind: 'none', notes: [] };
  if (alteration > 0) return { count: alteration, kind: 'sharps', notes: SHARP_ORDER.slice(0, alteration) };
  return { count: -alteration, kind: 'flats', notes: FLAT_ORDER.slice(0, -alteration) };
}

export function describeKeySignature(sig: KeySignature): string {
  if (sig.kind === 'none') return 'No sharps or flats: all natural notes (only white piano keys).';
  const list = sig.notes.map(pretty).join(', ');
  const n = sig.count === 1 ? `1 ${sig.kind.slice(0, -1)}` : `${sig.count} ${sig.kind}`;
  return `${n} (${list}). Those notes are always raised or lowered in this key.`;
}

export interface CapoOption {
  capo: number;
  /** The open-chord key whose shapes you finger. */
  shapesKey: MusicKey;
}

const EASY_MAJOR_SHAPES = ['G', 'C', 'D', 'A', 'E'];
const EASY_MINOR_SHAPES = ['Em', 'Am', 'Dm'];

/** Ways to play a key with easy open-chord shapes and a capo, lowest capo first. */
export function capoOptions(key: MusicKey, maxCapo = 7): CapoOption[] {
  const target = pitchClass(key.tonic);
  const shapes = key.mode === 'major' ? EASY_MAJOR_SHAPES : EASY_MINOR_SHAPES;
  return shapes
    .map((s) => {
      const shapeTonic = s.replace('m', '');
      return { capo: mod12(target - pitchClass(shapeTonic)), shapesKey: { tonic: shapeTonic, mode: key.mode } };
    })
    .filter((o) => o.capo <= maxCapo)
    .sort((a, b) => a.capo - b.capo);
}
