import { test } from 'node:test'
import assert from 'node:assert/strict'
import { World } from '../src/World.js'
import { cross } from '../src/shapes.js'
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

test('3-digit hex works in gradient mode', () => {
  const dom = installDom()
  const world = new World({ canvas: createMockCanvas(), nodeCount: 5, colors: ['#fff', '#000'], nodeColorMode: 'gradient' })
  world.start()
  for (const node of world.nodes) {
    assert.match(node.color, /^rgb\(\d+,\d+,\d+\)$/)
  }
  world.stop()
  dom.uninstall()
})

test('non-hex CSS colors fall back to the nearest stop instead of rgb(NaN)', () => {
  const dom = installDom()
  const world = new World({ canvas: createMockCanvas(), nodeCount: 5, nodeSize: [3, 3], colors: ['red', 'blue'], nodeColorMode: 'gradient' })
  world.start()
  for (const node of world.nodes) {
    assert.ok(node.color === 'red' || node.color === 'blue', `got ${node.color}`)
  }
  dom.flushRaf(0) // glow path — addColorStop must not throw
  world.stop()
  dom.uninstall()
})

test('reassigning node.shape takes effect on the next frame', () => {
  const dom = installDom()
  const world = new World({ canvas: createMockCanvas(), nodeCount: 1, glowOnLargeNodes: false })
  world.start()
  world.nodes[0].shape = 'star'
  dom.flushRaf(0)
  world.nodes[0].shape = 'cross'
  dom.flushRaf(16)
  assert.equal(world.nodes[0]._resolvedShape, cross)
  world.stop()
  dom.uninstall()
})
