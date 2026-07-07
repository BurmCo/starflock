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
