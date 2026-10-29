/**
 * The API against a real server and a throwaway data file: sign-in and its
 * lock, role gating, scoring round trips, the teacher's class view and the
 * counsellor stream.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import { createApp } from './app.ts'
import { ALL_ITEMS, INTEREST_ITEMS } from '../shared/test.ts'

async function start() {
  const dataFile = join(mkdtempSync(join(tmpdir(), 'hpc-career-')), 'db.json')
  const { app, store } = createApp({ dataFile, sessionSecret: 'test-secret' })
  await store.upsert({ role: 'student', code: 's001', name: 'Asha Kumari', classLine: 'Class 10 · A' }, 'student-pass')
  await store.upsert({ role: 'teacher', code: 'T001', name: 'Meera Sharma' }, 'teacher-pass')

  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`

  const call = (path: string, init: RequestInit & { token?: string } = {}) =>
    fetch(`${base}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
      },
    })
  const login = async (role: string, code: string, password: string) =>
    call('/login', { method: 'POST', body: JSON.stringify({ role, code, password }) })
  const token = async (role: string, code: string, password: string) =>
    ((await (await login(role, code, password)).json()) as { token: string }).token

  return { server, dataFile, call, login, token }
}

const allAnswers = (value: number) => Object.fromEntries(ALL_ITEMS.map((item) => [item.id, value]))

test('sign-in: right role and password only, same answer for every wrong combination', async (t) => {
  const { server, login } = await start()
  t.after(() => server.close())

  const ok = await login('student', ' S001 ', 'student-pass')
  assert.equal(ok.status, 200)
  assert.deepEqual(((await ok.json()) as { profile: object }).profile, {
    role: 'student',
    code: 'S001',
    name: 'Asha Kumari',
    classLine: 'Class 10 · A',
  })

  const wrongPassword = await login('student', 'S001', 'nope-nope')
  const wrongCode = await login('student', 'S999', 'student-pass')
  const wrongRole = await login('teacher', 'S001', 'student-pass')
  for (const response of [wrongPassword, wrongCode, wrongRole]) assert.equal(response.status, 401)
})

test('profiles: listed without passwords, and one opens with a tap', async (t) => {
  const { server, call } = await start()
  t.after(() => server.close())

  const { profiles } = (await (await call('/profiles')).json()) as { profiles: Record<string, unknown>[] }
  assert.deepEqual(profiles.map((profile) => [profile.role, profile.code]), [['student', 'S001'], ['teacher', 'T001']])
  assert.ok(profiles.every((profile) => !('password' in profile)))

  const opened = await call('/profiles/open', { method: 'POST', body: JSON.stringify({ role: 'student', code: 's001' }) })
  assert.equal(opened.status, 200)
  const { token } = (await opened.json()) as { token: string }
  assert.equal((await call('/results/me', { token })).status, 200)
  assert.equal((await call('/class', { token })).status, 403)

  assert.equal((await call('/profiles/open', { method: 'POST', body: JSON.stringify({ role: 'teacher', code: 'S001' }) })).status, 404)
  assert.equal((await call('/profiles/open', { method: 'POST', body: JSON.stringify({ role: 'admin', code: 'S001' }) })).status, 400)
})

test('five misses lock an account, even against the right password', async (t) => {
  const { server, login } = await start()
  t.after(() => server.close())
  for (let attempt = 0; attempt < 5; attempt++) assert.equal((await login('student', 'S001', 'nope-nope')).status, 401)
  assert.equal((await login('student', 'S001', 'student-pass')).status, 429)
})

test('a student submits answers; the server scores, saves and returns them', async (t) => {
  const { server, call, token } = await start()
  t.after(() => server.close())
  const student = await token('student', 'S001', 'student-pass')

  assert.deepEqual(await (await call('/results/me', { token: student })).json(), { result: null })

  const answers = allAnswers(2)
  for (const item of INTEREST_ITEMS) if (item.type === 'I') answers[item.id] = 5
  const saved = await call('/results', { method: 'POST', token: student, body: JSON.stringify({ answers }) })
  assert.equal(saved.status, 200)
  const { result } = (await saved.json()) as { result: { code: string[] } }
  assert.equal(result.code[0], 'I')

  const again = (await (await call('/results/me', { token: student })).json()) as { result: { code: string[] } }
  assert.deepEqual(again.result.code, result.code)

  assert.equal((await call('/results/me', { method: 'DELETE', token: student })).status, 200)
  assert.deepEqual(await (await call('/results/me', { token: student })).json(), { result: null })
})

test('the passbook keeps every test, plan and reflection, newest first, for that student only', async (t) => {
  const { server, call, token } = await start()
  t.after(() => server.close())
  const student = await token('student', 'S001', 'student-pass')
  const teacher = await token('teacher', 'T001', 'teacher-pass')

  assert.deepEqual(await (await call('/passbook', { token: student })).json(), { entries: [] })
  assert.equal((await call('/passbook', { token: teacher })).status, 403)

  // Two tests (a retake keeps the first), then a reflection — a few ms apart,
  // so the order checked below is real chronology, not a timestamp tie.
  const tick = () => new Promise((resolve) => setTimeout(resolve, 5))
  await call('/results', { method: 'POST', token: student, body: JSON.stringify({ answers: allAnswers(2) }) })
  await tick()
  await call('/results/me', { method: 'DELETE', token: student })
  await call('/results', { method: 'POST', token: student, body: JSON.stringify({ answers: allAnswers(4) }) })
  await tick()
  const added = await call('/passbook/reflections', { method: 'POST', token: student, body: JSON.stringify({ text: '  I enjoy helping people more than I thought.  ' }) })
  assert.equal(added.status, 200)

  for (const text of ['', 'x'.repeat(501)]) {
    assert.equal((await call('/passbook/reflections', { method: 'POST', token: student, body: JSON.stringify({ text }) })).status, 400)
  }

  const { entries } = (await (await call('/passbook', { token: student })).json()) as { entries: { type: string; at: string; text?: string }[] }
  assert.deepEqual(entries.map((entry) => entry.type), ['reflection', 'test', 'test'])
  assert.equal(entries[0].text, 'I enjoy helping people more than I thought.')
  assert.ok(entries[1].at >= entries[2].at)
})

test('a survey: refused until complete, then saved, its reflection in the passbook with where it came from', async (t) => {
  const { server, call, token } = await start()
  t.after(() => server.close())
  const student = await token('student', 'S001', 'student-pass')
  const teacher = await token('teacher', 'T001', 'teacher-pass')

  assert.deepEqual(await (await call('/surveys/me', { token: student })).json(), { surveys: {} })
  assert.equal((await call('/surveys/me', { token: teacher })).status, 403)
  assert.equal((await call('/surveys/cooking', { method: 'POST', token: student, body: '{}' })).status, 404)

  const answers = { area: 'sport', goal: 'Run 2 km without stopping', often: 'few', support: 'alone', excited: 5 }
  const { area: _area, ...incomplete } = answers
  assert.equal((await call('/surveys/goal-non-academic', { method: 'POST', token: student, body: JSON.stringify({ answers: incomplete }) })).status, 400)

  const saved = await call('/surveys/goal-non-academic', {
    method: 'POST',
    token: student,
    body: JSON.stringify({ answers, reflection: '  My goal: run 2 km without stopping.  ' }),
  })
  assert.equal(saved.status, 200)
  const { surveys } = (await (await call('/surveys/me', { token: student })).json()) as { surveys: Record<string, { completedAt: string }> }
  assert.deepEqual(Object.keys(surveys), ['goal-non-academic'])

  const { entries } = (await (await call('/passbook', { token: student })).json()) as { entries: { type: string; text?: string; source?: string }[] }
  assert.deepEqual(entries[0], { ...entries[0], type: 'reflection', text: 'My goal: run 2 km without stopping.', source: 'Goal Setting — Non-academic' })

  // Without a reflection, the answers are saved and the passbook is left alone.
  await call('/surveys/goal-non-academic', { method: 'POST', token: student, body: JSON.stringify({ answers, reflection: '' }) })
  assert.equal(((await (await call('/passbook', { token: student })).json()) as { entries: unknown[] }).entries.length, 1)
})

test('incomplete answers are refused', async (t) => {
  const { server, call, token } = await start()
  t.after(() => server.close())
  const student = await token('student', 'S001', 'student-pass')
  const answers = allAnswers(3)
  delete answers.r1
  const response = await call('/results', { method: 'POST', token: student, body: JSON.stringify({ answers }) })
  assert.equal(response.status, 400)
})

test('roles are gated: a student cannot see the class, a teacher cannot submit a test', async (t) => {
  const { server, call, token } = await start()
  t.after(() => server.close())
  const student = await token('student', 'S001', 'student-pass')
  const teacher = await token('teacher', 'T001', 'teacher-pass')

  assert.equal((await call('/class', { token: student })).status, 403)
  assert.equal((await call('/results', { method: 'POST', token: teacher, body: '{}' })).status, 403)
  assert.equal((await call('/class')).status, 401)

  const forged = `${Buffer.from(JSON.stringify({ role: 'teacher', code: 'X', name: 'X', exp: Date.now() + 1e6 })).toString('base64url')}.abc`
  assert.equal((await call('/class', { token: forged })).status, 401)

  const { students } = (await (await call('/class', { token: teacher })).json()) as {
    students: { code: string; result: unknown }[]
  }
  assert.deepEqual(students.map((student) => [student.code, student.result]), [['S001', null]])
})

test('passwords are stored as scrypt hashes, never as typed', async (t) => {
  const { server, dataFile } = await start()
  t.after(() => server.close())
  const stored = readFileSync(dataFile, 'utf8')
  assert.ok(!stored.includes('student-pass'))
  assert.match(stored, /"password": "scrypt\$/)
})

test('the counsellor streams a reply for a signed conversation only', async (t) => {
  const { server, call } = await start()
  t.after(() => server.close())

  assert.equal((await call('/chat', { method: 'POST', body: JSON.stringify({ handle: 'x.y', text: 'hi' }) })).status, 401)

  const { handle } = (await (await call('/chat/session', { method: 'POST' })).json()) as { handle: string }
  const response = await call('/chat', { method: 'POST', body: JSON.stringify({ handle, text: 'Which stream after Class 10?' }) })
  assert.match(response.headers.get('content-type') ?? '', /text\/event-stream/)
  const body = await response.text()
  assert.match(body, /"type":"delta"/)
  assert.match(body, /"type":"done"/)
  assert.ok(body.trimEnd().endsWith('data: [DONE]'))
})
