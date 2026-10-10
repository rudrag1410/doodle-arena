import type { BrushSize, ItemKind, PaletteColor } from '../enums'

export interface CanvasItem {
  id: string
  kind: ItemKind
  color: PaletteColor
  size: BrushSize
  points: number[]
}

export interface CanvasOps {
  puts: CanvasItem[]
  removes: string[]
}

export interface CanvasOpsBroadcast extends CanvasOps {
  seq: number
}

export interface CanvasFull {
  seq: number
  items: CanvasItem[]
}
