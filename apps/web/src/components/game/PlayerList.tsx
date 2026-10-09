import { motion } from 'motion/react'
import clsx from 'clsx'
import { orderBy } from 'lodash-es'
import { useMediaQuery } from 'usehooks-ts'
import { Check, Crown, Pencil, WifiOff } from 'lucide-react'
import { Phase, type PublicPlayer, type RoomView } from '@doodle/shared'
import { COPY } from '../../constants/copy'
import { MEDIA } from '../../constants/dom'
import { SPRING } from '../../constants/motion'
import { THEME } from '../../constants/theme'
import { AVATAR_SIZE } from '../../constants/ui'
import { Avatar } from '../common'
const rowTone = (p: PublicPlayer, drawing: boolean) => {
  if (p.guessed) return 'bg-mint/25'
  return drawing ? 'bg-sunny/50' : 'bg-white'
}

const avatarRing = (p: PublicPlayer, drawing: boolean) => {
  if (drawing) return THEME.sunny
  return p.guessed ? THEME.mint : undefined
}

interface PlayerRowProps {
  player: PublicPlayer
  rank: number
  view: RoomView
  drawing: boolean
  delta?: number
  roomy: boolean
}

const PlayerRow = ({ player: p, rank, view, drawing, delta, roomy }: PlayerRowProps) => (
  <motion.li
    layout
    transition={SPRING.row}
    className={clsx(
      'relative flex min-h-0 items-center gap-1.5 rounded-xl border-[2.5px] border-ink px-1.5 lg:gap-2 lg:rounded-2xl lg:px-2.5',
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
        {p.id === view.hostId && <Crown size={13} className="shrink-0" fill={THEME.sunny} stroke={THEME.ink} aria-label={COPY.common.host} />}
      </div>
      <div className="font-display text-sm font-semibold lg:text-base">
        {p.score}
        <span className="ml-0.5 hidden text-xs text-ink-soft lg:inline"> {COPY.common.points}</span>
      </div>
    </div>
    {drawing && <Pencil size={16} className="shrink-0 animate-wiggle" aria-label={COPY.common.drawing} />}
    {p.guessed && !drawing && <Check size={18} strokeWidth={3.5} className="shrink-0 text-[#0b7d67]" aria-label={COPY.common.guessed} />}
    {!p.connected && <WifiOff size={14} aria-label={COPY.common.reconnecting} />}
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

export const PlayerList = ({ view }: { view: RoomView }) => {
  const roomy = useMediaQuery(MEDIA.desktop)
  const sorted = orderBy(view.players, 'score', 'desc')
  const deltas = view.turnResult?.deltas ?? {}
  const inTurn = view.phase === Phase.Drawing || view.phase === Phase.Choosing
  return (
    <ul className="grid h-full auto-rows-[minmax(0,3.25rem)] grid-cols-3 content-start gap-1 landscape:grid-cols-2 lg:landscape:grid-cols-1 lg:grid-cols-1 lg:gap-1.5">
      {sorted.map((p, i) => (
        <PlayerRow key={p.id} player={p} rank={i + 1} view={view} drawing={p.id === view.drawerId && inTurn} delta={deltas[p.id]} roomy={roomy} />
      ))}
    </ul>
  )
}
