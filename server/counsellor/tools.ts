/**
 * The counsellor agent's five tools, as plain functions over the app's data.
 *
 * Framework-free on purpose: AgentFoundry's Claude Agent SDK kit (or any other
 * harness) wraps each one in a few lines and calls `runTool`. Everything here
 * runs and is tested without a model or an API key.
 *
 * The student is never a tool argument. The server passes the signed-in
 * student in `ToolContext`, taken from their verified session, so nothing the
 * model says can reach another student's data.
 *
 * Design: docs/counsellor-agent.md · build sheet: counsellor/AF_BUILD.md
 */

import { CAREERS, TYPE_NAMES, type Career } from '../../shared/careers.ts'
import { TRAIT_COPY, TYPE_COPY } from '../../shared/report.ts'
import { careerFit, RIASEC_ORDER, type TraitKey } from '../../shared/scoring.ts'
import type { RiasecType } from '../../shared/test.ts'
import type { AlertReason, Store } from '../lib/store.ts'

export type ToolContext = { store: Store; studentCode: string }

type ParamType = 'string' | 'number' | 'boolean'
export type ToolSpec = {
  name: ToolName
  description: string
  params: Record<string, { type: ParamType; description: string; required: boolean }>
}
export type ToolName = 'get_my_result' | 'search_careers' | 'get_career' | 'save_plan' | 'alert_teacher'

/**
 * Names, descriptions and parameters, as they go into AgentFoundry and any
 * harness. AF's parameter types are string / number / boolean, so lists are
 * comma- or newline-separated strings.
 */
export const TOOL_SPECS: ToolSpec[] = [
  {
    name: 'get_my_result',
    description:
      'Get the signed-in student’s career test result: interest code, interest scores, personality levels and best-matching careers. Returns completed=false if they have not taken the test. Call this before suggesting careers.',
    params: {},
  },
  {
    name: 'search_careers',
    description:
      'Search the app’s 36 careers. Filter by RIASEC letters (e.g. "IS") and/or a keyword. Returns id, title, code, summary and how well each fits this student.',
    params: {
      types: { type: 'string', description: 'RIASEC letters to filter by, e.g. "IS". Optional.', required: false },
      keyword: { type: 'string', description: 'A word to look for in the title or summary. Optional.', required: false },
      limit: { type: 'number', description: 'How many to return, 1–10. Default 5.', required: false },
    },
  },
  {
    name: 'get_career',
    description: 'Get one career’s summary and the route to it from Class 10 in India. The only source for routes you may quote.',
    params: { id: { type: 'string', description: 'A career id from search_careers or get_my_result.', required: true } },
  },
  {
    name: 'save_plan',
    description: 'Save the student’s career plan so their teacher can see it. Only call after the student has said yes to saving.',
    params: {
      summary: { type: 'string', description: 'The plan in one or two sentences, max 300 characters.', required: true },
      career_ids: { type: 'string', description: 'Up to 3 career ids, comma-separated.', required: true },
      next_steps: { type: 'string', description: 'Up to 5 next steps, one per line.', required: true },
    },
  },
  {
    name: 'alert_teacher',
    description:
      'Alert the student’s teacher about a wellbeing or safety concern. Use when a student shows distress or may be at risk, never for career questions.',
    params: {
      reason: { type: 'string', description: 'One of: distress, safety, other.', required: true },
      note: { type: 'string', description: 'What the teacher should know, max 200 characters. No quotes of sensitive detail.', required: true },
    },
  },
]

/** A tool's answer, or why it could not answer — returned to the model, never thrown. */
export type ToolOutput = Record<string, unknown> | { error: string }

const LEVEL = { low: 'lower', moderate: 'in the middle', high: 'higher' } as const
const careerById = (id: string) => CAREERS.find((career) => career.id === id)
const brief = (career: Career) => ({ id: career.id, title: career.title, code: career.code.join(''), summary: career.summary })

export async function getMyResult({ store, studentCode }: ToolContext): Promise<ToolOutput> {
  const result = await store.result(studentCode)
  if (!result) return { completed: false }
  return {
    completed: true,
    completed_at: result.completedAt,
    interest_code: result.code.join(''),
    interest_code_meaning: result.code.map((type) => `${type} = ${TYPE_NAMES[type]} (${TYPE_COPY[type].short}): enjoys ${TYPE_COPY[type].enjoys}`),
    interest_scores: Object.fromEntries(RIASEC_ORDER.map((type) => [TYPE_NAMES[type], result.interests[type]])),
    interests_spread_evenly: result.broad,
    same_answer_to_everything: result.sameAnswerThroughout,
    personality: Object.fromEntries(
      (Object.keys(TRAIT_COPY) as TraitKey[]).map((trait) => [
        TRAIT_COPY[trait].name,
        { level: LEVEL[result.personality[trait].band], meaning: TRAIT_COPY[trait].levels[result.personality[trait].band] },
      ]),
    ),
    best_matches: result.matches.map(({ id, fit }) => ({ id, title: careerById(id)?.title, fit })),
    note: 'Scores show more or less for this student, not a comparison with others. The test is a starting point, not a verdict.',
  }
}

