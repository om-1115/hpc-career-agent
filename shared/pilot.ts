/**
 * What a pilot measured, from the before and after questions (PILOT_SURVEYS)
 * and the psychometric test results. Used by the public /api/impact page and
 * by `npm run pilot:report`.
 *
 * A student counts in the comparison ("paired") only if they answered the
 * before questions, then finished the test, then answered the after questions,
 * in that order. Nothing beyond the counts is shown until at least
 * MIN_GROUP students are paired, so no one can be picked out of a small group.
 */

import { UNCLEAR } from './surveys.ts'

export const MIN_GROUP = 5

type Response = { answers: Record<string, unknown>; completedAt: string }

export type PilotInput = {
  /** How many student accounts there are. */
  students: number
  /** Each student's survey responses, by survey id. */
  surveys: Record<string, Record<string, Response>>
  /** When each student finished the psychometric test, every time they did. */
  tests: Record<string, string[]>
}

export type BeforeAfter = { before: number; after: number }

export type Impact = {
  students: number
  answeredBefore: number
  finishedTest: number
  answeredAfter: number
  paired: number
  minimum: number
  /** Only when `paired` reaches `minimum`. */
  results: null | {
    /** Share (%) who said, before, that someone at school had talked with them about careers this year. */
    hadGuidance: number
    /** Median number of different careers a student could write down. */
    careersNamed: BeforeAfter
    /** Share (%) who say they know the steps to the work they want. */
    knowsRoute: BeforeAfter
    /** Average of 1 (not sure) to 5 (very sure) about their Class 11 stream. */
    streamSure: BeforeAfter
    /** Average of 1 (not at all) to 5 (very well): how well the report describes them. */
    reportFit: number
    /** Share (%) who said the report describes them mostly or very well. */
    reportFitsWell: number
    /** Share (%) who will show or talk about the report at home (yes or maybe). */
    talkAtHome: number
    /** How many times "I don't understand this question" was tapped, by question. */
    unclear: Record<string, number>
  }
}

/** Different careers in what a student wrote: split on commas, new lines and "and"; repeats count once. */
export function countCareers(text: unknown): number {
  if (typeof text !== 'string') return 0
  const items = text
    .split(/[,;\n/|]+|\s+(?:and|or|aur|ya)\s+|\.\s+/i)
    .map((item) => item.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, '').trim().toLowerCase())
    .filter((item) => item.length >= 2 && /\p{L}/u.test(item))
  return new Set(items).size
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
const average = (values: number[]) => (values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : 0)
const percent = (count: number, of: number) => (of ? Math.round((count / of) * 100) : 0)
const scale = (value: unknown) => (Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 5 ? (value as number) : null)

export function pilotImpact({ students, surveys, tests }: PilotInput): Impact {
  const codes = Object.keys(surveys)
  const before = codes.filter((code) => surveys[code]['pilot-before'])
  const after = codes.filter((code) => surveys[code]['pilot-after'])
  const finishedTest = Object.values(tests).filter((times) => times.length > 0).length

  const paired = before.filter((code) => {
    const start = surveys[code]['pilot-before']?.completedAt
    const end = surveys[code]['pilot-after']?.completedAt
    return start && end && (tests[code] ?? []).some((at) => at >= start && at <= end)
  })

  const counts = { students, answeredBefore: before.length, finishedTest, answeredAfter: after.length, paired: paired.length, minimum: MIN_GROUP }
  if (paired.length < MIN_GROUP) return { ...counts, results: null }

  const pairs = paired.map((code) => ({ before: surveys[code]['pilot-before'].answers, after: surveys[code]['pilot-after'].answers }))
  const both = (pick: (answers: Record<string, unknown>) => number | null) =>
    pairs.map((pair) => [pick(pair.before), pick(pair.after)] as const).filter((pair): pair is readonly [number, number] => pair[0] !== null && pair[1] !== null)

  const named = both((answers) => countCareers(answers.careers))
  const sure = both((answers) => scale(answers.stream))
  const afters = pairs.map((pair) => pair.after)
  const fits = afters.map((answers) => scale(answers.fit)).filter((value): value is number => value !== null)
  const home = afters.filter((answers) => answers.home !== undefined && answers.home !== UNCLEAR)

  const unclear: Record<string, number> = {}
  for (const code of paired) {
    for (const [surveyId, response] of Object.entries(surveys[code])) {
      if (!surveyId.startsWith('pilot-')) continue
      for (const [question, value] of Object.entries(response.answers)) {
        if (value === UNCLEAR) unclear[`${surveyId}:${question}`] = (unclear[`${surveyId}:${question}`] ?? 0) + 1
      }
    }
  }

  return {
    ...counts,
    results: {
      hadGuidance: percent(pairs.filter((pair) => pair.before.guided === 'yes').length, pairs.length),
      careersNamed: { before: median(named.map((pair) => pair[0])), after: median(named.map((pair) => pair[1])) },
      knowsRoute: {
        before: percent(pairs.filter((pair) => pair.before.route === 'yes').length, pairs.length),
        after: percent(pairs.filter((pair) => pair.after.route === 'yes').length, pairs.length),
      },
      streamSure: { before: average(sure.map((pair) => pair[0])), after: average(sure.map((pair) => pair[1])) },
      reportFit: average(fits),
      reportFitsWell: percent(fits.filter((value) => value >= 4).length, fits.length),
      talkAtHome: percent(home.filter((answers) => answers.home === 'yes' || answers.home === 'maybe').length, home.length),
      unclear,
    },
  }
}
