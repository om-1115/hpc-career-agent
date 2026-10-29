import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { useAuth } from '../auth/AuthProvider'
import { ApiError, describeError, submitSurvey, surveyStatus } from '../auth/api'
import { surveyById, UNCLEAR, type SurveyAnswer, type SurveyAnswers, type SurveyDefinition, type SurveyQuestion } from '../../shared/surveys'
import './CareerTab.css'
import './test.css'
import './Survey.css'

const FACES = ['😣', '🙁', '😐', '🙂', '😄']
const MAX_REFLECTION = 500

/** Where a survey is: the intro, question n, the reflection, or done. */
type Stage = { kind: 'intro' } | { kind: 'question'; index: number } | { kind: 'reflect' } | { kind: 'done' }

const draftKey = (id: string) => `hpc_survey_draft_${id}`

function loadDraft(id: string): SurveyAnswers {
  try {
    return (JSON.parse(sessionStorage.getItem(draftKey(id)) ?? 'null') as SurveyAnswers | null) ?? {}
  } catch {
    return {}
  }
}

const answered = (question: SurveyQuestion, value: SurveyAnswer | undefined) =>
  question.kind === 'text' ? Boolean(question.optional) || (typeof value === 'string' && value.trim().length > 0) : Array.isArray(value) ? value.length > 0 : value !== undefined

/**
 * A student survey (Figma "Student · My Work", screens 04–08): an intro, one
 * question per screen, then a reflection written from their answers that they
 * can edit and keep in their passbook. A pilot's before and after questions
 * skip the reflection and are answered once.
 */
