#!/usr/bin/env node
// node make.cjs drawings/sunflower.js                  note table, sound, video (out/sunflower.mp4)
// node make.cjs drawings/sunflower.js --check          note table and warnings only
// node make.cjs drawings/sunflower.js --stills 5,12,30 note table + pictures at those seconds (out/sunflower-stills/)
// node make.cjs drawings/sunflower.js --sound          note table + the sound only (out/sunflower.wav)
const fs = require('fs'), path = require('path'), cp = require('child_process')
const E = require('./engine.js')

const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith('--') && a.endsWith('.js'))
if (!file) { console.error('Usage: node make.cjs drawings/name.js [--check] [--stills 5,12,30]'); process.exit(1) }
const stillsAt = args.includes('--stills') ? args[args.indexOf('--stills') + 1].split(',').map(Number) : null
require(path.resolve(file))
const P = E.prepare(globalThis.__DOODLE)
const OUT = path.join(__dirname, 'out')
fs.mkdirSync(OUT, { recursive: true })

// ---------- note table: Claude can't hear the song, so this is how it reads it ----------
function report() {
  console.log(`\n${P.name}: ${P.spec.key || 'D'} ${P.spec.scale || 'pentatonic'}, ${P.bpm} bpm, one sweep = ${P.loop.toFixed(1)}s, video = ${P.end.toFixed(1)}s, last stroke ends ${P.strokes[P.strokes.length - 1].t1.toFixed(1)}s\n`)
  const warn = []
  for (const s of P.strokes) {
    const seen = new Set(); let x0 = 1e9, x1 = -1
    for (const b of s.branches) { b.midi.forEach((m) => seen.add(m)); x0 = Math.min(x0, b.x0); x1 = Math.max(x1, b.x0 + b.len) }
    const notes = [...seen].sort((a, b) => a - b).map(E.noteName).join(' ')
    console.log(`#${String(s.i + 1).padStart(2)} ${s.color.padEnd(6)} ${s.t0.toFixed(1).padStart(5)}-${s.t1.toFixed(1).padEnd(5)}s  x ${String(x0).padStart(4)}-${String(x1).padEnd(4)} voices ${s.branches.length}  ${notes}`)
    for (const p of s.ink) if (p[0] < -2 || p[0] > E.W + 2 || p[1] < -2 || p[1] > E.H + 2) { warn.push(`#${s.i + 1} runs off the page`); break }
  }
  // Does the finished drawing sound all the way across, and how thick does it stay?
  const cells = []
  let silent = 0
  for (let x = 0; x < E.W; x += 5) {
    let c = 0
    for (const b of P.branches) if (x >= b.x0 && x < b.x0 + b.len) c++
    if (!c) silent += 5
    cells.push(c)
  }
  // Thickest part that lasts at least 0.2s. A quick run through a stem doesn't count.
  const win = Math.max(1, Math.round((0.2 / P.loop) * cells.length))
  let peak = 0, peakX = 0
  for (let i = 0; i + win <= cells.length; i++) {
    const low = Math.min(...cells.slice(i, i + win))
    if (low > peak) { peak = low; peakX = i * 5 }
  }
  const first = P.strokes[0]
  const firstW = Math.max(...first.branches.map((b) => b.len))
  if (new Set(first.branches.flatMap((b) => [...b.midi])).size < 2) warn.push(`The first stroke sits on one note and will drone. Move it onto the line between two notes (the note heights are in SKILL.md) so it rocks.`)
  if (firstW < 800) warn.push(`The first stroke only covers ${firstW} of 1000 wide. Start with a line across the whole page, or the song has holes for the first sweeps.`)
  if (silent > 150) warn.push(`The finished drawing is silent for ${silent} of 1000 wide. Add a line under that gap.`)
  if (peak > 10) {
    const here = P.strokes.filter((st) => st.branches.some((br) => peakX >= br.x0 && peakX < br.x0 + br.len)).map((st) => '#' + (st.i + 1))
    warn.push(`${peak} voices at once around x ${peakX}, from strokes ${here.join(' ')}. It gets muddy past about 10. Shorten one of those strokes, slide it sideways or cut it.`)
  }
  if (P.end > 60) warn.push(`Video is ${P.end.toFixed(0)}s. Reels this format does well at are 30-50s, so tighten the waits.`)
  console.log(`\nMost voices held at once: ${peak}. Silent part of the sweep: ${silent}/1000.`)
  if (warn.length) console.log('\nCheck these:\n- ' + [...new Set(warn)].join('\n- '))
  else console.log('No warnings.')
}

