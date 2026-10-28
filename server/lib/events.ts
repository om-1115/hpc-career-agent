/**
 * Server → browser chat events. One `data:` line per event, then `[DONE]`.
 *
 *   data: {"type":"delta","text":"Choosing a stream"}
 *   data: {"type":"error","message":"…","retryable":true}
 *   data: [DONE]
 */

export type ChatEvent =
  | { type: 'delta'; text: string }
  /** Turn finished cleanly; carries whatever the client should persist. */
  | { type: 'done'; conversationId: string }
  | { type: 'error'; message: string; retryable: boolean }

export function encodeEvent(event: ChatEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

export const DONE_SENTINEL = 'data: [DONE]\n\n'

/** Headers that keep an SSE stream unbuffered through proxies. */
export const SSE_HEADERS = {
  'content-type': 'text/event-stream; charset=utf-8',
  'cache-control': 'no-cache, no-transform',
  connection: 'keep-alive',
  // nginx/ALB will otherwise hold the stream until the buffer fills.
  'x-accel-buffering': 'no',
} as const
