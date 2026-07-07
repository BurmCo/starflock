import { test } from 'node:test'
import assert from 'node:assert/strict'
import { noise } from '../src/forces/noise.js'

test('two noise() instances with identical options produce identical output', () => {
  const a = noise({ scale: 0.003, strength: 0.0008, speed: 0.0005 })
  const b = noise({ scale: 0.003, strength: 0.0008, speed: 0.0005 })
  const nodeA = { x: 137, y: 512, vx: 0, vy: 0 }
  const nodeB = { x: 137, y: 512, vx: 0, vy: 0 }
  a([nodeA], { time: 1000 })
  b([nodeB], { time: 1000 })
  assert.equal(nodeA.vx, nodeB.vx)
  assert.equal(nodeA.vy, nodeB.vy)
  assert.notEqual(nodeA.vx, 0)
})

test('noise() construction is allocation-light (table shared at module scope)', () => {
  // 200 constructions must complete fast because the lattice table is built once
  // at import, not per call. Pre-hoist this took ~9ms per call (~1.8s for 200).
  const t0 = process.hrtime.bigint()
  for (let i = 0; i < 200; i++) noise()
  const ms = Number(process.hrtime.bigint() - t0) / 1e6
  assert.ok(ms < 200, `200 constructions took ${ms}ms — table is not shared`)
})
