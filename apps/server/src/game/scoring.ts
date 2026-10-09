import { clamp, round } from 'lodash-es'
import { SCORING } from '@doodle/shared'

interface GuessScoreInput {
  timeLeftMs: number
  totalMs: number
  earlierGuessers: number
}

export function guessPoints({ timeLeftMs, totalMs, earlierGuessers }: GuessScoreInput): number {
  const fraction = totalMs > 0 ? clamp(timeLeftMs / totalMs, 0, 1) : 0
  const early = Math.max(0, SCORING.earlyBonusMax - SCORING.earlyBonusStep * earlierGuessers)

  return SCORING.basePoints + round(SCORING.timeBonusMax * fraction) + early
}

export const drawerBonus = (points: number): number => round(points * SCORING.drawerShare)
