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

test('update({ colors }) recolors in place — positions preserved, no node identity change', (t) => {
  const dom = installDom()
  const world = new World({ canvas: createMockCanvas(), nodeCount: 5, colors: ['#111111'] })
  t.after(() => {
    world.stop()
    dom.uninstall()
  })
  world.start()
  const before = world.nodes
  const positions = world.nodes.map(n => [n.x, n.y])
  world.update({ colors: ['#ff0000'] })
  assert.equal(world.nodes, before, 'nodes array must not be rebuilt')
  assert.deepEqual(world.nodes.map(n => [n.x, n.y]), positions)
  assert.ok(world.nodes.every(n => n.color === '#ff0000'))
})

test('update({ nodeCount }) rebuilds nodes', (t) => {
  const dom = installDom()
  const world = new World({ canvas: createMockCanvas(), nodeCount: 5 })
  t.after(() => {
    world.stop()
    dom.uninstall()
  })
  world.start()
  world.update({ nodeCount: 12 })
  assert.equal(world.nodes.length, 12)
})

test('update({ forces }) keeps the existing array when element-wise identical', (t) => {
  const dom = installDom()
  t.after(() => dom.uninstall())
  const f1 = () => {}
  const f2 = () => {}
  const original = [f1, f2]
  const world = new World({ canvas: createMockCanvas(), forces: original })
  world.update({ forces: [f1, f2] })
  assert.equal(world.forces, original, 'identical force list must not be swapped')
  world.update({ forces: [f2] })
  assert.notEqual(world.forces, original, 'changed force list must be swapped')
})

test('update({ onNodeClick }) after start registers the click listener live', (t) => {
  const dom = installDom()
  const world = new World({ canvas: createMockCanvas() })
  t.after(() => {
    world.stop()
    dom.uninstall()
  })
  world.start()
  assert.equal(dom.listenerCount('window', 'click'), 0)
  world.update({ onNodeClick: () => {} })
  assert.equal(dom.listenerCount('window', 'click'), 1)
  world.update({ onNodeClick: null })
  assert.equal(dom.listenerCount('window', 'click'), 0)
})

test('update({ pauseWhenOffscreen }) toggles the IntersectionObserver live', (t) => {
  const dom = installDom()
  const world = new World({ canvas: createMockCanvas() })
  t.after(() => {
    world.stop()
    dom.uninstall()
  })
  world.start()
  assert.equal(dom.io.instances.length, 0)
  world.update({ pauseWhenOffscreen: true })
  assert.equal(dom.io.instances.length, 1)
  dom.io.trigger(dom.io.instances[0], false)
  assert.equal(world.raf, null, 'offscreen pause engages')
  world.update({ pauseWhenOffscreen: false })
  assert.notEqual(world.raf, null, 'disabling the option resumes the loop')
})
