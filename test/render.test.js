import { test } from 'node:test'
import assert from 'node:assert/strict'
import { World } from '../src/World.js'
import { createMockCanvas, installDom } from './helpers/mock-dom.js'

test('glowScale 0 disables the halo but still draws the node', () => {
  const dom = installDom()
  const canvas = createMockCanvas()
  const world = new World({ canvas, nodeCount: 1, nodeSize: [3, 3], glowScale: 0 })
  world.start()
  canvas.ctx.calls.length = 0
  dom.flushRaf(0)
  const arcs = canvas.ctx.calls.filter(c => c.method === 'arc')
  assert.ok(arcs.length >= 1, 'node shape must still be drawn')
  assert.equal(canvas.ctx.calls.filter(c => c.method === 'createRadialGradient').length, 0)
  world.stop()
  dom.uninstall()
})
