import { expect, test } from 'vitest'
import { CANVAS_H, CANVAS_W } from '@doodle/shared'

import { toCanvasPoint } from './canvasPoint'

const box = { left: 100, top: 50, width: 600, height: 450 }

test('screen positions are scaled onto the 1200 x 900 sheet', () => {
  expect(toCanvasPoint(box, 100, 50)).toEqual([0, 0])
  expect(toCanvasPoint(box, 400, 275)).toEqual([600, 450])
  expect(toCanvasPoint(box, 700, 500)).toEqual([CANVAS_W, CANVAS_H])
})

test('points dragged past the edge stay on the sheet', () => {
  expect(toCanvasPoint(box, -500, -500)).toEqual([0, 0])
  expect(toCanvasPoint(box, 9999, 9999)).toEqual([CANVAS_W, CANVAS_H])
  expect(toCanvasPoint(box, 50, 275)).toEqual([0, 450])
})

test('coordinates are rounded to one decimal', () => {
  const [x, y] = toCanvasPoint(box, 133.337, 61.111)

  expect(x).toBe(Math.round(x * 10) / 10)
  expect(y).toBe(Math.round(y * 10) / 10)
})

test('a high-DPI or scaled board maps the same way', () => {
  expect(toCanvasPoint({ left: 0, top: 0, width: 1200, height: 900 }, 321, 654)).toEqual([321, 654])
})
