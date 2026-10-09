import { useState } from 'react'
import { motion } from 'motion/react'
import clsx from 'clsx'
import { Crown, RotateCcw } from 'lucide-react'
import { ClientEvent, type RoomView } from '@doodle/shared'
import { COPY } from '../../constants/copy'
import { SPRING } from '../../constants/motion'
import { THEME } from '../../constants/theme'
import { AVATAR_SIZE } from '../../constants/ui'
import { socket } from '../../services/socket'
import { useGame } from '../../store'
import { Confetti } from '../board/Confetti'
import { Avatar, RoomHeader, Screen, TabBar } from '../common'
import { ReplayPlayer } from '../replay/ReplayPlayer'
const PODIUM = [
  { index: 1, height: 'h-[11dvh]', tone: 'bg-[#dfe6ee]', delay: 0.35 },
  { index: 0, height: 'h-[16dvh]', tone: 'bg-sunny', delay: 0.6 },
  { index: 2, height: 'h-[7dvh]', tone: 'bg-[#f0b98a]', delay: 0.15 },
]
const WINNER_PLACE = 1
enum EndTab {
  Results = 'results',
  Replay = 'replay',
}
const TABS = [
  { id: EndTab.Results, label: COPY.tabs.results },
  { id: EndTab.Replay, label: COPY.tabs.replay },
]
export const GameEnd = ({ view }: { view: RoomView }) => {
  const replay = useGame((s) => s.replay)
  const [tab, setTab] = useState(EndTab.Results)
  const ranking = view.ranking ?? []
  const isHost = view.hostId === view.youId
  const winners = ranking.filter((r) => r.rank === WINNER_PLACE)
  const youWon = winners.some((w) => w.playerId === view.youId)
  return (
    <Screen className="gap-2 p-3 lg:gap-3 lg:p-5">
      {youWon && <Confetti />}
      <RoomHeader />
      <TabBar tabs={TABS} value={tab} onChange={setTab} />

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:gap-5">
        <section className={clsx('flex min-h-0 flex-col gap-2', tab !== EndTab.Results && 'max-lg:hidden')}>
          <div className="shrink-0 text-center">
            <motion.h1 initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl font-bold sm:text-4xl">
              {winners.length === 1 ? COPY.end.winner(winners[0].name) : COPY.end.tie}
            </motion.h1>
            <p className="text-sm font-semibold text-ink-soft">{COPY.end.summary(view.totalRounds, view.players.length)}</p>
          </div>

          <div className="mx-auto grid w-full max-w-sm shrink-0 grid-cols-3 items-end gap-2">
            {PODIUM.map(({ index, height, tone, delay }) => {
              const r = ranking[index]
              const place = r?.rank ?? index + 1
              return (
                <div key={index} className="flex flex-col items-center">
                  {r && (
                    <motion.div
                      initial={{ y: -30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: delay + 0.3, type: 'spring' }}
                      className="mb-1 flex flex-col items-center"
                    >
                      {index === 0 && <Crown size={26} fill={THEME.sunny} stroke={THEME.ink} strokeWidth={2.5} className="animate-wiggle" />}
                      <Avatar index={r.avatar} size={index === 0 ? AVATAR_SIZE.podiumWinner : AVATAR_SIZE.podium} />
                      <span className="max-w-full truncate font-display text-base font-semibold">{r.name}</span>
                      <span className="font-display text-lg leading-none font-bold">{r.score}</span>
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    style={{ originY: 1 }}
                    transition={{ delay, ...SPRING.podium }}
                    className={clsx(
                      'card grid min-h-10 w-full place-items-start justify-center rounded-b-none pt-1 font-display text-3xl font-bold',
                      height,
                      tone,
                    )}
                  >
                    {place}
                  </motion.div>
                </div>
              )
            })}
          </div>

          <div className="card flex min-h-0 flex-1 flex-col gap-2 p-3">
            <h2 className="shrink-0 text-lg font-bold">{COPY.end.finalScores}</h2>
            <ol className="grid min-h-0 flex-1 auto-rows-[minmax(0,2.5rem)] grid-cols-2 content-start gap-1.5">
              {ranking.map((r) => (
                <li
                  key={r.playerId}
                  className={clsx(
                    'flex min-h-0 items-center gap-2 rounded-2xl border-[2.5px] border-ink px-2',
                    r.playerId === view.youId ? 'bg-sunny/40' : 'bg-white',
                  )}
                >
                  <span className="w-4 text-center font-display text-sm font-bold">{r.rank}</span>
                  <Avatar index={r.avatar} size={AVATAR_SIZE.standing - 8} />
                  <span className="flex-1 truncate text-sm font-extrabold">{r.name}</span>
                  <span className="font-display text-base font-bold">{r.score}</span>
                </li>
              ))}
            </ol>
            {isHost ? (
              <button className="btn btn-primary shrink-0 text-lg" onClick={() => socket.emit(ClientEvent.GameReset)}>
                <RotateCcw size={20} /> {COPY.end.playAgain}
              </button>
            ) : (
              <p className="shrink-0 rounded-2xl border-[2.5px] border-dashed border-ink/40 px-3 py-2 text-center font-display text-sm font-semibold">
                {COPY.end.waitingHost}
              </p>
            )}
          </div>
        </section>

        <section className={clsx('flex min-h-0 flex-col', tab !== EndTab.Replay && 'max-lg:hidden')}>
          <h2 className="hidden shrink-0 text-2xl font-bold lg:block">{COPY.end.replayTitle}</h2>
          <p className="mb-2 hidden shrink-0 text-sm font-semibold text-ink-soft lg:block">{COPY.end.replayLead}</p>
          <div className="min-h-0 flex-1">
            {replay ? <ReplayPlayer turns={replay} /> : <p className="card p-6 text-center font-semibold">{COPY.end.loadingReplay}</p>}
          </div>
        </section>
      </div>
    </Screen>
  )
}
