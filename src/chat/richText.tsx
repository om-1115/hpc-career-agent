import { Fragment, type ReactNode } from 'react'

type Block =
  | { kind: 'paragraph'; lines: string[] }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'steps'; items: string[] }

const BULLET = /^\s*[•\-*]\s+(.*)$/
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/

/**
 * Assistant replies arrive as plain text. Rather than dumping them into a
 * `pre-wrap` blob, split them into paragraphs and lists so a structured answer
 * reads like one. Tolerant of markdown-ish output from a real model.
 */
export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = []
  let paragraph: string[] = []

  const flush = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: 'paragraph', lines: paragraph })
      paragraph = []
    }
  }

  const appendItem = (kind: 'bullets' | 'steps', item: string) => {
    flush()
    const last = blocks[blocks.length - 1]
    if (last && last.kind === kind) last.items.push(item)
    else blocks.push({ kind, items: [item] })
  }

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trimEnd()
    if (line.trim().length === 0) {
      flush()
      continue
    }

    const bullet = line.match(BULLET)
    if (bullet) {
      appendItem('bullets', bullet[1])
      continue
    }

    const numbered = line.match(NUMBERED)
    if (numbered) {
      appendItem('steps', numbered[1])
      continue
    }

    paragraph.push(line)
  }

  flush()
  return blocks
}

/** Minimal inline emphasis — enough for **bold** without a markdown dependency. */
function inline(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={index}>{part.slice(2, -2)}</strong>
      ) : (
        <Fragment key={index}>{part}</Fragment>
      ),
    )
}

export function RichText({ text }: { text: string }) {
  const blocks = parseBlocks(text)

  return (
    <>
      {blocks.map((block, index) => {
        if (block.kind === 'paragraph') {
          return (
            <p className="rich-text__paragraph" key={index}>
              {block.lines.map((line, lineIndex) => (
                <Fragment key={lineIndex}>
                  {lineIndex > 0 && <br />}
                  {inline(line)}
                </Fragment>
              ))}
            </p>
          )
        }

        if (block.kind === 'bullets') {
          return (
            <ul className="rich-text__bullets" key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{inline(item)}</li>
              ))}
            </ul>
          )
        }

        return (
          <ol className="rich-text__steps" key={index}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{inline(item)}</li>
            ))}
          </ol>
        )
      })}
    </>
  )
}
