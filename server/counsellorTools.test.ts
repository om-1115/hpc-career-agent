/**
 * The counsellor's tools against a real store, with no model involved: what
 * each returns, that arguments from the model are validated, and that a tool
 * can only ever see the student it was given.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Store } from './lib/store.ts'
import { runTool, TOOL_SPECS, type ToolContext } from './counsellor/tools.ts'
import { scoreTest } from '../shared/scoring.ts'
import { ALL_ITEMS, INTEREST_ITEMS } from '../shared/test.ts'
import { CAREERS } from '../shared/careers.ts'

function setup() {
  const store = new Store(join(mkdtempSync(join(tmpdir(), 'hpc-tools-')), 'db.json'))
  store.upsert({ role: 'student', code: 'S001', name: 'Asha Kumari' }, 'student-pass')
  store.upsert({ role: 'student', code: 'S002', name: 'Rohan Verma' }, 'student-pass')
  // S002 loves Investigative activities; S001 has not taken the test.
  const answers = Object.fromEntries(ALL_ITEMS.map((item) => [item.id, 2]))
  for (const item of INTEREST_ITEMS) if (item.type === 'I') answers[item.id] = 5
  store.saveResult('S002', scoreTest(answers))
  const as = (studentCode: string): ToolContext => ({ store, studentCode })
  return { store, as }
}

test('every tool has a spec with AF-compatible parameter types', () => {
  assert.deepEqual(TOOL_SPECS.map((spec) => spec.name), ['get_my_result', 'search_careers', 'get_career', 'save_plan', 'alert_teacher'])
  for (const spec of TOOL_SPECS) {
    assert.ok(spec.description.length > 20, spec.name)
    for (const param of Object.values(spec.params)) assert.ok(['string', 'number', 'boolean'].includes(param.type))
  }
})

test('get_my_result: not taken yet, then the student’s own code, scores and matches — and nothing identifying', () => {
  const { as } = setup()
  assert.deepEqual(runTool(as('S001'), 'get_my_result', {}), { completed: false })

  const result = runTool(as('S002'), 'get_my_result', {}) as Record<string, unknown>
  assert.equal(result.completed, true)
  assert.equal((result.interest_code as string)[0], 'I')
  assert.equal((result.best_matches as unknown[]).length, 6)
  const text = JSON.stringify(result)
  assert.ok(!text.includes('Rohan') && !text.includes('S002'), 'no name or code reaches the model')
})

test('a tool only ever sees the student in its context', () => {
  const { as } = setup()
  // Even if the model "asks" about another student, the argument is ignored.
  assert.deepEqual(runTool(as('S001'), 'get_my_result', { student: 'S002' }), { completed: false })
})

test('search_careers filters by type and keyword, ranks by fit when there is a result', () => {
  const { as } = setup()
  const social = runTool(as('S001'), 'search_careers', { types: 's', limit: 10 }) as { careers: { code: string; fit?: number }[] }
  assert.ok(social.careers.length > 0)
  assert.ok(social.careers.every((career) => career.code.includes('S')))
  assert.ok(social.careers.every((career) => career.fit === undefined), 'no fit without a result')

  const ranked = runTool(as('S002'), 'search_careers', { limit: 3 }) as { careers: { code: string; fit: number }[] }
  assert.equal(ranked.careers.length, 3)
  assert.equal(ranked.careers[0].code[0], 'I')
  assert.ok(ranked.careers[0].fit >= ranked.careers[1].fit)

  const nurse = runTool(as('S001'), 'search_careers', { keyword: 'Nurse' }) as { careers: { id: string }[] }
  assert.deepEqual(nurse.careers.map((career) => career.id), ['nurse'])

  const none = runTool(as('S001'), 'search_careers', { keyword: 'astronaut' }) as { count: number; hint?: string }
  assert.equal(none.count, 0)
  assert.ok(none.hint)
})

test('get_career returns the route from the app’s data, and refuses unknown ids', () => {
  const { as } = setup()
  const pharmacist = runTool(as('S001'), 'get_career', { id: 'pharmacist' }) as { route_from_class_10: string }
  assert.equal(pharmacist.route_from_class_10, CAREERS.find((career) => career.id === 'pharmacist')!.route)
  assert.match((runTool(as('S001'), 'get_career', { id: 'astronaut' }) as { error: string }).error, /No career/)
})

test('save_plan validates, saves the latest plan, and only for this student', () => {
  const { store, as } = setup()
  const bad = [
    { summary: '', career_ids: 'nurse', next_steps: 'Talk to a nurse' },
    { summary: 'x'.repeat(301), career_ids: 'nurse', next_steps: 'Talk to a nurse' },
    { summary: 'Plan', career_ids: 'nurse,doctor,pharmacist,teacher', next_steps: 'One' },
    { summary: 'Plan', career_ids: 'astronaut', next_steps: 'One' },
    { summary: 'Plan', career_ids: 'nurse', next_steps: '1\n2\n3\n4\n5\n6' },
  ]
  for (const args of bad) assert.ok('error' in runTool(as('S002'), 'save_plan', args), JSON.stringify(args))
  assert.equal(store.plan('S002'), null)

  const saved = runTool(as('S002'), 'save_plan', {
    summary: 'Take PCB in Class 11 and explore pharmacy and lab work.',
    career_ids: 'pharmacist, lab-technician',
    next_steps: '- Talk to the chemist near home\n2. Ask my teacher about PCB',
  })
  assert.equal((saved as { saved: boolean }).saved, true)
  assert.deepEqual(store.plan('S002')!.careerIds, ['pharmacist', 'lab-technician'])
  assert.deepEqual(store.plan('S002')!.nextSteps, ['Talk to the chemist near home', 'Ask my teacher about PCB'])
  assert.equal(store.plan('S001'), null)
})

test('alert_teacher records an open alert for this student and returns what to tell them', () => {
  const { store, as } = setup()
  assert.ok('error' in runTool(as('S001'), 'alert_teacher', { reason: 'bored', note: 'x' }))
  const sent = runTool(as('S001'), 'alert_teacher', { reason: 'Distress', note: 'Said they feel nothing matters.' })
  assert.match((sent as { tell_the_student: string }).tell_the_student, /14416/)

  const [alert] = store.openAlerts()
  assert.equal(alert.studentCode, 'S001')
  assert.equal(alert.reason, 'distress')
  assert.equal(store.resolveAlert(alert.id), true)
  assert.equal(store.openAlerts().length, 0)
  assert.equal(store.resolveAlert(alert.id), false)
})

test('runTool turns bad calls into errors the model can read, never exceptions', () => {
  const { as } = setup()
  assert.match((runTool(as('S001'), 'delete_everything', {}) as { error: string }).error, /Unknown tool/)
  assert.match((runTool(as('S001'), 'get_career', {}) as { error: string }).error, /id is required/)
  assert.match((runTool(as('S001'), 'search_careers', { limit: 'ten' }) as { error: string }).error, /limit must be a number/)
  assert.match((runTool(as('S001'), 'save_plan', 'not an object') as { error: string }).error, /required/)
})
