import { io, type Socket } from 'socket.io-client'
import {
  ClientEvent,
  ServerEvent,
  SocketLifecycle,
  TransportKind,
  type CanvasFull,
  type CanvasOpsBroadcast,
  type ChatMessage,
  type ClientToServerEvents,
  type JoinResult,
  type RoomSettings,
  type RoomView,
  type ServerToClientEvents,
} from '@doodle/shared'
import { BOT_AVATAR, BOT_WAIT_DEFAULT_MS, BOT_WAIT_POLL_MS } from './constants'

type BotSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export class Bot {
  readonly socket: BotSocket
  view: RoomView | null = null
  chats: ChatMessage[] = []
  ops: CanvasOpsBroadcast[] = []
  full: CanvasFull | null = null
  replay: unknown[] | null = null
  rejects: string[] = []
  toasts: string[] = []
  playerId = ''
  token = ''
  roomId = ''
  onOps?: (p: CanvasOpsBroadcast) => void
  keep = true

  constructor(
    readonly name: string,
    url: string,
  ) {
    this.socket = io(url, { transports: [TransportKind.WebSocket], forceNew: true, reconnection: false })
    this.socket.on(ServerEvent.State, (v) => (this.view = v))
    this.socket.on(ServerEvent.Chat, (m) => this.keep && this.chats.push(m))

    this.socket.on(ServerEvent.CanvasOps, (p) => {
      if (this.keep) this.ops.push(p)

      this.onOps?.(p)
    })

    this.socket.on(ServerEvent.CanvasFull, (p) => (this.full = p))
    this.socket.on(ServerEvent.CanvasReject, (p) => this.rejects.push(p.reason))
    this.socket.on(ServerEvent.Toast, (t) => this.toasts.push(t.text))
    this.socket.on(ServerEvent.Replay, (r) => (this.replay = r))
  }

  connected(): Promise<void> {
    return new Promise((res, rej) => {
      if (this.socket.connected) return res()

      this.socket.once(SocketLifecycle.Connect, () => res())
      this.socket.once(SocketLifecycle.ConnectError, rej)
    })
  }

  private adopt(r: JoinResult): JoinResult {
    if (r.ok) Object.assign(this, { playerId: r.playerId, token: r.token, roomId: r.roomId })

    return r
  }

  async create(settings?: Partial<RoomSettings>): Promise<JoinResult> {
    await this.connected()

    return this.adopt(
      await new Promise<JoinResult>((res) => this.socket.emit(ClientEvent.RoomCreate, { name: this.name, avatar: BOT_AVATAR, settings }, res)),
    )
  }

  async join(
    roomId: string,
    creds?: {
      playerId: string
      token: string
    },
  ): Promise<JoinResult> {
    await this.connected()

    return this.adopt(
      await new Promise<JoinResult>((res) => this.socket.emit(ClientEvent.RoomJoin, { roomId, name: this.name, avatar: BOT_AVATAR, ...creds }, res)),
    )
  }

  async waitFor(pred: (v: RoomView) => boolean, ms = BOT_WAIT_DEFAULT_MS, label = 'condition'): Promise<RoomView> {
    const t0 = Date.now()

    while (Date.now() - t0 < ms) {
      if (this.view && pred(this.view)) return this.view

      await new Promise((r) => setTimeout(r, BOT_WAIT_POLL_MS))
    }

    throw new Error(`${this.name}: timed out waiting for ${label} (phase=${this.view?.phase})`)
  }

  get isDrawer() {
    return !!this.view && this.view.drawerId === this.view.youId
  }

  say(text: string) {
    this.socket.emit(ClientEvent.Chat, text)
  }

  close() {
    this.socket.close()
  }
}
