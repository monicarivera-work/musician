import { mod12 } from './notes';
import type { ParsedChord } from './chords';

/** Standard tuning, low E to high E, as MIDI numbers. */
export const STANDARD_TUNING = [40, 45, 50, 55, 59, 64];
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

export interface FretDot {
  string: number;
  fret: number;
  pc: number;
  midi: number;
}

/** Every fret position whose note belongs to the given pitch classes. */
export function fretboardDots(pcs: number[], frets = 12): FretDot[] {
  const set = new Set(pcs);
  const dots: FretDot[] = [];
  STANDARD_TUNING.forEach((open, string) => {
    for (let fret = 0; fret <= frets; fret++) {
      const midi = open + fret;
      if (set.has(mod12(midi))) dots.push({ string, fret, pc: mod12(midi), midi });
    }
  });
  return dots;
}

/** Fret per string, low E first; null = do not play the string. */
export type Frets = (number | null)[];

export interface ChordShape {
  frets: Frets;
  /** Index finger barre across strings, when the shape needs one. */
  barre?: { fret: number; from: number; to: number };
}

const x = null;

const OPEN: Record<string, Frets> = {
  C: [x, 3, 2, 0, 1, 0],
  D: [x, x, 0, 2, 3, 2],
  E: [0, 2, 2, 1, 0, 0],
  G: [3, 2, 0, 0, 0, 3],
  A: [x, 0, 2, 2, 2, 0],
  Am: [x, 0, 2, 2, 1, 0],
  Dm: [x, x, 0, 2, 3, 1],
  Em: [0, 2, 2, 0, 0, 0],
  E7: [0, 2, 0, 1, 0, 0],
  A7: [x, 0, 2, 0, 2, 0],
  D7: [x, x, 0, 2, 1, 2],
  G7: [3, 2, 0, 0, 0, 1],
  C7: [x, 3, 2, 3, 1, 0],
  B7: [x, 2, 1, 2, 0, 2],
  Cmaj7: [x, 3, 2, 0, 0, 0],
  Fmaj7: [x, x, 3, 2, 1, 0],
  Dmaj7: [x, x, 0, 2, 2, 2],
  Amaj7: [x, 0, 2, 1, 2, 0],
  Gmaj7: [3, 2, 0, 0, 0, 2],
  Am7: [x, 0, 2, 0, 1, 0],
  Dm7: [x, x, 0, 2, 1, 1],
  Em7: [0, 2, 0, 0, 0, 0],
  Asus2: [x, 0, 2, 2, 0, 0],
  Asus4: [x, 0, 2, 2, 3, 0],
  Dsus2: [x, x, 0, 2, 3, 0],
  Dsus4: [x, x, 0, 2, 3, 3],
  Esus4: [0, 2, 2, 2, 0, 0],
  Cadd9: [x, 3, 2, 0, 3, 0],
  E5: [0, 2, 2, x, x, x],
  A5: [x, 0, 2, 2, x, x],
  D5: [x, x, 0, 2, 3, x],
};

type Movable = { e?: number[]; a?: number[] };

// Offsets from the barre fret, low E first (-1 = muted). "e" shapes have the root on the
// low E string, "a" shapes on the A string.
const MOVABLE: Record<string, Movable> = {
  major: { e: [0, 2, 2, 1, 0, 0], a: [-1, 0, 2, 2, 2, 0] },
  minor: { e: [0, 2, 2, 0, 0, 0], a: [-1, 0, 2, 2, 1, 0] },
  '7': { e: [0, 2, 0, 1, 0, 0], a: [-1, 0, 2, 0, 2, 0] },
  m7: { e: [0, 2, 0, 0, 0, 0], a: [-1, 0, 2, 0, 1, 0] },
  maj7: { a: [-1, 0, 2, 1, 2, 0] },
  sus4: { e: [0, 2, 2, 2, 0, 0], a: [-1, 0, 2, 2, 3, 0] },
  sus2: { a: [-1, 0, 2, 2, 0, 0] },
  power: { e: [0, 2, 2, -1, -1, -1], a: [-1, 0, 2, 2, -1, -1] },
  diminished: { a: [-1, 0, 1, 2, 1, -1] },
  m7b5: { a: [-1, 0, 1, 0, 1, -1] },
  augmented: { a: [-1, 0, 3, 2, 2, -1] },
};

function movableKind(chord: ParsedChord): string | null {
  const ext = chord.extension;
  if (chord.quality === 'major') return ext === '' ? 'major' : ext === '7' ? '7' : ext === 'maj7' ? 'maj7' : 'major';
  if (chord.quality === 'minor') return ext === '7' ? 'm7' : 'minor';
  if (chord.quality === 'diminished') return ext === 'm7b5' ? 'm7b5' : 'diminished';
  if (chord.quality === 'augmented') return 'augmented';
  if (chord.quality === 'sus4') return 'sus4';
  if (chord.quality === 'sus2') return 'sus2';
  if (chord.quality === 'power') return 'power';
  return null;
}

function openKey(chord: ParsedChord): string {
  const q = chord.quality;
  const ext = chord.extension;
  const base = q === 'minor' ? 'm' : q === 'sus2' ? 'sus2' : q === 'sus4' ? 'sus4' : q === 'power' ? '5' : '';
  if (q === 'minor' && ext === '7') return `${chord.root}m7`;
  return `${chord.root}${base}${ext}`;
}

/** A playable shape: an open chord when one exists, otherwise a barre shape low on the neck. */
export function chordShape(chord: ParsedChord): ChordShape | null {
  const open = OPEN[openKey(chord)] ?? OPEN[openKey({ ...chord, extension: '' })];
  if (open) return { frets: open };
  const kind = movableKind(chord);
  if (!kind) return null;
  const shapes = MOVABLE[kind];
  const options: ChordShape[] = [];
  const build = (offsets: number[], fret: number, rootString: number): ChordShape => ({
    frets: offsets.map((o) => (o < 0 ? null : fret + o)),
    barre: fret > 0 ? { fret, from: rootString, to: offsets.lastIndexOf(0) } : undefined,
  });
  if (shapes.e) options.push(build(shapes.e, mod12(chord.rootPc - 4), 0));
  if (shapes.a) options.push(build(shapes.a, mod12(chord.rootPc - 9), 1));
  options.sort((p, q) => (p.barre?.fret ?? 0) - (q.barre?.fret ?? 0));
  return options[0] ?? null;
}

/** MIDI notes a shape sounds, low to high, for playback. */
export function shapeMidis(shape: ChordShape): number[] {
  return shape.frets.flatMap((f, i) => (f === null ? [] : [STANDARD_TUNING[i] + f]));
}

/** A close voicing for chords without a shape: root, third, fifth around the middle of the guitar. */
export function voiceChord(chord: ParsedChord): number[] {
  const root = 48 + mod12(chord.rootPc - 0);
  return chord.pcs.map((pc, i) => {
    let m = root + mod12(pc - chord.rootPc);
    if (i > 0 && m <= root) m += 12;
    return m;
  });
}
