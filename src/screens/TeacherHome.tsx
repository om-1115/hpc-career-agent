import { useEffect, useState } from 'react'
import { Screen } from '../components/Screen'
import { SectionHeader } from '../components/SectionHeader'
import { SurveyRow } from '../components/SurveyRow'
import { PrimaryCta } from '../components/PrimaryCta'
import { ClassOverviewCard } from '../components/ClassOverviewCard'
import { ComingSoon } from '../components/ComingSoon'
import { Badge } from '../components/Badge'
import { greeting, useAuth, type Session } from '../auth/AuthProvider'
import { ApiError, classResults, type ClassStudent } from '../auth/api'
import { selectedClasses, teacherSurveys } from '../data/content'
import { TYPE_NAMES } from '../../shared/careers'
import { TYPE_COPY } from '../../shared/report'
import { RIASEC_ORDER } from '../../shared/scoring'
import './CareerTab.css'
import './test.css'

const navItems = [
  { id: 'home', label: 'Home', icon: '/assets/icon-home.svg' },
  { id: 'career', label: 'Career', icon: '/assets/icon-career.svg' },
  { id: 'group-project', label: 'Group Project', icon: '/assets/icon-file.svg' },
]

/** v1's teacher home (Figma 1:1444), with the class's psychometric test results added. */
export default function TeacherHome() {
  const { session } = useAuth()
  const [activeNavId, setActiveNavId] = useState('home')
  if (session?.role !== 'teacher') return null

  return (
    <Screen title="Holistic Progress Card" navItems={navItems} activeNavId={activeNavId} onNavSelect={setActiveNavId}>
      {activeNavId === 'home' && (
        <>
          <p className="screen__greeting">{greeting(session)}</p>

          <section className="screen__section">
            <SectionHeader title="Live Surveys" action={{ label: 'See All', onClick: () => {} }} />
            <div className="screen__list">
              {teacherSurveys.map((survey) => (
                <SurveyRow key={survey.id} survey={survey} onClick={() => {}} />
              ))}
            </div>
          </section>

          <div className="screen__rule" />

          <section className="screen__stack-12">
            <div className="screen__row">
              <SectionHeader title="Selected Classes/Grades" />
              <PrimaryCta label="Select Grades" onClick={() => {}} />
            </div>
            {selectedClasses.map((item) => (
              <ClassOverviewCard key={item.id} data={item} onClick={() => {}} />
            ))}
          </section>
        </>
      )}
      {activeNavId === 'career' && <ClassCareers session={session} />}
      {activeNavId === 'group-project' && <ComingSoon title="Group Project" />}
    </Screen>
  )
}

/** Who has taken the psychometric test, and where the class's interests lie. */
function ClassCareers({ session }: { session: Session }) {
  const { signOut } = useAuth()
  const [students, setStudents] = useState<ClassStudent[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    classResults(session.token)
      .then(({ students }) => setStudents(students))
      .catch((cause) => {
        if (cause instanceof ApiError && cause.status === 401) return signOut('Your session ended. Choose your profile again.')
        setError('Couldn’t load the class. Check your connection and try again.')
      })
  }, [session.token, signOut])

  if (error) return <p className="career-note career-note--error">{error}</p>
  if (!students) return <div className="career-empty career-empty--loading">Loading…</div>

  const done = students.filter((student) => student.result)
  const leading = Object.fromEntries(RIASEC_ORDER.map((type) => [type, done.filter((student) => student.result!.code[0] === type).length]))

  return (
    <>
      <section className="screen__section">
        <SectionHeader title="Psychometric test" />
        <div className="career-report">
          <div>
            <p className="career-report__label">Finished</p>
            <p className="test-card__title">
              {done.length} of {students.length} students
            </p>
            <div className="career-bars__track" style={{ marginTop: 8 }}>
              <span className="career-bars__fill" style={{ width: `${students.length ? (done.length / students.length) * 100 : 0}%` }} />
            </div>
          </div>
          {done.length > 0 && (
            <div>
              <p className="career-report__label">Strongest interest across the class</p>
              <ul className="career-bars">
                {RIASEC_ORDER.map((type) => (
                  <li key={type} className="career-bars__row">
                    <span className="career-bars__name">{TYPE_NAMES[type]}</span>
                    <span className="career-bars__track" aria-label={`${leading[type]} students`}>
                      <span className="career-bars__fill" style={{ width: `${(leading[type] / done.length) * 100}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="screen__section">
        <SectionHeader title="Students" />
        <div className="screen__list">
          {students.map((student) => (
            <div key={student.code} className="career-row">
              <span className="career-card__emoji" aria-hidden="true">🎒</span>
              <span className="career-card__body">
                <span className="career-card__heading">
                  <span className="career-card__title">{student.name}</span>
                  {student.result ? <Badge tone="green">Completed</Badge> : <Badge tone="neutral">Not started</Badge>}
                </span>
                <span className="career-card__description">
                  {student.result
                    ? `${student.result.code.join('')} · ${student.result.code.map((type) => TYPE_COPY[type].short).join(', ')}`
                    : `${student.code}${student.classLine ? ` · ${student.classLine}` : ''}`}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
