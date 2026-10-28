/**
 * The API. Everything the app needs lives under /api:
 *
 *   POST   /api/login          {role, code, password} → {profile, token}
 *   GET    /api/me             who the token belongs to
 *   GET    /api/results/me     the student's saved result, or null
 *   POST   /api/results        {answers} → scored and saved result (students)
 *   DELETE /api/results/me     clear it to take the test again (students)
 *   GET    /api/class          every student and whether they finished (teachers)
 *   POST   /api/chat/session   a signed conversation handle
 *   POST   /api/chat           {handle, text} → the counsellor's reply as SSE
 *
 * Scores are computed here, never in the browser: the browser sends answers,
 * the server decides what they mean.
 */

import { randomUUID } from 'node:crypto'
import express, { type NextFunction, type Request, type Response } from 'express'
import { invalidAnswers, scoreTest } from '../shared/scoring.ts'
import { DONE_SENTINEL, encodeEvent, SSE_HEADERS, type ChatEvent } from './lib/events.ts'
import { issueSigned, readSigned } from './lib/handle.ts'
import { offlineTurn } from './lib/offline.ts'
import { normaliseCode, Store, type Profile, type Role } from './lib/store.ts'

export type AppConfig = { dataFile: string; sessionSecret: string }

const SESSION_TTL_MS = 10 * 60 * 60 * 1000
const MAX_FAILURES = 5
const LOCK_MS = 15 * 60 * 1000

type Authed = Request & { profile: Profile }

export function createApp({ dataFile, sessionSecret }: AppConfig) {
  const store = new Store(dataFile)
  const failures = new Map<string, { count: number; until: number }>()
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

  app.post('/api/login', (req, res) => {
    const { role, code, password } = (req.body ?? {}) as Record<string, unknown>
    if ((role !== 'student' && role !== 'teacher') || typeof code !== 'string' || !code.trim() || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'credentials_required' })
    }

    const key = `${role}:${normaliseCode(code)}`
    const record = failures.get(key)
    if (record && record.until > Date.now()) return res.status(429).json({ error: 'too_many_attempts' })

    const profile = store.verify(role, code, password)
    if (!profile) {
      const count = (record && record.until === 0 ? record.count : 0) + 1
      failures.set(key, count >= MAX_FAILURES ? { count: 0, until: Date.now() + LOCK_MS } : { count, until: 0 })
      return res.status(401).json({ error: 'invalid_credentials' })
    }

    failures.delete(key)
    res.json({ profile, token: issueSigned(profile, sessionSecret, SESSION_TTL_MS) })
  })

  app.get('/api/me', (req, res) => {
    const profile = readSigned<Profile>(req.headers.authorization?.replace(/^Bearer /, ''), sessionSecret)
    if (!profile?.role) return res.status(401).json({ error: 'unauthenticated' })
    const { role, code, name, classLine } = profile
    res.json({ profile: { role, code, name, classLine } })
  })

  app.get('/api/results/me', requireRole('student'), (req, res) => {
    res.json({ result: store.result((req as Authed).profile.code) })
  })

  app.post('/api/results', requireRole('student'), (req, res) => {
    const answers = (req.body ?? {}).answers
    const problem = invalidAnswers(answers)
    if (problem) return res.status(400).json({ error: 'invalid_answers', detail: problem })
    const result = scoreTest(answers)
    store.saveResult((req as Authed).profile.code, result)
    res.json({ result })
  })

  app.delete('/api/results/me', requireRole('student'), (req, res) => {
    store.clearResult((req as Authed).profile.code)
    res.json({ result: null })
  })

  app.get('/api/class', requireRole('teacher'), (_req, res) => {
    const students = store.students().map((student) => {
      const result = store.result(student.code)
      return {
        code: student.code,
        name: student.name,
        classLine: student.classLine,
        result: result ? { code: result.code, completedAt: result.completedAt } : null,
      }
    })
    res.json({ students })
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
