import {
  BACKGROUND_COLOR,
  BRUSH_SIZES,
  CANVAS_H,
  CANVAS_W,
  ERASER_WIDTH_FACTOR,
  FILL_TOLERANCE,
  ItemKind,
  PALETTE,
  type CanvasItem,
} from '@doodle/shared'

const COLORS = new Map<string, string>(PALETTE.map((c) => [c.id, c.hex]))
const WIDTHS = new Map<string, number>(BRUSH_SIZES.map((s) => [s.id, s.width]))
const RGB_CHANNELS = 3
const SAME_COLOUR_DISTANCE = 6
const DILATE_PASSES = 2
const DILATE_DISTANCE = 400

type Context = CanvasRenderingContext2D

export const clearCanvas = (ctx: Context) => {
  ctx.fillStyle = BACKGROUND_COLOR
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
}

const hexToRgb = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.slice(1), 16)

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

const drawStroke = (ctx: Context, item: CanvasItem, fromPoint: number) => {
  const { points } = item
  const count = points.length / 2
  const eraser = item.kind === ItemKind.Eraser
  const color = eraser ? BACKGROUND_COLOR : (COLORS.get(item.color) ?? BACKGROUND_COLOR)
  const width = (WIDTHS.get(item.size) ?? 1) * (eraser ? ERASER_WIDTH_FACTOR : 1)
  const x = (i: number) => points[i * 2] ?? 0
  const y = (i: number) => points[i * 2 + 1] ?? 0

  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = color
  ctx.fillStyle = color

  if (count === 1) {
    ctx.beginPath()
    ctx.arc(x(0), y(0), width / 2, 0, Math.PI * 2)
    ctx.fill()

    return
  }

  const start = Math.max(0, fromPoint)

  ctx.beginPath()

  if (start === 0) ctx.moveTo(x(0), y(0))
  else ctx.moveTo((x(start - 1) + x(start)) / 2, (y(start - 1) + y(start)) / 2)

  for (let i = Math.max(start, 1); i < count - 1; i++) {
    ctx.quadraticCurveTo(x(i), y(i), (x(i) + x(i + 1)) / 2, (y(i) + y(i + 1)) / 2)
  }

  ctx.lineTo(x(count - 1), y(count - 1))
  ctx.stroke()
}

interface Raster {
  data: Uint8ClampedArray
  seen: Uint8Array
  target: [number, number, number]
}

const distanceFrom = ({ data, target }: Raster, pixel: number) => {
  const offset = pixel * 4

  return Math.abs((data[offset] ?? 0) - target[0]) + Math.abs((data[offset + 1] ?? 0) - target[1]) + Math.abs((data[offset + 2] ?? 0) - target[2])
}

const paint = (raster: Raster, pixel: number, [r, g, b]: [number, number, number]) => {
  const offset = pixel * 4

  raster.data[offset] = r
  raster.data[offset + 1] = g
  raster.data[offset + 2] = b
  raster.seen[pixel] = 1
}

const isOpen = (raster: Raster, pixel: number) => !raster.seen[pixel] && distanceFrom(raster, pixel) <= FILL_TOLERANCE * RGB_CHANNELS

const scanRegion = (raster: Raster, sx: number, sy: number, rgb: [number, number, number]): number[] => {
  const region: number[] = []
  const stack: number[] = [sx, sy]

  const sweep = (row: number, px: number, flag: boolean, push: (x: number, y: number) => void) => {
    const free = isOpen(raster, row * CANVAS_W + px)

    if (free && !flag) push(px, row)

    return free
  }

  while (stack.length) {
    const cy = stack.pop() ?? 0
    const cx = stack.pop() ?? 0
    let left = cx

    while (left >= 0 && isOpen(raster, cy * CANVAS_W + left)) left--

    let above = false
    let below = false

    for (let px = left + 1; px < CANVAS_W && isOpen(raster, cy * CANVAS_W + px); px++) {
      paint(raster, cy * CANVAS_W + px, rgb)
      region.push(cy * CANVAS_W + px)

      if (cy > 0) above = sweep(cy - 1, px, above, (x, y) => stack.push(x, y))
      if (cy < CANVAS_H - 1) below = sweep(cy + 1, px, below, (x, y) => stack.push(x, y))
    }
  }

  return region
}

const neighboursOf = (pixel: number): number[] => {
  const column = pixel % CANVAS_W

  return [column > 0 ? pixel - 1 : -1, column < CANVAS_W - 1 ? pixel + 1 : -1, pixel - CANVAS_W, pixel + CANVAS_W].filter(
    (n) => n >= 0 && n < CANVAS_W * CANVAS_H,
  )
}

const dilate = (raster: Raster, region: number[], rgb: [number, number, number]) => {
  let frontier = region

  for (let pass = 0; pass < DILATE_PASSES; pass++) {
    const added: number[] = []

    for (const pixel of frontier) {
      for (const n of neighboursOf(pixel)) {
        if (raster.seen[n] || distanceFrom(raster, n) > DILATE_DISTANCE) continue

        paint(raster, n, rgb)
        added.push(n)
      }
    }

    frontier = added
  }
}

const floodFill = (ctx: Context, item: CanvasItem) => {
  const sx = Math.round(item.points[0] ?? -1)
  const sy = Math.round(item.points[1] ?? -1)

  if (sx < 0 || sy < 0 || sx >= CANVAS_W || sy >= CANVAS_H) return

  const image = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H)
  const origin = (sy * CANVAS_W + sx) * 4
  const rgb = hexToRgb(COLORS.get(item.color) ?? BACKGROUND_COLOR)

  const raster: Raster = {
    data: image.data,
    seen: new Uint8Array(CANVAS_W * CANVAS_H),
    target: [image.data[origin] ?? 0, image.data[origin + 1] ?? 0, image.data[origin + 2] ?? 0],
  }

  const sameAsTarget = Math.abs(rgb[0] - raster.target[0]) + Math.abs(rgb[1] - raster.target[1]) + Math.abs(rgb[2] - raster.target[2])

  if (sameAsTarget < SAME_COLOUR_DISTANCE) return

  dilate(raster, scanRegion(raster, sx, sy, rgb), rgb)
  ctx.putImageData(image, 0, 0)
}

export const drawItem = (ctx: Context, item: CanvasItem, fromPoint = 0) => {
  if (item.kind === ItemKind.Fill) floodFill(ctx, item)
  else drawStroke(ctx, item, fromPoint)
}
