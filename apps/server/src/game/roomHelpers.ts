import { find, findIndex, max, orderBy, range } from 'lodash-es'
import { LIMITS, MAX_UNIQUE_NAME_SUFFIX, NAME_SUFFIX_ROOM, type RankingEntry, type ReplayEvent, type ReplayTurn } from '@doodle/shared'
import type { Player } from './types'

export const uniqueName = (name: string, players: Iterable<Player>): string => {
  const taken = new Set([...players].map((p) => p.name.toLowerCase()))

  if (!taken.has(name.toLowerCase())) return name

  const candidates = range(2, MAX_UNIQUE_NAME_SUFFIX).map((i) => `${name.slice(0, LIMITS.nameLen - NAME_SUFFIX_ROOM)} ${i}`)

  return find(candidates, (c) => !taken.has(c.toLowerCase())) ?? name
}

export const buildRanking = (players: Iterable<Player>): RankingEntry[] => {
  const sorted = orderBy([...players], 'score', 'desc')

  return sorted.map((p) => ({
    playerId: p.id,
    name: p.name,
    avatar: p.avatar,
    score: p.score,
    rank: findIndex(sorted, (q) => q.score === p.score) + 1,
  }))
}

interface ReplayTurnInput {
  round: number
  drawerId: string
  drawerName: string
  drawerAvatar: number
  word: string
  events: ReplayEvent[]
}

export const buildReplayTurn = (input: ReplayTurnInput): ReplayTurn => ({
  ...input,
  durationMs: max(input.events.map((e) => e.t + (e.d ?? 0))) ?? 0,
})
