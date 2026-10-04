import { useEffect, useRef, useState } from 'react'
import {
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
import NotificationBell from '../notifications/NotificationBell'

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

  // =========================================================
  // ROLE DETECTION
  // =========================================================

  const normalizedRole = String(role || '')
    .toLowerCase()
    .trim()

  const isCandidate =
    normalizedRole === 'candidate'

  const isRecruiter =
    normalizedRole === 'recruiter'

  const isPlacementOfficer =
    normalizedRole === 'placement_officer' ||
    normalizedRole === 'placement-officer' ||
    normalizedRole === 'placement officer'

  const isAdmin =
    normalizedRole === 'admin' ||
    normalizedRole === 'administrator'

  // =========================================================
  // PROFILE PATH
  // =========================================================

  const profilePath = isCandidate
    ? '/candidate/profile'
    : '/settings'

  // =========================================================
  // SEARCH PLACEHOLDER
  // =========================================================

  const searchPlaceholder = isCandidate
    ? 'Search jobs, skills...'
    : isRecruiter
      ? 'Search candidates, jobs...'
      : isPlacementOfficer
        ? 'Search candidates, drives...'
        : isAdmin
          ? 'Search users, jobs, companies...'
          : 'Search...'

  // =========================================================
  // ROLE LABEL
  // =========================================================

  const roleLabel = isCandidate
    ? 'Candidate'
    : isRecruiter
      ? 'Recruiter'
      : isPlacementOfficer
        ? 'Placement Officer'
        : isAdmin
          ? 'Administrator'
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

    // -------------------------------------------------------
    // EMPTY SEARCH
    // -------------------------------------------------------

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

      if (isAdmin) {
        navigate('/admin')
        return
      }

      navigate('/')
      return
    }

    // -------------------------------------------------------
    // ENCODE QUERY
    // -------------------------------------------------------

    const encodedQuery =
      encodeURIComponent(query)

    // -------------------------------------------------------
    // CANDIDATE SEARCH
    // -------------------------------------------------------

    if (isCandidate) {
      navigate(
        `/candidate/jobs?search=${encodedQuery}`
      )
      return
    }

    // -------------------------------------------------------
    // RECRUITER SEARCH
    // -------------------------------------------------------

    if (isRecruiter) {
      navigate(
        `/recruiter/applications?search=${encodedQuery}`
      )
      return
    }

    // -------------------------------------------------------
    // PLACEMENT OFFICER SEARCH
    // -------------------------------------------------------

    if (isPlacementOfficer) {
      navigate(
        `/placement-officer?search=${encodedQuery}`
      )
      return
    }

    // -------------------------------------------------------
    // ADMIN SEARCH
    // -------------------------------------------------------

    if (isAdmin) {
      navigate(
        `/admin?search=${encodedQuery}`
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
  // AVATAR INITIAL
  // =========================================================

  const avatarInitial =
    (userName || 'U')
      .charAt(0)
      .toUpperCase()

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

          {/* =================================================
              SEARCH
          ================================================== */}

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

          {/* =================================================
              TOPBAR RIGHT
          ================================================== */}

          <div className="hs-topbar-right">

            {/* ===============================================
                NOTIFICATION BELL

                IMPORTANT:
                NotificationBell handles:
                - bell icon
                - unread count
                - notification dropdown
                - mark as read
                - mark all as read
                - GET /notifications
                - GET /notifications/unread-count

                It is intentionally shared by every role.
            ================================================ */}

            <NotificationBell />

            {/* ===============================================
                USER MENU
            ================================================ */}

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

                {/* Avatar */}

                <div className="hs-avatar">
                  {avatarInitial}
                </div>

                {/* User information */}

                <div className="hs-user-info">

                  <strong>
                    {userName}
                  </strong>

                  <span>
                    {roleLabel}
                  </span>

                </div>

                {/* Dropdown arrow */}

                <ChevronDown
                  size={15}
                  className="hs-user-chevron"
                />

              </button>

              {/* =============================================
                  PROFILE DROPDOWN
              ============================================== */}

              {profileOpen && (
                <div
                  className="hs-profile-menu"
                  role="menu"
                >

                  {/* -----------------------------------------
                      PROFILE HEADER
                  ------------------------------------------ */}

                  <div className="hs-profile-menu-header">

                    <div className="hs-profile-menu-avatar">
                      {avatarInitial}
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

                  {/* -----------------------------------------
                      PROFILE
                  ------------------------------------------ */}

                  <button
                    type="button"
                    className="hs-profile-menu-item"
                    onClick={
                      openProfile
                    }
                    role="menuitem"
                  >

                    <UserRound size={16} />

                    <span>
                      {isCandidate
                        ? 'My Profile'
                        : 'My Account'}
                    </span>

                  </button>

                  {/* -----------------------------------------
                      SETTINGS
                  ------------------------------------------ */}

                  <button
                    type="button"
                    className="hs-profile-menu-item"
                    onClick={
                      openSettings
                    }
                    role="menuitem"
                  >

                    <Settings size={16} />

                    <span>
                      Settings
                    </span>

                  </button>

                  <div className="hs-profile-menu-divider" />

                  {/* -----------------------------------------
                      SIGN OUT
                  ------------------------------------------ */}

                  <button
                    type="button"
                    className="hs-profile-menu-item hs-profile-menu-signout"
                    onClick={
                      handleSignOut
                    }
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