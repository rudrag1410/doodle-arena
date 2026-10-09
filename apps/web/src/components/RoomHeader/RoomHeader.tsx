import { LogOut } from 'lucide-react'

import { COPY } from '@/constants/copy'
import { useLeaveRoom } from '@/hooks'
import { Logo } from '../Logo'
import { SoundToggle } from '../SoundToggle'

export const RoomHeader = () => {
  const leave = useLeaveRoom()

  return (
    <header className="flex shrink-0 items-center justify-between">
      <Logo />
      <div className="flex items-center gap-2">
        <SoundToggle />
        <button className="btn btn-sm" onClick={leave}>
          <LogOut size={16} /> {COPY.common.leave}
        </button>
      </div>
    </header>
  )
}
