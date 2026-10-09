import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LIMITS } from '@doodle/shared'
import { stroke } from '../testing/fixtures'
import { CanvasStore } from './canvasStore'
import { checkShape } from './shapeValidation'

test('accepts a normal stroke', () => {
  assert.equal(checkShape(stroke('abcd1')).ok, true)
})

test('rejects anything that is not a draw shape', () => {
  assert.equal(checkShape({ ...stroke('abcd1'), type: 'text' }).ok, false)
  assert.equal(checkShape({ ...stroke('abcd1'), type: 'embed' }).ok, false)
  assert.equal(checkShape({ ...stroke('abcd1'), parentId: 'shape:other' }).ok, false)
})

test('rejects bad colours, huge strokes and non-base64 paths', () => {
  assert.equal(checkShape(stroke('abcd1', 'AAAA', { color: 'hotpink' })).ok, false)
  assert.equal(checkShape(stroke('abcd1', '<script>')).ok, false)

  const big = stroke('abcd1', 'A'.repeat(LIMITS.recordBytes + 1))

  assert.equal(checkShape(big).ok, false)
})

test('apply is atomic: one bad record means nothing is stored', () => {
  const c = new CanvasStore()

  c.reset()

  const r = c.apply([stroke('good1'), { ...stroke('bad22'), type: 'text' }], [])

  assert.equal(r.ok, false)
  assert.equal(c.shapes.size, 0)
})

test('seq increases and removes work', () => {
  const c = new CanvasStore()

  c.reset()

  const a = c.apply([stroke('aaaa1')], [])
  const b = c.apply([], ['shape:aaaa1'])

  assert.ok(a.ok && b.ok && b.seq === a.seq + 1)
  assert.equal(c.shapes.size, 0)
})

test('shape count is capped', () => {
  const c = new CanvasStore()

  c.reset()

  for (let i = 0; i < LIMITS.canvasShapes; i++) assert.ok(c.apply([stroke(`s${String(i).padStart(5, '0')}`)], []).ok)

  assert.equal(c.apply([stroke('overflow1')], []).ok, false)
})

test('a streamed stroke is folded into one replay event', () => {
  let now = 1000
  const c = new CanvasStore(() => now)

  c.reset()

  for (let i = 0; i < 20; i++) {
    now += 33
    c.apply([stroke('live01', 'A'.repeat(4 + i * 4))], [])
  }

  now += 2000
  c.apply([stroke('next01')], [])
  assert.equal(c.events.length, 2)
  assert.equal(c.events[0].puts?.[0].id, 'shape:live01')
  assert.ok((c.events[0].d ?? 0) > 500)
})
