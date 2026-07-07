import { test } from 'node:test'
import assert from 'node:assert/strict'
import { World } from '../src/World.js'
import { createMockCanvas, installDom } from './helpers/mock-dom.js'

test('_applyColors recolors existing nodes according to nodeColorMode', (t) => {
  const dom = installDom()
  const world = new World({ canvas: createMockCanvas(), nodeCount: 4, colors: ['#111111'] })
  t.after(() => {
    world.stop()
    dom.uninstall()
  })
  world.start()
  world.options.colors = ['#aa0000', '#00bb00']
  world.options.nodeColorMode = 'sequential'
  world._applyColors(world.nodes)
  assert.deepEqual(world.nodes.map(n => n.color), ['#aa0000', '#00bb00', '#aa0000', '#00bb00'])
})
