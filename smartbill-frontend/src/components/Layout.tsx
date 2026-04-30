import type { ReactNode } from 'react'
import type { Route } from '../lib/router'
import { Sidebar } from './Sidebar'
import type { UserProfile } from '../types'

type FlashMessage = { tone: 'success' | 'error'; message: string } | null

type LayoutProps = {
  route: Route
  user: UserProfile
  title: string
  subtitle?: string
  actions?: ReactNode
  flash: FlashMessage
  onDismissFlash: () => void
  onLogout: () => void
  children: ReactNode
}

export function Layout({ route, user, title, subtitle, actions, flash, onDismissFlash, onLogout, children }: LayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar route={route} user={user} onLogout={onLogout} />
      <div className="main">
        <header className="topbar">
          <div>
            <div className="topbar-title">{title}</div>
            {subtitle ? <div className="topbar-subtitle">{subtitle}</div> : null}
          </div>
          <div className="topbar-actions">{actions}</div>
        </header>
        <div className="content">
          {flash ? (
            <div className={`flash ${flash.tone === 'error' ? 'is-error' : 'is-success'}`}>
              <span>{flash.message}</span>
              <button type="button" className="flash-close" onClick={onDismissFlash} aria-label="Dismiss">
                ×
              </button>
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  )
}
