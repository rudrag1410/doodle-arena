import { z } from 'zod'
import {
  BASE64_PATTERN,
  BrushSize,
  CANVAS_H,
  CANVAS_W,
  CanvasRejectReason,
  DashStyle,
  FillStyle,
  LIMITS,
  MAX_INDEX_LENGTH,
  MAX_ROTATION,
  MAX_SCALE,
  MAX_SEGMENTS_PER_SHAPE,
  MIN_SCALE,
  PAGE_ID,
  PaletteColor,
  POSITION_RANGE_FACTOR,
  RecordTypeName,
  SHAPE_ID_PATTERN,
  SegmentType,
  ShapeKind,
} from '@doodle/shared'
import { VALIDATION_MESSAGES as MSG } from '../constants/messages'

const segmentSchema = z
  .object({
    type: z.nativeEnum(SegmentType),
    path: z.string().regex(BASE64_PATTERN).max(LIMITS.recordBytes),
  })
  .passthrough()

const shapeSchema = z
  .object({
    id: z.string().regex(SHAPE_ID_PATTERN),
    typeName: z.literal(RecordTypeName.Shape),
    type: z.literal(ShapeKind.Draw),
    parentId: z.literal(PAGE_ID),
    x: z
      .number()
      .min(-POSITION_RANGE_FACTOR * CANVAS_W)
      .max(POSITION_RANGE_FACTOR * CANVAS_W),
    y: z
      .number()
      .min(-POSITION_RANGE_FACTOR * CANVAS_H)
      .max(POSITION_RANGE_FACTOR * CANVAS_H),
    rotation: z.number().min(-MAX_ROTATION).max(MAX_ROTATION).optional(),
    opacity: z.number().min(0).max(1).optional(),
    index: z.string().max(MAX_INDEX_LENGTH),
    props: z
      .object({
        color: z.nativeEnum(PaletteColor),
        size: z.nativeEnum(BrushSize),
        fill: z.nativeEnum(FillStyle),
        dash: z.nativeEnum(DashStyle).optional(),
        scale: z.number().min(MIN_SCALE).max(MAX_SCALE).optional(),
        segments: z.array(segmentSchema).max(MAX_SEGMENTS_PER_SHAPE),
      })
      .passthrough(),
  })
  .passthrough()

const idSchema = z.string().regex(SHAPE_ID_PATTERN)
export const isShapeId = (id: unknown): id is string => idSchema.safeParse(id).success

export type Checked =
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

export const checkShape = (rec: unknown): Checked => {
  const parsed = shapeSchema.safeParse(rec)

  if (!parsed.success) {
    const [issue] = parsed.error.issues

    return issue.code === 'too_big' && issue.path.includes('path')
      ? tooLarge()
      : { ok: false, reason: CanvasRejectReason.Invalid, message: `${issue.path.join('.')}: ${issue.message}` }
  }

  const bytes = JSON.stringify(rec).length

  return bytes > LIMITS.recordBytes ? tooLarge() : { ok: true, bytes }
}
