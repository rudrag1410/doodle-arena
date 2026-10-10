import { clamp } from 'lodash-es'
import { ItemKind, type CanvasItem, type ReplayEvent } from '@doodle/shared'

import { STROKE_REPLAY } from '@/constants/timing'

interface TimelineEvent {
  ct: number
  cd: number
  puts: CanvasItem[]
  removes: string[]
}

const MIN_POINTS = 1

const isStroke = (item: CanvasItem) => item.kind !== ItemKind.Fill

export function buildTimeline(events: ReplayEvent[]): {
  timeline: TimelineEvent[]
  total: number
} {
  const { maxIdleMs, minStrokeMs, maxStrokeMs, tailMs } = STROKE_REPLAY
  const timeline: TimelineEvent[] = []
  let cursor = 0
  let prevEnd = events[0]?.t ?? 0

  for (const e of events) {
    cursor += clamp(e.t - prevEnd, 0, maxIdleMs)

    const cd = e.d && e.puts?.some(isStroke) ? clamp(e.d, minStrokeMs, maxStrokeMs) : 0

    timeline.push({ ct: cursor, cd, puts: e.puts ?? [], removes: e.removes ?? [] })
    cursor += cd
    prevEnd = e.t + (e.d ?? 0)
  }

  return { timeline, total: cursor + tailMs }
}

const partialItem = (item: CanvasItem, fraction: number): CanvasItem => {
  const pairs = item.points.length / 2
  const keep = Math.max(MIN_POINTS, Math.ceil(pairs * fraction))

  return { ...item, points: item.points.slice(0, keep * 2) }
}

export function itemsAt(timeline: TimelineEvent[], t: number): CanvasItem[] {
  const out = new Map<string, CanvasItem>()

  for (const ev of timeline) {
    if (ev.ct > t) break

    ev.removes.forEach((id) => out.delete(id))

    const running = ev.cd > 0 && t < ev.ct + ev.cd

    for (const item of ev.puts) out.set(item.id, running && isStroke(item) ? partialItem(item, (t - ev.ct) / ev.cd) : item)
  }

  return [...out.values()]
}
