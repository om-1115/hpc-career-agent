/**
 * Accounts and test results, as one JSON document: a file under .data/
 * (git-ignored) when the app runs on one machine, or a Redis key when it runs
 * on Vercel, where there is no lasting disk.
 *
 * Small on purpose: a school's worth of students fits comfortably, and every
 * change is a whole-document read, change and write. In one process those are
 * queued, so changes never overwrite each other; across Vercel instances the
 * last write wins, which is fine for a demo but not for a school's real data.
 *
 * Passwords are scrypt hashes with a per-account salt, never plaintext, and a
 * wrong code costs the same scrypt as a wrong password, so timing does not say
 * which one was wrong.
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { TestResult } from '../../shared/scoring.ts'

export type Role = 'student' | 'teacher'
export type Profile = { role: Role; code: string; name: string; classLine?: string }
type StoredAccount = Profile & { password: string }

/** A career plan the student agreed to save with the counsellor; the teacher sees the latest. */
export type Plan = { summary: string; careerIds: string[]; nextSteps: string[]; savedAt: string }
export type AlertReason = 'distress' | 'safety' | 'other'
/** A wellbeing flag the counsellor raised; open until a teacher resolves it. */
export type Alert = { id: string; studentCode: string; reason: AlertReason; note: string; createdAt: string; resolvedAt?: string }

/** A student's own note in their career passbook; `source` names the survey it came from, if any. */
export type Reflection = { text: string; createdAt: string; source?: string }

/** One finished survey: the answers as given, and when. */
export type SurveyResponse = { answers: Record<string, unknown>; completedAt: string }

export type Data = {
  accounts: StoredAccount[]
  /** The current result per student (what the report shows). */
  results: Record<string, TestResult>
  /** Every result a student has had, oldest first — their passbook keeps all of them. */
  resultHistory?: Record<string, TestResult[]>
  /** The latest plan per student (what the teacher acts on). */
  plans?: Record<string, Plan>
  planHistory?: Record<string, Plan[]>
  reflections?: Record<string, Reflection[]>
  /** Each student's latest response to each survey, by survey id. */
  surveys?: Record<string, Record<string, SurveyResponse>>
  alerts?: Alert[]
}

const KEY_LENGTH = 64
const DUMMY_HASH = hashPassword(randomBytes(16).toString('hex'))

export const normaliseCode = (code: string) => code.trim().toUpperCase()

export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  return `scrypt$${salt.toString('base64url')}$${scryptSync(password, salt, KEY_LENGTH).toString('base64url')}`
}

function matches(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'base64url')
  return timingSafeEqual(scryptSync(password, Buffer.from(salt, 'base64url'), expected.length), expected)
}

const profileOf = ({ password: _password, ...profile }: StoredAccount): Profile => profile

/** Where the document lives. `read` gives null when nothing has been saved yet. */
export interface Backend {
  read(): Promise<Data | null>
  write(data: Data): Promise<void>
}

/** A JSON file, written atomically (a temp file, then rename). */
export class FileBackend implements Backend {
  constructor(private readonly file: string) {}

  async read(): Promise<Data | null> {
    return existsSync(this.file) ? (JSON.parse(readFileSync(this.file, 'utf8')) as Data) : null
  }

  async write(data: Data): Promise<void> {
    mkdirSync(dirname(this.file), { recursive: true })
    const temp = `${this.file}.${process.pid}.tmp`
    writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 })
    renameSync(temp, this.file)
  }
}

