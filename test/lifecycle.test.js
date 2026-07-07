import { test } from 'node:test'
import assert from 'node:assert/strict'
import { World } from '../src/World.js'
import { createMockCanvas, installDom } from './helpers/mock-dom.js'

test('stop() from inside onFrame really stops the loop', () => {
  const dom = installDom()
  const world = new World({ canvas: createMockCanvas(), onFrame: () => world.stop() })
  world.start()
  dom.flushRaf(0)
  assert.equal(dom.pendingRafCount(), 0, 'no frame may be re-armed after stop()')
  assert.equal(world.raf, null)
  dom.uninstall()
})
