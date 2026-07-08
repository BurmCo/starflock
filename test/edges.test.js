import { test } from 'node:test'
import assert from 'node:assert/strict'
import { World } from '../src/World.js'
import { createMockCanvas, installDom } from './helpers/mock-dom.js'

test('fallback pass respects maxEdgesPerFrame', () => {
  const dom = installDom()
  const world = new World({
    canvas: createMockCanvas(),
    nodeCount: 3,
    edgeMaxDist: 50,
    minEdgesPerNode: 2,
    maxEdgesPerFrame: 1,
    glowOnLargeNodes: false,
  })
  world.start()
  // three nodes in a line, 100px apart — no main-pass edges (dist > 50),
  // fallback range is 150 (50 * 3)
  world.nodes[0].x = 100
  world.nodes[0].y = 300
  world.nodes[1].x = 200
  world.nodes[1].y = 300
  world.nodes[2].x = 300
  world.nodes[2].y = 300
  const ctx = world.canvas.ctx
  ctx.calls.length = 0
  dom.flushRaf(0)
  const strokes = ctx.calls.filter(c => c.method === 'stroke').length
  assert.equal(strokes, 1, `maxEdgesPerFrame 1 must cap fallback edges too, drew ${strokes}`)
  world.stop()
  dom.uninstall()
})

test('fallback edge set is identical with and without spatialIndex', () => {
  const dom = installDom()
  const build = (spatialIndex) => {
    const world = new World({
      canvas: createMockCanvas(),
      nodeCount: 20,
      edgeMaxDist: 40,
      minEdgesPerNode: 2,
      spatialIndex,
      glowOnLargeNodes: false,
    })
    world.start()
    // deterministic grid: 100px spacing sits above edgeMaxDist (no main-pass
    // edges) but below fallbackDist = 3 * edgeMaxDist = 120 (fallback fires)
    world.nodes.forEach((n, i) => { n.x = 100 + (i % 5) * 100; n.y = 100 + Math.floor(i / 5) * 100 })
    world.canvas.ctx.calls.length = 0
    dom.flushRaf(0)
    const strokes = world.canvas.ctx.calls.filter(c => c.method === 'stroke').length
    world.stop()
    return strokes
  }
  const bruteStrokes = build(false)
  const indexedStrokes = build(true)
  assert.equal(indexedStrokes, bruteStrokes)
  assert.ok(bruteStrokes > 0, 'the grid must force fallback edges')
  dom.uninstall()
})

test('fallback connects a deficient node to its NEAREST eligible neighbor', () => {
  const dom = installDom()
  const world = new World({
    canvas: createMockCanvas(),
    nodeCount: 4,
    edgeMaxDist: 50,
    minEdgesPerNode: 1,
    glowOnLargeNodes: false,
  })
  world.start()
  // node 0 isolated; candidates at 100 (node 1), 120 (node 2), 140 (node 3)
  world.nodes[0].x = 100; world.nodes[0].y = 500
  world.nodes[1].x = 200; world.nodes[1].y = 500
  world.nodes[2].x = 220; world.nodes[2].y = 500
  world.nodes[3].x = 240; world.nodes[3].y = 500
  dom.flushRaf(0)
  // nodes 1-3 are within 20-40px of each other -> main-pass edges among them;
  // node 0 gets exactly one fallback edge, and it must go to node 1 (nearest).
  // Assert via the moveTo/lineTo pair drawn from node 0:
  const ctx = world.canvas.ctx
  const zeroMoves = ctx.calls.filter(c => c.method === 'moveTo' && c.args[0] === 100 && c.args[1] === 500)
  assert.equal(zeroMoves.length, 1, 'exactly one edge starts at node 0')
  const idx = ctx.calls.indexOf(zeroMoves[0])
  const line = ctx.calls.slice(idx).find(c => c.method === 'lineTo')
  assert.deepEqual(line.args, [200, 500], 'fallback edge goes to the nearest candidate')
  world.stop(); dom.uninstall()
})
