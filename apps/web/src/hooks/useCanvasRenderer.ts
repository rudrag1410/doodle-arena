import { useLayoutEffect, useState, type RefObject } from 'react'

import { CanvasRenderer } from '@/services/canvasRenderer'

export const useCanvasRenderer = (canvasRef: RefObject<HTMLCanvasElement | null>) => {
  const [renderer, setRenderer] = useState<CanvasRenderer | null>(null)

  useLayoutEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) return

    setRenderer(new CanvasRenderer(canvas))

    return () => setRenderer(null)
  }, [canvasRef])

  return renderer
}
