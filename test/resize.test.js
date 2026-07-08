import { test } from 'node:test'
import assert from 'node:assert/strict'
import { World } from '../src/World.js'
import { createMockCanvas, installDom } from './helpers/mock-dom.js'

test('autoResize sizes the backing store to the viewport, not the document', () => {
  const dom = installDom({ innerWidth: 1024, innerHeight: 768, scrollHeight: 20000, dpr: 2 })
  const canvas = createMockCanvas()
  const world = new World({ canvas })
  world.start()
  assert.equal(canvas.width, 2048, 'width = innerWidth * dpr')
  assert.equal(canvas.height, 1536, 'height = innerHeight * dpr — NOT scrollHeight')
  assert.equal(canvas.style.width, '1024px')
  assert.equal(canvas.style.height, '768px')
  assert.equal(world._logicalHeight, 20000, 'world space still spans the document')
  world.stop(); dom.uninstall()
})

test('nodes spawn across the full document height', () => {
  const dom = installDom({ innerHeight: 768, scrollHeight: 10000 })
  const world = new World({ canvas: createMockCanvas(), nodeCount: 200 })
  world.start()
  assert.ok(world.nodes.some(n => n.y > 768), 'some nodes must live below the first viewport')
  assert.ok(world.nodes.every(n => n.y <= 10000))
  world.stop(); dom.uninstall()
})

test('the frame is translated by scrollY and clears only the viewport slice', () => {
  const dom = installDom({ innerWidth: 1024, innerHeight: 768, scrollHeight: 5000, scrollY: 0, dpr: 2 })
  const canvas = createMockCanvas()
  const world = new World({ canvas })
  world.start()
  world.scrollY = 1000
  canvas.ctx.calls.length = 0
  dom.flushRaf(0)
  const st = canvas.ctx.calls.find(c => c.method === 'setTransform')
  assert.deepEqual(st.args, [2, 0, 0, 2, 0, -2000], 'translate by -scrollY * dpr')
  const cr = canvas.ctx.calls.find(c => c.method === 'clearRect')
  assert.deepEqual(cr.args, [0, 1000, 1024, 768], 'clear the visible world-space slice')
  world.stop(); dom.uninstall()
})

test('resize events are debounced and rescale nodes in place', async () => {
  const dom = installDom({ innerWidth: 1000, innerHeight: 800, scrollHeight: 2000 })
  const world = new World({ canvas: createMockCanvas(), nodeCount: 10 })
  world.start()
  const nodesBefore = world.nodes
  const node = world.nodes[0]
  node.x = 500; node.y = 1000
  dom.win.innerWidth = 500
  dom.doc.documentElement.scrollHeight = 1000
  dom.fire('window', 'resize')
  dom.fire('window', 'resize')
  dom.fire('window', 'resize')
  assert.equal(node.x, 500, 'nothing happens synchronously')
  await new Promise(resolve => setTimeout(resolve, 250))
  assert.equal(world.nodes, nodesBefore, 'nodes are preserved, not recreated')
  assert.equal(node.x, 250, 'x rescaled by 500/1000')
  assert.equal(node.y, 500, 'y rescaled by 1000/2000')
  world.stop(); dom.uninstall()
})
