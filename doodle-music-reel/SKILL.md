---
name: doodle-music-reel
description: Make 9:16 doodle music reels. A drawing grows stroke by stroke on a grid while a playhead sweeps across it and plays the drawing as music, so the song builds as the picture does. Claude draws it and synthesizes the sound in code, then renders an mp4 on the user's own computer for free. Use when asked for a doodle music reel, a drawing that plays music, a draw-to-music video, "make the drawing sing", or a satisfying reel where a line makes notes. Also for turning a logo, a state or a country outline into a song.
---

# Doodle music reel

The format: a sheet of grid paper and a black line sweeping across it. Someone draws a wave and the line plays it. They add a hill, and a second instrument comes in. A stem grows and you hear it climb. By the end there's a whole picture and a whole song, and both came from the same strokes. Nobody talks and there's nothing to read. The reference reel did 12.5M views.

Why it works: two questions run at once, "what is it going to be?" and "what's it going to sound like?". Each new stroke answers a bit of both, so nobody swipes until the picture is done, and the last 10 seconds are the payoff.

`template/` has the engine and 5 finished drawings. Copy it, write a new drawing, run one command.

## How the format works

Measured frame by frame off the reference reel. The engine follows these numbers.

| Part | How it behaves |
|---|---|
| Playhead | Sweeps left to right, then jumps back. One sweep is 2 bars: 4.8s at 100 bpm |
| Height of the line | Pitch. 3 octaves bottom to top in a pentatonic scale, 15 notes |
| Snapping | The line snaps to the nearest note and slides there in about 60 ms, with no new attack |
| Each crossing | One voice, with a black dot on it. A circle crossed by the playhead is 2 notes at once |
| When a stroke starts to sound | Only once the pen has passed the playhead. Drawing alone makes no sound |
| Color | Each color is an instrument. All are soft tones, close to a pure sine |
| Level | Stays flat as voices pile up, about -16 dB |
| Order | A wave across the page, then the big shape, then detail, with 1 or 2 sweeps of listening between layers, and about 2 sweeps at the end with nothing new |

## Steps

1. **Get the subject.** If the user hasn't said what to draw, offer 3 from `drawings.md`, starting with something that grows. A handle in the corner is optional and most reels have none, so only add one if they ask.
2. **Copy the template:** `cp -r ~/.claude/skills/doodle-music-reel/template ~/doodle-reel && cd ~/doodle-reel && npm i puppeteer`
3. **Write the drawing** at `drawings/<name>.js`. Read `drawings/sunflower.js` first, it's the model. Rules are below.
4. **Read the song:** `node make.cjs drawings/<name>.js --check`. You can't hear it, so this note table is how you read it. Fix any warning. See "Reading the note table".
5. **Look at it:** `node make.cjs drawings/<name>.js --stills 4,12,20,30,40` writes pictures to `out/<name>-stills/`. Pick times across the video length shown on the first line of the note table, with the last one after the final stroke. Open every one. Check the drawing reads as the thing it's meant to be, nothing runs off the page, and strokes don't collide by accident.
6. **Render:** `node make.cjs drawings/<name>.js` writes `out/<name>.mp4` (about 1 minute).
7. **Contact sheet the final** and look at it before handing it over: `ffmpeg -i out/<name>.mp4 -vf "fps=1/3,scale=216:-1,tile=7x2" -frames:v 1 out/sheet.jpg`
8. **Tell the user to listen with sound on.** You can read the notes and you can't hear the mix, so their ears get the last word.

## Writing a drawing

```js
DRAW((E) => ({
  name: 'snail',       // the output file name
  key: 'D',            // any key: C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B
  scale: 'pentatonic', // pentatonic (sunny), minor (moody), major (7 notes, can clash)
  bpm: 100,            // one sweep is 8 beats
  hold: 2,             // sweeps at the end with nothing new
  // handle: '@yourapp',
  steps: [
    E.stroke('blue', E.wave(0, 1000, 1012, 34, 4), { speed: 430 }),
    E.wait(1.2),       // seconds, or E.wait('wrap') to wait for the next sweep
    E.stroke('green', [[500, 1000], [490, 800], [510, 600]], { speed: 200, width: 12 }),
  ],
}))
```

The page is **1000 wide and 1320 tall**, with y = 0 at the top. x is when a note plays, y is which note.

