import type { Server, Socket } from 'socket.io'
import {
  CanvasRejectReason,
  ClientEvent,
  JoinErrorCode,
  LIMITS,
  ServerEvent,
  SocketLifecycle,
  ToastKind,
  type ClientToServerEvents,
  type JoinResult,
  type ServerToClientEvents,
} from '@doodle/shared'
import { RateName } from '../config/rates'
import { ERROR_MESSAGES, JOIN_MESSAGES } from '../constants/messages'
import { LOG_MESSAGES } from '../constants/logs'
import { MAX_RATE_STRIKES, WARN_COOLDOWN_MS } from '../constants/server'
import type { Conn } from '../game/types'
import type { Room } from '../game/room'
import type { StatsCollector } from '../http/stats'
import type { Registry } from '../registry/registry'
import { createRateLimiter, type IpGate } from '../security/rateLimit'
import { clientIp } from './clientIp'
import { createRoomSchema, joinRoomSchema } from './schemas'
export type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>
export type GameServer = Server<ClientToServerEvents, ServerToClientEvents>
export interface SocketDeps {
  registry: Registry
  stats: StatsCollector
  ipGate: IpGate
  trustProxy: boolean
}
const failure = (code: JoinErrorCode, message: string): JoinResult => ({
  ok: false,
  code,
  message,
})
export function attachSocketHandlers(io: GameServer, deps: SocketDeps) {
  io.on(SocketLifecycle.Connection, (socket: GameSocket) => handleConnection(socket, deps))
}
function handleConnection(socket: GameSocket, { registry, stats, ipGate, trustProxy }: SocketDeps) {
  stats.socketCount++
  const limiter = createRateLimiter()
  const ip = clientIp(socket, trustProxy)
  let room: Room | null = null
  let playerId: string | null = null
  let strikes = 0
  let lastWarn = 0
  const conn: Conn = {
    send: (event, ...args) => {
      socket.emit(event, ...args)
    },
    close: (reason) => {
      socket.emit(ServerEvent.Kicked, reason)
      socket.disconnect(true)
    },
  }
  const toast = (text: string | null) => {
    if (text) socket.emit(ServerEvent.Toast, { kind: ToastKind.Error, text })
  }
  const rejectCanvas = (reason: CanvasRejectReason, message: string) => socket.emit(ServerEvent.CanvasReject, { reason, message })
  const sit = (r: Room, id: string) => {
    room = r
    playerId = id
  }
  const seatResult = (r: Room, id: string, token: string): JoinResult => ({
    ok: true,
    roomId: r.id,
    playerId: id,
    token,
  })
  const guard =
    <A extends unknown[]>(bucket: RateName, fn: (...args: A) => void, onLimit?: () => void) =>
    (...args: A) => {
      if (!limiter.allow(bucket)) {
        if (++strikes > MAX_RATE_STRIKES) socket.disconnect(true)
        const t = Date.now()
        if (onLimit) onLimit()
        else if (t - lastWarn > WARN_COOLDOWN_MS) {
          lastWarn = t
          toast(ERROR_MESSAGES.slowDown)
        }
        return
      }
      try {
        fn(...args)
      } catch (err) {
        console.error(LOG_MESSAGES.handlerError, err)
      }
    }
  const admit = (ack: unknown): ack is (r: JoinResult) => void => {
    if (typeof ack !== 'function') return false
    if (!ipGate.allow(ip) || !limiter.allow(RateName.Join)) {
      ack(failure(JoinErrorCode.RateLimited, JOIN_MESSAGES.rateLimited))
      return false
    }
    return true
  }
  socket.on(ClientEvent.TimeSync, (ack) => {
    if (typeof ack === 'function') ack(Date.now())
  })
  socket.on(ClientEvent.RoomCreate, (raw, ack) => {
    if (!admit(ack)) return
    const parsed = createRoomSchema.safeParse(raw)
    if (!parsed.success) return ack(failure(JoinErrorCode.Invalid, JOIN_MESSAGES.invalid))
    if (room) return ack(failure(JoinErrorCode.Invalid, JOIN_MESSAGES.alreadyInRoom))
    const created = registry.create(parsed.data.settings as never)
    if (!created) return ack(failure(JoinErrorCode.ServerBusy, JOIN_MESSAGES.serverBusy))
    const res = created.join(parsed.data.name, parsed.data.avatar, conn)
    if ('error' in res) return ack(failure(JoinErrorCode.RoomFull, JOIN_MESSAGES.roomFull))
    sit(created, res.id)
    ack(seatResult(created, res.id, res.token))
  })
  socket.on(ClientEvent.RoomJoin, (raw, ack) => {
    if (!admit(ack)) return
    const parsed = joinRoomSchema.safeParse(raw)
    if (!parsed.success) return ack(failure(JoinErrorCode.Invalid, JOIN_MESSAGES.invalid))
    const wanted = parsed.data.roomId.toUpperCase()
    if (room) {
      const me = playerId ? room.players.get(playerId) : undefined
      if (me && room.id === wanted) return ack(seatResult(room, me.id, me.token))
      return ack(failure(JoinErrorCode.Invalid, JOIN_MESSAGES.alreadyInRoom))
    }
    const target = registry.get(wanted)
    if (!target) return ack(failure(JoinErrorCode.RoomNotFound, JOIN_MESSAGES.roomNotFound))
    if (parsed.data.playerId && parsed.data.token) {
      const back = target.rejoin(parsed.data.playerId, parsed.data.token, conn)
      if (back) {
        sit(target, back.id)
        return ack(seatResult(target, back.id, back.token))
      }
    }
    const res = target.join(parsed.data.name, parsed.data.avatar, conn)
    if ('error' in res) return ack(failure(JoinErrorCode.RoomFull, JOIN_MESSAGES.roomFullMax))
    sit(target, res.id)
    ack(seatResult(target, res.id, res.token))
  })
  socket.on(ClientEvent.RoomLeave, () => {
    if (!room || !playerId) return
    const [r, id] = [room, playerId]
    room = null
    playerId = null
    r.remove(id)
  })
  socket.on(
    ClientEvent.RoomSettings,
    guard(RateName.Control, (patch) => room && playerId && toast(room.updateSettings(playerId, patch ?? {}))),
  )
  socket.on(
    ClientEvent.GameStart,
    guard(RateName.Control, () => room && playerId && toast(room.start(playerId))),
  )
  socket.on(
    ClientEvent.GameReset,
    guard(RateName.Control, () => room && playerId && toast(room.reset(playerId))),
  )
  socket.on(
    ClientEvent.TurnPick,
    guard(RateName.Control, (i) => room && playerId && toast(room.pickWord(playerId, i))),
  )
  socket.on(
    ClientEvent.Chat,
    guard(RateName.Chat, (text) => room && playerId && room.chat(playerId, text)),
  )
  socket.on(
    ClientEvent.CanvasOps,
    guard(
      RateName.Canvas,
      (ops) => {
        if (!room || !playerId) return
        const r = room.canvasOps(playerId, ops)
        if (!r.ok) rejectCanvas(r.reason, r.message)
      },
      () => rejectCanvas(CanvasRejectReason.Rate, ERROR_MESSAGES.drawingTooFast),
    ),
  )
  socket.on(
    ClientEvent.CanvasFull,
    guard(
      RateName.CanvasFull,
      (p) => {
        if (!room || !playerId) return
        const r = room.canvasFull(playerId, p?.shapes as never)
        if (!r.ok) rejectCanvas(r.reason, r.message)
      },
      () => rejectCanvas(CanvasRejectReason.Rate, ERROR_MESSAGES.resyncTooOften),
    ),
  )
  socket.on(SocketLifecycle.Disconnect, () => {
    stats.socketCount--
    if (room && playerId) room.detach(playerId, conn)
  })
}
