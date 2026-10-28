import type { ChatTransport } from '../types'
import { createMockTransport } from './mockTransport'
import { createGatewayTransport } from './gatewayTransport'

export { createMockTransport, createGatewayTransport }

/**
 * The server is the real path (and where a model will plug in). Set
 * VITE_CHAT_MOCK=true to run the UI with no server at all, answering in the
 * browser from the same script.
 */
export function resolveTransport(): ChatTransport {
  if (import.meta.env.VITE_CHAT_MOCK === 'true') return createMockTransport()
  return createGatewayTransport(import.meta.env.VITE_CHAT_URL ?? '/api/chat')
}
