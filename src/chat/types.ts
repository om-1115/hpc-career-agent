export type ChatRole = 'user' | 'assistant'

/** A file the counsellor produced for this turn. */
export type ChatAttachment = {
  name: string
  url: string
  mime: string
  size?: number
}

/** A page of the app the counsellor suggests opening, shown as a button. */
export type ChatAction = {
  kind: 'test' | 'report' | 'careers'
  /** An in-app path, e.g. /student/test. */
  url: string
  label?: string
  /** The literal `[label](url)` in the reply text, stripped once rendered. */
  markdown?: string
}

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  createdAt: number
  attachments?: ChatAttachment[]
  actions?: ChatAction[]
}

export type ChatSendRequest = {
  /** Transcript before this turn, oldest first. */
  history: ChatMessage[]
  /** What the learner just sent. */
  text: string
  /** True when replaying a failed turn, so it is not persisted twice upstream. */
  replay?: boolean
}

/**
 * One piece of an assistant turn as it streams.
 *
 * Text arrives incrementally; attachments and actions arrive whole, usually at
 * the end of the turn once the gateway has seen the complete reply.
 */
export type ChatChunk =
  | { type: 'text'; text: string }
  | ({ type: 'attachment' } & ChatAttachment)
  | ({ type: 'action' } & ChatAction)

/**
 * The single seam between the chat UI and whatever answers it.
 *
 * Swap the implementation and nothing in the UI changes — see
 * `transports/gatewayTransport.ts` for the one that talks to the server.
 */

export type ChatTransport = {
  /** Shown in dev tooling so it is obvious which brain is answering. */
  name: string
  send(request: ChatSendRequest, signal: AbortSignal): AsyncIterable<ChatChunk>
  /**
   * Optional per-session bootstrap; resolves before the first turn. May report
   * how replies are being produced, so the UI can say when they are scripted.
   */
  start?(): Promise<{ mode?: string } | void>
  /**
   * Optional: drop any cached server-side identity, so the next turn starts a
   * new conversation. Called on sign-out — without it the next person on a
   * shared device keeps writing into the previous person's transcript.
   */
  endSession?(): void
}

export type ChatStatus = 'idle' | 'streaming' | 'error'
