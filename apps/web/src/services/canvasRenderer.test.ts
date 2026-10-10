import { PaletteColor } from '@doodle/shared'
import { expect, test } from 'vitest'

import { circle, differingPixels, fill, imageData, newCanvas, pixelAt, rectangle, stroke } from '@/testing/canvasHarness'
import { CanvasRenderer } from './canvasRenderer'

const ANTI_ALIAS_SHADE = 90
const MAX_INK_DRIFT = 0.02

const inkOf = (data: Uint8ClampedArray) => {
  let ink = 0

  for (let i = 0; i < data.length; i += 4) if ((data[i] ?? 255) < 250) ink++

  return ink
}

const renderer = () => new CanvasRenderer(newCanvas() as unknown as HTMLCanvasElement)

test('streaming a stroke in pieces looks the same as drawing it at once', () => {
  const full = Array.from({ length: 220 }, (_, i) => [100 + i * 4, 450 + Math.sin(i / 22) * 200]).flat()
  const live = renderer()

  for (let n = 4; n <= full.length; n += 8) live.setItems([stroke('wave', full.slice(0, n))])

  live.setItems([stroke('wave', full)])

  const once = renderer()

  once.setItems([stroke('wave', full)])

  const streamed = imageData(live.canvas)
  const direct = imageData(once.canvas)

  expect(differingPixels(streamed, direct, ANTI_ALIAS_SHADE)).toBe(0)
  expect(Math.abs(inkOf(streamed) - inkOf(direct)) / inkOf(direct)).toBeLessThan(MAX_INK_DRIFT)
})

test('appending an item draws it without disturbing earlier ones', () => {
  const r = renderer()
  const a = stroke('aaaa', [100, 200, 900, 200])

  r.setItems([a])
  r.setItems([a, stroke('bbbb', [100, 500, 900, 500], { color: PaletteColor.Red })])

  expect(pixelAt(r.canvas, 500, 200)).toEqual([29, 29, 29])
  expect(pixelAt(r.canvas, 500, 500)).toEqual([224, 49, 49])
})

test('removing the last item (undo) restores the sheet', () => {
  const r = renderer()
  const a = stroke('aaaa', [100, 200, 900, 200])

  r.setItems([a, stroke('bbbb', [100, 500, 900, 500])])
  r.setItems([a])

  expect(pixelAt(r.canvas, 500, 500)).toEqual([255, 255, 255])
  expect(pixelAt(r.canvas, 500, 200)).toEqual([29, 29, 29])
})

test('removing an item from the middle redraws the rest in order', () => {
  const r = renderer()
  const box = rectangle('box1', [300, 300, 700, 600])
  const bucket = fill('fill', 500, 450, PaletteColor.Orange)

  r.setItems([box, bucket])
  expect(pixelAt(r.canvas, 500, 450)).toEqual([225, 105, 25])

  r.setItems([bucket])
  expect(pixelAt(r.canvas, 900, 450)).toEqual([225, 105, 25])
})

test('clearing empties the sheet', () => {
  const r = renderer()

  r.setItems([circle('ring', 600, 450, 150)])
  r.setItems([])

  expect(pixelAt(r.canvas, 600, 300)).toEqual([255, 255, 255])
})

test('setting the same list again does nothing harmful', () => {
  const r = renderer()
  const items = [stroke('aaaa', [100, 200, 900, 200])]

  r.setItems(items)

  const before = Buffer.from(imageData(r.canvas))

  r.setItems([...items])

  expect(Buffer.from(imageData(r.canvas)).equals(before)).toBe(true)
})
