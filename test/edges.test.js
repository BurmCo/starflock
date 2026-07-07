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
