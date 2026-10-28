/**
 * Live HPC demo content (Figma "Student · My Record"). Projects and
 * competencies aren't recorded by the app yet, so every student sees this
 * same sample term; About me and What I said come from the student's own data.
 */

export type Level = 'Beginning' | 'Developing' | 'Proficient' | 'Advanced'

export const LEVELS: Level[] = ['Beginning', 'Developing', 'Proficient', 'Advanced']

export type Competency = {
  id: string
  name: string
  level: Level
  /** What this level looks like for the student, in their words. */
  now: string
  /** Step reached in each term, 1–4, oldest first. */
  history: { term: string; step: number }[]
  trend: string
  sources: { title: string; who: string; date: string }[]
}

export const TERM = 'Term 1 · 2026–27'

export const competencies: Competency[] = [
  {
    id: 'collaboration',
    name: 'Collaboration',
    level: 'Proficient',
    now: 'You share your ideas and listen to others in your group.',
    history: [
      { term: 'T1 Gr 8', step: 2 },
      { term: 'T2 Gr 8', step: 2.5 },
      { term: 'T1 Gr 9', step: 3 },
    ],
    trend: 'Steady growth since last year.',
    sources: [
      { title: 'Stage 2 evaluation', who: 'Teacher', date: '4 Sep' },
      { title: 'Group feedback', who: 'Peers · anonymous', date: '5 Sep' },
      { title: 'What you said', who: 'Self', date: '5 Sep' },
    ],
  },
  {
    id: 'critical-thinking',
    name: 'Critical thinking',
    level: 'Developing',
    now: 'You ask good questions; next, check your answers against evidence.',
    history: [
      { term: 'T1 Gr 8', step: 1.5 },
      { term: 'T2 Gr 8', step: 2 },
      { term: 'T1 Gr 9', step: 2 },
    ],
    trend: 'Holding steady this term.',
    sources: [
      { title: 'Stage 2 evaluation', who: 'Teacher', date: '4 Sep' },
      { title: 'What you said', who: 'Self', date: '5 Sep' },
    ],
  },
  {
    id: 'communication',
    name: 'Communication',
    level: 'Proficient',
    now: 'You explain your work clearly, out loud and in writing.',
    history: [
      { term: 'T1 Gr 8', step: 2 },
      { term: 'T2 Gr 8', step: 3 },
      { term: 'T1 Gr 9', step: 3 },
    ],
    trend: 'A big step up last year, kept this term.',
    sources: [
      { title: 'Project presentation', who: 'Teacher', date: '2 Sep' },
      { title: 'Group feedback', who: 'Peers · anonymous', date: '5 Sep' },
    ],
  },
  {
    id: 'creativity',
    name: 'Creativity',
    level: 'Developing',
    now: 'You try new ideas; next, try more than one before choosing.',
    history: [
      { term: 'T1 Gr 8', step: 1 },
      { term: 'T2 Gr 8', step: 1.5 },
      { term: 'T1 Gr 9', step: 2 },
    ],
    trend: 'Growing every term.',
    sources: [
      { title: 'Stage 1 evaluation', who: 'Teacher', date: '12 Aug' },
      { title: 'What you said', who: 'Self', date: '5 Sep' },
    ],
  },
]

export const project = { title: 'Saving water at school', stage: 2, stages: 3, role: 'Recorder', group: 'Group 3 · 4 students' }

export const attendance = '94% this term'
