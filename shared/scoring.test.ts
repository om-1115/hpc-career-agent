import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ALL_ITEMS, INTEREST_ITEMS, PERSONALITY_ITEMS, type Answers } from './test.ts'
import { CAREERS } from './careers.ts'
import { invalidAnswers, scoreTest } from './scoring.ts'

const all = (value: number): Answers => Object.fromEntries(ALL_ITEMS.map((item) => [item.id, value]))

test('the test has six interest items per RIASEC type and four personality items per trait', () => {
  for (const type of 'RIASEC') assert.equal(INTEREST_ITEMS.filter((item) => item.type === type).length, 6)
  for (const trait of 'OCEAN') assert.equal(PERSONALITY_ITEMS.filter((item) => item.trait === trait).length, 4)
  assert.equal(new Set(ALL_ITEMS.map((item) => item.id)).size, ALL_ITEMS.length)
})

test('every career has a three-letter code of distinct RIASEC types', () => {
  for (const career of CAREERS) {
    assert.equal(new Set(career.code).size, 3, career.id)
    for (const type of career.code) assert.ok('RIASEC'.includes(type), career.id)
  }
})

test('a student who loves only Social activities gets an S-first code and Social careers', () => {
  const answers = all(1)
  for (const item of INTEREST_ITEMS) if (item.type === 'S') answers[item.id] = 5
  const result = scoreTest(answers)
  assert.equal(result.interests.S, 100)
  assert.equal(result.interests.R, 0)
  assert.equal(result.code[0], 'S')
  const top = CAREERS.find((career) => career.id === result.matches[0].id)!
  assert.equal(top.code[0], 'S')
})

test('reverse-keyed personality items are reversed', () => {
  // "Agree" with every E item: the two positive ones raise E, the two reversed ones lower it.
  const answers = all(3)
  for (const item of PERSONALITY_ITEMS) if (item.trait === 'E') answers[item.id] = item.key === 1 ? 5 : 1
  assert.equal(scoreTest(answers).personality.extraversion.score, 5)
  assert.equal(scoreTest(answers).personality.extraversion.band, 'high')
})

test('calmness is neuroticism turned the kind way round', () => {
  const answers = all(3)
  for (const item of PERSONALITY_ITEMS) if (item.trait === 'N') answers[item.id] = item.key === 1 ? 5 : 1
  assert.equal(scoreTest(answers).personality.calmness.score, 1)
})

test('the same answer to everything is flagged and reads as broad interests', () => {
  const result = scoreTest(all(4))
  assert.equal(result.sameAnswerThroughout, true)
  assert.equal(result.broad, true)
})

test('incomplete, out-of-range and unknown answers are refused', () => {
  const missing = all(3)
  delete missing.r1
  assert.match(invalidAnswers(missing)!, /r1/)
  assert.match(invalidAnswers({ ...all(3), r1: 6 })!, /r1/)
  assert.match(invalidAnswers({ ...all(3), r1: 2.5 })!, /r1/)
  assert.match(invalidAnswers({ ...all(3), zz: 3 })!, /zz/)
  assert.throws(() => scoreTest(missing))
})
