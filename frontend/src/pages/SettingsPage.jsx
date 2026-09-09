import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  LogOut,
  ShieldCheck,
  UserRound,
  LockKeyhole,
  Save,
  X,
} from 'lucide-react'

import {
  Navigate,
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import api from '../services/api'


const ROLE_OPTIONS = [
  'Data Analyst',
  'Data Scientist',
  'Machine Learning Engineer',
  'Backend Developer',
  'Software Engineer',
  'Full Stack Developer',
]

const LOCATION_OPTIONS = [
  'Bengaluru',
  'Hyderabad',
  'Delhi NCR',
  'Mumbai',
  'Pune',
  'Chennai',
  'Remote',
]

const WORK_MODE_OPTIONS = [
  'Remote',
  'Hybrid',
  'On-site',
]

const EMPLOYMENT_OPTIONS = [
  'Internship',
  'Full-time',
  'Part-time',
]

const EXPERIENCE_OPTIONS = [
  'Entry Level',
  'Junior',
  'Mid Level',
]


function SettingsPage() {
  const navigate = useNavigate()

  const {
    user,
    loading,
    isAuthenticated,
    logout,
  } = useAuth()


  // =========================================================
  // PASSWORD STATE
  // =========================================================

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false)

  const [showNewPassword, setShowNewPassword] =
    useState(false)

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  const [currentPassword, setCurrentPassword] =
    useState('')

  const [newPassword, setNewPassword] =
    useState('')

  const [confirmPassword, setConfirmPassword] =
    useState('')

  const [passwordLoading, setPasswordLoading] =
    useState(false)

  const [passwordError, setPasswordError] =
    useState('')

  const [passwordSuccess, setPasswordSuccess] =
    useState('')


  const [isAccountEditOpen, setIsAccountEditOpen] = useState(false)
  const [accountForm, setAccountForm] = useState({ name: '', email: '' })
  const [accountSaving, setAccountSaving] = useState(false)
  const [accountError, setAccountError] = useState('')
  const [accountSuccess, setAccountSuccess] = useState('')


  // =========================================================
  // AUTH / NAVIGATION
  // =========================================================

  if (loading) {
    return (
      <div className="hs-settings-loading">
        Loading settings...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }


  function goBack() {
    if (user?.role === 'recruiter') {
      navigate('/recruiter')
      return
    }

    navigate('/candidate')
  }


  function handleSignOut() {
    logout()
    navigate('/login', { replace: true })
  }


  function openAccountEditor() {
    setAccountForm({ name: user?.name || '', email: user?.email || '' })
    setAccountError('')
    setAccountSuccess('')
    setIsAccountEditOpen(true)
  }

  function closeAccountEditor() {
    if (accountSaving) return
    setIsAccountEditOpen(false)
    setAccountError('')
    setAccountSuccess('')
  }

  function handleAccountChange(event) {
    const { name, value } = event.target
    setAccountForm((previous) => ({ ...previous, [name]: value }))
  }

  async function handleSaveAccount(event) {
    event.preventDefault()
    setAccountError('')
    setAccountSuccess('')

    const name = accountForm.name.trim()
    const email = accountForm.email.trim()

    if (!name) {
      setAccountError('Name is required.')
      return
    }

    if (!email) {
      setAccountError('Email is required.')
      return
    }

    try {
      setAccountSaving(true)
      const response = await api.put('/account/me', { name, email })
      setAccountForm({
        name: response.data.name || name,
        email: response.data.email || email,
      })
      setAccountSuccess('Account details updated successfully.')
      setTimeout(() => window.location.reload(), 700)
    } catch (error) {
      setAccountError(
        error?.response?.data?.detail ||
        'Unable to update your account details. Please try again.'
      )
    } finally {
      setAccountSaving(false)
    }
  }


  function goToResume() {
    navigate('/candidate/resume')
  }


  // =========================================================
  // PASSWORD
  // =========================================================

  async function handleChangePassword(event) {
    event.preventDefault()

    setPasswordError('')
    setPasswordSuccess('')

    if (!currentPassword) {
      setPasswordError(
        'Please enter your current password.'
      )
      return
    }

    if (!newPassword) {
      setPasswordError(
        'Please enter a new password.'
      )
      return
    }

    if (newPassword.length < 8) {
      setPasswordError(
        'New password must contain at least 8 characters.'
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        'New password and confirmation do not match.'
      )
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        'New password must be different from your current password.'
      )
      return
    }

    try {
      setPasswordLoading(true)

      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setPasswordSuccess(
        'Password changed successfully.'
      )
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        'Unable to change password. Please try again.'

      setPasswordError(message)
    } finally {
      setPasswordLoading(false)
    }
  }


  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="hs-settings-page">

      <main className="hs-settings-container">

        {/* ===================================================
            HEADER
            =================================================== */}

        <header className="hs-settings-header">

          <button
            type="button"
            className="hs-settings-back"
            onClick={goBack}
          >
            <ArrowLeft size={17} />
            Back to workspace
          </button>

          <div className="hs-settings-title-row">

            <div className="hs-settings-icon">
              <LockKeyhole size={22} />
            </div>

            <div>
              <h1>Settings</h1>

              <p>
                Manage your account, security and session settings.
              </p>
            </div>

          </div>

        </header>


        {/* ===================================================
            ACCOUNT
            =================================================== */}

        <section className="hs-settings-card">

          <div className="hs-settings-card-header">

            <div className="hs-settings-section-icon account">
              <UserRound size={18} />
            </div>

            <div>
              <h2>Account</h2>

              <p>
                Your current HireSense account information.
              </p>
            </div>

          </div>


          <div className="hs-account-grid">

            <div className="hs-account-item">
              <span>Name</span>

              <strong>
                {user?.name || 'Not available'}
              </strong>
            </div>


            <div className="hs-account-item">
              <span>Email</span>

              <strong>
                {user?.email || 'Not available'}
              </strong>
            </div>


            <div className="hs-account-item">
              <span>Role</span>

              <strong className="hs-role-value">
                {user?.role || 'Not available'}
              </strong>
            </div>

          </div>


          <div className="hs-settings-action-line">

            <div>
              <strong>Account details</strong>

              <span>
                Edit the name and email associated with your HireSense account. This is separate from your candidate profile.
              </span>
            </div>

            <button
              type="button"
              className="hs-settings-secondary-btn"
              onClick={openAccountEditor}
            >
              <UserRound size={15} />
              Edit account
            </button>

          </div>

        </section>


        {/* ===================================================
            SECURITY
            =================================================== */}

        <section className="hs-settings-card">

          <div className="hs-settings-card-header">

            <div className="hs-settings-section-icon security">
              <ShieldCheck size={18} />
            </div>

            <div>
              <h2>Security</h2>

              <p>
                Protect your account with a strong password.
              </p>
            </div>

          </div>


          <form
            className="hs-password-form"
            onSubmit={handleChangePassword}
          >

            <div className="hs-password-grid">

              {/* Current password */}

              <div className="hs-field">

                <label htmlFor="current-password">
                  Current password
                </label>

                <div className="hs-password-input-wrap">

                  <input
                    id="current-password"
                    type={
                      showCurrentPassword
                        ? 'text'
                        : 'password'
                    }
                    value={currentPassword}
                    onChange={(event) =>
                      setCurrentPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="hs-password-eye"
                    onClick={() =>
                      setShowCurrentPassword(
                        (value) => !value
                      )
                    }
                    aria-label={
                      showCurrentPassword
                        ? 'Hide current password'
                        : 'Show current password'
                    }
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>

                </div>

              </div>


              {/* New password */}

              <div className="hs-field">

                <label htmlFor="new-password">
                  New password
                </label>

                <div className="hs-password-input-wrap">

                  <input
                    id="new-password"
                    type={
                      showNewPassword
                        ? 'text'
                        : 'password'
                    }
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(
                        event.target.value
                      )
                    }
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="hs-password-eye"
                    onClick={() =>
                      setShowNewPassword(
                        (value) => !value
                      )
                    }
                    aria-label={
                      showNewPassword
                        ? 'Hide new password'
                        : 'Show new password'
                    }
                  >
                    {showNewPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>

                </div>

              </div>


              {/* Confirm password */}

              <div className="hs-field">

                <label htmlFor="confirm-password">
                  Confirm new password
                </label>

                <div className="hs-password-input-wrap">

                  <input
                    id="confirm-password"
                    type={
                      showConfirmPassword
                        ? 'text'
                        : 'password'
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="hs-password-eye"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? 'Hide password confirmation'
                        : 'Show password confirmation'
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>

                </div>

              </div>

            </div>


            <div className="hs-password-footer">

              <div className="hs-password-hint">
                <KeyRound size={14} />
                Use at least 8 characters for your new
                password.
              </div>

              <button
                type="submit"
                className="hs-settings-primary-btn"
                disabled={passwordLoading}
              >
                {passwordLoading
                  ? 'Changing...'
                  : 'Change password'}
              </button>

            </div>


            {passwordError && (
              <div className="hs-settings-alert error">
                {passwordError}
              </div>
            )}


            {passwordSuccess && (
              <div className="hs-settings-alert success">
                <CheckCircle2 size={16} />
                {passwordSuccess}
              </div>
            )}

          </form>

        </section>


        {/* ===================================================
            RESUME
            =================================================== */}

        <section className="hs-settings-card hs-settings-row-card">

          <div className="hs-settings-card-header">

            <div className="hs-settings-section-icon resume">
              <FileText size={18} />
            </div>

            <div>
              <h2>Resume & Profile</h2>

              <p>
                Manage the resume used by HireSense for
                matching and recommendations.
              </p>
            </div>

          </div>

          <button
            type="button"
            className="hs-settings-secondary-btn"
            onClick={goToResume}
          >
            <FileText size={15} />
            Manage resume
          </button>

        </section>


        {/* ===================================================
            NOTIFICATIONS
            =================================================== */}

        <section className="hs-settings-card">

          <div className="hs-settings-card-header">

            <div className="hs-settings-section-icon notification">
              <Bell size={18} />
            </div>

            <div>
              <h2>Notifications</h2>

              <p>
                Control which HireSense updates you receive.
              </p>
            </div>

            <span className="hs-planned-badge">
              Planned
            </span>

          </div>


          <div className="hs-notification-preview">

            <div>
              <strong>Application updates</strong>

              <span>
                Status changes from recruiters
              </span>
            </div>


            <div>
              <strong>Job recommendations</strong>

              <span>
                New opportunities matching your profile
              </span>
            </div>


            <div>
              <strong>Recruiter activity</strong>

              <span>
                Relevant activity involving your profile
              </span>
            </div>

          </div>

        </section>


        {/* ===================================================
            PRIVACY
            =================================================== */}

        <section className="hs-settings-card hs-settings-row-card">

          <div className="hs-settings-card-header">

            <div className="hs-settings-section-icon privacy">
              <ShieldCheck size={18} />
            </div>

            <div>
              <h2>Privacy & Data</h2>

              <p>
                Profile visibility and data-management
                controls will be available here.
              </p>
            </div>

          </div>

          <span className="hs-planned-badge">
            Planned
          </span>

        </section>


        {/* ===================================================
            SESSION
            =================================================== */}

        <section className="hs-settings-card hs-session-card">

          <div>

            <h2>Current Session</h2>

            <p>
              You are currently signed in as{' '}
              <strong>
                {user?.email}
              </strong>
            </p>

          </div>


          <div className="hs-session-actions">

            <span className="hs-session-active">
              <span />
              Active
            </span>


            <button
              type="button"
              className="hs-settings-signout"
              onClick={handleSignOut}
            >
              <LogOut size={16} />
              Sign out
            </button>

          </div>

        </section>


        {isAccountEditOpen && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '24px', background: 'rgba(42,35,56,.42)',
              backdropFilter: 'blur(5px)',
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-account-title"
              style={{
                width: 'min(620px, 100%)', background: '#fff',
                border: '1px solid #eee8f5', borderRadius: '22px',
                boxShadow: '0 24px 70px rgba(45,35,70,.20)', padding: '26px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'flex-start', paddingBottom: '20px', borderBottom: '1px solid #eee9f3' }}>
                <div>
                  <span style={{ fontSize: '10px', letterSpacing: '.12em', fontWeight: 800, color: '#7665b7' }}>ACCOUNT</span>
                  <h2 id="edit-account-title" style={{ margin: '5px 0 6px', fontSize: '24px', color: '#292333' }}>Edit account</h2>
                  <p style={{ margin: 0, color: '#8c8498', fontSize: '13px', lineHeight: 1.5 }}>Update the details used for your HireSense account.</p>
                </div>
                <button type="button" onClick={closeAccountEditor} disabled={accountSaving} aria-label="Close account editor" style={{ width: '38px', height: '38px', border: '1px solid #e7e1ee', borderRadius: '11px', background: '#faf8fd', color: '#665c70', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAccount} style={{ paddingTop: '22px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '18px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 750, color: '#504858' }}>Account name</span>
                    <input type="text" name="name" value={accountForm.name} onChange={handleAccountChange} placeholder="Enter your account name" disabled={accountSaving} autoComplete="name" style={{ width: '100%', minHeight: '48px', boxSizing: 'border-box', border: '1px solid #ded7e8', borderRadius: '12px', padding: '0 14px', font: 'inherit', color: '#302a38', outline: 'none' }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 750, color: '#504858' }}>Email address</span>
                    <input type="email" name="email" value={accountForm.email} onChange={handleAccountChange} placeholder="Enter your email address" disabled={accountSaving} autoComplete="email" style={{ width: '100%', minHeight: '48px', boxSizing: 'border-box', border: '1px solid #ded7e8', borderRadius: '12px', padding: '0 14px', font: 'inherit', color: '#302a38', outline: 'none' }} />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '5px 12px', alignItems: 'center', marginTop: '18px', padding: '14px 16px', border: '1px solid #eee8f4', borderRadius: '13px', background: '#faf8fd' }}>
                  <span style={{ fontSize: '12px', fontWeight: 750, color: '#504858' }}>Role</span>
                  <strong style={{ justifySelf: 'end', fontSize: '12px', color: '#6251a4', textTransform: 'capitalize' }}>{user?.role || 'Not available'}</strong>
                  <small style={{ gridColumn: '1 / -1', color: '#8d8598', fontSize: '11px' }}>Your account role is controlled by HireSense and cannot be changed here.</small>
                </div>

                {accountError && <div style={{ marginTop: '16px', padding: '11px 13px', borderRadius: '11px', background: '#fff3f3', border: '1px solid #f0d1d1', color: '#a14444', fontSize: '12px' }}>{accountError}</div>}
                {accountSuccess && <div style={{ marginTop: '16px', padding: '11px 13px', borderRadius: '11px', background: '#f1fbf5', border: '1px solid #cfead9', color: '#397450', fontSize: '12px' }}>{accountSuccess}</div>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
                  <button type="button" onClick={closeAccountEditor} disabled={accountSaving} className="hs-settings-secondary-btn">Cancel</button>
                  <button type="submit" disabled={accountSaving} className="hs-settings-primary-btn"><Save size={16} />{accountSaving ? 'Saving...' : 'Save account'}</button>
                </div>
              </form>
            </div>
          </div>
        )}


        <footer className="hs-settings-footer">
          HireSense • Placement Intelligence
        </footer>

      </main>

    </div>
  )
}


export default SettingsPage