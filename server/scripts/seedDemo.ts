/**
 * Demo accounts, so anyone can try the app straight away.
 *
 *   npm run seed:demo
 *
 * The passwords below are PUBLIC (they are in the README). Never seed these on
 * a deployment that holds real students' data.
 */

import { existsSync } from 'node:fs'
import { ALL_ITEMS, INTEREST_ITEMS, type Answers, type RiasecType } from '../../shared/test.ts'
import { scoreTest } from '../../shared/scoring.ts'
import { Store } from '../lib/store.ts'

if (existsSync('.env.local')) process.loadEnvFile('.env.local')

export const DEMO_TEACHER_PASSWORD = 'teacher-demo'
export const DEMO_STUDENT_PASSWORD = 'student-demo'

const store = new Store(process.env.DATA_FILE || '.data/db.json')

store.upsert({ role: 'teacher', code: 'T001', name: 'Meera Sharma', classLine: 'Class 10 · A' }, DEMO_TEACHER_PASSWORD)

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

students.forEach(({ code, name, likes }, index) => {
  store.upsert({ role: 'student', code, name, classLine: 'Class 10 · A' }, DEMO_STUDENT_PASSWORD)
  // Three students have finished, so the teacher's view has something to show.
  if (likes) store.saveResult(code, scoreTest(answersFor(likes, index)))
  else store.clearResult(code)
})

console.log(
  `Seeded teacher T001 and students ${students.map((student) => student.code).join(', ')} ` +
    `(${INTEREST_ITEMS.length} interest items; passwords in the README).`,
)
