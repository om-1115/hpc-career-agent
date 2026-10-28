/**
 * The scripted counsellor: answers from shared/counsellorScript.ts, streamed in
 * small chunks so the chat behaves exactly as it will with a real model behind
 * it. Swap this generator for a model call to make the counsellor an agent.
 */

import { chunkReply, findReply } from '../../shared/counsellorScript.ts'
import type { ChatEvent } from './events.ts'

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => { clearTimeout(timer); resolve() }, { once: true })
  })

export async function* offlineTurn(text: string, signal: AbortSignal): AsyncGenerator<ChatEvent> {
  await sleep(400, signal)
  if (signal.aborted) return

  for (const chunk of chunkReply(findReply(text))) {
    if (signal.aborted) return
    yield { type: 'delta', text: chunk }
    await sleep(chunk.includes('\n') ? 70 : 18, signal)
  }
}
