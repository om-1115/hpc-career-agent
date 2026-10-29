/**
 * The student surveys on the Holistic Progress Card: Skills, Looking Forward
 * and the two Goal Setting surveys (Figma "Student · My Work", screens 04–08).
 *
 * Shaped by the field research (docs/user-research.md): every survey mixes
 * options with the student's own words, explains words like "stream" inside
 * the question, lets a student say "I don't understand this question" instead
 * of guessing, and ends by reflecting their answers back to them as a
 * first-person reflection they can edit and keep in their passbook.
 */

export type ChoiceOption = { value: string; label: string; detail?: string }

export type SurveyQuestion =
  | { id: string; kind: 'choice'; prompt: string; help?: string; options: ChoiceOption[] }
  | { id: string; kind: 'multi'; prompt: string; help?: string; options: ChoiceOption[]; max: number }
  | { id: string; kind: 'scale'; prompt: string; help?: string; low: string; high: string; words: [string, string, string, string, string] }
  | { id: string; kind: 'text'; prompt: string; help?: string; placeholder: string; maxLength: number; optional?: boolean }

export type SurveyDefinition = {
  id: SurveyId
  title: string
  emoji: string
  intro: string
  minutes: number
  topics: string[]
  /** Who sees the answers, said before the first question. */
  privacy: string
  questions: SurveyQuestion[]
  /** The student's answers, said back to them in their own voice. */
  reflect: (answers: SurveyAnswers) => string
}

export type SurveyId = 'skills' | 'looking-forward' | 'goal-academic' | 'goal-non-academic'

/** Choice: an option value; multi: option values; scale: 1–5; text: the student's words. */
export type SurveyAnswer = string | string[] | number
export type SurveyAnswers = Record<string, SurveyAnswer>

/** Recorded when a student taps "I don't understand this question" — data, not a skip. */
export const UNCLEAR = 'unclear'

const PRIVACY = 'Only you and your teacher see your answers. There are no right or wrong answers.'

// Helpers for writing reflections.
const option = (question: SurveyQuestion, value: SurveyAnswer | undefined) =>
  question.kind === 'choice' || question.kind === 'multi' ? question.options.find((choice) => choice.value === value) : undefined
