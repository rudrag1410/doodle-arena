import { Users } from 'lucide-react'
import { Phase, type RoomInfo } from '@doodle/shared'

import { COPY } from '@/constants/copy'

export const RoomSummary = ({ info }: { info: RoomInfo }) => {
  if (info.players === undefined) return null

  const inProgress = !!info.phase && info.phase !== Phase.Lobby

  return (
    <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft">
      <Users size={15} /> {COPY.gate.inRoom(info.players)}
      {info.host && COPY.gate.hostedBy(info.host)}
      {inProgress && COPY.gate.inProgress}
    </div>
  )
}