export default function SurveyScreen() {
  const { id = '' } = useParams()
  const survey = surveyById(id)
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const [stage, setStage] = useState<Stage>({ kind: 'intro' })
  const [answers, setAnswers] = useState<SurveyAnswers>(() => loadDraft(id))
  const [reflection, setReflection] = useState('')
  const [doneBefore, setDoneBefore] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      sessionStorage.setItem(draftKey(id), JSON.stringify(answers))
    } catch {
      /* memory only */
    }
  }, [id, answers])

  useEffect(() => {
    if (!session) return
    surveyStatus(session.token)
      .then(({ surveys }) => setDoneBefore(surveys[id]?.completedAt ?? null))
      .catch(() => undefined)
  }, [session, id])

  if (!survey || session?.role !== 'student') {
    return (
      <PageShell title="Survey" backTo="/student">
        <p className="test-card__body">This survey isn’t available.</p>
      </PageShell>
    )
  }

  const total = survey.questions.length
  const index = stage.kind === 'question' ? stage.index : stage.kind === 'intro' ? -1 : total
  const question = stage.kind === 'question' ? survey.questions[stage.index] : null

  const set = (questionId: string, value: SurveyAnswer | undefined) =>
    setAnswers((current) => {
      const next = { ...current }
      if (value === undefined) delete next[questionId]
      else next[questionId] = value
      return next
    })

  const next = () => {
    if (stage.kind === 'question' && stage.index < total - 1) setStage({ kind: 'question', index: stage.index + 1 })
    else if (stage.kind === 'question' && survey.pilot) void save(false)
    else if (stage.kind === 'question') {
      setReflection(survey.reflect(answers))
      setStage({ kind: 'reflect' })
    }
  }
  const back = () => {
    if (stage.kind === 'question' && stage.index > 0) setStage({ kind: 'question', index: stage.index - 1 })
    else if (stage.kind === 'question') setStage({ kind: 'intro' })
    else if (stage.kind === 'reflect') setStage({ kind: 'question', index: total - 1 })
  }

  const save = async (withReflection: boolean) => {
    setBusy(true)
    setError(null)
    try {
      await submitSurvey(session.token, survey.id, answers, withReflection ? reflection.trim() : '')
      sessionStorage.removeItem(draftKey(id))
      setStage({ kind: 'done' })
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) return signOut('Your session ended. Choose your profile again.')
      setError(describeError(cause))
    } finally {
      setBusy(false)
    }
  }

  const footer =
    stage.kind === 'question' && question ? (
      <>
        <button type="button" className="test-nav" onClick={back}>
          Back
        </button>
        <button type="button" className="test-nav" disabled={busy || !answered(question, answers[question.id])} onClick={next}>
          {stage.index === total - 1 ? (busy ? 'Saving…' : 'Finish') : 'Next'}
        </button>
      </>
    ) : undefined

  return (
    <PageShell
      title={stage.kind === 'question' ? `Question ${stage.index + 1} of ${total}` : stage.kind === 'done' ? 'Survey complete' : survey.title}
      backTo="/student"
      progress={stage.kind === 'intro' ? undefined : Math.min(1, (index + 1) / (total + 1))}
      footer={footer}
    >
      {stage.kind === 'intro' && <Intro survey={survey} doneBefore={doneBefore} onStart={() => setStage({ kind: 'question', index: 0 })} />}

      {question && <Question key={question.id} question={question} value={answers[question.id]} onChange={(value) => set(question.id, value)} />}

      {question && error && (
        <p className="test-error" role="alert">
          {error}
        </p>
      )}

      {stage.kind === 'reflect' && (
        <section className="test-card survey-reflect">
          <span className="test-card__emoji" aria-hidden="true">
            ✍️
          </span>
          <h2 className="test-card__title">Your reflection</h2>
          <p className="test-card__body">
            We wrote this from your answers. Change anything that isn’t right — it’s yours, and it goes in your passbook.
          </p>
          <label htmlFor="survey-reflection" className="survey-label">
            In your words
          </label>
          <textarea
            id="survey-reflection"
            className="survey-text"
            rows={8}
            maxLength={MAX_REFLECTION}
            value={reflection}
            onChange={(event) => setReflection(event.target.value)}
          />
          <p className="survey-count">
            {reflection.length} / {MAX_REFLECTION}
          </p>
          {error && (
            <p className="test-error" role="alert">
              {error}
            </p>
          )}
          <button type="button" className="career-button" disabled={busy || !reflection.trim()} onClick={() => void save(true)}>
            {busy ? 'Saving…' : 'Save to my passbook'}
          </button>
          <button type="button" className="test-link" disabled={busy} onClick={() => void save(false)}>
            Send my answers without a reflection
          </button>
          <button type="button" className="test-link" disabled={busy} onClick={back}>
            Back to the last question
          </button>
        </section>
      )}

      {stage.kind === 'done' && survey.pilot && (
        <section className="test-card test-card--center">
          <span className="survey-done" aria-hidden="true">
            ✓
          </span>
          <h2 className="test-card__title">Thank you!</h2>
          <p className="test-card__body">
            {survey.id === 'pilot-before'
              ? 'Your answers are saved. Next: the psychometric test — it’s step 2 on Home.'
              : 'Your answers are saved. That’s everything for today — thank you for helping make HPC Career better.'}
          </p>
          <button type="button" className="career-button" onClick={() => navigate('/student')}>
            Back to Home
          </button>
        </section>
      )}

      {stage.kind === 'done' && !survey.pilot && (
        <section className="test-card test-card--center">
          <span className="survey-done" aria-hidden="true">
            ✓
          </span>
          <h2 className="test-card__title">All done!</h2>
          <p className="test-card__body">Your answers have been saved. Thank you for taking the time.</p>
          <div className="survey-next">
            <p className="survey-next__title">What happens next?</p>
            <p className="survey-next__body">
              Your reflection is in your passbook and in Live HPC under “What I said”. Your teacher can see your answers
              and talk them through with you.
            </p>
          </div>
          <button
            type="button"
            className="career-button"
            onClick={() => {
              try {
                sessionStorage.setItem('hpc_student_tab', 'live-hpc')
              } catch {
                /* fine */
              }
              navigate('/student')
            }}
          >
            See it in Live HPC
          </button>
          <button type="button" className="test-link" onClick={() => navigate('/student')}>
            Back to Home
          </button>
        </section>
      )}
    </PageShell>
  )
}

function Intro({ survey, doneBefore, onStart }: { survey: SurveyDefinition; doneBefore: string | null; onStart: () => void }) {
  return (
    <>
      <section className="survey-intro">
        <h2 className="survey-intro__title">
          <span aria-hidden="true">{survey.emoji}</span>
          {survey.title}
        </h2>
        <p className="survey-intro__body">{survey.intro}</p>
        <p className="survey-intro__meta">
          {survey.questions.length} questions · About {survey.minutes} minutes
        </p>
        <p className="survey-intro__note">{survey.privacy}</p>
        {doneBefore && survey.pilot && (
          <p className="survey-intro__note survey-intro__note--done">You’ve already answered these. Thank you!</p>
        )}
        {doneBefore && !survey.pilot && (
          <p className="survey-intro__note survey-intro__note--done">
            You finished this on {new Date(doneBefore).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}. Taking it again
            replaces those answers; your earlier reflection stays in your passbook.
          </p>
        )}
      </section>
      <p className="survey-label">What’s in this survey</p>
      <div className="chips">
        {survey.topics.map((topic) => (
          <span key={topic} className="chip">
            {topic}
          </span>
        ))}
      </div>
      {!(doneBefore && survey.pilot) && (
        <button type="button" className="career-button survey-start" onClick={onStart}>
          {doneBefore ? 'Take it again' : survey.pilot ? 'Start' : 'Start survey'}
        </button>
      )}
    </>
  )
}

