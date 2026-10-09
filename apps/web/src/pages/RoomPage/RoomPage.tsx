import { useEffect } from 'react'

import { ErrorScreen } from '@/components'
import { JoinPage } from '@/pages/JoinPage'
import { Splash } from '@/components'
import { COPY } from '@/constants/copy'
import { useJoinRoom } from '@/hooks'
import { RoomRequestError } from '@/services/rooms'
import { sessionFor, useGame, useProfileStore } from '@/store'
import type { ClientError } from '@/types'
import { SeatedRoom } from './SeatedRoom'

export const RoomPage = ({ roomId }: { roomId: string }) => {
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
  if (seated) return <SeatedRoom view={view} />
  if (join.isPending || canAutoJoin) return <Splash text={COPY.status.joining} />

  return <JoinPage roomId={roomId} />
}
