// The big shape can come first if there's still a line across the page underneath it.
DRAW((E) => {
  const s = []
  const add = (c, pts, o) => s.push(E.stroke(c, pts, o))

  // Hills along the bottom.
  add('green', E.wave(0, 1000, 1188, 42, 2, 41), { speed: 420, width: 11 })
  s.push(E.wait(0.9))
  add('leaf', [[0, 1090], [160, 1040], [330, 1110], [520, 1020], [720, 1100], [880, 1050], [1000, 1110]], { speed: 420, width: 10 })
  s.push(E.wait(1.2))

  // The balloon, one line round.
  add('red', [[455, 770], [340, 640], [262, 500], [270, 340], [370, 210], [500, 170], [630, 210], [730, 340], [738, 500], [660, 640], [545, 770]], { speed: 390, width: 13 })
  s.push(E.wait(0.7))

  // Stripes, top to bottom. Nearly straight up, so each one is a fast run of notes.
  add('yellow', [[500, 172], [405, 330], [420, 560], [478, 770]], { speed: 420, width: 10, gap: 0.2 })
  add('yellow', [[500, 172], [595, 330], [580, 560], [522, 770]], { speed: 420, width: 10 })
  s.push(E.wait(1.2))

  // Ropes and the basket.
  add('ink', E.line(462, 775, 462, 870), { speed: 240, width: 7, gap: 0.1 })
  add('ink', E.line(538, 775, 538, 870), { speed: 240, width: 7, gap: 0.2 })
  add('brown', [[440, 868], [560, 868], [548, 968], [452, 968], [440, 868]], { speed: 300, sharp: true, width: 12 })
  s.push(E.wait(1.3))

  // Clouds drift in on both sides.
  add('sky', [[40, 420], [62, 370], [120, 360], [150, 318], [205, 330], [232, 375], [268, 392], [258, 434], [40, 434], [40, 420]], { speed: 460, width: 10, gap: 0.35 })
  add('sky', [[730, 720], [752, 672], [806, 665], [838, 622], [896, 635], [922, 680], [966, 695], [958, 735], [730, 735], [730, 720]], { speed: 460, width: 10 })
  s.push(E.wait(1))

  // Sparkles up top.
  for (const [x, y] of [[120, 120], [270, 70], [790, 90], [915, 170], [640, 60]]) add('purple', [[x - 18, y], [x + 18, y]], { speed: 260, gap: 0.18, width: 9 })

  return { name: 'balloon', key: 'C', scale: 'pentatonic', bpm: 104, hold: 2, steps: s }
})
