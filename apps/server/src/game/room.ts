import { random, sample } from 'lodash-es'
import {
  AVATARS,
  CanvasRejectReason,
  ChatKind,
  DEFAULT_PLAYER_NAME,
  JoinErrorCode,
  LIMITS,
  MIN_PLAYERS_IN_GAME,
  MIN_PLAYERS_TO_START,
  Phase,
  ServerEvent,
  TurnEndReason,
  clampInt,
  type CanvasOps,
  type ChatMessage,
  type RankingEntry,
  type ReplayTurn,
  type RoomSettings,
  type RoomView,
  type CanvasItem,
  type TurnResult,
} from '@doodle/shared'
import { CanvasStore } from '../canvas/canvasStore'
import { env } from '../config/env'
import { CHAT_MESSAGES, ERROR_MESSAGES, KICK_REASONS } from '../constants/messages'
import { newPlayerId, newToken } from '../utils/id'
import { cleanChat, cleanName, normalize, revealableIndexes } from '../utils/text'
import { hintSchedule } from './hints'
import { drawerBonus, guessPoints } from './scoring'
import { sanitizeSettings } from './settings'
import type { Conn, Player, RoomHooks, RoomOptions, RoomSnapshot } from './types'
import { buildRanking, buildReplayTurn, uniqueName } from './roomHelpers'
import { pickChoices } from './wordPool'
import { buildRoomView, type ViewSource } from './roomView'
import { routeChat } from './chatRoute'
import { TurnTimers } from './turnTimers'

const DEFAULT_OPTIONS: Omit<RoomOptions, keyof RoomHooks> = {
  chooseMs: env.chooseMs,
  turnEndMs: env.turnEndMs,
  graceMs: env.graceMs,
  now: Date.now,
}

type CanvasResult =
  | {
      ok: true
    }
  | {
      ok: false
      reason: CanvasRejectReason
      message: string
    }

export class Room {
  readonly id: string
  settings: RoomSettings
  hostId = ''
  readonly players = new Map<string, Player>()
  phase: Phase = Phase.Lobby
  round = 0
  drawerId: string | null = null
  readonly canvas: CanvasStore
  replay: ReplayTurn[] = []
  readonly createdAt: number
  private opts: RoomOptions
  private word: string | null = null
  private choices: string[] | null = null
  private revealed = new Set<number>()
  private drawn = new Set<string>()
  private drawerInfo = { name: DEFAULT_PLAYER_NAME, avatar: 0 }
  private used = new Set<string>()
  private deltas = new Map<string, number>()
  private turnResult: TurnResult | null = null
  private ranking: RankingEntry[] | null = null
  private phaseEndsAt: number | null = null
  private phaseDurationMs: number | null = null
  private readonly timers = new TurnTimers()
  private msgSeq = 0
  private destroyed = false

  constructor(id: string, settings: RoomSettings, opts: Partial<RoomOptions> & RoomHooks) {
    this.id = id
    this.settings = settings
    this.opts = { ...DEFAULT_OPTIONS, ...opts }
    this.canvas = new CanvasStore(this.opts.now)
    this.createdAt = this.opts.now()
  }

  get connectedPlayers(): Player[] {
    return [...this.players.values()].filter((p) => p.conn)
  }

  join(
    name: unknown,
    avatar: unknown,
    conn: Conn,
  ):
    | Player
    | {
        error: JoinErrorCode.RoomFull
      } {
    if (this.players.size >= LIMITS.maxPlayers) return { error: JoinErrorCode.RoomFull }

    const player: Player = {
      id: newPlayerId(),
      token: newToken(),
      name: uniqueName(cleanName(name, LIMITS.nameLen, DEFAULT_PLAYER_NAME), this.players.values()),
      avatar: clampInt(avatar, 0, AVATARS.length - 1, 0),
      score: 0,
      guessed: false,
      conn,
      graceTimer: null,
    }

    this.players.set(player.id, player)

    if (!this.hostId || !this.players.has(this.hostId)) this.hostId = player.id

    this.systemChat(CHAT_MESSAGES.joined(player.name))
    this.syncNewcomer(player)
    this.commit()

    return player
  }

