/**
 * Signed, expiring tokens: HMAC-SHA256 over a base64url JSON payload.
 *
 * Used for sign-in sessions and for chat conversation handles. The server only
 * trusts identity it signed itself, so nobody can claim another student's
 * results by sending their code.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function issueSigned(claims: object, secret: string, ttlMs = DEFAULT_TTL_MS): string {
  const payload = Buffer.from(JSON.stringify({ ...claims, exp: Date.now() + ttlMs })).toString('base64url')
  return `${payload}.${sign(payload, secret)}`
}

/** The claims inside a signed value, or null if it is forged, malformed or expired. */
export function readSigned<T extends object>(value: unknown, secret: string): T | null {
  if (typeof value !== 'string') return null

  const separator = value.lastIndexOf('.')
  if (separator <= 0) return null

  const payload = value.slice(0, separator)
  const provided = Buffer.from(value.slice(separator + 1))
  const expected = Buffer.from(sign(payload, secret))
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString()) as T & { exp?: number }
    if (typeof claims.exp !== 'number' || claims.exp < Date.now()) return null
    return claims
  } catch {
    return null
  }
}
