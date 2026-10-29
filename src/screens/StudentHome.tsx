import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { SectionHeader } from '../components/SectionHeader'
import { SurveyRow } from '../components/SurveyRow'
import { greeting, useAuth } from '../auth/AuthProvider'
import { useAppMode } from '../auth/useAppMode'
import { studentSurveys } from '../data/content'
import { surveyStatus } from '../auth/api'
import { surveyById } from '../../shared/surveys'
import { CareerTab } from './CareerTab'
import { LiveHpcTab } from './LiveHpcTab'
import { PilotSteps } from './PilotSteps'
import './CareerTab.css'

const navItems = [
  { id: 'home', label: 'Home', icon: '/assets/icon-home.svg' },
  { id: 'career', label: 'Career', icon: '/assets/icon-career.svg' },
  { id: 'live-hpc', label: 'Live HPC', icon: '/assets/icon-file.svg' },
]

/**
 * v1's student home (Figma 1:1518), with the Career and Live HPC tabs. In a
 * pilot, Home leads with the day's three steps, and Live HPC (sample data) and
 * the term's surveys are left out.
 */
export default function StudentHome() {
  const { session } = useAuth()
  const pilot = useAppMode() === 'pilot'
  // The tab survives a trip to the test or report and back.
  const [activeNavId, setActiveNavId] = useState(() => sessionStorage.getItem('hpc_student_tab') ?? 'home')
  const [done, setDone] = useState<Record<string, { completedAt: string }>>({})
  const navigate = useNavigate()

  useEffect(() => {
    if (session?.role !== 'student') return
    surveyStatus(session.token)
      .then(({ surveys }) => setDone(surveys))
      .catch(() => undefined)
  }, [session])

  if (session?.role !== 'student') return null
  // A pilot has no Live HPC tab, even if this tab was last left open on it.
  const tab = pilot && activeNavId === 'live-hpc' ? 'home' : activeNavId

  // Surveys the app runs show their real status and open; the rest stay as designed.
  const surveys = studentSurveys.map((survey) =>
    surveyById(survey.id)
      ? { ...survey, badge: done[survey.id] ? { label: 'Completed', tone: 'green' as const } : { label: 'Pending', tone: 'orange' as const } }
      : survey,
  )

  const select = (id: string) => {
    setActiveNavId(id)
    try {
      sessionStorage.setItem('hpc_student_tab', id)
    } catch {
      /* fine */
    }
  }

  return (
    <Screen
      title="Holistic Progress Card"
      navItems={pilot ? navItems.filter((item) => item.id !== 'live-hpc') : navItems}
      activeNavId={tab}
      onNavSelect={select}
    >
      {tab === 'home' && (
        <>
          <p className="screen__greeting">{greeting(session)}</p>

          {pilot && (
            <section className="screen__section">
              <PilotSteps session={session} />
            </section>
          )}

          {!pilot && (
            <section className="screen__section">
              <SectionHeader title="Surveys for You" action={{ label: 'See All', onClick: () => {} }} />
              <div className="screen__list">
                {surveys.map((survey) => (
                  <SurveyRow
                    key={survey.id}
                    survey={survey}
                    onClick={() => (surveyById(survey.id) ? navigate(`/student/survey/${survey.id}`) : undefined)}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="screen__section">
            <SectionHeader title="Your Career" />
            <button type="button" className="career-row" onClick={() => select('career')}>
              <span className="career-card__emoji" aria-hidden="true">🧭</span>
              <span className="career-card__body">
                <span className="career-card__title">Find careers that fit you</span>
                <span className="career-card__description">Psychometric test, your profile and 36 careers to explore</span>
              </span>
            </button>
          </section>
        </>
      )}
      {tab === 'career' && <CareerTab session={session} />}
      {tab === 'live-hpc' && <LiveHpcTab session={session} onOpenCareer={() => select('career')} />}
    </Screen>
  )
}
