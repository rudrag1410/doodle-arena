import { ServerEvent, type CanvasFull, type CanvasOpsBroadcast, type CanvasRejectReason, type ShapeRecord } from '@doodle/shared'
import { socket } from './socket'
export interface CanvasListener {
  full: (shapes: ShapeRecord[]) => void
  ops: (puts: ShapeRecord[], removes: string[]) => void
  reject: (reason: CanvasRejectReason, message: string) => void
}
class CanvasBus {
  readonly mirror = new Map<string, ShapeRecord>()
  seq = 0
  private listeners = new Set<CanvasListener>()
  constructor() {
    socket.on(ServerEvent.CanvasFull, (p: CanvasFull) => {
      this.mirror.clear()
      p.shapes.forEach((s) => this.mirror.set(s.id, s))
      this.seq = p.seq
      this.listeners.forEach((l) => l.full(p.shapes))
    })
    socket.on(ServerEvent.CanvasOps, (p: CanvasOpsBroadcast) => {
      p.puts.forEach((s) => this.mirror.set(s.id, s))
      p.removes.forEach((id) => this.mirror.delete(id))
      this.seq = p.seq
      this.listeners.forEach((l) => l.ops(p.puts, p.removes))
    })
    socket.on(ServerEvent.CanvasReject, (p) => this.listeners.forEach((l) => l.reject(p.reason, p.message)))
  }
  subscribe(l: CanvasListener): () => void {
    this.listeners.add(l)
    return () => this.listeners.delete(l)
  }
  snapshot(): ShapeRecord[] {
    return [...this.mirror.values()]
  }
  clear() {
    this.mirror.clear()
    this.seq = 0
  }
}
export const canvasBus = new CanvasBus()
