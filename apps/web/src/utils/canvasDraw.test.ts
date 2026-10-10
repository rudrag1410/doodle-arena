import { PALETTE, PaletteColor, ItemKind, BrushSize } from '@doodle/shared'
import { expect, test } from 'vitest'

import { circle, fill, newCanvas, pixelAt, rectangle, stroke } from '@/testing/canvasHarness'
import { clearCanvas, drawItem } from './canvasDraw'

const hex = (id: PaletteColor) => {
  const value = Number.parseInt(PALETTE.find((c) => c.id === id)?.hex.slice(1) ?? '0', 16)

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

const setup = () => {
  const canvas = newCanvas()
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D

  clearCanvas(ctx)

  return { canvas, ctx }
}

test('the sheet starts white', () => {
  const { canvas } = setup()

  expect(pixelAt(canvas, 10, 10)).toEqual([255, 255, 255])
})

test('a pen stroke paints its palette colour along the line and nowhere else', () => {
  const { canvas, ctx } = setup()

  drawItem(ctx, stroke('aaaa', [100, 300, 500, 300, 900, 300], { color: PaletteColor.Red }))

  expect(pixelAt(canvas, 500, 300)).toEqual(hex(PaletteColor.Red))
  expect(pixelAt(canvas, 500, 340)).toEqual([255, 255, 255])
})

test('brush sizes change the line width', () => {
  const { canvas, ctx } = setup()

  drawItem(ctx, stroke('aaaa', [100, 200, 900, 200], { size: BrushSize.Small }))
  drawItem(ctx, stroke('bbbb', [100, 400, 900, 400], { size: BrushSize.ExtraLarge }))

  expect(pixelAt(canvas, 500, 208)).toEqual([255, 255, 255])
  expect(pixelAt(canvas, 500, 410)).not.toEqual([255, 255, 255])
})

test('a single point draws a dot', () => {
  const { canvas, ctx } = setup()

  drawItem(ctx, stroke('aaaa', [300, 300], { size: BrushSize.ExtraLarge }))

  expect(pixelAt(canvas, 300, 300)).toEqual(hex(PaletteColor.Black))
})

test('the eraser paints the background over earlier strokes', () => {
  const { canvas, ctx } = setup()

  drawItem(ctx, stroke('aaaa', [100, 300, 900, 300]))
  drawItem(ctx, stroke('bbbb', [300, 300, 600, 300], { kind: ItemKind.Eraser }))

  expect(pixelAt(canvas, 450, 300)).toEqual([255, 255, 255])
  expect(pixelAt(canvas, 800, 300)).toEqual(hex(PaletteColor.Black))
})

test('fill colours only the enclosed area and keeps the outline', () => {
  const { canvas, ctx } = setup()

  drawItem(ctx, rectangle('box1', [300, 300, 700, 600]))
  drawItem(ctx, fill('fill', 500, 450, PaletteColor.Orange))

  expect(pixelAt(canvas, 500, 450)).toEqual(hex(PaletteColor.Orange))
  expect(pixelAt(canvas, 900, 450)).toEqual([255, 255, 255])
  expect(pixelAt(canvas, 500, 300)).toEqual(hex(PaletteColor.Black))
})

test('fill leaves no white fringe along an anti-aliased circle', () => {
  const { canvas, ctx } = setup()

  drawItem(ctx, circle('ring', 600, 450, 200, { size: BrushSize.Small }))
  drawItem(ctx, fill('fill', 600, 450, PaletteColor.Green))

  const orange = hex(PaletteColor.Green)
  let fringe = 0

  for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
    const [r, g, b] = pixelAt(canvas, Math.round(600 + 196 * Math.cos(angle)), Math.round(450 + 196 * Math.sin(angle)))

    if (r > 235 && g > 235 && b > 235) fringe++
  }

  expect(pixelAt(canvas, 600, 450)).toEqual(orange)
  expect(fringe).toBe(0)
})

test('filling an empty sheet floods the whole sheet', () => {
  const { canvas, ctx } = setup()

  drawItem(ctx, fill('fill', 10, 10, PaletteColor.Blue))

  expect(pixelAt(canvas, 1190, 890)).toEqual(hex(PaletteColor.Blue))
})

test('filling with the colour already there changes nothing', () => {
  const { canvas, ctx } = setup()

  drawItem(ctx, fill('f1', 10, 10, PaletteColor.Blue))
  drawItem(ctx, fill('f2', 600, 450, PaletteColor.Blue))

  expect(pixelAt(canvas, 600, 450)).toEqual(hex(PaletteColor.Blue))
})

test('a fill outside the sheet is ignored', () => {
  const { canvas, ctx } = setup()

  drawItem(ctx, fill('fill', -5, 99999, PaletteColor.Red))

  expect(pixelAt(canvas, 10, 10)).toEqual([255, 255, 255])
})

test('fill is replayed in order: a later stroke paints over an earlier fill', () => {
  const { canvas, ctx } = setup()

  drawItem(ctx, fill('f1', 10, 10, PaletteColor.Yellow))
  drawItem(ctx, stroke('aaaa', [100, 300, 900, 300], { color: PaletteColor.Black }))

  expect(pixelAt(canvas, 10, 10)).toEqual(hex(PaletteColor.Yellow))
  expect(pixelAt(canvas, 500, 300)).toEqual(hex(PaletteColor.Black))
})

test('a fill finishes quickly', () => {
  const { ctx } = setup()
  const started = performance.now()

  drawItem(ctx, fill('fill', 10, 10, PaletteColor.Red))

  expect(performance.now() - started).toBeLessThan(750)
})
