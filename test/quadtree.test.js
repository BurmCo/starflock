import { test } from 'node:test'
import assert from 'node:assert/strict'
import { QuadTree } from '../src/QuadTree.js'

test('20 coincident points all survive and are queryable', () => {
  const qt = new QuadTree(-1, -1, 1922, 1082)
  const points = Array.from({ length: 20 }, () => ({ x: 500, y: 500 }))
  for (const p of points) assert.equal(qt.insert(p), true)
  assert.equal(qt.queryRadius(500, 500, 10).length, 20)
})

test('subdivision depth is bounded', () => {
  const qt = new QuadTree(-1, -1, 1922, 1082)
  for (let i = 0; i < 30; i++) qt.insert({ x: 500, y: 500 })
  let maxDepth = 0
  const walk = (node, depth) => {
    maxDepth = Math.max(maxDepth, depth)
    if (node.divided) for (const c of [node._ne, node._nw, node._se, node._sw]) walk(c, depth + 1)
  }
  walk(qt, 0)
  assert.ok(maxDepth <= 12, `depth ${maxDepth} exceeds bound`)
})

test('queryRadius matches brute force for random points', () => {
  const qt = new QuadTree(0, 0, 1000, 1000)
  let seed = 42
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const pts = Array.from({ length: 500 }, () => ({ x: rnd() * 1000, y: rnd() * 1000 }))
  for (const p of pts) qt.insert(p)
  const brute = pts.filter(p => Math.hypot(p.x - 300, p.y - 300) <= 150)
  const indexed = qt.queryRadius(300, 300, 150)
  assert.equal(indexed.length, brute.length)
})
