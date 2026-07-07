import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveShape, circle, star } from '../src/shapes.js'

test('prototype-chain keys fall back to circle', () => {
  assert.equal(resolveShape('__proto__'), circle)
  assert.equal(resolveShape('constructor'), circle)
  assert.equal(resolveShape('hasOwnProperty'), circle)
})

test('known names and functions resolve as before', () => {
  assert.equal(resolveShape('star'), star)
  const fn = () => {}
  assert.equal(resolveShape(fn), fn)
  assert.equal(resolveShape('nope'), circle)
})
