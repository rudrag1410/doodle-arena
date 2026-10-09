import { PackId } from '../enums'
export const SETTING_BOUNDS = {
  rounds: { min: 1, max: 10, default: 3 },
  drawTime: { min: 20, max: 180, default: 80, step: 5 },
} as const
export const DEFAULT_PACKS: readonly PackId[] = [PackId.Classic]
export const WORD_CHOICE_COUNT = 3
export const GRACE_MS = 30000
export const RESTORE_GRACE_MS = 60000
export const CHOOSE_WORD_MS = 15000
export const TURN_END_MS = 6000
export const DEFAULT_PLAYER_NAME = 'Player'
export const ROOM_CODE = {
  length: 6,
  minLength: 4,
  maxLength: 8,
  alphabet: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
} as const
export const SCORING = {
  basePoints: 100,
  timeBonusMax: 400,
  earlyBonusMax: 50,
  earlyBonusStep: 10,
  drawerShare: 0.3,
} as const
export const HINTS = {
  maxReveals: 3,
  minReveals: 1,
  revealRatio: 0.4,
  schedule: {
    1: [0.5],
    2: [0.4, 0.7],
    3: [0.3, 0.55, 0.8],
  } as Record<number, readonly number[]>,
  maskChar: '_',
  separatorChar: ' ',
} as const
export const CLOSE_GUESS = {
  minWordLength: 4,
  longWordLength: 8,
  maxDistanceShort: 1,
  maxDistanceLong: 2,
} as const
export const CUSTOM_WORD_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} '\-]{0,28}[\p{L}\p{N}]$/u
export const MS_PER_SECOND = 1000
export const MAX_UNIQUE_NAME_SUFFIX = 100
export const NAME_SUFFIX_ROOM = 3
