import { sampleSize, uniqBy } from 'lodash-es'
import { WORD_CHOICE_COUNT, type RoomSettings } from '@doodle/shared'
import { WORDS } from '../data/words'
import { normalize } from '../utils/text'
export const buildPool = (s: RoomSettings): string[] => {
  const packWords = s.customOnly ? [] : s.packs.flatMap((p) => WORDS[p])
  return uniqBy([...packWords, ...s.customWords].reverse(), normalize).reverse()
}
export const pickChoices = (settings: RoomSettings, used: Set<string>): string[] => {
  let pool = buildPool(settings).filter((w) => !used.has(normalize(w)))
  if (pool.length < WORD_CHOICE_COUNT) {
    used.clear()
    pool = buildPool(settings)
  }
  return sampleSize(pool, WORD_CHOICE_COUNT)
}
