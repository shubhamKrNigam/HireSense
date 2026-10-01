import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  ChevronDown,
  Search,
  Settings,
  UserRound,
  LogOut,
} from 'lucide-react'
import {
  useLocation,
  useNavigate,
} from 'react-router-dom'

import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'

function AppShell({
  children,
  role = 'candidate',
  userName = 'User',
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  const [searchValue, setSearchValue] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)

  const profileRef = useRef(null)

  const isCandidate = role === 'candidate'
  const isRecruiter = role === 'recruiter'
  const isPlacementOfficer =
    role === 'placement_officer'

  // =========================================================
  // ROLE CONFIGURATION
  // =========================================================

  const profilePath = isCandidate
    ? '/candidate/profile'
    : '/settings'

  const searchPlaceholder = isCandidate
    ? 'Search jobs, skills...'
    : isRecruiter
      ? 'Search candidates, jobs...'
      : isPlacementOfficer
        ? 'Search candidates, drives...'
        : 'Search...'

  const roleLabel = isCandidate
    ? 'Candidate'
    : isRecruiter
      ? 'Recruiter'
      : isPlacementOfficer
        ? 'Placement Officer'
        : 'User'

  // =========================================================
  // KEEP SEARCH IN SYNC WITH URL
  // =========================================================

  useEffect(() => {
    const params = new URLSearchParams(
      location.search
    )

    setSearchValue(
      params.get('search') || ''
    )
  }, [
    location.pathname,
    location.search,
  ])

  // =========================================================
  // CLOSE PROFILE MENU
  // =========================================================

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target
        )
      ) {
        setProfileOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setProfileOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    )

    document.addEventListener(
      'keydown',
      handleEscape
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      )

      document.removeEventListener(
        'keydown',
        handleEscape
      )
    }
  }, [])

  // =========================================================
  // SEARCH
  // =========================================================

  function handleSearchSubmit(event) {
    event.preventDefault()

    const query = searchValue.trim()

    // Empty search
    if (!query) {
      if (isCandidate) {
        navigate('/candidate/jobs')
        return
      }

      if (isRecruiter) {
        navigate('/recruiter/applications')
        return
      }

      if (isPlacementOfficer) {
        navigate('/placement-officer')
        return
      }

      navigate('/')
      return
    }

    const encodedQuery =
      encodeURIComponent(query)

    // Candidate search
    if (isCandidate) {
      navigate(
        `/candidate/jobs?search=${encodedQuery}`
      )
      return
    }

    // Recruiter search
    if (isRecruiter) {
      navigate(
        `/recruiter/applications?search=${encodedQuery}`
      )
      return
    }

    // Placement Officer search
    if (isPlacementOfficer) {
      navigate(
        `/placement-officer?search=${encodedQuery}`
      )
      return
    }

    navigate('/')
  }

  // =========================================================
  // PROFILE MENU
  // =========================================================

  function handleProfileClick() {
    setProfileOpen(
      (current) => !current
    )
  }

  function openProfile() {
    setProfileOpen(false)
    navigate(profilePath)
  }

  function openSettings() {
    setProfileOpen(false)
    navigate('/settings')
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  function handleSignOut() {
    setProfileOpen(false)

    logout()

    navigate('/login', {
      replace: true,
    })
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="hs-app">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <Sidebar role={role} />

      <div className="hs-main">

        {/* ===================================================
            TOPBAR
        ==================================================== */}

        <header className="hs-topbar">

          <form
            className="hs-search"
            onSubmit={handleSearchSubmit}
            role="search"
          >
            <Search size={18} />

            <input
              type="search"
              value={searchValue}
              onChange={(event) =>
                setSearchValue(
                  event.target.value
                )
              }
              placeholder={
                searchPlaceholder
              }
              aria-label={
                searchPlaceholder
              }
            />
          </form>

          <div className="hs-topbar-right">

            {/* Notifications */}

            <button
              type="button"
              className="hs-icon-button"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={19} />

              <span className="hs-notification-dot" />
            </button>

            {/* User Menu */}

            <div
              className="hs-user-menu"
              ref={profileRef}
            >

              <button
                type="button"
                className={`hs-user hs-user-trigger ${
                  profileOpen
                    ? 'is-open'
                    : ''
                }`}
                onClick={
                  handleProfileClick
                }
                aria-expanded={
                  profileOpen
                }
                aria-haspopup="menu"
                aria-label="Open profile menu"
              >

                <div className="hs-avatar">
                  {(userName || 'U')
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="hs-user-info">

                  <strong>
                    {userName}
                  </strong>

                  <span>
                    {roleLabel}
                  </span>

                </div>

                <ChevronDown
                  size={15}
                  className="hs-user-chevron"
                />

              </button>

              {profileOpen && (
                <div
                  className="hs-profile-menu"
                  role="menu"
                >

                  <div className="hs-profile-menu-header">

                    <div className="hs-profile-menu-avatar">
                      {(userName || 'U')
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>

                      <strong>
                        {userName}
                      </strong>

                      <span>
                        {roleLabel}
                      </span>

                    </div>

                  </div>

                  <div className="hs-profile-menu-divider" />

                  {/* Profile */}

                  <button
                    type="button"
                    className="hs-profile-menu-item"
                    onClick={openProfile}
                    role="menuitem"
                  >
                    <UserRound size={16} />

                    <span>
                      {isCandidate
                        ? 'My Profile'
                        : 'My Account'}
                    </span>
                  </button>

                  {/* Settings */}

                  <button
                    type="button"
                    className="hs-profile-menu-item"
                    onClick={openSettings}
                    role="menuitem"
                  >
                    <Settings size={16} />

                    <span>
                      Settings
                    </span>
                  </button>

                  <div className="hs-profile-menu-divider" />

                  {/* Sign out */}

                  <button
                    type="button"
                    className="hs-profile-menu-item hs-profile-menu-signout"
                    onClick={handleSignOut}
                    role="menuitem"
                  >
                    <LogOut size={16} />

                    <span>
                      Sign out
                    </span>
                  </button>

                </div>
              )}

            </div>

          </div>

        </header>

        {/* ===================================================
            PAGE CONTENT
        ==================================================== */}

        <main className="hs-content">
          {children}
        </main>

      </div>

    </div>
  )
}

export default AppShell