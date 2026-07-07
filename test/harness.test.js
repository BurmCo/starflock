import { test } from 'node:test'
import assert from 'node:assert/strict'
import { World } from '../src/World.js'
import { createMockCanvas, installDom } from './helpers/mock-dom.js'

test('World constructs, starts, renders one frame, stops — against the mock DOM', () => {
  const dom = installDom()
  const world = new World({ canvas: createMockCanvas() })
  world.start()
  assert.equal(dom.listenerCount('window', 'resize'), 1)
  assert.equal(dom.listenerCount('window', 'mousemove'), 1)
  dom.flushRaf(0)
  assert.ok(world.canvas.ctx.calls.some(c => c.method === 'clearRect'))
  world.stop()
  assert.equal(dom.listenerCount('window', 'resize'), 0)
  dom.uninstall()
})
