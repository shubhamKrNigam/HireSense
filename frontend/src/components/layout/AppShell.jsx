import { Bell, Search } from 'lucide-react'
import Sidebar from './Sidebar'

function AppShell({
  children,
  role = 'candidate',
  userName = 'User',
}) {
  return (
    <div className="hs-app">
      <Sidebar role={role} />

      <div className="hs-main">
        <header className="hs-topbar">
          <div className="hs-search">
            <Search size={18} />

            <input
              type="text"
              placeholder={
                role === 'recruiter'
                  ? 'Search candidates, jobs...'
                  : 'Search jobs, skills...'
              }
            />
          </div>

          <div className="hs-topbar-right">
            <button className="hs-icon-button" aria-label="Notifications">
              <Bell size={19} />
              <span className="hs-notification-dot" />
            </button>

            <div className="hs-user">
              <div className="hs-avatar">
                {userName.charAt(0).toUpperCase()}
              </div>

              <div className="hs-user-info">
                <strong>{userName}</strong>
                <span>
                  {role === 'recruiter'
                    ? 'Recruiter'
                    : 'Candidate'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="hs-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppShell