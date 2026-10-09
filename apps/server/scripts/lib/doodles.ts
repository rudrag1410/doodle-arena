import { BrushSize, PaletteColor } from '@doodle/shared'
export type Pt = [number, number]
export interface Doodle {
  pts: Pt[]
  color: PaletteColor
  size: BrushSize
}
const CIRCLE_STEPS = 48
const LINE_STEPS = 14
const POLY_EDGE_STEPS = 10
export const circle = (cx: number, cy: number, r: number, n = CIRCLE_STEPS): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => [cx + r * Math.cos((i / n) * Math.PI * 2), cy + r * Math.sin((i / n) * Math.PI * 2)])
export const line = (a: Pt, b: Pt, n = LINE_STEPS): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n])
export const poly = (...pts: Pt[]): Pt[] => pts.slice(1).flatMap((_, i) => line(pts[i], pts[i + 1], POLY_EDGE_STEPS))
const { Black, Red, Orange, LightBlue, Yellow } = PaletteColor
const { Medium, Large, ExtraLarge } = BrushSize
const SUN_RAYS = 10
const sunRays = (): Doodle[] =>
  Array.from({ length: SUN_RAYS }, (_, i) => {
    const a = (i / SUN_RAYS) * Math.PI * 2
    return {
      pts: line([600 + 170 * Math.cos(a), 450 + 170 * Math.sin(a)], [600 + 280 * Math.cos(a), 450 + 280 * Math.sin(a)], 8),
      color: Orange,
      size: Large,
    }
  })
export const DOODLES: Record<string, Doodle[]> = {
  house: [
    { pts: poly([400, 450], [800, 450], [800, 750], [400, 750], [400, 450]), color: Black, size: Large },
    { pts: poly([360, 460], [600, 260], [840, 460], [360, 460]), color: Red, size: Large },
    { pts: poly([560, 750], [560, 600], [660, 600], [660, 750]), color: Orange, size: Medium },
    { pts: circle(720, 540, 28), color: LightBlue, size: Medium },
  ],
  sun: [{ pts: circle(600, 450, 130), color: Yellow, size: ExtraLarge }, ...sunRays()],
  smiley: [
    { pts: circle(600, 450, 260), color: Black, size: Large },
    { pts: circle(520, 380, 26, 20), color: Black, size: ExtraLarge },
    { pts: circle(680, 380, 26, 20), color: Black, size: ExtraLarge },
    { pts: Array.from({ length: 30 }, (_, i): Pt => [480 + (i / 29) * 240, 520 + Math.sin((i / 29) * Math.PI) * 90]), color: Red, size: Large },
  ],
}
export const DOODLE_WORDS = Object.keys(DOODLES)
export const FALLBACK_DOODLE = 'smiley'
export const BOT_NAMES = ['Mochi', 'Pixel', 'Doodlebug', 'Zig', 'Waffles', 'Nova', 'Echo', 'Biscuit'] as const
