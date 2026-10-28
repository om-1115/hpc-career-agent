import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ChatChunk, ChatMessage, ChatStatus } from './types'
import { resolveTransport } from './transports'

type ChatContextValue = {
  isOpen: boolean
  openChat: () => void
  closeChat: () => void
  messages: ChatMessage[]
  status: ChatStatus
  error: string | null
  /** True while replies come from the local script rather than the agent. */
  isDemo: boolean
  send: (text: string) => void
  stop: () => void
  retry: () => void
  reset: (closePanel?: boolean) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

let sequence = 0
const nextId = () => `msg-${++sequence}`

/** Fold one streamed chunk into the assistant message being built. */
function applyChunk(message: ChatMessage, chunk: ChatChunk): ChatMessage {
  switch (chunk.type) {
    case 'text':
      return { ...message, content: message.content + chunk.text }

    case 'attachment': {
      const { type: _type, ...attachment } = chunk
      return { ...message, attachments: [...(message.attachments ?? []), attachment] }
    }

    case 'action': {
      const { type: _type, ...action } = chunk
      // The same page can be suggested twice in one reply; show it once.
      if (message.actions?.some((existing) => existing.url === action.url)) return message
      // Drop the raw `[label](url)` from the text — it carries a signed token
      // and reads as noise next to the button that replaces it.
      const content = action.markdown
        ? message.content.replace(action.markdown, '').replace(/[ \t]+\n/g, '\n').trimEnd()
        : message.content
      return { ...message, content, actions: [...(message.actions ?? []), action] }
    }
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const transport = useMemo(() => resolveTransport(), [])

  const [isOpen, setIsOpen] = useState(false)
  const [isDemo, setIsDemo] = useState(transport.name === 'mock')
  const [messages, setMessagesState] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<ChatStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  // Kept in a ref as well so a turn can read the transcript without waiting
  // for a re-render.
  const messagesRef = useRef<ChatMessage[]>(messages)
  const setMessages = useCallback((update: (previous: ChatMessage[]) => ChatMessage[]) => {
    messagesRef.current = update(messagesRef.current)
    setMessagesState(messagesRef.current)
  }, [])

  const abortRef = useRef<AbortController | null>(null)
  const lastTurnRef = useRef<{ history: ChatMessage[]; text: string } | null>(null)

  const run = useCallback(
    async (history: ChatMessage[], text: string, replay = false) => {
      lastTurnRef.current = { history, text }

      const userMessage: ChatMessage = {
        id: nextId(),
        role: 'user',
        content: text,
        createdAt: Date.now(),
      }
      const replyId = nextId()

      setMessages(() => [
        ...history,
        userMessage,
        { id: replyId, role: 'assistant', content: '', createdAt: Date.now() },
      ])
      setStatus('streaming')
      setError(null)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        for await (const chunk of transport.send({ history, text, replay }, controller.signal)) {
          setMessages((previous) =>
            previous.map((message) => (message.id === replyId ? applyChunk(message, chunk) : message)),
          )
        }
        // A turn that produced nothing would otherwise leave a bubble stuck on
        // the typing indicator, which is derived from emptiness alone.
        setMessages((previous) =>
          previous.filter((message) => message.id !== replyId || !isEmptyReply(message)),
        )
        setStatus('idle')
      } catch (cause) {
        if (controller.signal.aborted) {
          // Stopped on purpose — keep whatever streamed in, drop it if empty.
          setMessages((previous) =>
            previous.filter((message) => message.id !== replyId || !isEmptyReply(message)),
          )
          setStatus('idle')
          return
        }
        // Keep the partial reply. The gateway deliberately distinguishes "cut
        // off after streaming" from "never replied" so the learner does not
        // lose a half-answer they were already reading.
        setMessages((previous) =>
          previous.filter((message) => message.id !== replyId || !isEmptyReply(message)),
        )
        setError(cause instanceof Error ? cause.message : 'Something went wrong.')
        setStatus('error')
      } finally {
        if (abortRef.current === controller) abortRef.current = null
      }
    },
    [setMessages, transport],
  )

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || abortRef.current) return
      void run(messagesRef.current, trimmed)
    },
    [run],
  )

  const retry = useCallback(() => {
    const turn = lastTurnRef.current
    if (!turn || abortRef.current) return
    // Replay: the user turn is already in the upstream transcript.
    void run(turn.history, turn.text, true)
  }, [run])

  const stop = useCallback(() => abortRef.current?.abort(), [])

  /**
   * Clear the conversation. `closePanel` is for sign-out, where the sheet must
   * not stay open over the login screen; the panel's own "start a new
   * conversation" leaves it open, because dismissing the sheet the user is
   * looking at is not what that control says it does.
   */
  const reset = useCallback((closePanel = false) => {
    abortRef.current?.abort()
    abortRef.current = null
    lastTurnRef.current = null
    setMessages(() => [])
    setStatus('idle')
    setError(null)
    if (closePanel) setIsOpen(false)
    // Also drop the server-side identity. Clearing the visible transcript while
    // keeping the handle would still append the next person's messages to the
    // previous person's conversation and profile.
    transport.endSession?.()
  }, [setMessages, transport])

  const value = useMemo<ChatContextValue>(
    () => ({
      isOpen,
      openChat: () => {
        setIsOpen(true)
        // Resolve the session up front so the panel can say whether replies are
        // coming from the real agent or the local script.
        void transport
          .start?.()
          .then((info) => setIsDemo(transport.name === 'mock' || info?.mode === 'offline'))
          .catch(() => {})
      },
      closeChat: () => setIsOpen(false),
      messages,
      status,
      error,
      isDemo,
      send,
      stop,
      retry,
      reset,
    }),
    [error, isDemo, isOpen, messages, retry, reset, send, status, stop, transport],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

function isEmptyReply(message: ChatMessage): boolean {
  return (
    message.content.length === 0 &&
    !message.attachments?.length &&
    !message.actions?.length
  )
}

export function useChat() {
  const value = useContext(ChatContext)
  if (!value) throw new Error('useChat must be used inside <ChatProvider>')
  return value
}
