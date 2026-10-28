/**
 * The words of the career report. Written for this project; strength-based by
 * design — every level of every trait is described as a way of being that
 * suits some work, never as a weakness.
 */

import type { RiasecType } from './test.ts'
import type { Band, TestResult, TraitKey } from './scoring.ts'

export const TYPE_COPY: Record<RiasecType, { short: string; enjoys: string }> = {
  R: { short: 'Doer', enjoys: 'working with your hands, tools, machines, plants or animals, and seeing a real result' },
  I: { short: 'Thinker', enjoys: 'asking why, investigating, experimenting and solving problems with ideas' },
  A: { short: 'Creator', enjoys: 'expressing ideas through art, words, music, design or performance' },
  S: { short: 'Helper', enjoys: 'teaching, caring for and working with people to make their lives better' },
  E: { short: 'Persuader', enjoys: 'leading, convincing people and turning ideas into plans and businesses' },
  C: { short: 'Organiser', enjoys: 'keeping things accurate, orderly and on track, with clear steps to follow' },
}

export const TRAIT_COPY: Record<TraitKey, { name: string; levels: Record<Band, string> }> = {
  openness: {
    name: 'Imagination',
    levels: {
      high: 'You enjoy new ideas and big questions, and you like trying things a different way.',
      moderate: 'You like some new ideas but also value what already works.',
      low: 'You prefer practical, proven ways of doing things over abstract ideas.',
    },
  },
  conscientiousness: {
    name: 'Organisation',
    levels: {
      high: 'You plan ahead, finish what you start and like things in order.',
      moderate: 'You can be organised when it matters, and flexible when it doesn’t.',
      low: 'You are flexible and go with the flow; a simple plan helps you finish big tasks.',
    },
  },
  extraversion: {
    name: 'Sociability',
    levels: {
      high: 'You get energy from people and enjoy being in the middle of things.',
      moderate: 'You enjoy people, and you also enjoy time to yourself.',
      low: 'You think before you speak and do your best work with focus and quiet.',
    },
  },
  agreeableness: {
    name: 'Kindness',
    levels: {
      high: 'You notice how others feel and like helping and cooperating.',
      moderate: 'You are caring, and you can also stand your ground.',
      low: 'You are direct and independent, and you say what you think.',
    },
  },
  calmness: {
    name: 'Calmness',
    levels: {
      high: 'You usually stay steady under pressure.',
      moderate: 'You handle most pressure well, with the odd off day like everyone.',
      low: 'You feel things strongly. Routines and people you trust help on hard days.',
    },
  },
}

/** What to do next, in order. */
export function nextSteps(result: TestResult): string[] {
  const steps: string[] = []
  if (result.sameAnswerThroughout) {
    steps.push('You gave the same answer to every question, so this report says very little. Take the test again when you have time.')
  }
  if (result.broad) {
    steps.push('Your interests are spread widely, which keeps many doors open. Try short activities in two or three areas to see what sticks.')
  }
  steps.push('Read about your top career matches and talk to someone who does one of those jobs.')
  steps.push('Share this report with your teacher or parents and discuss which subjects to choose next.')
  steps.push('Ask the counsellor in this app any question about streams, courses or exams.')
  return steps
}
