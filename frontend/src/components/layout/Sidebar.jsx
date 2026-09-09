import {
  LayoutDashboard,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  UserRound,
  BarChart3,
  Settings,
  Sparkles,
  LogOut,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

function Sidebar({ role = 'candidate' }) {
  const { logout } = useAuth()

  const candidateItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/candidate',
    },
    {
      label: 'Find Jobs',
      icon: BriefcaseBusiness,
      path: '/candidate/jobs',
    },
    {
      label: 'Applications',
      icon: ClipboardList,
      path: '/candidate/applications',
    },
    {
      label: 'Resume',
      icon: FileText,
      path: '/candidate/resume',
    },
    {
      label: 'My Profile',
      icon: UserRound,
      path: '/candidate/profile',
    },
  ]

  const recruiterItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/recruiter',
    },
    {
      label: 'Jobs',
      icon: BriefcaseBusiness,
      path: '/recruiter/jobs',
    },
    {
      label: 'Applications',
      icon: ClipboardList,
      path: '/recruiter/applications',
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      path: '/recruiter/analytics',
    },
  ]

  const items =
    role === 'recruiter'
      ? recruiterItems
      : candidateItems

  function handleSignOut() {
    logout()
    window.location.href = '/login'
  }

  function handleSettings() {
    window.location.href = '/settings'
  }

  return (
    <aside className="hs-sidebar">
      <div className="hs-sidebar-brand">
        <div
          className="hs-logo"
          title="HireSense"
          aria-label="HireSense"
        >
          <Sparkles size={18} strokeWidth={2.5} />
        </div>

        <div>
          <div className="hs-brand-name">
            HireSense
          </div>

          <div className="hs-brand-subtitle">
            {role === 'recruiter'
              ? 'Recruiter Workspace'
              : 'Candidate Workspace'}
          </div>
        </div>
      </div>

      <nav
        className="hs-sidebar-nav"
        aria-label={
          role === 'recruiter'
            ? 'Recruiter navigation'
            : 'Candidate navigation'
        }
      >
        <div className="hs-nav-label">
          Workspace
        </div>

        {items.map((item) => {
          const Icon = item.icon

          const isActive =
            window.location.pathname === item.path

          return (
            <a
              key={item.path}
              href={item.path}
              className={
                isActive
                  ? 'hs-nav-item active'
                  : 'hs-nav-item'
              }
              title={item.label}
              aria-label={item.label}
              aria-current={
                isActive ? 'page' : undefined
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </a>
          )
        })}
      </nav>

      <div className="hs-sidebar-bottom">
        <button
          type="button"
          className="hs-nav-item"
          onClick={handleSettings}
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <button
          type="button"
          className="hs-nav-item hs-logout"
          onClick={handleSignOut}
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>

        <div className="hs-sidebar-footer">
          <span>HireSense</span>
          <small>
            Placement Intelligence
          </small>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar