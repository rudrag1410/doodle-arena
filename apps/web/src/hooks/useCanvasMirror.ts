import { useEffect } from 'react'

import type { CanvasRenderer } from '@/services/canvasRenderer'
import { canvasBus } from '@/services/canvasBus'
import { applyOps } from '@/utils/canvasItems'

export const useCanvasMirror = (renderer: CanvasRenderer | null) => {
  useEffect(() => {
    if (!renderer) return

    renderer.setItems(canvasBus.snapshot())

    return canvasBus.subscribe({
      full: (items) => renderer.setItems(items),
      ops: (puts, removes) => renderer.setItems(applyOps(renderer.items, puts, removes)),
      reject: () => {},
    })
  }, [renderer])
}
