/**
 * Conversation starters. Shown in the welcome state, then offered again
 * whenever the learner is idle — minus anything they have already asked.
 */
export const STARTER_PROMPTS = [
  'Which careers fit the subjects I like?',
  'How do I choose a stream after Class 10?',
  'What skills should I build this year?',
  'I have no idea what I want to do',
  'Tell me about careers in design',
  'Do I need to crack an entrance exam?',
] as const

export function pickSuggestions(asked: string[], limit = 3): string[] {
  const seen = new Set(asked.map((text) => text.trim().toLowerCase()))
  return STARTER_PROMPTS.filter((prompt) => !seen.has(prompt.toLowerCase())).slice(0, limit)
}
