import { test } from 'node:test'
import assert from 'node:assert/strict'
import { World } from '../src/World.js'
import { createMockCanvas, installDom } from './helpers/mock-dom.js'
import { wind } from '../src/forces/wind.js'
import { dampen } from '../src/forces/dampen.js'

function makeWorld(dom, extra = {}) {
  const world = new World({
    canvas: createMockCanvas(),
    nodeCount: 1,
    glowOnLargeNodes: false,
    forces: [],
    ...extra,
  })
  world.start()
  // park the node mid-world so wrap-around cannot interfere
  world.nodes[0].x = 500
  world.nodes[0].y = 1500
  world.nodes[0].vx = 1
  world.nodes[0].vy = 0
  return world
}

test('same wall-clock time yields the same distance at 60Hz and 120Hz', () => {
  const dom = installDom()
  const w60 = makeWorld(dom)
  let t = 0
  dom.flushRaf(t)
  for (let i = 0; i < 6; i++) dom.flushRaf(t += 1000 / 60) // 100ms at 60Hz
  const dist60 = w60.nodes[0].x - 500
  w60.stop()

  const w120 = makeWorld(dom)
  t = 0
  dom.flushRaf(t)
  for (let i = 0; i < 12; i++) dom.flushRaf(t += 1000 / 120) // 100ms at 120Hz
  const dist120 = w120.nodes[0].x - 500
  w120.stop()

  assert.ok(Math.abs(dist60 - dist120) < 1e-6, `60Hz moved ${dist60}, 120Hz moved ${dist120}`)
  dom.uninstall()
})

test('60Hz/120Hz parity holds with an active dt-scaled force', () => {
  const dom = installDom()
  const w60 = makeWorld(dom, { forces: [wind({ angle: 0, strength: 0.001 })] })
  let t = 0
  dom.flushRaf(t)
  for (let i = 0; i < 6; i++) dom.flushRaf(t += 1000 / 60)
  const dist60 = w60.nodes[0].x - 500
  w60.stop()

  const w120 = makeWorld(dom, { forces: [wind({ angle: 0, strength: 0.001 })] })
  t = 0
  dom.flushRaf(t)
  for (let i = 0; i < 12; i++) dom.flushRaf(t += 1000 / 120)
  const dist120 = w120.nodes[0].x - 500
  w120.stop()

  // first-order Euler leaves a small discretization gap when velocity changes
  // over time; without dt scaling the gap would be ~6px, not fractions of one
  assert.ok(Math.abs(dist60 - dist120) < 0.01, `60Hz moved ${dist60}, 120Hz moved ${dist120}`)
  dom.uninstall()
})

test('wind scales its acceleration by dt', () => {
  const force = wind({ angle: 0, strength: 0.001 })
  const n1 = { x: 0, y: 0, vx: 0, vy: 0 }
  const n2 = { x: 0, y: 0, vx: 0, vy: 0 }
  force([n1], { time: 0, dt: 1 })
  force([n2], { time: 0, dt: 2 })
  assert.ok(Math.abs(n2.vx - 2 * n1.vx) < 1e-12)
})

test('dampen uses exponential decay: factor ** dt', () => {
  const force = dampen({ factor: 0.9 })
  const node = { vx: 1, vy: 1 }
  force([node], { dt: 2 })
  assert.ok(Math.abs(node.vx - 0.81) < 1e-12)
})

test('forces default to dt = 1 when the context has no dt', () => {
  const force = wind({ angle: 0, strength: 0.001 })
  const node = { x: 0, y: 0, vx: 0, vy: 0 }
  force([node], { time: 0 })
  assert.ok(Math.abs(node.vx - 0.001) < 1e-12)
})

test('frame gaps are clamped at 50ms', () => {
  const dom = installDom()
  const world = makeWorld(dom)
  dom.flushRaf(0)
  const before = world.nodes[0].x
  dom.flushRaf(5000) // 5s gap (e.g. throttled tab without pauseWhenHidden)
  const moved = world.nodes[0].x - before
  assert.ok(Math.abs(moved - 50 / (1000 / 60)) < 1e-6, `gap must integrate as 50ms, moved ${moved}`)
  world.stop(); dom.uninstall()
})

test('resume after a visibility pause does not integrate the hidden time', () => {
  const dom = installDom()
  const world = makeWorld(dom, { pauseWhenHidden: true })
  dom.flushRaf(0)
  dom.doc.hidden = true
  dom.fire('document', 'visibilitychange')
  dom.doc.hidden = false
  dom.fire('document', 'visibilitychange')
  const before = world.nodes[0].x
  dom.flushRaf(60000) // first frame after resume, huge timestamp
  const moved = world.nodes[0].x - before
  assert.ok(Math.abs(moved - 1) < 1e-6, `first resumed frame must use dt=1, moved ${moved}`)
  world.stop(); dom.uninstall()
})
