// test/scrolldrift.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scrollDrift } from '../src/forces/scrollDrift.js'
import { World } from '../src/World.js'
import { createMockCanvas, installDom } from './helpers/mock-dom.js'

test('first invocation with a large scrollY applies no impulse', () => {
  const force = scrollDrift({ mode: 'rotate' })
  const node = { x: 100, y: 100, vx: 0, vy: 0 }
  force([node], { scrollY: 3000, width: 1000, height: 800 })
  assert.equal(node.vx, 0)
  assert.equal(node.vy, 0)
})

test('second invocation applies only the real delta', () => {
  const force = scrollDrift({ mode: 'rotate' })
  const node = { x: 100, y: 100, vx: 0, vy: 0 }
  force([node], { scrollY: 3000, width: 1000, height: 800 })
  force([node], { scrollY: 3020, width: 1000, height: 800 })
  // delta 20 → angle = 20 * 0.003 = 0.06 rad; just assert a small, non-zero impulse
  assert.notEqual(node.vx, 0)
  assert.ok(Math.hypot(node.vx, node.vy) < 5, 'impulse must reflect delta 20, not absolute 3020')
})

test('World.start() seeds scrollY from window.scrollY', (t) => {
  const dom = installDom({ scrollY: 500 })
  const world = new World({ canvas: createMockCanvas() })
  t.after(() => {
    world.stop()
    dom.uninstall()
  })
  world.start()
  assert.equal(world.scrollY, 500)
})
