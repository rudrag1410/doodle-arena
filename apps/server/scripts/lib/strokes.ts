import { BrushSize, DashStyle, FillStyle, PAGE_ID, PaletteColor, RecordTypeName, SegmentType, ShapeKind, type ShapeRecord } from '@doodle/shared'
import { BOT_STROKE_DEFAULT_POINTS, PATH_FILL_BYTE, PATH_FIRST_POINT_BYTES, PATH_POINT_BYTES, STROKE_ID_PREFIX } from './constants'

export interface StrokeStyle {
  color?: PaletteColor
  size?: BrushSize
  fill?: FillStyle
}

export function strokeRecord(id: string, path: string, style: StrokeStyle = {}, extra: Partial<ShapeRecord> = {}): ShapeRecord {
  return {
    id,
    typeName: RecordTypeName.Shape,
    type: ShapeKind.Draw,
    x: 100,
    y: 100,
    rotation: 0,
    index: 'a1',
    parentId: PAGE_ID,
    isLocked: false,
    opacity: 1,
    meta: {},
    props: {
      color: style.color ?? PaletteColor.Red,
      size: style.size ?? BrushSize.Medium,
      fill: style.fill ?? FillStyle.None,
      dash: DashStyle.Draw,
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      segments: [{ type: SegmentType.Free, path }],
      isComplete: true,
      isClosed: false,
      isPen: false,
    },
    ...extra,
  }
}

let counter = 0

export function fakeStroke(points = BOT_STROKE_DEFAULT_POINTS, color = PaletteColor.Red): ShapeRecord {
  return fakeStrokeWithId(`shape:${STROKE_ID_PREFIX}${(counter++).toString(36).padStart(6, '0')}`, points, color)
}

export function fakeStrokeWithId(id: string, points = BOT_STROKE_DEFAULT_POINTS, color = PaletteColor.Red): ShapeRecord {
  const path = Buffer.alloc(PATH_FIRST_POINT_BYTES + points * PATH_POINT_BYTES, PATH_FILL_BYTE).toString('base64')

  return strokeRecord(id, path, { color })
}
