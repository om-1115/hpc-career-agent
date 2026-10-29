/**
 * The API. Everything the app needs lives under /api:
 *
 *   GET    /api/config         {mode: 'demo' | 'pilot'}: profile picker, or code + PIN
 *   POST   /api/login          {role, code, password} → {profile, token}
 *   GET    /api/profiles       every profile, for the profile picker (demo only)
 *   POST   /api/profiles/open  {role, code} → {profile, token}, no password (demo only)
 *   GET    /api/me             who the token belongs to
 *   GET    /api/results/me     the student's saved result, or null
 *   POST   /api/results        {answers} → scored and saved result (students)
 *   DELETE /api/results/me     clear it to take the test again (students)
 *   GET    /api/passbook       the student's career passbook: tests, plans, reflections
 *   POST   /api/passbook/reflections  {text} → a reflection added to it
 *   GET    /api/surveys/me     which surveys the student has finished, and when
 *   POST   /api/surveys/:id    {answers, reflection} → saved; the reflection goes in the passbook
 *   GET    /api/class          every student and whether they finished (teachers)
 *   GET    /api/impact         the pilot's before/after results, anonymous, for anyone
 *   POST   /api/chat/session   a signed conversation handle
 *   POST   /api/chat           {handle, text} → the counsellor's reply as SSE
 *
 * Scores are computed here, never in the browser: the browser sends answers,
 * the server decides what they mean.
 *
 * Two modes. The demo opens any profile with a tap. A pilot (`pilot: true`,
 * PILOT_MODE=1 on the server) is real students: the picker is off, everyone
 * signs in with the code and PIN on their slip (`npm run pilot:accounts`).
 */

import { randomUUID } from 'node:crypto'
import express, { type NextFunction, type Request, type Response } from 'express'
import { invalidAnswers, scoreTest } from '../shared/scoring.ts'
import { pilotImpact } from '../shared/pilot.ts'
import { invalidSurveyAnswers, surveyById } from '../shared/surveys.ts'
import { DONE_SENTINEL, encodeEvent, SSE_HEADERS, type ChatEvent } from './lib/events.ts'
import { issueSigned, readSigned } from './lib/handle.ts'
import { offlineTurn } from './lib/offline.ts'
import { normaliseCode, Store, type Backend, type Profile, type Role } from './lib/store.ts'

/** Where data lives: a JSON file path, or any backend (Redis on Vercel); `pilot` for real students. */
export type AppConfig = { dataFile?: string; backend?: Backend; sessionSecret: string; pilot?: boolean }

const SESSION_TTL_MS = 10 * 60 * 60 * 1000
const MAX_FAILURES = 5
const LOCK_MS = 15 * 60 * 1000

type Authed = Request & { profile: Profile }

