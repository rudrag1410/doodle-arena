import { useEffect, useRef } from 'react'
import { chunk, throttle } from 'lodash-es'
import type { Editor } from 'tldraw'
import { CanvasRejectReason, ClientEvent, LIMITS, SocketLifecycle, ToastKind, type ShapeRecord } from '@doodle/shared'
import { drawRecordsOf, isDrawRecord } from '../board/config'
import { COPY } from '../constants/copy'
import { USER_DOCUMENT_CHANGES } from '../constants/board'
import { BOARD_FLUSH_MS, RECONNECT_RESYNC_DELAY_MS, RESYNC_MIN_GAP_MS } from '../constants/timing'
import { EditorEventName } from '../enums'
import { canvasBus } from '../services/canvasBus'
import { socket } from '../services/socket'
import { useGame } from '../store'
export const useCanvasStreaming = (editor: Editor | null, canDraw: boolean) => {
  const toast = useGame((s) => s.toast)
  const resync = useRef<() => void>(() => {})
  useEffect(() => {
    if (!editor || !canDraw) return
    const pending = new Map<string, ShapeRecord | null>()
    const flush = throttle(
      () => {
        const entries = [...pending]
        pending.clear()
        const puts = entries.flatMap(([, rec]) => (rec ? [rec] : []))
        const removes = entries.flatMap(([id, rec]) => (rec ? [] : [id]))
        const batches = chunk(puts, LIMITS.opsPerMessage)
        ;(batches.length ? batches : [[]]).forEach((batch, i) => {
          if (entries.length) socket.volatile.emit(ClientEvent.CanvasOps, { puts: batch, removes: i === 0 ? removes : [] })
        })
      },
      BOARD_FLUSH_MS,
      { leading: false, trailing: true },
    )
    const stop = editor.store.listen(({ changes }) => {
      Object.values(changes.added).forEach((rec) => isDrawRecord(rec) && pending.set(rec.id, rec))
      Object.values(changes.updated).forEach(([, to]) => isDrawRecord(to) && pending.set(to.id, to))
      Object.values(changes.removed).forEach((rec) => isDrawRecord(rec) && pending.set(rec.id, null))
      flush()
    }, USER_DOCUMENT_CHANGES)
    const onEvent = (e: { name: string }) => e.name === EditorEventName.PointerUp && flush.flush()
    editor.on(EditorEventName.Event, onEvent as never)
    resync.current = throttle(
      () => {
        pending.clear()
        socket.emit(ClientEvent.CanvasFull, { shapes: drawRecordsOf(editor) })
      },
      RESYNC_MIN_GAP_MS,
      { leading: true, trailing: false },
    )
    const off = canvasBus.subscribe({
      full: () => {},
      ops: () => {},
      reject: (reason, message) => {
        if (reason === CanvasRejectReason.Rate) resync.current()
        else if (reason === CanvasRejectReason.TooLarge) toast(ToastKind.Error, COPY.toasts.strokeTooBig)
        else if (reason === CanvasRejectReason.Invalid) toast(ToastKind.Error, message)
      },
    })
    return () => {
      flush.flush()
      flush.cancel()
      stop()
      editor.off(EditorEventName.Event, onEvent as never)
      off()
    }
  }, [editor, canDraw, toast])
  useEffect(() => {
    if (!editor || !canDraw) return
    const onReconnect = () => setTimeout(() => resync.current(), RECONNECT_RESYNC_DELAY_MS)
    socket.io.on(SocketLifecycle.Reconnect, onReconnect)
    return () => {
      socket.io.off(SocketLifecycle.Reconnect, onReconnect)
    }
  }, [editor, canDraw])
}
