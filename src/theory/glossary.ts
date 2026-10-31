export interface Term {
  term: string;
  /** One short everyday sentence. */
  plain: string;
  /** Optional connection to the guitar. */
  guitar?: string;
}

export const GLOSSARY = {
  key: {
    term: 'Key',
    plain: 'A song’s home base: one home note plus the set of notes that sound right around it.',
    guitar: 'Knowing the key tells you which chords and scale shapes will fit the song.',
  },
  scale: {
    term: 'Scale',
    plain: 'The notes of a key lined up from low to high, like rungs on a ladder.',
    guitar: 'On the guitar, a scale is the pattern of frets you can play without hitting a wrong note.',
  },
  home: {
    term: 'Home note',
    plain: 'The note that feels like resting. Melodies often end on it. Musicians call it the tonic.',
  },
  major: {
    term: 'Major',
    plain: 'A bright, settled sound.',
  },
  minor: {
    term: 'Minor',
    plain: 'A darker, sadder or moodier sound.',
  },
  chord: {
    term: 'Chord',
    plain: 'Three or more notes played together. The basic chords are built from every other note of the scale.',
    guitar: 'Each chord shape you strum is one chord.',
  },
  numerals: {
    term: 'Roman numerals',
    plain: 'Chords numbered by the scale note they start on: I is built on note 1, V on note 5. Capitals mean major, small letters mean minor.',
    guitar: 'They let you move a song to any key: I–V–vi–IV is G–D–Em–C in G, and C–G–Am–F in C.',
  },
  progression: {
    term: 'Chord progression',
    plain: 'The order chords come in, usually a short loop that repeats through a verse or chorus.',
  },
  roles: {
    term: 'Home, away, and tension',
    plain: 'Home chords feel stable. Away chords move off somewhere. Tension chords want to resolve back home.',
  },
  halfStep: {
    term: 'Half step',
    plain: 'The smallest step between notes in Western music.',
    guitar: 'One fret.',
  },
  wholeStep: {
    term: 'Whole step',
    plain: 'Two half steps.',
    guitar: 'Two frets.',
  },
  octave: {
    term: 'Octave',
    plain: 'The same note name, higher or lower. Two notes an octave apart sound like the same note at different heights.',
    guitar: '12 frets apart: the same note as the open string, one octave up.',
  },
  cents: {
    term: 'Cents',
    plain: 'A tiny unit of pitch. 100 cents is one half step, so 50 cents is halfway to the next note.',
    guitar: '100 cents = 1 fret.',
  },
  inTune: {
    term: 'In tune',
    plain: 'Close enough to the target note that it sounds right. The app counts you as in tune within a set number of cents.',
  },
  tempo: {
    term: 'Tempo (BPM)',
    plain: 'How fast the beat goes, in beats per minute: how many times you would tap your foot in one minute.',
  },
  meter: {
    term: 'Time signature',
    plain: 'How many beats make one bar, the repeating group you count. Most pop counts 1-2-3-4; a waltz counts 1-2-3.',
  },
  keySignature: {
    term: 'Key signature',
    plain: 'The sharps or flats that are always on in a key. Sheet music shows them at the start of every line.',
  },
  sharpFlat: {
    term: 'Sharp (♯) and flat (♭)',
    plain: 'A sharp raises a note by a half step; a flat lowers it by a half step.',
    guitar: 'Sharp = one fret higher. Flat = one fret lower.',
  },
  relative: {
    term: 'Relative key',
    plain: 'The major and minor keys that use exactly the same notes, like G major and E minor. They feel different because home is a different note.',
  },
  parallel: {
    term: 'Parallel key',
    plain: 'The major and minor keys with the same home note, like A major and A minor. Songs borrow chords from it for color.',
  },
  capo: {
    term: 'Capo',
    plain: 'A clamp across the neck that raises every string. It lets you use easy chord shapes in a harder key.',
  },
  solfege: {
    term: 'Do-re-mi (solfège)',
    plain: 'Singers’ names for the steps of a scale. In major, do is home; in minor, la is home. They help you hear each step’s feeling.',
  },
  diatonic: {
    term: 'In the key',
    plain: 'Made only from the key’s own notes. Musicians call these chords diatonic.',
  },
  borrowed: {
    term: 'Borrowed chord',
    plain: 'A chord taken from the key with the same home note but the opposite mood, for an unexpected color.',
  },
  cadence: {
    term: 'Cadence',
    plain: 'A chord move that ends a phrase, like punctuation at the end of a sentence.',
  },
  range: {
    term: 'Vocal range',
    plain: 'The span from the lowest to the highest note you can sing comfortably. It grows with practice.',
  },
  pitch: {
    term: 'Pitch',
    plain: 'How high or low a note sounds.',
  },
  tuning: {
    term: 'Recording tuning',
    plain: 'How the recording lines up with standard pitch (A = 440 Hz). Some recordings sit a little sharp or flat.',
    guitar: 'If a song is tuned off, tune your guitar to match before you play along.',
  },
  mode: {
    term: 'Mode',
    plain: 'A scale that uses the notes of a major scale but treats a different note as home, which changes its mood.',
  },
  pentatonic: {
    term: 'Pentatonic',
    plain: 'A five-note scale. It leaves out the notes most likely to clash, so it is easy to sing and improvise with.',
  },
  confidence: {
    term: 'How sure',
    plain: 'Audio detection is an estimate. This shows how strongly the evidence points to the answer, so you know when to double-check.',
  },
  reference: {
    term: 'Reference note',
    plain: 'A note the app plays so you can hear the target before singing it. The timer pauses while it plays.',
  },
} satisfies Record<string, Term>;

export type TermId = keyof typeof GLOSSARY;
