import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { describeError, login, type Role } from '../auth/api'
import './Login.css'

/** Sign-in for both roles, in v1's chrome. Accounts are created by the school (`npm run account:add`). */
export default function Login() {
  const { signIn, signedOutReason } = useAuth()
  const [role, setRole] = useState<Role>('student')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [shown, setShown] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(signedOutReason)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { profile, token } = await login(role, code, password)
      signIn({ ...profile, token })
    } catch (cause) {
      setError(describeError(cause))
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  const codeLabel = role === 'student' ? 'Student Code' : 'Teacher Code'

  return (
    <div className="screen login">
      <div className="screen__scroll">
        <header className="login__header">
          <div className="screen__header-pattern" aria-hidden="true">
            <img src="/assets/header-pattern.svg" alt="" />
          </div>
          <p className="login__eyebrow">Holistic Progress Card</p>
          <h1 className="login__title">Sign in to your profile</h1>
        </header>

        <main className="login__body">
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
                {codeLabel}
              </label>
              <input
                id="login-code"
                className="login__input"
                value={code}
                autoComplete="username"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={64}
                onChange={(event) => setCode(event.target.value)}
              />
            </div>

            <div className="login__field">
              <label htmlFor="login-password" className="login__label">
                Password
              </label>
              <div className="login__input-wrap">
                <input
                  id="login-password"
                  className="login__input"
                  type={shown ? 'text' : 'password'}
                  value={password}
                  autoComplete="current-password"
                  maxLength={256}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="login__reveal"
                  aria-pressed={shown}
                  onClick={() => setShown((current) => !current)}
                >
                  {shown ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="login__hint">Forgot it? Ask your teacher to reset your password.</p>
            </div>

            {error && (
              <p className="login__error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="login__submit" disabled={busy || !code.trim() || !password}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </main>
      </div>
    </div>
  )
}
