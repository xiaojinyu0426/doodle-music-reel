# The Claude doodle music skill

One Claude skill, `doodle-music-reel`, that makes draw-to-music reels: a drawing grows stroke by stroke on grid paper while a playhead sweeps across it and plays the drawing as music. The song builds as the picture does — a wave across the page is the floor of the song, a stem climbing is a rising melody, a circle is two notes at once. No talking, nothing to read. Renders an mp4 on your own computer for free.

## Source & credit

This skill was created by **Ernesto Lopez ([@ErnestoSOFTWARE](https://x.com/ErnestoSOFTWARE))** and shared as a free resource at [ernesto-x-resources.vercel.app/r/doodle-skill](https://ernesto-x-resources.vercel.app/r/doodle-skill). Original post: [x.com/ErnestoSOFTWARE/status/2118736547898114413](https://x.com/ErnestoSOFTWARE/status/2118736547898114413). The format is based on the draw-to-music reels of Instagram [@play_music_theory](https://www.instagram.com/play_music_theory/).

## What it makes

- **Sunflower** — 43s, D pentatonic, 100 bpm
- **Apple tree** — 43s, G pentatonic, 100 bpm
- **Cactus in a minor key** — 38s, A minor, 88 bpm
- Plus your own drawings: anything that grows (bean, mushroom, bonsai, vine, pumpkin), scenes (lighthouse, house, rocket, whale), or any SVG outline — even your own logo turned into a song. Ideas in `doodle-music-reel/drawings.md`.

## Install

Unzip this repo (or clone it) and move the folder into your skills directory:

```bash
mv doodle-music-reel ~/.claude/skills/
```

Check that `~/.claude/skills/doodle-music-reel/SKILL.md` exists. You also need Node, ffmpeg, and puppeteer (`npm i puppeteer` in the template folder). Ask Claude to confirm what's missing before installing anything.

## Use

Tell Claude what you want to draw. The workflow in `SKILL.md`:

1. Copy `template/` to a working folder and `npm i puppeteer`
2. Write the drawing at `drawings/<name>.js` (read `sunflower.js` first — it's the model)
3. `node make.cjs drawings/<name>.js --check` — read the note table, fix any warning
4. `node make.cjs drawings/<name>.js --stills 4,12,20,30,40` — look at the stills before rendering
5. `node make.cjs drawings/<name>.js` — renders `out/<name>.mp4` (about 1 minute)

## How it works

- The page is 1000 × 1320; x is when a note plays, y is which note
- Height of the line is pitch: 3 octaves in a pentatonic scale, 15 notes
- Each color is an instrument (ink, red, orange, yellow, leaf, green, sky, blue, purple, pink, brown)
- One playhead sweep is 2 bars (4.8s at 100 bpm); keep it to 10 voices at once or fewer, and 30–50 seconds total

## Keep it yours

Copy the format and make your own drawings. Don't use another creator's handle, their drawings, or their app's screen — and don't put view counts on a video that it hasn't earned.

## Files

- `doodle-music-reel/SKILL.md` — workflow, format rules, note heights, how to write a good song
- `doodle-music-reel/drawings.md` — what to draw, including turning a logo or a state/country outline into a song
- `doodle-music-reel/template/engine.js`, `index.html`, `make.cjs` — the engine, the viewer, and the one-command render
- `doodle-music-reel/template/drawings/` — 5 finished example drawings: sunflower, apple-tree, cactus, balloon, outline (heart)
