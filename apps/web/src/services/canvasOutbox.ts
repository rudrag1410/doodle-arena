import { chunk, throttle } from 'lodash-es'
import { ClientEvent, LIMITS, type CanvasItem } from '@doodle/shared'

import { BOARD_FLUSH_MS } from '@/constants/timing'
import { socket } from '@/services/socket'

export class CanvasOutbox {
  private readonly pending = new Map<string, CanvasItem | null>()

  private readonly throttledFlush = throttle(() => this.send(), BOARD_FLUSH_MS, { leading: false, trailing: true })

  put(item: CanvasItem) {
    this.pending.set(item.id, item)
    this.throttledFlush()
  }

  remove(ids: string[]) {
    ids.forEach((id) => this.pending.set(id, null))
    this.throttledFlush()
  }

  flush() {
    this.throttledFlush.flush()
  }

  discard() {
    this.throttledFlush.cancel()
    this.pending.clear()
  }

  resync(items: CanvasItem[]) {
    this.pending.clear()
    socket.emit(ClientEvent.CanvasFull, { items })
  }

  private send() {
    const entries = [...this.pending]

    this.pending.clear()

    if (!entries.length) return

    const puts = entries.flatMap(([, item]) => (item ? [item] : []))
    const removes = entries.flatMap(([id, item]) => (item ? [] : [id]))

    const batches = chunk(puts, LIMITS.opsPerMessage)

    ;(batches.length ? batches : [[]]).forEach((batch, i) => {
      socket.volatile.emit(ClientEvent.CanvasOps, { puts: batch, removes: i === 0 ? removes : [] })
    })
  }
}
