import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Editor } from 'tldraw'
import type { ReplayTurn, ShapeRecord } from '@doodle/shared'

import { applyRemote, clearBoard, configureEditor } from '@/utils/tldraw'
import { buildTimeline, shapesAt } from '@/utils/replayMath'
import { REPLAY_INITIAL_SPEED } from '@/constants/board'

export function useReplayPlayer(turn: ReplayTurn | undefined) {
  const { timeline, total } = useMemo(() => buildTimeline(turn?.events ?? []), [turn])
  const [editor, setEditor] = useState<Editor | null>(null)
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState<number>(REPLAY_INITIAL_SPEED)
  const shown = useRef(new Map<string, ShapeRecord>())

  const onMount = useCallback((ed: Editor) => {
    configureEditor(ed)
    ed.updateInstanceState({ isReadonly: true })
    setEditor(ed)

    return () => setEditor(null)
  }, [])

  useEffect(() => {
    if (!editor) return

    const next = shapesAt(timeline, t)
    const puts: ShapeRecord[] = []

    next.forEach((rec, id) => shown.current.get(id) !== rec && puts.push(rec))

    const removes = [...shown.current.keys()].filter((id) => !next.has(id))

    if (puts.length || removes.length) applyRemote(editor, puts, removes)

    shown.current = next
  }, [editor, timeline, t])

  useEffect(() => {
    if (editor) {
      clearBoard(editor)
      shown.current = new Map()
    }

    setT(0)
    setPlaying(true)
  }, [turn, editor])

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

  return { editor, onMount, t, total, playing, speed, setSpeed, restart, togglePlay, scrub }
}
