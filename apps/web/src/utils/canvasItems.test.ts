import { expect, test } from 'vitest'

import { stroke } from '@/testing/canvasHarness'
import { applyOps, extendsItem, sameItem } from './canvasItems'

test('applyOps appends new items and keeps draw order', () => {
  const next = applyOps([stroke('aaaa', [1, 2])], [stroke('bbbb', [3, 4])], [])

  expect(next.map((i) => i.id)).toEqual(['aaaa', 'bbbb'])
})

test('applyOps replaces a grown stroke in place', () => {
  const items = [stroke('aaaa', [1, 2]), stroke('bbbb', [3, 4])]
  const next = applyOps(items, [stroke('aaaa', [1, 2, 5, 6])], [])

  expect(next.map((i) => i.id)).toEqual(['aaaa', 'bbbb'])
  expect(next[0]?.points).toEqual([1, 2, 5, 6])
})

test('applyOps removes by id and ignores unknown ids', () => {
  const next = applyOps([stroke('aaaa', [1, 2]), stroke('bbbb', [3, 4])], [], ['aaaa', 'nope'])

  expect(next.map((i) => i.id)).toEqual(['bbbb'])
})

test('applyOps does not mutate its input', () => {
  const items = [stroke('aaaa', [1, 2])]

  applyOps(items, [stroke('bbbb', [3, 4])], ['aaaa'])

  expect(items).toHaveLength(1)
})

test('sameItem compares identity, length and the last point', () => {
  const a = stroke('aaaa', [1, 2, 3, 4])

  expect(sameItem(a, a)).toBe(true)
  expect(sameItem(a, stroke('aaaa', [1, 2, 3, 4]))).toBe(true)
  expect(sameItem(a, stroke('aaaa', [1, 2, 3, 5]))).toBe(false)
  expect(sameItem(a, stroke('aaaa', [1, 2, 3, 4, 5, 6]))).toBe(false)
  expect(sameItem(a, stroke('bbbb', [1, 2, 3, 4]))).toBe(false)
  expect(sameItem(a, undefined)).toBe(false)
})

test('extendsItem is true only for a longer stroke that keeps its prefix', () => {
  const before = stroke('aaaa', [1, 2, 3, 4])

  expect(extendsItem(before, stroke('aaaa', [1, 2, 3, 4, 5, 6]))).toBe(true)
  expect(extendsItem(before, stroke('aaaa', [1, 2, 9, 9, 5, 6]))).toBe(false)
  expect(extendsItem(before, stroke('aaaa', [1, 2, 3, 4]))).toBe(false)
  expect(extendsItem(before, stroke('bbbb', [1, 2, 3, 4, 5, 6]))).toBe(false)
  expect(extendsItem(before, stroke('aaaa', [1, 2, 3, 4, 5, 6], { color: 'red' as never }))).toBe(false)
})
