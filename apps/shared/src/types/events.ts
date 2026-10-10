import type { CanvasRejectReason, ClientEvent, JoinErrorCode, ServerEvent, ToastKind } from '../enums'
import type { CanvasFull, CanvasOps, CanvasOpsBroadcast, CanvasItem } from './canvas'
import type { ChatMessage } from './chat'
import type { ReplayTurn } from './replay'
import type { RoomSettings, RoomView } from './room'

export type JoinResult =
  | {
      ok: true
      roomId: string
      playerId: string
      token: string
    }
  | {
      ok: false
      code: JoinErrorCode
      message: string
    }

export interface CreateRoomPayload {
  name: string
  avatar: number
  settings?: Partial<RoomSettings>
}

export interface JoinRoomPayload {
  roomId: string
  name: string
  avatar: number
  playerId?: string
  token?: string
}

export interface ClientToServerEvents {
  [ClientEvent.RoomCreate]: (p: CreateRoomPayload, ack: (r: JoinResult) => void) => void
  [ClientEvent.RoomJoin]: (p: JoinRoomPayload, ack: (r: JoinResult) => void) => void
  [ClientEvent.RoomLeave]: () => void
  [ClientEvent.RoomSettings]: (p: Partial<RoomSettings>) => void
  [ClientEvent.GameStart]: () => void
  [ClientEvent.GameReset]: () => void
  [ClientEvent.TurnPick]: (index: number) => void
  [ClientEvent.CanvasOps]: (p: CanvasOps) => void
  [ClientEvent.CanvasFull]: (p: { items: CanvasItem[] }) => void
  [ClientEvent.Chat]: (text: string) => void
  [ClientEvent.TimeSync]: (ack: (serverNow: number) => void) => void
}

export interface CanvasRejectPayload {
  reason: CanvasRejectReason
  message: string
}

export interface ToastPayload {
  kind: ToastKind
  text: string
}

export interface ServerToClientEvents {
  [ServerEvent.State]: (v: RoomView) => void
  [ServerEvent.Chat]: (m: ChatMessage) => void
  [ServerEvent.CanvasOps]: (p: CanvasOpsBroadcast) => void
  [ServerEvent.CanvasFull]: (p: CanvasFull) => void
  [ServerEvent.CanvasReject]: (p: CanvasRejectPayload) => void
  [ServerEvent.Replay]: (turns: ReplayTurn[]) => void
  [ServerEvent.Toast]: (t: ToastPayload) => void
  [ServerEvent.Kicked]: (reason: string) => void
}
