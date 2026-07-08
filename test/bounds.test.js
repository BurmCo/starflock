import { test } from 'node:test'
import assert from 'node:assert/strict'
import { World } from '../src/World.js'
import { createMockCanvas, installDom } from './helpers/mock-dom.js'

// world space from installDom defaults: width 1024 (innerWidth), height 3000 (scrollHeight)

function makeWorld(extra = {}) {
  const world = new World({
    canvas: createMockCanvas(),
    nodeCount: 1,
    glowOnLargeNodes: false,
    forces: [],
    ...extra,
  })
  world.start()
  return world
}

test('wrap: a node partially visible at the edge is not teleported', (t) => {
  const dom = installDom()
  const world = makeWorld()
  t.after(() => { world.stop(); dom.uninstall() })
  const n = world.nodes[0]
  n.r = 2; n.x = -1; n.y = 500; n.vx = 0; n.vy = 0
  dom.flushRaf(0)
  assert.equal(n.x, -1, 'half-visible node must stay put')
})

test('wrap: a fully exited node re-enters just outside the opposite edge', (t) => {
  const dom = installDom()
  const world = makeWorld()
  t.after(() => { world.stop(); dom.uninstall() })
  const n = world.nodes[0]
  n.r = 2; n.x = -2.5; n.y = 500; n.vx = 0; n.vy = 0
  dom.flushRaf(0)
  // torus period is width + 2r: -2.5 + 1028 = 1025.5, just outside the right edge
  assert.equal(n.x, 1025.5)
  assert.ok(n.x > 1024, 're-entry starts outside the canvas so the node drifts in')
})

test('wrap margin covers the glow halo, not just the body', (t) => {
  const dom = installDom()
  const world = makeWorld({ glowOnLargeNodes: true }) // threshold 2, scale 4
  t.after(() => { world.stop(); dom.uninstall() })
  const n = world.nodes[0]
  n.r = 2.5; n.y = 500; n.vx = 0; n.vy = 0 // halo radius 10
  n.x = -9
  dom.flushRaf(0)
  assert.equal(n.x, -9, 'halo still reaches into view — no teleport')
  n.x = -10.5
  dom.flushRaf(1000 / 60)
  assert.equal(n.x, -10.5 + 1024 + 20, 'halo fully out — wrap with halo margin')
})

test('wrap: a drifting node crosses the edge and drifts back in from the other side', (t) => {
  const dom = installDom()
  const world = makeWorld()
  t.after(() => { world.stop(); dom.uninstall() })
  const n = world.nodes[0]
  n.r = 2; n.x = 1; n.y = 500; n.vx = -1; n.vy = 0
  let time = 0
  dom.flushRaf(time)
  for (let i = 0; i < 6; i++) dom.flushRaf(time += 1000 / 60)
  // x walks 1 → 0 → -1 → -2 → -3 (wraps to 1025) → 1024 → 1023 → 1022
  assert.equal(n.x, 1022, 'node is visible again, entered from the right')
})

test('wrap applies to the y axis with the same margin rules', (t) => {
  const dom = installDom()
  const world = makeWorld()
  t.after(() => { world.stop(); dom.uninstall() })
  const n = world.nodes[0]
  n.r = 2; n.x = 500; n.y = -2.5; n.vx = 0; n.vy = 0
  dom.flushRaf(0)
  assert.equal(n.y, -2.5 + 3000 + 4, 'fully above the top re-enters below the bottom')
})

test("bounds: 'solid' reflects velocity at the walls and keeps the node fully visible", (t) => {
  const dom = installDom()
  const world = makeWorld({ bounds: 'solid' })
  t.after(() => { world.stop(); dom.uninstall() })
  const n = world.nodes[0]
  n.r = 2; n.x = 4; n.y = 500; n.vx = -1.5; n.vy = 0
  dom.flushRaf(0)                 // x = 2.5, still inside
  dom.flushRaf(1000 / 60)         // x = 1 → clamped to r = 2, vx flips
  assert.equal(n.x, 2)
  assert.equal(n.vx, 1.5, 'velocity reflects off the left wall')
  dom.flushRaf(2000 / 60)         // x = 3.5, moving right again
  assert.equal(n.x, 3.5)
})

test("bounds: 'solid' bounces off the right and bottom walls too", (t) => {
  const dom = installDom()
  const world = makeWorld({ bounds: 'solid' })
  t.after(() => { world.stop(); dom.uninstall() })
  const n = world.nodes[0]
  n.r = 2; n.x = 1023; n.y = 2999; n.vx = 1.5; n.vy = 2
  dom.flushRaf(0)
  assert.equal(n.x, 1022, 'clamped to width - r')
  assert.equal(n.vx, -1.5)
  assert.equal(n.y, 2998, 'clamped to height - r')
  assert.equal(n.vy, -2)
})

test("bounds: 'solid' pulls a node stranded outside back into the field", (t) => {
  const dom = installDom()
  const world = makeWorld({ bounds: 'solid' })
  t.after(() => { world.stop(); dom.uninstall() })
  const n = world.nodes[0]
  n.r = 2; n.x = -30; n.y = 500; n.vx = 0; n.vy = 0
  dom.flushRaf(0)
  assert.equal(n.x, 2, 'clamped to the wall even with zero velocity')
})

test('update({ bounds }) switches the behavior live', (t) => {
  const dom = installDom()
  const world = makeWorld()
  t.after(() => { world.stop(); dom.uninstall() })
  const n = world.nodes[0]
  n.r = 2; n.x = -2.5; n.y = 500; n.vx = 0; n.vy = 0
  dom.flushRaf(0)
  assert.equal(n.x, 1025.5, 'default is wrap')
  world.update({ bounds: 'solid' })
  n.x = -2.5
  dom.flushRaf(1000 / 60)
  assert.equal(n.x, 2, 'after the switch the wall clamps instead of wrapping')
})

test('nodes near the edge render at full brightness — no fade zone', (t) => {
  const dom = installDom()
  const world = makeWorld()
  t.after(() => { world.stop(); dom.uninstall() })
  const n = world.nodes[0]
  n.r = 2; n.x = 10; n.y = 500; n.vx = 0; n.vy = 0
  n.brightness = 0.6
  const ctx = world.canvas.ctx
  ctx.calls.length = 0
  dom.flushRaf(0)
  const alphaSets = ctx.calls.filter(c => c.method === 'set:globalAlpha')
  // one node, no edges, no background: first alpha set is the node's draw alpha
  assert.equal(alphaSets[0].args[0], 0.6, 'alpha is the node brightness, undimmed by position')
})

test('spatialIndex edge pass still sees nodes inside the wrap margin ring', (t) => {
  const dom = installDom()
  t.after(() => dom.uninstall())
  const build = (spatialIndex) => {
    const world = makeWorld({ nodeCount: 3, edgeMaxDist: 40, spatialIndex })
    world.nodes.forEach(n => { n.r = 5; n.vx = 0; n.vy = 0; n.y = 500 })
    world.nodes[0].x = -4   // outside the canvas, inside its own wrap margin (r = 5)
    world.nodes[1].x = 20   // 24px from node 0 → edge
    world.nodes[2].x = 45   // 25px from node 1 → edge; 49px from node 0 → none
    world.canvas.ctx.calls.length = 0
    dom.flushRaf(0)
    const strokes = world.canvas.ctx.calls.filter(c => c.method === 'stroke').length
    world.stop()
    return strokes
  }
  const brute = build(false)
  const indexed = build(true)
  assert.equal(brute, 2, 'both edges exist without an index')
  assert.equal(indexed, brute, 'the index must not drop the outside node')
})
