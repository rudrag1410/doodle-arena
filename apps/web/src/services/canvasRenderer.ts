import { CANVAS_H, CANVAS_W, type CanvasItem } from '@doodle/shared'

import { clearCanvas, drawItem } from '@/utils/canvasDraw'
import { extendsItem, sameItem } from '@/utils/canvasItems'

const CONTEXT_ERROR = 'The 2D canvas is not available in this browser'
const IMAGE_TYPE = 'image/png'

export class CanvasRenderer {
  items: CanvasItem[] = []
  private readonly ctx: CanvasRenderingContext2D

  constructor(readonly canvas: HTMLCanvasElement) {
    canvas.width = CANVAS_W
    canvas.height = CANVAS_H

    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    if (!ctx) throw new Error(CONTEXT_ERROR)

    this.ctx = ctx
    this.redraw()
  }

  setItems(next: CanvasItem[]) {
    const prev = this.items
    let common = 0

    while (common < prev.length && common < next.length && sameItem(prev[common], next[common])) common++

    this.items = next

    if (common === prev.length && next.length >= prev.length) {
      next.slice(common).forEach((item) => drawItem(this.ctx, item))

      return
    }

    const before = prev[common]
    const after = next[common]

    if (common === prev.length - 1 && next.length >= prev.length && before && after && extendsItem(before, after)) {
      drawItem(this.ctx, after, before.points.length / 2 - 1)
      next.slice(common + 1).forEach((item) => drawItem(this.ctx, item))

      return
    }

    this.redraw()
  }

  toBlob(): Promise<Blob | null> {
    return new Promise((resolve) => this.canvas.toBlob(resolve, IMAGE_TYPE))
  }

  private redraw() {
    clearCanvas(this.ctx)
    this.items.forEach((item) => drawItem(this.ctx, item))
  }
}
