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
type Data = { accounts: StoredAccount[]; results: Record<string, TestResult> }

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

  students(): Profile[] {
    return this.read().accounts.filter((account) => account.role === 'student').map(profileOf)
  }

  result(studentCode: string): TestResult | null {
    return this.read().results[normaliseCode(studentCode)] ?? null
  }

  saveResult(studentCode: string, result: TestResult): void {
    const data = this.read()
    data.results[normaliseCode(studentCode)] = result
    this.write(data)
  }

  /** Clear a result so the student can take the test again. */
  clearResult(studentCode: string): void {
    const data = this.read()
    delete data.results[normaliseCode(studentCode)]
    this.write(data)
  }
}