  rejoin(playerId: string, token: string, conn: Conn): Player | null {
    const p = this.players.get(playerId)

    if (!p || p.token !== token) return null
    if (p.graceTimer) clearTimeout(p.graceTimer)

    p.graceTimer = null

    const old = p.conn

    p.conn = conn

    if (old && old !== conn) old.close(KICK_REASONS.replaced)

    this.syncNewcomer(p)
    this.emitState()

    return p
  }

  detach(playerId: string, conn: Conn) {
    const p = this.players.get(playerId)

    if (!p || p.conn !== conn) return

    p.conn = null
    p.graceTimer = setTimeout(() => this.remove(playerId), this.opts.graceMs)
    this.emitState()
  }

  remove(playerId: string) {
    const p = this.players.get(playerId)

    if (!p || this.destroyed) return
    if (p.graceTimer) clearTimeout(p.graceTimer)

    this.players.delete(playerId)
    this.drawn.delete(playerId)
    this.systemChat(CHAT_MESSAGES.left(p.name))

    if (this.players.size === 0) {
      this.destroy()
      this.opts.onEmpty()

      return
    }

    if (this.hostId === playerId) this.promoteHost()
    if (!this.recoverAfterLeave(playerId)) this.commit()
  }

  private promoteHost() {
    const next = this.connectedPlayers[0] ?? [...this.players.values()][0]

    if (!next) return

    this.hostId = next.id
    this.systemChat(CHAT_MESSAGES.newHost(next.name))
  }

  private recoverAfterLeave(leftId: string): boolean {
    const tooFew = this.players.size < MIN_PLAYERS_IN_GAME

    if ((this.inTurn || this.phase === Phase.TurnEnd) && tooFew) {
      this.abortToLobby()

      return true
    }

    if (!this.inTurn) return false

    if (leftId === this.drawerId) {
      this.systemChat(CHAT_MESSAGES.drawerLeft)
      this.endTurn(TurnEndReason.DrawerLeft)

      return true
    }

    if (this.phase === Phase.Drawing && this.everyoneGuessed()) {
      this.endTurn(TurnEndReason.AllGuessed)

      return true
    }

    return false
  }

  private syncNewcomer(p: Player) {
    if (!p.conn) return

    p.conn.send(ServerEvent.CanvasFull, { seq: this.canvas.seq, items: this.canvas.snapshot() })

    if (this.phase === Phase.GameEnd) p.conn.send(ServerEvent.Replay, this.replay)
  }

  updateSettings(by: string, patch: Partial<RoomSettings>): string | null {
    if (by !== this.hostId) return ERROR_MESSAGES.onlyHostSettings
    if (this.phase !== Phase.Lobby) return ERROR_MESSAGES.settingsLocked

    this.settings = sanitizeSettings(patch, this.settings)
    this.commit()

    return null
  }

  start(by: string): string | null {
    if (by !== this.hostId) return ERROR_MESSAGES.onlyHostStart
    if (this.phase !== Phase.Lobby) return ERROR_MESSAGES.gameRunning
    if (this.connectedPlayers.length < MIN_PLAYERS_TO_START) return ERROR_MESSAGES.needPlayers

    this.players.forEach((p) => (p.score = 0))
    this.round = 1
    this.drawn.clear()
    this.used.clear()
    this.replay = []
    this.ranking = null
    this.turnResult = null
    this.nextTurn()

    return null
  }

  reset(by: string): string | null {
    if (by !== this.hostId) return ERROR_MESSAGES.onlyHost
    if (this.phase !== Phase.GameEnd) return ERROR_MESSAGES.gameNotFinished

    this.toLobby()

    return null
  }

