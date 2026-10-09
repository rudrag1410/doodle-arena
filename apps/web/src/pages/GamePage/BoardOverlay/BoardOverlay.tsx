import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { orderBy, take, toUpper } from 'lodash-es'
import { Clock, Frown, PartyPopper, UserX, type LucideIcon } from 'lucide-react'
import { ClientEvent, Phase, TurnEndReason, type RoomView } from '@doodle/shared'

import { COPY } from '@/constants/copy'
import { FADE_S, SPRING } from '@/constants/motion'
import { AVATAR_SIZE, OVERLAY_ROWS_MAX } from '@/constants/ui'
import { socket } from '@/services/socket'
import { Avatar } from '@/components'
import { secondsLeft } from '@/utils/time'

const POP = { initial: { scale: 0.8, opacity: 0, y: 20 }, animate: { scale: 1, opacity: 1, y: 0 }, exit: { scale: 0.9, opacity: 0 } }

const FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, pointerEvents: 'none' as const },
  transition: { duration: FADE_S },
}

const CHOICE_TONES = ['btn-sunny', 'btn-mint', 'btn-grape']

export function BoardOverlay({ view, remainingMs }: { view: RoomView; remainingMs: number }) {
  return (
    <AnimatePresence mode="wait">
      {view.phase === Phase.Choosing && <ChoosingPanel key="choose" view={view} remainingMs={remainingMs} />}
      {view.phase === Phase.TurnEnd && view.turnResult && <TurnEndPanel key="end" view={view} remainingMs={remainingMs} />}
    </AnimatePresence>
  )
}

function ChoosingPanel({ view, remainingMs }: { view: RoomView; remainingMs: number }) {
  const drawer = view.players.find((p) => p.id === view.drawerId)
  const isDrawer = view.drawerId === view.youId

  return (
    <motion.div className="absolute inset-0 z-20 grid place-items-center overflow-y-auto bg-paper/85 p-3 backdrop-blur-[3px] @lg:p-4" {...FADE}>
      {isDrawer && view.wordChoices ? (
        <motion.div {...POP} transition={SPRING.card} className="w-full max-w-xl text-center">
          <div className="label">{COPY.overlay.roundOf(view.round, view.totalRounds)}</div>
          <h2 className="mt-1 text-2xl font-bold @lg:text-4xl">{COPY.overlay.yourTurn}</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 @md:grid-cols-3 @lg:mt-5 @lg:gap-3">
            {view.wordChoices.map((w, i) => (
              <motion.button
                key={w}
                whileHover={{ y: -4, rotate: i % 2 ? 1.5 : -1.5 }}
                whileTap={{ scale: 0.96 }}
                className={clsx('btn !block !py-2 text-base @md:!py-4 @md:text-lg @lg:!py-5 @lg:text-xl', CHOICE_TONES[i % CHOICE_TONES.length])}
                onClick={() => socket.emit(ClientEvent.TurnPick, i)}
              >
                {w}
              </motion.button>
            ))}
          </div>
          <p className="mt-3 text-sm font-bold text-ink-soft">{COPY.overlay.autoPick(secondsLeft(remainingMs))}</p>
        </motion.div>
      ) : (
        <motion.div {...POP} className="text-center">
          <div className="label">{COPY.overlay.roundOf(view.round, view.totalRounds)}</div>
          {drawer && (
            <div className="mt-3 flex justify-center">
              <span className="animate-wiggle">
                <Avatar index={drawer.avatar} size={AVATAR_SIZE.drawer} />
              </span>
            </div>
          )}
          <h2 className="mt-2 text-2xl font-bold @lg:text-3xl">{COPY.overlay.choosing(drawer?.name ?? COPY.overlay.someone)}</h2>
          <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-3 rounded-full bg-ink"
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function TurnEndPanel({ view, remainingMs }: { view: RoomView; remainingMs: number }) {
  const result = view.turnResult!

  const rows = take(
    orderBy(
      view.players.map((p) => ({ p, d: result.deltas[p.id] ?? 0 })),
      'd',
      'desc',
    ),
    OVERLAY_ROWS_MAX,
  )

  return (
    <motion.div className="absolute inset-0 z-20 grid place-items-center overflow-y-auto bg-paper/88 p-3 backdrop-blur-[3px] @lg:p-4" {...FADE}>
      <motion.div {...POP} transition={SPRING.card} className="w-full max-w-lg text-center">
        <ReasonBadge reason={result.reason} />
        <div className="label mt-2">{COPY.game.wordWas}</div>
        <div className="font-display text-4xl font-bold @lg:text-6xl">{toUpper(result.word)}</div>
        <ul className="card mx-auto mt-3 grid grid-cols-2 gap-x-4 gap-y-1 p-2.5 text-left text-sm @lg:mt-5 @lg:p-3 @lg:text-base">
          {rows.map(({ p, d }) => (
            <li key={p.id} className="flex items-center gap-2">
              <Avatar index={p.avatar} size={AVATAR_SIZE.overlayRow} />
              <span className="flex-1 truncate font-extrabold">{p.name}</span>
              <span className={clsx('font-display font-bold', d ? 'text-[#0b7d67]' : 'text-ink-soft')}>{d ? `+${d}` : COPY.overlay.noPoints}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm font-bold text-ink-soft">{COPY.overlay.nextTurn(secondsLeft(remainingMs))}</p>
      </motion.div>
    </motion.div>
  )
}

const REASON_STYLE: Record<
  TurnEndReason,
  {
    icon: LucideIcon
    tone: string
  }
> = {
  [TurnEndReason.AllGuessed]: { icon: PartyPopper, tone: 'bg-mint' },
  [TurnEndReason.Time]: { icon: Clock, tone: 'bg-sunny' },
  [TurnEndReason.DrawerLeft]: { icon: UserX, tone: 'bg-bubble' },
}

function ReasonBadge({ reason }: { reason: TurnEndReason }) {
  const style = REASON_STYLE[reason]
  const Icon = style?.icon ?? Frown

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border-[2.5px] border-ink px-3 py-1 font-display text-base font-semibold @lg:px-4 @lg:py-1.5 @lg:text-lg',
        style?.tone ?? 'bg-sunny',
      )}
    >
      <Icon size={20} /> {COPY.overlay.reasons[reason] ?? COPY.overlay.turnOver}
    </span>
  )
}
