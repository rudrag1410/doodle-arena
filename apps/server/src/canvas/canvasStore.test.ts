import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ItemKind, LIMITS, MAX_COORDS_PER_ITEM } from '@doodle/shared'
import { stroke } from '../testing/fixtures'
import { CanvasStore } from './canvasStore'
import { checkItem } from './itemValidation'

test('accepts a normal stroke and a fill', () => {
  assert.equal(checkItem(stroke('abcd1')).ok, true)
  assert.equal(checkItem(stroke('abcd2', 2, { kind: ItemKind.Fill })).ok, true)
})

test('rejects unknown kinds, extra fields and bad colours', () => {
  assert.equal(checkItem({ ...stroke('abcd1'), kind: 'text' }).ok, false)
  assert.equal(checkItem({ ...stroke('abcd1'), kind: 'embed' }).ok, false)
  assert.equal(checkItem({ ...stroke('abcd1'), color: 'hotpink' }).ok, false)
  assert.equal(checkItem({ ...stroke('abcd1'), script: '<script>' }).ok, false)
})

test('rejects malformed point data', () => {
  assert.equal(checkItem(stroke('abcd1', 3)).ok, false)
  assert.equal(checkItem(stroke('abcd1', 4, { points: [1, 2, 3, Number.NaN] })).ok, false)
  assert.equal(checkItem(stroke('abcd1', 4, { points: [1, 2, 9999, 4] })).ok, false)
  assert.equal(checkItem(stroke('abcd1', 4, { kind: ItemKind.Fill, points: [1, 2, 3, 4] })).ok, false)
})

test('rejects oversized strokes', () => {
  assert.equal(checkItem(stroke('abcd1', MAX_COORDS_PER_ITEM + 2)).ok, false)
})

test('apply is atomic: one bad item means nothing is stored', () => {
  const c = new CanvasStore()

  c.reset()

  const r = c.apply([stroke('good1'), { ...stroke('bad22'), kind: 'text' as never }], [])

  assert.equal(r.ok, false)
  assert.equal(c.items.size, 0)
})

test('seq increases and removes work', () => {
  const c = new CanvasStore()

  c.reset()

  const a = c.apply([stroke('aaaa1')], [])
  const b = c.apply([], ['aaaa1'])

  assert.ok(a.ok && b.ok && b.seq === a.seq + 1)
  assert.equal(c.items.size, 0)
})

test('item count is capped', () => {
  const c = new CanvasStore()

  c.reset()

  for (let i = 0; i < LIMITS.canvasItems; i++) assert.ok(c.apply([stroke(`s${String(i).padStart(5, '0')}`)], []).ok)

  assert.equal(c.apply([stroke('overflow1')], []).ok, false)
})

test('items keep their insertion order when a stroke grows', () => {
  const c = new CanvasStore()

  c.reset()
  c.apply([stroke('first1', 4)], [])
  c.apply([stroke('second', 4)], [])
  c.apply([stroke('first1', 8)], [])

  assert.deepEqual(
    c.snapshot().map((i) => i.id),
    ['first1', 'second'],
  )
})

test('a streamed stroke is folded into one replay event', () => {
  let now = 1000
  const c = new CanvasStore(() => now)

  c.reset()

  for (let i = 0; i < 20; i++) {
    now += 33
    c.apply([stroke('live01', 4 + i * 2)], [])
  }

  now += 2000
  c.apply([stroke('next01')], [])
  assert.equal(c.events.length, 2)
  assert.equal(c.events[0]?.puts?.[0]?.id, 'live01')
  assert.ok((c.events[0]?.d ?? 0) > 500)
})
