import { useState } from 'react';
import { describeRange } from '../practice/range';
import { DIRECTIONS, TOLERANCES } from '../practice/run';
import { clearRuns, formatTime, loadRuns, summarize, type ExerciseSummary } from '../practice/storage';
import { midiName } from '../theory/notes';
import { useApp } from '../state/store';
import { NoteName } from './NoteName';
import { go } from './router';
import { BottomSheet, Term } from './Term';
import type { ScaleId } from '../theory/scales';

export function ProgressScreen() {
  const { range, setScale, setSing } = useApp();
  const [runs, setRuns] = useState(loadRuns);
  const [confirm, setConfirm] = useState(false);
  const groups = summarize(runs);
  const total = runs.length;
  const singingMs = runs.reduce((s, r) => s + r.totalMs, 0);

  const again = (g: ExerciseSummary) => {
    const [tonic, scaleId] = g.exercise.split('|');
    setScale({ tonic, scaleId: scaleId as ScaleId });
    setSing({ direction: g.direction, helper: g.helper, tolerance: g.tolerance });
    go('sing');
  };

  return (
    <div className="screen">
      <section aria-labelledby="progress-h">
        <h1 className="h1" id="progress-h">
          Progress
        </h1>
        <p className="lede">Your best time on each scale, and how your runs are trending.</p>
      </section>

      <dl className="tally">
        <div>
          <dt>Timed runs</dt>
          <dd className="serif num">{total}</dd>
        </div>
        <div>
          <dt>Time spent singing</dt>
          <dd className="serif num">{formatTime(singingMs)}</dd>
        </div>
        <div>
          <dt>
            <Term id="range">Vocal range</Term>
          </dt>
          <dd className="serif">
            {range ? (
              <>
                <NoteName name={midiName(range.low)} octave />–<NoteName name={midiName(range.high)} octave />
              </>
            ) : (
              <button type="button" className="linkish" onClick={() => go('sing')}>
                Not measured
              </button>
            )}
          </dd>
        </div>
      </dl>
      {range && <p className="fine">{describeRange(range)}</p>}

      {groups.length === 0 ? (
        <section className="section empty">
          <h2 className="h2">No runs yet</h2>
          <p className="small" style={{ marginTop: 8, maxWidth: '48ch' }}>
            Sing a scale from start to finish and its time shows up here. Each scale keeps its own best time, so you can watch it drop week by week.
          </p>
          <button type="button" className="btn btn--go btn--big" style={{ marginTop: 20 }} onClick={() => go('sing')}>
            Sing your first scale
          </button>
        </section>
      ) : (
        <section className="section" aria-labelledby="best-h">
          <h2 className="h2" id="best-h">
            Best times
          </h2>
          <ul className="besttimes">
            {groups.map((g) => {
              const slowest = Math.max(...g.recent.map((r) => r.totalMs));
              return (
                <li key={g.exercise} className="besttimes__item">
                  <div className="besttimes__head">
                    <div className="grow">
                      <p className="h3">{g.title}</p>
                      <p className="fine">
                        {TOLERANCES[g.tolerance].label} · {g.helper ? 'with reference notes' : 'on your own'} · {g.count} {g.count === 1 ? 'run' : 'runs'}
                      </p>
                    </div>
                    <p className="besttimes__best serif num" aria-label={`Best time ${formatTime(g.best.totalMs)}`}>
                      {formatTime(g.best.totalMs)}
                    </p>
                  </div>
                  {g.recent.length > 0 && (
                    <ol className="trend" aria-label={`Last ${g.recent.length} times, oldest first`}>
                      {g.recent.map((r) => (
                        <li
                          key={r.id}
                          className={r.id === g.best.id ? 'is-best' : ''}
                          style={{ height: `${Math.max(12, (r.totalMs / slowest) * 100)}%` }}
                          title={`${formatTime(r.totalMs)} on ${new Date(r.date).toLocaleDateString()}`}
                        >
                          <span className="sr-only">
                            {formatTime(r.totalMs)} on {new Date(r.date).toLocaleDateString()}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                  <div className="row spread wrap">
                    <p className="fine">
                      Last run {formatTime(g.latest.totalMs)}, {new Date(g.latest.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      {' · '}
                      {DIRECTIONS[g.direction]}
                    </p>
                    <button type="button" className="btn btn--small" onClick={() => again(g)}>
                      Sing it again
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="fine" style={{ marginTop: 16 }}>
            Each bar is one run, oldest on the left; shorter is faster. The yellow bar is your best.
          </p>
          <button type="button" className="btn btn--quiet" style={{ marginTop: 24 }} onClick={() => setConfirm(true)}>
            Clear all times
          </button>
        </section>
      )}

      {confirm && (
        <BottomSheet title="Clear all times?" onClose={() => setConfirm(false)}>
          <h2 className="h1">Clear all times?</h2>
          <p className="small" style={{ marginTop: 8 }}>
            This deletes every run and best time on this phone. It cannot be undone.
          </p>
          <button
            type="button"
            className="btn btn--block danger"
            style={{ marginTop: 20 }}
            onClick={() => {
              clearRuns();
              setRuns([]);
              setConfirm(false);
            }}
          >
            Delete all {total} runs
          </button>
        </BottomSheet>
      )}
    </div>
  );
}
