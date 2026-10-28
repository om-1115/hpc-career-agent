import { useState } from 'react'
import { TopAppBar } from './TopAppBar'
import { BottomNav, type NavItem } from './BottomNav'
import { MenuDrawer } from './MenuDrawer'
import { ChatFab } from './ChatFab'
import { ChatPanel } from '../chat/ChatPanel'
import { useAuth } from '../auth/AuthProvider'
import type { ReactNode } from 'react'
import './Screen.css'

type Props = {
  title: string
  navItems: NavItem[]
  activeNavId: string
  onNavSelect: (id: string) => void
  children: ReactNode
}

/** The v1 phone shell: navy header, scrolling content, floating nav, counsellor and profile drawer. */
export function Screen({ title, navItems, activeNavId, onNavSelect, children }: Props) {
  const { session, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const drawerProfile = session
    ? {
        name: session.name,
        detail: [session.role === 'teacher' ? 'Teacher' : 'Student', session.code, session.classLine]
          .filter(Boolean)
          .join(' · '),
        emoji: session.role === 'teacher' ? '👩‍🏫' : '🎒',
      }
    : { name: '', detail: '', emoji: '' }

  return (
    <div className="screen">
      <div className="screen__scroll">
        <header className="screen__header">
          <div className="screen__header-pattern" aria-hidden="true">
            <img src="/assets/header-pattern.svg" alt="" />
          </div>
          <TopAppBar title={title} onMenuClick={() => setMenuOpen(true)} />
        </header>

        <main className="screen__content">{children}</main>
      </div>

      <ChatFab />

      <BottomNav items={navItems} activeId={activeNavId} onSelect={onNavSelect} />

      <MenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        profile={drawerProfile}
        onSignOut={() => signOut()}
      />

      <ChatPanel />
    </div>
  )
}
