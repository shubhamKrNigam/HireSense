import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Save,
  Sparkles,
} from 'lucide-react'

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AppShell from '../../components/layout/AppShell'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'


function RecruiterCompanyPage() {
  const navigate = useNavigate()

  const {
    user,
    loading: authLoading,
    isAuthenticated,
  } = useAuth()

  const [company, setCompany] = useState(null)

  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')


  // =========================================================
  // LOAD COMPANY
  // =========================================================

  async function loadCompany() {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const response = await api.get(
        '/companies/my-company'
      )

      const data = response.data

      setCompany(data)

      setName(data.name || '')
      setIndustry(data.industry || '')
      setLocation(data.location || '')
      setWebsite(data.website || '')
    } catch (err) {
      if (err.response?.status === 404) {
        setCompany(null)
        setName('')
        setIndustry('')
        setLocation('')
        setWebsite('')
      } else {
        setError(
          err.response?.data?.detail ||
            'Unable to load your company profile.'
        )
      }
    } finally {
      setLoading(false)
    }
  }


  // =========================================================
  // AUTH / INITIAL LOAD
  // =========================================================

  useEffect(() => {
    if (
      authLoading ||
      !isAuthenticated
    ) {
      return
    }

    if (
      user?.role !== 'recruiter' &&
      user?.role !== 'admin'
    ) {
      return
    }

    loadCompany()
  }, [
    authLoading,
    isAuthenticated,
    user?.role,
  ])


  // =========================================================
  // SAVE
  // =========================================================

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setSuccess('')

    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Company name is required.')
      return
    }

    setSaving(true)

    try {
      const payload = {
        name: trimmedName,
        industry: industry.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
      }

      let response

      if (company) {
        response = await api.patch(
          '/companies/my-company',
          payload
        )
      } else {
        response = await api.post(
          '/companies/',
          payload
        )
      }

      const data = response.data

      setCompany(data)

      setName(data.name || '')
      setIndustry(data.industry || '')
      setLocation(data.location || '')
      setWebsite(data.website || '')

      setSuccess(
        company
          ? 'Company profile updated successfully.'
          : 'Company profile created successfully.'
      )
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        'Unable to save your company profile.'

      setError(
        Array.isArray(message)
          ? message
              .map((item) => item.msg)
              .join(', ')
          : message
      )
    } finally {
      setSaving(false)
    }
  }


  // =========================================================
  // AUTH LOADING
  // =========================================================

  if (authLoading) {
    return (
      <AppShell
        role="recruiter"
        userName={
          user?.name || 'Recruiter'
        }
      >
        <div style={styles.center}>
          Checking your account...
        </div>
      </AppShell>
    )
  }


  if (!isAuthenticated) {
    return null
  }


  if (
    user?.role !== 'recruiter' &&
    user?.role !== 'admin'
  ) {
    return null
  }


  // =========================================================
  // PAGE
  // =========================================================

  return (
    <AppShell
      role="recruiter"
      userName={
        user?.name || 'Recruiter'
      }
    >
      <div style={styles.page}>

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <section style={styles.header}>

          <div>

            <div style={styles.kicker}>
              RECRUITER WORKSPACE
            </div>

            <h1 style={styles.title}>
              Company Profile
            </h1>

            <p style={styles.subtitle}>
              Manage the company information associated
              with your recruiter account.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/recruiter')
            }
            style={styles.backButton}
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>

        </section>


        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}


        {/* ================================================= */}
        {/* SUCCESS */}
        {/* ================================================= */}

        {success && (
          <div style={styles.success}>
            {success}
          </div>
        )}


        {/* ================================================= */}
        {/* MAIN CARD */}
        {/* ================================================= */}

        <section style={styles.card}>

          <div style={styles.cardHeader}>

            <div style={styles.iconBox}>
              <Building2
                size={21}
                color="#6657e8"
              />
            </div>

            <div>

              <h2 style={styles.cardTitle}>
                {company
                  ? 'Your company'
                  : 'Set up your company'}
              </h2>

              <p style={styles.cardSubtitle}>
                {company
                  ? 'Keep your company information accurate for candidates and placement teams.'
                  : 'Complete your company profile before publishing job opportunities.'}
              </p>

            </div>

          </div>


          {/* ================================================= */}
          {/* COMPANY FORM */}
          {/* ================================================= */}

          {loading ? (

            <div style={styles.loading}>
              Loading company profile...
            </div>

          ) : (

            <form
              onSubmit={handleSubmit}
              style={styles.form}
            >

              {/* COMPANY NAME */}

              <div style={styles.field}>

                <label style={styles.label}>
                  Company name
                </label>

                <div style={styles.inputWrapper}>

                  <Building2
                    size={17}
                    color="#8c86a0"
                  />

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Enter your company name"
                    disabled={saving}
                    style={styles.input}
                    required
                  />

                </div>

              </div>


              {/* INDUSTRY */}

              <div style={styles.field}>

                <label style={styles.label}>
                  Industry
                </label>

                <div style={styles.inputWrapper}>

                  <Sparkles
                    size={17}
                    color="#8c86a0"
                  />

                  <input
                    type="text"
                    value={industry}
                    onChange={(event) =>
                      setIndustry(
                        event.target.value
                      )
                    }
                    placeholder="e.g. Information Technology"
                    disabled={saving}
                    style={styles.input}
                  />

                </div>

              </div>


              {/* LOCATION */}

              <div style={styles.field}>

                <label style={styles.label}>
                  Location
                </label>

                <div style={styles.inputWrapper}>

                  <MapPin
                    size={17}
                    color="#8c86a0"
                  />

                  <input
                    type="text"
                    value={location}
                    onChange={(event) =>
                      setLocation(
                        event.target.value
                      )
                    }
                    placeholder="e.g. Gurugram, Haryana"
                    disabled={saving}
                    style={styles.input}
                  />

                </div>

              </div>


              {/* WEBSITE */}

              <div style={styles.field}>

                <label style={styles.label}>
                  Website
                </label>

                <div style={styles.inputWrapper}>

                  <Globe
                    size={17}
                    color="#8c86a0"
                  />

                  <input
                    type="url"
                    value={website}
                    onChange={(event) =>
                      setWebsite(
                        event.target.value
                      )
                    }
                    placeholder="https://example.com"
                    disabled={saving}
                    style={styles.input}
                  />

                </div>

              </div>


              {/* SUBMIT */}

              <div style={styles.actions}>

                <button
                  type="button"
                  onClick={() =>
                    navigate('/recruiter')
                  }
                  style={styles.cancelButton}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    ...styles.saveButton,
                    opacity: saving ? 0.7 : 1,
                  }}
                  disabled={saving}
                >

                  <Save size={16} />

                  {saving
                    ? 'Saving...'
                    : company
                      ? 'Save changes'
                      : 'Create company profile'}

                </button>

              </div>

            </form>

          )}

        </section>

      </div>
    </AppShell>
  )
}