export async function searchCareers({ store, studentCode }: ToolContext, args: { types?: string; keyword?: string; limit?: number }): Promise<ToolOutput> {
  const types = (args.types ?? '').toUpperCase().replace(/[^RIASEC]/g, '').split('') as RiasecType[]
  const keyword = (args.keyword ?? '').trim().toLowerCase()
  const limit = Math.max(1, Math.min(10, Math.round(args.limit ?? 5)))
  const result = await store.result(studentCode)

  let careers = CAREERS.filter((career) => types.every((type) => career.code.includes(type)))
  if (keyword) careers = careers.filter((career) => `${career.title} ${career.summary}`.toLowerCase().includes(keyword))
  // Best fit first for a student with a result; alphabetical otherwise.
  const ranked = careers
    .map((career) => ({ ...brief(career), fit: result ? careerFit(career, result.interests) : undefined }))
    .sort((a, b) => (result ? (b.fit ?? 0) - (a.fit ?? 0) : a.title.localeCompare(b.title)))

  return { count: ranked.length, careers: ranked.slice(0, limit), ...(ranked.length ? {} : { hint: 'No match. Try fewer letters or another word.' }) }
}

export function getCareer(_ctx: ToolContext, args: { id: string }): ToolOutput {
  const career = careerById(args.id)
  if (!career) return { error: `No career with id "${args.id}". Use search_careers to find ids.` }
  return {
    ...brief(career),
    code_meaning: career.code.map((type) => TYPE_NAMES[type]),
    route_from_class_10: career.route,
    check: 'Routes are the common ones. Exam dates, cut-offs and eligibility change: confirm on the official website.',
  }
}

export async function savePlan({ store, studentCode }: ToolContext, args: { summary: string; career_ids: string; next_steps: string }): Promise<ToolOutput> {
  const summary = args.summary.trim()
  if (!summary || summary.length > 300) return { error: 'summary must be 1–300 characters.' }
  const careerIds = args.career_ids.split(',').map((id) => id.trim()).filter(Boolean)
  if (careerIds.length < 1 || careerIds.length > 3) return { error: 'career_ids needs 1–3 ids.' }
  const unknown = careerIds.filter((id) => !careerById(id))
  if (unknown.length) return { error: `Unknown career ids: ${unknown.join(', ')}.` }
  const nextSteps = args.next_steps.split('\n').map((step) => step.replace(/^[-*\d.)\s]+/, '').trim()).filter(Boolean)
  if (nextSteps.length < 1 || nextSteps.length > 5) return { error: 'next_steps needs 1–5 lines.' }
  if (nextSteps.some((step) => step.length > 160)) return { error: 'Each next step must be under 160 characters.' }

  await store.savePlan(studentCode, { summary, careerIds, nextSteps, savedAt: new Date().toISOString() })
  return { saved: true, visible_to: 'the student’s teacher', careers: careerIds.map((id) => careerById(id)!.title) }
}

const REASONS: AlertReason[] = ['distress', 'safety', 'other']

export async function alertTeacher({ store, studentCode }: ToolContext, args: { reason: string; note: string }): Promise<ToolOutput> {
  const reason = args.reason.trim().toLowerCase() as AlertReason
  if (!REASONS.includes(reason)) return { error: 'reason must be distress, safety or other.' }
  const note = args.note.trim()
  if (!note || note.length > 200) return { error: 'note must be 1–200 characters.' }
  await store.addAlert({ studentCode, reason, note })
  return {
    sent: true,
    tell_the_student: 'Their teacher has been told and will check in. If they are in danger now, they should tell a trusted adult or call Tele-MANAS on 14416 (free, 24×7).',
  }
}

/**
 * Run a tool by name with untrusted arguments from the model: unknown tools,
 * missing or mistyped parameters come back as `{ error }` for the model to
 * read, never as an exception.
 */
export async function runTool(ctx: ToolContext, name: string, rawArgs: unknown): Promise<ToolOutput> {
  const spec = TOOL_SPECS.find((candidate) => candidate.name === name)
  if (!spec) return { error: `Unknown tool "${name}".` }
  const args = (rawArgs && typeof rawArgs === 'object' ? rawArgs : {}) as Record<string, unknown>

  for (const [param, rule] of Object.entries(spec.params)) {
    const value = args[param]
    if (value === undefined || value === null || value === '') {
      if (rule.required) return { error: `${param} is required.` }
      continue
    }
    if (typeof value !== rule.type) return { error: `${param} must be a ${rule.type}.` }
  }

  switch (spec.name) {
    case 'get_my_result':
      return getMyResult(ctx)
    case 'search_careers':
      return searchCareers(ctx, args as { types?: string; keyword?: string; limit?: number })
    case 'get_career':
      return getCareer(ctx, args as { id: string })
    case 'save_plan':
      return savePlan(ctx, args as { summary: string; career_ids: string; next_steps: string })
    case 'alert_teacher':
      return alertTeacher(ctx, args as { reason: string; note: string })
  }
}
