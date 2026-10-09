import { clamp, floor } from 'lodash-es'
import { HINTS } from '@doodle/shared'
import { revealableIndexes } from '../utils/text'

export const hintSchedule = (word: string): readonly number[] => {
  const letters = revealableIndexes(word, new Set()).length

  return HINTS.schedule[clamp(floor(letters * HINTS.revealRatio), HINTS.minReveals, HINTS.maxReveals)] ?? []
}
