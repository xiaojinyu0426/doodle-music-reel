// Minor key and a slower tempo change the whole mood. Same rules: floor first, then the big shape, then the small stuff.
DRAW((E) => {
  const s = []
  const add = (c, pts, o) => s.push(E.stroke(c, pts, o))

  // Two dunes. The first runs right across the page, on the line between two notes (y = 1100).
  add('orange', E.wave(0, 1000, 1100, 40, 2, 31), { speed: 400, width: 11 })
  s.push(E.wait(0.9))
  add('yellow', [[0, 1240], [190, 1205], [420, 1255], [640, 1215], [840, 1262], [1000, 1225]], { speed: 400, width: 10 })
  s.push(E.wait(1.4))

  // The cactus grows up from the sand, then the arms.
  add('green', [[425, 1040], [422, 800], [424, 590], [445, 505], [500, 470], [555, 505], [576, 590], [578, 800], [575, 1040]], { speed: 210, width: 13 })
  s.push(E.wait(0.5))
  add('green', [[424, 840], [340, 845], [285, 800], [272, 690], [290, 615], [325, 605], [342, 680], [352, 745], [424, 755]], { speed: 300, width: 13, gap: 0.3 })
  add('green', [[577, 760], [660, 762], [712, 716], [722, 590], [705, 525], [672, 520], [652, 590], [645, 665], [577, 675]], { speed: 300, width: 13 })
  s.push(E.wait(1.2))

  // Spines: little ticks, little notes.
  for (const [x, y, dx] of [[470, 620, 22], [530, 700, -22], [470, 800, 22], [530, 900, -22], [320, 700, 18], [685, 625, -18]]) add('leaf', E.line(x, y, x + dx, y - 16), { speed: 240, gap: 0.12, width: 8 })
  s.push(E.wait(1))

  // The big sun going down behind it.
  add('red', E.circle(800, 300, 118, -120, 9), { speed: 440, width: 13 })
  s.push(E.wait(1.2))

  // Birds way up high.
  add('ink', [[160, 210], [188, 178], [216, 206], [246, 172], [274, 204]], { speed: 400, sharp: true, gap: 0.35, width: 8 })
  add('ink', [[335, 120], [355, 98], [375, 118], [398, 94], [418, 116]], { speed: 400, sharp: true, width: 8 })

  return { name: 'cactus', key: 'A', scale: 'minor', bpm: 88, hold: 2, steps: s }
})
