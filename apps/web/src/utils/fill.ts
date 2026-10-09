import { maxBy } from 'lodash-es'
import { b64Vecs, type Editor, type TLShapeId, type VecLike } from 'tldraw'
import {
  BACKGROUND_PADDING,
  BACKGROUND_POINT_STEP,
  BACKGROUND_SHAPE_ID,
  BrushSize,
  CANVAS_H,
  CANVAS_W,
  DEFAULT_PRESSURE,
  FillStyle,
  SegmentType,
  ShapeKind,
  type PaletteColor,
} from '@doodle/shared'

import { FILL_HIT_MARGIN } from '@/constants/board'

const BG_ID = BACKGROUND_SHAPE_ID as TLShapeId

export function bucketFill(editor: Editor, point: VecLike, color: PaletteColor) {
  const closedShapes = editor.getShapesAtPoint(point, { hitInside: true, margin: FILL_HIT_MARGIN }).filter(
    (s) =>
      s.type === ShapeKind.Draw &&
      s.id !== BG_ID &&
      (
        s.props as {
          isClosed?: boolean
        }
      ).isClosed,
  )

  const target = maxBy(closedShapes, (s) => s.index)

  if (target) {
    editor.updateShape({ id: target.id, type: ShapeKind.Draw, props: { fill: FillStyle.Fill, color } })

    return
  }

  washBackground(editor, color)
}

function borderPoints(width: number, height: number) {
  const step = BACKGROUND_POINT_STEP
  const pt = (x: number, y: number) => ({ x, y, z: DEFAULT_PRESSURE })
  const pts = []

  for (let x = 0; x <= width; x += step) pts.push(pt(x, 0))
  for (let y = step; y <= height; y += step) pts.push(pt(width, y))
  for (let x = width - step; x >= 0; x -= step) pts.push(pt(x, height))
  for (let y = height - step; y >= 0; y -= step) pts.push(pt(0, y))

  return pts
}

function washBackground(editor: Editor, color: PaletteColor) {
  const update = (partial: Record<string, unknown>) =>
    editor.run(() => editor.updateShape({ id: BG_ID, type: ShapeKind.Draw, ...partial }), { ignoreShapeLock: true })

  if (editor.getShape(BG_ID)) return void update({ props: { color, fill: FillStyle.Fill } })

  const width = CANVAS_W + BACKGROUND_PADDING * 2
  const height = CANVAS_H + BACKGROUND_PADDING * 2

  editor.createShape({
    id: BG_ID,
    type: ShapeKind.Draw,
    x: -BACKGROUND_PADDING,
    y: -BACKGROUND_PADDING,
    props: {
      color,
      fill: FillStyle.Fill,
      size: BrushSize.ExtraLarge,
      isClosed: true,
      isComplete: true,
      segments: [{ type: SegmentType.Free, path: b64Vecs.encodePoints(borderPoints(width, height)) }],
    },
  })

  editor.sendToBack([BG_ID])
  update({ isLocked: true })
}
