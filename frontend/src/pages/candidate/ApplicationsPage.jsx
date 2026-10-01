import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  RefreshCw,
  Search,
  XCircle,
  Target,
} from 'lucide-react'

import AppShell from '../../components/layout/AppShell'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const STATUS_META = {
  applied: {
    label: 'Applied',
    icon: Clock3,
    className: 'applied',
  },
  shortlisted: {
    label: 'Shortlisted',
    icon: CheckCircle2,
    className: 'shortlisted',
  },
  interview: {
    label: 'Interview',
    icon: CalendarDays,
    className: 'interview',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'rejected',
  },
  selected: {
    label: 'Selected',
    icon: CheckCircle2,
    className: 'selected',
  },
}

function formatAppliedDate(value) {
  if (!value) return 'Date not available'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date not available'

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getStatusMeta(status) {
  return (
    STATUS_META[String(status || '').toLowerCase()] || {
      label: status || 'Unknown',
      icon: Clock3,
      className: 'unknown',
    }
  )
}

function getMatchScore(application) {
  const value = application?.match_score
  if (value == null || !Number.isFinite(Number(value))) return null
  return Math.min(Math.max(Number(value), 0), 100)
}

function getEligibility(application) {
  if (typeof application?.eligible === 'boolean') return application.eligible
  if (typeof application?.eligibility === 'boolean') return application.eligibility
  return null
}

function ApplicationsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [applications, setApplications] = useState([])
  const [jobs, setJobs] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  async function loadApplications(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      const response = await api.get('/applications/me')
      const applicationData = Array.isArray(response.data)
        ? response.data
        : []

      setApplications(applicationData)

      const uniqueJobIds = [
        ...new Set(
          applicationData
            .map((application) => application.job_id)
            .filter(Boolean)
        ),
      ]

      const jobResults = await Promise.all(
        uniqueJobIds.map(async (jobId) => {
          try {
            const jobResponse = await api.get(`/jobs/${jobId}`)
            return [jobId, jobResponse.data]
          } catch (err) {
            console.error(`Failed to load job ${jobId}:`, err)
            return [jobId, null]
          }
        })
      )

      setJobs(Object.fromEntries(jobResults))
    } catch (err) {
      console.error('Failed to load applications:', err)
      setError(
        err.response?.data?.detail ||
          'Unable to load your applications. Please try again.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [])

  const enrichedApplications = useMemo(
    () =>
      applications.map((application) => ({
        ...application,
        job: jobs[application.job_id] || null,
      })),
    [applications, jobs]
  )

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase()

    return enrichedApplications.filter((application) => {
      const status = String(application.status || '').toLowerCase()
      const job = application.job

      const matchesFilter =
        filter === 'all' || status === filter

      if (!matchesFilter) return false
      if (!query) return true

      return [
        job?.title,
        job?.location,
        job?.employment_type,
        application.job_title,
        application.company_name,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        )
    })
  }, [enrichedApplications, filter, search])

  const statusCounts = useMemo(() => {
    const counts = {
      all: applications.length,
      applied: 0,
      shortlisted: 0,
      interview: 0,
      selected: 0,
      rejected: 0,
    }

    applications.forEach((application) => {
      const status = String(application.status || '').toLowerCase()
      if (status in counts) counts[status] += 1
    })

    return counts
  }, [applications])

  if (loading) {
    return (
      <AppShell
        role="candidate"
        userName={user?.name || 'User'}
      >
        <div className="hs-applications-page">
          <div className="hs-applications-loading">
            Loading your applications...
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      role="candidate"
      userName={user?.name || 'User'}
    >
      <div className="hs-applications-page">
        <style>{`
          .hs-applications-page {
            max-width: 1180px;
            margin: 0 auto;
            padding: 34px 28px 60px;
          }

          .hs-applications-hero {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            align-items: flex-end;
            margin-bottom: 24px;
          }

          .hs-applications-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: .12em;
            color: #746b7f;
            margin-bottom: 10px;
          }

          .hs-applications-hero h1 {
            margin: 0;
            color: #28232e;
            font-size: clamp(30px, 4vw, 46px);
            line-height: 1.05;
            letter-spacing: -.035em;
          }

          .hs-applications-hero p {
            margin: 12px 0 0;
            max-width: 680px;
            color: #716b76;
            font-size: 15px;
            line-height: 1.65;
          }

          .hs-applications-refresh {
            border: 1px solid #e6dfe9;
            background: #fff;
            color: #51485a;
            border-radius: 12px;
            min-height: 42px;
            padding: 0 15px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 5px 18px rgba(54, 39, 68, .05);
          }

          .hs-applications-refresh:disabled {
            opacity: .65;
            cursor: default;
          }

          .hs-applications-summary {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 22px;
          }

          .hs-applications-stat {
            background: #fff;
            border: 1px solid #eee7f0;
            border-radius: 16px;
            padding: 16px 17px;
            box-shadow: 0 7px 24px rgba(54, 39, 68, .045);
          }

          .hs-applications-stat strong {
            display: block;
            font-size: 24px;
            color: #302a35;
          }

          .hs-applications-stat span {
            display: block;
            margin-top: 4px;
            color: #817887;
            font-size: 12px;
            font-weight: 700;
          }

          .hs-applications-toolbar {
            display: flex;
            gap: 12px;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 18px;
            flex-wrap: wrap;
          }

          .hs-applications-search {
            position: relative;
            flex: 1 1 300px;
          }

          .hs-applications-search svg {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: #9b91a2;
            pointer-events: none;
          }

          .hs-applications-search input {
            width: 100%;
            box-sizing: border-box;
            min-height: 44px;
            border: 1px solid #e4dce8;
            border-radius: 12px;
            padding: 0 14px 0 42px;
            background: #fff;
            color: #302a35;
            outline: none;
          }

          .hs-applications-filter {
            min-height: 44px;
            border: 1px solid #e4dce8;
            border-radius: 12px;
            padding: 0 12px;
            background: #fff;
            color: #4e4654;
            font-weight: 650;
            outline: none;
          }

          .hs-application-list {
            display: grid;
            gap: 14px;
          }

          .hs-application-card {
            background: #fff;
            border: 1px solid #eee7f0;
            border-radius: 20px;
            padding: 20px;
            box-shadow: 0 9px 30px rgba(54, 39, 68, .055);
          }

          .hs-application-top {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            align-items: flex-start;
          }

          .hs-application-title-row {
            display: flex;
            gap: 13px;
            min-width: 0;
          }

          .hs-application-icon {
            width: 46px;
            height: 46px;
            flex: 0 0 46px;
            border-radius: 13px;
            display: grid;
            place-items: center;
            background: #f1edff;
            color: #7163a7;
          }

          .hs-application-title {
            min-width: 0;
          }

          .hs-application-title h2 {
            margin: 0;
            font-size: 19px;
            color: #2d2732;
          }

          .hs-application-title p {
            margin: 5px 0 0;
            color: #706876;
            font-size: 13px;
          }

          .hs-application-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border-radius: 999px;
            padding: 7px 11px;
            font-size: 12px;
            font-weight: 800;
            white-space: nowrap;
          }

          .hs-application-status.applied {
            background: #edf2ff;
            color: #5268a9;
          }

          .hs-application-status.shortlisted {
            background: #fff4dc;
            color: #9a6b17;
          }

          .hs-application-status.interview {
            background: #e9f7f0;
            color: #28785a;
          }

          .hs-application-status.selected {
            background: #e8f7ed;
            color: #26754c;
          }

          .hs-application-status.rejected {
            background: #fff0ed;
            color: #ad4939;
          }

          .hs-application-status.unknown {
            background: #f2eef4;
            color: #6b6270;
          }

          .hs-application-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px 18px;
            margin: 17px 0 0 59px;
            color: #756d7b;
            font-size: 13px;
          }

          .hs-application-meta span {
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }

          .hs-application-intelligence {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
            margin: 14px 0 0 59px;
          }

          .hs-application-fit {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            min-height: 32px;
            padding: 0 10px;
            border: 1px solid #ebe5f4;
            border-radius: 9px;
            background: #faf9fd;
            color: #665e70;
            font-size: 12px;
            font-weight: 700;
          }

          .hs-application-fit svg {
            color: #7563c7;
          }

          .hs-application-fit strong {
            color: #5646b5;
          }

          .hs-application-eligibility {
            display: inline-flex;
            align-items: center;
            min-height: 32px;
            padding: 0 10px;
            border-radius: 9px;
            font-size: 12px;
            font-weight: 800;
          }

          .hs-application-eligibility.eligible {
            background: #eef8f2;
            color: #28785a;
            border: 1px solid #dcefe4;
          }

          .hs-application-eligibility.review {
            background: #fff7e8;
            color: #9a6b17;
            border: 1px solid #f2e3c1;
          }

          .hs-application-actions {
            display: inline-flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 14px;
          }

          .hs-application-view-button {
            border: 0;
            background: transparent;
            cursor: pointer;
          }

          .hs-application-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            margin-top: 18px;
            padding-top: 15px;
            border-top: 1px solid #f0ebf2;
          }

          .hs-application-date {
            color: #8a818f;
            font-size: 12px;
          }

          .hs-application-link {
            color: #66578f;
            text-decoration: none;
            font-size: 13px;
            font-weight: 800;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }

          .hs-applications-empty,
          .hs-applications-error,
          .hs-applications-loading {
            background: #fff;
            border: 1px solid #eee7f0;
            border-radius: 20px;
            padding: 48px 24px;
            text-align: center;
            color: #766d7c;
          }

          .hs-applications-empty strong,
          .hs-applications-error strong {
            display: block;
            color: #302a35;
            font-size: 17px;
            margin-bottom: 6px;
          }

          @media (max-width: 820px) {
            .hs-application-intelligence {
              margin-left: 0;
            }

            .hs-applications-page {
              padding: 26px 18px 45px;
            }

            .hs-applications-hero {
              align-items: flex-start;
              flex-direction: column;
            }

            .hs-applications-summary {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .hs-application-top {
              flex-direction: column;
            }

            .hs-application-meta {
              margin-left: 0;
            }
          }

          @media (max-width: 520px) {
            .hs-applications-summary {
              grid-template-columns: 1fr 1fr;
            }

            .hs-applications-toolbar {
              display: grid;
              grid-template-columns: 1fr;
            }

            .hs-application-card {
              padding: 16px;
            }

            .hs-application-footer {
              align-items: flex-start;
              flex-direction: column;
            }
          }
        `}</style>

        <section className="hs-applications-hero">
          <div>
            <div className="hs-applications-eyebrow">
              <BriefcaseBusiness size={15} />
              MY APPLICATIONS
            </div>
            <h1>Keep track of your opportunities.</h1>
            <p>
              See every application you have submitted and follow its latest
              status as recruiters move it through the hiring process.
            </p>
          </div>

          <button
            className="hs-applications-refresh"
            onClick={() => loadApplications(true)}
            disabled={refreshing}
          >
            <RefreshCw size={16} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </section>

        <section className="hs-applications-summary">
          <div className="hs-applications-stat">
            <strong>{statusCounts.all}</strong>
            <span>Total applications</span>
          </div>
          <div className="hs-applications-stat">
            <strong>{statusCounts.applied}</strong>
            <span>Applied</span>
          </div>
          <div className="hs-applications-stat">
            <strong>{statusCounts.shortlisted}</strong>
            <span>Shortlisted</span>
          </div>
          <div className="hs-applications-stat">
            <strong>{statusCounts.interview}</strong>
            <span>Interviews</span>
          </div>
          <div className="hs-applications-stat">
            <strong>{statusCounts.selected}</strong>
            <span>Selected</span>
          </div>
        </section>

        {error && (
          <div className="hs-applications-error" style={{ marginBottom: 18 }}>
            <strong>We couldn't load your applications.</strong>
            <div>{error}</div>
          </div>
        )}

        <section className="hs-applications-toolbar">
          <div className="hs-applications-search">
            <Search size={18} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by job title, location or type..."
            />
          </div>

          <select
            className="hs-applications-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All statuses ({statusCounts.all})</option>
            <option value="applied">Applied ({statusCounts.applied})</option>
            <option value="shortlisted">
              Shortlisted ({statusCounts.shortlisted})
            </option>
            <option value="interview">
              Interview ({statusCounts.interview})
            </option>
            <option value="selected">
              Selected ({statusCounts.selected})
            </option>
            <option value="rejected">
              Rejected ({statusCounts.rejected})
            </option>
          </select>
        </section>

        {filteredApplications.length === 0 ? (
          <div className="hs-applications-empty">
            <strong>
              {applications.length === 0
                ? 'You have no applications yet.'
                : 'No applications match your filters.'}
            </strong>
            <div>
              {applications.length === 0
                ? 'Apply to a job from the Jobs section and it will appear here.'
                : 'Try a different search term or status filter.'}
            </div>
          </div>
        ) : (
          <div className="hs-application-list">
            {filteredApplications.map((application) => {
              const meta = getStatusMeta(application.status)
              const StatusIcon = meta.icon
              const job = application.job

              return (
                <article
                  className="hs-application-card"
                  key={application.id}
                >
                  <div className="hs-application-top">
                    <div className="hs-application-title-row">
                      <div className="hs-application-icon">
                        <BriefcaseBusiness size={21} />
                      </div>

                      <div className="hs-application-title">
                        <h2>
                          {job?.title ||
                            application.job_title ||
                            `Job #${application.job_id}`}
                        </h2>
                        <p>
                          {application.company_name ||
                            job?.company_name ||
                            'Company details unavailable'}
                        </p>
                      </div>
                    </div>

                    <div className={`hs-application-status ${meta.className}`}>
                      <StatusIcon size={14} />
                      {meta.label}
                    </div>
                  </div>

                  <div className="hs-application-meta">
                    {job?.location && (
                      <span>
                        <MapPin size={14} />
                        {job.location}
                      </span>
                    )}

                    {job?.employment_type && (
                      <span>
                        <BriefcaseBusiness size={14} />
                        {job.employment_type}
                      </span>
                    )}

                    <span>
                      <CalendarDays size={14} />
                      Applied {formatAppliedDate(application.applied_at)}
                    </span>
                  </div>

                  {(getMatchScore(application) !== null ||
                    getEligibility(application) !== null) && (
                    <div className="hs-application-intelligence">
                      {getMatchScore(application) !== null && (
                        <div className="hs-application-fit">
                          <Target size={14} />
                          <span>HireSense match</span>
                          <strong>
                            {Math.round(getMatchScore(application))}%
                          </strong>
                        </div>
                      )}

                      {getEligibility(application) !== null && (
                        <span
                          className={`hs-application-eligibility ${
                            getEligibility(application)
                              ? 'eligible'
                              : 'review'
                          }`}
                        >
                          {getEligibility(application)
                            ? 'Eligible'
                            : 'Eligibility review'}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="hs-application-footer">
                    <span className="hs-application-date">
                      Application ID #{application.id}
                    </span>

                    <div className="hs-application-actions">
                      {job?.id && (
                        <button
                          type="button"
                          className="hs-application-link hs-application-view-button"
                          onClick={() => navigate(`/candidate/jobs/${job.id}`)}
                        >
                          View opportunity
                          <ArrowUpRight size={14} />
                        </button>
                      )}

                      {job?.application_url && (
                      <a
                        className="hs-application-link"
                        href={job.application_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        External application
                        <ExternalLink size={14} />
                      </a>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}

export default ApplicationsPage