const list = (items: string[]) => (items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`)
const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)
const sentence = (text: string) => {
  const trimmed = text.trim()
  return trimmed ? `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}${/[.!?]$/.test(trimmed) ? '' : '.'}` : ''
}

function reader(survey: Pick<SurveyDefinition, 'questions'>, answers: SurveyAnswers) {
  const question = (id: string) => survey.questions.find((candidate) => candidate.id === id)!
  const given = (id: string) => (answers[id] === UNCLEAR ? undefined : answers[id])
  return {
    /** The chosen option's label, or '' if skipped or not understood. */
    choice: (id: string) => option(question(id), given(id))?.label ?? '',
    /** The chosen options' labels. */
    multi: (id: string) => {
      const values = given(id)
      return Array.isArray(values) ? values.map((value) => option(question(id), value)?.label ?? '').filter(Boolean) : []
    },
    /** The scale answer as a word, e.g. "quite sure". */
    scale: (id: string) => {
      const q = question(id)
      const value = given(id)
      return q.kind === 'scale' && typeof value === 'number' ? q.words[value - 1] : ''
    },
    text: (id: string) => {
      const value = given(id)
      return typeof value === 'string' ? value.trim() : ''
    },
    raw: given,
  }
}

const SKILLS: SurveyDefinition = {
  id: 'skills',
  title: 'Skills',
  emoji: '🛠️',
  intro: 'What you can already do — at school, at home and on a phone or computer — and what you want to get better at.',
  minutes: 4,
  topics: ['Everyday skills', 'Digital skills', 'What to work on'],
  privacy: PRIVACY,
  questions: [
    {
      id: 'best',
      kind: 'multi',
      prompt: 'Which of these are you good at?',
      help: 'Choose up to 3.',
      max: 3,
      options: [
        { value: 'explaining', label: 'Explaining things to others' },
        { value: 'hands', label: 'Fixing or making things with my hands' },
        { value: 'drawing', label: 'Drawing or designing' },
        { value: 'organising', label: 'Keeping things organised' },
        { value: 'puzzles', label: 'Solving puzzles and problems' },
        { value: 'leading', label: 'Leading a group' },
        { value: 'helping', label: 'Helping and caring for people' },
        { value: 'sport', label: 'Sports or games' },
        { value: 'cooking', label: 'Cooking' },
      ],
    },
    {
      id: 'digital',
      kind: 'scale',
      prompt: 'How comfortable are you using a phone or computer for schoolwork?',
      low: 'Not at all',
      high: 'Very',
      words: ['not comfortable yet', 'a little unsure', 'okay', 'comfortable', 'very comfortable'],
    },
    {
      id: 'can-do',
      kind: 'multi',
      prompt: 'Which of these can you already do on a phone or computer?',
      help: 'Choose all that you can do on your own (up to 6).',
      max: 6,
      options: [
        { value: 'search', label: 'Search the internet for information' },
        { value: 'type', label: 'Type a document' },
        { value: 'slides', label: 'Make a presentation' },
        { value: 'form', label: 'Fill in an online form' },
        { value: 'email', label: 'Send an email' },
        { value: 'sheet', label: 'Use a spreadsheet' },
        { value: 'code', label: 'Write a little code' },
      ],
    },
    {
      id: 'speaking',
      kind: 'scale',
      prompt: 'How confident are you speaking in front of your class?',
      low: 'Not at all',
      high: 'Very',
      words: ['nervous', 'a little nervous', 'okay', 'confident', 'very confident'],
    },
    {
      id: 'time',
      kind: 'scale',
      prompt: 'How well do you manage your time for homework and study?',
      low: 'Not well',
      high: 'Very well',
      words: ['I find it hard to manage my time', 'I don’t manage my time very well yet', 'I manage my time okay', 'I manage my time well', 'I manage my time very well'],
    },
    {
      id: 'improve',
      kind: 'choice',
      prompt: 'Which one skill do you most want to get better at this year?',
      options: [
        { value: 'english', label: 'Speaking English' },
        { value: 'computers', label: 'Using computers' },
        { value: 'speaking', label: 'Speaking in front of people' },
        { value: 'writing', label: 'Writing clearly' },
        { value: 'maths', label: 'Maths' },
        { value: 'time', label: 'Managing my time' },
        { value: 'sport-art', label: 'A sport, music or art' },
      ],
    },
    {
      id: 'self-taught',
      kind: 'text',
      prompt: 'Tell us about something you learnt to do on your own.',
      help: 'Optional. A sentence or two is enough.',
      placeholder: 'e.g. I learnt to fix the chain on my cycle by watching my uncle.',
      maxLength: 300,
      optional: true,
    },
  ],
  reflect(answers) {
    const a = reader(SKILLS, answers)
    const best = a.multi('best')
    const canDo = a.multi('can-do')
    return [
      best.length ? `I’m good at ${list(best.map(lower))}.` : '',
      a.scale('digital') ? `Using a phone or computer for schoolwork, I feel ${a.scale('digital')}${canDo.length ? `, and I can already ${list(canDo.map(lower))}` : ''}.` : '',
      a.scale('speaking') ? `Speaking in front of my class, I feel ${a.scale('speaking')}.` : '',
      a.scale('time') ? `${a.scale('time')} for homework and study.` : '',
      a.choice('improve') ? `This year I want to get better at ${lower(a.choice('improve'))}.` : '',
      a.text('self-taught') ? `Something I learnt on my own: ${lower(sentence(a.text('self-taught')))}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  },
}

