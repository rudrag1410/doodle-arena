import { WifiOff } from 'lucide-react'

import { COPY } from '@/constants/copy'
import { useGame } from '@/store'

export const ConnectionBanner = () => {
  const connected = useGame((s) => s.connected)
  const seated = useGame((s) => !!s.seat)

  if (connected || !seated) return null

  return (
    <div className="fixed inset-x-0 bottom-3 z-50 flex justify-center px-4">
      <div className="card flex items-center gap-2 bg-sunny px-4 py-2 text-sm font-bold sm:text-base">
        <WifiOff size="1.125rem" className="shrink-0 animate-pulse" />
        {COPY.connection.lost}
      </div>
    </div>
  )
}
