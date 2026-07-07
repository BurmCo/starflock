import { test } from 'node:test'
import assert from 'node:assert/strict'
import { World } from '../src/World.js'
import { createMockCanvas, installDom } from './helpers/mock-dom.js'

test('explicit undefined does not clobber defaults', () => {
  const dom = installDom()
  const world = new World({ canvas: createMockCanvas(), minEdgesPerNode: undefined, nodeCount: undefined })
  assert.equal(world.options.minEdgesPerNode, null)
  assert.equal(world.options.nodeCount, 60)
  dom.uninstall()
})

test('update() ignores __proto__ / constructor / prototype keys', () => {
  const dom = installDom()
  const world = new World({ canvas: createMockCanvas() })
  world.update(JSON.parse('{"__proto__": {"polluted": true}}'))
  assert.equal(Object.getPrototypeOf(world.options), Object.prototype)
  assert.equal(world.options.polluted, undefined)
  dom.uninstall()
})

test('update({ edgeColors: null }) falls back to colors and keeps rendering', () => {
  const dom = installDom()
  const world = new World({ canvas: createMockCanvas(), colors: ['#abcdef'] })
  world.start()
  world.update({ edgeColors: null })
  dom.flushRaf(0)
  dom.flushRaf(16)
  assert.deepEqual(world.options.edgeColors, ['#abcdef'])
  world.stop(); dom.uninstall()
})
