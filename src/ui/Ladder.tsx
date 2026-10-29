import type { CSSProperties, ReactNode } from 'react';
import { mod12 } from '../theory/notes';
import type { BuiltScale } from '../theory/scales';
import { NoteName, spokenNote } from './NoteName';

export interface SideKey {
  label: ReactNode;
  scale: BuiltScale;
  onPick?: () => void;
}

interface LadderProps {
  scale: BuiltScale;
  /** MIDI number of the home note at the bottom rung. */
  homeMidi: number;
  span?: number;
  /** Pixels per half step. */
  semitone?: number;
  /** Content shown at the far right of a rung, keyed by pitch class. */
  marks?: Partial<Record<number, ReactNode>>;
  onPlay?: (midi: number) => void;
  showGaps?: boolean;
  left?: SideKey;
  right?: SideKey;
  /** Changing this replays the unrolling animation. */
  animateKey?: string;
  caption?: ReactNode;
}

interface Rung {
  midi: number;
  pc: number;
  note: string;
  solfa: string;
  step: number;
  home: boolean;
  y: number;
}

export function rungsFor(scale: BuiltScale, homeMidi: number, span: number, top: number, semitone: number): Rung[] {
  const rungs: Rung[] = [];
  for (let midi = homeMidi; midi <= homeMidi + span; midi++) {
    const d = scale.degrees.find((x) => x.pc === mod12(midi));
    if (!d) continue;
    rungs.push({
      midi,
      pc: d.pc,
      note: d.note,
      solfa: d.solfa,
      step: d.step,
      home: d.step === 1,
      y: top + (homeMidi + span - midi) * semitone,
    });
  }
  return rungs;
}

const GAP_WORDS: Record<number, string> = { 1: '1 fret', 2: '2 frets', 3: '3 frets', 4: '4 frets' };
const SIDE_W = 34;
const GUTTER = 50;
const COL_W = 74;
const JOIN = 4;

/** The Modulator: a scale as a ladder whose rung spacing is the real distance between notes. */
export function Ladder({ scale, homeMidi, span = 12, semitone = 30, marks, onPlay, showGaps = true, left, right, animateKey, caption }: LadderProps) {
  const pad = 22;
  const height = span * semitone + pad * 2;
  const rungs = rungsFor(scale, homeMidi, span, pad, semitone);
  const leftX = 0;
  const gutterX = left ? SIDE_W + JOIN : 0;
  const colX = gutterX + (showGaps ? GUTTER : 0);
  const rightX = colX + COL_W + JOIN;
  const labelX = right ? rightX + SIDE_W + 12 : colX + COL_W + 12;
  const style = {
    '--ladder-h': `${height}px`,
    '--col-x': `${colX}px`,
    '--col-w': `${COL_W}px`,
    '--gutter-x': `${gutterX}px`,
    '--label-x': `${labelX}px`,
  } as CSSProperties;

  return (
    <figure className="ladder" style={style} key={animateKey} aria-label={`${scale.title}: ${scale.degrees.map((d) => spokenNote(d.note)).join(', ')}`}>
      <div className="ladder__chart">
        <svg className="ladder__svg" width="100%" height={height} aria-hidden="true">
          {left && <SideColumn x={leftX} scale={left.scale} homeMidi={homeMidi} span={span} pad={pad} semitone={semitone} main={scale} />}
          {right && <SideColumn x={rightX} scale={right.scale} homeMidi={homeMidi} span={span} pad={pad} semitone={semitone} main={scale} />}
          <rect x={colX} y={0} width={COL_W} height={height} className="ladder__col" />
          {Array.from({ length: span + 1 }, (_, i) => homeMidi + i)
            .filter((m) => !rungs.some((r) => r.midi === m))
            .map((m) => {
              const y = pad + (homeMidi + span - m) * semitone;
              return <line key={m} x1={colX + COL_W - 9} x2={colX + COL_W} y1={y} y2={y} className="ladder__tick" />;
            })}
          {rungs.map((r) => (
            <g key={r.midi}>
              <line x1={colX} x2={colX + COL_W} y1={r.y} y2={r.y} className={r.home ? 'ladder__rung ladder__rung--home' : 'ladder__rung'} />
              <line x1={labelX - 6} x2="100%" y1={r.y} y2={r.y} className="ladder__lead" />
            </g>
          ))}
        </svg>

        {rungs.map((r) => (
          <div key={r.midi} className={`ladder__row${r.home ? ' is-home' : ''}`} style={{ top: r.y }}>
            <span className="ladder__solfa solfa">{r.solfa}</span>
            <span className="ladder__label">
              <span className="ladder__note serif">
                <NoteName name={r.note} />
              </span>
              <span className="ladder__step">{r.home ? 'home' : `note ${r.step}`}</span>
            </span>
            {marks?.[r.pc] !== undefined && <span className="ladder__mark">{marks[r.pc]}</span>}
            {onPlay && (
              <button
                type="button"
                className="ladder__hit"
                onClick={() => onPlay(r.midi)}
                aria-label={`Play ${spokenNote(r.note)}, ${r.solfa}`}
              />
            )}
          </div>
        ))}

        {showGaps &&
          rungs.slice(0, -1).map((r, i) => {
            const upper = rungs[i + 1];
            const gap = upper.midi - r.midi;
            return (
              <span key={r.midi} className={`ladder__gap${gap === 1 ? ' is-half' : ''}`} style={{ top: (r.y + upper.y) / 2 }}>
                {GAP_WORDS[gap] ?? `${gap} frets`}
              </span>
            );
          })}

        {left && (
          <button type="button" className="ladder__side-label" style={{ left: leftX, width: SIDE_W }} onClick={left.onPick}>
            {left.label}
          </button>
        )}
        {right && (
          <button type="button" className="ladder__side-label" style={{ left: rightX, width: SIDE_W }} onClick={right.onPick}>
            {right.label}
          </button>
        )}
      </div>
      {caption && <figcaption className="ladder__caption">{caption}</figcaption>}
    </figure>
  );
}

function SideColumn({
  x,
  scale,
  main,
  homeMidi,
  span,
  pad,
  semitone,
}: {
  x: number;
  scale: BuiltScale;
  main: BuiltScale;
  homeMidi: number;
  span: number;
  pad: number;
  semitone: number;
}) {
  const mainPcs = new Set(main.degrees.map((d) => d.pc));
  const marks: { y: number; changed: boolean; home: boolean }[] = [];
  for (let m = homeMidi - 1; m <= homeMidi + span + 1; m++) {
    const d = scale.degrees.find((s) => s.pc === mod12(m));
    if (!d) continue;
    const y = pad + (homeMidi + span - m) * semitone;
    if (y < 2 || y > span * semitone + pad * 2 - 2) continue;
    marks.push({ y, changed: !mainPcs.has(d.pc), home: d.step === 1 });
  }
  return (
    <g>
      <rect x={x} y={0} width={SIDE_W} height={span * semitone + pad * 2} className="ladder__side" />
      {marks.map((mk) => (
        <g key={mk.y}>
          <line x1={x} x2={x + SIDE_W} y1={mk.y} y2={mk.y} className={mk.home ? 'ladder__side-rung is-home' : 'ladder__side-rung'} />
          {mk.changed && <rect x={x + 4} y={mk.y - 5} width={SIDE_W - 8} height={10} className="ladder__changed" />}
        </g>
      ))}
    </g>
  );
}
