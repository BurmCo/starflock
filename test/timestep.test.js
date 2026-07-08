import { test } from 'node:test'
import assert from 'node:assert/strict'
import { World } from '../src/World.js'
import { createMockCanvas, installDom } from './helpers/mock-dom.js'

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
