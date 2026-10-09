import { useCallback, useEffect, useImperativeHandle, useState, type PointerEvent, type Ref } from 'react'
import clsx from 'clsx'
import { TldrawEditor, type Editor } from 'tldraw'
import type { BrushSize, PaletteColor } from '@doodle/shared'

import { SHAPE_UTILS, TOOLS, applyRemote, clearBoard, configureEditor, replaceAllRemote } from '@/utils/tldraw'
import { bucketFill } from '@/utils/fill'
import { BOARD_MAX_PAGES } from '@/constants/board'
import { COPY } from '@/constants/copy'
import { TldrawToolId, Tool } from '@/enums'
import { useCanvasStreaming } from '@/hooks/useCanvasStreaming'
import { useToolSync } from '@/hooks/useToolSync'
import { canvasBus } from '@/services/canvasBus'

export interface BoardHandle {
  undo: () => void
  redo: () => void
  clear: () => void
}

interface Props {
  canDraw: boolean
  tool: Tool
  color: PaletteColor
  size: BrushSize
  turnKey: string
  handleRef?: Ref<BoardHandle>
}

const LICENSE_KEY = import.meta.env.VITE_TLDRAW_LICENSE_KEY
const DEV_EDITOR_KEY = '__editor'

export const Board = ({ canDraw, tool, color, size, turnKey, handleRef }: Props) => {
  const [editor, setEditor] = useState<Editor | null>(null)

  const onMount = useCallback((ed: Editor) => {
    configureEditor(ed)
    replaceAllRemote(ed, canvasBus.snapshot())
    setEditor(ed)

    if (import.meta.env.DEV) (window as unknown as Record<string, Editor>)[DEV_EDITOR_KEY] = ed

    const off = canvasBus.subscribe({
      full: (shapes) => replaceAllRemote(ed, shapes),
      ops: (puts, removes) => applyRemote(ed, puts, removes),
      reject: () => {},
    })

    return () => {
      off()
      setEditor(null)
    }
  }, [])

  useToolSync(editor, canDraw, tool, color, size)
  useCanvasStreaming(editor, canDraw)

  useEffect(() => {
    editor?.clearHistory()
  }, [editor, turnKey])

  useImperativeHandle(handleRef, () => ({ undo: () => editor?.undo(), redo: () => editor?.redo(), clear: () => editor && clearBoard(editor) }), [
    editor,
  ])

  const onFillDown = (e: PointerEvent) => {
    if (!editor || !canDraw) return

    e.preventDefault()
    bucketFill(editor, editor.screenToPage({ x: e.clientX, y: e.clientY }), color)
  }

  return (
    <div className={clsx('board relative h-full w-full', canDraw && tool === Tool.Pen && 'cursor-pen')}>
      <TldrawEditor
        shapeUtils={SHAPE_UTILS}
        tools={TOOLS}
        initialState={TldrawToolId.Select}
        onMount={onMount}
        autoFocus={false}
        options={{ maxPages: BOARD_MAX_PAGES }}
        licenseKey={LICENSE_KEY}
      />
      {canDraw && tool === Tool.Fill && (
        <div className="absolute inset-0 z-10 cursor-cell" onPointerDown={onFillDown} aria-label={COPY.game.fillAria} />
      )}
    </div>
  )
}
