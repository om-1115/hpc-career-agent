/**
 * Accounts and test results, in one JSON file under .data/ (git-ignored).
 *
 * Small on purpose: a school's worth of students fits comfortably, writes are
 * whole-file and atomic (write a temp file, then rename), and there is nothing
 * to install. Swap this module for a database when a deployment outgrows it —
 * nothing else touches the file.
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

/** A student's own note in their career passbook. */
export type Reflection = { text: string; createdAt: string }

type Data = {
  accounts: StoredAccount[]
  /** The current result per student (what the report shows). */
  results: Record<string, TestResult>
  /** Every result a student has had, oldest first — their passbook keeps all of them. */
  resultHistory?: Record<string, TestResult[]>
  /** The latest plan per student (what the teacher acts on). */
  plans?: Record<string, Plan>
  planHistory?: Record<string, Plan[]>
  reflections?: Record<string, Reflection[]>
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

export class Store {
  constructor(private readonly file: string) {}

  private read(): Data {
    if (!existsSync(this.file)) return { accounts: [], results: {} }
    return JSON.parse(readFileSync(this.file, 'utf8')) as Data
  }

  private write(data: Data): void {
    mkdirSync(dirname(this.file), { recursive: true })
    const temp = `${this.file}.${process.pid}.tmp`
    writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 })
    renameSync(temp, this.file)
  }

  /** The account, or null for a wrong role, code or password alike. */
  verify(role: Role, code: string, password: string): Profile | null {
    const found = this.read().accounts.find((account) => account.role === role && account.code === normaliseCode(code))
    const ok = matches(password, found?.password ?? DUMMY_HASH)
    return found && ok ? profileOf(found) : null
  }

  /** Add an account, or reset an existing one's details and password. */
  upsert(profile: Profile, password: string): void {
    const data = this.read()
    const code = normaliseCode(profile.code)
    data.accounts = data.accounts.filter((account) => !(account.role === profile.role && account.code === code))
    data.accounts.push({ ...profile, code, name: profile.name.trim(), password: hashPassword(password) })
    this.write(data)
  }

  /** Every account, students first, for the profile picker. */
  profiles(): Profile[] {
    const accounts = this.read().accounts.map(profileOf)
    return [...accounts.filter((account) => account.role === 'student'), ...accounts.filter((account) => account.role === 'teacher')]
  }

  /** One account by role and code, without checking a password. */
  profile(role: Role, code: string): Profile | null {
    const found = this.read().accounts.find((account) => account.role === role && account.code === normaliseCode(code))
    return found ? profileOf(found) : null
  }

  students(): Profile[] {
    return this.read().accounts.filter((account) => account.role === 'student').map(profileOf)
  }

  result(studentCode: string): TestResult | null {
    return this.read().results[normaliseCode(studentCode)] ?? null
  }

  saveResult(studentCode: string, result: TestResult): void {
    const data = this.read()
    const code = normaliseCode(studentCode)
    data.results[code] = result
    data.resultHistory = { ...data.resultHistory, [code]: [...(data.resultHistory?.[code] ?? []), result] }
    this.write(data)
  }

  /** Every result the student has had, oldest first. */
  resultHistory(studentCode: string): TestResult[] {
    return this.read().resultHistory?.[normaliseCode(studentCode)] ?? []
  }

  planHistory(studentCode: string): Plan[] {
    return this.read().planHistory?.[normaliseCode(studentCode)] ?? []
  }

  reflections(studentCode: string): Reflection[] {
    return this.read().reflections?.[normaliseCode(studentCode)] ?? []
  }

  addReflection(studentCode: string, text: string, createdAt = new Date().toISOString()): Reflection {
    const data = this.read()
    const code = normaliseCode(studentCode)
    const reflection = { text, createdAt }
    data.reflections = { ...data.reflections, [code]: [...(data.reflections?.[code] ?? []), reflection] }
    this.write(data)
    return reflection
  }

  /** Remove everything career-related for a student (the demo seed starts each one clean). */
  resetCareerData(studentCode: string): void {
    const data = this.read()
    const code = normaliseCode(studentCode)
    delete data.results[code]
    delete data.resultHistory?.[code]
    delete data.plans?.[code]
    delete data.planHistory?.[code]
    delete data.reflections?.[code]
    data.alerts = (data.alerts ?? []).filter((alert) => alert.studentCode !== code)
    this.write(data)
  }

  /** Clear the current result so the student can take the test again; the passbook keeps it. */
  clearResult(studentCode: string): void {
    const data = this.read()
    delete data.results[normaliseCode(studentCode)]
    this.write(data)
  }

  plan(studentCode: string): Plan | null {
    return this.read().plans?.[normaliseCode(studentCode)] ?? null
  }

  /** The teacher acts on the latest plan; the passbook keeps every one. */
  savePlan(studentCode: string, plan: Plan): void {
    const data = this.read()
    const code = normaliseCode(studentCode)
    data.plans = { ...data.plans, [code]: plan }
    data.planHistory = { ...data.planHistory, [code]: [...(data.planHistory?.[code] ?? []), plan] }
    this.write(data)
  }

  addAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'studentCode'> & { studentCode: string }): Alert {
    const data = this.read()
    const saved: Alert = {
      ...alert,
      studentCode: normaliseCode(alert.studentCode),
      id: randomBytes(8).toString('hex'),
      createdAt: new Date().toISOString(),
    }
    data.alerts = [...(data.alerts ?? []), saved]
    this.write(data)
    return saved
  }

  /** Open alerts, oldest first. */
  openAlerts(): Alert[] {
    return (this.read().alerts ?? []).filter((alert) => !alert.resolvedAt)
  }

  /** Mark an alert handled. False if there is no such open alert. */
  resolveAlert(id: string): boolean {
    const data = this.read()
    const alert = data.alerts?.find((candidate) => candidate.id === id && !candidate.resolvedAt)
    if (!alert) return false
    alert.resolvedAt = new Date().toISOString()
    this.write(data)
    return true
  }
}
