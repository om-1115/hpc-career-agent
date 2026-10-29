/**
 * The pilot's results as Markdown, ready for the submission's impact field.
 *
 *   ENV_FILE=.env.pilot.local npm run pilot:report
 *
 * The same numbers as the public /impact page (shared/pilot.ts), plus what
 * only the team should read first: the words students found confusing. Check
 * those for names before sharing anything.
 */

import { pilotImpact } from '../../shared/pilot.ts'
import { surveyById } from '../../shared/surveys.ts'
import { pilotStore, whereData } from './pilotEnv.ts'

const data = await pilotStore().snapshot()
const students = data.accounts.filter((account) => account.role === 'student')
const tests = Object.fromEntries(
  students.map(({ code }) => {
    const times = (data.resultHistory?.[code] ?? []).map((result) => result.completedAt)
    const current = data.results[code]?.completedAt
    return [code, current && !times.includes(current) ? [...times, current] : times]
  }),
)
const impact = pilotImpact({ students: students.length, surveys: data.surveys ?? {}, tests })

const lines = [
  `# HPC Career pilot — results`,
  '',
  `From ${whereData()}, ${new Date().toISOString().slice(0, 10)}.`,
  '',
  `- Students with accounts: ${impact.students}`,
  `- Answered the before questions: ${impact.answeredBefore}`,
  `- Finished the psychometric test: ${impact.finishedTest}`,
  `- Answered the after questions: ${impact.answeredAfter}`,
  `- Paired (before → test → after, in that order): ${impact.paired}`,
  '',
]

if (!impact.results) {
  lines.push(`Fewer than ${impact.minimum} paired students, so there is nothing to compare yet — and too few to publish.`)
} else {
  const r = impact.results
  const question = (key: string) => {
    const [surveyId, id] = key.split(':')
    const survey = surveyById(surveyId)
    return `${survey?.title ?? surveyId}: “${survey?.questions.find((q) => q.id === id)?.prompt ?? id}”`
  }
  lines.push(
    `${r.hadGuidance}% said someone at school had talked with them about careers this year.`,
    '',
    `| Measure (${impact.paired} students, each compared with themselves) | Before | After |`,
    '| --- | --- | --- |',
    `| Careers they could write down (median) | ${r.careersNamed.before} | ${r.careersNamed.after} |`,
    `| Say they know the steps to the work they want | ${r.knowsRoute.before}% | ${r.knowsRoute.after}% |`,
    `| How sure about their Class 11 stream (1–5, average) | ${r.streamSure.before} | ${r.streamSure.after} |`,
    '',
    `- How well the report describes them (1–5, average): ${r.reportFit}; mostly or very well: ${r.reportFitsWell}%`,
    `- Will show or talk about the report at home (yes or maybe): ${r.talkAtHome}%`,
    '',
    'Self-reported, one group, no comparison group, measured on the same day.',
    '',
    '## “I don’t understand this question”',
    '',
    ...(Object.keys(r.unclear).length
      ? Object.entries(r.unclear)
          .sort((a, b) => b[1] - a[1])
          .map(([key, count]) => `- ${question(key)} — ${count}`)
      : ['- Not tapped once.']),
  )
}

// Team only: what students wrote as confusing, most common first.
const confusing = new Map<string, number>()
for (const responses of Object.values(data.surveys ?? {})) {
  const text = responses['pilot-after']?.answers.confusing
  if (typeof text !== 'string') continue
  for (const word of text.split(/[,;\n]+/).map((item) => item.trim().toLowerCase()).filter(Boolean)) {
    confusing.set(word, (confusing.get(word) ?? 0) + 1)
  }
}
lines.push(
  '',
  '## Confusing words and parts (team only — check for names before sharing)',
  '',
  ...(confusing.size ? [...confusing].sort((a, b) => b[1] - a[1]).map(([word, count]) => `- ${word} — ${count}`) : ['- None written.']),
)

console.log(lines.join('\n'))