function Question({ question, value, onChange }: { question: SurveyQuestion; value: SurveyAnswer | undefined; onChange: (value: SurveyAnswer | undefined) => void }) {
  const unclear = value === UNCLEAR
  return (
    <section className="test-card" aria-labelledby={`q-${question.id}`}>
      <h2 id={`q-${question.id}`} className="test-card__question survey-question">
        {question.prompt}
      </h2>
      {question.help && <p className="survey-help">{question.help}</p>}

      {question.kind === 'choice' && (
        <div className="test-options" role="radiogroup" aria-labelledby={`q-${question.id}`}>
          {question.options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={value === option.value}
              className={`test-option survey-option${value === option.value ? ' test-option--chosen' : ''}`}
              onClick={() => onChange(option.value)}
            >
              <span className="test-option__dot" aria-hidden="true" />
              <span className="survey-option__text">
                {option.label}
                {option.detail && <span className="survey-option__detail">{option.detail}</span>}
              </span>
            </button>
          ))}
        </div>
      )}

      {question.kind === 'multi' && (
        <MultiChoice question={question} value={Array.isArray(value) ? value : []} onChange={(next) => onChange(next.length ? next : undefined)} />
      )}

      {question.kind === 'scale' && (
        <div className="survey-scale">
          <div className="survey-scale__faces" role="radiogroup" aria-labelledby={`q-${question.id}`}>
            {FACES.map((face, index) => (
              <button
                key={face}
                type="button"
                role="radio"
                aria-checked={value === index + 1}
                aria-label={question.words[index]}
                className={`survey-face${value === index + 1 ? ' survey-face--chosen' : ''}`}
                onClick={() => onChange(index + 1)}
              >
                {face}
              </button>
            ))}
          </div>
          <div className="survey-scale__ends" aria-hidden="true">
            <span>{question.low}</span>
            <span>{question.high}</span>
          </div>
        </div>
      )}

      {question.kind === 'text' && (
        <>
          <textarea
            className="survey-text"
            rows={4}
            maxLength={question.maxLength}
            placeholder={question.placeholder}
            aria-labelledby={`q-${question.id}`}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => onChange(event.target.value || undefined)}
          />
          <p className="survey-count">
            {typeof value === 'string' ? value.length : 0} / {question.maxLength}
          </p>
        </>
      )}

      {question.kind !== 'text' &&
        (unclear ? (
          <p className="survey-unclear">
            Marked as “I don’t understand this question”. Your teacher will explain it.{' '}
            <button type="button" className="test-link" onClick={() => onChange(undefined)}>
              Answer it instead
            </button>
          </p>
        ) : (
          <button type="button" className="test-link survey-unclear-link" onClick={() => onChange(UNCLEAR)}>
            I don’t understand this question
          </button>
        ))}
    </section>
  )
}

function MultiChoice({
  question,
  value,
  onChange,
}: {
  question: Extract<SurveyQuestion, { kind: 'multi' }>
  value: string[]
  onChange: (value: string[]) => void
}) {
  const full = value.length >= question.max
  return (
    <>
      <div className="test-options" role="group" aria-label={question.prompt}>
        {question.options.map((option) => {
          const chosen = value.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              role="checkbox"
              aria-checked={chosen}
              disabled={!chosen && full}
              className={`test-option survey-option${chosen ? ' test-option--chosen' : ''}`}
              onClick={() => onChange(chosen ? value.filter((item) => item !== option.value) : [...value, option.value])}
            >
              <span className="survey-check" aria-hidden="true">
                {chosen ? '✓' : ''}
              </span>
              <span className="survey-option__text">{option.label}</span>
            </button>
          )
        })}
      </div>
      <p className="survey-count">
        {value.length} of {question.max} chosen
      </p>
    </>
  )
}
