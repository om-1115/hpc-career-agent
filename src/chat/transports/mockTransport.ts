import { chunkReply, findReply } from '../../../shared/counsellorScript'
import type { ChatChunk, ChatTransport } from '../types'

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })

export function createMockTransport(): ChatTransport {
  return {
    name: 'mock',
    async start() {
      return { mode: 'offline' }
    },
    async *send({ text }, signal) {
      await wait(420, signal)

      // Stream token-ish chunks so the UI exercises its real streaming path.
      for (const chunk of chunkReply(findReply(text))) {
        if (signal.aborted) return
        yield { type: 'text', text: chunk } satisfies ChatChunk
        await wait(chunk.includes('\n') ? 90 : 22, signal)
      }
    },
  }
}
