import { useEffect, useMemo, useState } from 'react'
import type { ReplayTurn } from '@doodle/shared'

import { REPLAY_INITIAL_SPEED } from '@/constants/board'
import type { CanvasRenderer } from '@/services/canvasRenderer'
import { buildTimeline, itemsAt } from '@/utils/replayMath'

export function useReplayPlayer(turn: ReplayTurn | undefined, renderer: CanvasRenderer | null) {
  const { timeline, total } = useMemo(() => buildTimeline(turn?.events ?? []), [turn])
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState<number>(REPLAY_INITIAL_SPEED)

  useEffect(() => {
    renderer?.setItems(itemsAt(timeline, t))
  }, [renderer, timeline, t])

  useEffect(() => {
    setT(0)
    setPlaying(true)
  }, [turn])

  useEffect(() => {
    if (!playing) return

    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const dt = now - last

      last = now

      setT((prev) => {
        const next = prev + dt * speed

        if (next >= total) {
          setPlaying(false)

          return total
        }

        return next
      })

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(raf)
  }, [playing, speed, total])

  const restart = () => {
    setT(0)
    setPlaying(true)
  }

  const togglePlay = () => (t >= total ? restart() : setPlaying((p) => !p))

  const scrub = (value: number) => {
    setPlaying(false)
    setT(value)
  }

  return { t, total, playing, speed, setSpeed, restart, togglePlay, scrub }
}
