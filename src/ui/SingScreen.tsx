import { useEffect, useMemo, useRef, useState } from 'react';
import type { PitchReading } from '../audio/pitch';
import { hum, stopAll } from '../audio/synth';
import { unlockAudio } from '../audio/context';
import { HeldNoteCapture, describeRange } from '../practice/range';
import { chooseHomeMidi, DIRECTIONS, orderRun, ScaleRun, TOLERANCES, type Cue, type Direction, type Tolerance } from '../practice/run';
import { bestFor, exerciseId, formatTime, loadRuns, saveRun, type RunRecord } from '../practice/storage';
import { midiName, mod12, pitchClass, spellMidiInScale } from '../theory/notes';
import { buildScale, describeGap, oneOctaveRun, scaleType } from '../theory/scales';
import { useApp } from '../state/store';
import { IconCheck, IconClose, IconReplay, IconUp, IconDown } from './icons';
import { NoteName } from './NoteName';
import { go } from './router';
import { SingLadder, type SingLadderHandle } from './SingLadder';
import { Term } from './Term';
import { useLiveVoice } from './useLiveVoice';

type Phase =
  | { kind: 'setup' }
  | { kind: 'running' }
  | { kind: 'done'; record: RunRecord; prevBest: RunRecord | null }
  | { kind: 'range'; step: 'low' | 'high'; low?: number }
  | { kind: 'free' };

const CUE_WORDS: Record<Cue, string> = {
  silent: 'Sing when you are ready',
  on: 'Right on. Hold it…',
  'close-low': 'A little higher',
  'close-high': 'A little lower',
  low: 'Higher',
  high: 'Lower',
  'way-low': 'Much higher',
  'way-high': 'Much lower',
  'octave-low': 'Right note, one octave too low. Try it higher.',
  'octave-high': 'Right note, one octave too high. Try it lower.',
};

const REF_MS = 900;

