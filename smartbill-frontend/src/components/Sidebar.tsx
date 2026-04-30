import { getInitials } from '../lib/formatters'
import { navigate, type Route, topNavGroup } from '../lib/router'
import type { UserProfile } from '../types'

type SidebarProps = {
  route: Route
  user: UserProfile
  onLogout: () => void
}

const NAV: Array<{
  group: 'dashboard' | 'invoices' | 'customers' | 'items' | 'settings'
  label: string
  href: string
  icon: string
}> = [
  { group: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z' },
  { group: 'invoices', label: 'Invoices', href: '/invoices', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 7V3.5L19.5 9H14ZM8 13h8v2H8v-2Zm0 4h5v2H8v-2Z' },
  { group: 'customers', label: 'Customers', href: '/customers', icon: 'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.87 0-8 1.94-8 5v3h16v-3c0-3.06-4.13-5-8-5Z' },
  { group: 'items', label: 'Items & Services', href: '/items', icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Zm-9 5-7-4V8.62l7 4Zm1-9.38L6.18 8 12 4.7 17.82 8Zm6 5.38-7 4V12.62l7-4Z' },
  { group: 'settings', label: 'Settings', href: '/settings', icon: 'M19.43 12.98a8 8 0 0 0 0-1.96l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a8 8 0 0 0-1.7-1l-.38-2.65A.5.5 0 0 0 14 2h-4a.5.5 0 0 0-.5.42L9.12 5.07a8 8 0 0 0-1.7 1l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46a.5.5 0 0 0 .12.64L4.55 11a8 8 0 0 0 0 1.96l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46a.5.5 0 0 0 .61.22l2.49-1a8 8 0 0 0 1.7 1l.38 2.65A.5.5 0 0 0 10 22h4a.5.5 0 0 0 .5-.42l.38-2.65a8 8 0 0 0 1.7-1l2.49 1a.5.5 0 0 0 .61-.22l2-3.46a.5.5 0 0 0-.12-.64ZM12 15.5a3.5 3.5 0 1 1 3.5-3.5 3.5 3.5 0 0 1-3.5 3.5Z' },
]

export function Sidebar({ route, user, onLogout }: SidebarProps) {
  const active = topNavGroup(route)
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-mark">SB</div>
        <div>
          <div className="sidebar-brand-name">Smart Bill</div>
          <div className="sidebar-brand-tag">GST Billing</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">Workspace</div>
        {NAV.map((item) => (
          <button
            key={item.group}
            type="button"
            className={`sidebar-link ${active === item.group ? 'is-active' : ''}`}
            onClick={() => navigate(item.href)}
          >
            <svg className="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d={item.icon} />
            </svg>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-avatar">{getInitials(user.fullName)}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="sidebar-user-name">{user.fullName}</div>
          <div className="sidebar-user-meta">{user.businessName || user.email}</div>
        </div>
        <button type="button" className="sidebar-logout" onClick={onLogout} title="Sign out">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
