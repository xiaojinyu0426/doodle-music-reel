// Any outline works: a logo, a state, a country. Paste its SVG path into E.path and draw it with sharp: true.
// This one is a heart. Swap the path for yours.
DRAW((E) => {
  const s = []
  const add = (c, pts, o) => s.push(E.stroke(c, pts, o))

  // A floor across the page, so outlines with gaps still have sound under them.
  add('blue', E.wave(0, 1000, 1100, 36, 4, 51), { speed: 430, width: 10 })
  s.push(E.wait(1))

  const heart = 'M 12 21 C 12 21 3 14 3 8 C 3 5 5 3 8 3 C 10 3 11 4 12 6 C 13 4 14 3 16 3 C 19 3 21 5 21 8 C 21 14 12 21 12 21 Z'
  add('red', E.path(heart, { fit: [130, 160, 870, 900] }), { sharp: true, speed: 360, width: 14 })
  s.push(E.wait(1.2))
  add('pink', E.path(heart, { fit: [300, 330, 700, 730] }), { sharp: true, speed: 360, width: 11 })
  s.push(E.wait(1))

  for (const x of [125, 375, 625, 875]) add('sky', E.line(x - 20, 1235, x + 20, 1235), { speed: 260, gap: 0.2, width: 9 })

  return { name: 'outline', key: 'E', scale: 'pentatonic', bpm: 100, hold: 2, steps: s }
})
