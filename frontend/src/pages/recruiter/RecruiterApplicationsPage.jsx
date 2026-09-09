import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  BriefcaseBusiness,
  Users,
  Clock3,
  CheckCircle2,
  XCircle,
  Search,
  ChevronDown,
  RefreshCw,
} from 'lucide-react'

import AppShell from '../../components/layout/AppShell'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const STATUS_OPTIONS = [
  'applied',
  'shortlisted',
  'interview',
  'rejected',
  'selected',
]

function RecruiterApplicationsPage() {
  const {
    user,
    loading: authLoading,
    isAuthenticated,
  } = useAuth()

  const [applications, setApplications] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)

  async function loadApplications() {
    try {
      setLoading(true)
      setError('')

      const jobsResponse = await api.get('/jobs/recruiter/my-jobs')
      const recruiterJobs = jobsResponse.data || []

      setJobs(recruiterJobs)

      const applicationResponses = await Promise.all(
        recruiterJobs.map(async (job) => {
          try {
            const response = await api.get(
              `/applications/job/${job.id}`
            )
            return response.data || []
          } catch (err) {
            // A single job failing should not hide applications
            // belonging to the recruiter's other jobs.
            console.error(
              `Failed to load applications for job ${job.id}:`,
              err
            )
            return []
          }
        })
      )

      setApplications(
        applicationResponses
          .flat()
          .sort((a, b) => {
            const first = a.applied_at
              ? new Date(a.applied_at).getTime()
              : 0
            const second = b.applied_at
              ? new Date(b.applied_at).getTime()
              : 0
            return second - first
          })
      )
    } catch (err) {
      console.error(err)
      setError(
        err.response?.data?.detail ||
          'Unable to load recruiter applications.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return
    }

    loadApplications()
  }, [authLoading, isAuthenticated])

  async function updateStatus(applicationId, status) {
    try {
      setUpdatingId(applicationId)
      setError('')

      const response = await api.patch(
        `/applications/${applicationId}/status`,
        { status }
      )

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                ...response.data,
                status,
              }
            : application
        )
      )
    } catch (err) {
      console.error(err)
      setError(
        err.response?.data?.detail ||
          'Unable to update application status.'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase()

    return applications.filter((application) => {
      const matchesStatus =
        statusFilter === 'all' ||
        application.status === statusFilter

      const searchable = [
        application.candidate_name,
        application.job_title,
        application.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return (
        matchesStatus &&
        (!query || searchable.includes(query))
      )
    })
  }, [applications, search, statusFilter])

  const counts = useMemo(
    () => ({
      total: applications.length,
      applied: applications.filter(
        (item) => item.status === 'applied'
      ).length,
      shortlisted: applications.filter(
        (item) => item.status === 'shortlisted'
      ).length,
      interview: applications.filter(
        (item) => item.status === 'interview'
      ).length,
      selected: applications.filter(
        (item) => item.status === 'selected'
      ).length,
    }),
    [applications]
  )

  if (authLoading) {
    return (
      <AppShell
        role="recruiter"
        userName={user?.name || 'Recruiter'}
      >
        <div style={styles.centerMessage}>
          Checking your account...
        </div>
      </AppShell>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (
    user?.role !== 'recruiter' &&
    user?.role !== 'admin'
  ) {
    return <Navigate to="/" replace />
  }

  return (
    <AppShell
      role="recruiter"
      userName={user?.name || 'Recruiter'}
    >
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <div style={styles.kicker}>
              RECRUITMENT PIPELINE
            </div>
            <h1 style={styles.title}>
              Applications
            </h1>
            <p style={styles.subtitle}>
              Review candidates and move applications
              through your hiring pipeline.
            </p>
          </div>

          <button
            type="button"
            onClick={loadApplications}
            disabled={loading}
            style={styles.refreshButton}
          >
            <RefreshCw
              size={16}
              style={{
                transform: loading
                  ? 'rotate(180deg)'
                  : 'none',
              }}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <div style={styles.statsGrid}>
          <StatCard
            icon={<Users size={20} />}
            label="Total applicants"
            value={counts.total}
            tone="purple"
          />
          <StatCard
            icon={<Clock3 size={20} />}
            label="New applications"
            value={counts.applied}
            tone="blue"
          />
          <StatCard
            icon={<CheckCircle2 size={20} />}
            label="Shortlisted"
            value={counts.shortlisted}
            tone="mint"
          />
          <StatCard
            icon={<BriefcaseBusiness size={20} />}
            label="Interviews"
            value={counts.interview}
            tone="yellow"
          />
        </div>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelKicker}>
                CANDIDATES
              </div>
              <h2 style={styles.panelTitle}>
                Applicant pipeline
              </h2>
            </div>

            <div style={styles.jobCount}>
              {jobs.length} posted{' '}
              {jobs.length === 1 ? 'role' : 'roles'}
            </div>
          </div>

          <div style={styles.filters}>
            <div style={styles.searchWrap}>
              <Search
                size={18}
                style={styles.searchIcon}
              />
              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search candidates or jobs..."
                style={styles.searchInput}
              />
            </div>

            <div style={styles.selectWrap}>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                style={styles.select}
              >
                <option value="all">
                  All statuses
                </option>
                {STATUS_OPTIONS.map((status) => (
                  <option
                    value={status}
                    key={status}
                  >
                    {formatStatus(status)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                style={styles.selectIcon}
              />
            </div>
          </div>

          {loading ? (
            <div style={styles.emptyState}>
              Loading applications...
            </div>
          ) : filteredApplications.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <Users size={24} />
              </div>
              <h3 style={styles.emptyTitle}>
                {applications.length === 0
                  ? 'No applications yet'
                  : 'No matching applications'}
              </h3>
              <p style={styles.emptyText}>
                {applications.length === 0
                  ? 'Applications submitted to your jobs will appear here.'
                  : 'Try another candidate name, job title, or status.'}
              </p>
            </div>
          ) : (
            <div style={styles.applicationList}>
              {filteredApplications.map(
                (application) => (
                  <ApplicationRow
                    key={application.id}
                    application={application}
                    updating={
                      updatingId === application.id
                    }
                    onStatusChange={updateStatus}
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}

function StatCard({
  icon,
  label,
  value,
  tone,
}) {
  const tones = {
    purple: {
      background: '#eee8ff',
      color: '#6f5bc4',
    },
    blue: {
      background: '#e8f2ff',
      color: '#4777b8',
    },
    mint: {
      background: '#e7f7ef',
      color: '#2c8661',
    },
    yellow: {
      background: '#fff2d9',
      color: '#aa761d',
    },
  }

  const selected = tones[tone]

  return (
    <div style={styles.statCard}>
      <div
        style={{
          ...styles.statIcon,
          background: selected.background,
          color: selected.color,
        }}
      >
        {icon}
      </div>

      <div>
        <div style={styles.statLabel}>
          {label}
        </div>
        <div style={styles.statValue}>
          {value}
        </div>
      </div>
    </div>
  )
}

function ApplicationRow({
  application,
  updating,
  onStatusChange,
}) {
  const initial = (
    application.candidate_name || 'C'
  )
    .trim()
    .charAt(0)
    .toUpperCase()

  return (
    <article style={styles.applicationRow}>
      <div style={styles.candidateAvatar}>
        {initial}
      </div>

      <div style={styles.candidateMain}>
        <div style={styles.candidateTop}>
          <div>
            <h3 style={styles.candidateName}>
              {application.candidate_name}
            </h3>
            <div style={styles.jobTitle}>
              Applied for{' '}
              <strong>
                {application.job_title}
              </strong>
            </div>
          </div>

          <StatusBadge
            status={application.status}
          />
        </div>

        <div style={styles.applicationMeta}>
          <span>
            Application #{application.id}
          </span>
          {application.applied_at && (
            <span>
              {formatDate(application.applied_at)}
            </span>
          )}
        </div>
      </div>

      <div style={styles.statusControl}>
        <select
          value={application.status}
          onChange={(event) =>
            onStatusChange(
              application.id,
              event.target.value
            )
          }
          disabled={updating}
          style={styles.statusSelect}
        >
          {STATUS_OPTIONS.map((status) => (
            <option
              value={status}
              key={status}
            >
              {formatStatus(status)}
            </option>
          ))}
        </select>

        {updating && (
          <span style={styles.updatingText}>
            Saving...
          </span>
        )}
      </div>
    </article>
  )
}

function StatusBadge({ status }) {
  const config = {
    applied: {
      background: '#edf2ff',
      color: '#5268a9',
      icon: <Clock3 size={13} />,
    },
    shortlisted: {
      background: '#fff4dc',
      color: '#9a6b17',
      icon: <CheckCircle2 size={13} />,
    },
    interview: {
      background: '#e9f7f0',
      color: '#28785a',
      icon: <BriefcaseBusiness size={13} />,
    },
    rejected: {
      background: '#fff0ed',
      color: '#ad4939',
      icon: <XCircle size={13} />,
    },
    selected: {
      background: '#eee8ff',
      color: '#6f5bc4',
      icon: <CheckCircle2 size={13} />,
    },
  }

  const current = config[status] || config.applied

  return (
    <span
      style={{
        ...styles.statusBadge,
        background: current.background,
        color: current.color,
      }}
    >
      {current.icon}
      {formatStatus(status)}
    </span>
  )
}

function formatStatus(status) {
  return status
    .replace('_', ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    )
}

function formatDate(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const styles = {
  page: {
    width: '100%',
    boxSizing: 'border-box',
  },

  centerMessage: {
    minHeight: '420px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6f6a78',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '24px',
    marginBottom: '28px',
  },

  kicker: {
    color: '#8a7bb4',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.12em',
  },

  title: {
    margin: '7px 0 0',
    color: '#18233d',
    fontSize: '36px',
    lineHeight: 1.1,
    fontWeight: 800,
    letterSpacing: '-0.7px',
  },

  subtitle: {
    margin: '9px 0 0',
    maxWidth: '680px',
    color: '#667085',
    fontSize: '15px',
    lineHeight: 1.6,
  },

  refreshButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    minHeight: '42px',
    padding: '0 15px',
    border: '1px solid #ded7eb',
    borderRadius: '11px',
    background: '#ffffff',
    color: '#5d527c',
    fontWeight: 700,
    cursor: 'pointer',
  },

  error: {
    marginBottom: '20px',
    padding: '13px 16px',
    border: '1px solid #f4d0c9',
    borderRadius: '12px',
    background: '#fff3f0',
    color: '#a33f31',
    fontSize: '13px',
    fontWeight: 600,
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(4, minmax(0, 1fr))',
    gap: '16px',
    marginBottom: '22px',
  },

  statCard: {
    minHeight: '104px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '20px',
    boxSizing: 'border-box',
    border: '1px solid #e8e4df',
    borderRadius: '18px',
    background: '#ffffff',
    boxShadow:
      '0 8px 28px rgba(40, 30, 70, 0.045)',
  },

  statIcon: {
    width: '44px',
    height: '44px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '13px',
  },

  statLabel: {
    color: '#718096',
    fontSize: '12px',
    fontWeight: 700,
  },

  statValue: {
    marginTop: '3px',
    color: '#18233d',
    fontSize: '25px',
    lineHeight: 1,
    fontWeight: 800,
  },

  panel: {
    overflow: 'hidden',
    border: '1px solid #e8e4df',
    borderRadius: '20px',
    background: '#ffffff',
    boxShadow:
      '0 10px 30px rgba(40, 30, 70, 0.045)',
  },

  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    padding: '24px 26px 18px',
  },

  panelKicker: {
    color: '#8a7bb4',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.12em',
  },

  panelTitle: {
    margin: '5px 0 0',
    color: '#18233d',
    fontSize: '22px',
    fontWeight: 800,
  },

  jobCount: {
    padding: '7px 11px',
    borderRadius: '9px',
    background: '#f5f2fb',
    color: '#756a8f',
    fontSize: '12px',
    fontWeight: 700,
  },

  filters: {
    display: 'flex',
    gap: '12px',
    padding: '0 26px 20px',
    borderBottom: '1px solid #eeeae5',
  },

  searchWrap: {
    position: 'relative',
    flex: 1,
  },

  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#98a0b1',
    pointerEvents: 'none',
  },

  searchInput: {
    width: '100%',
    minHeight: '44px',
    boxSizing: 'border-box',
    padding: '0 14px 0 43px',
    border: '1px solid #dedbe3',
    borderRadius: '11px',
    outline: 'none',
    background: '#fbfafc',
    color: '#252c3d',
    fontSize: '13px',
  },

  selectWrap: {
    position: 'relative',
    width: '180px',
  },

  select: {
    width: '100%',
    height: '44px',
    appearance: 'none',
    padding: '0 36px 0 13px',
    border: '1px solid #dedbe3',
    borderRadius: '11px',
    outline: 'none',
    background: '#fbfafc',
    color: '#4f5668',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  selectIcon: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#8e96a7',
    pointerEvents: 'none',
  },

  emptyState: {
    minHeight: '280px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '30px',
    textAlign: 'center',
  },

  emptyIcon: {
    width: '52px',
    height: '52px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '16px',
    background: '#eee8ff',
    color: '#6f5bc4',
  },

  emptyTitle: {
    margin: '15px 0 5px',
    color: '#252d40',
    fontSize: '17px',
    fontWeight: 800,
  },

  emptyText: {
    margin: 0,
    maxWidth: '470px',
    color: '#7c8495',
    fontSize: '13px',
    lineHeight: 1.6,
  },

  applicationList: {
    display: 'grid',
  },

  applicationRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '20px 26px',
    borderBottom: '1px solid #eeeae5',
  },

  candidateAvatar: {
    width: '43px',
    height: '43px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '13px',
    background: '#eee8ff',
    color: '#6f5bc4',
    fontSize: '15px',
    fontWeight: 800,
  },

  candidateMain: {
    minWidth: 0,
    flex: 1,
  },

  candidateTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '15px',
  },

  candidateName: {
    margin: 0,
    color: '#1d2940',
    fontSize: '15px',
    fontWeight: 800,
  },

  jobTitle: {
    marginTop: '4px',
    color: '#7a8292',
    fontSize: '12px',
  },

  applicationMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginTop: '8px',
    color: '#9aa0ad',
    fontSize: '11px',
  },

  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    flexShrink: 0,
    padding: '6px 9px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },

  statusControl: {
    position: 'relative',
    width: '145px',
    flexShrink: 0,
  },

  statusSelect: {
    width: '100%',
    height: '38px',
    padding: '0 10px',
    border: '1px solid #dedbe3',
    borderRadius: '9px',
    background: '#ffffff',
    color: '#4d5362',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  updatingText: {
    position: 'absolute',
    right: '0',
    top: '43px',
    color: '#8b8497',
    fontSize: '10px',
  },
}

export default RecruiterApplicationsPage
