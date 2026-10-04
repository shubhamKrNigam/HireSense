import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Globe,
  KeyRound,
  LogOut,
  MapPin,
  Save,
  ShieldCheck,
  UserRound,
  LockKeyhole,
  X,
  Building2,
  Pencil,
  Plus,
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


  // =========================================================
  // ACCOUNT STATE
  // =========================================================

  const [isAccountEditOpen, setIsAccountEditOpen] =
    useState(false)

  const [accountForm, setAccountForm] =
    useState({
      name: '',
      email: '',
      position: '',
    })

  const [accountSaving, setAccountSaving] =
    useState(false)

  const [accountError, setAccountError] =
    useState('')

  const [accountSuccess, setAccountSuccess] =
    useState('')


  // =========================================================
  // COMPANY STATE
  // Recruiters only
  // =========================================================

  const [company, setCompany] =
    useState(null)

  const [companyLoading, setCompanyLoading] =
    useState(false)

  const [companyError, setCompanyError] =
    useState('')

  const [companySuccess, setCompanySuccess] =
    useState('')

  const [isCompanyEditOpen, setIsCompanyEditOpen] =
    useState(false)

  const [companySaving, setCompanySaving] =
    useState(false)

  const [companyForm, setCompanyForm] =
    useState({
      name: '',
      industry: '',
      location: '',
      website: '',
    })


  // =========================================================
  // LOAD RECRUITER COMPANY
  // =========================================================

  useEffect(() => {
    if (!user || user.role !== 'recruiter') {
      return
    }

    let cancelled = false

    async function loadCompany() {
      setCompanyLoading(true)
      setCompanyError('')
      setCompanySuccess('')

      try {
        const response = await api.get(
          '/companies/my-company',
        )

        if (!cancelled) {
          setCompany(response.data)
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        /*
         * 404 simply means the recruiter has
         * not created a company profile yet.
         */

        if (error?.response?.status === 404) {
          setCompany(null)
          setCompanyError('')
        } else {
          setCompanyError(
            error?.response?.data?.detail ||
            'Unable to load your company profile.',
          )
        }
      } finally {
        if (!cancelled) {
          setCompanyLoading(false)
        }
      }
    }

    loadCompany()

    return () => {
      cancelled = true
    }
  }, [user])


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
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }


  function goBack() {
    switch (user?.role) {
      case 'candidate':
        navigate('/candidate')
        break

      case 'recruiter':
        navigate('/recruiter')
        break

      case 'placement_officer':
        navigate('/placement-officer')
        break

      case 'admin':
        navigate('/admin')
        break

      default:
        navigate('/login')
        break
    }
  }


  function handleSignOut() {
    logout()

    navigate('/login', {
      replace: true,
    })
  }


  // =========================================================
  // ACCOUNT
  // =========================================================

  function openAccountEditor() {
    setAccountForm({
      name: user?.name || '',
      email: user?.email || '',
      position: user?.position || '',
    })

    setAccountError('')
    setAccountSuccess('')
    setIsAccountEditOpen(true)
  }


  function closeAccountEditor() {
    if (accountSaving) {
      return
    }

    setIsAccountEditOpen(false)
    setAccountError('')
    setAccountSuccess('')
  }


  function handleAccountChange(event) {
    const {
      name,
      value,
    } = event.target

    setAccountForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }


  async function handleSaveAccount(event) {
    event.preventDefault()

    setAccountError('')
    setAccountSuccess('')

    const name = accountForm.name.trim()
    const email = accountForm.email.trim()
    const position = accountForm.position.trim()

    if (!name) {
      setAccountError(
        'Name is required.',
      )
      return
    }

    if (!email) {
      setAccountError(
        'Email is required.',
      )
      return
    }

    try {
      setAccountSaving(true)

      const payload = {
        name,
        email,
      }

      /*
       * Position is a recruiter-specific field.
       */
      if (user?.role === 'recruiter') {
        payload.position = position || null
      }

      const response = await api.put(
        '/account/me',
        payload,
      )

      setAccountForm({
        name:
          response.data.name ||
          name,

        email:
          response.data.email ||
          email,

        position:
          response.data.position ||
          position ||
          '',
      })

      setAccountSuccess(
        'Account details updated successfully.',
      )

      setTimeout(
        () => window.location.reload(),
        700,
      )
    } catch (error) {
      setAccountError(
        error?.response?.data?.detail ||
        'Unable to update your account details. Please try again.',
      )
    } finally {
      setAccountSaving(false)
    }
  }


  // =========================================================
  // RESUME
  // Candidate only
  // =========================================================

  function goToResume() {
    navigate('/candidate/resume')
  }


  // =========================================================
  // COMPANY
  // Recruiter only
  // =========================================================

  function openCompanyEditor() {
    setCompanyError('')
    setCompanySuccess('')

    setCompanyForm({
      name: company?.name || '',
      industry: company?.industry || '',
      location: company?.location || '',
      website: company?.website || '',
    })

    setIsCompanyEditOpen(true)
  }


  function closeCompanyEditor() {
    if (companySaving) {
      return
    }

    setIsCompanyEditOpen(false)
    setCompanyError('')
    setCompanySuccess('')
  }


  function handleCompanyChange(event) {
    const {
      name,
      value,
    } = event.target

    setCompanyForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }


  async function handleSaveCompany(event) {
    event.preventDefault()

    setCompanyError('')
    setCompanySuccess('')

    const name = companyForm.name.trim()
    const industry = companyForm.industry.trim()
    const location = companyForm.location.trim()
    const website = companyForm.website.trim()

    if (!name) {
      setCompanyError(
        'Company name is required.',
      )
      return
    }

    if (!industry) {
      setCompanyError(
        'Industry is required.',
      )
      return
    }

    if (!location) {
      setCompanyError(
        'Location is required.',
      )
      return
    }

    try {
      setCompanySaving(true)

      const payload = {
        name,
        industry,
        location,
        website: website || null,
      }

      let response

      /*
       * Existing company:
       * update it.
       */

      if (company) {
        response = await api.put(
          '/companies/my-company',
          payload,
        )

        setCompanySuccess(
          'Company profile updated successfully.',
        )
      } else {
        /*
         * No company:
         * create it.
         */

        response = await api.post(
          '/companies/',
          payload,
        )

        setCompanySuccess(
          'Company profile created successfully.',
        )
      }

      setCompany(response.data)

      setCompanyForm({
        name: response.data.name || name,
        industry:
          response.data.industry ||
          industry,
        location:
          response.data.location ||
          location,
        website:
          response.data.website ||
          website,
      })

      setIsCompanyEditOpen(false)
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        'Unable to save your company profile. Please try again.'

      setCompanyError(
        Array.isArray(message)
          ? message
              .map((item) => item.msg)
              .join(', ')
          : message,
      )
    } finally {
      setCompanySaving(false)
    }
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
        'Please enter your current password.',
      )
      return
    }

    if (!newPassword) {
      setPasswordError(
        'Please enter a new password.',
      )
      return
    }

    if (newPassword.length < 8) {
      setPasswordError(
        'New password must contain at least 8 characters.',
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        'New password and confirmation do not match.',
      )
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        'New password must be different from your current password.',
      )
      return
    }

    try {
      setPasswordLoading(true)

      await api.post(
        '/auth/change-password',
        {
          current_password:
            currentPassword,

          new_password:
            newPassword,
        },
      )

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setPasswordSuccess(
        'Password changed successfully.',
      )
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        'Unable to change your password. Please try again.'

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


            {user?.role === 'recruiter' && (
              <div className="hs-account-item">
                <span>Position</span>

                <strong>
                  {user?.position || 'Not specified'}
                </strong>
              </div>
            )}


            <div className="hs-account-item">
              <span>Role</span>

              <strong className="hs-role-value">
                {user?.role || 'Not available'}
              </strong>
            </div>

          </div>


          <div className="hs-settings-action-line">

            <div>
              <strong>
                Account details
              </strong>

              <span>
                Update your account information
                {user?.role === 'recruiter'
                  ? ' and recruiter position.'
                  : '.'}
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
            COMPANY PROFILE
            RECRUITER ONLY
        =================================================== */}

        {user?.role === 'recruiter' && (
          <section className="hs-settings-card">

            <div className="hs-settings-card-header">

              <div className="hs-settings-section-icon account">
                <Building2 size={18} />
              </div>

              <div>
                <h2>Company Profile</h2>

                <p>
                  Manage the company associated with your recruiter account.
                </p>
              </div>

            </div>


            {companyLoading ? (
              <div
                style={{
                  padding: '18px 0',
                  color: '#8c8498',
                  fontSize: '13px',
                }}
              >
                Loading company profile...
              </div>
            ) : company ? (

              <div
                style={{
                  border: '1px solid #eee8f4',
                  borderRadius: '16px',
                  padding: '20px',
                  background: '#faf8fd',
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '20px',
                  }}
                >

                  <div
                    style={{
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'flex-start',
                    }}
                  >

                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        display: 'grid',
                        placeItems: 'center',
                        background: '#eeeafd',
                        color: '#6653a8',
                        flexShrink: 0,
                      }}
                    >
                      <Building2 size={20} />
                    </div>


                    <div>

                      <strong
                        style={{
                          display: 'block',
                          fontSize: '16px',
                          color: '#302a38',
                          marginBottom: '5px',
                        }}
                      >
                        {company.name}
                      </strong>


                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px',
                          color: '#81788e',
                          fontSize: '12px',
                        }}
                      >

                        {company.industry && (
                          <span>
                            {company.industry}
                          </span>
                        )}

                        {company.location && (
                          <span>
                            • {company.location}
                          </span>
                        )}

                      </div>


                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            marginTop: '8px',
                            color: '#6653a8',
                            fontSize: '12px',
                            textDecoration: 'none',
                          }}
                        >
                          <Globe size={13} />
                          {company.website}
                        </a>
                      )}

                    </div>

                  </div>


                  <button
                    type="button"
                    className="hs-settings-secondary-btn"
                    onClick={openCompanyEditor}
                  >
                    <Pencil size={15} />
                    Edit company
                  </button>

                </div>

              </div>

            ) : (

              <div
                style={{
                  border: '1px dashed #dcd4e8',
                  borderRadius: '16px',
                  padding: '22px',
                  background: '#fcfbfe',
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '18px',
                  }}
                >

                  <div>

                    <strong
                      style={{
                        display: 'block',
                        color: '#302a38',
                        marginBottom: '5px',
                      }}
                    >
                      No company profile found
                    </strong>

                    <span
                      style={{
                        color: '#8c8498',
                        fontSize: '12px',
                        lineHeight: 1.5,
                      }}
                    >
                      Add your company details before creating
                      or managing recruiter jobs.
                    </span>

                  </div>


                  <button
                    type="button"
                    className="hs-settings-primary-btn"
                    onClick={openCompanyEditor}
                  >
                    <Plus size={16} />
                    Add company
                  </button>

                </div>

              </div>

            )}


            {companyError && (
              <div
                className="hs-settings-alert error"
                style={{
                  marginTop: '16px',
                }}
              >
                {companyError}
              </div>
            )}


            {companySuccess && (
              <div
                className="hs-settings-alert success"
                style={{
                  marginTop: '16px',
                }}
              >
                <CheckCircle2 size={16} />
                {companySuccess}
              </div>
            )}

          </section>
        )}


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
                        event.target.value,
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
                        (value) => !value,
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
                        event.target.value,
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
                        (value) => !value,
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
                        event.target.value,
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
                        (value) => !value,
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
            RESUME & PROFILE
            CANDIDATE ONLY
        =================================================== */}

        {user?.role === 'candidate' && (
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
        )}


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
              <strong>
                Application updates
              </strong>

              <span>
                Status changes from recruiters
              </span>
            </div>


            <div>
              <strong>
                Job recommendations
              </strong>

              <span>
                New opportunities matching your profile
              </span>
            </div>


            <div>
              <strong>
                Recruiter activity
              </strong>

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
              <h2>
                Privacy & Data
              </h2>

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

            <h2>
              Current Session
            </h2>

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


        {/* ===================================================
            EDIT ACCOUNT MODAL
        =================================================== */}

        {isAccountEditOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              background: 'rgba(42,35,56,.42)',
              backdropFilter: 'blur(5px)',
            }}
          >

            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-account-title"
              style={{
                width: 'min(620px, 100%)',
                maxHeight: '90vh',
                overflowY: 'auto',
                background: '#fff',
                border: '1px solid #eee8f5',
                borderRadius: '22px',
                boxShadow:
                  '0 24px 70px rgba(45,35,70,.20)',
                padding: '26px',
              }}
            >

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '20px',
                  alignItems: 'flex-start',
                  paddingBottom: '20px',
                  borderBottom:
                    '1px solid #eee9f3',
                }}
              >

                <div>

                  <span
                    style={{
                      fontSize: '10px',
                      letterSpacing: '.12em',
                      fontWeight: 800,
                      color: '#7665b7',
                    }}
                  >
                    ACCOUNT
                  </span>

                  <h2
                    id="edit-account-title"
                    style={{
                      margin:
                        '5px 0 6px',
                      fontSize: '24px',
                      color: '#292333',
                    }}
                  >
                    Edit account
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      color: '#8c8498',
                      fontSize: '13px',
                      lineHeight: 1.5,
                    }}
                  >
                    Update the details used for your
                    HireSense account.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={closeAccountEditor}
                  disabled={accountSaving}
                  aria-label="Close account editor"
                  style={{
                    width: '38px',
                    height: '38px',
                    border:
                      '1px solid #e7e1ee',
                    borderRadius: '11px',
                    background: '#faf8fd',
                    color: '#665c70',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>

              </div>


              <form
                onSubmit={handleSaveAccount}
                style={{
                  paddingTop: '22px',
                }}
              >

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(2,minmax(0,1fr))',
                    gap: '18px',
                  }}
                >

                  {/* NAME */}

                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >

                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 750,
                        color: '#504858',
                      }}
                    >
                      Account name
                    </span>

                    <input
                      type="text"
                      name="name"
                      value={accountForm.name}
                      onChange={handleAccountChange}
                      placeholder="Enter your account name"
                      disabled={accountSaving}
                      autoComplete="name"
                      style={{
                        width: '100%',
                        minHeight: '48px',
                        boxSizing: 'border-box',
                        border:
                          '1px solid #ded7e8',
                        borderRadius: '12px',
                        padding: '0 14px',
                        font: 'inherit',
                        color: '#302a38',
                        outline: 'none',
                      }}
                    />

                  </label>


                  {/* EMAIL */}

                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >

                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 750,
                        color: '#504858',
                      }}
                    >
                      Email address
                    </span>

                    <input
                      type="email"
                      name="email"
                      value={accountForm.email}
                      onChange={handleAccountChange}
                      placeholder="Enter your email address"
                      disabled={accountSaving}
                      autoComplete="email"
                      style={{
                        width: '100%',
                        minHeight: '48px',
                        boxSizing: 'border-box',
                        border:
                          '1px solid #ded7e8',
                        borderRadius: '12px',
                        padding: '0 14px',
                        font: 'inherit',
                        color: '#302a38',
                        outline: 'none',
                      }}
                    />

                  </label>

                </div>


                {/* RECRUITER POSITION */}

                {user?.role === 'recruiter' && (
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      marginTop: '18px',
                    }}
                  >

                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 750,
                        color: '#504858',
                      }}
                    >
                      Position
                    </span>

                    <input
                      type="text"
                      name="position"
                      value={accountForm.position}
                      onChange={handleAccountChange}
                      placeholder="e.g. HR, Talent Acquisition Manager"
                      disabled={accountSaving}
                      autoComplete="organization-title"
                      style={{
                        width: '100%',
                        minHeight: '48px',
                        boxSizing: 'border-box',
                        border:
                          '1px solid #ded7e8',
                        borderRadius: '12px',
                        padding: '0 14px',
                        font: 'inherit',
                        color: '#302a38',
                        outline: 'none',
                      }}
                    />

                    <small
                      style={{
                        color: '#8d8598',
                        fontSize: '11px',
                      }}
                    >
                      This is your position at the company.
                    </small>

                  </label>
                )}


                {/* ROLE */}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'auto auto',
                    gap: '5px 12px',
                    alignItems: 'center',
                    marginTop: '18px',
                    padding: '14px 16px',
                    border:
                      '1px solid #eee8f4',
                    borderRadius: '13px',
                    background: '#faf8fd',
                  }}
                >

                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 750,
                      color: '#504858',
                    }}
                  >
                    Role
                  </span>

                  <strong
                    style={{
                      justifySelf: 'end',
                      fontSize: '12px',
                      color: '#6251a4',
                      textTransform:
                        'capitalize',
                    }}
                  >
                    {user?.role ||
                      'Not available'}
                  </strong>

                  <small
                    style={{
                      gridColumn:
                        '1 / -1',
                      color: '#8d8598',
                      fontSize: '11px',
                    }}
                  >
                    Your HireSense role is controlled
                    by the system and cannot be changed here.
                  </small>

                </div>


                {accountError && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '11px 13px',
                      borderRadius: '11px',
                      background: '#fff3f3',
                      border:
                        '1px solid #f0d1d1',
                      color: '#a14444',
                      fontSize: '12px',
                    }}
                  >
                    {accountError}
                  </div>
                )}


                {accountSuccess && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '11px 13px',
                      borderRadius: '11px',
                      background: '#f1fbf5',
                      border:
                        '1px solid #cfead9',
                      color: '#397450',
                      fontSize: '12px',
                    }}
                  >
                    {accountSuccess}
                  </div>
                )}


                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    marginTop: '22px',
                  }}
                >

                  <button
                    type="button"
                    onClick={closeAccountEditor}
                    disabled={accountSaving}
                    className="hs-settings-secondary-btn"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={accountSaving}
                    className="hs-settings-primary-btn"
                  >
                    <Save size={16} />

                    {accountSaving
                      ? 'Saving...'
                      : 'Save account'}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}


        {/* ===================================================
            EDIT COMPANY MODAL
        =================================================== */}

        {isCompanyEditOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              background: 'rgba(42,35,56,.42)',
              backdropFilter: 'blur(5px)',
            }}
          >

            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-company-title"
              style={{
                width: 'min(680px, 100%)',
                maxHeight: '90vh',
                overflowY: 'auto',
                background: '#fff',
                border: '1px solid #eee8f5',
                borderRadius: '22px',
                boxShadow:
                  '0 24px 70px rgba(45,35,70,.20)',
                padding: '26px',
              }}
            >

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '20px',
                  alignItems: 'flex-start',
                  paddingBottom: '20px',
                  borderBottom:
                    '1px solid #eee9f3',
                }}
              >

                <div>

                  <span
                    style={{
                      fontSize: '10px',
                      letterSpacing: '.12em',
                      fontWeight: 800,
                      color: '#7665b7',
                    }}
                  >
                    COMPANY
                  </span>

                  <h2
                    id="edit-company-title"
                    style={{
                      margin:
                        '5px 0 6px',
                      fontSize: '24px',
                      color: '#292333',
                    }}
                  >
                    {company
                      ? 'Edit company profile'
                      : 'Add company profile'}
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      color: '#8c8498',
                      fontSize: '13px',
                      lineHeight: 1.5,
                    }}
                  >
                    Keep your recruiter company information
                    accurate for candidates and placement officers.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={closeCompanyEditor}
                  disabled={companySaving}
                  aria-label="Close company editor"
                  style={{
                    width: '38px',
                    height: '38px',
                    border:
                      '1px solid #e7e1ee',
                    borderRadius: '11px',
                    background: '#faf8fd',
                    color: '#665c70',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>

              </div>


              <form
                onSubmit={handleSaveCompany}
                style={{
                  paddingTop: '22px',
                }}
              >

                {/* COMPANY NAME */}

                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >

                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 750,
                      color: '#504858',
                    }}
                  >
                    Company name
                  </span>

                  <input
                    type="text"
                    name="name"
                    value={companyForm.name}
                    onChange={handleCompanyChange}
                    placeholder="e.g. Yugsaman"
                    disabled={companySaving}
                    autoComplete="organization"
                    required
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      boxSizing: 'border-box',
                      border:
                        '1px solid #ded7e8',
                      borderRadius: '12px',
                      padding: '0 14px',
                      font: 'inherit',
                      color: '#302a38',
                      outline: 'none',
                    }}
                  />

                </label>


                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(2,minmax(0,1fr))',
                    gap: '18px',
                    marginTop: '18px',
                  }}
                >

                  {/* INDUSTRY */}

                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >

                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 750,
                        color: '#504858',
                      }}
                    >
                      Industry
                    </span>

                    <input
                      type="text"
                      name="industry"
                      value={companyForm.industry}
                      onChange={handleCompanyChange}
                      placeholder="e.g. Information Technology"
                      disabled={companySaving}
                      required
                      style={{
                        width: '100%',
                        minHeight: '48px',
                        boxSizing: 'border-box',
                        border:
                          '1px solid #ded7e8',
                        borderRadius: '12px',
                        padding: '0 14px',
                        font: 'inherit',
                        color: '#302a38',
                        outline: 'none',
                      }}
                    />

                  </label>


                  {/* LOCATION */}

                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >

                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 750,
                        color: '#504858',
                      }}
                    >
                      Location
                    </span>

                    <input
                      type="text"
                      name="location"
                      value={companyForm.location}
                      onChange={handleCompanyChange}
                      placeholder="e.g. Delhi NCR"
                      disabled={companySaving}
                      required
                      style={{
                        width: '100%',
                        minHeight: '48px',
                        boxSizing: 'border-box',
                        border:
                          '1px solid #ded7e8',
                        borderRadius: '12px',
                        padding: '0 14px',
                        font: 'inherit',
                        color: '#302a38',
                        outline: 'none',
                      }}
                    />

                  </label>

                </div>


                {/* WEBSITE */}

                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginTop: '18px',
                  }}
                >

                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 750,
                      color: '#504858',
                    }}
                  >
                    Website
                  </span>

                  <div
                    style={{
                      position: 'relative',
                    }}
                  >

                    <Globe
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '16px',
                        color: '#93899e',
                      }}
                    />

                    <input
                      type="url"
                      name="website"
                      value={companyForm.website}
                      onChange={handleCompanyChange}
                      placeholder="https://example.com"
                      disabled={companySaving}
                      style={{
                        width: '100%',
                        minHeight: '48px',
                        boxSizing: 'border-box',
                        border:
                          '1px solid #ded7e8',
                        borderRadius: '12px',
                        padding:
                          '0 14px 0 40px',
                        font: 'inherit',
                        color: '#302a38',
                        outline: 'none',
                      }}
                    />

                  </div>

                </label>


                {companyError && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '11px 13px',
                      borderRadius: '11px',
                      background: '#fff3f3',
                      border:
                        '1px solid #f0d1d1',
                      color: '#a14444',
                      fontSize: '12px',
                    }}
                  >
                    {companyError}
                  </div>
                )}


                {companySuccess && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '11px 13px',
                      borderRadius: '11px',
                      background: '#f1fbf5',
                      border:
                        '1px solid #cfead9',
                      color: '#397450',
                      fontSize: '12px',
                    }}
                  >
                    {companySuccess}
                  </div>
                )}


                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    marginTop: '22px',
                  }}
                >

                  <button
                    type="button"
                    onClick={closeCompanyEditor}
                    disabled={companySaving}
                    className="hs-settings-secondary-btn"
                  >
                    Cancel
                  </button>


                  <button
                    type="submit"
                    disabled={companySaving}
                    className="hs-settings-primary-btn"
                  >
                    <Save size={16} />

                    {companySaving
                      ? 'Saving...'
                      : company
                        ? 'Save company'
                        : 'Create company'}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}


        <footer className="hs-settings-footer">
          HireSense · Placement Intelligence
        </footer>

      </main>

    </div>
  )
}


export default SettingsPage