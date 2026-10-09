import { useState } from 'react'
import { Download, Pause, Play, RotateCcw } from 'lucide-react'
import { clamp, kebabCase } from 'lodash-es'
import { TldrawEditor, type TLShapeId } from 'tldraw'
import type { ReplayTurn } from '@doodle/shared'
import { SHAPE_UTILS, TOOLS } from '../../board/config'
import { BOARD_MAX_PAGES, REPLAY_EXPORT, REPLAY_PNG_PREFIX, REPLAY_SPEEDS, REPLAY_URL_REVOKE_MS } from '../../constants/board'
import { COPY } from '../../constants/copy'
import { TldrawToolId } from '../../enums'
import { useReplayPlayer } from '../../hooks'
import { BoardFrame } from '../board/BoardFrame'
const LICENSE_KEY = import.meta.env.VITE_TLDRAW_LICENSE_KEY
export const ReplayPlayer = ({ turns }: { turns: ReplayTurn[] }) => {
  const [index, setIndex] = useState(0)
  const turn = turns[clamp(index, 0, turns.length - 1)]
  const { editor, onMount, t, total, playing, speed, setSpeed, restart, togglePlay, scrub } = useReplayPlayer(turn)
  const savePng = async () => {
    if (!editor) return
    const ids = [...editor.getCurrentPageShapeIds()] as TLShapeId[]
    const res = await editor.toImage(ids, { format: 'png', background: true, ...REPLAY_EXPORT }).catch(() => null)
    if (!res) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(res.blob)
    a.download = `${REPLAY_PNG_PREFIX}${kebabCase(turn.word)}.png`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), REPLAY_URL_REVOKE_MS)
  }
  if (!turns.length) return <p className="card p-6 text-center font-semibold text-ink-soft">{COPY.replay.none}</p>
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <select
        className="input shrink-0 !py-1.5 text-base"
        value={index}
        onChange={(e) => setIndex(Number(e.target.value))}
        aria-label={COPY.replay.turns}
      >
        {turns.map((tr, i) => (
          <option key={`${tr.round}-${tr.drawerId}-${tr.word}`} value={i}>
            {tr.word} — {COPY.replay.turnMeta(tr.drawerName, tr.round)}
          </option>
        ))}
      </select>

      <BoardFrame className="min-h-0 flex-1">
        <div className="board h-full w-full">
          <TldrawEditor
            shapeUtils={SHAPE_UTILS}
            tools={TOOLS}
            initialState={TldrawToolId.Select}
            onMount={onMount}
            autoFocus={false}
            options={{ maxPages: BOARD_MAX_PAGES }}
            licenseKey={LICENSE_KEY}
          />
        </div>
        <div className="pointer-events-none absolute top-2 left-2 rounded-full border-2 border-ink bg-cream px-3 py-0.5 font-display text-sm font-semibold">
          {COPY.replay.drew(turn.drawerName, turn.word)}
        </div>
      </BoardFrame>

      <div className="card flex shrink-0 flex-wrap items-center gap-2 p-2 sm:gap-3 sm:p-3">
        <button className="btn btn-icon btn-sunny" onClick={togglePlay} aria-label={playing ? COPY.replay.pause : COPY.replay.play}>
          {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>
        <button className="btn btn-icon" onClick={restart} aria-label={COPY.replay.restart}>
          <RotateCcw size={20} />
        </button>
        <input
          type="range"
          className="slider !mt-0 min-w-24 flex-1"
          min={0}
          max={total}
          value={t}
          aria-label={COPY.replay.position}
          onChange={(e) => scrub(Number(e.target.value))}
        />
        <div className="flex gap-1" role="radiogroup" aria-label={COPY.replay.speed}>
          {REPLAY_SPEEDS.map((s) => (
            <button
              key={s}
              className="chip !px-2 !py-0.5"
              role="radio"
              aria-checked={speed === s}
              aria-pressed={speed === s}
              onClick={() => setSpeed(s)}
            >
              {COPY.replay.speedLabel(s)}
            </button>
          ))}
        </div>
        <button className="btn btn-sm" onClick={savePng}>
          <Download size={16} /> {COPY.replay.savePng}
        </button>
      </div>
    </div>
  )
}