const styles = {

  page: {
    padding: '36px 38px 60px',
    maxWidth: 1100,
    margin: '0 auto',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 24,
    marginBottom: 28,
  },

  kicker: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '.12em',
    color: '#7568d9',
    marginBottom: 8,
  },

  title: {
    margin: 0,
    fontSize: 34,
    lineHeight: 1.15,
    color: '#252a3b',
    fontWeight: 750,
  },

  subtitle: {
    margin: '10px 0 0',
    maxWidth: 680,
    fontSize: 14,
    lineHeight: 1.6,
    color: '#777487',
  },

  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    border: '1px solid #ddd9e7',
    background: '#ffffff',
    color: '#5d586b',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  card: {
    background: '#ffffff',
    border: '1px solid #e9e6ef',
    borderRadius: 18,
    overflow: 'hidden',
  },

  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '24px 26px',
    borderBottom: '1px solid #eeeaf2',
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    background: '#f1eeff',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  },

  cardTitle: {
    margin: 0,
    fontSize: 18,
    color: '#302c3b',
  },

  cardSubtitle: {
    margin: '5px 0 0',
    fontSize: 12,
    lineHeight: 1.5,
    color: '#8b8495',
  },

  form: {
    padding: 26,
    display: 'grid',
    gridTemplateColumns:
      'repeat(2, minmax(0, 1fr))',
    gap: 22,
  },

  field: {
    minWidth: 0,
  },

  label: {
    display: 'block',
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 700,
    color: '#5e5968',
  },

  inputWrapper: {
    height: 46,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    border: '1px solid #ddd9e7',
    borderRadius: 10,
    padding: '0 13px',
    boxSizing: 'border-box',
    background: '#ffffff',
  },

  input: {
    flex: 1,
    minWidth: 0,
    border: 0,
    outline: 0,
    background: 'transparent',
    color: '#302b3b',
    fontSize: 13,
  },

  actions: {
    gridColumn: '1 / -1',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 6,
    borderTop: '1px solid #eeeaf2',
    marginTop: 4,
    paddingBottom: 2,
  },

  cancelButton: {
    border: '1px solid #ddd9e7',
    background: '#ffffff',
    color: '#686274',
    borderRadius: 9,
    padding: '10px 16px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },

  saveButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    border: 0,
    background: '#6657e8',
    color: '#ffffff',
    borderRadius: 9,
    padding: '10px 17px',
    fontSize: 12,
    fontWeight: 750,
    cursor: 'pointer',
  },

  error: {
    marginBottom: 18,
    padding: '12px 15px',
    borderRadius: 10,
    background: '#fff1f1',
    border: '1px solid #f0d2d2',
    color: '#bd4e4e',
    fontSize: 13,
  },

  success: {
    marginBottom: 18,
    padding: '12px 15px',
    borderRadius: 10,
    background: '#edf9f2',
    border: '1px solid #cce8d8',
    color: '#218653',
    fontSize: 13,
  },

  loading: {
    padding: 60,
    textAlign: 'center',
    color: '#8b8495',
    fontSize: 13,
  },

  center: {
    minHeight: 400,
    display: 'grid',
    placeItems: 'center',
    color: '#77727f',
  },
}


export default RecruiterCompanyPage