import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './auth/AuthProvider'
import type { Role } from './auth/api'
import Login from './screens/Login'
import StudentHome from './screens/StudentHome'
import TeacherHome from './screens/TeacherHome'
import TestScreen from './screens/TestScreen'
import ReportScreen from './screens/ReportScreen'
import CareersScreen from './screens/CareersScreen'
import SurveyScreen from './screens/SurveyScreen'
import ImpactScreen from './screens/ImpactScreen'

export default function App() {
  const { session } = useAuth()
  const home = session ? `/${session.role}` : '/login'

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to={home} replace /> : <Login />} />
      <Route path="/student" element={<RequireRole role="student"><StudentHome /></RequireRole>} />
      <Route path="/student/test" element={<RequireRole role="student"><TestScreen /></RequireRole>} />
      <Route path="/student/report" element={<RequireRole role="student"><ReportScreen /></RequireRole>} />
      <Route path="/student/careers" element={<RequireRole role="student"><CareersScreen /></RequireRole>} />
      <Route path="/student/survey/:id" element={<RequireRole role="student"><SurveyScreen /></RequireRole>} />
      <Route path="/teacher" element={<RequireRole role="teacher"><TeacherHome /></RequireRole>} />
      <Route path="/impact" element={<ImpactScreen />} />
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  )
}

/** A role's pages open only for that role; anyone else goes back to their own home. */
function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  if (session.role !== role) return <Navigate to={`/${session.role}`} replace />
  return children
}
