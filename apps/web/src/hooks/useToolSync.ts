import { useEffect } from 'react'
import { DefaultColorStyle, DefaultSizeStyle, type Editor } from 'tldraw'
import type { BrushSize, PaletteColor } from '@doodle/shared'

import { TldrawToolId, Tool } from '@/enums'

const TLDRAW_TOOL: Record<Tool, TldrawToolId> = {
  [Tool.Pen]: TldrawToolId.Draw,
  [Tool.Eraser]: TldrawToolId.Eraser,
  [Tool.Fill]: TldrawToolId.Select,
}

export function useToolSync(editor: Editor | null, canDraw: boolean, tool: Tool, color: PaletteColor, size: BrushSize) {
  useEffect(() => {
    if (!editor) return

    editor.updateInstanceState({ isReadonly: !canDraw })

    if (!canDraw) editor.setCurrentTool(TldrawToolId.Select)
  }, [editor, canDraw])

  useEffect(() => {
    if (!editor || !canDraw) return

    editor.setCurrentTool(TLDRAW_TOOL[tool])
    editor.setStyleForNextShapes(DefaultColorStyle, color)
    editor.setStyleForNextShapes(DefaultSizeStyle, size)
  }, [editor, canDraw, tool, color, size])
}
