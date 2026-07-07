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

test('tab switch does not resume a world paused for being offscreen', () => {
  const dom = installDom()
  const world = new World({ canvas: createMockCanvas(), pauseWhenHidden: true, pauseWhenOffscreen: true })
  world.start()
  dom.io.trigger(dom.io.instances[0], false) // canvas leaves viewport
  assert.equal(world.raf, null)
  dom.doc.hidden = true
  dom.fire('document', 'visibilitychange')
  dom.doc.hidden = false
  dom.fire('document', 'visibilitychange')
  assert.equal(world.raf, null, 'offscreen pause must survive a tab round-trip')
  dom.io.trigger(dom.io.instances[0], true)
  assert.notEqual(world.raf, null, 'coming back into view resumes')
  world.stop()
  dom.uninstall()
})
