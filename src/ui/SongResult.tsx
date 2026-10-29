import { useMemo, useState, type ReactNode } from 'react';
import { parseChord } from '../theory/chords';
import { chordShape } from '../theory/guitar';
import { describeKeySignature, keyFromPc, keyLabel, type Mode, type MusicKey } from '../theory/keys';
import { pitchClass } from '../theory/notes';
import { extractChords } from '../theory/chord-text';
import { estimateKeyFromChords } from '../theory/key-detect';
import { confidenceWords, describeSong, feltTempo, tempoWords, type SongAnalysis } from '../songs/song-analysis';
import { useApp } from '../state/store';
import { ChordBox } from './ChordBox';
import { IconEdit, IconPlay } from './icons';
import { Ladder, useLadderPointer } from './Ladder';
import { ChordName, NoteName } from './NoteName';
import { go } from './router';
import { BottomSheet, Term } from './Term';
import { useNarrow } from './useNarrow';
import { usePlayer } from './usePlayer';

const SOURCE_TAG: Record<SongAnalysis['source'], string> = {
  search: 'Estimated from a 30-second preview',
  listen: 'Estimated from 20 seconds of listening',
  file: 'Estimated from your audio file',
  chords: 'Worked out from the chords you typed',
  example: 'A sample breakdown. Put in your own song above.',
};

const ROLE_WORD = {
  home: 'Home',
  away: 'Away',
  tension: 'Tension',
  borrowed: 'Borrowed',
  secondary: 'Leading',
  outside: 'Outside',
} as const;