**Points and shapes.** Give a stroke 4-8 points and it comes out as a smooth hand-drawn curve.
- `E.wave(x0, x1, y, amp, bumps, seed)` a wavy line across
- `E.circle(cx, cy, r, startDeg, seed)` and `E.oval(cx, cy, rx, ry, startDeg, seed)` hand-drawn, with the end running past the start. `startDeg` is where the pen lands: -90 is the top, 0 is the right. The default is -100
- `E.leaf(x0, y0, x1, y1, fat)` a loop from base to tip and back
- `E.line(x0, y0, x1, y1)` and `E.arc(cx, cy, r, deg0, deg1)`
- `E.path(svgPathString, { fit: [x0, y0, x1, y1] })` any SVG outline, drawn with `{ sharp: true }`
- Anything else is a list of points you write yourself. For a cloud, copy the 10 points in `sunflower.js` and move them

**Stroke options.** `speed` in units per second (default 520). `gap` is the pause after it (default 0.22). `width` in pixels (default 10). `sharp: true` keeps corners. `closed: true` joins the end to the start. `wobble` is the hand shake (default 2.2, 0 is ruler-straight).

**Colors (each one is an instrument).** ink, red, orange, yellow, leaf, green, sky, blue, purple, pink, brown.

**Heights in the pentatonic scale.** These are the 15 steps, 88 units apart, for key D. Other keys shift the names and keep the heights.

| y | note | y | note | y | note |
|---|---|---|---|---|---|
| 0 | D6 | 440 | D5 | 880 | D4 |
| 88 | B5 | 528 | B4 | 968 | B3 |
| 176 | A5 | 616 | A4 | 1056 | A3 |
| 264 | F#5 | 704 | F#4 | 1144 | F#3 |
| 352 | E5 | 792 | E4 | 1232 | E3 |
|  |  |  |  | 1320 | D3 |

The line between two notes is halfway: 1012 is between A3 and B3, and 1100 is between F#3 and A3. `major` has 21 steps instead of 15, so read its heights off the note table.

## The rules that make it good

**The first stroke crosses the whole page, on the line between two notes.** `E.wave(0, 1000, 1012, 34, 4)` rocks between A3 and B3 for the whole video. It's the floor of the song. If it sits on one note it drones, and if it stops halfway the song has a hole.

**Build in layers, low before high.** Floor, then the big shape in the middle of the page, then details up high. Each layer is one new color. Wait 1 or 2 sweeps after a layer so people hear what it added.

**Draw what grows slowly.** Speed 170-250 on a stem or a trunk, so people watch it climb. Speed 400-500 on outlines. Speed 250-350 on short dashes.

**Shapes are sounds.**
- A long gentle line is a held melody.
- A near-vertical line is a fast run of notes, the "whoop" when the playhead hits a stem.
- A circle is two notes opening and closing. Small ones are quick two-note hits, big ones are a whole phrase.
- A short dash is one note. Dashes on the beat lines (every 125 across) make a pulse. The bottom of the page is bass, the top is sparkle.

**Stay at 10 voices held at once or fewer.** The check prints the number, and when it's over, it names the strokes causing it. A voice count goes up with every stroke sitting over the same x, so stacking shapes in one column is what does it, and so is an outline with deep bumps, because each bump that doubles back in x adds voices. Past 10 it turns to mush. Slide a shape sideways, make the bumps shallow or cut a stroke.

**Keep it 30-50 seconds.** Under 30 the song doesn't get to build, and over 50 people leave before the end. The length is worked out for you: the last stroke, rounded up to the end of that sweep, plus `hold` sweeps. So it changes when the drawing does, and it always ends right as a sweep finishes.

**It has to look like a kid's drawing.** Simple, recognizable, a few colors. If it needs a label, draw something else.

## Reading the note table

`--check` prints one line per stroke: color, when it's drawn, how far across it runs, how many voices it makes, and which notes it plays. Look for:

- **Stroke #1** has 2 or more notes and runs x 0-1000.
- **The strokes spread out** across the low, middle and high notes. If everything sits in one octave, move some shapes up or down the page.
- **A shape you meant as a melody has 3 or more notes.** A long line with one note is a drone. Give it more height, or shift it so it crosses a note line.
- **"Silent part of the sweep" is 0** or close to it.
- **The last stroke ends** about 2 sweeps before the video does.

## Fixing things

- **A drawing looks wrong:** change the points and re-run `--stills`. It takes seconds, so go round a few times.
- **A section sounds thin:** add a dash layer, or a low line across the page in a new color.
- **Puppeteer is missing:** `npm i puppeteer` in the folder with `make.cjs`.
- **ffmpeg is missing:** install it (`brew install ffmpeg` on a Mac). `--check` and `--sound` work without it, the video needs it.

## Keep it yours

Copy the format, and make your own drawings. Don't use another creator's handle, their drawings or their app's screen, and don't put view counts on the video that it hasn't earned.
