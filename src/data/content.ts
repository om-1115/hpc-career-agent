import type { Survey } from '../components/SurveyRow'
import type { ClassOverview } from '../components/ClassOverviewCard'

/** Figma node 1:1444 — "home screen -Teacher" */
export const teacherSurveys: Survey[] = [
  {
    id: 'health',
    emoji: '🩺',
    title: 'Health & Wellbeing',
    description: 'Your daily health, sleep and energy.',
    badge: { label: 'Student', tone: 'indigo' },
  },
  {
    id: 'goal-academic',
    emoji: '🎯',
    title: 'Goal Setting — Academic',
    description: 'Your subject goals and study plan.',
    badge: { label: 'Teacher', tone: 'solid' },
  },
  {
    id: 'goal-non-academic',
    emoji: '🏅',
    title: 'Goal Setting — Non-academic',
    description: 'Your sport and activity goals.',
    badge: { label: 'Teacher', tone: 'solid' },
  },
  {
    id: 'looking-forward',
    emoji: '🧭',
    title: 'Looking Forward',
    description: 'Your plans after this year.',
    badge: { label: 'Teacher', tone: 'solid' },
  },
  {
    id: 'skills',
    image: '/assets/skills.png',
    title: 'Skills',
    description: 'Your everyday and digital skills.',
    badge: { label: 'Student', tone: 'indigo' },
  },
]

/** Figma node 1:1518 — "home screen -Student" */
export const studentSurveys: Survey[] = [
  {
    id: 'health',
    emoji: '🩺',
    title: 'Health & Wellbeing',
    description: 'Your daily health, sleep and energy.',
    badge: { label: 'Completed', tone: 'green' },
  },
  {
    id: 'goal-academic',
    emoji: '🎯',
    title: 'Goal Setting — Academic',
    description: 'Your subject goals and study plan.',
    badge: { label: 'Completed', tone: 'green' },
  },
  {
    id: 'goal-non-academic',
    emoji: '🏅',
    title: 'Goal Setting — Non-academic',
    description: 'Your sport and activity goals.',
    badge: { label: 'Pending', tone: 'orange' },
  },
  {
    id: 'looking-forward',
    emoji: '🧭',
    title: 'Looking Forward',
    description: 'Your plans after this year.',
    badge: { label: 'Not live', tone: 'neutral' },
  },
  {
    id: 'skills',
    image: '/assets/skills.png',
    title: 'Skills',
    description: 'Your everyday and digital skills.',
    badge: { label: 'Not live', tone: 'neutral' },
  },
]

export const selectedClasses: ClassOverview[] = [
  { id: 'class-1', avatar: '/assets/class-avatar-1.svg' },
  { id: 'class-2', avatar: '/assets/class-avatar-2.svg' },
  { id: 'class-3', avatar: '/assets/class-avatar-3.svg' },
].map((base) => ({
  ...base,
  name: 'Class 9 - B',
  studentCount: 32,
  stats: [
    { label: 'Student Well-Being', value: 'Good', tone: 'success' as const },
    { label: 'Attendance', value: '95%', tone: 'success' as const },
    { label: 'Class Performance', value: 'Medium', tone: 'warning' as const },
  ],
}))
