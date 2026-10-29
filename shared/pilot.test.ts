import { test } from 'node:test'
import assert from 'node:assert/strict'
import { countCareers, MIN_GROUP, pilotImpact, type PilotInput } from './pilot.ts'
import { invalidSurveyAnswers, PILOT_SURVEYS, surveyById, UNCLEAR } from './surveys.ts'

test('careers are counted the way students write them, each one once', () => {
  assert.equal(countCareers('teacher, nurse, Teacher'), 2)
  assert.equal(countCareers('doctor and engineer\npolice or army'), 4)
  assert.equal(countCareers('1. pilot 2) farmer'), 1, 'one line with no separator is one item')
  assert.equal(countCareers('1. pilot\n2) farmer\n- chef'), 3)
  assert.equal(countCareers('डॉक्टर, शिक्षक aur nurse'), 3)
  assert.equal(countCareers(' , ,  ?'), 0)
  assert.equal(countCareers(undefined), 0)
})

test('the before and after questions are valid surveys that need no reflection', () => {
  assert.deepEqual(PILOT_SURVEYS.map((survey) => survey.id), ['pilot-before', 'pilot-after'])
  const before = surveyById('pilot-before')!
  assert.equal(before.pilot, true)
  assert.equal(invalidSurveyAnswers(before, { route: 'no', stream: 2, guided: 'no' }), null, 'careers can be left empty')
  assert.equal(invalidSurveyAnswers(before, { careers: 'teacher', route: UNCLEAR, stream: UNCLEAR, guided: 'yes' }), null)
  assert.match(invalidSurveyAnswers(before, { careers: 'teacher', stream: 2, guided: 'no' })!, /route is not answered/)
  assert.equal(before.reflect({}), '')
})

/** A class where each student does before → test → after, one minute apart. */
function classOf(size: number, change: (index: number) => { before: Record<string, unknown>; after: Record<string, unknown> }): PilotInput {
  const input: PilotInput = { students: size, surveys: {}, tests: {} }
  for (let index = 0; index < size; index++) {
    const code = `P${index}`
    const { before, after } = change(index)
    input.surveys[code] = {
      'pilot-before': { answers: before, completedAt: '2026-11-10T09:00:00.000Z' },
      'pilot-after': { answers: after, completedAt: '2026-11-10T09:30:00.000Z' },
    }
    input.tests[code] = ['2026-11-10T09:20:00.000Z']
  }
  return input
}

test('below the minimum group, only counts are shown', () => {
  const impact = pilotImpact(classOf(MIN_GROUP - 1, () => ({ before: { route: 'no' }, after: { route: 'yes' } })))
  assert.equal(impact.paired, MIN_GROUP - 1)
  assert.equal(impact.results, null)
})

test('each student is compared with themselves, before → after', () => {
  const impact = pilotImpact(
    classOf(6, (index) => ({
      before: { careers: 'teacher, nurse', route: index < 3 ? 'yes' : 'no', stream: 2, guided: index === 0 ? 'yes' : 'no' },
      after: {
        careers: 'teacher, nurse, electrician, pharmacist, lab technician',
        route: index < 3 ? 'yes' : index < 5 ? 'yes' : 'some',
        stream: 4,
        fit: index === 0 ? UNCLEAR : index < 4 ? 5 : 3,
        home: index < 2 ? 'yes' : index < 4 ? 'maybe' : 'no',
        confusing: '',
      },
    })),
  )
  assert.equal(impact.paired, 6)
  assert.deepEqual(impact.results, {
    hadGuidance: 17,
    careersNamed: { before: 2, after: 5 },
    knowsRoute: { before: 50, after: 83 },
    streamSure: { before: 2, after: 4 },
    reportFit: 4.2,
    reportFitsWell: 60,
    talkAtHome: 67,
    unclear: { 'pilot-after:fit': 1 },
  })
})

test('a student who took the test before the "before" questions is not paired', () => {
  const input = classOf(5, () => ({ before: { route: 'no' }, after: { route: 'yes' } }))
  input.tests.P0 = ['2026-11-10T08:00:00.000Z']
  delete input.tests.P1
  const impact = pilotImpact(input)
  assert.equal(impact.paired, 3)
  assert.equal(impact.finishedTest, 4)
  assert.equal(impact.results, null)
})
