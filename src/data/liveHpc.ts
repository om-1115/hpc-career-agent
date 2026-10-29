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
  /** This term's step, 1–4, as the student, their group and their teacher each rated it. */
  views: { self: number; peers: number; teacher: number }
  /** Small things to try this month to grow it. */
  tips: string[]
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
    views: { self: 3, peers: 3, teacher: 3 },
    tips: [
      'Ask the quietest person in your group what they think',
      'Share one idea in the next group meeting, then build on someone else’s',
      'Thank a group member for something specific they did',
    ],
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
    views: { self: 3, peers: 2, teacher: 2 },
    tips: [
      'Before you answer, write down one piece of evidence for it',
      'Ask “how do we know?” once in every science class',
      'Check one answer in your notebook against the textbook',
    ],
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
    views: { self: 2, peers: 3, teacher: 3 },
    tips: [
      'Explain today’s lesson to someone at home in two minutes',
      'Read your written answer aloud before you hand it in',
      'Present your group’s findings at the next review',
    ],
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
    views: { self: 2, peers: 3, teacher: 2 },
    tips: [
      'Sketch two different ideas before choosing one',
      'Try a new way to show your project data — a chart, a poster or a model',
      'Spend 10 minutes a week drawing, writing or building anything you like',
    ],
    sources: [
      { title: 'Stage 1 evaluation', who: 'Teacher', date: '12 Aug' },
      { title: 'What you said', who: 'Self', date: '5 Sep' },
    ],
  },
]

/** Reflection starters for students who don't know what to write. */
export const reflectionPrompts = [
  'This week I learnt…',
  'Something I found hard was…',
  'I felt proud when…',
  'Next time I will…',
]

export const project = {
  title: 'Saving water at school',
  stage: 2,
  stages: 3,
  role: 'Recorder',
  group: 'Group 3 · 4 students',
  question: 'How much water does our school waste each day, and how could we save it?',
  steps: [
    { name: 'Plan', detail: 'Chose the question and split the work', date: '12 Aug', state: 'done' as const },
    { name: 'Collect data', detail: 'Measure taps and tanks for two weeks', date: 'Due 15 Nov', state: 'now' as const },
    { name: 'Present', detail: 'Share findings with the class and the principal', date: 'Due 6 Dec', state: 'next' as const },
  ],
  /** Hours each member has put in so far. */
  contributions: [
    { name: 'You', hours: 9 },
    { name: 'Ananya', hours: 11 },
    { name: 'Kabir', hours: 7 },
    { name: 'Zoya', hours: 8 },
  ],
  tasks: [
    { id: 'tap-log', text: 'Record the tap readings for this week', done: true },
    { id: 'tank', text: 'Measure the water tank level on Monday and Friday', done: false },
    { id: 'table', text: 'Put the readings into one table for the group', done: false },
    { id: 'ask-caretaker', text: 'Ask the caretaker when the tank is filled', done: false },
  ],
}

/** Days present out of school days, by month this term. */
export const attendanceByMonth = [
  { month: 'Jun', present: 22, days: 23 },
  { month: 'Jul', present: 23, days: 26 },
  { month: 'Aug', present: 23, days: 24 },
  { month: 'Sep', present: 22, days: 25 },
  { month: 'Oct', present: 21, days: 21 },
]

export const daysPresent = attendanceByMonth.reduce((sum, month) => sum + month.present, 0)
export const schoolDays = attendanceByMonth.reduce((sum, month) => sum + month.days, 0)
export const attendance = `${Math.round((daysPresent / schoolDays) * 100)}% this term (${daysPresent} of ${schoolDays} days)`

/** The minimum attendance most boards ask for. */
export const ATTENDANCE_NEEDED = 75

/** Hours this term outside lessons. */
export const activities = [
  { name: 'Football practice', hours: 24 },
  { name: 'Science club', hours: 12 },
  { name: 'School library', hours: 8 },
  { name: 'Cleanliness drive', hours: 6 },
]
