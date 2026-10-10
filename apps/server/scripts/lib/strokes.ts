import { BrushSize, ItemKind, PaletteColor, type CanvasItem } from '@doodle/shared'
import { BOT_STROKE_DEFAULT_POINTS, FAKE_STROKE_ORIGIN, FAKE_STROKE_STEP, FAKE_STROKE_WOBBLE, STROKE_ID_PREFIX } from './constants'

interface StrokeStyle {
  color?: PaletteColor
  size?: BrushSize
}

export function strokeItem(id: string, points: number[], style: StrokeStyle = {}): CanvasItem {
  return {
    id,
    kind: ItemKind.Pen,
    color: style.color ?? PaletteColor.Red,
    size: style.size ?? BrushSize.Medium,
    points,
  }
}

let counter = 0

export function fakeStroke(points = BOT_STROKE_DEFAULT_POINTS, color = PaletteColor.Red): CanvasItem {
  return fakeStrokeWithId(`${STROKE_ID_PREFIX}${(counter++).toString(36).padStart(6, '0')}`, points, color)
}

export function fakeStrokeWithId(id: string, points = BOT_STROKE_DEFAULT_POINTS, color = PaletteColor.Red): CanvasItem {
  const coords = Array.from({ length: points }, (_, i) => [
    FAKE_STROKE_ORIGIN + i * FAKE_STROKE_STEP,
    FAKE_STROKE_ORIGIN + (i % 2) * FAKE_STROKE_WOBBLE,
  ]).flat()

  return strokeItem(id, coords, { color })
}
