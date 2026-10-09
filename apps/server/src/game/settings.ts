import { DEFAULT_PACKS, LIMITS, MIN_CUSTOM_WORDS_ONLY, PACK_IDS, PackId, SETTING_BOUNDS, clampInt, type RoomSettings } from '@doodle/shared'
import { cleanWords } from '../utils/text'
export const defaultSettings = (): RoomSettings => ({
  rounds: SETTING_BOUNDS.rounds.default,
  drawTime: SETTING_BOUNDS.drawTime.default,
  packs: [...DEFAULT_PACKS],
  customWords: [],
  customOnly: false,
})
export function sanitizeSettings(input: Partial<RoomSettings> | undefined, base: RoomSettings): RoomSettings {
  const s: RoomSettings = { ...base }
  if (!input || typeof input !== 'object') return s
  const { rounds, drawTime } = SETTING_BOUNDS
  s.rounds = clampInt(input.rounds ?? s.rounds, rounds.min, rounds.max, s.rounds)
  s.drawTime = clampInt(input.drawTime ?? s.drawTime, drawTime.min, drawTime.max, s.drawTime)
  if (Array.isArray(input.packs)) {
    s.packs = [...new Set(input.packs.filter((p): p is PackId => PACK_IDS.includes(p)))]
  }
  if (input.customWords !== undefined) s.customWords = cleanWords(input.customWords, LIMITS.customWords)
  if (typeof input.customOnly === 'boolean') s.customOnly = input.customOnly
  if (s.customOnly && s.customWords.length < MIN_CUSTOM_WORDS_ONLY) s.customOnly = false
  if (!s.customOnly && s.packs.length === 0 && s.customWords.length < MIN_CUSTOM_WORDS_ONLY) s.packs = [...DEFAULT_PACKS]
  return s
}
