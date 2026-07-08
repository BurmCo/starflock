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

test('update({ pauseWhenHidden: false }) while hidden-paused resumes and removes the listener', (t) => {
  const dom = installDom()
  const world = new World({ canvas: createMockCanvas() })
  t.after(() => {
    world.stop()
    dom.uninstall()
  })
  world.start()
  dom.doc.hidden = true
  dom.fire('document', 'visibilitychange')
  assert.equal(world.raf, null, 'hidden pause engages')
  world.update({ pauseWhenHidden: false })
  assert.notEqual(world.raf, null, 'disabling pauseWhenHidden resumes')
  assert.equal(dom.listenerCount('document', 'visibilitychange'), 0)
  world.update({ pauseWhenHidden: true })
  assert.equal(dom.listenerCount('document', 'visibilitychange'), 1)
})

test('update({ autoResize }) toggles scroll/resize listeners and re-sizes live', (t) => {
  const dom = installDom({ innerWidth: 1024, innerHeight: 768, scrollHeight: 5000 })
  const canvas = createMockCanvas()
  const world = new World({ canvas })
  t.after(() => {
    world.stop()
    dom.uninstall()
  })
  world.start()
  assert.equal(dom.listenerCount('window', 'scroll'), 1)
  assert.equal(dom.listenerCount('window', 'resize'), 1)
  world.update({ autoResize: false })
  assert.equal(dom.listenerCount('window', 'scroll'), 0)
  assert.equal(dom.listenerCount('window', 'resize'), 0)
  world.scrollY = 42
  dom.win.scrollY = 999
  dom.fire('window', 'scroll')
  assert.equal(world.scrollY, 42, 'manual scrollY is caller-owned after the switch')
  world.update({ autoResize: true })
  assert.equal(dom.listenerCount('window', 'scroll'), 1)
  assert.equal(dom.listenerCount('window', 'resize'), 1)
  assert.equal(world.scrollY, 999, 'switching back re-seeds scrollY from the window')
  assert.equal(canvas.width, 1024, 'backing store is viewport-sized again')
})

test('update({ pixelRatio }) re-sizes the backing store live', (t) => {
  const dom = installDom({ innerWidth: 1024, innerHeight: 768, dpr: 1 })
  const canvas = createMockCanvas()
  const world = new World({ canvas })
  t.after(() => {
    world.stop()
    dom.uninstall()
  })
  world.start()
  assert.equal(canvas.width, 1024)
  world.update({ pixelRatio: 2 })
  assert.equal(canvas.width, 2048)
  assert.equal(canvas.height, 1536)
})

test('update() with unchanged values is a no-op — no rebuild, no recolor', (t) => {
  const dom = installDom()
  const world = new World({ canvas: createMockCanvas(), nodeCount: 5, colors: ['#aa0000', '#00bb00'] })
  t.after(() => {
    world.stop()
    dom.uninstall()
  })
  world.start()
  const before = world.nodes
  world.nodes[0].color = '#sentinel'
  world.update({ nodeCount: 5, colors: ['#aa0000', '#00bb00'] })
  assert.equal(world.nodes, before, 'same values must not rebuild')
  assert.equal(world.nodes[0].color, '#sentinel', 'same values must not recolor')
  world.update({ nodeCount: 7 })
  assert.notEqual(world.nodes, before, 'changed nodeCount must rebuild')
  assert.equal(world.nodes.length, 7)
})
