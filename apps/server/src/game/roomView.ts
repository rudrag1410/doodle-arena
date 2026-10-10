import { round } from 'lodash-es'
import { MS_PER_SECOND, Phase, type PublicPlayer, type RankingEntry, type RoomSettings, type RoomView, type TurnResult } from '@doodle/shared'
import { NOTICE_MESSAGES } from '../constants/messages'
import { maskWord } from '../utils/text'
import type { Player } from './types'

export interface ViewSource {
  id: string
  phase: Phase
  settings: RoomSettings
  hostId: string
  players: ReadonlyMap<string, Player>
  round: number
  drawerId: string | null
  phaseEndsAt: number | null
  phaseDurationMs: number | null
  now: number
  word: string | null
  revealed: ReadonlySet<number>
  choices: string[] | null
  turnResult: TurnResult | null
  ranking: RankingEntry[] | null
  graceMs: number
}

const toPublicPlayer = (p: Player): PublicPlayer => ({
  id: p.id,
  name: p.name,
  avatar: p.avatar,
  score: p.score,
  connected: !!p.conn,
  guessed: p.guessed,
})

const drawerAwayNotice = (s: ViewSource): string | null => {
  const drawer = s.drawerId ? s.players.get(s.drawerId) : undefined
  const inTurn = s.phase === Phase.Choosing || s.phase === Phase.Drawing

  if (!drawer || drawer.conn || !inTurn) return null

  return NOTICE_MESSAGES.drawerAway(drawer.name, round(s.graceMs / MS_PER_SECOND))
}

export const buildRoomView = (s: ViewSource, viewer: Player): RoomView => {
  const word = s.phase === Phase.Drawing ? s.word : null
  const isDrawer = viewer.id === s.drawerId
  const canSeeWord = !!word && (isDrawer || viewer.guessed)

  return {
    roomId: s.id,
    phase: s.phase,
    settings: viewer.id === s.hostId ? s.settings : { ...s.settings, customWords: [] },
    customWordCount: s.settings.customWords.length,
    hostId: s.hostId,
    youId: viewer.id,
    players: [...s.players.values()].map(toPublicPlayer),
    round: s.round,
    totalRounds: s.settings.rounds,
    drawerId: s.drawerId,
    phaseEndsAt: s.phaseEndsAt,
    phaseDurationMs: s.phaseDurationMs,
    serverNow: s.now,
    hint: word ? maskWord(word, s.revealed) : null,
    word: canSeeWord ? word : null,
    wordChoices: s.phase === Phase.Choosing && isDrawer ? s.choices : null,
    turnResult: s.phase === Phase.TurnEnd ? s.turnResult : null,
    ranking: s.phase === Phase.GameEnd ? s.ranking : null,
    notice: drawerAwayNotice(s),
  }
}
