import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nodeRepel } from '../src/forces/nodeRepel.js'

test('repulsion forces match the reference formula', () => {
  const force = nodeRepel({ radius: 60, strength: 0.002 })
  const a = { x: 100, y: 100, vx: 0, vy: 0 }
  const b = { x: 130, y: 100, vx: 0, vy: 0 } // dist 30
  force([a, b], { dt: 1 })
  // t = (60 - 30) / 60 = 0.5; f = 0.5 * 0.002 / 30; fx = dx * f = -30 * f = -0.001
  assert.ok(Math.abs(a.vx - -0.001) < 1e-12, `a.vx = ${a.vx}`)
  assert.ok(Math.abs(b.vx - 0.001) < 1e-12)
  assert.equal(a.vy, 0)
})

test('pairs outside the radius are untouched', () => {
  const force = nodeRepel({ radius: 60 })
  const a = { x: 0, y: 0, vx: 0, vy: 0 }
  const b = { x: 100, y: 0, vx: 0, vy: 0 }
  force([a, b], { dt: 1 })
  assert.equal(a.vx, 0)
  assert.equal(b.vx, 0)
})
