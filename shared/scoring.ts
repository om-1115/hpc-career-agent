/**
 * Scoring for the psychometric test. Pure functions, shared by the server (which is
 * the only place a result is computed and stored) and the tests.
 *
 * There are no population norms behind any of this. Interest scores are the
 * share of the maximum a student gave each type; personality levels are cut at
 * fixed points on the 1–5 average. Both say "more" or "less" for THIS student,
 * not how they compare with others.
 */

import { CAREERS, type Career } from './careers.ts'
import {
  ALL_ITEMS,
  INTEREST_ITEMS,
  PERSONALITY_ITEMS,
  type Answers,
  type RiasecType,
} from './test.ts'

export const RIASEC_ORDER: RiasecType[] = ['R', 'I', 'A', 'S', 'E', 'C']

/** Personality as the report talks about it: N is shown the kind way round, as calmness. */
export type TraitKey = 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'calmness'
export type Band = 'low' | 'moderate' | 'high'

export type CareerMatch = { id: string; fit: number }

export type TestResult = {
  version: 1
  /** 0–100 per type: how much of the possible "really like" the student gave it. */
  interests: Record<RiasecType, number>
  /** The three strongest types, strongest first. */
  code: RiasecType[]
  /** Interests are spread evenly — no type stands out. */
  broad: boolean
  personality: Record<TraitKey, { score: number; band: Band }>
  matches: CareerMatch[]
  /** Every answer was the same, so the result says little. */
  sameAnswerThroughout: boolean
  completedAt: string
}

/** Why a set of answers cannot be scored, or null if it can. */
export function invalidAnswers(answers: unknown): string | null {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return 'answers must be an object'
  const given = answers as Record<string, unknown>
  const ids = new Set(ALL_ITEMS.map((item) => item.id))
  for (const key of Object.keys(given)) if (!ids.has(key)) return `unknown item ${key}`
  for (const item of ALL_ITEMS) {
    const value = given[item.id]
    if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 5) {
      return `item ${item.id} needs an answer from 1 to 5`
    }
  }
  return null
}

const round = (value: number, places = 0) => Math.round(value * 10 ** places) / 10 ** places

function band(score: number): Band {
  if (score <= 2.4) return 'low'
  if (score >= 3.6) return 'high'
  return 'moderate'
}

/** Weighted fit of a career's code against the student's interest scores, 0–100. */
export function careerFit(career: Career, interests: Record<RiasecType, number>): number {
  const weights = [3, 2, 1]
  const total = career.code.reduce((sum, type, index) => sum + weights[index] * interests[type], 0)
  return round(total / 6)
}

export function scoreTest(answers: Answers, completedAt = new Date().toISOString()): TestResult {
  const problem = invalidAnswers(answers)
  if (problem) throw new Error(problem)

  const interests = {} as Record<RiasecType, number>
  for (const type of RIASEC_ORDER) {
    const items = INTEREST_ITEMS.filter((item) => item.type === type)
    const sum = items.reduce((total, item) => total + answers[item.id], 0)
    // 1 per item is "really dislike", 5 is "really like": map that span onto 0–100.
    interests[type] = round(((sum - items.length) / (items.length * 4)) * 100)
  }

  // Ties keep RIASEC order, so the same answers always give the same code.
  const ranked = [...RIASEC_ORDER].sort((a, b) => interests[b] - interests[a])
  const broad = interests[ranked[0]] - interests[ranked[5]] < 15

  const traitMean = (trait: 'O' | 'C' | 'E' | 'A' | 'N') => {
    const items = PERSONALITY_ITEMS.filter((item) => item.trait === trait)
    const keyed = items.map((item) => (item.key === 1 ? answers[item.id] : 6 - answers[item.id]))
    return keyed.reduce((total, value) => total + value, 0) / items.length
  }
  const trait = (score: number) => ({ score: round(score, 1), band: band(score) })

  const matches = CAREERS.map((career) => ({ id: career.id, fit: careerFit(career, interests) }))
    .sort((a, b) => b.fit - a.fit)
    .slice(0, 6)

  const values = ALL_ITEMS.map((item) => answers[item.id])

  return {
    version: 1,
    interests,
    code: ranked.slice(0, 3),
    broad,
    personality: {
      openness: trait(traitMean('O')),
      conscientiousness: trait(traitMean('C')),
      extraversion: trait(traitMean('E')),
      agreeableness: trait(traitMean('A')),
      calmness: trait(6 - traitMean('N')),
    },
    matches,
    sameAnswerThroughout: values.every((value) => value === values[0]),
    completedAt,
  }
}
