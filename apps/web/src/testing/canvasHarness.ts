import { createCanvas, type Canvas } from '@napi-rs/canvas'
import { BrushSize, CANVAS_H, CANVAS_W, ItemKind, PaletteColor, type CanvasItem } from '@doodle/shared'

export const newCanvas = (): Canvas => createCanvas(CANVAS_W, CANVAS_H)

type Drawable = Canvas | HTMLCanvasElement

const contextOf = (canvas: Drawable) => {
  const ctx = canvas.getContext('2d')

  if (!ctx) throw new Error('2d context unavailable')

  return ctx
}

export const pixelAt = (canvas: Drawable, x: number, y: number): [number, number, number] => {
  const data = contextOf(canvas).getImageData(x, y, 1, 1).data

  return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0]
}

export const imageData = (canvas: Drawable) => contextOf(canvas).getImageData(0, 0, CANVAS_W, CANVAS_H).data

export const stroke = (id: string, points: number[], extra: Partial<CanvasItem> = {}): CanvasItem => ({
  id,
  kind: ItemKind.Pen,
  color: PaletteColor.Black,
  size: BrushSize.Medium,
  points,
  ...extra,
})

export const fill = (id: string, x: number, y: number, color = PaletteColor.Red): CanvasItem => ({
  id,
  kind: ItemKind.Fill,
  color,
  size: BrushSize.Medium,
  points: [x, y],
})

const SAMPLE_SPACING = 6

const edge = (ax: number, ay: number, bx: number, by: number): number[] => {
  const steps = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / SAMPLE_SPACING))

  return Array.from({ length: steps }, (_, i) => [ax + ((bx - ax) * (i + 1)) / steps, ay + ((by - ay) * (i + 1)) / steps]).flat()
}

export const rectangle = (id: string, [x1, y1, x2, y2]: [number, number, number, number], extra: Partial<CanvasItem> = {}): CanvasItem =>
  stroke(id, [x1, y1, ...edge(x1, y1, x2, y1), ...edge(x2, y1, x2, y2), ...edge(x2, y2, x1, y2), ...edge(x1, y2, x1, y1)], extra)

export const circle = (id: string, cx: number, cy: number, r: number, extra: Partial<CanvasItem> = {}): CanvasItem =>
  stroke(
    id,
    Array.from({ length: 49 }, (_, i) => [cx + r * Math.cos((i / 48) * Math.PI * 2), cy + r * Math.sin((i / 48) * Math.PI * 2)]).flat(),
    extra,
  )

export const differingPixels = (a: Uint8ClampedArray, b: Uint8ClampedArray, tolerance = 24): number => {
  let count = 0

  for (let i = 0; i < a.length; i += 4) {
    if (Math.abs((a[i] ?? 0) - (b[i] ?? 0)) > tolerance || Math.abs((a[i + 1] ?? 0) - (b[i + 1] ?? 0)) > tolerance) count++
  }

  return count
}
