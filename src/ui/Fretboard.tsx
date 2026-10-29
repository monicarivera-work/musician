import { fretboardDots, STANDARD_TUNING } from '../theory/guitar';
import { mod12, pcName } from '../theory/notes';
import type { BuiltScale } from '../theory/scales';

interface Props {
  scale: BuiltScale;
  frets?: number;
  onPlay?: (midi: number) => void;
}

const OPEN_W = 34;
const FRET_W = 48;
const STRING_GAP = 27;
const TOP = 18;
const MARKERS = [3, 5, 7, 9, 15];

/** The scale mapped onto a guitar neck in standard tuning, high E string on top like tab. */
export function Fretboard({ scale, frets = 15, onPlay }: Props) {
  const pcs = scale.degrees.map((d) => d.pc);
  const names = new Map(scale.degrees.map((d) => [d.pc, d.note]));
  const homePc = scale.degrees[0].pc;
  const dots = fretboardDots(pcs, frets);
  const nutX = OPEN_W;
  const width = nutX + frets * FRET_W + 8;
  const height = TOP + STRING_GAP * 5 + 34;
  const yOf = (string: number) => TOP + (5 - string) * STRING_GAP;
  const xOf = (fret: number) => (fret === 0 ? OPEN_W / 2 : nutX + (fret - 0.5) * FRET_W);

  return (
    <div className="fretboard" role="group" aria-label={`${scale.title} on the guitar neck`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect x={nutX} y={TOP - 6} width={frets * FRET_W} height={STRING_GAP * 5 + 12} className="fretboard__wood" />
        {MARKERS.filter((m) => m <= frets).map((m) => (
          <circle key={m} cx={xOf(m)} cy={TOP + STRING_GAP * 2.5} r={5} className="fretboard__inlay" />
        ))}
        {frets >= 12 && (
          <>
            <circle cx={xOf(12)} cy={TOP + STRING_GAP * 1.5} r={5} className="fretboard__inlay" />
            <circle cx={xOf(12)} cy={TOP + STRING_GAP * 3.5} r={5} className="fretboard__inlay" />
          </>
        )}
        {Array.from({ length: frets + 1 }, (_, f) => (
          <line
            key={f}
            x1={nutX + f * FRET_W}
            x2={nutX + f * FRET_W}
            y1={TOP - 6}
            y2={TOP + STRING_GAP * 5 + 6}
            className={f === 0 ? 'fretboard__nut' : 'fretboard__fret'}
          />
        ))}
        {STANDARD_TUNING.map((_, s) => (
          <line key={s} x1={4} x2={width - 4} y1={yOf(s)} y2={yOf(s)} className="fretboard__string" strokeWidth={0.9 + (5 - s) * 0.32} />
        ))}
        {Array.from({ length: frets }, (_, i) => i + 1)
          .filter((f) => MARKERS.includes(f) || f === 12 || f === 1)
          .map((f) => (
            <text key={f} x={xOf(f)} y={height - 8} className="fretboard__num" textAnchor="middle">
              {f}
            </text>
          ))}
        {dots.map((d) => {
          const home = d.pc === homePc;
          const label = (names.get(d.pc) ?? pcName(mod12(d.pc))).replace('#', '♯').replace(/^([A-G])b/, '$1♭');
          return (
            <g
              key={`${d.string}-${d.fret}`}
              className={home ? 'fretboard__dot is-home' : 'fretboard__dot'}
              onClick={onPlay ? () => onPlay(d.midi) : undefined}
            >
              <circle cx={xOf(d.fret)} cy={yOf(d.string)} r={11.5} />
              <text x={xOf(d.fret)} y={yOf(d.string) + 4.5} textAnchor="middle">
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