  private toLobby() {
    this.clearTimers()
    this.phase = Phase.Lobby
    this.round = 0
    this.drawerId = null
    this.word = null
    this.choices = null
    this.turnResult = null
    this.ranking = null
    this.replay = []
    this.drawn.clear()

    this.players.forEach((p) => {
      p.score = 0
      p.guessed = false
    })

    this.resetCanvas()
    this.phaseEndsAt = this.phaseDurationMs = null
    this.commit()
  }

  private abortToLobby() {
    this.toLobby()
    this.systemChat(CHAT_MESSAGES.notEnoughPlayers)
  }

  private nextTurn() {
    this.clearTimers()

    if (this.connectedPlayers.length < MIN_PLAYERS_IN_GAME) return this.abortToLobby()

    const queue = () => [...this.players.values()].filter((p) => !this.drawn.has(p.id) && p.conn)
    let candidates = queue()

    if (candidates.length === 0) {
      if (this.round >= this.settings.rounds) return this.endGame()

      this.round++
      this.drawn.clear()
      candidates = queue()

      if (candidates.length === 0) return this.abortToLobby()
    }

    const drawer = candidates[0]

    if (!drawer) return this.abortToLobby()

    this.drawn.add(drawer.id)
    this.drawerId = drawer.id
    this.drawerInfo = { name: drawer.name, avatar: drawer.avatar }
    this.word = null
    this.turnResult = null
    this.revealed.clear()
    this.deltas.clear()
    this.players.forEach((p) => (p.guessed = false))
    const choices = pickChoices(this.settings, this.used)

    this.choices = choices
    this.resetCanvas()
    this.phase = Phase.Choosing
    this.setPhaseClock(this.opts.chooseMs)
    this.timers.schedulePhase(() => this.pickWord(drawer.id, random(choices.length - 1)), this.opts.chooseMs)
    this.systemChat(CHAT_MESSAGES.choosing(drawer.name))
    this.commit()
  }

  pickWord(by: string, index: number): string | null {
    if (this.phase !== Phase.Choosing || by !== this.drawerId || !this.choices) return ERROR_MESSAGES.notChoosing
    if (!Number.isInteger(index) || index < 0 || index >= this.choices.length) return ERROR_MESSAGES.invalidChoice

    const word = this.choices[index]

    if (!word) return ERROR_MESSAGES.invalidChoice

    this.clearTimers()
    this.word = word
    this.used.add(normalize(word))
    this.choices = null
    this.startDrawing()

    return null
  }

  private startDrawing() {
    const word = this.word

    if (!word) return

    this.phase = Phase.Drawing
    this.canvas.reset()

    const total = this.settings.drawTime * 1000

    this.setPhaseClock(total)
    this.timers.schedulePhase(() => this.endTurn(TurnEndReason.Time), total)
    hintSchedule(word).forEach((fraction) => this.timers.scheduleHint(() => this.revealLetter(), total * fraction))
    this.commit()
  }

  private revealLetter() {
    if (this.phase !== Phase.Drawing || !this.word) return

    const options = revealableIndexes(this.word, this.revealed)

    const pick = sample(options)

    if (options.length <= 1 || pick === undefined) return

    this.revealed.add(pick)
    this.emitState()
  }

  private everyoneGuessed(): boolean {
    const guessers = this.connectedPlayers.filter((p) => p.id !== this.drawerId)

    return guessers.length > 0 && guessers.every((p) => p.guessed)
  }

