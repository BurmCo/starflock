import { test } from 'node:test'
import assert from 'node:assert/strict'
import { constellation, constellationEdges } from '../src/layouts/constellations.js'

// Real sky aspect ratio (width/height) per constellation, derived from J2000
// RA/Dec with the RA axis compressed by cos(mid declination). The layout data
// must preserve these so the shapes look like they do in the sky.
const REAL_ASPECT = {
  'orion': 0.60,
  'big-dipper': 1.89,
  'cassiopeia': 1.84,
  'crux': 0.68,
  'cygnus': 0.87,
  'leo': 2.08,
}

for (const [name, aspect] of Object.entries(REAL_ASPECT)) {
  test(`constellation '${name}' keeps the real sky aspect ratio`, () => {
    const pts = constellation(name, { scale: 1 })(1, 1)
    const xs = pts.map(p => p.x)
    const ys = pts.map(p => p.y)
    const w = Math.max(...xs) - Math.min(...xs)
    const h = Math.max(...ys) - Math.min(...ys)
    assert.ok(Math.abs(w / h - aspect) < 0.06, `w/h = ${(w / h).toFixed(2)}, real sky = ${aspect}`)
    assert.ok(Math.abs(Math.max(w, h) - 0.8) < 0.011, `long axis spans the 0.1–0.9 box, got ${Math.max(w, h)}`)
  })

  test(`constellation '${name}' edges reference valid star indices`, () => {
    const count = constellation(name, { scale: 1 })(1, 1).length
    for (const [i, j] of constellationEdges(name)) {
      assert.ok(Number.isInteger(i) && Number.isInteger(j), 'integer indices')
      assert.ok(i >= 0 && i < count && j >= 0 && j < count, `edge [${i},${j}] within 0..${count - 1}`)
      assert.notEqual(i, j, 'no self-edges')
    }
  })
}
