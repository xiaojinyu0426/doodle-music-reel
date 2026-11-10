# What to draw

## The 5 in template/drawings/

| File | Shows | Key |
|---|---|---|
| `sunflower.js` | The model. Ground, roots, stem, leaves, flower, sun | D pentatonic, 100 bpm |
| `apple-tree.js` | Grass tufts on the beat for a pulse, apples as quick hits | G pentatonic, 100 bpm |
| `cactus.js` | A minor key and a slower tempo change the mood | A minor, 88 bpm |
| `balloon.js` | Stripes as fast runs, dashes as sparkle on top | C pentatonic, 104 bpm |
| `outline.js` | An SVG outline drawn from `E.path` | E pentatonic, 100 bpm |

## Things that grow (start here)

Growing gives the video a story, and the rising line gives you a rising sound.

- A bean from a seed: roots, a stem that curls, leaves one by one, a giant pod
- A mushroom patch: ground, stems, big round caps, spots as short notes
- A bonsai in a pot: the pot first, then a twisty trunk, then cloud-shaped leaves
- A vine climbing up the page, with flowers on it
- Roses on a stem, with thorns as short dashes
- A pumpkin: a long vine across the page, then the big round fruit
- A forest: 4 or 5 trees going up one at a time, each in its own color
- A snail crossing the page, with a growing spiral for the shell

## Scenes

- A lighthouse: sea, rock, tower, then a beam across the page
- A house: ground, walls, roof, window, door, then smoke curling up in a spiral
- A rocket: ground, then the body, flames below, stars on top
- A whale: the sea, then one huge body line, then the spout going up
- A hot dog, a burger or a pizza, drawn one layer at a time
- A face: a big circle, then eyes, nose and mouth, then hair as a wild melody

## Outlines (a logo, a state, a country)

The reference account gets big numbers on these. Everyone wants to hear their own state, and the comments fill up with requests.

1. Get the SVG path. Search for a public-domain or CC0 outline, or use your own logo file.
2. Keep only the `d` attribute. `E.path` reads M, L, H, V, C, Q and Z. If the path uses arcs (A), convert it first.
3. Lay a floor line across the page, because outlines leave gaps.
4. `E.stroke('red', E.path(d, { fit: [100, 150, 900, 950] }), { sharp: true, speed: 360, width: 14 })`
5. Add a second color inside it (a river, a star on the capital, the logo's inner shape) so the song has a second voice.

A detailed coastline turns into a very busy melody. Simplify the outline to around 60-150 points so it stays a tune.
