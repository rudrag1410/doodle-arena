import { test } from 'node:test'
import assert from 'node:assert/strict'
import { containsAnswer, isClose } from '../game/guess'
import { maskWord, normalize } from './text'

test('normalize ignores case, accents, spaces and punctuation', () => {
  assert.equal(normalize('Ice-Cream'), normalize('ice cream'))
  assert.equal(normalize('Café'), 'cafe')
})

test('isClose: one typo is close, exact and far are not', () => {
  assert.equal(isClose('elefant', 'elephant'), true)
  assert.equal(isClose('elephant', 'elephant'), false)
  assert.equal(isClose('banana', 'elephant'), false)
  assert.equal(isClose('kiet', 'kite'), true)
  assert.equal(isClose('ca', 'cat'), false)
})

test('containsAnswer matches whole words only', () => {
  assert.equal(containsAnswer('is it a banana?', 'banana'), true)
  assert.equal(containsAnswer('bananas', 'banana'), false)
  assert.equal(containsAnswer('hot dog!!', 'hot dog'), true)
  assert.equal(containsAnswer('hotdog', 'hot dog'), false)
})

test('maskWord keeps separators and shows revealed letters', () => {
  assert.equal(maskWord('ice cream', new Set([0])), 'i__ _____')
})
