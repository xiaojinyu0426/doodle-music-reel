// Doodle music engine. This one file runs in the page (to draw) and in Node (to make the sound),
// so the sound always comes from the drawing itself.
//
// The canvas is 1000 wide and 1320 tall, y = 0 at the top.
// x is time: one sweep of the playhead crosses it left to right in 2 bars.
// y is pitch: bottom = root of octave 3, top = root of octave 6, snapped to the scale.
(function (root) {
  const W = 1000, H = 1320

  const ROOTS = { C: 48, 'C#': 49, Db: 49, D: 50, 'D#': 51, Eb: 51, E: 52, F: 53, 'F#': 54, Gb: 54, G: 55, 'G#': 56, Ab: 56, A: 57, 'A#': 58, Bb: 58, B: 59 }
  const SCALES = {
    pentatonic: [0, 2, 4, 7, 9], // the sunny one, nothing clashes
    minor: [0, 3, 5, 7, 10], // moody, nothing clashes
    major: [0, 2, 4, 5, 7, 9, 11], // more notes, can clash
  }
  const NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

  // Each color is one instrument. h = strength of each harmonic. All soft, because voices stack up.
  const COLORS = {
    ink: { hex: '#2a2826', h: [1, 0, 0.3, 0, 0.16, 0, 0.1], level: 0.8, pan: 0 },
    red: { hex: '#e4503c', h: [1, 0.45, 0.28, 0.16, 0.09, 0.05], level: 0.75, pan: 0.18 },
    orange: { hex: '#f08c2e', h: [1, 0.22, 0.09, 0.04], level: 0.9, pan: -0.14 },
    yellow: { hex: '#f5bf2f', h: [1, 0.05, 0.14, 0, 0.05], level: 0.8, pan: 0.26 },
    leaf: { hex: '#7cb53f', h: [1, 0, 0.11, 0, 0.04], level: 0.95, pan: -0.24 },
    green: { hex: '#1f9d6b', h: [1, 0.18, 0.06], level: 0.95, pan: 0.1 },
    sky: { hex: '#6bbcec', h: [1, 0.04], level: 1, pan: -0.3 },
    blue: { hex: '#3461d1', h: [1, 0.09], level: 1, pan: 0 }, // measured off the reference reel
    purple: { hex: '#8160dc', h: [1, 0.1, 0.32, 0.05, 0.18], level: 0.75, pan: 0.3 },
    pink: { hex: '#e56aa6', h: [1, 0.3, 0.05, 0.12], level: 0.8, pan: -0.2 },
    brown: { hex: '#9a6a43', h: [1, 0.3, 0.05], level: 1, pan: 0.06 },
  }

  // ---------- small helpers ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
  const lerp = (a, b, u) => a + (b - a) * u
  function rng(seed) {
    let a = seed >>> 0
    return () => {
      a = (a + 0x6d2b79f5) >>> 0
      let t = Math.imul(a ^ (a >>> 15), 1 | a)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }
  function noise1(seed) {
    const r = rng(seed), v = []
    for (let i = 0; i < 512; i++) v.push(r() * 2 - 1)
    return (x) => {
      const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f)
      return lerp(v[((i % 512) + 512) % 512], v[(((i + 1) % 512) + 512) % 512], u)
    }
  }

  // Catmull-Rom through the points, so 5-6 points already look like a hand-drawn curve.
  function smooth(pts, closed) {
    if (pts.length < 3) return pts.slice()
    const out = [], n = pts.length
    const get = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)])
    const segs = closed ? n : n - 1
    for (let i = 0; i < segs; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2)
      const steps = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 3))
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t
        out.push([
          0.5 * (2 * p1[0] + (p2[0] - p0[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (p2[1] - p0[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3),
        ])
      }
    }
    out.push(closed ? pts[0].slice() : pts[n - 1].slice())
    return out
  }
  function resample(pts, step) {
    const out = [pts[0].slice()]
    let carry = 0
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i]
      const d = Math.hypot(bx - ax, by - ay)
      if (!d) continue
      let at = step - carry
      while (at <= d) {
        out.push([ax + ((bx - ax) * at) / d, ay + ((by - ay) * at) / d])
        at += step
      }
      carry = (carry + d) % step
    }
    const last = pts[pts.length - 1], tail = out[out.length - 1]
    if (Math.hypot(last[0] - tail[0], last[1] - tail[1]) > 0.5) out.push(last.slice())
    return out
  }

  // ---------- what a drawing file calls ----------
  const E = {
    W, H, COLORS, SCALES,
    stroke: (color, pts, o = {}) => ({ color, pts, o }),
    wait: (s) => ({ wait: s }), // seconds, or 'wrap' to wait for the playhead to start its next sweep
    line: (x0, y0, x1, y1) => [[x0, y0], [x1, y1]],
    // One wavy line across the page. Uneven on purpose.
    wave(x0, x1, y, amp, bumps, seed = 7) {
      const r = rng(seed), out = [], n = bumps * 4
      for (let i = 0; i <= n; i++) {
        const u = i / n
        out.push([lerp(x0, x1, u) + (i && i < n ? (r() - 0.5) * 16 : 0), y - Math.sin(u * bumps * Math.PI * 2) * amp * (0.75 + r() * 0.45)])
      }
      return out
    },
    // A hand-drawn circle: slightly off round, and the end runs past the start like a real pen.
    oval(cx, cy, rx, ry, startDeg = -100, seed = 3) {
      const r = rng(seed), out = [], n = 18
      for (let i = 0; i <= n + 1; i++) {
        const a = ((startDeg + (i * 360) / n) * Math.PI) / 180, k = 1 + (r() - 0.5) * 0.035
        out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k])
      }
      return out
    },
    circle: (cx, cy, r, startDeg, seed) => E.oval(cx, cy, r, r, startDeg, seed),
    arc(cx, cy, r, a0, a1) {
      const out = [], n = Math.max(3, Math.ceil(Math.abs(a1 - a0) / 25))
      for (let i = 0; i <= n; i++) {
        const a = (lerp(a0, a1, i / n) * Math.PI) / 180
        out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
      }
      return out
    },
    // Base to tip and back, so it's two voices wherever the playhead crosses it.
    leaf(x0, y0, x1, y1, fat = 50) {
      const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d
      const at = (u, k) => [x0 + dx * u + nx * k, y0 + dy * u + ny * k]
      return [at(0, 0), at(0.3, fat * 0.9), at(0.7, fat * 0.75), at(1, 0), at(0.7, -fat * 0.7), at(0.3, -fat * 0.85), at(0.02, 0)]
    },
    // An SVG path (M L H V C Q Z, absolute or relative) fitted into the box [x0, y0, x1, y1].
    // For outlines: a logo, a country, a state. Draw it with { sharp: true }.
    path(d, o = {}) {
      const tok = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || []
      let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0
      const pts = [], num = () => parseFloat(tok[i++])
      const curve = (pt, steps = 14) => { for (let k = 1; k <= steps; k++) pts.push(pt(k / steps)) }
      while (i < tok.length) {
        if (/[a-zA-Z]/.test(tok[i])) cmd = tok[i++]
        const rel = cmd === cmd.toLowerCase(), c = cmd.toUpperCase()
        if (c === 'Z') { pts.push([sx, sy]); x = sx; y = sy; continue }
        if (c === 'M' || c === 'L') { const nx = num() + (rel ? x : 0), ny = num() + (rel ? y : 0); if (c === 'M' && !pts.length) { sx = nx; sy = ny } pts.push([nx, ny]); x = nx; y = ny; if (c === 'M') cmd = rel ? 'l' : 'L' }
        else if (c === 'H') { x = num() + (rel ? x : 0); pts.push([x, y]) }
        else if (c === 'V') { y = num() + (rel ? y : 0); pts.push([x, y]) }
        else if (c === 'Q') {
          const ax = num() + (rel ? x : 0), ay = num() + (rel ? y : 0), bx = num() + (rel ? x : 0), by = num() + (rel ? y : 0), px = x, py = y
          curve((t) => [(1 - t) ** 2 * px + 2 * (1 - t) * t * ax + t * t * bx, (1 - t) ** 2 * py + 2 * (1 - t) * t * ay + t * t * by]); x = bx; y = by
        } else if (c === 'C') {
          const ax = num() + (rel ? x : 0), ay = num() + (rel ? y : 0), bx = num() + (rel ? x : 0), by = num() + (rel ? y : 0), cx = num() + (rel ? x : 0), cy = num() + (rel ? y : 0), px = x, py = y
          curve((t) => [(1 - t) ** 3 * px + 3 * (1 - t) ** 2 * t * ax + 3 * (1 - t) * t * t * bx + t ** 3 * cx, (1 - t) ** 3 * py + 3 * (1 - t) ** 2 * t * ay + 3 * (1 - t) * t * t * by + t ** 3 * cy]); x = cx; y = cy
        } else throw new Error('E.path does not read "' + cmd + '". Convert the shape to M L H V C Q Z first.')
        }
      if (!o.fit) return pts
      const [bx0, by0, bx1, by1] = o.fit
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
      const mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys)
      const k = Math.min((bx1 - bx0) / (mxx - mnx || 1), (by1 - by0) / (mxy - mny || 1))
      const ox = bx0 + ((bx1 - bx0) - (mxx - mnx) * k) / 2, oy = by0 + ((by1 - by0) - (mxy - mny) * k) / 2
      return pts.map(([a, b]) => [ox + (a - mnx) * k, oy + (b - mny) * k])
    },
  }

  // ---------- turn a drawing file into strokes, times and voices ----------
  E.prepare = function (spec) {
    const scale = SCALES[spec.scale || 'pentatonic']
    if (!scale) throw new Error('Unknown scale "' + spec.scale + '". Use: ' + Object.keys(SCALES).join(', '))
    const rootMidi = ROOTS[spec.key || 'D']
    if (rootMidi === undefined) throw new Error('Unknown key "' + spec.key + '"')
    const bpm = spec.bpm || 100, loop = (60 / bpm) * 8 // 2 bars of 4
    const maxStep = scale.length * 3, stepH = H / maxStep
    const midiOf = (s) => rootMidi + 12 * Math.floor(s / scale.length) + scale[s % scale.length]
    const seed = [...(spec.name || 'doodle')].reduce((a, c) => a + c.charCodeAt(0), 11)

    const strokes = [], branches = []
    let t = spec.start || 0
    spec.steps.forEach((step, idx) => {
      if (step.wait !== undefined) {
        t = step.wait === 'wrap' ? (Math.floor(t / loop) + 1) * loop : t + step.wait
        return
      }
      if (!COLORS[step.color]) throw new Error('Unknown color "' + step.color + '". Use: ' + Object.keys(COLORS).join(', '))
      const o = step.o
      const base = resample(o.sharp ? step.pts : smooth(step.pts, o.closed), 3)
      let len = 0
      for (let i = 1; i < base.length; i++) len += Math.hypot(base[i][0] - base[i - 1][0], base[i][1] - base[i - 1][1])
      const dur = Math.max(0.12, len / (o.speed || 520))
      const n = base.length, time = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        const u = n > 1 ? i / (n - 1) : 1, ss = u * u * (3 - 2 * u)
        time[i] = t + dur * lerp(u, ss, 0.28) // a little slower at both ends, like a hand
      }
      // The line you see wobbles a bit. The notes read the clean line, so the wobble can't cause stray notes.
      const n1 = noise1(seed + idx * 13), n2 = noise1(seed + idx * 29 + 5), w = o.wobble === undefined ? 2.2 : o.wobble
      const ink = base.map((p, i) => {
        const a = base[Math.max(0, i - 1)], b = base[Math.min(n - 1, i + 1)], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
        const s = i * 3, off = w * (n1(s / 70) + 0.35 * n2(s / 16))
        return [p[0] - ((b[1] - a[1]) / d) * off, p[1] + ((b[0] - a[0]) / d) * off]
      })
      const stroke = { i: strokes.length, color: step.color, hex: COLORS[step.color].hex, ink, time, t0: t, t1: t + dur, width: o.width || 10, rough: noise1(seed + idx * 41 + 9), branches: [] }
      strokes.push(stroke)
      for (const [a, b] of xRuns(base)) {
        const br = buildBranch(base, time, a, b, stepH, maxStep, midiOf)
        br.color = step.color
        stroke.branches.push(br)
        branches.push(br)
      }
      t += dur + (o.gap === undefined ? 0.22 : o.gap)
    })

    const end = (Math.ceil(t / loop) + (spec.hold === undefined ? 2 : spec.hold)) * loop // always lands on a wrap
    const xAt = (time) => ((time % loop) / loop) * W

    return {
      spec, name: spec.name || 'doodle', bpm, loop, end, W, H, strokes, branches, stepH, maxStep, rootMidi, scale, midiOf, xAt,
      // Who is sounding right now. Same answer in the page and in the synth.
      activeAt(time) {
        const x = Math.floor(xAt(time)), out = []
        for (const b of branches) {
          const k = x - b.x0
          if (k >= 0 && k < b.len && b.t[k] <= time) out.push({ b, midi: b.midi[k], color: b.color })
        }
        return out
      },
    }
  }

  // Split a stroke wherever it turns round in x. Each left-to-right piece is one voice,
  // so a circle is two notes at once and a zigzag is a chord.
  function xRuns(p) {
    const runs = []
    let start = 0, dir = 0, ext = 0
    for (let i = 1; i < p.length; i++) {
      if (!dir) {
        if (Math.abs(p[i][0] - p[start][0]) > 1) { dir = Math.sign(p[i][0] - p[start][0]); ext = i }
        continue
      }
      if ((p[i][0] - p[ext][0]) * dir > 0) ext = i
      else if ((p[ext][0] - p[i][0]) * dir > 5) { runs.push([start, ext]); start = ext; dir = -dir; ext = i }
    }
    runs.push([start, dir ? ext : p.length - 1])
    return runs
  }
  function buildBranch(p, time, a, b, stepH, maxStep, midiOf) {
    let seq = []
    for (let i = a; i <= b; i++) seq.push({ x: p[i][0], y: p[i][1], t: time[i] })
    if (seq[seq.length - 1].x < seq[0].x) seq.reverse()
    let xMin = seq[0].x, xMax = seq[seq.length - 1].x
    // A straight-up line takes no time to cross. Give it 8 units, so it's a quick run of notes and not a click.
    if (xMax - xMin < 8) {
      const mid = (xMin + xMax) / 2, m = seq.length - 1 || 1
      seq = seq.map((q, i) => ({ ...q, x: mid - 4 + (8 * i) / m }))
      xMin = mid - 4; xMax = mid + 4
    }
    const x0 = Math.floor(xMin), len = Math.max(1, Math.ceil(xMax) - x0 + 1)
    const y = new Float32Array(len), t = new Float32Array(len), midi = new Int16Array(len)
    let j = 0, cur = null
    for (let k = 0; k < len; k++) {
      const X = x0 + k
      while (j < seq.length - 2 && seq[j + 1].x < X) j++
      const q = seq[j], r = seq[Math.min(j + 1, seq.length - 1)]
      const u = r.x > q.x ? clamp((X - q.x) / (r.x - q.x), 0, 1) : 0
      y[k] = lerp(q.y, r.y, u)
      t[k] = lerp(q.t, r.t, u)
      const v = clamp((H - y[k]) / stepH, 0, maxStep)
      if (cur === null || Math.abs(v - cur) > 0.58) cur = Math.round(v) // holds a note until the line really moves off it
      midi[k] = midiOf(cur)
    }
    return { x0, len, t, midi, y }
  }

  E.noteName = (m) => NOTE[m % 12] + (Math.floor(m / 12) - 1)

  root.DoodleEngine = E
  root.DRAW = (fn) => { root.__DOODLE = fn(E) }
  if (typeof module !== 'undefined') module.exports = E
})(typeof globalThis !== 'undefined' ? globalThis : this)
