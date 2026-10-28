import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { describeError, listProfiles, openProfile, type Profile } from '../auth/api'
import './Login.css'

/**
 * The app's first screen: pick a profile and go, no password (for now). The
 * server still has password sign-in (/api/login) for when it goes to a school.
 */
export default function Login() {
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
    <div className="screen login">
      <div className="screen__scroll">
        <header className="login__header">
          <div className="screen__header-pattern" aria-hidden="true">
            <img src="/assets/header-pattern.svg" alt="" />
          </div>
          <p className="login__eyebrow">Holistic Progress Card</p>
          <h1 className="login__title">Choose your profile</h1>
        </header>

        <main className="login__body">
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
        </main>
      </div>
    </div>
  )
}