// ---------- the synth: reads the same voices the page draws ----------
function synth(wavPath) {
  const sr = 44100, n = Math.ceil(P.end * sr), L = new Float32Array(n), R = new Float32Array(n)
  const TAB = 4096, tables = {}
  for (const [name, c] of Object.entries(E.COLORS)) {
    const t = new Float32Array(TAB + 1)
    for (let i = 0; i <= TAB; i++) {
      let v = 0
      c.h.forEach((a, k) => { v += a * Math.sin((2 * Math.PI * (k + 1) * i) / TAB) })
      t[i] = v
    }
    const peak = Math.max(...t.map(Math.abs)); for (let i = 0; i <= TAB; i++) t[i] /= peak
    tables[name] = t
  }
  const BLOCK = 64, blockT = BLOCK / sr
  const glide = Math.exp(-blockT / 0.022) // about 60 ms to settle, as measured on the reference
  const attack = Math.exp(-blockT / 0.006), release = Math.exp(-blockT / 0.07)
  const voices = P.branches.map((b) => ({ b, phase: 0, midi: 0, target: 0, env: 0, hold: -1, born: false, tab: tables[b.color], c: E.COLORS[b.color] }))
  let bus = 1
  for (let s = 0; s < n; s += BLOCK) {
    const t = s / sr, x = Math.floor(P.xAt(t))
    let count = 0
    const play = []
    for (const v of voices) {
      const k = x - v.b.x0
      if (k >= 0 && k < v.b.len && v.b.t[k] <= t) {
        v.target = v.b.midi[k]
        if (!v.born || v.env < 0.001) { v.midi = v.target; v.born = true }
        v.hold = t + 0.07 // even a tiny dash rings long enough to hear
        count++
      }
      if (t < v.hold || v.env > 0.0008) play.push(v)
    }
    // Keep the level steady as voices pile up, the same way the reference does.
    const busTarget = 1 / Math.pow(Math.max(1, count), 0.55)
    const busNext = busTarget + (bus - busTarget) * Math.exp(-blockT / 0.12)
    for (const v of play) {
      const on = t < v.hold, envTo = on ? 1 + (v.env - 1) * attack : v.env * release
      const midiTo = v.target + (v.midi - v.target) * glide
      const up = Math.max(0, midiTo - 72) / 24, soft = 1 - Math.min(0.4, up * 0.4) // highs would otherwise poke out
      const gain = 0.3 * v.c.level * soft, panL = Math.cos(((v.c.pan + 1) * Math.PI) / 4), panR = Math.sin(((v.c.pan + 1) * Math.PI) / 4)
      const top = Math.min(BLOCK, n - s)
      for (let i = 0; i < top; i++) {
        const u = i / BLOCK
        const m = v.midi + (midiTo - v.midi) * u, f = 440 * Math.pow(2, (m - 69) / 12)
        v.phase += f / sr; if (v.phase >= 1) v.phase -= 1
        const p = v.phase * TAB, j = p | 0, smp = v.tab[j] + (v.tab[j + 1] - v.tab[j]) * (p - j)
        const a = (v.env + (envTo - v.env) * u) * (bus + (busNext - bus) * u) * gain * smp
        L[s + i] += a * panL; R[s + i] += a * panR
      }
      v.env = envTo; v.midi = midiTo
    }
    bus = busNext
  }
  // A little room, so the tones sit together.
  const wetL = room(L, R, 0, sr), wetR = room(L, R, 23, sr)
  let sum = 0, cnt = 0
  for (let i = 0; i < n; i++) { L[i] += wetL[i] * 0.17; R[i] += wetR[i] * 0.17; sum += L[i] * L[i] + R[i] * R[i]; cnt += 2 }
  // Level: -16 dB RMS (what the reference sits at) with a soft ceiling.
  const k = 0.158 / Math.sqrt(sum / cnt || 1)
  const clip = (v) => { const a = v * k; return Math.abs(a) < 0.7 ? a : Math.sign(a) * (0.7 + 0.2 * Math.tanh((Math.abs(a) - 0.7) / 0.2)) }
  const buf = Buffer.alloc(44 + n * 4)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22)
  buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40)
  for (let i = 0; i < n; i++) { buf.writeInt16LE(Math.round(clip(L[i]) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(clip(R[i]) * 32767), 46 + i * 4) }
  fs.writeFileSync(wavPath, buf)
}
function room(L, R, spread, sr) {
  const n = L.length, out = new Float32Array(n)
  const combs = [0.0297, 0.0371, 0.0411, 0.0437].map((d) => ({ b: new Float32Array(Math.round(d * sr) + spread), i: 0, lp: 0 }))
  const passes = [0.005, 0.0017].map((d) => ({ b: new Float32Array(Math.round(d * sr) + spread), i: 0 }))
  for (let s = 0; s < n; s++) {
    const inp = (L[s] + R[s]) * 0.25
    let v = 0
    for (const c of combs) {
      const y = c.b[c.i]
      c.lp = y * 0.72 + c.lp * 0.28
      c.b[c.i] = inp + c.lp * 0.8
      c.i = (c.i + 1) % c.b.length
      v += y
    }
    for (const a of passes) {
      const y = a.b[a.i], w = v + y * 0.5
      a.b[a.i] = w
      a.i = (a.i + 1) % a.b.length
      v = y - w * 0.5
    }
    out[s] = v
  }
  return out
}

