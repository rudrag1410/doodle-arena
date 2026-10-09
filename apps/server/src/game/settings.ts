import { DEFAULT_PACKS, LIMITS, MIN_CUSTOM_WORDS_ONLY, PACK_IDS, type PackId, SETTING_BOUNDS, clampInt, type RoomSettings } from '@doodle/shared'
import { cleanWords } from '../utils/text'

export const defaultSettings = (): RoomSettings => ({
  rounds: SETTING_BOUNDS.rounds.default,
  drawTime: SETTING_BOUNDS.drawTime.default,
  packs: [...DEFAULT_PACKS],
  customWords: [],
  customOnly: false,
})

const uniquePacks = (packs: unknown[]): PackId[] => [...new Set(packs.filter((p): p is PackId => PACK_IDS.includes(p as PackId)))]

const reconcile = (s: RoomSettings): RoomSettings => {
  const enoughCustom = s.customWords.length >= MIN_CUSTOM_WORDS_ONLY
  const customOnly = s.customOnly && enoughCustom
  const packs = !customOnly && s.packs.length === 0 && !enoughCustom ? [...DEFAULT_PACKS] : s.packs

  return { ...s, customOnly, packs }
}

export function sanitizeSettings(input: Partial<RoomSettings> | undefined, base: RoomSettings): RoomSettings {
  const s: RoomSettings = { ...base }

  if (!input || typeof input !== 'object') return s

  const { rounds, drawTime } = SETTING_BOUNDS

  s.rounds = clampInt(input.rounds ?? s.rounds, rounds.min, rounds.max, s.rounds)
  s.drawTime = clampInt(input.drawTime ?? s.drawTime, drawTime.min, drawTime.max, s.drawTime)

  if (Array.isArray(input.packs)) s.packs = uniquePacks(input.packs)
  if (input.customWords !== undefined) s.customWords = cleanWords(input.customWords, LIMITS.customWords)
  if (typeof input.customOnly === 'boolean') s.customOnly = input.customOnly

  return reconcile(s)
}
