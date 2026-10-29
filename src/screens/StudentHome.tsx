import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { SectionHeader } from '../components/SectionHeader'
import { SurveyRow } from '../components/SurveyRow'
import { greeting, useAuth } from '../auth/AuthProvider'
import { studentSurveys } from '../data/content'
import { surveyStatus } from '../auth/api'
import { surveyById } from '../../shared/surveys'
import { CareerTab } from './CareerTab'
import { LiveHpcTab } from './LiveHpcTab'
import './CareerTab.css'

const navItems = [
  { id: 'home', label: 'Home', icon: '/assets/icon-home.svg' },
  { id: 'career', label: 'Career', icon: '/assets/icon-career.svg' },
  { id: 'live-hpc', label: 'Live HPC', icon: '/assets/icon-file.svg' },
]

/** v1's student home (Figma 1:1518), with the Career and Live HPC tabs. */
export default function StudentHome() {
  const { session } = useAuth()
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
    <Screen title="Holistic Progress Card" navItems={navItems} activeNavId={activeNavId} onNavSelect={select}>
      {activeNavId === 'home' && (
        <>
          <p className="screen__greeting">{greeting(session)}</p>

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
      {activeNavId === 'career' && <CareerTab session={session} />}
      {activeNavId === 'live-hpc' && <LiveHpcTab session={session} onOpenCareer={() => select('career')} />}
    </Screen>
  )
}
