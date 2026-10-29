export type Tolerance = 'relaxed' | 'normal' | 'strict';

export const TOLERANCES: Record<Tolerance, { cents: number; holdMs: number; label: string; plain: string }> = {
  relaxed: { cents: 50, holdMs: 250, label: 'Relaxed', plain: 'Within half a fret, held briefly' },
  normal: { cents: 35, holdMs: 350, label: 'Normal', plain: 'Within a third of a fret, held a moment' },
  strict: { cents: 20, holdMs: 500, label: 'Strict', plain: 'Within a fifth of a fret, held steady' },
};

export interface RunSettings {
  /** MIDI notes to sing, in order. */
  targets: number[];
  toleranceCents: number;
  holdMs: number;
  /** Accept the right note in any octave. */
  anyOctave?: boolean;
  /** Join short dropouts in the voice (breaths, consonants) instead of restarting the hold. */
  gapMs?: number;
}

export interface NoteResult {
  target: number;
  /** Timer milliseconds from starting to listen for this note until it was landed. */
  ms: number;
  /** Average distance from the target while holding it, in cents. */
  avgCents: number;
  /** Sang the right note in the wrong octave at some point. */
  octaveSlip: boolean;
}

export type Cue =
  | 'silent'
  | 'on'
  | 'close-low'
  | 'close-high'
  | 'low'
  | 'high'
  | 'way-low'
  | 'way-high'
  | 'octave-low'
  | 'octave-high';

export interface RunFrame {
  cue: Cue;
  /** Signed cents from the target (negative = flat/low), or null when silent. */
  cents: number | null;
  /** 0..1 how much of the required hold is done. */
  hold: number;
  landed: NoteResult | null;
  done: boolean;
}

/** Signed distance to the nearest octave-equivalent of the target, in cents (-600..600). */
export function foldOctave(cents: number): number {
  return ((((cents + 600) % 1200) + 1200) % 1200) - 600;
}

export function classify(cents: number | null, tol: number, anyOctave = false): Cue {
  if (cents === null) return 'silent';
  const folded = foldOctave(cents);
  if (Math.abs(cents) > 600 && Math.abs(folded) <= tol) {
    if (anyOctave) return 'on';
    return cents < 0 ? 'octave-low' : 'octave-high';
  }
  const c = Math.abs(cents) > 600 && anyOctave ? folded : cents;
  const a = Math.abs(c);
  if (a <= tol) return 'on';
  if (a <= 100) return c < 0 ? 'close-low' : 'close-high';
  if (a <= 300) return c < 0 ? 'low' : 'high';
  return c < 0 ? 'way-low' : 'way-high';
}

/**
 * A timed run through a list of notes. Feed it the time and the sung pitch
 * every animation frame; it decides when each note has been landed. The timer
 * can be paused while a reference note plays, so only singing time counts.
 */
export class ScaleRun {
  index = 0;
  elapsedMs = 0;
  readonly results: NoteResult[] = [];
  private paused = true;
  private lastT: number | null = null;
  private noteStart = 0;
  private holdStart: number | null = null;
  private lastGood: number | null = null;
  private heldErrors: number[] = [];
  private slip = false;

  constructor(readonly settings: RunSettings) {}

  get target(): number | undefined {
    return this.settings.targets[this.index];
  }

  get done(): boolean {
    return this.index >= this.settings.targets.length;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  pause(t: number): void {
    this.tick(t);
    this.paused = true;
  }

  resume(t: number): void {
    this.tick(t);
    this.paused = false;
  }

  private tick(t: number): void {
    if (this.lastT !== null && !this.paused && !this.done) this.elapsedMs += t - this.lastT;
    this.lastT = t;
  }

  /** midi is the sung pitch as a fractional MIDI number, or null for silence. */
  update(t: number, midi: number | null): RunFrame {
    this.tick(t);
    const target = this.target;
    if (target === undefined) return { cue: 'silent', cents: null, hold: 1, landed: null, done: true };
    const tol = this.settings.toleranceCents;
    const cents = midi === null ? null : (midi - target) * 100;
    const cue = classify(cents, tol, this.settings.anyOctave);
    if (cue === 'octave-low' || cue === 'octave-high') this.slip = true;
    if (this.paused) return { cue, cents, hold: 0, landed: null, done: false };

    const gap = this.settings.gapMs ?? 120;
    if (cue === 'on' && cents !== null) {
      if (this.holdStart === null) this.holdStart = this.elapsedMs;
      this.lastGood = this.elapsedMs;
      this.heldErrors.push(Math.abs(this.settings.anyOctave ? foldOctave(cents) : cents));
    } else if (this.lastGood === null || this.elapsedMs - this.lastGood > gap) {
      this.holdStart = null;
      this.lastGood = null;
      this.heldErrors = [];
    }

    const held = this.holdStart === null ? 0 : this.elapsedMs - this.holdStart;
    const hold = Math.min(1, held / this.settings.holdMs);
    if (hold >= 1) {
      const result: NoteResult = {
        target,
        ms: Math.round(this.elapsedMs - this.noteStart),
        avgCents: Math.round(this.heldErrors.reduce((s, v) => s + v, 0) / Math.max(1, this.heldErrors.length)),
        octaveSlip: this.slip,
      };
      this.results.push(result);
      this.index++;
      this.noteStart = this.elapsedMs;
      this.holdStart = null;
      this.lastGood = null;
      this.heldErrors = [];
      this.slip = false;
      return { cue, cents, hold: 1, landed: result, done: this.done };
    }
    return { cue, cents, hold, landed: null, done: false };
  }
}

export type Direction = 'up' | 'down' | 'up-down';

export const DIRECTIONS: Record<Direction, string> = {
  up: 'Up',
  down: 'Down',
  'up-down': 'Up and back down',
};

/** Order a one-octave scale run (home .. octave) for a direction. */
export function orderRun(octaveRun: number[], direction: Direction): number[] {
  if (direction === 'up') return octaveRun;
  if (direction === 'down') return [...octaveRun].reverse();
  return [...octaveRun, ...[...octaveRun].reverse().slice(1)];
}

/**
 * Pick the octave for a scale's home note so a run sits inside the singer's
 * range, or around the middle of most voices when the range is unknown.
 */
export function chooseHomeMidi(homePc: number, range: { low: number; high: number } | null, span = 12): number {
  const candidates: number[] = [];
  for (let m = 36; m <= 84; m++) if (((m % 12) + 12) % 12 === homePc) candidates.push(m);
  const score = (home: number) => {
    const lo = home;
    const hi = home + span;
    if (!range) return -Math.abs(home + span / 2 - 60);
    const overlap = Math.max(0, Math.min(hi, range.high) - Math.max(lo, range.low));
    const center = (range.low + range.high) / 2;
    return overlap * 10 - Math.abs(home + span / 2 - center);
  };
  return candidates.reduce((best, m) => (score(m) > score(best) ? m : best), candidates[0]);
}
