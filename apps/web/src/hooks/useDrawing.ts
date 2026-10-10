import { useCallback, useEffect, useMemo, useRef, type PointerEvent } from 'react'
import { ItemKind, MAX_COORDS_PER_ITEM, type BrushSize, type CanvasItem, type PaletteColor } from '@doodle/shared'

import { MIN_POINT_DISTANCE } from '@/constants/board'
import { Tool } from '@/enums'
import type { CanvasRenderer } from '@/services/canvasRenderer'
import { toCanvasPoint } from '@/utils/canvasPoint'

interface Stream {
  put: (item: CanvasItem) => void
  remove: (ids: string[]) => void
  flush: () => void
}

interface Options {
  renderer: CanvasRenderer | null
  stream: Stream
  canDraw: boolean
  tool: Tool
  color: PaletteColor
  size: BrushSize
  turnKey: string
}

const ID_LENGTH = 16
const MAIN_BUTTON = 0

const newId = () => crypto.randomUUID().replaceAll('-', '').slice(0, ID_LENGTH)

const capturePointer = (element: HTMLElement, pointerId: number) => {
  try {
    element.setPointerCapture(pointerId)
  } catch {
    return
  }
}

export const useDrawing = ({ renderer, stream, canDraw, tool, color, size, turnKey }: Options) => {
  const current = useRef<CanvasItem | null>(null)
  const redoStack = useRef<CanvasItem[]>([])

  useEffect(() => {
    redoStack.current = []
    current.current = null
  }, [turnKey])

  const toPoint = useCallback(
    (e: { clientX: number; clientY: number }, canvas: HTMLCanvasElement) => toCanvasPoint(canvas.getBoundingClientRect(), e.clientX, e.clientY),
    [],
  )

  const append = useCallback(
    (item: CanvasItem) => {
      if (!renderer) return

      renderer.setItems([...renderer.items, item])
      stream.put(item)
    },
    [renderer, stream],
  )

  const finish = useCallback(() => {
    if (!current.current) return

    current.current = null
    redoStack.current = []
    stream.flush()
  }, [stream])

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      if (!canDraw || !renderer || e.button !== MAIN_BUTTON) return

      e.preventDefault()

      const [x, y] = toPoint(e, e.currentTarget)

      if (tool === Tool.Fill) {
        append({ id: newId(), kind: ItemKind.Fill, color, size, points: [x, y] })
        redoStack.current = []
        stream.flush()

        return
      }

      capturePointer(e.currentTarget, e.pointerId)
      current.current = { id: newId(), kind: tool === Tool.Eraser ? ItemKind.Eraser : ItemKind.Pen, color, size, points: [x, y] }
      append(current.current)
    },
    [canDraw, renderer, tool, color, size, toPoint, append, stream],
  )

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      const item = current.current

      if (!item || !renderer) return

      const canvas = e.currentTarget
      const coalesced = e.nativeEvent.getCoalescedEvents?.() ?? []
      const samples = coalesced.length ? coalesced : [e.nativeEvent]
      const points = [...item.points]

      for (const sample of samples) {
        const [x, y] = toPoint(sample, canvas)
        const dx = x - (points.at(-2) ?? x)
        const dy = y - (points.at(-1) ?? y)

        if (Math.hypot(dx, dy) >= MIN_POINT_DISTANCE) points.push(x, y)
      }

      if (points.length === item.points.length) return

      const next = { ...item, points }

      current.current = next
      renderer.setItems([...renderer.items.slice(0, -1), next])
      stream.put(next)

      if (points.length >= MAX_COORDS_PER_ITEM - 2) finish()
    },
    [renderer, stream, toPoint, finish],
  )

  const handle = useMemo(
    () => ({
      undo: () => {
        const last = renderer?.items.at(-1)

        if (!renderer || !last || current.current) return

        redoStack.current.push(last)
        renderer.setItems(renderer.items.slice(0, -1))
        stream.remove([last.id])
      },
      redo: () => {
        const item = redoStack.current.pop()

        if (item && !current.current) append(item)
      },
      clear: () => {
        if (!renderer || current.current) return

        const ids = renderer.items.map((item) => item.id)

        redoStack.current = []
        renderer.setItems([])
        stream.remove(ids)
      },
    }),
    [renderer, stream, append],
  )

  return { handle, pointerProps: { onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: finish } }
}
