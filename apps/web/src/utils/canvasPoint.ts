import { clamp } from 'lodash-es'
import { CANVAS_H, CANVAS_W, POINT_PRECISION } from '@doodle/shared'

interface Box {
  left: number
  top: number
  width: number
  height: number
}

const round = (value: number) => Math.round(value * POINT_PRECISION) / POINT_PRECISION

export const toCanvasPoint = (box: Box, clientX: number, clientY: number): [number, number] => [
  round(clamp(((clientX - box.left) * CANVAS_W) / box.width, 0, CANVAS_W)),
  round(clamp(((clientY - box.top) * CANVAS_H) / box.height, 0, CANVAS_H)),
]
