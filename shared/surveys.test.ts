import { test } from 'node:test'
import assert from 'node:assert/strict'
import { invalidSurveyAnswers, SURVEYS, surveyById, UNCLEAR, type SurveyAnswers, type SurveyDefinition } from './surveys.ts'

/** Answer every question with its first option, the middle of the scale, and a sentence. */
function sample(survey: SurveyDefinition): SurveyAnswers {
  return Object.fromEntries(
    survey.questions.map((question) => [
      question.id,
      question.kind === 'choice' ? question.options[0].value : question.kind === 'multi' ? [question.options[0].value] : question.kind === 'scale' ? 3 : 'something I wrote',
    ]),
  )
}

test('the four surveys exist, with unique question ids', () => {
  assert.deepEqual(SURVEYS.map((survey) => survey.id).sort(), ['goal-academic', 'goal-non-academic', 'looking-forward', 'skills'])
  for (const survey of SURVEYS) assert.equal(new Set(survey.questions.map((question) => question.id)).size, survey.questions.length)
})

test('complete answers pass; each survey reflects them back in the first person', () => {
  for (const survey of SURVEYS) {
    const answers = sample(survey)
    assert.equal(invalidSurveyAnswers(survey, answers), null, survey.id)
    const reflection = survey.reflect(answers)
    assert.match(reflection, /\b(I|I’m|My)\b/, survey.id)
    assert.ok(reflection.length > 40 && reflection.length <= 500, `${survey.id}: ${reflection.length}`)
    assert.doesNotMatch(reflection, /undefined|null|\$\{/, survey.id)
  }
})

test('"I don’t understand this question" is a valid answer, and is left out of the reflection', () => {
  const survey = surveyById('looking-forward')!
  const answers = { ...sample(survey), stream: UNCLEAR }
  assert.equal(invalidSurveyAnswers(survey, answers), null)
  assert.doesNotMatch(survey.reflect(answers), /thinking about/)
})

test('missing, unknown, out-of-range and too-many answers are refused', () => {
  const survey = surveyById('goal-academic')!
  const answers = sample(survey)
  const { goal: _goal, ...withoutGoal } = answers
  assert.match(invalidSurveyAnswers(survey, withoutGoal)!, /goal is not answered/)
  assert.match(invalidSurveyAnswers(survey, { ...answers, extra: 'x' })!, /unknown question/)
  assert.match(invalidSurveyAnswers(survey, { ...answers, subject: 'cricket' })!, /not one of the options/)
  assert.match(invalidSurveyAnswers(survey, { ...answers, confidence: 9 })!, /1–5/)
  assert.match(invalidSurveyAnswers(survey, { ...answers, how: ['daily', 'ask', 'friend', 'notes'] })!, /up to 3/)
  assert.match(invalidSurveyAnswers(survey, { ...answers, goal: 'x'.repeat(151) })!, /150 characters/)
  assert.match(invalidSurveyAnswers(survey, 'nope')!, /object/)
})
