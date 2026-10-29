import { useMemo } from 'react';
import { diatonicTriads } from '../theory/chords';
import { keyFromPc, keyLabel, neighborKeys, type MusicKey } from '../theory/keys';
import { pitchClass, spellMidiInScale } from '../theory/notes';
import { buildScale, describeGap, SCALE_TYPES, scaleType, type ScaleId } from '../theory/scales';
import { useApp } from '../state/store';
import { Fretboard } from './Fretboard';
import { IconPlay } from './icons';
import { Ladder, useLadderPointer } from './Ladder';
import { ChordName, NoteName } from './NoteName';
import { go } from './router';
import { Staff } from './Staff';
import { Term } from './Term';
import { usePlayer } from './usePlayer';

const MAJORISH = new Set<ScaleId>(['major', 'major-pentatonic', 'lydian', 'mixolydian', 'chromatic']);
const FAMILY_LABEL = { everyday: 'Everyday', 'five-note': 'Five-note', mode: 'Modes', color: 'Color' } as const;

const ROLE_WORD = { home: 'Home', away: 'Away', tension: 'Tension', borrowed: 'Borrowed', secondary: 'Leading', outside: 'Outside' } as const;

export function ScalesScreen() {
  const { scale: choice, setScale } = useApp();
  const play = usePlayer();
  const pointer = useLadderPointer();
  const scale = useMemo(() => buildScale(choice.tonic, choice.scaleId), [choice]);
  const type = scaleType(choice.scaleId);
  const isKey = choice.scaleId === 'major' || choice.scaleId === 'minor';
  const key: MusicKey | null = isKey ? { tonic: choice.tonic, mode: choice.scaleId === 'major' ? 'major' : 'minor' } : null;
  const tonicPc = pitchClass(choice.tonic);
  const homeMidi = 48 + tonicPc;
  const run = [...scale.degrees.map((d) => homeMidi + d.semitones), homeMidi + 12];
  const staffBase = 60 + tonicPc;
  const scaleNames = scale.degrees.map((d) => d.note);
  const staffNotes = [...scale.degrees.map((d) => staffBase + d.semitones), staffBase + 12].map((m) => spellMidiInScale(m, scaleNames));
  const neighbors = key ? neighborKeys(key) : null;
  const pickTonic = (pc: number) => setScale({ tonic: keyFromPc(pc, MAJORISH.has(choice.scaleId) ? 'major' : 'minor').tonic, scaleId: choice.scaleId });
  const triads = key ? diatonicTriads(key) : [];
  const gaps = scale.degrees.map((d) => d.gapUp);

  return (
    <div className="screen">
      <section aria-labelledby="scales-h">
        <h1 className="h1" id="scales-h">
          Scales
        </h1>
        <p className="lede">Pick a home note and a scale. See it, hear it, find it on your guitar, then sing it.</p>

        <div className="picker">
          <p className="label" id="tonic-label">
            <Term id="home">Home note</Term>
          </p>
          <div className="keygrid" role="group" aria-labelledby="tonic-label">
            {Array.from({ length: 12 }, (_, pc) => {
              const name = keyFromPc(pc, MAJORISH.has(choice.scaleId) ? 'major' : 'minor').tonic;
              return (
                <button key={pc} type="button" className="chip chip--note" aria-pressed={pc === tonicPc} onClick={() => pickTonic(pc)}>
                  <NoteName name={name} />
                </button>
              );
            })}
          </div>

          <p className="label" id="type-label" style={{ marginTop: 20 }}>
            <Term id="scale">Scale</Term>
          </p>
          <div className="chips" role="group" aria-labelledby="type-label">
            {SCALE_TYPES.map((t, i) => (
              <span key={t.id} className="chips__item">
                {(i === 0 || SCALE_TYPES[i - 1].family !== t.family) && <span className="chips__family fine">{FAMILY_LABEL[t.family]}</span>}
                <button
                  type="button"
                  className="chip"
                  aria-pressed={t.id === choice.scaleId}
                  onClick={() => setScale({ tonic: keyFromPc(tonicPc, MAJORISH.has(t.id) ? 'major' : 'minor').tonic, scaleId: t.id })}
                >
                  {t.name}
                </button>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="scale-hero" aria-labelledby="scale-title">
        <div className="scale-hero__text">
          <h2 className="display scale-hero__title" id="scale-title">
            <NoteName name={scale.tonic} /> <span className="scale-hero__type">{type.name.toLowerCase()}</span>
          </h2>
          <p className="lede">{type.plain}</p>
          <p className="small">
            {scale.degrees.length} notes:{' '}
            {scale.degrees.map((d, i) => (
              <span key={d.note} className="serif">
                {i > 0 && ' · '}
                <NoteName name={d.note} />
              </span>
            ))}
            . Steps between them: {gaps.map((g) => (g === 1 ? 'H' : g === 2 ? 'W' : `${g}`)).join(' ')} (H = <Term id="halfStep">half step</Term>, W ={' '}
            <Term id="wholeStep">whole step</Term>).
          </p>
          <div className="row wrap" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn--go btn--big" onClick={() => go('sing')}>
              Sing this scale
            </button>
            <button
              type="button"
              className="btn btn--big"
              onClick={() => {
                const upDown = [...run, ...[...run].reverse().slice(1)];
                pointer.run(upDown, 420);
                void play.scale(upDown);
              }}
            >
              <IconPlay size={18} /> Play it
            </button>
          </div>
        </div>

        <div className="scale-hero__ladder">
          <Ladder
            scale={scale}
            homeMidi={homeMidi}
            semitone={30}
            onPlay={(m) => {
              pointer.point(m);
              void play.note(m);
            }}
            active={pointer.active}
            animateKey={`${choice.tonic}-${choice.scaleId}`}
            left={
              neighbors
                ? {
                    label: <span aria-label={`Switch to ${keyLabel(neighbors.down)}`}>{shortKey(neighbors.down)}</span>,
                    scale: buildScale(neighbors.down.tonic, choice.scaleId),
                    onPick: () => setScale({ tonic: neighbors.down.tonic, scaleId: choice.scaleId }),
                  }
                : undefined
            }
            right={
              neighbors
                ? {
                    label: <span aria-label={`Switch to ${keyLabel(neighbors.up)}`}>{shortKey(neighbors.up)}</span>,
                    scale: buildScale(neighbors.up.tonic, choice.scaleId),
                    onPick: () => setScale({ tonic: neighbors.up.tonic, scaleId: choice.scaleId }),
                  }
                : undefined
            }
            caption={
              neighbors ? (
                <>
                  The pale columns are the two closest keys. Each differs from this one by a single note, marked in yellow. Tap a key name to move to
                  it.
                </>
              ) : (
                <>Tap a rung to hear its note.</>
              )
            }
          />
        </div>
      </section>

      <section className="section" aria-labelledby="neck-h">
        <h2 className="h2" id="neck-h">
          On your guitar
        </h2>
        <p className="small section__intro">
          Every place this scale lives on the first 15 frets, in standard tuning. Blue dots are the home note. Tap a dot to hear it.
        </p>
        <Fretboard scale={scale} onPlay={play.note} />
      </section>

      <section className="section" aria-labelledby="staff-h">
        <h2 className="h2" id="staff-h">
          On the staff
        </h2>
        <p className="small section__intro">
          The same scale in sheet music, with each <Term id="sharpFlat">sharp or flat</Term> written in.
          {key && (
            <>
              {' '}
              In {keyLabel(key)} these come from the <Term id="keySignature">key signature</Term>.
            </>
          )}
        </p>
        <div className="staff-wrap">
          <Staff notes={staffNotes} label={`${scale.title} written on a treble staff: ${staffNotes.join(', ')}`} />
          <ol className="staff-names" aria-hidden="true">
            {staffNotes.map((n, i) => (
              <li key={i} className="serif">
                <NoteName name={n.replace(/-?\d+$/, '')} />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {key && (
        <section className="section" aria-labelledby="key-chords-h">
          <h2 className="h2" id="key-chords-h">
            Chords in {keyLabel(key)}
          </h2>
          <p className="small section__intro">
            Build a chord on each note of the scale and you get the seven chords of the key. <Term id="numerals">Roman numerals</Term> number them.
          </p>
          <ol className="diatonic">
            {triads.map((c) => (
              <li key={c.step} className={`diatonic__item role role--${c.role}`}>
                <button type="button" className="diatonic__btn" onClick={() => play.chord(c.chord)}>
                  <span className="diatonic__numeral serif">{c.numeral.text}</span>
                  <span className="diatonic__chord serif">
                    <ChordName symbol={c.chord.symbol} />
                  </span>
                  <span className="role-label">{ROLE_WORD[c.role]}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="section" aria-labelledby="steps-h">
        <h2 className="h2" id="steps-h">
          Step by step
        </h2>
        <ol className="steps">
          {scale.degrees.map((d, i) => (
            <li key={d.note}>
              <span className="steps__n num">{i + 1}</span>
              <span className="serif steps__note">
                <NoteName name={d.note} />
              </span>
              <span className="solfa steps__solfa">{d.solfa}</span>
              <span className="small">then up a {describeGap(d.gapUp)}</span>
            </li>
          ))}
        </ol>
        <p className="fine" style={{ marginTop: 12 }}>
          The italic names are <Term id="solfege">do-re-mi syllables</Term>, which singers use to feel each step.
        </p>
      </section>
    </div>
  );
}

function shortKey(k: MusicKey) {
  return (
    <>
      <NoteName name={k.tonic} />
      {k.mode === 'minor' ? 'm' : ''}
    </>
  );
}
