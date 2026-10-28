import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat } from './ChatProvider'
import { useAuth } from '../auth/AuthProvider'
import { ChatComposer } from './ChatComposer'
import { ChatMessageItem } from './ChatMessageItem'
import { pickSuggestions } from './suggestions'
import './ChatPanel.css'

type ChatPanelProps = {
  /** True while something covers the sheet — it must not stay focusable. */
  covered?: boolean
}

export function ChatPanel({ covered = false }: ChatPanelProps) {
  const { session } = useAuth()
  const navigate = useNavigate()
  const { isOpen, closeChat, messages, status, error, isDemo, send, stop, retry, reset } = useChat()

  const bodyRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const streaming = status === 'streaming'

  // Escape closes the sheet.
  useEffect(() => {
    if (!isOpen || covered) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeChat()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeChat, covered, isOpen])

  // Land the caret in the composer when the sheet opens.
  useEffect(() => {
    if (!isOpen) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 320)
    return () => window.clearTimeout(timer)
  }, [isOpen])

  // Follow the conversation as it streams.
  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    body.scrollTop = body.scrollHeight
  }, [messages, isOpen])

  // Leave the chat for a page of the app: a shortcut below, or a button the
  // counsellor put in a reply.
  const go = (path: string) => {
    closeChat()
    navigate(path)
  }

  const asked = messages.filter((message) => message.role === 'user').map((message) => message.content)
  // Three to open with, two once the conversation is underway.
  const suggestions = pickSuggestions(asked, messages.length === 0 ? 3 : 2)
  const showSuggestions = isOpen && !streaming && suggestions.length > 0

  return (
    <div className={`chat-panel${isOpen ? ' chat-panel--open' : ''}`} inert={!isOpen || covered}>
      <button className="chat-panel__scrim" onClick={closeChat}>
        <span className="sr-only">Close chat</span>
      </button>

      <section
        className="chat-panel__sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Career counselling chat"
      >
        <span className="chat-panel__grabber" aria-hidden="true" />

        <header className={`chat-panel__header${scrolled ? ' chat-panel__header--raised' : ''}`}>
          <span className="chat-panel__avatar" aria-hidden="true">
            <img src="/assets/fab-orb.png" alt="" />
          </span>
          <span className="chat-panel__titles">
            <h2 className="chat-panel__title">Career Counsellor</h2>
            <p className="chat-panel__status">
              {streaming ? 'Typing…' : 'Here to help you plan what comes next'}
            </p>
          </span>

          {messages.length > 0 && (
            <button
              type="button"
              className="chat-panel__icon-button"
              onClick={() => reset()}
              aria-label="Start a new conversation"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M16 10a6 6 0 1 1-1.76-4.24M16 4v3h-3"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </button>
          )}

          <button
            type="button"
            className="chat-panel__icon-button"
            onClick={closeChat}
            aria-label="Close chat"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="m6 6 8 8M14 6l-8 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        </header>

        <div
          className={`chat-panel__body${messages.length === 0 ? ' chat-panel__body--empty' : ''}`}
          ref={bodyRef}
          onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 4)}
        >
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <span className="chat-welcome__orb" aria-hidden="true">
                <img src="/assets/fab-orb.png" alt="" />
              </span>
              <p className="chat-welcome__title">Hi — let's talk about what's next.</p>
              <p className="chat-welcome__body">
                Ask me about subjects, streams, skills, or the bit you haven't figured out yet.
                Nothing you say here goes on your progress card.
              </p>
              {isDemo && <p className="chat-welcome__note">Demo mode — replies come from a local script.</p>}
            </div>
          ) : (
            <div className="chat-thread" aria-live="polite">
              {messages.map((message, index) => (
                <ChatMessageItem
                  key={message.id}
                  message={message}
                  showAvatar={message.role === 'assistant' && messages[index - 1]?.role !== 'assistant'}
                  showTime={messages[index + 1]?.role !== message.role}
                  onAction={go}
                />
              ))}
            </div>
          )}

          {error && (
            <div className="chat-error" role="alert">
              <p className="chat-error__text">{error}</p>
              <button type="button" className="chat-error__retry" onClick={retry}>
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Direct entry, so a student does not have to talk their way to a link. */}
        {session?.role === 'student' && (
          <div className="chat-shortcuts">
            <button type="button" className="chat-shortcut" onClick={() => go('/student/test')}>
              <span className="chat-shortcut__emoji" aria-hidden="true">🧠</span>
              <span className="chat-shortcut__text">
                <span className="chat-shortcut__label">Career test</span>
                <span className="chat-shortcut__hint">Interests + personality</span>
              </span>
            </button>
            <button type="button" className="chat-shortcut" onClick={() => go('/student/careers')}>
              <span className="chat-shortcut__emoji" aria-hidden="true">🧭</span>
              <span className="chat-shortcut__text">
                <span className="chat-shortcut__label">Explore careers</span>
                <span className="chat-shortcut__hint">Jobs and how to get there</span>
              </span>
            </button>
          </div>
        )}

        {showSuggestions && (
          <div className="chat-suggestions">
            <p className="chat-suggestions__label">Try asking</p>
            {suggestions.map((prompt) => (
              <button
                type="button"
                key={prompt}
                className="chat-suggestions__chip"
                onClick={() => send(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <ChatComposer streaming={streaming} inputRef={inputRef} onSend={send} onStop={stop} />
      </section>
    </div>
  )
}
