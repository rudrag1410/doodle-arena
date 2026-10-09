import { useRef, useState } from 'react'
import clsx from 'clsx'
import { AlertTriangle, LogOut } from 'lucide-react'
import { Phase, type RoomView } from '@doodle/shared'
import { COPY } from '../../constants/copy'
import { useBrush, useDrawingShortcuts, useLeaveRoom, useRemaining } from '../../hooks'
import { Board, type BoardHandle } from '../board/Board'
import { BoardFrame } from '../board/BoardFrame'
import { Logo, Screen, TabBar } from '../common'
import { BoardOverlay, Chat, PlayerList, TimerRing, Toolbar, WordBar } from '../game'
enum SidePanel {
  Chat = 'chat',
  Players = 'players',
}
const TABS = [
  { id: SidePanel.Chat, label: COPY.tabs.chat },
  { id: SidePanel.Players, label: COPY.tabs.players },
]
const CLOCK_PHASES: ReadonlySet<Phase> = new Set([Phase.Drawing, Phase.Choosing, Phase.TurnEnd])
export const Game = ({ view }: { view: RoomView }) => {
  const leave = useLeaveRoom()
  const boardRef = useRef<BoardHandle>(null)
  const [panel, setPanel] = useState(SidePanel.Chat)
  const isDrawer = view.drawerId === view.youId
  const canDraw = isDrawer && view.phase === Phase.Drawing
  const turnKey = `${view.round}:${view.drawerId}`
  const clockOn = CLOCK_PHASES.has(view.phase)
  const remaining = useRemaining(clockOn ? view.phaseEndsAt : null)
  const drawer = view.players.find((p) => p.id === view.drawerId)
  const brush = useBrush(turnKey, isDrawer)
  useDrawingShortcuts(canDraw, {
    onUndo: () => boardRef.current?.undo(),
    onRedo: () => boardRef.current?.redo(),
    onTool: brush.setTool,
    onSize: brush.setSize,
  })
  return (
    <Screen className="gap-2 p-2 sm:p-3 lg:gap-3 lg:p-4">
      <header className="card flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 short:py-0.5 sm:gap-3 sm:px-4">
        <div className="hidden md:block short:hidden">
          <Logo />
        </div>
        <span className="chip !cursor-default !px-2.5 !py-0.5 whitespace-nowrap" aria-pressed="false">
          <span className="max-sm:hidden">{COPY.game.room}</span> <b className="tracking-widest">{view.roomId}</b>
        </span>
        <span className="chip !cursor-default bg-sky/40 !px-2.5 !py-0.5 whitespace-nowrap" aria-pressed="false">
          {COPY.game.round(view.round, view.totalRounds)}
        </span>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {drawer && view.phase === Phase.Drawing && (
            <span className="hidden text-sm font-extrabold lg:block">{isDrawer ? COPY.game.youDrawing : COPY.game.someoneDrawing(drawer.name)}</span>
          )}
          {clockOn && view.phaseDurationMs && (
            <TimerRing remainingMs={remaining} totalMs={view.phaseDurationMs} urgent={view.phase === Phase.Drawing} />
          )}
          <button className="btn btn-sm btn-icon" onClick={leave} aria-label={COPY.common.leaveGame} title={COPY.common.leaveGame}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2 landscape:flex-row lg:grid lg:grid-cols-[240px_minmax(0,1fr)_300px] lg:gap-3">
        <main className="flex min-w-0 flex-col gap-2 landscape:min-h-0 landscape:flex-1 lg:order-2 lg:min-h-0 lg:gap-3">
          <div className="card shrink-0 px-3 py-1.5 short:py-0.5">
            <WordBar view={view} />
          </div>
          {view.notice && (
            <div className="card flex shrink-0 items-center gap-2 bg-sunny px-3 py-1.5 text-sm font-extrabold">
              <AlertTriangle size={18} className="shrink-0" /> {view.notice}
            </div>
          )}
          <BoardFrame className="max-lg:portrait:aspect-[4/3] max-lg:portrait:w-full landscape:min-h-0 landscape:flex-1 lg:min-h-0 lg:flex-1">
            <Board canDraw={canDraw} tool={brush.tool} color={brush.color} size={brush.size} turnKey={turnKey} handleRef={boardRef} />
            <BoardOverlay view={view} remainingMs={remaining} />
          </BoardFrame>
          {isDrawer && (
            <Toolbar
              tool={brush.tool}
              setTool={brush.setTool}
              color={brush.color}
              setColor={brush.setColor}
              size={brush.size}
              setSize={brush.setSize}
              onUndo={() => boardRef.current?.undo()}
              onClear={() => boardRef.current?.clear()}
              disabled={!canDraw}
            />
          )}
        </main>

        <div className="flex min-h-0 flex-col gap-2 portrait:flex-1 landscape:w-[38%] lg:contents">
          <TabBar tabs={TABS} value={panel} onChange={setPanel} />
          <aside className={clsx('card min-h-0 flex-1 p-2 lg:order-1 lg:flex-none', panel !== SidePanel.Players && 'max-lg:hidden')}>
            <PlayerList view={view} />
          </aside>
          <aside className={clsx('min-h-0 flex-1 lg:order-3 lg:flex-none', panel !== SidePanel.Chat && 'max-lg:hidden')}>
            <Chat view={view} />
          </aside>
        </div>
      </div>
    </Screen>
  )
}
