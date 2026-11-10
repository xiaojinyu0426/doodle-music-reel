// A seed under the ground: roots go down (bass), the stem climbs, leaves open, the flower blooms, the sun comes out.
DRAW((E) => {
  const s = []
  const add = (c, pts, o) => s.push(E.stroke(c, pts, o))

  // Ground across the whole page, sitting right on the line between two notes (y = 1012, A3 and B3)
  // so it rocks back and forth. It never stops, so the song has a floor from the first second.
  add('brown', E.wave(0, 1000, 1012, 34, 4), { speed: 430 })
  s.push(E.wait(1.1))

  // Roots go down: the low notes.
  add('brown', [[500, 1018], [488, 1075], [515, 1130], [482, 1205], [498, 1290]], { speed: 300, gap: 0.12 })
  add('brown', [[494, 1072], [410, 1100], [315, 1125], [225, 1215]], { speed: 380, gap: 0.12 })
  add('brown', [[510, 1125], [610, 1145], [705, 1205], [800, 1270]], { speed: 380 })
  s.push(E.wait(1.3))

  // The stem grows, slowly.
  add('green', [[500, 1005], [486, 880], [506, 740], [516, 600], [507, 432]], { speed: 170, width: 12 })
  s.push(E.wait(0.4))

  // Leaves open on both sides: a melody in the middle of the page.
  add('green', E.leaf(490, 840, 245, 725, 62), { speed: 430, gap: 0.3 })
  add('green', E.leaf(510, 680, 770, 590, 62), { speed: 430 })
  s.push(E.wait(1.6))

  // The flower. A circle is two notes at once, top and bottom.
  add('brown', E.circle(506, 345, 84), { speed: 420, width: 12 })
  s.push(E.wait(0.5))
  const petals = 8
  for (let i = 0; i < petals; i++) {
    const a = ((i * 360) / petals - 67.5) * (Math.PI / 180), r0 = 94, r1 = 190
    add('yellow', E.leaf(506 + Math.cos(a) * r0, 345 + Math.sin(a) * r0, 506 + Math.cos(a) * r1, 345 + Math.sin(a) * r1, 26), { speed: 560, gap: 0.05, width: 9 })
  }
  s.push(E.wait(1.4))

  // Sun and sparkles way up high, short bright notes.
  add('orange', E.circle(125, 120, 62), { speed: 420, width: 11 })
  for (const [x0, y0, x1, y1] of [[210, 80, 268, 52], [222, 150, 288, 172], [152, 214, 172, 278], [70, 205, 45, 262]]) add('orange', E.line(x0, y0, x1, y1), { speed: 360, gap: 0.09, width: 9 })
  s.push(E.wait(0.8))

  // A cloud on the right, and two birds to finish.
  add('sky', [[720, 175], [745, 125], [800, 118], [835, 75], [900, 90], [925, 135], [975, 150], [968, 195], [720, 195], [720, 175]], { speed: 480, width: 10 })
  add('ink', [[60, 470], [85, 442], [110, 468], [138, 438], [162, 466]], { speed: 420, sharp: true, gap: 0.3, width: 8 })
  add('ink', [[790, 400], [810, 378], [830, 398], [853, 374], [873, 396]], { speed: 420, sharp: true, width: 8 })

  return { name: 'sunflower', key: 'D', scale: 'pentatonic', bpm: 100, hold: 2, steps: s }
})
