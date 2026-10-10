import { useImperativeHandle, useRef, type Ref } from 'react'
import clsx from 'clsx'
import type { BrushSize, PaletteColor } from '@doodle/shared'

import { COPY } from '@/constants/copy'
import { Tool } from '@/enums'
import { useCanvasMirror } from '@/hooks/useCanvasMirror'
import { useCanvasRenderer } from '@/hooks/useCanvasRenderer'
import { useCanvasStreaming } from '@/hooks/useCanvasStreaming'
import { useDrawing } from '@/hooks/useDrawing'

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

export const Board = ({ canDraw, tool, color, size, turnKey, handleRef }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderer = useCanvasRenderer(canvasRef)
  const stream = useCanvasStreaming(renderer, canDraw)
  const { handle, pointerProps } = useDrawing({ renderer, stream, canDraw, tool, color, size, turnKey })

  useCanvasMirror(renderer)
  useImperativeHandle(handleRef, () => handle, [handle])

  return (
    <div className={clsx('board relative h-full w-full', canDraw && (tool === Tool.Fill ? 'cursor-fill' : 'cursor-pen'))}>
      <canvas ref={canvasRef} aria-label={COPY.game.boardLabel} {...pointerProps} />
    </div>
  )
}
