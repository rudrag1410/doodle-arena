import { useEffect, useState } from 'react'
import { BrushSize, DEFAULT_BRUSH, DEFAULT_COLOR, type PaletteColor } from '@doodle/shared'
import { DEFAULT_TOOL } from '../constants/board'
import { Tool } from '../enums'
export const useBrush = (resetKey: string, active: boolean) => {
  const [tool, setTool] = useState<Tool>(DEFAULT_TOOL)
  const [color, setColor] = useState<PaletteColor>(DEFAULT_COLOR)
  const [size, setSize] = useState<BrushSize>(DEFAULT_BRUSH)
  useEffect(() => {
    if (!active) return
    setTool(DEFAULT_TOOL)
    setColor(DEFAULT_COLOR)
    setSize(DEFAULT_BRUSH)
  }, [resetKey, active])
  return { tool, setTool, color, setColor, size, setSize }
}
