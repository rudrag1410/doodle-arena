import { useEffect } from 'react'
import { Route, Switch } from 'wouter'
import { Phase } from '@doodle/shared'
import { ConnectionBanner, Toasts } from './components/common'
import { ErrorScreen, Game, GameEnd, Home, JoinGate, Lobby, Splash } from './components/screens'
import { COPY } from './constants/copy'
import { useJoinRoom } from './hooks'
import { RoomRequestError } from './services/rooms'
import { sessionFor, useGame, useProfileStore } from './store'
import type { ClientError } from './types'
export const App = () => (
  <>
    <Switch>
      <Route path="/r/:roomId">{({ roomId }) => <RoomRoute roomId={roomId.toUpperCase()} />}</Route>
      <Route component={Home} />
    </Switch>
    <Toasts />
    <ConnectionBanner />
  </>
)
const RoomRoute = ({ roomId }: { roomId: string }) => {
  const view = useGame((s) => s.view)
  const storeError = useGame((s) => s.error)
  const { name, avatar } = useProfileStore()
  const join = useJoinRoom()
  const seated = view?.roomId === roomId
  const canAutoJoin = !!sessionFor(roomId) && !!name
  useEffect(() => {
    if (!seated && canAutoJoin && join.isIdle) join.mutate({ roomId, profile: { name, avatar } })
  }, [seated, canAutoJoin, join, roomId, name, avatar])
  const joinError: ClientError | null = join.error instanceof RoomRequestError ? { code: join.error.code, message: join.error.message } : null
  const error = storeError ?? joinError
  if (error) return <ErrorScreen error={error} />
  if (seated) {
    if (view.phase === Phase.Lobby) return <Lobby view={view} />
    if (view.phase === Phase.GameEnd) return <GameEnd view={view} />
    return <Game view={view} />
  }
  if (join.isPending || canAutoJoin) return <Splash text={COPY.status.joining} />
  return <JoinGate roomId={roomId} />
}