  private endTurn(reason: TurnEndReason) {
    if (this.phase !== Phase.Drawing && this.phase !== Phase.Choosing) return

    this.clearTimers()

    const drawer = this.drawer

    const { word, drawerId } = this

    if (!word || !drawerId) {
      this.nextTurn()

      return
    }

    this.turnResult = {
      word,
      drawerId,
      reason,
      deltas: Object.fromEntries(this.deltas),
    }

    if (this.canvas.events.length > 0) {
      this.replay.push(
        buildReplayTurn({
          round: this.round,
          drawerId,
          drawerName: drawer?.name ?? this.drawerInfo.name,
          drawerAvatar: drawer?.avatar ?? this.drawerInfo.avatar,
          word,
          events: this.canvas.events,
        }),
      )

      this.canvas.events = []
    }

    this.phase = Phase.TurnEnd
    this.setPhaseClock(this.opts.turnEndMs)
    this.timers.schedulePhase(() => this.nextTurn(), this.opts.turnEndMs)
    this.systemChat(CHAT_MESSAGES.wordWas(word))
    this.commit()
  }

  private endGame() {
    this.clearTimers()
    this.phase = Phase.GameEnd
    this.drawerId = null
    this.word = null
    this.ranking = buildRanking(this.players.values())
    this.phaseEndsAt = this.phaseDurationMs = null
    this.emitState()
    this.broadcast((c) => c.send(ServerEvent.Replay, this.replay))
    this.opts.onChange()
  }

  chat(by: string, raw: unknown) {
    const p = this.players.get(by)

    if (!p) return

    const text = cleanChat(raw, LIMITS.chatLen)

    if (!text) return

    const route = routeChat({ phase: this.phase, word: this.word, drawerId: this.drawerId }, p, text)

    switch (route.type) {
      case 'secret':
        this.deliver({ kind: ChatKind.Secret, playerId: p.id, name: p.name, text }, (q) => q.id === this.drawerId || q.guessed)

        return
      case 'correct':
        this.awardGuess(p)

        return
      case 'open':
        this.deliver({ kind: ChatKind.Chat, playerId: p.id, name: p.name, text }, () => true)

        if (route.close) this.deliver({ kind: ChatKind.Close, text: CHAT_MESSAGES.closeGuess(text) }, (q) => q.id === p.id)
    }
  }

  private awardGuess(p: Player) {
    const points = guessPoints({
      timeLeftMs: (this.phaseEndsAt ?? 0) - this.opts.now(),
      totalMs: this.settings.drawTime * 1000,
      earlierGuessers: [...this.players.values()].filter((q) => q.guessed).length,
    })

    p.guessed = true
    this.credit(p, points)

    const drawer = this.drawer

    if (drawer) this.credit(drawer, drawerBonus(points))

    this.deliver({ kind: ChatKind.Correct, playerId: p.id, name: p.name, text: CHAT_MESSAGES.guessed(p.name) }, () => true)

    if (this.everyoneGuessed()) {
      this.endTurn(TurnEndReason.AllGuessed)
    } else {
      this.commit()
    }
  }

  private credit(p: Player, points: number) {
    p.score += points
    this.deltas.set(p.id, (this.deltas.get(p.id) ?? 0) + points)
  }

  private systemChat(text: string) {
    this.deliver({ kind: ChatKind.System, text }, () => true)
  }

  private deliver(msg: Pick<ChatMessage, 'kind' | 'playerId' | 'name' | 'text'>, to: (p: Player) => boolean) {
    const full: ChatMessage = { id: `${this.opts.now()}-${this.msgSeq++}`, ts: this.opts.now(), ...msg }

    for (const p of this.players.values()) if (p.conn && to(p)) p.conn.send(ServerEvent.Chat, full)
  }

  private get inTurn() {
    return this.phase === Phase.Choosing || this.phase === Phase.Drawing
  }

  private get drawer() {
    return this.drawerId ? this.players.get(this.drawerId) : undefined
  }

  private commit() {
    this.emitState()
    this.opts.onChange()
  }

  private resetCanvas() {
    this.canvas.reset()
    this.broadcast((c) => c.send(ServerEvent.CanvasFull, { seq: 0, items: [] }))
  }

  private canDraw(by: string) {
    return by === this.drawerId && this.phase === Phase.Drawing
  }

