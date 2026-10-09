export type ShapeRecord = {
  id: string
  [key: string]: unknown
}
export interface CanvasOps {
  puts: ShapeRecord[]
  removes: string[]
}
export interface CanvasOpsBroadcast extends CanvasOps {
  seq: number
}
export interface CanvasFull {
  seq: number
  shapes: ShapeRecord[]
}
