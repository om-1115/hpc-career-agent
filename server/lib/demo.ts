/**
 * The demo school: one teacher and five students, three of whom have taken the
 * test, and Rohan with a passbook going back to Class 9. Seeding resets the
 * students' career data, so the demo always starts the same way.
 *
 * The passwords are public (password sign-in is off in the app for now). Never
 * seed these on a deployment that holds real students' data.
 */

import { ALL_ITEMS, type Answers, type RiasecType } from '../../shared/test.ts'
import { scoreTest } from '../../shared/scoring.ts'
import { surveyById } from '../../shared/surveys.ts'
import type { Store } from './store.ts'

export const DEMO_TEACHER_PASSWORD = 'teacher-demo'
export const DEMO_STUDENT_PASSWORD = 'student-demo'

const students: { code: string; name: string; likes?: RiasecType[] }[] = [
  { code: 'S001', name: 'Asha Kumari' },
  { code: 'S002', name: 'Rohan Verma', likes: ['I', 'R'] },
  { code: 'S003', name: 'Priya Nair', likes: ['S', 'A'] },
  { code: 'S004', name: 'Imran Khan', likes: ['E', 'C'] },
  { code: 'S005', name: 'Kavya Reddy' },
]

/** Plausible answers: strong on the liked types, middling elsewhere, varied personality. */
function answersFor(likes: RiasecType[], seed: number): Answers {
  const answers: Answers = {}
  ALL_ITEMS.forEach((item, index) => {
    const wobble = (index * 7 + seed) % 3
    if (item.section === 'interest') {
      answers[item.id] = likes.includes(item.type) ? 4 + (wobble % 2) : 1 + wobble
    } else {
      answers[item.id] = 2 + wobble
    }
  })
  return answers
}

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

/** Seed the demo school into `store`; returns the student codes. */
export async function seedDemo(store: Store): Promise<string[]> {
  await store.upsert({ role: 'teacher', code: 'T001', name: 'Meera Sharma', classLine: 'Class 10 · A' }, DEMO_TEACHER_PASSWORD)

  for (const [index, { code, name, likes }] of students.entries()) {
    await store.upsert({ role: 'student', code, name, classLine: 'Class 10 · A' }, DEMO_STUDENT_PASSWORD)
    await store.resetCareerData(code)
    // Three students have finished, so the teacher's view has something to show.
    // Rohan's results are dated, below.
    if (likes && code !== 'S002') await store.saveResult(code, scoreTest(answersFor(likes, index)))
  }

  // Rohan's passbook shows a journey: a test in Class 9, reflections, a plan,
  // and this year's test, where his interests have grown towards Investigative.
  await store.saveResult('S002', scoreTest(answersFor(['R'], 1), daysAgo(380)))
  await store.addReflection('S002', 'Fixing my uncle’s motorbike was the best part of the holidays. I like seeing a machine work again.', daysAgo(370))
  await store.addReflection('S002', 'Science fair: I liked figuring out why the circuit failed even more than building it.', daysAgo(120))
  await store.saveResult('S002', scoreTest(answersFor(['I', 'R'], 1), daysAgo(14)))
  await store.savePlan('S002', {
    summary: 'Take Science (PCM) in Class 11 and explore electrical and civil engineering.',
    careerIds: ['civil-engineer', 'electrician'],
    nextSteps: ['Talk to an electrician about their work', 'Ask my teacher about PCM', 'Visit the polytechnic open day'],
    savedAt: daysAgo(7),
  })

  // And this term's academic goal, set through the Goal Setting survey.
  const goalAnswers = { subject: 'maths', now: 'bit-hard', goal: 'Score 75% in the mid-term Maths exam', how: ['daily', 'papers', 'ask'], when: 'midterm', confidence: 4 }
  await store.saveSurvey('S002', 'goal-academic', { answers: goalAnswers, completedAt: daysAgo(5) })
  await store.addReflection('S002', surveyById('goal-academic')!.reflect(goalAnswers), daysAgo(5), 'Goal Setting — Academic')

  return students.map((student) => student.code)
}
