/** The server's API (server/app.ts), for screens to call with the signed-in token. */

import type { TestResult } from '../../shared/scoring'
import type { Answers, RiasecType } from '../../shared/test'

export type Role = 'student' | 'teacher'
export type Profile = { role: Role; code: string; name: string; classLine?: string }
export type ClassStudent = {
  code: string
  name: string
  classLine?: string
  result: { code: RiasecType[]; completedAt: string } | null
}

/** A failed call, carrying the server's error code (`invalid_credentials` …). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code)
  }
}

async function call<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body) headers.set('content-type', 'application/json')
  if (token) headers.set('authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`/api${path}`, { ...init, headers, cache: 'no-store' })
  } catch {
    throw new ApiError(0, 'unreachable')
  }
  const body = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) throw new ApiError(response.status, body.error ?? `http_${response.status}`)
  return body as T
}

export const login = (role: Role, code: string, password: string) =>
  call<{ profile: Profile; token: string }>('/login', { method: 'POST', body: JSON.stringify({ role, code, password }) })

export const myResult = (token: string) => call<{ result: TestResult | null }>('/results/me', {}, token)

export const submitAnswers = (token: string, answers: Answers) =>
  call<{ result: TestResult }>('/results', { method: 'POST', body: JSON.stringify({ answers }) }, token)

export const clearResult = (token: string) => call<{ result: null }>('/results/me', { method: 'DELETE' }, token)

export const classResults = (token: string) => call<{ students: ClassStudent[] }>('/class', {}, token)

export function describeError(error: unknown): string {
  switch (error instanceof ApiError ? error.code : '') {
    case 'invalid_credentials':
      return 'Those details don’t match. Check your code and password and try again.'
    case 'too_many_attempts':
      return 'Too many tries. This account is locked for 15 minutes.'
    case 'credentials_required':
      return 'Fill in your code and password.'
    case 'unreachable':
      return 'Can’t reach the server. Check your connection and try again.'
    default:
      return 'Something went wrong. Try again in a moment.'
  }
}
