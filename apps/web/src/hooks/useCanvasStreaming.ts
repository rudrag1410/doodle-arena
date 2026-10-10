import { useEffect, useMemo, useState } from 'react'
import { throttle } from 'lodash-es'
import { CanvasRejectReason, SocketLifecycle, ToastKind } from '@doodle/shared'

import { COPY } from '@/constants/copy'
import { RECONNECT_RESYNC_DELAY_MS, RESYNC_MIN_GAP_MS } from '@/constants/timing'
import { canvasBus } from '@/services/canvasBus'
import { CanvasOutbox } from '@/services/canvasOutbox'
import type { CanvasRenderer } from '@/services/canvasRenderer'
import { socket } from '@/services/socket'
import { useGame } from '@/store'

export const useCanvasStreaming = (renderer: CanvasRenderer | null, canDraw: boolean) => {
  const toast = useGame((s) => s.toast)
  const [outbox] = useState(() => new CanvasOutbox())

  const resync = useMemo(
    () =>
      throttle(() => outbox.resync(renderer?.items ?? []), RESYNC_MIN_GAP_MS, {
        leading: true,
        trailing: false,
      }),
    [outbox, renderer],
  )

  useEffect(() => {
    if (!canDraw) return

    const off = canvasBus.subscribe({
      full: () => {},
      ops: () => {},
      reject: (reason, message) => {
        if (reason === CanvasRejectReason.Rate) resync()
        else if (reason === CanvasRejectReason.TooLarge) toast(ToastKind.Error, COPY.toasts.strokeTooBig)
        else if (reason === CanvasRejectReason.Invalid) toast(ToastKind.Error, message)
      },
    })

    const onReconnect = () => setTimeout(resync, RECONNECT_RESYNC_DELAY_MS)

    socket.io.on(SocketLifecycle.Reconnect, onReconnect)

    return () => {
      outbox.flush()
      off()
      socket.io.off(SocketLifecycle.Reconnect, onReconnect)
    }
  }, [canDraw, outbox, resync, toast])

  return outbox
}
