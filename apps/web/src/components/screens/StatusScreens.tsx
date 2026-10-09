import { motion } from 'motion/react'
import { Home as HomeIcon, Loader2, SearchX } from 'lucide-react'
import { JoinErrorCode } from '@doodle/shared'
import { COPY } from '../../constants/copy'
import { useLeaveRoom } from '../../hooks'
import type { ClientError } from '../../types'
import { Logo, Screen } from '../common'
export const Splash = ({ text }: { text: string }) => (
  <Screen className="items-center justify-center gap-5 p-6">
    <Logo />
    <div className="card flex items-center gap-3 px-5 py-3 font-display text-lg font-semibold">
      <Loader2 className="animate-spin" /> {text}
    </div>
  </Screen>
)
export const ErrorScreen = ({ error }: { error: ClientError }) => {
  const leave = useLeaveRoom()
  const gone = error.code === JoinErrorCode.RoomNotFound
  return (
    <Screen className="items-center justify-center p-6">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card max-w-md p-8 text-center">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full border-[2.5px] border-ink bg-sunny">
          <SearchX size={32} />
        </div>
        <h1 className="text-3xl font-bold">{gone ? COPY.status.roomEndedTitle : COPY.status.holdOn}</h1>
        <p className="mt-2 font-semibold text-ink-soft">{gone ? COPY.status.roomEndedBody : error.message}</p>
        <button className="btn btn-primary mt-6" onClick={leave}>
          <HomeIcon size={18} /> {COPY.common.backHome}
        </button>
      </motion.div>
    </Screen>
  )
}
