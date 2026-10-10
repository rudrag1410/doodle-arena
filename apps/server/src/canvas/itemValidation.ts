import { z } from 'zod'
import {
  BrushSize,
  CANVAS_H,
  CANVAS_W,
  CanvasRejectReason,
  COORD_MARGIN,
  FILL_COORDS,
  ITEM_ID_PATTERN,
  ItemKind,
  LIMITS,
  MAX_COORDS_PER_ITEM,
  PaletteColor,
} from '@doodle/shared'
import { VALIDATION_MESSAGES as MSG } from '../constants/messages'

const inRange = (value: number, max: number) => value >= -COORD_MARGIN && value <= max + COORD_MARGIN

const itemSchema = z
  .object({
    id: z.string().regex(ITEM_ID_PATTERN),
    kind: z.nativeEnum(ItemKind),
    color: z.nativeEnum(PaletteColor),
    size: z.nativeEnum(BrushSize),
    points: z
      .array(z.number().finite())
      .min(2)
      .max(MAX_COORDS_PER_ITEM)
      .refine((p) => p.length % 2 === 0, 'points must come in x,y pairs')
      .refine((p) => p.every((v, i) => inRange(v, i % 2 === 0 ? CANVAS_W : CANVAS_H)), 'point outside the canvas'),
  })
  .strict()
  .refine((item) => item.kind !== ItemKind.Fill || item.points.length === FILL_COORDS, { message: 'a fill is a single point', path: ['points'] })

const idSchema = z.string().regex(ITEM_ID_PATTERN)

export const isItemId = (id: unknown): id is string => idSchema.safeParse(id).success

type Checked =
  | {
      ok: true
      bytes: number
    }
  | {
      ok: false
      reason: CanvasRejectReason.Invalid | CanvasRejectReason.TooLarge
      message: string
    }

const tooLarge = (): Checked => ({ ok: false, reason: CanvasRejectReason.TooLarge, message: MSG.strokeTooLarge })

export const checkItem = (item: unknown): Checked => {
  const parsed = itemSchema.safeParse(item)

  if (!parsed.success) {
    const issue = parsed.error.issues[0]

    if (issue?.code === 'too_big' && issue.path.includes('points')) return tooLarge()

    return { ok: false, reason: CanvasRejectReason.Invalid, message: issue ? `${issue.path.join('.')}: ${issue.message}` : parsed.error.message }
  }

  const bytes = JSON.stringify(item).length

  return bytes > LIMITS.recordBytes ? tooLarge() : { ok: true, bytes }
}
