import { ClientEvent, SocketLifecycle, type JoinErrorCode, type JoinResult, type RoomSettings } from '@doodle/shared'
import { REQUEST_TIMEOUT_MS } from '../constants/api'
import { useSessionStore } from '../store/sessionStore'
import type { Profile, Session } from '../types'
import { socket } from './socket'
export class RoomRequestError extends Error {
  constructor(
    readonly code: JoinErrorCode,
    message: string,
  ) {
    super(message)
  }
}
const connect = () =>
  socket.connected
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        socket.once(SocketLifecycle.Connect, () => resolve())
        socket.connect()
      })
const toSession = (res: JoinResult): Session => {
  if (!res.ok) throw new RoomRequestError(res.code, res.message)
  return { roomId: res.roomId, playerId: res.playerId, token: res.token }
}
export const createRoomRequest = async (profile: Profile, settings?: Partial<RoomSettings>): Promise<Session> => {
  await connect()
  return toSession(await socket.timeout(REQUEST_TIMEOUT_MS).emitWithAck(ClientEvent.RoomCreate, { ...profile, settings }))
}
export const joinRoomRequest = async (roomId: string, profile: Profile): Promise<Session> => {
  await connect()
  const prior = useSessionStore.getState().session
  const credentials = prior?.roomId === roomId.toUpperCase() ? { playerId: prior.playerId, token: prior.token } : {}
  return toSession(await socket.timeout(REQUEST_TIMEOUT_MS).emitWithAck(ClientEvent.RoomJoin, { roomId, ...profile, ...credentials }))
}
