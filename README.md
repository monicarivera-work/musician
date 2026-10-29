# Musician

A phone app for learning music from the songs you love and from your own voice.

- **Put in a song** four ways: search by title or artist, type or paste the chords, let the phone listen to a song playing nearby, or open an audio file. The app shows the song's **key and scale**, its **main chord loops** with Roman numerals and names (like "the pop progression"), each chord's job (home, away, tension), guitar chord shapes, tempo, sharps and flats, the relative key, and capo suggestions.
- **See every scale as a ladder.** The Scales screen draws any scale as a "Modulator" chart: rung gaps show whole steps (2 frets) and half steps (1 fret), the neighboring keys hang beside it, and the same scale appears on the guitar neck and on a sheet-music staff.
- **Sing it.** Load a scale and sing it note by note. The microphone tracks your pitch live, tells you "a little higher" or "a little lower", and moves on when you hold each note in tune.
- **Time yourself.** Every run is timed (reference notes don't count) and your best time for each scale is kept, so you can watch it drop.

Every music-theory word is underlined: tap it for a plain-English explanation.

## Use it on your phone

1. Open the GitHub Pages address for this repository in Safari (iPhone) or Chrome (Android): `https://monicarivera-work.github.io/musician/`
2. Add it to your home screen (Safari: Share › Add to Home Screen; Chrome: menu › Install app).
3. Allow the microphone the first time you sing or use Listen.

It works offline for scales, singing, and typed chords. Song search needs an internet connection.

## How the song analysis works

Everything runs on the phone; nothing is uploaded.

- **Search** uses Apple's free [iTunes Search API](https://performance-partners.apple.com/search-api) and analyzes the song's 30-second preview.
- **Key:** tuning-corrected pitch-class profiles (including a separate bass profile) are compared with published key profiles (Krumhansl–Kessler, Temperley, Albrecht–Shanahan), combined with how well the detected chords fit each key.
- **Chords:** beat-by-beat pitch profiles matched against major and minor triads, smoothed with a Viterbi (HMM) pass that prefers chords from the detected key.
- **Tempo:** onset-strength autocorrelation plus a dynamic-programming beat tracker.

On 24 well-known songs, the detected key matched the published key exactly for 20 and was the first alternative for 2 more. Audio results are estimates: the app always shows how sure it is, offers alternatives, and lets you correct the key or type the real chords. Typed chords give an exact analysis. A 30-second preview only covers part of a song, and the app does not claim a time signature from audio because short clips cannot reliably tell 3 from 4 beats per bar.

## Develop

Requires Node 24.

```bash
npm install
npm run dev        # http://localhost:5173 (use --host to try it on a phone on the same Wi-Fi)
npm test           # theory, audio analysis, pitch, and practice tests
npm run build      # type-check and production build into dist/
```

The microphone only works on `https://` pages or `localhost`.

### Project layout

| Path | What it holds |
| --- | --- |
| `src/theory/` | Notes, scales, keys, chords, Roman numerals, key detection, progressions, guitar shapes, plain-English glossary |
| `src/audio/` | Song analysis (runs in a Web Worker), live pitch tracking, microphone, recording, decoding, and the plucked-string synth |
| `src/practice/` | Timed scale runs, vocal range capture, and saved best times |
| `src/songs/` | iTunes search and the song-analysis model |
| `src/ui/` | Screens and components, including the Modulator ladder |
| `tests/` | Vitest suites, including analysis of synthesized songs |

## Deploy

The `Deploy to GitHub Pages` workflow builds and publishes the app on every push to `main`. To turn it on once: **Settings › Pages › Build and deployment › Source: GitHub Actions**.

## Credits

Built with React, Vite, [tonal](https://github.com/tonaljs/tonal), and [pitchy](https://github.com/ianprime0509/pitchy). Display type is Besley. Staff notation uses glyphs from the Bravura font. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
