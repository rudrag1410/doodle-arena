import { useHotkeys } from 'react-hotkeys-hook'
import type { BrushSize } from '@doodle/shared'

import { HOTKEYS, HOTKEY_FOCUSABLE_ROLES, HOTKEY_TOOLS, SIZE_SHORTCUTS } from '@/constants/board'
import type { Tool } from '@/enums'

interface Handlers {
  onUndo: () => void
  onRedo: () => void
  onTool: (t: Tool) => void
  onSize: (s: BrushSize) => void
}

export const useDrawingShortcuts = (enabled: boolean, { onUndo, onRedo, onTool, onSize }: Handlers) => {
  const base = { enabled, enableOnFormTags: HOTKEY_FOCUSABLE_ROLES }
  const options = { ...base, preventDefault: true }

  useHotkeys(HOTKEYS.undo, onUndo, options)
  useHotkeys(HOTKEYS.redo, onRedo, options)
  useHotkeys(HOTKEYS.pen, () => onTool(HOTKEY_TOOLS.pen), base)
  useHotkeys(HOTKEYS.eraser, () => onTool(HOTKEY_TOOLS.eraser), base)
  useHotkeys(HOTKEYS.fill, () => onTool(HOTKEY_TOOLS.fill), base)
  useHotkeys(HOTKEYS.sizes, (e) => onSize(SIZE_SHORTCUTS[e.key]), base)
}
