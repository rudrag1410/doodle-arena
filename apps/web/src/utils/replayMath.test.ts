import { expect, test } from 'vitest'
import type { ReplayEvent } from '@doodle/shared'

import { STROKE_REPLAY } from '@/constants/timing'
import { fill, stroke } from '@/testing/canvasHarness'
import { buildTimeline, itemsAt } from './replayMath'

const long = Array.from({ length: 40 }, (_, i) => i)

test('an empty replay has only the tail', () => {
  expect(buildTimeline([])).toEqual({ timeline: [], total: STROKE_REPLAY.tailMs })
})

test('long idle gaps are compressed', () => {
  const events: ReplayEvent[] = [
    { t: 0, puts: [stroke('aaaa', [1, 2])] },
    { t: 600_000, puts: [stroke('bbbb', [3, 4])] },
  ]

  const { timeline } = buildTimeline(events)

  expect(timeline[1]?.ct).toBe(STROKE_REPLAY.maxIdleMs)
})

test('stroke duration is clamped, fills are instant', () => {
  const { timeline } = buildTimeline([
    { t: 0, d: 5, puts: [stroke('aaaa', long)] },
    { t: 10, d: 99_999, puts: [stroke('bbbb', long)] },
    { t: 20, d: 800, puts: [fill('cccc', 5, 5)] },
  ])

  expect(timeline[0]?.cd).toBe(STROKE_REPLAY.minStrokeMs)
  expect(timeline[1]?.cd).toBe(STROKE_REPLAY.maxStrokeMs)
  expect(timeline[2]?.cd).toBe(0)
})

test('itemsAt reveals a stroke progressively and then completely', () => {
  const full = stroke('aaaa', long)
  const { timeline } = buildTimeline([{ t: 0, d: 1000, puts: [full] }])
  const duration = timeline[0]?.cd ?? 1
  const start = itemsAt(timeline, 0)[0]
  const half = itemsAt(timeline, duration / 2)[0]
  const done = itemsAt(timeline, duration + 1)[0]

  expect(start?.points.length).toBeLessThan(half?.points.length ?? 0)
  expect(half?.points.length).toBeLessThan(full.points.length)
  expect(done).toBe(full)
})

test('itemsAt applies removes and keeps insertion order', () => {
  const { timeline } = buildTimeline([
    { t: 0, puts: [stroke('aaaa', [1, 2])] },
    { t: 10, puts: [stroke('bbbb', [3, 4])] },
    { t: 20, removes: ['aaaa'] },
  ])

  expect(itemsAt(timeline, 10).map((i) => i.id)).toEqual(['aaaa', 'bbbb'])
  expect(itemsAt(timeline, 1_000_000).map((i) => i.id)).toEqual(['bbbb'])
})

test('nothing is shown before the first event', () => {
  const { timeline } = buildTimeline([{ t: 5000, puts: [stroke('aaaa', [1, 2])] }])

  expect(itemsAt(timeline, -1)).toEqual([])
})
