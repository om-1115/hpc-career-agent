import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { describeError, listProfiles, login, openProfile, type Profile, type Role } from '../auth/api'
import { useAppMode } from '../auth/useAppMode'
import './Login.css'

/**
 * The app's first screen. The demo opens on a list of profiles, no password; a
 * pilot with real students signs in with the code and PIN on their slip.
 */
export default function Login() {
  const mode = useAppMode()
  if (mode === null) return <LoginFrame title="Holistic Progress Card" />
  return mode === 'pilot' ? <PinSignIn /> : <ProfilePicker />
}

function LoginFrame({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="screen login">
      <div className="screen__scroll">
        <header className="login__header">
          <div className="screen__header-pattern" aria-hidden="true">
            <img src="/assets/header-pattern.svg" alt="" />
          </div>
          <p className="login__eyebrow">Holistic Progress Card</p>
          <h1 className="login__title">{title}</h1>
        </header>
        <main className="login__body">{children}</main>
      </div>
    </div>
  )
}

/** Sign-in for a pilot: role, code and the six-digit PIN from the slip (`npm run pilot:accounts`). */
function PinSignIn() {
  const { signIn, signedOutReason } = useAuth()
  const [role, setRole] = useState<Role>('student')
  const [code, setCode] = useState('')
  const [pin, setPin] = useState('')
  const [shown, setShown] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(signedOutReason)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { profile, token } = await login(role, code, pin)
      signIn({ ...profile, token })
    } catch (cause) {
      setError(describeError(cause))
      setPin('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <LoginFrame title="Sign in with your slip">
      <form className="login__card" onSubmit={onSubmit} noValidate>
        <div className="login__roles" role="tablist" aria-label="I am a">
          {(['student', 'teacher'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={role === option}
              className={`login__role${role === option ? ' login__role--active' : ''}`}
              onClick={() => {
                setRole(option)
                setError(null)
              }}
            >
              <span aria-hidden="true">{option === 'student' ? '🎒' : '👩‍🏫'}</span>
              {option === 'student' ? 'Student' : 'Teacher'}
            </button>
          ))}
        </div>

        <div className="login__field">
          <label htmlFor="login-code" className="login__label">
            Code
          </label>
          <input
            id="login-code"
            className="login__input"
            value={code}
            placeholder={role === 'student' ? 'e.g. P07' : 'e.g. T01'}
            autoComplete="username"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={64}
            onChange={(event) => setCode(event.target.value)}
          />
        </div>

        <div className="login__field">
          <label htmlFor="login-pin" className="login__label">
            PIN
          </label>
          <div className="login__input-wrap">
            <input
              id="login-pin"
              className="login__input"
              type={shown ? 'text' : 'password'}
              inputMode="numeric"
              value={pin}
              autoComplete="current-password"
              maxLength={64}
              onChange={(event) => setPin(event.target.value.trim())}
            />
            <button type="button" className="login__reveal" aria-pressed={shown} onClick={() => setShown((current) => !current)}>
              {shown ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="login__hint">Both are on the slip your teacher gave you. Lost it? Ask your teacher.</p>
        </div>

        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="login__submit" disabled={busy || !code.trim() || !pin}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </LoginFrame>
  )
}

/** The demo's way in: tap a profile and go. */
function ProfilePicker() {
  const { signIn, signedOutReason } = useAuth()
  const [profiles, setProfiles] = useState<Profile[] | null>(null)
  const [opening, setOpening] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(signedOutReason)

  useEffect(() => {
    listProfiles()
      .then(({ profiles }) => setProfiles(profiles))
      .catch((cause) => {
        setProfiles([])
        setError(describeError(cause))
      })
  }, [])

  const open = async (profile: Profile) => {
    const key = `${profile.role}:${profile.code}`
    setOpening(key)
    setError(null)
    try {
      const { profile: opened, token } = await openProfile(profile.role, profile.code)
      signIn({ ...opened, token })
    } catch (cause) {
      setError(describeError(cause))
    } finally {
      setOpening(null)
    }
  }

  const groups = [
    { role: 'student' as const, title: 'Students', emoji: '🎒' },
    { role: 'teacher' as const, title: 'Teachers', emoji: '👩‍🏫' },
  ]

  return (
    <LoginFrame title="Choose your profile">
      {error && (
        <p className="login__error" role="alert">
          {error}
        </p>
      )}

      {profiles === null && <p className="login__lead">Loading profiles…</p>}

      {profiles?.length === 0 && !error && (
        <p className="login__lead">
          No profiles yet. Run <code>npm run seed:demo</code> to add a demo school.
        </p>
      )}

      {groups.map((group) => {
        const members = (profiles ?? []).filter((profile) => profile.role === group.role)
        if (!members.length) return null
        return (
          <section key={group.role} className="login__group" aria-label={group.title}>
            <h2 className="login__group-title">{group.title}</h2>
            <ul className="login__profiles">
              {members.map((profile) => {
                const key = `${profile.role}:${profile.code}`
                return (
                  <li key={key}>
                    <button
                      type="button"
                      className="login__profile"
                      disabled={opening !== null}
                      onClick={() => open(profile)}
                    >
                      <span className="login__avatar" aria-hidden="true">
                        {group.emoji}
                      </span>
                      <span className="login__profile-text">
                        <span className="login__profile-name">{profile.name}</span>
                        <span className="login__profile-detail">
                          {[profile.classLine, profile.code].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <span className="login__profile-go" aria-hidden="true">
                        {opening === key ? '…' : '›'}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </LoginFrame>
  )
}
