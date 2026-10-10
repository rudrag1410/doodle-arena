import { CanvasRejectReason, LIMITS, type ReplayEvent, type CanvasItem } from '@doodle/shared'
import { REPLAY_COALESCE_MS } from '../constants/server'
import { VALIDATION_MESSAGES } from '../constants/messages'
import { checkItem, isItemId } from './itemValidation'

type ApplyResult =
  | {
      ok: true
      seq: number
      puts: CanvasItem[]
      removes: string[]
    }
  | {
      ok: false
      reason: CanvasRejectReason.Invalid | CanvasRejectReason.TooLarge
      message: string
    }

type RejectedResult = Extract<ApplyResult, { ok: false }>

export class CanvasStore {
  readonly items = new Map<string, CanvasItem>()
  private sizes = new Map<string, number>()
  private totalBytes = 0
  seq = 0
  events: ReplayEvent[] = []
  private startedAt = 0
  private lastTouched = 0

  constructor(private readonly now: () => number = Date.now) {}

  reset() {
    this.items.clear()
    this.sizes.clear()
    this.totalBytes = 0
    this.seq = 0
    this.events = []
    this.startedAt = this.now()
    this.lastTouched = 0
  }

  apply(puts: CanvasItem[], removes: string[]): ApplyResult {
    const checked = this.validate(puts, removes)

    if (!checked.ok) return checked
    for (const rec of puts) this.items.set(rec.id, rec)

    for (const [id, size] of checked.sizes) {
      this.totalBytes += size - (this.sizes.get(id) ?? 0)
      this.sizes.set(id, size)
    }

    const removed = removes.filter((id) => this.removeItem(id))

    if (puts.length === 0 && removed.length === 0) return { ok: true, seq: this.seq, puts: [], removes: [] }

    this.seq++
    this.record(puts, removed)

    return { ok: true, seq: this.seq, puts, removes: removed }
  }

  private validate(puts: CanvasItem[], removes: string[]): RejectedResult | { ok: true; sizes: Map<string, number> } {
    const sizes = new Map<string, number>()

    for (const rec of puts) {
      const c = checkItem(rec)

      if (!c.ok) return c

      sizes.set(rec.id, c.bytes)
    }

    if (!removes.every(isItemId)) return { ok: false, reason: CanvasRejectReason.Invalid, message: VALIDATION_MESSAGES.badId }

    let count = this.items.size
    let bytes = this.totalBytes

    for (const [id, size] of sizes) {
      if (!this.items.has(id)) count++

      bytes += size - (this.sizes.get(id) ?? 0)
    }

    if (count > LIMITS.canvasItems || bytes > LIMITS.canvasBytes) {
      return { ok: false, reason: CanvasRejectReason.TooLarge, message: VALIDATION_MESSAGES.canvasFull }
    }

    return { ok: true, sizes }
  }

  private removeItem(id: string): boolean {
    if (!this.items.delete(id)) return false

    this.totalBytes -= this.sizes.get(id) ?? 0
    this.sizes.delete(id)

    return true
  }

  replaceAll(items: CanvasItem[]): ApplyResult {
    const keep = new Set(items.map((s) => s.id))
    const stale = [...this.items.keys()].filter((id) => !keep.has(id))
    const probe = new CanvasStore(this.now)

    probe.startedAt = this.startedAt

    const r = probe.apply(items, [])

    if (!r.ok) return r

    return this.apply(items, stale)
  }

  private record(puts: CanvasItem[], removes: string[]) {
    if (this.events.length >= LIMITS.replayEventsPerTurn) return

    const t = this.now() - this.startedAt
    const last = this.events[this.events.length - 1]

    const latest = puts[0]

    if (last && latest && this.continuesStroke(last, puts, removes, t)) {
      last.puts = [latest]
      last.d = t - last.t
    } else {
      this.events.push({ t, ...(puts.length ? { puts } : {}), ...(removes.length ? { removes } : {}) })
    }

    this.lastTouched = t
  }

  private continuesStroke(last: ReplayEvent, puts: CanvasItem[], removes: string[], t: number): boolean {
    const sameItem = last.puts?.length === 1 && puts.length === 1 && last.puts[0]?.id === puts[0]?.id

    return sameItem && removes.length === 0 && !last.removes?.length && t - this.lastTouched < REPLAY_COALESCE_MS
  }

  snapshot(): CanvasItem[] {
    return [...this.items.values()]
  }
}
