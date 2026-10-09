import { BrushSize } from '@doodle/shared'

import { Tool } from '@/enums'

export const BOARD_MAX_PAGES = 1
export const CAMERA_Z = 1
export const DEFAULT_TOOL = Tool.Pen

export const SIZE_SHORTCUTS: Record<string, BrushSize> = {
  '1': BrushSize.Small,
  '2': BrushSize.Medium,
  '3': BrushSize.Large,
  '4': BrushSize.ExtraLarge,
}

export const HOTKEYS = {
  undo: 'mod+z',
  redo: 'mod+shift+z',
  pen: 'b,p',
  eraser: 'e',
  fill: 'f',
  sizes: '1,2,3,4',
} as const

export const HOTKEY_FOCUSABLE_ROLES = ['radio'] as const
export const HOTKEY_TOOLS = { pen: Tool.Pen, eraser: Tool.Eraser, fill: Tool.Fill } as const
export const FILL_HIT_MARGIN = 3
export const REPLAY_EXPORT = { padding: 24, scale: 1.5 } as const
export const REPLAY_SPEEDS = [1, 2, 4] as const
export const REPLAY_INITIAL_SPEED = 1
export const REPLAY_PNG_PREFIX = 'doodle-'
export const REPLAY_URL_REVOKE_MS = 2000
export const CAMERA = { zoom: 'fit-min', behavior: 'fixed' } as const
export const USER_DOCUMENT_CHANGES = { source: 'user', scope: 'document' } as const
