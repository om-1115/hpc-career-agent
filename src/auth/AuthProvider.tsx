import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useChat } from '../chat/ChatProvider'
import type { Profile } from './api'

/**
 * Who is signed in, for this tab only (sessionStorage): classroom phones are
 * shared, so closing the tab signs out and nothing outlives it.
 */
export type Session = Profile & { token: string }

const SESSION_KEY = 'hpc_session'

type AuthValue = {
  session: Session | null
  signIn: (session: Session) => void
  /** `reason` is shown on the sign-in screen, e.g. when a session expired. */
  signOut: (reason?: string) => void
  signedOutReason: string | null
}

const AuthCtx = createContext<AuthValue | null>(null)

function restore(): Session | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null') as Session | null
    return saved && typeof saved.token === 'string' && (saved.role === 'student' || saved.role === 'teacher')
      ? saved
      : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(restore)
  const [signedOutReason, setSignedOutReason] = useState<string | null>(null)
  const { reset: resetChat } = useChat()

  const signIn = useCallback((next: Session) => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
    } catch {
      /* storage denied: signed in for this page load only */
    }
    setSignedOutReason(null)
    setSession(next)
  }, [])

  const signOut = useCallback(
    (reason?: string) => {
      // The counsellor transcript is the most personal thing in the app.
      resetChat(true)
      try {
        // Including an unfinished test, so the next person on this phone starts clean.
        sessionStorage.clear()
        localStorage.clear()
      } catch {
        /* nothing was persisted */
      }
      setSignedOutReason(reason ?? null)
      setSession(null)
    },
    [resetChat],
  )

  const value = useMemo<AuthValue>(
    () => ({ session, signIn, signOut, signedOutReason }),
    [session, signIn, signOut, signedOutReason],
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const value = useContext(AuthCtx)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}

export function greeting(session: Session): string {
  return `Hi, ${session.name.split(' ')[0]} 👋`
}
