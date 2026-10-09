import type { ShapeRecord } from './canvas'

export interface ReplayEvent {
  t: number
  d?: number
  puts?: ShapeRecord[]
  removes?: string[]
}

export interface ReplayTurn {
  round: number
  drawerId: string
  drawerName: string
  drawerAvatar: number
  word: string
  durationMs: number
  events: ReplayEvent[]
}
