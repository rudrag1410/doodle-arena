import { ceil, clamp, sumBy } from 'lodash-es'
import { b64Vecs } from 'tldraw'
import { ShapeKind, type ReplayEvent, type SegmentType, type ShapeRecord } from '@doodle/shared'

import { STROKE_REPLAY } from '@/constants/timing'

interface TimelineEvent {
  ct: number
  cd: number
  puts: ShapeRecord[]
  removes: string[]
}

type Segment = {
  type: SegmentType
  path: string
  dim?: 2 | 3
}

const isStroke = (r: ShapeRecord) =>
  r.type === ShapeKind.Draw &&
  (
    r.props as
      | {
          isComplete?: boolean
        }
      | undefined
  )?.isComplete !== undefined

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

function partialStroke(rec: ShapeRecord, frac: number): ShapeRecord {
  const props = rec.props as {
    segments: Segment[]
  }

  const decoded = props.segments.map((s) => b64Vecs.decodePoints(s.path, s.dim))
  const total = sumBy(decoded, 'length')
  const MIN_POINTS = 2
  let keep = Math.max(MIN_POINTS, ceil(total * frac))
  const segments: Segment[] = []

  props.segments.forEach((seg, i) => {
    if (keep <= 0) return

    const pts = decoded[i]?.slice(0, keep) ?? []

    keep -= pts.length

    if (pts.length) segments.push({ ...seg, path: b64Vecs.encodePoints(pts, seg.dim) })
  })

  return { ...rec, props: { ...(rec.props as object), segments, isComplete: false, isClosed: false } } as ShapeRecord
}

export function shapesAt(timeline: TimelineEvent[], t: number): Map<string, ShapeRecord> {
  const out = new Map<string, ShapeRecord>()

  for (const ev of timeline) {
    if (ev.ct > t) break

    ev.removes.forEach((id) => out.delete(id))

    const running = ev.cd > 0 && t < ev.ct + ev.cd

    for (const rec of ev.puts) out.set(rec.id, running ? partialStroke(rec, (t - ev.ct) / ev.cd) : rec)
  }

  return out
}