const LOOKING_FORWARD: SurveyDefinition = {
  id: 'looking-forward',
  title: 'Looking Forward',
  emoji: '🧭',
  intro: 'What you are thinking about for after this year — your stream, the work you imagine, and what you still need to find out.',
  minutes: 4,
  topics: ['Stream', 'Future work', 'Worries', 'Next steps'],
  privacy: PRIVACY,
  questions: [
    {
      id: 'stream',
      kind: 'choice',
      prompt: 'Which stream are you in, or thinking about, for Class 11–12?',
      help: 'A stream is the group of subjects you study in Class 11 and 12. It decides which courses you can do after Class 12.',
      options: [
        { value: 'science', label: 'Science', detail: 'Physics, Chemistry, and Biology or Maths — leads to doctor, engineer, nurse, scientist…' },
        { value: 'commerce', label: 'Commerce', detail: 'Accounts, Business Studies, Economics — leads to CA, banking, business…' },
        { value: 'arts', label: 'Arts / Humanities', detail: 'History, Political Science, languages — leads to teacher, lawyer, civil services, journalist…' },
        { value: 'vocational', label: 'A vocational or ITI course', detail: 'Training for a trade, such as electrician or computer hardware' },
        { value: 'unsure', label: 'Not sure yet' },
      ],
    },
    {
      id: 'sure',
      kind: 'scale',
      prompt: 'How sure are you about that choice?',
      low: 'Not sure',
      high: 'Very sure',
      words: ['not sure at all', 'not very sure', 'a bit sure', 'quite sure', 'very sure'],
    },
    {
      id: 'helper',
      kind: 'choice',
      prompt: 'Who helps you most with this decision?',
      options: [
        { value: 'family', label: 'My parents or family' },
        { value: 'teacher', label: 'A teacher' },
        { value: 'siblings', label: 'Older brothers, sisters or cousins' },
        { value: 'friends', label: 'Friends' },
        { value: 'online', label: 'The internet or videos' },
        { value: 'nobody', label: 'No one yet' },
      ],
    },
    {
      id: 'work',
      kind: 'text',
      prompt: 'What work do you imagine yourself doing one day?',
      help: 'It is fine to name more than one, or to say you don’t know yet.',
      placeholder: 'e.g. Something with computers, or an Army officer',
      maxLength: 120,
    },
    {
      id: 'route',
      kind: 'choice',
      prompt: 'How much do you know about how to get into that work?',
      help: 'For example, which course or exam leads there.',
      options: [
        { value: 'know', label: 'I know the course or exam I need' },
        { value: 'little', label: 'I know a little' },
        { value: 'none', label: 'I don’t know yet' },
      ],
    },
    {
      id: 'worries',
      kind: 'multi',
      prompt: 'What worries you most about what comes next?',
      help: 'Choose up to 2.',
      max: 2,
      options: [
        { value: 'money', label: 'Money for studies' },
        { value: 'marks', label: 'My marks' },
        { value: 'wrong-stream', label: 'Choosing the wrong stream' },
        { value: 'family', label: 'What my family expects' },
        { value: 'away', label: 'Leaving home to study' },
        { value: 'nothing', label: 'Nothing right now' },
      ],
    },
    {
      id: 'find-out',
      kind: 'text',
      prompt: 'One thing you want to find out this year about your future.',
      help: 'Optional.',
      placeholder: 'e.g. Which exam do I need for the Navy, and when is it?',
      maxLength: 200,
      optional: true,
    },
  ],
  reflect(answers) {
    const a = reader(LOOKING_FORWARD, answers)
    const stream = a.raw('stream')
    const worries = a.multi('worries').filter((worry) => worry !== 'Nothing right now')
    const route = a.raw('route')
    return [
      stream === 'unsure'
        ? 'I haven’t chosen a stream yet.'
        : a.choice('stream')
          ? `For Class 11–12 I’m thinking about ${a.choice('stream')}${a.scale('sure') ? `, and I feel ${a.scale('sure')} about it` : ''}.`
          : '',
      a.choice('helper') ? (a.raw('helper') === 'nobody' ? 'No one is helping me decide yet.' : `${a.choice('helper')} help${a.raw('helper') === 'teacher' ? 's' : ''} me most with this decision.`) : '',
      a.text('work') ? `One day I’d like to do this work: ${lower(sentence(a.text('work')))}` : '',
      route === 'know' ? 'I know the course or exam that leads there.' : route === 'little' ? 'I know a little about how to get there.' : route === 'none' ? 'I don’t know yet how to get there.' : '',
      worries.length ? `What worries me: ${list(worries.map(lower))}.` : '',
      a.text('find-out') ? `This year I want to find out: ${lower(sentence(a.text('find-out')))}` : '',
      route === 'none' || route === 'little' ? 'Next step: look up the route in Explore careers, and ask my teacher.' : '',
    ]
      .filter(Boolean)
      .join(' ')
  },
}