export function SingScreen() {
  const { scale: choice, sing, setSing, range, setRange } = useApp();
  const scale = useMemo(() => buildScale(choice.tonic, choice.scaleId), [choice]);
  const names = scale.degrees.map((d) => d.note);
  const homePc = pitchClass(choice.tonic);
  const autoHome = chooseHomeMidi(homePc, range);
  const homeMidi = autoHome + sing.octaveShift * 12;
  const targets = orderRun(oneOctaveRun(scale, homeMidi), sing.direction);
  const tol = TOLERANCES[sing.tolerance];
  const exercise = exerciseId(choice.tonic, choice.scaleId, sing.direction, sing.helper, sing.tolerance);
  const [runs, setRuns] = useState<RunRecord[]>(() => loadRuns());
  const best = bestFor(runs, exercise);
  const [phase, setPhase] = useState<Phase>({ kind: 'setup' });

  // Live state for the run; refs avoid re-rendering 60 times a second.
  const ladder = useRef<SingLadderHandle>(null);
  const runRef = useRef<ScaleRun | null>(null);
  const refUntil = useRef(0);
  const lastIndex = useRef(-1);
  const lastPaint = useRef(0);
  const capture = useRef(new HeldNoteCapture(800, 50));
  const [view, setView] = useState({ elapsed: 0, cue: 'silent' as Cue, index: 0, voice: null as number | null, hold: 0, progress: 0 });
  const [landed, setLanded] = useState<Record<number, string>>({});

  const live = phase.kind === 'running' || phase.kind === 'range' || phase.kind === 'free';

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phase.kind]);

  const playReference = (midi: number, now: number) => {
    runRef.current?.pause(now);
    refUntil.current = now + REF_MS + 180;
    hum(midi, REF_MS / 1000);
  };

  const onFrame = (r: PitchReading, now: number) => {
    if (phase.kind === 'running') runFrame(r, now);
    else if (phase.kind === 'range') rangeFrame(r, now);
    else if (phase.kind === 'free') freeFrame(r, now);
  };

  const runFrame = (r: PitchReading, now: number) => {
    const run = runRef.current;
    if (!run) return;
    if (run.index !== lastIndex.current && !run.done) {
      const first = lastIndex.current === -1;
      lastIndex.current = run.index;
      if (first || sing.helper) playReference(run.target!, now);
      else run.resume(now);
    }
    const referencing = now < refUntil.current;
    if (!referencing && run.isPaused && !run.done) run.resume(now);
    const voice = referencing ? null : r.midi;
    const f = run.update(now, voice);
    ladder.current?.push({ now, voice, inTune: f.cue === 'on', target: run.target ?? null, hold: f.hold });
    if (f.landed) {
      const ms = f.landed.ms;
      setLanded((m) => ({ ...m, [f.landed!.target]: `${(ms / 1000).toFixed(1)} s` }));
    }
    if (f.done) {
      finishRun(run);
      return;
    }
    if (now - lastPaint.current > 60) {
      lastPaint.current = now;
      setView({ elapsed: run.elapsedMs, cue: referencing ? 'silent' : f.cue, index: run.index, voice, hold: f.hold, progress: 0 });
    }
  };

  const finishRun = (run: ScaleRun) => {
    const record: RunRecord = {
      id: `${Date.now()}`,
      date: new Date().toISOString(),
      exercise,
      title: `${scale.title}, ${DIRECTIONS[sing.direction].toLowerCase()}`,
      direction: sing.direction,
      helper: sing.helper,
      tolerance: sing.tolerance,
      homeMidi,
      totalMs: Math.round(run.elapsedMs),
      notes: run.results,
    };
    const prevBest = bestFor(runs, exercise);
    setRuns(saveRun(record));
    runRef.current = null;
    setPhase({ kind: 'done', record, prevBest });
  };

  const rangeFrame = (r: PitchReading, now: number) => {
    if (phase.kind !== 'range') return;
    const res = capture.current.update(now, r.midi);
    if (now - lastPaint.current > 50) {
      lastPaint.current = now;
      setView((v) => ({ ...v, voice: r.midi, progress: res.progress }));
    }
    if (res.captured !== null) {
      capture.current.reset();
      if (phase.step === 'low') setPhase({ kind: 'range', step: 'high', low: res.captured });
      else {
        const low = Math.min(phase.low ?? res.captured, res.captured);
        const high = Math.max(phase.low ?? res.captured, res.captured);
        setRange({ low, high: high === low ? low + 1 : high });
        setSing({ octaveShift: 0 });
        setPhase({ kind: 'setup' });
      }
    }
  };

  const freeFrame = (r: PitchReading, now: number) => {
    const nearest = r.midi === null ? null : Math.round(r.midi);
    const inTune = r.midi !== null && Math.abs(r.midi - Math.round(r.midi)) < 0.25;
    ladder.current?.push({ now, voice: r.midi, inTune, target: null, hold: 0 });
    if (now - lastPaint.current > 60) {
      lastPaint.current = now;
      setView((v) => ({ ...v, voice: r.midi, index: nearest ?? v.index }));
    }
  };

  const voiceState = useLiveVoice(live, onFrame);

  const start = async () => {
    await unlockAudio('play-and-record');
    stopAll();
    runRef.current = new ScaleRun({ targets, toleranceCents: tol.cents, holdMs: tol.holdMs, gapMs: 140 });
    lastIndex.current = -1;
    refUntil.current = 0;
    setLanded({});
    setView({ elapsed: 0, cue: 'silent', index: 0, voice: null, hold: 0, progress: 0 });
    ladder.current?.clear();
    setPhase({ kind: 'running' });
  };

  const stop = () => {
    runRef.current = null;
    stopAll();
    setPhase({ kind: 'setup' });
  };

  const replay = () => {
    const run = runRef.current;
    if (run?.target !== undefined) playReference(run.target, performance.now());
  };

  if (voiceState.status === 'error' && live) {
    return (
      <div className="screen">
        <div className="notice notice--error" role="alert">
          <div className="grow">
            <p className="notice__title">{voiceState.title}</p>
            <p className="small">{voiceState.fix}</p>
          </div>
        </div>
        <button type="button" className="btn" style={{ marginTop: 16 }} onClick={() => setPhase({ kind: 'setup' })}>
          Back
        </button>
      </div>
    );
  }

  if (phase.kind === 'running') {
    const target = targets[Math.min(view.index, targets.length - 1)];
    const targetName = spellMidiInScale(target, names);
    const solfa = scale.degrees.find((d) => d.pc === mod12(target))?.solfa ?? '';
    const referencing = performance.now() < refUntil.current;
    const low = Math.min(...targets) - 2;
    const high = Math.max(...targets) + 2;
    return (
      <div className="screen run">
        <div className="run__top">
          <p className="run__timer num serif" aria-label={`Time ${formatTime(view.elapsed)}`}>
            {formatTime(view.elapsed)}
          </p>
          <p className="run__count fine num">
            Note {Math.min(view.index + 1, targets.length)} of {targets.length}
          </p>
          <button type="button" className="btn btn--small" onClick={stop}>
            <IconClose size={18} /> Stop
          </button>
        </div>
        <div className="run__target">
          <p className="run__sing">
            Sing{' '}
            <span className="serif run__note">
              <NoteName name={targetName.replace(/-?\d+$/, '')} />
            </span>{' '}
            <span className="solfa">{solfa}</span>
          </p>
          <p className={`run__cue cue--${view.cue}`} aria-live="polite">
            {voiceState.status !== 'live' ? 'Starting the microphone…' : referencing ? 'Listen…' : CUE_WORDS[view.cue]}
            {(view.cue === 'close-low' || view.cue === 'low' || view.cue === 'way-low') && <IconUp size={18} />}
            {(view.cue === 'close-high' || view.cue === 'high' || view.cue === 'way-high') && <IconDown size={18} />}
          </p>
        </div>
        <SingLadder ref={ladder} scale={scale} low={low} high={high} target={target} landed={landed} height={runHeight()} />
        <div className="run__bottom">
          <button type="button" className="btn btn--block" onClick={replay}>
            <IconReplay size={18} /> Hear the note again
          </button>
          <p className="fine">
            The timer pauses while a <Term id="reference">reference note</Term> plays.
          </p>
        </div>
      </div>
    );
  }

  if (phase.kind === 'free') {
    const v = view.voice;
    const nearest = v === null ? null : Math.round(v);
    const cents = v === null || nearest === null ? 0 : Math.round((v - nearest) * 100);
    const inScale = nearest !== null && scale.degrees.some((d) => d.pc === mod12(nearest));
    return (
      <div className="screen run">
        <div className="run__top">
          <p className="run__timer serif">{nearest === null ? '—' : <NoteName name={midiName(nearest).replace(/-?\d+$/, '')} />}</p>
          <p className="run__count fine">{nearest === null ? 'Sing any note' : `${Math.abs(cents) <= 15 ? 'Right on' : cents > 0 ? `${cents} cents high` : `${-cents} cents low`}`}</p>
          <button type="button" className="btn btn--small" onClick={() => setPhase({ kind: 'setup' })}>
            <IconClose size={18} /> Done
          </button>
        </div>
        <p className="small" aria-live="polite">
          {voiceState.status !== 'live'
            ? 'Starting the microphone…'
            : nearest === null
              ? `Sing and watch your voice move across the ${scale.title} ladder.`
              : inScale
                ? `That note is in ${scale.title}.`
                : `That note is not in ${scale.title}; it falls between two rungs.`}
        </p>
        <SingLadder ref={ladder} scale={scale} low={homeMidi - 3} high={homeMidi + 15} target={null} height={runHeight() + 40} />
      </div>
    );
  }

  if (phase.kind === 'range') {
    const v = view.voice;
    return (
      <div className="screen">
        <h1 className="h1">{phase.step === 'low' ? 'Your lowest note' : 'Your highest note'}</h1>
        <p className="lede" style={{ marginTop: 8 }}>
          {phase.step === 'low'
            ? 'Slide down to the lowest note you can sing comfortably, without straining, and hold it steady.'
            : 'Now slide up to the highest note you can sing comfortably and hold it steady.'}
        </p>
        <div className="rangebox" aria-live="polite">
          <p className="rangebox__note serif">{v === null ? '…' : <NoteName name={midiName(Math.round(v))} octave />}</p>
          <span className="rangebox__bar" aria-hidden="true">
            <span style={{ transform: `scaleX(${view.progress})` }} />
          </span>
          <p className="small">{voiceState.status !== 'live' ? 'Starting the microphone…' : v === null ? 'Waiting for your voice' : 'Hold it…'}</p>
        </div>
        {phase.low !== undefined && (
          <p className="small">
            Lowest note: <strong className="serif">{<NoteName name={midiName(phase.low)} octave />}</strong>
          </p>
        )}
        <button type="button" className="btn" style={{ marginTop: 24 }} onClick={() => setPhase({ kind: 'setup' })}>
          Cancel
        </button>
      </div>
    );
  }

  if (phase.kind === 'done') {
    const { record, prevBest } = phase;
    const isBest = !prevBest || record.totalMs < prevBest.totalMs;
    const slowest = record.notes.reduce((a, b) => (b.ms > a.ms ? b : a), record.notes[0]);
    const slowIdx = record.notes.indexOf(slowest);
    const before = slowIdx > 0 ? record.notes[slowIdx - 1].target : null;
    const avg = Math.round(record.notes.reduce((s, n) => s + n.avgCents, 0) / Math.max(1, record.notes.length));
    return (
      <div className="screen">
        <section className="done" aria-labelledby="done-h">
          <h1 className="sr-only" id="done-h">
            Run finished
          </h1>
          <p className="done__time display num">{formatTime(record.totalMs)}</p>
          <p className={`done__verdict${isBest ? ' is-best' : ''}`}>
            {isBest
              ? prevBest
                ? `New best, ${((prevBest.totalMs - record.totalMs) / 1000).toFixed(1)} s faster than before.`
                : 'Your first time on this scale. That is the time to beat.'
              : `${((record.totalMs - prevBest!.totalMs) / 1000).toFixed(1)} s off your best (${formatTime(prevBest!.totalMs)}).`}
          </p>
          <p className="small">
            {record.title}. On average you were {avg} <Term id="cents">cents</Term> from each note while holding it
            {avg <= 15 ? ', which is very accurate.' : avg <= 30 ? ', which is good.' : '. Aim for steadier, centered notes next time.'}
          </p>
          {slowest && before !== null && (
            <p className="notice" style={{ marginTop: 16 }}>
              <span>
                Slowest note:{' '}
                <strong className="serif">
                  <NoteName name={spellMidiInScale(slowest.target, names).replace(/-?\d+$/, '')} />
                </strong>{' '}
                ({(slowest.ms / 1000).toFixed(1)} s). The step into it from{' '}
                <span className="serif">
                  <NoteName name={spellMidiInScale(before, names).replace(/-?\d+$/, '')} />
                </span>{' '}
                is a {describeGap(Math.abs(slowest.target - before))}. Practice that step slowly a few times.
              </span>
            </p>
          )}
          <div className="row wrap" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn--go btn--big" onClick={start}>
              Run it again
            </button>
            <button type="button" className="btn btn--big" onClick={() => setPhase({ kind: 'setup' })}>
              Change settings
            </button>
          </div>
        </section>
        <section className="section" aria-labelledby="notes-h">
          <h2 className="h2" id="notes-h">
            Note by note
          </h2>
          <ol className="notelist">
            {record.notes.map((n, i) => (
              <li key={i}>
                <IconCheck size={18} />
                <span className="serif notelist__name">
                  <NoteName name={spellMidiInScale(n.target, names)} octave />
                </span>
                <span className="num">{(n.ms / 1000).toFixed(1)} s</span>
                <span className="fine num">{n.avgCents} cents off</span>
                {n.octaveSlip && <span className="fine">octave slip</span>}
              </li>
            ))}
          </ol>
          <button type="button" className="btn btn--quiet" style={{ marginTop: 12 }} onClick={() => go('progress')}>
            See all your best times
          </button>
        </section>
      </div>
    );
  }

  // Setup
  const type = scaleType(choice.scaleId);
  return (
    <div className="screen">
      <section aria-labelledby="sing-h">
        <h1 className="h1" id="sing-h">
          Sing a scale
        </h1>
        <p className="lede">Sing one note at a time. The app shows where your voice is on the ladder and times your run.</p>
      </section>

      <div className="singsetup">
        <div className="singsetup__scale">
          <p className="display singsetup__title">
            <NoteName name={scale.tonic} /> <span className="scale-hero__type">{type.name.toLowerCase()}</span>
          </p>
          <p className="small">
            {targets.length} notes:{' '}
            {targets.map((m, i) => (
              <span key={i} className="serif">
                {i > 0 && ' '}
                <NoteName name={spellMidiInScale(m, names).replace(/-?\d+$/, '')} />
              </span>
            ))}
          </p>
          <button type="button" className="btn btn--small" style={{ marginTop: 12 }} onClick={() => go('scales')}>
            Choose another scale
          </button>
        </div>

        <div className="singsetup__opts stack-lg">
          <div>
            <p className="label">Start on</p>
            <div className="row">
              <button type="button" className="btn btn--small" aria-label="One octave lower" onClick={() => setSing({ octaveShift: sing.octaveShift - 1 })} disabled={homeMidi - 12 < 36}>
                <IconDown size={18} />
              </button>
              <span className="startnote serif">
                <NoteName name={spellMidiInScale(homeMidi, names)} octave />
              </span>
              <button type="button" className="btn btn--small" aria-label="One octave higher" onClick={() => setSing({ octaveShift: sing.octaveShift + 1 })} disabled={homeMidi + 12 > 84}>
                <IconUp size={18} />
              </button>
            </div>
            <p className="fine" style={{ marginTop: 6 }}>
              {range ? (
                <>
                  Your <Term id="range">range</Term>: <NoteName name={midiName(range.low)} octave /> to <NoteName name={midiName(range.high)} octave />.{' '}
                  {describeRange(range)}{' '}
                </>
              ) : (
                <>Not sure which octave? </>
              )}
              <button type="button" className="linkish" onClick={() => setPhase({ kind: 'range', step: 'low' })}>
                {range ? 'Measure again' : 'Find my range'}
              </button>
            </p>
          </div>

          <div>
            <p className="label" id="dir-label">
              Direction
            </p>
            <div className="seg seg--full" role="group" aria-labelledby="dir-label">
              {(Object.keys(DIRECTIONS) as Direction[]).map((d) => (
                <button key={d} type="button" aria-pressed={sing.direction === d} onClick={() => setSing({ direction: d })}>
                  {DIRECTIONS[d]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label" id="tol-label">
              How close counts as <Term id="inTune">in tune</Term>
            </p>
            <div className="seg seg--full" role="group" aria-labelledby="tol-label">
              {(Object.keys(TOLERANCES) as Tolerance[]).map((t) => (
                <button key={t} type="button" aria-pressed={sing.tolerance === t} onClick={() => setSing({ tolerance: t })}>
                  {TOLERANCES[t].label}
                </button>
              ))}
            </div>
            <p className="fine" style={{ marginTop: 6 }}>
              {tol.plain}.
            </p>
          </div>

          <label className="toggle">
            <input type="checkbox" checked={sing.helper} onChange={(e) => setSing({ helper: e.target.checked })} />
            <span>
              <span className="h3">Play each note before I sing it</span>
              <span className="fine" style={{ display: 'block' }}>
                Turn off to test yourself; you will still hear the first note. Best times are kept separately.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="singstart">
        <p className="small num">
          {best ? (
            <>
              Best time for this: <strong className="serif">{formatTime(best.totalMs)}</strong>
            </>
          ) : (
            'No runs yet for these settings.'
          )}
        </p>
        <button type="button" className="btn btn--go btn--big btn--block" onClick={start}>
          Start timed run
        </button>
        <button type="button" className="btn btn--block" onClick={() => setPhase({ kind: 'free' })}>
          Just sing, no timer
        </button>
        <p className="fine">Headphones help you hear the reference notes clearly. The microphone is only used while you sing and nothing is recorded or sent anywhere.</p>
      </div>
    </div>
  );
}

/** Fit the whole run (timer, target, ladder, replay button) on one phone screen. */
function runHeight(): number {
  const h = typeof window !== 'undefined' ? window.innerHeight : 800;
  return Math.max(280, Math.min(620, h - 400));
}
