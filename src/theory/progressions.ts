import { analyzeChordInKey, chordDisplay, type ChordInKey } from './chords';
import { collapseRepeats, type ChordEvent } from './chord-text';
import type { MusicKey } from './keys';

export interface NamedPattern {
  numerals: string[];
  mode: 'major' | 'minor';
  name: string;
  plain: string;
}

// Numerals are compared at the triad level ("V7" matches "V").
export const NAMED_PATTERNS: NamedPattern[] = [
  { numerals: ['I', 'V', 'vi', 'IV'], mode: 'major', name: 'The pop progression', plain: 'Home, tension, a sad turn, then away. The most-used four-chord loop in modern pop.' },
  { numerals: ['vi', 'IV', 'I', 'V'], mode: 'major', name: 'The sad pop loop', plain: 'The pop progression started on its minor chord, so it feels more wistful.' },
  { numerals: ['I', 'vi', 'IV', 'V'], mode: 'major', name: "The '50s progression", plain: 'The doo-wop loop: home, a soft minor chord, away, then tension that rolls back home.' },
  { numerals: ['I', 'IV', 'V'], mode: 'major', name: 'The three-chord trick', plain: 'Home, away, tension. The backbone of folk, blues, punk, and early rock and roll.' },
  { numerals: ['I', 'IV', 'V', 'IV'], mode: 'major', name: 'The rock-and-roll shuffle', plain: 'Three chords rocking back and forth: home, away, tension, away.' },
  { numerals: ['I', 'V', 'IV'], mode: 'major', name: 'Three chords, rock order', plain: 'Home, tension, then away. Leaves the tension hanging instead of resolving it.' },
  { numerals: ['I', 'IV'], mode: 'major', name: 'Home and away', plain: 'Two chords swaying between home and away. Calm and open.' },
  { numerals: ['I', 'V'], mode: 'major', name: 'Home and tension', plain: 'Two chords trading between rest and pull.' },
  { numerals: ['ii', 'V', 'I'], mode: 'major', name: 'The two-five-one', plain: 'Away, tension, home. The standard jazz way of arriving home.' },
  { numerals: ['I', 'vi', 'ii', 'V'], mode: 'major', name: 'The turnaround', plain: 'A loop that keeps circling back to home; common in jazz and old pop.' },
  { numerals: ['I', 'bVII', 'IV'], mode: 'major', name: 'The rock flat-seven', plain: 'Uses a chord borrowed from outside the key (♭VII) for a swaggering classic-rock sound.' },
  { numerals: ['IV', 'V', 'iii', 'vi'], mode: 'major', name: 'The royal road', plain: 'Away, tension, then a sideways step into minor chords. Big in J-pop and anime songs.' },
  { numerals: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'], mode: 'major', name: 'The canon progression', plain: "Pachelbel's Canon pattern: a long, stately loop that walks downward." },
  { numerals: ['IV', 'I', 'V', 'vi'], mode: 'major', name: 'The pop progression from away', plain: 'The pop progression starting on the away chord, so it feels like it is always arriving.' },
  { numerals: ['i', 'VI', 'III', 'VII'], mode: 'minor', name: 'The minor pop loop', plain: 'The pop progression heard from its minor side: moody but driving.' },
  { numerals: ['i', 'VII', 'VI', 'V'], mode: 'minor', name: 'The Andalusian cadence', plain: 'Four chords stepping down to a tense major V. Flamenco and surf-rock drama.' },
  { numerals: ['i', 'VII', 'VI', 'VII'], mode: 'minor', name: 'The minor rock vamp', plain: 'Home, then two chords from just below rocking back up. Epic and heavy.' },
  { numerals: ['i', 'iv', 'v'], mode: 'minor', name: 'The minor three-chord trick', plain: 'Home, away, tension, all in minor. Dark and bluesy.' },
  { numerals: ['i', 'iv', 'V'], mode: 'minor', name: 'Minor with a strong pull', plain: 'Home, away, then a major V that pulls hard back home.' },
  { numerals: ['i', 'VI', 'VII'], mode: 'minor', name: 'The epic climb', plain: 'Home, then two chords climbing back up to home. Heroic and cinematic.' },
  { numerals: ['i', 'VII', 'VI'], mode: 'minor', name: 'The minor descent', plain: 'Home stepping down two chords. Brooding.' },
  { numerals: ['i', 'iv'], mode: 'minor', name: 'Minor sway', plain: 'Two minor chords swaying between home and away.' },
];

/** Reduce a numeral to its triad identity: "V7" -> "V", "♭VII" -> "bVII", "vii°" -> "vii°". */
export function triadNumeral(text: string): string {
  return text
    .replace(/♭/g, 'b')
    .replace(/♯/g, '#')
    .replace(/ø7?$/, '°')
    .replace(/°7$/, '°')
    .replace(/(maj7|maj9|add\d+|sus[24]\d*|7|9|11|13|5|6)$/, '');
}

export interface FoundProgression {
  chords: string[];
  numerals: string[];
  /** How many times the loop was heard or written. */
  count: number;
  /** Fraction of the song's chord changes covered by this loop. */
  coverage: number;
  named?: { name: string; plain: string; rotated: boolean };
}

function rotations<T>(xs: T[]): T[][] {
  return xs.map((_, i) => [...xs.slice(i), ...xs.slice(0, i)]);
}

/** True when a sequence is a shorter loop played more than once ("G D G D"). */
function isRepeatedUnit(xs: string[]): boolean {
  for (let d = 1; d < xs.length; d++) {
    if (xs.length % d) continue;
    if (xs.every((x, i) => x === xs[i % d])) return true;
  }
  return false;
}

function matchNamed(numerals: string[], key: MusicKey): FoundProgression['named'] {
  const n = numerals.map(triadNumeral);
  const candidates = NAMED_PATTERNS.filter((p) => p.mode === key.mode && p.numerals.length === n.length);
  for (const p of candidates) if (p.numerals.join(' ') === n.join(' ')) return { name: p.name, plain: p.plain, rotated: false };
  for (const p of candidates) {
    if (rotations(p.numerals).some((r) => r.join(' ') === n.join(' '))) {
      return { name: p.name, plain: `${p.plain} Here it starts from a different chord.`, rotated: true };
    }
  }
  return undefined;
}

/**
 * Find the loops a song keeps returning to. Longer loops win over the
 * shorter loops inside them.
 */
export function findProgressions(events: ChordEvent[], key: MusicKey, max = 3): FoundProgression[] {
  const seq = collapseRepeats(events);
  if (!seq.length) return [];
  const analyzed: ChordInKey[] = seq.map((e) => analyzeChordInKey(e.chord, key));
  const symbols = seq.map((e) => e.chord.symbol);
  const nums = analyzed.map((a) => a.numeral.text);

  if (seq.length <= 8 && new Set(symbols).size === seq.length) {
    return [
      {
        chords: seq.map((e) => chordDisplay(e.chord)),
        numerals: nums,
        count: 1,
        coverage: 1,
        named: matchNamed(nums, key),
      },
    ];
  }

  const found: FoundProgression[] = [];
  const foundSymbols: string[][] = [];
  const covered = new Array(seq.length).fill(false);
  for (const n of [8, 4, 3, 2]) {
    if (seq.length < n * 2) continue;
    const counts = new Map<string, { start: number; starts: number[] }>();
    for (let i = 0; i + n <= seq.length; i++) {
      const gram = symbols.slice(i, i + n);
      if (new Set(gram).size < Math.min(n, 2) || isRepeatedUnit(gram)) continue;
      const id = gram.join(' ');
      const entry = counts.get(id) ?? { start: i, starts: [] };
      if (!entry.starts.length || i - entry.starts[entry.starts.length - 1] >= n) entry.starts.push(i);
      counts.set(id, entry);
    }
    const ranked = [...counts.entries()].filter(([, v]) => v.starts.length >= 2).sort((a, b) => b[1].starts.length - a[1].starts.length);
    for (const [, v] of ranked) {
      const fresh = v.starts.filter((s) => !covered.slice(s, s + n).every(Boolean));
      if (fresh.length < 2) continue;
      const gramSyms = symbols.slice(v.start, v.start + n);
      // A loop heard from a different starting chord is the same loop.
      if (foundSymbols.some((f) => f.length === n && rotations(f).some((r) => r.join(' ') === gramSyms.join(' ')))) continue;
      for (const s of v.starts) for (let k = s; k < s + n; k++) covered[k] = true;
      const numerals = nums.slice(v.start, v.start + n);
      foundSymbols.push(gramSyms);
      found.push({
        chords: seq.slice(v.start, v.start + n).map((e) => chordDisplay(e.chord)),
        numerals,
        count: v.starts.length,
        coverage: (v.starts.length * n) / seq.length,
        named: matchNamed(numerals, key),
      });
      if (found.length >= max) return found;
    }
  }
  if (!found.length) {
    const head = seq.slice(0, Math.min(seq.length, 8));
    found.push({
      chords: head.map((e) => chordDisplay(e.chord)),
      numerals: nums.slice(0, head.length),
      count: 1,
      coverage: head.length / seq.length,
      named: matchNamed(nums.slice(0, head.length), key),
    });
  }
  return found;
}

export interface Cadence {
  kind: 'authentic' | 'plagal' | 'deceptive' | 'mario';
  name: string;
  plain: string;
  count: number;
}

const CADENCE_INFO: Record<Cadence['kind'], { name: string; plain: string }> = {
  authentic: { name: 'Tension to home (V → I)', plain: 'The strongest way to land home. It sounds like a full stop.' },
  plagal: { name: 'The "Amen" ending (IV → I)', plain: 'A gentle landing home, like the "A-men" at the end of a hymn.' },
  deceptive: { name: 'The fake-out (V → vi)', plain: 'Builds tension like it is going home, then swerves to a sad chord instead.' },
  mario: { name: 'The heroic finish (♭VI → ♭VII → I)', plain: 'Two borrowed chords climbing to home. Sounds triumphant, like a video-game victory.' },
};

export function findCadences(events: ChordEvent[], key: MusicKey): Cadence[] {
  const seq = collapseRepeats(events);
  const nums = seq.map((e) => triadNumeral(analyzeChordInKey(e.chord, key).numeral.text));
  const home = key.mode === 'major' ? 'I' : 'i';
  const counts: Record<Cadence['kind'], number> = { authentic: 0, plagal: 0, deceptive: 0, mario: 0 };
  for (let i = 0; i + 1 < nums.length; i++) {
    const a = nums[i];
    const b = nums[i + 1];
    if ((a === 'V' || a === 'v') && b === home) counts.authentic++;
    if ((a === 'IV' || a === 'iv') && b === home) counts.plagal++;
    if (a === 'V' && ((key.mode === 'major' && b === 'vi') || (key.mode === 'minor' && b === 'VI'))) counts.deceptive++;
    if (i + 2 < nums.length && a === 'bVI' && b === 'bVII' && nums[i + 2] === 'I') counts.mario++;
  }
  return (Object.keys(counts) as Cadence['kind'][])
    .filter((k) => counts[k] > 0)
    .map((k) => ({ kind: k, ...CADENCE_INFO[k], count: counts[k] }))
    .sort((a, b) => b.count - a.count);
}