const GOAL_ACADEMIC: SurveyDefinition = {
  id: 'goal-academic',
  title: 'Goal Setting — Academic',
  emoji: '🎯',
  intro: 'One study goal for this term that you can check, and how you will work towards it.',
  minutes: 3,
  topics: ['Subject', 'Goal', 'Plan', 'Deadline'],
  privacy: PRIVACY,
  questions: [
    {
      id: 'subject',
      kind: 'choice',
      prompt: 'Which subject do you most want to improve this term?',
      options: [
        { value: 'maths', label: 'Maths' },
        { value: 'science', label: 'Science' },
        { value: 'english', label: 'English' },
        { value: 'hindi', label: 'Hindi' },
        { value: 'social', label: 'Social Science' },
        { value: 'other', label: 'Another subject' },
      ],
    },
    {
      id: 'now',
      kind: 'choice',
      prompt: 'How is that subject going for you right now?',
      options: [
        { value: 'hard', label: 'I find it very hard' },
        { value: 'bit-hard', label: 'It’s a bit hard' },
        { value: 'okay', label: 'I’m doing okay' },
        { value: 'well', label: 'I’m doing well and want to do better' },
      ],
    },
    {
      id: 'goal',
      kind: 'text',
      prompt: 'What is your goal? Make it something you can check.',
      help: 'A good goal says what and how much.',
      placeholder: 'e.g. Score 70% in the next Maths test',
      maxLength: 150,
    },
    {
      id: 'how',
      kind: 'multi',
      prompt: 'How will you work towards it?',
      help: 'Choose up to 3.',
      max: 3,
      options: [
        { value: 'daily', label: 'Practise for 20 minutes every day' },
        { value: 'ask', label: 'Ask my teacher when I’m stuck' },
        { value: 'friend', label: 'Study with a friend' },
        { value: 'papers', label: 'Solve previous years’ papers' },
        { value: 'notes', label: 'Make short notes' },
        { value: 'videos', label: 'Watch lessons online' },
      ],
    },
    {
      id: 'when',
      kind: 'choice',
      prompt: 'By when?',
      options: [
        { value: 'month', label: 'By the end of this month' },
        { value: 'midterm', label: 'Before the mid-term exam' },
        { value: 'term', label: 'By the end of the term' },
      ],
    },
    {
      id: 'confidence',
      kind: 'scale',
      prompt: 'How confident are you that you will reach it?',
      low: 'Not at all',
      high: 'Very',
      words: ['not confident yet', 'a little unsure', 'okay', 'confident', 'very confident'],
    },
  ],
  reflect(answers) {
    const a = reader(GOAL_ACADEMIC, answers)
    const subject = a.choice('subject')
    const goal = a.text('goal')
    const how = a.multi('how')
    return [
      goal ? `My goal${subject && subject !== 'Another subject' ? ` in ${subject}` : ''}: ${lower(sentence(goal)).replace(/\.$/, '')}${a.choice('when') ? `, ${lower(a.choice('when'))}` : ''}.` : '',
      a.choice('now') ? `Right now: ${lower(a.choice('now'))}.` : '',
      how.length ? `To get there I will ${list(how.map(lower))}.` : '',
      a.scale('confidence') ? `I feel ${a.scale('confidence')} that I can do it.` : '',
    ]
      .filter(Boolean)
      .join(' ')
  },
}

