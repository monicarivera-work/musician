import type { ChordShape } from '../theory/guitar';

const W = 78;
const H = 100;
const LEFT = 14;
const TOP = 22;
const GAP_X = 10;
const GAP_Y = 15;
const ROWS = 5;

/** A songbook chord box: strings run top to bottom, low E on the left. */
export function ChordBox({ shape, label }: { shape: ChordShape; label: string }) {
  const played = shape.frets.filter((f): f is number => f !== null && f > 0);
  const maxFret = played.length ? Math.max(...played) : 0;
  const minFret = played.length ? Math.min(...played) : 0;
  const base = maxFret <= ROWS ? 1 : (shape.barre?.fret ?? minFret);
  const xOf = (s: number) => LEFT + s * GAP_X;
  const yOf = (f: number) => TOP + (f - base + 0.5) * GAP_Y;
  const describe = shape.frets
    .map((f, i) => `${['low E', 'A', 'D', 'G', 'B', 'high E'][i]} ${f === null ? 'muted' : f === 0 ? 'open' : `fret ${f}`}`)
    .join(', ');

  return (
    <svg className="chordbox" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label} chord shape: ${describe}`}>
      {Array.from({ length: ROWS + 1 }, (_, r) => (
        <line
          key={r}
          x1={xOf(0)}
          x2={xOf(5)}
          y1={TOP + r * GAP_Y}
          y2={TOP + r * GAP_Y}
          className={r === 0 && base === 1 ? 'chordbox__nut' : 'chordbox__fret'}
        />
      ))}
      {Array.from({ length: 6 }, (_, s) => (
        <line key={s} x1={xOf(s)} x2={xOf(s)} y1={TOP} y2={TOP + ROWS * GAP_Y} className="chordbox__string" />
      ))}
      {base > 1 && (
        <text x={xOf(5) + 6} y={TOP + GAP_Y * 0.5 + 4} className="chordbox__base">
          {base}
        </text>
      )}
      {shape.frets.map((f, s) =>
        f === null ? (
          <text key={s} x={xOf(s)} y={TOP - 7} textAnchor="middle" className="chordbox__mute">
            ×
          </text>
        ) : f === 0 ? (
          <circle key={s} cx={xOf(s)} cy={TOP - 10} r={3.4} className="chordbox__open" />
        ) : null,
      )}
      {shape.barre && shape.barre.to > shape.barre.from && (
        <rect
          x={xOf(shape.barre.from) - 4.5}
          y={yOf(shape.barre.fret) - 4.5}
          width={xOf(shape.barre.to) - xOf(shape.barre.from) + 9}
          height={9}
          rx={4.5}
          className="chordbox__barre"
        />
      )}
      {shape.frets.map((f, s) =>
        f !== null && f > 0 && !(shape.barre && f === shape.barre.fret && s >= shape.barre.from && s <= shape.barre.to && shape.barre.to > shape.barre.from) ? (
          <circle key={s} cx={xOf(s)} cy={yOf(f)} r={4.6} className="chordbox__dot" />
        ) : null,
      )}
    </svg>
  );
}
