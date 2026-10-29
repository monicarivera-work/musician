# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One learner: a novice musician who mostly plays guitar, reads sheet music somewhat, and is not a singer yet but wants to learn to sing. She uses the app alone on her phone, while learning songs she likes and while practicing her voice.

## Product Purpose

A phone app for learning music from real songs and from your own voice.

- **Understand a song:** put in a song and see the key and scale it uses, its main chord progressions, and related metadata (tempo, relative key, the chords that belong to the key), each explained in plain English.
- **Learn to sing:** load a scale, sing it, and see whether each note was reached and in tune.
- **Measure progress:** time each scale run and keep personal best times.

Success means she can say why a song sounds the way it does (its key, chords, and progression), and her scale runs get more accurate and faster over time.

## Positioning

Song analysis and singing practice share one musical vocabulary: the scale a song uses is one tap away from being the scale she sings, with guitar, which she already plays, as the bridge into theory.

## Operating Context

- Runs in the phone browser and is installed to the home screen as a progressive web app (PWA), on iPhone and Android.
- Hosted on GitHub Pages from the public repository `monicarivera-work/musician`.
- Songs come in four ways, all confirmed:
  1. Search by title or artist (iTunes Search API) and analyze the 30-second preview on the device.
  2. Type or paste the song's chords.
  3. Let the phone listen to a song playing nearby through the microphone.
  4. Upload an audio file from the phone.
- Singing practice and listening use the microphone. Headphones are optional.

## Capabilities and Constraints

- Key, tempo, and chords detected from audio are estimates. The app must show how confident it is and let her correct the result. Typed chords produce exact theory analysis.
- A 30-second preview covers only part of a song.
- There is no backend or account. Analysis runs on the device and progress is stored locally on the phone.
- Microphone access requires HTTPS; GitHub Pages provides it.
- Timing means timed scale runs: how long a scale takes to sing correctly, with best times. A general daily practice log was not requested.
- Guitar is her main instrument, so chord shapes and fretboard positions are relevant. She can read staff notation somewhat.
- Undecided: the product name. The repository is called `musician`.

## Brand Commitments

- Plain English first. Every theory term (key, scale, interval, Roman numeral, cents, and so on) comes with an everyday explanation. Unexplained jargon is the thing most likely to make her stop using the app.

## Evidence on Hand

- No logos, imagery, or written content exist yet.
- Song facts come from the iTunes Search API and on-device analysis at runtime. Never present invented song analyses as facts. Label any sample content as an example.

## Product Principles

1. **Explain every term.** Each theory word arrives with a one-line explanation in plain words.
2. **Be honest about estimates.** Anything detected from audio shows how sure the app is and can be corrected.
3. **Go from song to voice in one step.** Whatever a song uses (its scale and its chords) can be played and sung right away.
4. **Build on the guitar.** Connect new ideas to the fretboard she already knows.
5. **Make progress measurable.** Timed runs and best times show improvement without guesswork.