  canvasOps(by: string, ops: CanvasOps): CanvasResult {
    if (!this.canDraw(by)) return { ok: false, reason: CanvasRejectReason.NotDrawer, message: ERROR_MESSAGES.notDrawing }

    if (
      !Array.isArray(ops?.puts) ||
      !Array.isArray(ops?.removes) ||
      ops.puts.length > LIMITS.opsPerMessage ||
      ops.removes.length > LIMITS.canvasItems
    ) {
      return { ok: false, reason: CanvasRejectReason.TooLarge, message: ERROR_MESSAGES.tooManyOps }
    }

    const r = this.canvas.apply(ops.puts, ops.removes)

    if (!r.ok) return r

    if (r.puts.length || r.removes.length) {
      this.broadcast((c) => c.send(ServerEvent.CanvasOps, { seq: r.seq, puts: r.puts, removes: r.removes }), by)
    }

    return { ok: true }
  }

  canvasFull(by: string, items: CanvasItem[]): CanvasResult {
    if (!this.canDraw(by)) return { ok: false, reason: CanvasRejectReason.NotDrawer, message: ERROR_MESSAGES.notDrawing }

    if (!Array.isArray(items) || items.length > LIMITS.canvasItems) {
      return { ok: false, reason: CanvasRejectReason.TooLarge, message: ERROR_MESSAGES.tooManyItems }
    }

    const r = this.canvas.replaceAll(items)

    if (!r.ok) return r

    this.broadcast((c) => c.send(ServerEvent.CanvasFull, { seq: this.canvas.seq, items: this.canvas.snapshot() }), by)

    return { ok: true }
  }

  private viewSource(): ViewSource {
    return {
      id: this.id,
      phase: this.phase,
      settings: this.settings,
      hostId: this.hostId,
      players: this.players,
      round: this.round,
      drawerId: this.drawerId,
      phaseEndsAt: this.phaseEndsAt,
      phaseDurationMs: this.phaseDurationMs,
      now: this.opts.now(),
      word: this.word,
      revealed: this.revealed,
      choices: this.choices,
      turnResult: this.turnResult,
      ranking: this.ranking,
      graceMs: this.opts.graceMs,
    }
  }

  viewFor(p: Player): RoomView {
    return buildRoomView(this.viewSource(), p)
  }

  emitState() {
    const source = this.viewSource()

    for (const p of this.players.values()) p.conn?.send(ServerEvent.State, buildRoomView(source, p))
  }

  private broadcast(fn: (c: Conn) => void, exceptPlayerId?: string) {
    for (const p of this.players.values()) if (p.conn && p.id !== exceptPlayerId) fn(p.conn)
  }

  private setPhaseClock(ms: number) {
    this.phaseDurationMs = ms
    this.phaseEndsAt = this.opts.now() + ms
  }

  private clearTimers() {
    this.timers.clear()
  }

  destroy() {
    this.destroyed = true
    this.clearTimers()
    this.players.forEach((p) => p.graceTimer && clearTimeout(p.graceTimer))
  }

  snapshot(): RoomSnapshot {
    return {
      id: this.id,
      settings: this.settings,
      hostId: this.hostId,
      players: [...this.players.values()].map(({ id, token, name, avatar }) => ({ id, token, name, avatar })),
    }
  }

  static restore(snap: RoomSnapshot, opts: Partial<RoomOptions> & RoomHooks, graceMs: number, defaults: RoomSettings): Room {
    const room = new Room(snap.id, sanitizeSettings(snap.settings, defaults), opts)

    for (const sp of snap.players) {
      const p: Player = { ...sp, score: 0, guessed: false, conn: null, graceTimer: null }

      p.graceTimer = setTimeout(() => room.remove(p.id), graceMs)
      room.players.set(p.id, p)
    }

    room.hostId = room.players.has(snap.hostId) ? snap.hostId : (room.players.keys().next().value ?? '')

    return room
  }
}
