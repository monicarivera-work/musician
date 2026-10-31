/**
 * Finds a singer's comfortable low or high note: the app listens until one
 * note is held steadily, then records it.
 */
export class HeldNoteCapture {
  private note: number | null = null;
  private since = 0;
  private lastHeard = 0;

  constructor(
    readonly holdMs = 800,
    readonly windowCents = 50,
  ) {}

  /** Returns the held note (rounded MIDI) once it has been held long enough. */
  update(t: number, midi: number | null): { note: number | null; progress: number; captured: number | null } {
    if (midi === null) {
      if (this.note !== null && t - this.lastHeard > 200) this.note = null;
      return { note: this.note, progress: 0, captured: null };
    }
    const rounded = Math.round(midi);
    const off = Math.abs(midi - rounded) * 100;
    if (this.note === null || rounded !== this.note || off > this.windowCents) {
      this.note = off <= this.windowCents ? rounded : null;
      this.since = t;
    }
    this.lastHeard = t;
    if (this.note === null) return { note: null, progress: 0, captured: null };
    const progress = Math.min(1, (t - this.since) / this.holdMs);
    return { note: this.note, progress, captured: progress >= 1 ? this.note : null };
  }

  reset(): void {
    this.note = null;
    this.since = 0;
  }
}

export interface VocalRange {
  low: number;
  high: number;
}

export function describeRange(range: VocalRange): string {
  const span = range.high - range.low;
  const octaves = span / 12;
  if (span < 12) return `${span} half steps: a little under one octave. Most beginners start here, and it grows with practice.`;
  const whole = Math.floor(octaves);
  const extra = span - whole * 12;
  const half = extra >= 6 ? ' and a half' : '';
  return `About ${whole}${half} octave${whole > 1 || half ? 's' : ''} (${span} half steps).`;
}
