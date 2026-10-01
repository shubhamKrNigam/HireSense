import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import AppShell from '../../components/layout/AppShell'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

function RecruiterDashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [jobs, setJobs] = useState([])
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return
    }

    async function loadDashboard() {
      try {
        setLoading(true)
        setError('')

        const [jobsResponse, companyResponse] = await Promise.all([
          api.get('/jobs/recruiter/my-jobs'),
          api.get('/companies/my-company'),
        ])

        setJobs(Array.isArray(jobsResponse.data) ? jobsResponse.data : [])
        setCompany(companyResponse.data)
      } catch (err) {
        console.error(err)
        setError(
          err.response?.data?.detail ||
            'Unable to load recruiter dashboard.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [authLoading, isAuthenticated])

  const stats = useMemo(() => {
    const openJobs = jobs.filter((job) => job.status === 'open').length
    const closedJobs = jobs.filter((job) => job.status === 'closed').length
    const draftJobs = jobs.filter((job) => job.status === 'draft').length

    return {
      total: jobs.length,
      open: openJobs,
      closed: closedJobs,
      draft: draftJobs,
    }
  }, [jobs])

  const formatSalary = (job) => {
    if (job.salary_min == null && job.salary_max == null) {
      return 'Salary not specified'
    }

    const formatValue = (value) =>
      Number(value).toLocaleString('en-IN', {
        maximumFractionDigits: 0,
      })

    if (job.salary_min != null && job.salary_max != null) {
      return `₹${formatValue(job.salary_min)} – ₹${formatValue(job.salary_max)}`
    }

    if (job.salary_min != null) {
      return `From ₹${formatValue(job.salary_min)}`
    }

    return `Up to ₹${formatValue(job.salary_max)}`
  }

  const formatPostedDate = (dateValue) => {
    if (!dateValue) {
      return 'Recently posted'
    }

    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) {
      return 'Recently posted'
    }

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (authLoading) {
    return (
      <AppShell
        role="recruiter"
        userName={user?.name || 'Recruiter'}
      >
        <div style={styles.loadingCard}>Loading recruiter workspace...</div>
      </AppShell>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'recruiter' && user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <AppShell
      role="recruiter"
      userName={user?.name || 'Recruiter'}
    >
      <div style={styles.page}>
        <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>RECRUITER WORKSPACE</div>
            <h1 style={styles.title}>Good to see you, {user?.name || 'Recruiter'} 👋</h1>
            <p style={styles.subtitle}>
              Manage opportunities, keep your hiring pipeline organized, and
              get ready for smarter candidate matching.
            </p>
          </div>

          <button
            type="button"
            style={styles.primaryButton}
            onClick={() => navigate('/recruiter/jobs')}
          >
            + Create Job
          </button>
        </header>

        {company && (
          <div style={styles.companyBanner}>
            <div style={styles.companyIcon}>H</div>
            <div>
              <div style={styles.companyLabel}>COMPANY</div>
              <div style={styles.companyName}>{company.name}</div>
              <div style={styles.companyMeta}>
                {company.industry || 'Technology'}
                {company.location ? ` · ${company.location}` : ''}
              </div>
            </div>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => navigate('/recruiter/jobs')}
            >
              Manage Jobs →
            </button>
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        <section style={styles.statsGrid}>
          <StatCard
            label="Total Jobs"
            value={loading ? '—' : stats.total}
            helper="All opportunities"
            icon="💼"
            background="#F0E9FF"
          />
          <StatCard
            label="Open Jobs"
            value={loading ? '—' : stats.open}
            helper="Currently accepting"
            icon="🟢"
            background="#E8F8F1"
          />
          <StatCard
            label="Closed Jobs"
            value={loading ? '—' : stats.closed}
            helper="No longer active"
            icon="📁"
            background="#FFF2DD"
          />
          <StatCard
            label="Applicants"
            value="Soon"
            helper="Application analytics next"
            icon="👥"
            background="#EAF2FF"
          />
        </section>

        <section style={styles.contentGrid}>
          <div style={styles.mainCard}>
            <div style={styles.sectionHeader}>
              <div>
                <div style={styles.sectionEyebrow}>OPPORTUNITIES</div>
                <h2 style={styles.sectionTitle}>Recent Jobs</h2>
              </div>
              <button
                type="button"
                style={styles.textButton}
                onClick={() => navigate('/recruiter/jobs')}
              >
                View all →
              </button>
            </div>

            {loading ? (
              <div style={styles.emptyState}>Loading your jobs...</div>
            ) : jobs.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>✨</div>
                <h3 style={styles.emptyTitle}>Your first opportunity starts here</h3>
                <p style={styles.emptyText}>
                  Create a job to start building your recruitment pipeline.
                </p>
                <button
                  type="button"
                  style={styles.primaryButtonSmall}
                  onClick={() => navigate('/recruiter/jobs')}
                >
                  Create your first job
                </button>
              </div>
            ) : (
              <div style={styles.jobsList}>
                {jobs.slice(0, 5).map((job) => (
                  <div key={job.id} style={styles.jobRow}>
                    <div style={styles.jobAccent} />
                    <div style={styles.jobMain}>
                      <div style={styles.jobTopLine}>
                        <h3 style={styles.jobTitle}>{job.title}</h3>
                        <span
                          style={{
                            ...styles.statusBadge,
                            ...(job.status === 'open'
                              ? styles.openBadge
                              : job.status === 'closed'
                                ? styles.closedBadge
                                : styles.draftBadge),
                          }}
                        >
                          {job.status || 'open'}
                        </span>
                      </div>

                      <div style={styles.jobMeta}>
                        <span>{job.location || 'Location not specified'}</span>
                        <span>•</span>
                        <span>{job.employment_type || 'Employment type not specified'}</span>
                        <span>•</span>
                        <span>{formatSalary(job)}</span>
                      </div>

                      <div style={styles.jobDate}>
                        Posted {formatPostedDate(job.posted_at || job.created_at)}
                      </div>
                    </div>

                    <button
                      type="button"
                      style={styles.viewButton}
                      onClick={() => navigate('/recruiter/jobs')}
                    >
                      Manage
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside style={styles.sideColumn}>
            <div style={styles.actionCard}>
              <div style={styles.sectionEyebrow}>QUICK ACTIONS</div>
              <h2 style={styles.sideTitle}>Keep things moving</h2>

              <button
                type="button"
                style={styles.actionItem}
                onClick={() => navigate('/recruiter/jobs')}
              >
                <span style={{ ...styles.actionIcon, background: '#F0E9FF' }}>＋</span>
                <span>
                  <strong style={styles.actionTitle}>Create a Job</strong>
                  <small style={styles.actionDescription}>
                    Publish a new opportunity
                  </small>
                </span>
                <span style={styles.actionArrow}>→</span>
              </button>

              <button
                type="button"
                style={styles.actionItem}
                onClick={() => navigate('/recruiter/jobs')}
              >
                <span style={{ ...styles.actionIcon, background: '#E8F8F1' }}>▣</span>
                <span>
                  <strong style={styles.actionTitle}>Manage Jobs</strong>
                  <small style={styles.actionDescription}>
                    Edit, close, or update jobs
                  </small>
                </span>
                <span style={styles.actionArrow}>→</span>
              </button>

              <button
                type="button"
                style={styles.actionItem}
                onClick={() => navigate('/recruiter')}
              >
                <span style={{ ...styles.actionIcon, background: '#FFF2DD' }}>◔</span>
                <span>
                  <strong style={styles.actionTitle}>Analytics</strong>
                  <small style={styles.actionDescription}>
                    Recruitment insights are next
                  </small>
                </span>
                <span style={styles.actionArrow}>→</span>
              </button>
            </div>

            <div style={styles.progressCard}>
              <div style={styles.sectionEyebrow}>HIRESENSE</div>
              <h2 style={styles.sideTitle}>Recruitment intelligence</h2>
              <p style={styles.progressText}>
                Your recruiter workspace is being built module by module.
                Candidate matching, explainable scores, skill gaps, and
                application analytics will connect here.
              </p>

              <div style={styles.progressTrack}>
                <div style={styles.progressFill} />
              </div>

              <div style={styles.progressLabel}>
                <span>Workspace foundation</span>
                <strong>Active</strong>
              </div>
            </div>
          </aside>
        </section>
        </div>
      </div>
    </AppShell>
  )
}

function StatCard({ label, value, helper, icon, background }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, background }}>{icon}</div>
      <div style={styles.statContent}>
        <div style={styles.statLabel}>{label}</div>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statHelper}>{helper}</div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '0 0 24px',
    boxSizing: 'border-box',
    color: '#25304A',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  container: {
    width: '100%',
    maxWidth: '1320px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '24px',
    marginBottom: '24px',
  },
  eyebrow: {
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.14em',
    color: '#8879A8',
    marginBottom: '8px',
  },
  title: {
    margin: 0,
    fontSize: 'clamp(32px, 3.2vw, 46px)',
    lineHeight: 1.06,
    letterSpacing: '-0.045em',
    color: '#202A43',
  },
  subtitle: {
    margin: '12px 0 0',
    maxWidth: '680px',
    fontSize: '15px',
    lineHeight: 1.6,
    color: '#6B748A',
  },
  primaryButton: {
    border: 'none',
    borderRadius: '12px',
    padding: '12px 17px',
    background: '#7562B8',
    color: '#fff',
    fontWeight: 800,
    fontSize: '14px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 10px 24px rgba(117, 98, 184, 0.20)',
  },
  primaryButtonSmall: {
    border: 'none',
    borderRadius: '12px',
    padding: '11px 15px',
    background: '#7562B8',
    color: '#fff',
    fontWeight: 800,
    fontSize: '13px',
    cursor: 'pointer',
  },
  secondaryButton: {
    marginLeft: 'auto',
    border: '1px solid #DDD7EA',
    borderRadius: '11px',
    padding: '10px 14px',
    background: '#fff',
    color: '#645780',
    fontWeight: 750,
    fontSize: '13px',
    cursor: 'pointer',
  },
  companyBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: '#FFFFFF',
    border: '1px solid #ECE8E2',
    borderRadius: '16px',
    padding: '15px 17px',
    marginBottom: '18px',
    boxShadow: '0 10px 30px rgba(35, 31, 55, 0.045)',
  },
  companyIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '13px',
    display: 'grid',
    placeItems: 'center',
    background: '#EEE7FF',
    color: '#6D5D94',
    fontWeight: 900,
    fontSize: '18px',
  },
  companyLabel: {
    fontSize: '10px',
    letterSpacing: '0.12em',
    fontWeight: 800,
    color: '#9A91A8',
  },
  companyName: {
    marginTop: '2px',
    fontSize: '16px',
    fontWeight: 850,
    color: '#30394F',
  },
  companyMeta: {
    marginTop: '2px',
    fontSize: '12px',
    color: '#7C8495',
  },
  error: {
    background: '#FFF0F0',
    border: '1px solid #F3CACA',
    color: '#A74D4D',
    padding: '12px 14px',
    borderRadius: '12px',
    marginBottom: '18px',
    fontSize: '13px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '15px',
    marginBottom: '18px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
    background: '#FFFFFF',
    border: '1px solid #ECE8E2',
    borderRadius: '16px',
    padding: '17px',
    minHeight: '112px',
    boxSizing: 'border-box',
    boxShadow: '0 10px 30px rgba(35, 31, 55, 0.04)',
  },
  statIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '13px',
    display: 'grid',
    placeItems: 'center',
    fontSize: '18px',
    flexShrink: 0,
  },
  statContent: {
    minWidth: 0,
  },
  statLabel: {
    fontSize: '12px',
    color: '#7B8291',
    fontWeight: 700,
  },
  statValue: {
    marginTop: '2px',
    fontSize: '27px',
    lineHeight: 1.15,
    fontWeight: 900,
    letterSpacing: '-0.03em',
    color: '#30394F',
  },
  statHelper: {
    marginTop: '3px',
    fontSize: '11px',
    color: '#9A9FAC',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.65fr) minmax(300px, 0.75fr)',
    gap: '18px',
    alignItems: 'start',
  },
  mainCard: {
    background: '#FFFFFF',
    border: '1px solid #ECE8E2',
    borderRadius: '19px',
    padding: '21px',
    boxShadow: '0 10px 30px rgba(35, 31, 55, 0.04)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '10px',
  },
  sectionEyebrow: {
    fontSize: '10px',
    letterSpacing: '0.13em',
    fontWeight: 850,
    color: '#988DAB',
    marginBottom: '4px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '20px',
    letterSpacing: '-0.025em',
    color: '#30394F',
  },
  textButton: {
    border: 'none',
    background: 'transparent',
    color: '#75669A',
    fontWeight: 800,
    fontSize: '12px',
    cursor: 'pointer',
  },
  jobsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  jobRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 0',
    borderTop: '1px solid #F0EDE8',
  },
  jobAccent: {
    width: '5px',
    alignSelf: 'stretch',
    minHeight: '58px',
    borderRadius: '8px',
    background: '#CFC3E8',
    flexShrink: 0,
  },
  jobMain: {
    minWidth: 0,
    flex: 1,
  },
  jobTopLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    minWidth: 0,
  },
  jobTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 850,
    color: '#30394F',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  statusBadge: {
    borderRadius: '999px',
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: 850,
    textTransform: 'capitalize',
    flexShrink: 0,
  },
  openBadge: {
    background: '#E8F8F1',
    color: '#3B8465',
  },
  closedBadge: {
    background: '#F1F1F2',
    color: '#737784',
  },
  draftBadge: {
    background: '#FFF2DD',
    color: '#A2773B',
  },
  jobMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '7px',
    marginTop: '7px',
    fontSize: '11px',
    color: '#7C8494',
  },
  jobDate: {
    marginTop: '6px',
    fontSize: '10px',
    color: '#A0A4AE',
  },
  viewButton: {
    border: '1px solid #E1DCEB',
    borderRadius: '10px',
    background: '#FAF9FC',
    color: '#675A84',
    padding: '8px 11px',
    fontWeight: 800,
    fontSize: '11px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  sideColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  actionCard: {
    background: '#FFFFFF',
    border: '1px solid #ECE8E2',
    borderRadius: '19px',
    padding: '20px',
    boxShadow: '0 10px 30px rgba(35, 31, 55, 0.04)',
  },
  sideTitle: {
    margin: '0 0 13px',
    fontSize: '18px',
    letterSpacing: '-0.02em',
    color: '#30394F',
  },
  actionItem: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '38px minmax(0, 1fr) 16px',
    alignItems: 'center',
    gap: '10px',
    textAlign: 'left',
    border: 'none',
    borderTop: '1px solid #F0EDE8',
    background: 'transparent',
    padding: '13px 0',
    cursor: 'pointer',
  },
  actionIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '11px',
    display: 'grid',
    placeItems: 'center',
    color: '#6B5D89',
    fontSize: '17px',
    fontWeight: 900,
  },
  actionTitle: {
    display: 'block',
    fontSize: '12px',
    color: '#384158',
  },
  actionDescription: {
    display: 'block',
    marginTop: '3px',
    fontSize: '10px',
    color: '#9196A3',
  },
  actionArrow: {
    color: '#A19BAE',
    fontSize: '14px',
  },
  progressCard: {
    background: '#F1EDFA',
    border: '1px solid #E4DDF3',
    borderRadius: '19px',
    padding: '20px',
  },
  progressText: {
    margin: '0 0 16px',
    fontSize: '12px',
    lineHeight: 1.65,
    color: '#6D6880',
  },
  progressTrack: {
    height: '7px',
    background: '#DDD5EC',
    borderRadius: '99px',
    overflow: 'hidden',
  },
  progressFill: {
    width: '48%',
    height: '100%',
    background: '#8A78B0',
    borderRadius: '99px',
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    marginTop: '8px',
    fontSize: '10px',
    color: '#817A92',
  },
  loadingCard: {
    maxWidth: '1320px',
    margin: '80px auto',
    background: '#FFFFFF',
    border: '1px solid #ECE8E2',
    borderRadius: '16px',
    padding: '30px',
    color: '#6F7687',
    textAlign: 'center',
  },
  emptyState: {
    borderTop: '1px solid #F0EDE8',
    padding: '55px 20px',
    textAlign: 'center',
    color: '#7C8392',
  },
  emptyIcon: {
    fontSize: '28px',
    marginBottom: '8px',
  },
  emptyTitle: {
    margin: 0,
    color: '#3B4358',
    fontSize: '16px',
  },
  emptyText: {
    margin: '7px auto 15px',
    maxWidth: '360px',
    fontSize: '12px',
    lineHeight: 1.6,
  },
}

export default RecruiterDashboardPage
