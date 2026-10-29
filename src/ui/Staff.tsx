import { flat, gClef, fClef, natural, noteWhole, sharp } from './glyphs';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

interface Props {
  /** Notes with octave, e.g. ["G4", "A4", "B4", "C5"]. */
  notes: string[];
  clef?: 'treble' | 'bass';
  /** Pixels per staff space. */
  space?: number;
  activeIndex?: number;
  label: string;
}

function diatonicIndex(note: string): { pos: number; acc: string } {
  const m = /^([A-G])(##|bb|#|b)?(-?\d+)$/.exec(note);
  if (!m) throw new Error(`Bad note ${note}`);
  return { pos: Number(m[3]) * 7 + LETTERS.indexOf(m[1]), acc: m[2] ?? '' };
}

/** Sheet-music view of a scale, each note written with its own sharp or flat. */
export function Staff({ notes, clef = 'treble', space = 9, activeIndex, label }: Props) {
  // Position of the top staff line: F5 (treble) or A3 (bass).
  const topPos = clef === 'treble' ? 5 * 7 + 3 : 3 * 7 + 5;
  const parsed = notes.map(diatonicIndex);
  const minPos = Math.min(...parsed.map((p) => p.pos), topPos - 8);
  const maxPos = Math.max(...parsed.map((p) => p.pos), topPos);
  const above = Math.max(0, (maxPos - topPos) / 2) + 2.2;
  const below = Math.max(0, (topPos - 8 - minPos) / 2) + 2.2;
  const h = (4 + above + below) * space;
  const yOfPos = (pos: number) => (above + (topPos - pos) / 2) * space;
  const clefW = 3.6 * space;
  const step = 3.4 * space;
  const w = clefW + space * 1.2 + parsed.length * step;

  const clefGlyph = clef === 'treble' ? gClef : fClef;
  const clefY = clef === 'treble' ? yOfPos(topPos - 6) : yOfPos(topPos - 2);

  return (
    <svg className="staff" width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      {Array.from({ length: 5 }, (_, i) => (
        <line key={i} x1={0} x2={w} y1={(above + i) * space} y2={(above + i) * space} className="staff__line" />
      ))}
      <path d={clefGlyph.d} transform={`translate(${space * 0.5} ${clefY}) scale(${space})`} className="staff__glyph" />
      {parsed.map((p, i) => {
        const x = clefW + space * 1.6 + i * step;
        const y = yOfPos(p.pos);
        const ledgers: number[] = [];
        for (let lp = topPos + 2; lp <= p.pos; lp += 2) ledgers.push(lp);
        for (let lp = topPos - 10; lp >= p.pos; lp -= 2) ledgers.push(lp);
        const acc = p.acc === '#' ? sharp : p.acc === 'b' ? flat : p.acc === 'n' ? natural : null;
        const cls = i === activeIndex ? 'staff__note is-active' : 'staff__note';
        return (
          <g key={i} className={cls}>
            {ledgers.map((lp) => (
              <line key={lp} x1={x - space * 0.45} x2={x + space * 2.15} y1={yOfPos(lp)} y2={yOfPos(lp)} className="staff__line" />
            ))}
            {acc && <path d={acc.d} transform={`translate(${x - space * 1.25} ${y}) scale(${space})`} className="staff__glyph" />}
            <path d={noteWhole.d} transform={`translate(${x} ${y}) scale(${space})`} className="staff__glyph" />
          </g>
        );
      })}
    </svg>
  );
}