export function createApp({ dataFile, backend, sessionSecret, pilot = false }: AppConfig) {
  const store = new Store(backend ?? dataFile ?? '.data/db.json')
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json({ limit: '64kb' }))

  const requireRole = (role: Role) => (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace(/^Bearer /, '')
    const profile = readSigned<Profile>(token, sessionSecret)
    if (!profile?.role) return res.status(401).json({ error: 'unauthenticated' })
    if (profile.role !== role) return res.status(403).json({ error: 'forbidden' })
    ;(req as Authed).profile = profile
    next()
  }

  app.get('/api/config', (_req, res) => {
    res.json({ mode: pilot ? 'pilot' : 'demo' })
  })

  app.post('/api/login', async (req, res) => {
    const { role, code, password } = (req.body ?? {}) as Record<string, unknown>
    if ((role !== 'student' && role !== 'teacher') || typeof code !== 'string' || !code.trim() || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'credentials_required' })
    }

    // Misses are kept in the store, so every server instance counts them. Only
    // real accounts are counted: codes are printed on slips, not secret, and
    // made-up ones shouldn't grow the document.
    const key = `${role}:${normaliseCode(code)}`
    if (await store.lockedOut(key)) return res.status(429).json({ error: 'too_many_attempts' })

    const profile = await store.verify(role, code, password)
    if (!profile) {
      if (await store.profile(role, code)) await store.recordFailure(key, MAX_FAILURES, LOCK_MS)
      return res.status(401).json({ error: 'invalid_credentials' })
    }

    await store.clearFailures(key)
    res.json({ profile, token: issueSigned(profile, sessionSecret, SESSION_TTL_MS) })
  })

  // Open profiles, for the demo: the app starts on a list of profiles and opens
  // one with a tap, no password. Off in a pilot, where /api/login is the way in.
  app.get('/api/profiles', async (_req, res) => {
    if (pilot) return res.status(404).json({ error: 'not_available' })
    res.json({ profiles: await store.profiles() })
  })

  app.post('/api/profiles/open', async (req, res) => {
    if (pilot) return res.status(404).json({ error: 'not_available' })
    const { role, code } = (req.body ?? {}) as Record<string, unknown>
    if ((role !== 'student' && role !== 'teacher') || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'profile_required' })
    }
    const profile = await store.profile(role, code)
    if (!profile) return res.status(404).json({ error: 'no_such_profile' })
    res.json({ profile, token: issueSigned(profile, sessionSecret, SESSION_TTL_MS) })
  })

  app.get('/api/me', (req, res) => {
    const profile = readSigned<Profile>(req.headers.authorization?.replace(/^Bearer /, ''), sessionSecret)
    if (!profile?.role) return res.status(401).json({ error: 'unauthenticated' })
    const { role, code, name, classLine } = profile
    res.json({ profile: { role, code, name, classLine } })
  })

  app.get('/api/results/me', requireRole('student'), async (req, res) => {
    res.json({ result: await store.result((req as Authed).profile.code) })
  })

  app.post('/api/results', requireRole('student'), async (req, res) => {
    const answers = (req.body ?? {}).answers
    const problem = invalidAnswers(answers)
    if (problem) return res.status(400).json({ error: 'invalid_answers', detail: problem })
    const result = scoreTest(answers)
    await store.saveResult((req as Authed).profile.code, result)
    res.json({ result })
  })

  app.delete('/api/results/me', requireRole('student'), async (req, res) => {
    await store.clearResult((req as Authed).profile.code)
    res.json({ result: null })
  })

  // The career passbook: everything the student has done on their journey,
  // newest first — each test, each plan, and their own reflections.
  app.get('/api/passbook', requireRole('student'), async (req, res) => {
    const code = (req as Authed).profile.code
    const [tests, current, plans, reflections] = await Promise.all([
      store.resultHistory(code),
      store.result(code),
      store.planHistory(code),
      store.reflections(code),
    ])
    // Results saved before history was kept are still part of the journey.
    if (current && !tests.some((test) => test.completedAt === current.completedAt)) tests.push(current)
    const entries = [
      ...tests.map((test) => ({ type: 'test' as const, at: test.completedAt, code: test.code, careerIds: test.matches.slice(0, 3).map((match) => match.id) })),
      ...plans.map((plan) => ({ type: 'plan' as const, at: plan.savedAt, summary: plan.summary, careerIds: plan.careerIds, nextSteps: plan.nextSteps })),
      ...reflections.map((reflection) => ({ type: 'reflection' as const, at: reflection.createdAt, text: reflection.text, ...(reflection.source ? { source: reflection.source } : {}) })),
    ]
    // Newest first. Same-instant ties keep a fixed order: a reflection is
    // written about the plan or test it sits next to, so it goes on top.
    const rank = { reflection: 0, plan: 1, test: 2 }
    entries.sort((a, b) => b.at.localeCompare(a.at) || rank[a.type] - rank[b.type])
    res.json({ entries })
  })

  app.post('/api/passbook/reflections', requireRole('student'), async (req, res) => {
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''
    if (!text || text.length > 500) return res.status(400).json({ error: 'text must be 1–500 characters' })
    const reflection = await store.addReflection((req as Authed).profile.code, text)
    res.json({ entry: { type: 'reflection', at: reflection.createdAt, text: reflection.text } })
  })

  app.get('/api/surveys/me', requireRole('student'), async (req, res) => {
    const responses = await store.surveyResponses((req as Authed).profile.code)
    res.json({ surveys: Object.fromEntries(Object.entries(responses).map(([id, response]) => [id, { completedAt: response.completedAt }])) })
  })

  // A finished survey. The reflection is the student's own (written for them
  // from their answers, then edited by them), so it is saved as they send it.
  app.post('/api/surveys/:id', requireRole('student'), async (req, res) => {
    const survey = surveyById(String(req.params.id))
    if (!survey) return res.status(404).json({ error: 'no_such_survey' })
    const { answers, reflection } = (req.body ?? {}) as { answers?: unknown; reflection?: unknown }
    const problem = invalidSurveyAnswers(survey, answers)
    if (problem) return res.status(400).json({ error: 'invalid_answers', detail: problem })
    const text = typeof reflection === 'string' ? reflection.trim() : ''
    if (text.length > 500) return res.status(400).json({ error: 'reflection must be up to 500 characters' })

    const code = (req as Authed).profile.code
    // The pilot's questions are answered once: a second "before" after the
    // test would no longer be before anything.
    if (survey.pilot && (await store.surveyResponses(code))[survey.id]) return res.status(409).json({ error: 'already_answered' })
    const completedAt = new Date().toISOString()
    await store.saveSurvey(code, survey.id, { answers: answers as Record<string, unknown>, completedAt })
    const saved = text ? await store.addReflection(code, text, completedAt, survey.title) : null
    res.json({ completedAt, entry: saved && { type: 'reflection', at: saved.createdAt, text: saved.text, source: saved.source } })
  })

  app.get('/api/class', requireRole('teacher'), async (_req, res) => {
    const roster = await store.students()
    const results = await Promise.all(roster.map((student) => store.result(student.code)))
    const students = roster.map((student, index) => {
      const result = results[index]
      return {
        code: student.code,
        name: student.name,
        classLine: student.classLine,
        result: result ? { code: result.code, completedAt: result.completedAt } : null,
      }
    })
    res.json({ students })
  })

  // The pilot's results, for anyone: counts, and before/after measures once
  // enough students are paired that no one can be picked out (shared/pilot.ts).
  app.get('/api/impact', async (_req, res) => {
    const data = await store.snapshot()
    const students = data.accounts.filter((account) => account.role === 'student')
    const tests = Object.fromEntries(
      students.map(({ code }) => {
        const history = data.resultHistory?.[code] ?? []
        const current = data.results[code]
        const times = history.map((result) => result.completedAt)
        return [code, current && !times.includes(current.completedAt) ? [...times, current.completedAt] : times]
      }),
    )
    res.json(pilotImpact({ students: students.length, surveys: data.surveys ?? {}, tests }))
  })

  // The counsellor. Identity is minted here and handed out only inside a
  // signed handle, so a conversation cannot be claimed by guessing an id.
  app.post('/api/chat/session', (_req, res) => {
    res.json({ handle: issueSigned({ conversationId: randomUUID() }, sessionSecret), mode: 'scripted' })
  })

  app.post('/api/chat', async (req, res) => {
    const { handle, text } = (req.body ?? {}) as { handle?: string; text?: unknown }
    const conversation = readSigned<{ conversationId: string }>(handle, sessionSecret)
    if (!conversation?.conversationId) return res.status(401).json({ error: 'Invalid or expired session' })
    if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'text is required' })

    res.writeHead(200, SSE_HEADERS)
    res.flushHeaders?.()
    const controller = new AbortController()
    res.on('close', () => controller.abort())
    const write = (event: ChatEvent) => {
      if (!res.writableEnded) res.write(encodeEvent(event))
    }

    try {
      for await (const event of offlineTurn(text.trim(), controller.signal)) write(event)
      if (!controller.signal.aborted) write({ type: 'done', conversationId: conversation.conversationId })
    } catch (cause) {
      write({ type: 'error', message: cause instanceof Error ? cause.message : String(cause), retryable: true })
    } finally {
      if (!res.writableEnded) {
        res.write(DONE_SENTINEL)
        res.end()
      }
    }
  })

  return { app, store }
}
