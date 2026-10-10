import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CUSTOM_WORD_PATTERN, PACK_IDS, WORD_CHOICE_COUNT, type PackId } from '@doodle/shared'
import { WORDS } from '../data/words'
import { normalize } from '../utils/text'
import { pickChoices } from './wordPool'
import { defaultSettings } from './settings'

const MIN_WORDS_PER_PACK = 100
const MIN_CLASSIC_WORDS = 400

test('every pack has plenty of valid, unique words', () => {
  for (const id of PACK_IDS) {
    const words = WORDS[id as PackId]

    assert.ok(words.length >= MIN_WORDS_PER_PACK, `${id} has ${words.length} words`)
    assert.equal(new Set(words.map(normalize)).size, words.length, `${id} has duplicates`)

    for (const word of words) assert.match(word, CUSTOM_WORD_PATTERN, `${id}: "${word}" is not a valid word`)
  }
})

test('the default pack is large enough that games do not feel repetitive', () => {
  assert.ok(WORDS.classic.length >= MIN_CLASSIC_WORDS)
})

test('a choice never contains duplicates and has the expected size', () => {
  const choices = pickChoices(defaultSettings(), new Set())

  assert.equal(choices.length, WORD_CHOICE_COUNT)
  assert.equal(new Set(choices.map(normalize)).size, WORD_CHOICE_COUNT)
})

test('words already used are never offered again while others remain', () => {
  const settings = defaultSettings()
  const used = new Set<string>()
  const seen = new Set<string>()

  for (let i = 0; i < 100; i++) {
    for (const word of pickChoices(settings, used)) assert.ok(!used.has(normalize(word)))

    const [pick] = pickChoices(settings, used)

    used.add(normalize(pick!))
    assert.ok(!seen.has(normalize(pick!)), 'picked the same word twice')
    seen.add(normalize(pick!))
  }
})

test('when the pool runs out the memory resets instead of failing', () => {
  const settings = { ...defaultSettings(), customOnly: true, customWords: ['alpha', 'bravo', 'charlie', 'delta'] }
  const used = new Set(['alpha', 'bravo', 'charlie'])

  assert.equal(pickChoices(settings, used).length, WORD_CHOICE_COUNT)
})
