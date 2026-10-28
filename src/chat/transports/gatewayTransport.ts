import type { ChatChunk, ChatTransport } from '../types'

/**
 * Talks to the server's counsellor (server/app.ts, /api/chat). Whatever answers
 * there — today a script, later a model — arrives here as one `data:` line per
 * event, terminated by `[DONE]`, so the UI never changes when the brain does.
 */

/** The gateway mints identity and returns it only inside a signed handle. */
type Session = { handle: string; mode: string }

const SESSION_TIMEOUT_MS = 15_000

export function createGatewayTransport(baseUrl = '/api/chat'): ChatTransport {
  let session: Session | null = null
  let bootstrap: Promise<Session> | null = null
  let bootstrapAbort: AbortController | null = null

  /**
   * Drop the cached handle so the next turn mints a fresh one.
   *
   * Without this, signing out on a shared phone left the previous user's handle
   * in scope: the next person's first message appended to THEIR server-side
   * transcript and profile.
   */
  const resetSession = () => {
    // Abort any bootstrap still in flight. Dropping the reference alone left it
    // running, and its resolution would re-cache the signed-out user's handle.
    bootstrapAbort?.abort()
    bootstrapAbort = null
    session = null
    bootstrap = null
  }

  /** One session per sign-in, shared by every turn until reset. */
  const ensureSession = (): Promise<Session> => {
    if (session) return Promise.resolve(session)
    if (!bootstrap) bootstrapAbort = new AbortController()
    bootstrap ??= fetch(`${baseUrl}/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // Without a deadline a hung bootstrap wedges the chat permanently:
      // `bootstrap` would stay pending and every later turn would await it.
      // The controller lets sign-out cancel one that is still running.
      signal: AbortSignal.any([
        AbortSignal.timeout(SESSION_TIMEOUT_MS),
        bootstrapAbort!.signal,
      ]),
      body: JSON.stringify({}),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Could not start a session (${response.status})`)
        session = (await response.json()) as Session
        return session
      })
      .catch((cause) => {
        bootstrap = null // let the next turn retry rather than wedging the chat
        throw new Error(unreachable(cause))
      })
    return bootstrap
  }

  return {
    name: 'gateway',
    endSession: resetSession,
    async start() {
      const active = await ensureSession()
      return { mode: active.mode }
    },
    async *send({ text, replay }, signal) {
      const active = await ensureSession()

      let response: Response
      try {
        response = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          signal,
          // `replay` tells the gateway not to re-post the user turn upstream,
          // so a retry does not duplicate the message in the transcript.
          body: JSON.stringify({ handle: active.handle, text, replay: replay === true }),
        })
      } catch (cause) {
        if (signal.aborted) return
        // fetch throws a bare "Failed to fetch" when nothing answers, which
        // tells the reader nothing. Name the actual cause instead.
        throw new Error(unreachable(cause))
      }

      if (!response.ok || !response.body) {
        const detail = await response.text().catch(() => '')
        throw new Error(detail || `The counsellor is unavailable (${response.status}).`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let sawDone = false

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          let newline: number
          // A `data:` line can straddle a chunk boundary, so only complete
          // lines are consumed and the remainder stays buffered.
          while ((newline = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, newline).trim()
            buffer = buffer.slice(newline + 1)
            // `:` comment frames are the gateway's heartbeat — ignore them.
            if (!line.startsWith('data:')) continue

            const payload = line.slice(5).trim()
            if (!payload) continue
            if (payload === '[DONE]') {
              sawDone = true
              return
            }

            const chunk = toChunk(payload)
            if (chunk) yield chunk
          }
        }
      } finally {
        reader.cancel().catch(() => {})
      }

      // The body ended without the sentinel: the connection dropped mid-turn.
      if (!sawDone) {
        throw new Error('The connection dropped before the reply finished.')
      }
    },
  }
}

/**
 * Distinguish "the counsellor service is down" from "the gateway is down".
 * A TypeError out of fetch means the request never reached anything.
 */
function unreachable(cause: unknown): string {
  if (cause instanceof Error && cause.name === 'TimeoutError') {
    return 'The counsellor took too long to respond. Try again.'
  }
  if (cause instanceof TypeError) {
    return "Can't reach the counsellor service. It may not be running — start it with `npm run server`."
  }
  return cause instanceof Error ? cause.message : String(cause)
}

function toChunk(payload: string): ChatChunk | null {
  let event: Record<string, unknown>
  try {
    event = JSON.parse(payload) as Record<string, unknown>
  } catch {
    return null
  }

  switch (event.type) {
    case 'delta':
      return typeof event.text === 'string' && event.text ? { type: 'text', text: event.text } : null

    case 'attachment':
      return {
        type: 'attachment',
        name: String(event.name ?? 'attachment'),
        url: String(event.url ?? ''),
        mime: String(event.mime ?? 'application/octet-stream'),
        size: typeof event.size === 'number' ? event.size : undefined,
      }

    case 'action':
      // Only in-app pages: a reply must never turn into a link off the app.
      if (!['test', 'report', 'careers'].includes(String(event.kind))) return null
      if (typeof event.url !== 'string' || !/^\/student\/[a-z]+$/.test(event.url)) return null
      return {
        type: 'action',
        kind: event.kind as 'test' | 'report' | 'careers',
        url: event.url,
        label: typeof event.label === 'string' ? event.label : undefined,
        markdown: typeof event.markdown === 'string' ? event.markdown : undefined,
      }

    // The gateway reports upstream failures in-band, because the HTTP status
    // was already committed to 200 before anything went wrong.
    case 'error':
      throw new Error(String(event.message ?? 'The counsellor ran into a problem.'))

    default:
      return null
  }
}
