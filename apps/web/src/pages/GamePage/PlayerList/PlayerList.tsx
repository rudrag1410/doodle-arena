import { orderBy } from 'lodash-es'
import { useMediaQuery } from 'usehooks-ts'
import { Phase, type RoomView } from '@doodle/shared'

import { MEDIA } from '@/constants/dom'
import { PlayerRow } from '../PlayerRow'

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
