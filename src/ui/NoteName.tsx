import { flat, natural, sharp, type Glyph } from './glyphs';

const ACCIDENTALS: Record<string, Glyph> = { '#': sharp, b: flat, n: natural };

/** An engraved accidental (♯ ♭ ♮) that sits correctly beside display type. */
export function Accidental({ kind, size = 0.82 }: { kind: '#' | 'b' | 'n'; size?: number }) {
  const g = ACCIDENTALS[kind];
  const [x1, y1, x2, y2] = g.bbox;
  const w = x2 - x1;
  const h = y2 - y1;
  return (
    <svg
      className="accidental"
      viewBox={`${x1 - 0.08} ${y1} ${w + 0.16} ${h}`}
      style={{ height: `${size}em`, width: `${(size * (w + 0.16)) / h}em`, verticalAlign: kind === 'b' ? '-0.02em' : '-0.12em' }}
      aria-hidden="true"
      focusable="false"
    >
      <path d={g.d} fill="currentColor" />
    </svg>
  );
}

const SPOKEN: Record<string, string> = { '#': ' sharp', b: ' flat', '##': ' double sharp', bb: ' double flat' };

/** Plain words a screen reader can say for a note: "F#4" -> "F sharp 4". */
export function spokenNote(name: string): string {
  const m = /^([A-G])(##|bb|#|b)?(-?\d+)?$/.exec(name.replace('♯', '#').replace('♭', 'b'));
  if (!m) return name;
  return `${m[1]}${m[2] ? SPOKEN[m[2]] : ''}${m[3] ? ` ${m[3]}` : ''}`;
}

/** "F#" renders as F with an engraved sharp; screen readers hear "F sharp". */
export function NoteName({ name, octave }: { name: string; octave?: number | boolean }) {
  const m = /^([A-G])(##|bb|#|b)?(-?\d+)?$/.exec(name.replace('♯', '#').replace('♭', 'b'));
  if (!m) return <>{name}</>;
  const [, letter, acc, oct] = m;
  const showOctave = octave === true ? oct : typeof octave === 'number' ? String(octave) : undefined;
  return (
    <span className="notename">
      <span className="sr-only">
        {letter}
        {acc ? SPOKEN[acc] : ''}
        {showOctave ? ` ${showOctave}` : ''}
      </span>
      <span aria-hidden="true">
        {letter}
        {acc === '#' && <Accidental kind="#" />}
        {acc === 'b' && <Accidental kind="b" />}
        {acc === '##' && (
          <>
            <Accidental kind="#" />
            <Accidental kind="#" />
          </>
        )}
        {acc === 'bb' && (
          <>
            <Accidental kind="b" />
            <Accidental kind="b" />
          </>
        )}
        {showOctave && <sub className="octave">{showOctave}</sub>}
      </span>
    </span>
  );
}

function spokenQuality(q: string): string {
  if (!q) return '';
  const words: [RegExp, string][] = [
    [/^m7b5/, ' half-diminished seventh'],
    [/^maj7/, ' major seventh'],
    [/^m7/, ' minor seventh'],
    [/^m(?!aj)/, ' minor'],
    [/^dim7?/, ' diminished'],
    [/^aug/, ' augmented'],
    [/^sus2/, ' sus 2'],
    [/^sus4?/, ' sus 4'],
    [/^add9/, ' add 9'],
    [/^7/, ' seventh'],
    [/^5/, ' power chord'],
  ];
  for (const [re, w] of words) if (re.test(q)) return w;
  return ` ${q}`;
}

/** A chord symbol such as "F#m7" or "Bb/D" with engraved accidentals. */
export function ChordName({ symbol }: { symbol: string }) {
  const s = symbol.replace('♯', '#').replace('♭', 'b');
  const m = /^([A-G](?:#|b)?)([^/]*)(?:\/([A-G](?:#|b)?))?$/.exec(s);
  if (!m) return <>{symbol}</>;
  const [, root, quality, bass] = m;
  return (
    <span className="chordname">
      <span className="sr-only">
        {spokenNote(root)}
        {spokenQuality(quality)}
        {bass ? ` over ${spokenNote(bass)}` : ''}
      </span>
      <span aria-hidden="true">
        <span>
          {root[0]}
          {root[1] === '#' && <Accidental kind="#" />}
          {root[1] === 'b' && <Accidental kind="b" />}
        </span>
        {quality && <span className="chordname__q">{quality}</span>}
        {bass && (
          <>
            /{bass[0]}
            {bass[1] === '#' && <Accidental kind="#" />}
            {bass[1] === 'b' && <Accidental kind="b" />}
          </>
        )}
      </span>
    </span>
  );
}