export function SongResult({ song }: { song: SongAnalysis }) {
  const { setSong, adoptKey } = useApp();
  const play = usePlayer();
  const pointer = useLadderPointer();
  const narrow = useNarrow();
  const d = useMemo(() => describeSong(song), [song]);
  const [keySheet, setKeySheet] = useState(false);
  const [editing, setEditing] = useState(false);
  const fromAudio = song.source === 'search' || song.source === 'listen' || song.source === 'file';
  const homeMidi = 48 + pitchClass(d.key.tonic);
  const confidence = song.keyOverride ? 1 : song.key.confidence;
  const alts = song.keyOverride ? [] : song.key.alternatives.slice(0, 2);
  const tempo = song.bpm !== undefined ? feltTempo(song.bpm) : null;
  const run = [...d.scale.degrees.map((x) => homeMidi + x.semitones), homeMidi + 12];

  const marks: Partial<Record<number, ReactNode>> = {};
  for (const u of d.uses.slice(0, 10)) {
    const pc = u.chord.rootPc;
    marks[pc] = (
      <>
        {marks[pc]}
        <span className={`mark-chord role role--${u.role}`}>
          <ChordName symbol={u.chord.symbol} />
        </span>
      </>
    );
  }

  const singIt = () => {
    adoptKey(d.key);
    go('sing');
  };

  const setKey = (key: MusicKey) => {
    setSong({ ...song, keyOverride: key });
    setKeySheet(false);
  };

  const playRung = (midi: number) => {
    pointer.point(midi);
    void play.note(midi);
  };

  return (
    <article className="result" aria-labelledby="song-title">
      <header className="result__head">
        {song.artwork ? (
          <img className="result__art" src={song.artwork} alt="" width={72} height={72} />
        ) : (
          <div className="result__art result__art--blank" aria-hidden="true">
            <span className="serif">{song.source === 'chords' || song.source === 'example' ? 'I–V' : '♪'}</span>
          </div>
        )}
        <div className="grow">
          <h2 className="h2" id="song-title">
            {song.title}
          </h2>
          {(song.artist || song.year || song.genre) && (
            <p className="small">{[song.artist, song.year, song.genre].filter(Boolean).join(' · ')}</p>
          )}
          <p className="source-tag">{SOURCE_TAG[song.source]}</p>
        </div>
      </header>

      <div className="keyblock">
        <div className="keyblock__main">
          <p className="display keyblock__key">
            <NoteName name={d.key.tonic} /> {d.key.mode}
          </p>
          <p className="lede keyblock__plain">
            <Term id="key">Key</Term> of the song. Its <Term id="home">home note</Term> is <strong className="serif">
              <NoteName name={d.key.tonic} />
            </strong>
            , and <Term id={d.key.mode}>{d.key.mode}</Term> means it sounds {d.key.mode === 'major' ? 'bright and settled' : 'darker and moodier'}.
          </p>
          <p className="sureline">
            <span>
              <Term id="confidence">How sure</Term>: <strong>{song.keyOverride ? 'Set by you' : confidenceWords(confidence)}</strong>
            </span>
            <span className="meter" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={i < Math.max(1, Math.round(confidence * 5)) ? 'is-on' : ''} />
              ))}
            </span>
            <button type="button" className="linkish" onClick={() => setKeySheet(true)}>
              Change key
            </button>
          </p>
        </div>
        <div className="keyblock__side">
          <button type="button" className="btn btn--go btn--big btn--block" onClick={singIt}>
            Sing this scale
          </button>
          <p className="fine">Practice it with your voice, note by note, and time the run.</p>
        </div>
      </div>

      <div className="result__grid">
        <div className="result__ladder">
          <Ladder
            scale={d.scale}
            homeMidi={homeMidi}
            semitone={narrow ? 20 : 29}
            marks={marks}
            onPlay={playRung}
            active={pointer.active}
            animateKey={`${song.id}-${d.key.tonic}-${d.key.mode}`}
            caption={
              <>
                The <Term id="scale">scale</Term> of {keyLabel(d.key)}. Gaps show <Term id="wholeStep">whole steps</Term> and{' '}
                <Term id="halfStep">half steps</Term>. Colored tags mark the chords this song uses. Tap a rung to hear it.
              </>
            }
          />
          <button
            type="button"
            className="btn btn--quiet"
            onClick={() => {
              pointer.run(run, 420);
              void play.scale(run);
            }}
          >
            <IconPlay size={18} /> Play the scale
          </button>
        </div>

        <dl className="facts result__facts">
          {alts.length > 0 && (
            <div>
              <dt>Other keys</dt>
              <dd>
                {alts.map((a, i) => (
                  <span key={`${a.key.tonic}-${a.key.mode}`} className="value">
                    {i > 0 && <span className="fine"> or </span>}
                    <NoteName name={a.key.tonic} /> {a.key.mode}
                  </span>
                ))}
                <span className="small">
                  {alts[0].key.tonic === d.relative.tonic && alts[0].key.mode === d.relative.mode
                    ? `${keyLabel(alts[0].key)} uses the same notes with a different home. `
                    : ''}
                  If one of these sounds more like home,{' '}
                  <button type="button" className="linkish" onClick={() => setKeySheet(true)}>
                    change the key
                  </button>
                  .
                </span>
              </dd>
            </div>
          )}
          {tempo && (
            <div>
              <dt>
                <Term id="tempo">Tempo</Term>
              </dt>
              <dd>
                <span className="value num">About {tempo.felt} BPM</span>
                <span className="small">
                  {tempoWords(tempo.felt)}.{tempo.other && ` Or ${tempo.other} if you tap ${tempo.other > tempo.felt ? 'twice as fast' : 'at half speed'}.`}
                </span>
              </dd>
            </div>
          )}
          {fromAudio && (
            <div>
              <dt>
                <Term id="meter">Counting</Term>
              </dt>
              <dd>
                <span className="value">Probably in 4</span>
                <span className="small">Most songs count 1-2-3-4. Tap your foot and count along; if 1-2-3 fits better, it has a waltz feel.</span>
              </dd>
            </div>
          )}
          <div>
            <dt>
              <Term id="keySignature">Sharps or flats</Term>
            </dt>
            <dd>
              <span className="value">
                {d.signature.count === 0
                  ? 'None'
                  : d.signature.notes.map((n, i) => (
                      <span key={n}>
                        {i > 0 && ', '}
                        <NoteName name={n} />
                      </span>
                    ))}
              </span>
              <span className="small">{describeKeySignature(d.signature)}</span>
            </dd>
          </div>
          <div>
            <dt>
              <Term id="relative">Relative key</Term>
            </dt>
            <dd>
              <span className="value">
                <NoteName name={d.relative.tonic} /> {d.relative.mode}
              </span>
              <span className="small">Same notes, but home is {d.relative.tonic.replace('#', '♯').replace(/^([A-G])b/, '$1♭')}.</span>
            </dd>
          </div>
          <div>
            <dt>
              <Term id="capo">Guitar</Term>
            </dt>
            <dd>
              {d.playsOpen ? (
                <span className="value">Open chords, no capo</span>
              ) : d.capo.length ? (
                <span className="value">
                  Capo {d.capo[0].capo}, play <NoteName name={d.capo[0].shapesKey.tonic} />
                  {d.capo[0].shapesKey.mode === 'minor' ? 'm' : ''} shapes
                </span>
              ) : (
                <span className="value">Barre chords</span>
              )}
              {d.capo.length > (d.playsOpen ? 0 : 1) && (
                <span className="small">
                  Or{' '}
                  {d.capo
                    .slice(d.playsOpen ? 0 : 1, 3)
                    .map((c) => `capo ${c.capo} with ${c.shapesKey.tonic.replace('#', '♯').replace(/^([A-G])b/, '$1♭')}${c.shapesKey.mode === 'minor' ? 'm' : ''} shapes`)
                    .join(', or ')}
                  .
                </span>
              )}
            </dd>
          </div>
          {song.tuningCents !== undefined && Math.abs(song.tuningCents) >= 15 && (
            <div>
              <dt>
                <Term id="tuning">Tuning</Term>
              </dt>
              <dd>
                <span className="value">
                  {Math.abs(Math.round(song.tuningCents))} <Term id="cents">cents</Term> {song.tuningCents > 0 ? 'sharp' : 'flat'}
                </span>
                <span className="small">The recording sits a little {song.tuningCents > 0 ? 'high' : 'low'}. Tune your guitar to match if you play along.</span>
              </dd>
            </div>
          )}
          {fromAudio && song.analyzedSeconds !== undefined && (
            <div>
              <dt>Listened to</dt>
              <dd>
                <span className="value num">{Math.round(song.analyzedSeconds)} seconds</span>
                <span className="small">Other parts of the song may use different chords.</span>
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="dock">
        <button type="button" className="btn btn--go btn--big btn--block" onClick={singIt}>
          Sing this scale
        </button>
      </div>

      {d.progressions.length > 0 && (
        <section className="section" aria-labelledby="loops-h">
          <div className="section__head">
            <h3 className="h2" id="loops-h">
              {d.progressions.length > 1 ? 'Main chord loops' : 'Main chord loop'}
            </h3>
          </div>
          <p className="small section__intro">
            A <Term id="progression">chord progression</Term> is the order chords come in. The <Term id="numerals">Roman numerals</Term> under each chord
            say which note of the scale it is built on.
          </p>
          <div className="stack">
            {d.progressions.map((p, i) => (
              <div className="loop" key={i}>
                <div className="loop__bars" role="list">
                  <span className="loop__repeat" aria-hidden="true">
                    𝄆
                  </span>
                  {p.chords.map((c, j) => {
                    const parsed = parseChord(c.replace('♯', '#').replace('♭', 'b'));
                    const role = parsed ? d.uses.find((u) => u.chord.symbol === parsed.symbol)?.role ?? 'outside' : 'outside';
                    return (
                      <span key={j} className={`loop__bar role role--${role}`} role="listitem">
                        <span className="loop__chord serif">
                          <ChordName symbol={c} />
                        </span>
                        <span className="loop__numeral serif">{p.numerals[j]}</span>
                      </span>
                    );
                  })}
                  <span className="loop__repeat" aria-hidden="true">
                    𝄇
                  </span>
                </div>
                <div className="loop__info">
                  {p.named ? (
                    <p>
                      <strong>{p.named.name}.</strong> {p.named.plain}
                    </p>
                  ) : (
                    <p>A loop this song comes back to.</p>
                  )}
                  <p className="small">
                    {p.count > 1 ? `Heard ${p.count} times.` : 'Played once through.'}
                    {p.count > 1 && p.coverage < 0.98 && ` Covers about ${Math.round(p.coverage * 100)}% of the chord changes.`}
                  </p>
                  <button
                    type="button"
                    className="btn btn--small"
                    onClick={() => play.loop(p.chords.map((c) => parseChord(c.replace('♯', '#').replace('♭', 'b'))).filter((x) => x !== null))}
                  >
                    <IconPlay size={16} /> Play the loop
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {d.uses.length > 0 && (
        <section className="section" aria-labelledby="chords-h">
          <h3 className="h2" id="chords-h">
            Chords in this song
          </h3>
          <p className="small section__intro">
            Each chord has a job: <Term id="roles">home, away, or tension</Term>. Tap a chord to hear it.
          </p>
          <ul className="songbook">
            {d.uses.map((u) => {
              const shape = chordShape(u.chord);
              return (
                <li key={u.chord.symbol} className={`songbook__item role role--${u.role}`}>
                  <button type="button" className="songbook__btn" onClick={() => play.chord(u.chord)} aria-label={`Play ${u.chord.symbol}`}>
                    <span className="songbook__name serif">
                      <ChordName symbol={u.chord.symbol} />
                    </span>
                    <span className="songbook__numeral serif">{u.numeral.text}</span>
                    {shape && <ChordBox shape={shape} label={u.chord.symbol} />}
                  </button>
                  <span className="role-label">{ROLE_WORD[u.role]}</span>
                  <p className="fine">{u.explain}</p>
                  {fromAudio && <p className="fine num">{Math.round(u.share * 100)}% of the time</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {d.cadences.length > 0 && (
        <section className="section" aria-labelledby="cad-h">
          <h3 className="h2" id="cad-h">
            How phrases end
          </h3>
          <p className="small section__intro">
            A <Term id="cadence">cadence</Term> is a chord move that ends a phrase, like punctuation.
          </p>
          <ul className="plainlist">
            {d.cadences.map((c) => (
              <li key={c.kind}>
                <strong>{c.name}</strong>
                <span className="small num"> · {c.count === 1 ? 'once' : `${c.count} times`}</span>
                <p className="small">{c.plain}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="section" aria-labelledby="dia-h">
        <h3 className="h2" id="dia-h">
          The seven chords of {keyLabel(d.key)}
        </h3>
        <p className="small section__intro">
          These are the chords made only from the key&rsquo;s own notes, <Term id="diatonic">in the key</Term>. Most songs in {keyLabel(d.key)} use
          a handful of them.
        </p>
        <ol className="diatonic">
          {d.diatonic.map((c) => (
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

      <section className="section" aria-labelledby="fix-h">
        <div className="section__head">
          <h3 className="h2" id="fix-h">
            {fromAudio ? 'Know the real chords?' : 'Change the chords'}
          </h3>
        </div>
        {fromAudio && (
          <p className="small section__intro">
            Chords heard from audio are a best guess. If you have the chord sheet, type or paste it here for an exact breakdown.
          </p>
        )}
        {editing ? (
          <ChordEditor song={song} onDone={() => setEditing(false)} />
        ) : (
          <button type="button" className="btn" onClick={() => setEditing(true)}>
            <IconEdit size={18} /> {fromAudio ? 'Type the chords' : 'Edit the chords'}
          </button>
        )}
      </section>

      {keySheet && <KeySheet song={song} onPick={setKey} onClose={() => setKeySheet(false)} />}
    </article>
  );
}

function ChordEditor({ song, onDone }: { song: SongAnalysis; onDone: () => void }) {
  const { setSong } = useApp();
  const d = describeSong(song);
  const [text, setText] = useState(song.chordText ?? d.sequence.join(' ').replace(/♯/g, '#').replace(/♭/g, 'b'));
  const [error, setError] = useState('');
  const apply = () => {
    const chords = extractChords(text);
    if (!chords.length) {
      setError('No chords found. Write chord names like G, Em, or F#m7, separated by spaces.');
      return;
    }
    setSong({ ...song, chords, chordText: text, key: estimateKeyFromChords(chords), keyOverride: undefined });
    onDone();
  };
  return (
    <div className="stack">
      <label className="label" htmlFor="fix-chords">
        Chords, in order
      </label>
      <textarea id="fix-chords" className="field" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} autoCapitalize="none" />
      {error && <p className="error-text">{error}</p>}
      <div className="row wrap">
        <button type="button" className="btn btn--primary" onClick={apply}>
          Update the breakdown
        </button>
        <button type="button" className="btn btn--quiet" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const TONICS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function KeySheet({ song, onPick, onClose }: { song: SongAnalysis; onPick: (k: MusicKey) => void; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>((song.keyOverride ?? song.key.best.key).mode);
  const candidates = [song.key.best, ...song.key.alternatives];
  return (
    <BottomSheet title="Change the key" onClose={onClose}>
      <h2 className="h1">Change the key</h2>
      <p className="small" style={{ marginTop: 8 }}>
        Pick the key that sounds right to you. Everything on this page updates to match.
      </p>
      <h3 className="h3" style={{ marginTop: 20 }}>
        Most likely
      </h3>
      <div className="row wrap" style={{ marginTop: 8 }}>
        {candidates.map((c) => (
          <button key={`${c.key.tonic}-${c.key.mode}`} type="button" className="btn btn--small" onClick={() => onPick(c.key)}>
            <span className="serif">
              <NoteName name={c.key.tonic} /> {c.key.mode}
            </span>
            {!song.keyOverride && <span className="fine num">{Math.round(c.probability * 100)}%</span>}
          </button>
        ))}
      </div>
      <h3 className="h3" style={{ marginTop: 20 }}>
        Any key
      </h3>
      <div className="seg" style={{ marginTop: 8 }}>
        {(['major', 'minor'] as Mode[]).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>
            {m === 'major' ? 'Major' : 'Minor'}
          </button>
        ))}
      </div>
      <div className="keygrid" style={{ marginTop: 12 }}>
        {TONICS.map((pc) => {
          const k = keyFromPc(pc, mode);
          return (
            <button key={pc} type="button" className="chip chip--note" onClick={() => onPick(k)}>
              <NoteName name={k.tonic} />
              {mode === 'minor' ? 'm' : ''}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