const GOAL_NON_ACADEMIC: SurveyDefinition = {
  id: 'goal-non-academic',
  title: 'Goal Setting — Non-academic',
  emoji: '🏅',
  intro: 'One goal outside your subjects — a sport, an art, a skill or something for your health or community.',
  minutes: 2,
  topics: ['Area', 'Goal', 'Practice', 'Support'],
  privacy: PRIVACY,
  questions: [
    {
      id: 'area',
      kind: 'choice',
      prompt: 'Which area is your goal in?',
      options: [
        { value: 'sport', label: 'A sport' },
        { value: 'music-dance', label: 'Music or dance' },
        { value: 'art', label: 'Art or craft' },
        { value: 'skill', label: 'A new skill, like cooking or coding' },
        { value: 'health', label: 'Health and fitness' },
        { value: 'community', label: 'Helping at home or in my community' },
      ],
    },
    {
      id: 'goal',
      kind: 'text',
      prompt: 'What is your goal?',
      help: 'Make it something you could show someone.',
      placeholder: 'e.g. Run 2 km without stopping',
      maxLength: 150,
    },
    {
      id: 'often',
      kind: 'choice',
      prompt: 'How often will you practise?',
      options: [
        { value: 'daily', label: 'Every day' },
        { value: 'few', label: 'A few times a week' },
        { value: 'weekly', label: 'Once a week' },
      ],
    },
    {
      id: 'support',
      kind: 'choice',
      prompt: 'Who can help you with it?',
      options: [
        { value: 'coach', label: 'A coach or teacher' },
        { value: 'family', label: 'My family' },
        { value: 'friends', label: 'Friends' },
        { value: 'alone', label: 'I’ll do it on my own' },
      ],
    },
    {
      id: 'excited',
      kind: 'scale',
      prompt: 'How excited are you about this goal?',
      low: 'Not much',
      high: 'Very',
      words: ['not very excited yet', 'a little excited', 'quite excited', 'excited', 'really excited'],
    },
  ],
  reflect(answers) {
    const a = reader(GOAL_NON_ACADEMIC, answers)
    const support = a.raw('support')
    return [
      a.text('goal') ? `My goal${a.choice('area') ? ` (${lower(a.choice('area'))})` : ''}: ${lower(sentence(a.text('goal')))}` : '',
      a.choice('often') ? `I will practise ${lower(a.choice('often'))}.` : '',
      support === 'alone' ? 'I’ll work on it on my own.' : a.choice('support') ? `${a.choice('support')} can help me.` : '',
      a.scale('excited') ? `I’m ${a.scale('excited')} about it.` : '',
    ]
      .filter(Boolean)
      .join(' ')
  },
}

export const SURVEYS: SurveyDefinition[] = [GOAL_ACADEMIC, GOAL_NON_ACADEMIC, LOOKING_FORWARD, SKILLS]

export const surveyById = (id: string) => SURVEYS.find((survey) => survey.id === id)

/** Why the answers can't be saved, or null if they can. */
export function invalidSurveyAnswers(survey: SurveyDefinition, answers: unknown): string | null {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return 'answers must be an object'
  const given = answers as Record<string, unknown>
  for (const key of Object.keys(given)) {
    if (!survey.questions.some((question) => question.id === key)) return `unknown question ${key}`
  }
  for (const question of survey.questions) {
    const value = given[question.id]
    const empty = value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
    if (empty) {
      if (question.kind === 'text' && question.optional) continue
      return `${question.id} is not answered`
    }
    if (value === UNCLEAR && question.kind !== 'text') continue
    switch (question.kind) {
      case 'choice':
        if (!question.options.some((choice) => choice.value === value)) return `${question.id}: not one of the options`
        break
      case 'multi':
        if (!Array.isArray(value) || value.length > question.max || new Set(value).size !== value.length) return `${question.id}: choose up to ${question.max}`
        if (!value.every((item) => question.options.some((choice) => choice.value === item))) return `${question.id}: not one of the options`
        break
      case 'scale':
        if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 5) return `${question.id}: must be 1–5`
        break
      case 'text':
        if (typeof value !== 'string' || value.trim().length > question.maxLength) return `${question.id}: up to ${question.maxLength} characters`
        break
    }
  }
  return null
}
