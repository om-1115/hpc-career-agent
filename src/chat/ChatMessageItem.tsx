import type { ChatMessage } from './types'
import { RichText } from './richText'

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const formatSize = (bytes?: number) =>
  bytes == null ? null : bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`

const ACTION_LABELS: Record<string, string> = {
  test: 'Take the career test',
  report: 'Open your report',
  careers: 'Explore careers',
}

type Props = {
  message: ChatMessage
  /** First assistant message in a run — the only one that shows the orb. */
  showAvatar: boolean
  /** Last message in a run — the only one that shows a timestamp. */
  showTime: boolean
  onAction: (url: string) => void
}

export function ChatMessageItem({ message, showAvatar, showTime, onAction }: Props) {
  const isAssistant = message.role === 'assistant'
  // A turn that delivered only a PDF has no text but is not still thinking.
  const isPending =
    isAssistant &&
    message.content.length === 0 &&
    !message.attachments?.length &&
    !message.actions?.length

  return (
    <div className={`chat-message chat-message--${message.role}`}>
      {isAssistant &&
        (showAvatar ? (
          <span className="chat-message__avatar" aria-hidden="true">
            <img src="/assets/fab-orb.png" alt="" />
          </span>
        ) : (
          <span className="chat-message__avatar chat-message__avatar--spacer" aria-hidden="true" />
        ))}

      <span className="chat-message__stack">
        {(message.content.length > 0 || isPending) && (
          <span className="chat-message__bubble">
            {isPending ? (
              <span className="chat-typing" aria-label="Counsellor is typing">
                <span />
                <span />
                <span />
              </span>
            ) : isAssistant ? (
              <RichText text={message.content} />
            ) : (
              message.content
            )}
          </span>
        )}

        {message.attachments?.map((attachment) => (
          <a
            key={attachment.url}
            className="chat-attachment"
            href={attachment.url}
            download={attachment.name}
          >
            <span className="chat-attachment__icon" aria-hidden="true">
              <svg viewBox="0 0 20 20">
                <path
                  d="M11.5 2.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 17.5h8a1.5 1.5 0 0 0 1.5-1.5V6.5m-4-4 4 4m-4-4V6a.5.5 0 0 0 .5.5h3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="chat-attachment__text">
              <span className="chat-attachment__name">{attachment.name}</span>
              <span className="chat-attachment__meta">
                PDF{formatSize(attachment.size) ? ` · ${formatSize(attachment.size)}` : ''}
              </span>
            </span>
          </a>
        ))}

        {message.actions?.map((action) => (
          <button
            key={action.url}
            type="button"
            className="chat-action"
            onClick={() => onAction(action.url)}
          >
            {action.label || ACTION_LABELS[action.kind] || 'Open'}
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M6 3.5 10.5 8 6 12.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}

        {showTime && !isPending && <time className="chat-message__time">{formatTime(message.createdAt)}</time>}
      </span>
    </div>
  )
}
