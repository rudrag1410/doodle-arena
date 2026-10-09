import levenshtein from 'damerau-levenshtein'
import { range, some } from 'lodash-es'
import { CLOSE_GUESS } from '@doodle/shared'
import { normalize, tokenize } from '../utils/text'
export const containsAnswer = (text: string, word: string): boolean => {
  const target = normalize(word)
  const need = tokenize(word).length
  const tokens = tokenize(text)
  return some(range(tokens.length - need + 1), (i) => tokens.slice(i, i + need).join('') === target)
}
export const isClose = (guess: string, word: string): boolean => {
  const g = normalize(guess)
  const w = normalize(word)
  if (!g || g === w || w.length < CLOSE_GUESS.minWordLength) return false
  const max = w.length >= CLOSE_GUESS.longWordLength ? CLOSE_GUESS.maxDistanceLong : CLOSE_GUESS.maxDistanceShort
  return levenshtein(g, w).steps <= max
}
