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
  Users,
  Building2,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

function Sidebar({ role = 'candidate' }) {
  const { logout } = useAuth()

  // =========================================================
  // CANDIDATE
  // =========================================================

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

  // =========================================================
  // RECRUITER
  // =========================================================

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

  // =========================================================
  // PLACEMENT OFFICER
  // =========================================================

  const placementOfficerItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/placement-officer',
    },
    {
      label: 'Candidates',
      icon: Users,
      path: '/placement-officer/candidates',
    },
    {
      label: 'Recruiters',
      icon: Building2,
      path: '/placement-officer/recruiters',
    },
    {
      label: 'Placement Drives',
      icon: BriefcaseBusiness,
      path: '/placement-officer/drives',
    },
    {
      label: 'Applications',
      icon: ClipboardList,
      path: '/placement-officer/applications',
    },
  ]

  // =========================================================
  // SELECT ROLE NAVIGATION
  // =========================================================

  let items = candidateItems
  let workspaceLabel = 'Candidate Workspace'
  let navigationLabel = 'Candidate navigation'

  if (role === 'recruiter') {
    items = recruiterItems
    workspaceLabel = 'Recruiter Workspace'
    navigationLabel = 'Recruiter navigation'
  }

  if (role === 'placement_officer') {
    items = placementOfficerItems
    workspaceLabel = 'Placement Office'
    navigationLabel = 'Placement Officer navigation'
  }

  // =========================================================
  // ACTIONS
  // =========================================================

  function handleSignOut() {
    logout()
    window.location.href = '/login'
  }

  function handleSettings() {
    window.location.href = '/settings'
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <aside className="hs-sidebar">

      {/* =====================================================
          BRAND
      ====================================================== */}

      <div className="hs-sidebar-brand">

        <div
          className="hs-logo"
          title="HireSense"
          aria-label="HireSense"
        >
          <Sparkles
            size={18}
            strokeWidth={2.5}
          />
        </div>

        <div>
          <div className="hs-brand-name">
            HireSense
          </div>

          <div className="hs-brand-subtitle">
            {workspaceLabel}
          </div>
        </div>

      </div>

      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <nav
        className="hs-sidebar-nav"
        aria-label={navigationLabel}
      >

        <div className="hs-nav-label">
          Workspace
        </div>

        {items.map((item) => {
          const Icon = item.icon

          const currentPath =
            window.location.pathname

          /*
           * Exact matching for dashboard.
           *
           * For nested pages such as:
           * /candidate/jobs/123
           *
           * the parent navigation item remains active.
           */
          const isDashboard =
            item.path === '/candidate' ||
            item.path === '/recruiter' ||
            item.path === '/placement-officer'

          const isActive = isDashboard
            ? currentPath === item.path
            : currentPath === item.path ||
              currentPath.startsWith(
                `${item.path}/`
              )

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
                isActive
                  ? 'page'
                  : undefined
              }
            >
              <Icon size={18} />

              <span>
                {item.label}
              </span>
            </a>
          )
        })}

      </nav>

      {/* =====================================================
          BOTTOM ACTIONS
      ====================================================== */}

      <div className="hs-sidebar-bottom">

        <button
          type="button"
          className="hs-nav-item"
          onClick={handleSettings}
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={18} />

          <span>
            Settings
          </span>
        </button>

        <button
          type="button"
          className="hs-nav-item hs-logout"
          onClick={handleSignOut}
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={18} />

          <span>
            Sign out
          </span>
        </button>

        <div className="hs-sidebar-footer">

          <span>
            HireSense
          </span>

          <small>
            Placement Intelligence
          </small>

        </div>

      </div>

    </aside>
  )
}

export default Sidebar