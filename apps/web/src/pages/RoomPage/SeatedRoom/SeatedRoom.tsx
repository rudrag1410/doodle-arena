import { lazy, Suspense } from 'react'

import { Phase, type RoomView } from '@doodle/shared'

import { Splash } from '@/components'
import { COPY } from '@/constants/copy'
import { useGameSounds } from '@/hooks'
import { LobbyPage } from '@/pages/LobbyPage'

const GamePage = lazy(() => import('@/pages/GamePage').then((m) => ({ default: m.GamePage })))
const ResultsPage = lazy(() => import('@/pages/ResultsPage').then((m) => ({ default: m.ResultsPage })))

export const SeatedRoom = ({ view }: { view: RoomView }) => {
  useGameSounds(view)

  return (
    <Suspense fallback={<Splash text={COPY.status.joining} />}>
      {view.phase === Phase.Lobby && <LobbyPage view={view} />}
      {view.phase === Phase.GameEnd && <ResultsPage view={view} />}
      {view.phase !== Phase.Lobby && view.phase !== Phase.GameEnd && <GamePage view={view} />}
    </Suspense>
  )
}
