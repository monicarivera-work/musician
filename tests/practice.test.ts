import { describe, expect, it } from 'vitest';
import { chooseHomeMidi, classify, foldOctave, orderRun, ScaleRun } from '../src/practice/run';
import { HeldNoteCapture, describeRange } from '../src/practice/range';

/** Drive a run at 60 fps with a voice function of time (ms). */
function simulate(run: ScaleRun, voice: (t: number) => number | null, untilMs = 20000) {
  run.resume(0);
  const landed: number[] = [];
  for (let t = 0; t <= untilMs; t += 1000 / 60) {
    const f = run.update(t, voice(t));
    if (f.landed) landed.push(t);
    if (f.done) break;
  }
  return landed;
}

describe('scale run', () => {
  it('classifies how far off the voice is', () => {
    expect(classify(null, 35)).toBe('silent');
    expect(classify(10, 35)).toBe('on');
    expect(classify(-60, 35)).toBe('close-low');
    expect(classify(150, 35)).toBe('high');
    expect(classify(-700, 35)).toBe('way-low');
    expect(classify(-1205, 35)).toBe('octave-low');
    expect(classify(-1205, 35, true)).toBe('on');
    expect(foldOctave(-1190)).toBe(10);
  });

  it('lands each note after holding it, and times the run', () => {
    const targets = [60, 62, 64];
    const run = new ScaleRun({ targets, toleranceCents: 35, holdMs: 300 });
    // Silent for 500 ms, then sings each target for 500 ms.
    const voice = (t: number) => {
      if (t < 500) return null;
      const i = Math.min(targets.length - 1, Math.floor((t - 500) / 500));
      return targets[i] + 0.1;
    };
    simulate(run, voice);
    expect(run.done).toBe(true);
    expect(run.results).toHaveLength(3);
    expect(run.results[0].ms).toBeGreaterThanOrEqual(780);
    expect(run.results[0].ms).toBeLessThanOrEqual(840);
    expect(run.results[0].avgCents).toBe(10);
    expect(run.elapsedMs).toBeGreaterThan(1700);
    expect(run.elapsedMs).toBeLessThan(1900);
  });

  it('bridges short dropouts but restarts the hold after long ones', () => {
    const run = new ScaleRun({ targets: [60], toleranceCents: 35, holdMs: 400, gapMs: 120 });
    // 250 ms on pitch, 80 ms breath, 200 ms on pitch: lands thanks to bridging.
    const voice = (t: number) => (t < 250 || t > 330 ? 60 : null);
    simulate(run, voice, 1000);
    expect(run.done).toBe(true);

    const run2 = new ScaleRun({ targets: [60], toleranceCents: 35, holdMs: 400, gapMs: 120 });
    const voice2 = (t: number) => (t < 250 ? 60 : t < 600 ? null : t < 700 ? 60 : null);
    simulate(run2, voice2, 1000);
    expect(run2.done).toBe(false);
  });

  it('does not count paused time (while a reference note plays)', () => {
    const run = new ScaleRun({ targets: [60], toleranceCents: 35, holdMs: 300 });
    run.pause(0);
    run.update(1000, 60);
    run.resume(1000);
    for (let t = 1000; t <= 1400; t += 16) run.update(t, 60);
    expect(run.done).toBe(true);
    expect(run.elapsedMs).toBeLessThan(400);
  });

  it('notices the right note in the wrong octave', () => {
    const run = new ScaleRun({ targets: [64], toleranceCents: 35, holdMs: 300 });
    const voice = (t: number) => (t < 600 ? 52 : 64);
    simulate(run, voice, 2000);
    expect(run.results[0].octaveSlip).toBe(true);
  });

  it('orders runs and picks a singable octave', () => {
    expect(orderRun([60, 62, 64], 'up-down')).toEqual([60, 62, 64, 62, 60]);
    expect(orderRun([60, 62, 64], 'down')).toEqual([64, 62, 60]);
    expect(chooseHomeMidi(7, { low: 45, high: 64 })).toBe(43);
    expect(chooseHomeMidi(0, { low: 55, high: 79 })).toBe(60);
    expect(chooseHomeMidi(7, null)).toBe(55);
  });
});

describe('range capture', () => {
  it('captures a steadily held note', () => {
    const c = new HeldNoteCapture(800, 50);
    let captured: number | null = null;
    for (let t = 0; t < 1200 && captured === null; t += 16) captured = c.update(t, 47.2).captured;
    expect(captured).toBe(47);
  });

  it('describes ranges in plain words', () => {
    expect(describeRange({ low: 48, high: 67 })).toBe('About 1 and a half octaves (19 half steps).');
    expect(describeRange({ low: 55, high: 62 })).toMatch(/under one octave/);
  });
});