/** One key in an Upstash Redis database, over its REST API (no client library). */
export class RedisBackend implements Backend {
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly key = 'hpc-career:data',
  ) {}

  private async command(args: string[]): Promise<unknown> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.token}`, 'content-type': 'application/json' },
      body: JSON.stringify(args),
    })
    const body = (await response.json()) as { result?: unknown; error?: string }
    if (!response.ok || body.error) throw new Error(`Redis ${args[0]} failed: ${body.error ?? response.status}`)
    return body.result
  }

  async read(): Promise<Data | null> {
    const value = await this.command(['GET', this.key])
    return typeof value === 'string' ? (JSON.parse(value) as Data) : null
  }

  async write(data: Data): Promise<void> {
    await this.command(['SET', this.key, JSON.stringify(data)])
  }
}

/** Redis when Vercel's Upstash integration has set its variables, otherwise the file. */
export function backendFromEnv(dataFile: string): Backend {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? new RedisBackend(url, token) : new FileBackend(dataFile)
}

export class Store {
  private readonly backend: Backend
  private pending: Promise<unknown> = Promise.resolve()

  /** A file path, or any backend. */
  constructor(source: string | Backend) {
    this.backend = typeof source === 'string' ? new FileBackend(source) : source
  }

  private async read(): Promise<Data> {
    return (await this.backend.read()) ?? { accounts: [], results: {} }
  }

  /** Read, change and write the document, one change at a time. */
  private update<T>(change: (data: Data) => T): Promise<T> {
    const run = this.pending.then(async () => {
      const data = await this.read()
      const out = change(data)
      await this.backend.write(data)
      return out
    })
    this.pending = run.catch(() => undefined)
    return run
  }

  /** The account, or null for a wrong role, code or password alike. */
  async verify(role: Role, code: string, password: string): Promise<Profile | null> {
    const found = (await this.read()).accounts.find((account) => account.role === role && account.code === normaliseCode(code))
    const ok = matches(password, found?.password ?? DUMMY_HASH)
    return found && ok ? profileOf(found) : null
  }

  /** Add an account, or reset an existing one's details and password. */
  upsert(profile: Profile, password: string): Promise<void> {
    const code = normaliseCode(profile.code)
    const hashed = hashPassword(password)
    return this.update((data) => {
      data.accounts = data.accounts.filter((account) => !(account.role === profile.role && account.code === code))
      data.accounts.push({ ...profile, code, name: profile.name.trim(), password: hashed })
    })
  }

  /** Every account, students first, for the profile picker. */
  async profiles(): Promise<Profile[]> {
    const accounts = (await this.read()).accounts.map(profileOf)
    return [...accounts.filter((account) => account.role === 'student'), ...accounts.filter((account) => account.role === 'teacher')]
  }

  /** One account by role and code, without checking a password. */
  async profile(role: Role, code: string): Promise<Profile | null> {
    const found = (await this.read()).accounts.find((account) => account.role === role && account.code === normaliseCode(code))
    return found ? profileOf(found) : null
  }

  async students(): Promise<Profile[]> {
    return (await this.read()).accounts.filter((account) => account.role === 'student').map(profileOf)
  }

  async result(studentCode: string): Promise<TestResult | null> {
    return (await this.read()).results[normaliseCode(studentCode)] ?? null
  }

  saveResult(studentCode: string, result: TestResult): Promise<void> {
    const code = normaliseCode(studentCode)
    return this.update((data) => {
      data.results[code] = result
      data.resultHistory = { ...data.resultHistory, [code]: [...(data.resultHistory?.[code] ?? []), result] }
    })
  }

  /** Every result the student has had, oldest first. */
  async resultHistory(studentCode: string): Promise<TestResult[]> {
    return (await this.read()).resultHistory?.[normaliseCode(studentCode)] ?? []
  }

  async planHistory(studentCode: string): Promise<Plan[]> {
    return (await this.read()).planHistory?.[normaliseCode(studentCode)] ?? []
  }

  async reflections(studentCode: string): Promise<Reflection[]> {
    return (await this.read()).reflections?.[normaliseCode(studentCode)] ?? []
  }

  addReflection(studentCode: string, text: string, createdAt = new Date().toISOString(), source?: string): Promise<Reflection> {
    const code = normaliseCode(studentCode)
    const reflection: Reflection = source ? { text, createdAt, source } : { text, createdAt }
    return this.update((data) => {
      data.reflections = { ...data.reflections, [code]: [...(data.reflections?.[code] ?? []), reflection] }
      return reflection
    })
  }

  /** Remove everything career-related for a student (the demo seed starts each one clean). */
  resetCareerData(studentCode: string): Promise<void> {
    const code = normaliseCode(studentCode)
    return this.update((data) => {
      delete data.results[code]
      delete data.resultHistory?.[code]
      delete data.plans?.[code]
      delete data.planHistory?.[code]
      delete data.reflections?.[code]
      delete data.surveys?.[code]
      data.alerts = (data.alerts ?? []).filter((alert) => alert.studentCode !== code)
    })
  }

  async surveyResponses(studentCode: string): Promise<Record<string, SurveyResponse>> {
    return (await this.read()).surveys?.[normaliseCode(studentCode)] ?? {}
  }

  /** Save a survey response, replacing an earlier one to the same survey. */
  saveSurvey(studentCode: string, surveyId: string, response: SurveyResponse): Promise<void> {
    const code = normaliseCode(studentCode)
    return this.update((data) => {
      data.surveys = { ...data.surveys, [code]: { ...data.surveys?.[code], [surveyId]: response } }
    })
  }

  /** Clear the current result so the student can take the test again; the passbook keeps it. */
  clearResult(studentCode: string): Promise<void> {
    return this.update((data) => {
      delete data.results[normaliseCode(studentCode)]
    })
  }

  async plan(studentCode: string): Promise<Plan | null> {
    return (await this.read()).plans?.[normaliseCode(studentCode)] ?? null
  }

  /** The teacher acts on the latest plan; the passbook keeps every one. */
  savePlan(studentCode: string, plan: Plan): Promise<void> {
    const code = normaliseCode(studentCode)
    return this.update((data) => {
      data.plans = { ...data.plans, [code]: plan }
      data.planHistory = { ...data.planHistory, [code]: [...(data.planHistory?.[code] ?? []), plan] }
    })
  }

  addAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'studentCode'> & { studentCode: string }): Promise<Alert> {
    const saved: Alert = {
      ...alert,
      studentCode: normaliseCode(alert.studentCode),
      id: randomBytes(8).toString('hex'),
      createdAt: new Date().toISOString(),
    }
    return this.update((data) => {
      data.alerts = [...(data.alerts ?? []), saved]
      return saved
    })
  }

  /** Open alerts, oldest first. */
  async openAlerts(): Promise<Alert[]> {
    return ((await this.read()).alerts ?? []).filter((alert) => !alert.resolvedAt)
  }

  /** Mark an alert handled. False if there is no such open alert. */
  resolveAlert(id: string): Promise<boolean> {
    return this.update((data) => {
      const alert = data.alerts?.find((candidate) => candidate.id === id && !candidate.resolvedAt)
      if (!alert) return false
      alert.resolvedAt = new Date().toISOString()
      return true
    })
  }
}
