import type { RoomSettings, ServerToClientEvents } from '@doodle/shared'
export interface Conn {
  send: <E extends keyof ServerToClientEvents>(event: E, ...args: Parameters<ServerToClientEvents[E]>) => void
  close: (reason: string) => void
}
export interface Player {
  id: string
  token: string
  name: string
  avatar: number
  score: number
  guessed: boolean
  conn: Conn | null
  graceTimer: ReturnType<typeof setTimeout> | null
}
export interface RoomOptions {
  chooseMs: number
  turnEndMs: number
  graceMs: number
  now: () => number
  onEmpty: () => void
  onChange: () => void
}
export type RoomHooks = Pick<RoomOptions, 'onEmpty' | 'onChange'>
export interface RoomSnapshot {
  id: string
  settings: RoomSettings
  hostId: string
  players: {
    id: string
    token: string
    name: string
    avatar: number
  }[]
}
export interface SnapshotFile {
  savedAt: number
  rooms: RoomSnapshot[]
}
