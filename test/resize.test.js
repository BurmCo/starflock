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
