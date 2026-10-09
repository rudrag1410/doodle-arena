import { motion } from 'motion/react'
import clsx from 'clsx'
import { Check, Crown, Pencil, WifiOff } from 'lucide-react'
import { type PublicPlayer, type RoomView } from '@doodle/shared'

import { COPY } from '@/constants/copy'
import { SPRING } from '@/constants/motion'
import { THEME } from '@/constants/theme'
import { AVATAR_SIZE } from '@/constants/ui'
import { Avatar } from '@/components'
import { rowTone, avatarRing } from '@/utils/players'

interface PlayerRowProps {
  player: PublicPlayer
  rank: number
  view: RoomView
  drawing: boolean
  delta?: number
  roomy: boolean
}

export const PlayerRow = ({ player: p, rank, view, drawing, delta, roomy }: PlayerRowProps) => (
  <motion.li
    layout
    layoutDependency={rank}
    transition={SPRING.row}
    className={clsx(
      'relative flex min-h-0 items-center gap-1.5 rounded-xl border-(length:--border-width) border-ink px-1.5 lg:gap-2 lg:rounded-2xl lg:px-2.5',
      rowTone(p, drawing),
      !p.connected && 'opacity-50',
    )}
  >
    <span className="hidden w-4 text-center font-display text-sm font-bold text-ink-soft lg:block">{rank}</span>
    <Avatar index={p.avatar} size={roomy ? AVATAR_SIZE.row : AVATAR_SIZE.compact} ring={avatarRing(p, drawing)} />
    <div className="flex min-w-0 flex-1 items-baseline justify-between gap-1 leading-tight lg:block">
      <div className="flex min-w-0 items-center gap-1 text-xs font-extrabold lg:text-sm">
        <span className="truncate">{p.name}</span>
        {p.id === view.youId && <span className="hidden text-xs font-bold text-ink-soft lg:inline">{COPY.common.you}</span>}
        {p.id === view.hostId && <Crown size="0.8125rem" className="shrink-0" fill={THEME.sunny} stroke={THEME.ink} aria-label={COPY.common.host} />}
      </div>
      <div className="font-display text-sm font-semibold lg:text-base">
        {p.score}
        <span className="ml-0.5 hidden text-xs text-ink-soft lg:inline"> {COPY.common.points}</span>
      </div>
    </div>
    {drawing && <Pencil size="1rem" className="shrink-0 animate-wiggle" aria-label={COPY.common.drawing} />}
    {p.guessed && !drawing && <Check size="1.125rem" strokeWidth={3.5} className="shrink-0 text-[#0b7d67]" aria-label={COPY.common.guessed} />}
    {!p.connected && <WifiOff size="0.875rem" aria-label={COPY.common.reconnecting} />}
    {delta ? (
      <motion.span
        initial={{ y: 8, opacity: 0, scale: 0.6 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        className="absolute -top-1.5 right-2 rounded-full border-2 border-ink bg-mint px-1.5 text-xs font-extrabold"
      >
        +{delta}
      </motion.span>
    ) : null}
  </motion.li>
)
