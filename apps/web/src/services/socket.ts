import { io, type Socket } from 'socket.io-client'
import { TransportKind, type ClientToServerEvents, type ServerToClientEvents } from '@doodle/shared'

import { RECONNECT } from '@/constants/timing'

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export const socket: GameSocket = io(import.meta.env.VITE_SERVER_URL ?? undefined, {
  autoConnect: false,
  transports: [TransportKind.WebSocket],
  reconnectionDelay: RECONNECT.delayMs,
  reconnectionDelayMax: RECONNECT.maxDelayMs,
  randomizationFactor: RECONNECT.randomization,
})
