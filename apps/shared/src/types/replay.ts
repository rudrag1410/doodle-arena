import type { CanvasItem } from './canvas'

export interface ReplayEvent {
  t: number
  d?: number
  puts?: CanvasItem[]
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
