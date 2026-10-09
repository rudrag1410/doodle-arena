import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, Info, WifiOff } from 'lucide-react'
import { ToastKind } from '@doodle/shared'
import clsx from 'clsx'
import { COPY } from '../../constants/copy'
import { useGame } from '../../store'
export const Toasts = () => {
  const toasts = useGame((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
      <AnimatePresence>
        {toasts.map(({ id, kind, text }) => (
          <motion.div
            key={id}
            initial={{ y: -30, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className={clsx(
              'card pointer-events-auto flex items-center gap-2 px-4 py-2 font-bold',
              kind === ToastKind.Error ? 'bg-[#ffe3e0]' : 'bg-[#e0f5ff]',
            )}
          >
            {kind === ToastKind.Error ? <AlertTriangle size={18} /> : <Info size={18} />}
            {text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
export const ConnectionBanner = () => {
  const connected = useGame((s) => s.connected)
  const seated = useGame((s) => !!s.seat)
  if (connected || !seated) return null
  return (
    <div className="fixed inset-x-0 bottom-3 z-50 flex justify-center px-4">
      <div className="card flex items-center gap-2 bg-sunny px-4 py-2 text-sm font-bold sm:text-base">
        <WifiOff size={18} className="shrink-0 animate-pulse" />
        {COPY.connection.lost}
      </div>
    </div>
  )
}
