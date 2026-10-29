import { load, save } from '../state/persist';
import type { Direction, NoteResult, Tolerance } from './run';

export interface RunRecord {
  id: string;
  date: string;
  /** Identifies the exercise for best times, e.g. "G|major|up|help|normal". */
  exercise: string;
  title: string;
  direction: Direction;
  helper: boolean;
  tolerance: Tolerance;
  homeMidi: number;
  totalMs: number;
  notes: NoteResult[];
}

const KEY = 'runs';
const MAX_RUNS = 500;

export function exerciseId(tonic: string, scaleId: string, direction: Direction, helper: boolean, tolerance: Tolerance): string {
  return [tonic, scaleId, direction, helper ? 'help' : 'solo', tolerance].join('|');
}

export function loadRuns(): RunRecord[] {
  return load<RunRecord[]>(KEY, []);
}

export function saveRun(run: RunRecord): RunRecord[] {
  const runs = [run, ...loadRuns()].slice(0, MAX_RUNS);
  save(KEY, runs);
  return runs;
}

export function clearRuns(): void {
  save(KEY, []);
}

export function bestFor(runs: RunRecord[], exercise: string): RunRecord | null {
  return runs.filter((r) => r.exercise === exercise).reduce<RunRecord | null>((best, r) => (!best || r.totalMs < best.totalMs ? r : best), null);
}

export interface ExerciseSummary {
  exercise: string;
  title: string;
  direction: Direction;
  helper: boolean;
  tolerance: Tolerance;
  best: RunRecord;
  latest: RunRecord;
  count: number;
  /** Oldest to newest, at most 12. */
  recent: RunRecord[];
}

export function summarize(runs: RunRecord[]): ExerciseSummary[] {
  const groups = new Map<string, RunRecord[]>();
  for (const r of runs) groups.set(r.exercise, [...(groups.get(r.exercise) ?? []), r]);
  return [...groups.values()]
    .map((list) => {
      const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
      const best = list.reduce((b, r) => (r.totalMs < b.totalMs ? r : b));
      const latest = sorted[sorted.length - 1];
      return {
        exercise: latest.exercise,
        title: latest.title,
        direction: latest.direction,
        helper: latest.helper,
        tolerance: latest.tolerance,
        best,
        latest,
        count: list.length,
        recent: sorted.slice(-12),
      };
    })
    .sort((a, b) => b.latest.date.localeCompare(a.latest.date));
}

export function formatTime(ms: number): string {
  const total = Math.max(0, ms) / 1000;
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}
