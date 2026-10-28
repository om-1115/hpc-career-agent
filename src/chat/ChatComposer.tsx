import { useState, type RefObject } from 'react'

const MAX_HEIGHT = 104

type Props = {
  streaming: boolean
  inputRef: RefObject<HTMLTextAreaElement | null>
  onSend: (text: string) => void
  onStop: () => void
}

export function ChatComposer({ streaming, inputRef, onSend, onStop }: Props) {
  const [draft, setDraft] = useState('')
  const canSend = draft.trim().length > 0 && !streaming

  const resize = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, MAX_HEIGHT)}px`
  }

  const submit = () => {
    if (!canSend) return
    onSend(draft)
    setDraft('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
  }

  return (
    <form
      className="chat-composer"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <textarea
        ref={inputRef}
        className="chat-composer__input"
        value={draft}
        rows={1}
        placeholder="Ask about subjects, skills, or what's next…"
        aria-label="Message the career counsellor"
        onChange={(event) => {
          setDraft(event.target.value)
          resize(event.target)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            submit()
          }
        }}
      />

      {streaming ? (
        <button type="button" className="chat-composer__stop" onClick={onStop} aria-label="Stop generating">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <rect x="4.5" y="4.5" width="7" height="7" rx="1.5" fill="currentColor" />
          </svg>
        </button>
      ) : (
        <button type="submit" className="chat-composer__send" disabled={!canSend} aria-label="Send message">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M8 13V3.5M8 3.5 4 7.5M8 3.5l4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </button>
      )}
    </form>
  )
}
