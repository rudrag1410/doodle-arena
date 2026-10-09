import { deburr, take, trim, truncate, uniqBy, words } from 'lodash-es'
import { CUSTOM_WORD_PATTERN, HINTS } from '@doodle/shared'
const NON_ALNUM = /[^\p{L}\p{N}]/gu
const WORD_TOKEN = /[\p{L}\p{N}]+/gu
const LETTER = /[\p{L}\p{N}]/u
const CONTROL_CHARS = /\p{Cc}/gu
const WHITESPACE_RUN = /\s+/g
const fold = (s: string) => deburr(s).toLowerCase()
export const normalize = (s: string): string => fold(s).replace(NON_ALNUM, '')
export const tokenize = (s: string): string[] => words(fold(s), WORD_TOKEN)
export const isLetter = (ch: string) => LETTER.test(ch)
export const maskWord = (word: string, revealed: ReadonlySet<number>): string =>
  [...word].map((ch, i) => (!isLetter(ch) || revealed.has(i) ? ch : HINTS.maskChar)).join('')
export const revealableIndexes = (word: string, revealed: ReadonlySet<number>): number[] =>
  [...word].flatMap((ch, i) => (isLetter(ch) && !revealed.has(i) ? [i] : []))
const squish = (s: string) => trim(s.replace(WHITESPACE_RUN, ' '))
export const cleanWords = (input: unknown, max: number): string[] => {
  if (!Array.isArray(input)) return []
  const candidates = input.filter((w): w is string => typeof w === 'string').map(squish)
  return take(
    uniqBy(
      candidates.filter((w) => CUSTOM_WORD_PATTERN.test(w)),
      normalize,
    ),
    max,
  )
}
export const cleanName = (raw: unknown, max: number, fallback: string): string =>
  truncate(squish(String(raw ?? '').replace(CONTROL_CHARS, '')), { length: max, omission: '' }) || fallback
export const cleanChat = (raw: unknown, max: number): string =>
  truncate(squish(String(raw ?? '').replace(CONTROL_CHARS, ' ')), { length: max, omission: '' })
