import type { PackId, Phase, TurnEndReason } from '../enums'

export interface RoomSettings {
  rounds: number
  drawTime: number
  packs: PackId[]
  customWords: string[]
  customOnly: boolean
}

export interface PublicPlayer {
  id: string
  name: string
  avatar: number
  score: number
  connected: boolean
  guessed: boolean
}

export interface TurnResult {
  word: string
  drawerId: string
  reason: TurnEndReason
  deltas: Record<string, number>
}

export interface RankingEntry {
  playerId: string
  name: string
  avatar: number
  score: number
  rank: number
}

export interface RoomView {
  roomId: string
  phase: Phase
  settings: RoomSettings
  customWordCount: number
  hostId: string
  youId: string
  players: PublicPlayer[]
  round: number
  totalRounds: number
  drawerId: string | null
  phaseEndsAt: number | null
  phaseDurationMs: number | null
  serverNow: number
  hint: string | null
  word: string | null
  wordChoices: string[] | null
  turnResult: TurnResult | null
  ranking: RankingEntry[] | null
  notice: string | null
}

export interface RoomInfo {
  exists: boolean
  players?: number
  maxPlayers?: number
  phase?: Phase
  host?: string | null
}

export interface ServerStats {
  rooms: number
  players: number
  sockets: number
  cpuPct: number
  rssMB: number
  heapMB: number
  eventLoopMeanMs: number
  eventLoopP99Ms: number
  uptimeSec: number
}