// ---------- pictures ----------
async function openPage() {
  let puppeteer
  try { puppeteer = require('puppeteer') } catch { console.error('\nPuppeteer is missing. Run: npm i puppeteer'); process.exit(1) }
  const browser = await puppeteer.launch({ headless: true, args: ['--allow-file-access-from-files'] })
  const page = await browser.newPage()
  page.on('pageerror', (e) => console.error('Page error:', e.message))
  await page.setViewport({ width: 1080, height: 1920 })
  const rel = path.relative(__dirname, path.resolve(file)).split(path.sep).join('/')
  await page.goto('file://' + path.join(__dirname, 'index.html') + '?d=' + encodeURIComponent(rel))
  await page.evaluate(() => window.READY)
  return { browser, page }
}
async function stills(times) {
  const dir = path.join(OUT, P.name + '-stills'); fs.mkdirSync(dir, { recursive: true })
  const { browser, page } = await openPage()
  for (const t of times) {
    await page.evaluate((v) => window.seek(v), t)
    await page.screenshot({ path: path.join(dir, String(t).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 85 })
  }
  await browser.close()
  console.log('\nStills in ' + dir)
}
async function video(wav, mp4) {
  const { browser, page } = await openPage()
  const total = Math.round(P.end * 30)
  const ff = cp.spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', '30', '-i', '-', '-i', wav,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', mp4], { stdio: ['pipe', 'inherit', 'inherit'] })
  const started = Date.now()
  for (let i = 0; i < total; i++) {
    await page.evaluate((v) => window.seek(v), i / 30)
    const shot = await page.screenshot({ type: 'jpeg', quality: 95 })
    if (!ff.stdin.write(shot)) await new Promise((r) => ff.stdin.once('drain', r))
    if (i % 150 === 0) process.stdout.write(`  frame ${i}/${total}\n`)
  }
  ff.stdin.end()
  await new Promise((ok, fail) => ff.on('close', (c) => (c === 0 ? ok() : fail(new Error('ffmpeg exited ' + c)))))
  await browser.close()
  console.log(`\nVideo: ${mp4} (${((Date.now() - started) / 1000).toFixed(0)}s to render)`)
}

;(async () => {
  report()
  if (args.includes('--check')) return
  if (stillsAt) return stills(stillsAt)
  const wav = path.join(OUT, P.name + '.wav'), mp4 = path.join(OUT, P.name + '.mp4')
  synth(wav)
  console.log('\nSound: ' + wav)
  if (args.includes('--sound')) return
  await video(wav, mp4)
})().catch((e) => { console.error(e); process.exit(1) })
