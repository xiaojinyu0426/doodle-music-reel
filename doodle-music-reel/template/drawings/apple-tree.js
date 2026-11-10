// A tree grows out of a hill. Grass tufts sit on the beat lines for a pulse, apples pop up as bright two-note hits.
DRAW((E) => {
  const s = []
  const add = (c, pts, o) => s.push(E.stroke(c, pts, o))

  // The hill: full width, right on the line between two notes (y = 1100).
  add('leaf', E.wave(0, 1000, 1100, 38, 3, 21), { speed: 420, width: 11 })
  s.push(E.wait(1))

  // Grass tufts on beats 2, 4, 6 and 8. Vertical beat lines are every 125 wide, so these land on the beat.
  for (const x of [125, 375, 625, 875]) add('leaf', [[x - 14, 1250], [x, 1205], [x + 14, 1250]], { speed: 300, sharp: true, gap: 0.2, width: 9 })
  s.push(E.wait(0.8))

  // The trunk grows: two lines up from the ground, then branches.
  add('brown', [[452, 1085], [468, 960], [472, 840], [452, 730]], { speed: 170, width: 13, gap: 0.15 })
  add('brown', [[552, 1088], [536, 960], [532, 840], [556, 730]], { speed: 170, width: 13, gap: 0.3 })
  add('brown', [[458, 780], [380, 700], [310, 660]], { speed: 300, width: 11, gap: 0.12 })
  add('brown', [[546, 780], [630, 690], [705, 640]], { speed: 300, width: 11, gap: 0.12 })
  add('brown', [[500, 800], [500, 700], [515, 600]], { speed: 300, width: 11 })
  s.push(E.wait(1.3))

  // The canopy: one big bumpy line all the way round. Two long melodies at once, one over the other.
  const canopy = []
  const lobes = 9
  for (let i = 0; i <= lobes * 4 + 1; i++) {
    const a = ((i / (lobes * 4)) * 360 + 150) * (Math.PI / 180)
    const bump = 1 + 0.11 * Math.abs(Math.sin((i / (lobes * 4)) * lobes * Math.PI))
    canopy.push([505 + Math.cos(a) * 345 * bump, 450 + Math.sin(a) * 265 * bump])
  }
  add('green', canopy, { speed: 520, width: 11 })
  s.push(E.wait(1.6))

  // Apples, one at a time. Each is a tiny circle, so a quick two-note hit in the song.
  for (const [x, y] of [[300, 430], [470, 310], [660, 420], [395, 570], [590, 560], [770, 510], [230, 545]]) add('red', E.circle(x, y, 36, -90, x), { speed: 430, gap: 0.2, width: 11 })
  s.push(E.wait(1.2))

  // A little sun in the corner. Rays are high short notes.
  add('yellow', E.circle(890, 110, 50, -100, 5), { speed: 380, width: 10, gap: 0.15 })
  for (const [x0, y0, x1, y1] of [[800, 95, 745, 85], [825, 170, 780, 215], [895, 185, 900, 245]]) add('yellow', E.line(x0, y0, x1, y1), { speed: 340, gap: 0.1, width: 9 })

  return { name: 'apple-tree', key: 'G', scale: 'pentatonic', bpm: 100, hold: 2, steps: s }
})
