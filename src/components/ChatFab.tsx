import { useEffect, useRef } from 'react'
import { useChat } from '../chat/ChatProvider'
import './ChatFab.css'

/** Figma node 3:197 / 3:192 — floating career-counselling chatbot launcher. */
export function ChatFab() {
  const { isOpen, openChat } = useChat()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)

  // Closing the sheet returns focus to the launcher it came from.
  useEffect(() => {
    if (wasOpen.current && !isOpen) buttonRef.current?.focus()
    wasOpen.current = isOpen
  }, [isOpen])

  return (
    <div className={`chat-fab${isOpen ? ' chat-fab--hidden' : ''}`}>
      <button
        ref={buttonRef}
        type="button"
        className="chat-fab__button"
        aria-label="Open career counselling chat"
        aria-expanded={isOpen}
        tabIndex={isOpen ? -1 : 0}
        onClick={openChat}
      >
        <span className="chat-fab__glows" aria-hidden="true">
          <span className="chat-fab__halo" />
          <span className="chat-fab__spin">
            <span className="chat-fab__glow chat-fab__glow--1">
              <span className="chat-fab__glow-rot">
                <span className="chat-fab__glow-bleed">
                  <img src="/assets/fab-glow-1.svg" alt="" />
                </span>
              </span>
            </span>
            <span className="chat-fab__glow chat-fab__glow--2">
              <span className="chat-fab__glow-rot">
                <span className="chat-fab__glow-bleed">
                  <img src="/assets/fab-glow-2.svg" alt="" />
                </span>
              </span>
            </span>
          </span>
        </span>
        <span className="chat-fab__orb" aria-hidden="true">
          <img src="/assets/fab-orb.png" alt="" />
        </span>
      </button>
    </div>
  )
}
