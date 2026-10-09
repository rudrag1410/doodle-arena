import { AnimatePresence, motion } from 'motion/react'
import { Crown, WifiOff } from 'lucide-react'
import type { RoomView } from '@doodle/shared'
import { COPY } from '../../constants/copy'
import { THEME } from '../../constants/theme'
import { AVATAR_SIZE } from '../../constants/ui'
import { Avatar } from '../common'
export const PlayerRoster = ({ view }: { view: RoomView }) => (
  <>
    <div className="mb-2 flex shrink-0 items-center justify-between">
      <h2 className="text-xl font-bold sm:text-2xl">{COPY.lobby.players}</h2>
      <span className="chip !cursor-default !py-0.5" aria-pressed="false">
        {COPY.lobby.playerCount(view.players.length)}
      </span>
    </div>
    <ul className="grid min-h-0 flex-[2] auto-rows-[minmax(0,2.5rem)] grid-cols-2 content-start gap-1.5 sm:grid-cols-3 lg:grid-cols-2">
      <AnimatePresence initial={false}>
        {view.players.map(({ id, avatar, name, connected }) => (
          <motion.li
            key={id}
            layout
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: connected ? 1 : 0.5 }}
            exit={{ scale: 0.7, opacity: 0 }}
            className="flex min-h-0 items-center gap-2 rounded-2xl border-[2.5px] border-ink bg-white px-2"
          >
            <Avatar index={avatar} size={AVATAR_SIZE.roster} />
            <span className="min-w-0 flex-1 truncate text-sm font-extrabold">
              {name}
              {id === view.youId && <span className="ml-1 text-ink-soft">{COPY.common.you}</span>}
            </span>
            {id === view.hostId && <Crown size={16} fill={THEME.sunny} stroke={THEME.ink} aria-label={COPY.common.host} />}
            {!connected && <WifiOff size={14} aria-label={COPY.common.reconnecting} />}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  </>
)
