import { useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import {
  BriefcaseBusiness,
  Users,
  Clock3,
  CheckCircle2,
  XCircle,
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  X,
  MapPin,
  Phone,
  GraduationCap,
  Briefcase,
  FolderKanban,
  FileText,
  ExternalLink,
  UserRound,
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

  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortMode, setSortMode] = useState('best_match')

  const [activeJobId, setActiveJobId] = useState(() => searchParams.get('job') || 'all')
  const [updatingId, setUpdatingId] = useState(null)

  async function loadApplications() {
    try {
      setLoading(true)
      setError('')

      const jobsResponse = await api.get(
        '/jobs/recruiter/my-jobs'
      )

      const recruiterJobs =
        Array.isArray(jobsResponse.data)
          ? jobsResponse.data
          : []

      setJobs(recruiterJobs)

      const responses = await Promise.all(
        recruiterJobs.map(async (job) => {
          try {
            const response = await api.get(
              `/applications/job/${job.id}`
            )

            const jobApplications =
              Array.isArray(response.data)
                ? response.data
                : []

            /*
             * IMPORTANT:
             * Attach the job identity to every application.
             * This gives the frontend an explicit role boundary.
             */
            return jobApplications.map(
              (application) => ({
                ...application,
                job_id:
                  application.job_id ??
                  job.id,
                job_title:
                  application.job_title ||
                  job.title ||
                  'Untitled role',
              })
            )
          } catch (err) {
            console.error(
              `Failed to load applications for job ${job.id}:`,
              err
            )

            return []
          }
        })
      )

      setApplications(
        responses
          .flat()
          .sort(
            (a, b) =>
              getApplicationDate(b) -
              getApplicationDate(a)
          )
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
    if (
      authLoading ||
      !isAuthenticated
    ) {
      return
    }

    loadApplications()
  }, [
    authLoading,
    isAuthenticated,
  ])

  useEffect(() => {
    const requestedJob = searchParams.get('job')
    const requestedSearch = searchParams.get('search') || ''

    setActiveJobId(requestedJob || 'all')
    setSearch(requestedSearch)
  }, [searchParams])

  function selectRole(jobId) {
    const nextId = jobId === 'all' ? 'all' : String(jobId)
    setActiveJobId(nextId)

    const nextParams = new URLSearchParams(searchParams)

    if (nextId === 'all') {
      nextParams.delete('job')
    } else {
      nextParams.set('job', nextId)
    }

    setSearchParams(nextParams)
  }

  async function updateStatus(
    applicationId,
    status
  ) {
    try {
      setUpdatingId(applicationId)
      setError('')

      const response = await api.patch(
        `/applications/${applicationId}/status`,
        { status }
      )

      setApplications((current) =>
        current.map((application) =>
          application.id ===
          applicationId
            ? {
                ...application,
                ...(response.data || {}),
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

  /*
   * ---------------------------------------------------------
   * FILTER
   * ---------------------------------------------------------
   *
   * Search/status filtering happens BEFORE role grouping.
   * Ranking happens AFTER role grouping.
   *
   * Therefore candidates are never globally ranked.
   */
  const filteredApplications =
    useMemo(() => {
      const query =
        search.trim().toLowerCase()

      return applications.filter(
        (application) => {
          const matchesStatus =
            statusFilter === 'all' ||
            application.status ===
              statusFilter

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
            (!query ||
              searchable.includes(query))
          )
        }
      )
    }, [
      applications,
      search,
      statusFilter,
    ])

  /*
   * ---------------------------------------------------------
   * ROLE GROUPING
   * ---------------------------------------------------------
   *
   * Correct structure:
   *
   * group = {
   *   id,
   *   title,
   *   applications: [...]
   * }
   *
   * The previous version accidentally tried to iterate
   * the complete group object. This version explicitly
   * extracts group.applications.
   */
  const roleGroups = useMemo(() => {
    const groups = new Map()

    filteredApplications.forEach(
      (application) => {
        const jobId =
          application.job_id ??
          application.job?.id ??
          `title:${application.job_title || 'unknown'}`

        if (!groups.has(jobId)) {
          groups.set(jobId, {
            id: jobId,
            title:
              application.job_title ||
              'Untitled role',
            applications: [],
          })
        }

        groups
          .get(jobId)
          .applications.push(
            application
          )
      }
    )

    /*
     * Preserve recruiter job order.
     */
    const orderedGroups = []

    jobs.forEach((job) => {
      const group =
        groups.get(job.id)

      if (
        group &&
        Array.isArray(
          group.applications
        ) &&
        group.applications.length >
          0
      ) {
        orderedGroups.push({
          id: group.id,
          title:
            group.title ||
            job.title ||
            'Untitled role',

          /*
           * THIS is the important part.
           * We pass the actual application array.
           */
          applications:
            [...group.applications].sort(
              (a, b) =>
                compareApplications(
                  a,
                  b,
                  sortMode
                )
            ),
        })

        groups.delete(job.id)
      }
    })

    /*
     * Safety fallback for any application whose
     * job wasn't present in the jobs response.
     */
    groups.forEach((group) => {
      if (
        group &&
        Array.isArray(
          group.applications
        ) &&
        group.applications.length >
          0
      ) {
        orderedGroups.push({
          id: group.id,
          title:
            group.title ||
            'Untitled role',
          applications:
            [...group.applications].sort(
              (a, b) =>
                compareApplications(
                  a,
                  b,
                  sortMode
                )
            ),
        })
      }
    })

    return orderedGroups
  }, [
    filteredApplications,
    jobs,
    sortMode,
  ])

  const activeRole =
    activeJobId === 'all'
      ? null
      : roleGroups.find(
          (group) =>
            String(group.id) ===
            String(activeJobId)
        )

  const counts = useMemo(
    () => ({
      total:
        applications.length,

      applied:
        applications.filter(
          (item) =>
            item.status ===
            'applied'
        ).length,

      shortlisted:
        applications.filter(
          (item) =>
            item.status ===
            'shortlisted'
        ).length,

      interview:
        applications.filter(
          (item) =>
            item.status ===
            'interview'
        ).length,

      selected:
        applications.filter(
          (item) =>
            item.status ===
            'selected'
        ).length,

      eligible:
        applications.filter(
          (item) =>
            item.eligible !== false
        ).length,
    }),
    [applications]
  )

  if (authLoading) {
    return (
      <AppShell
        role="recruiter"
        userName={
          user?.name || 'Recruiter'
        }
      >
        <div
          style={
            styles.centerMessage
          }
        >
          Checking your account...
        </div>
      </AppShell>
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

  if (
    user?.role !== 'recruiter' &&
    user?.role !== 'admin'
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return (
    <AppShell
      role="recruiter"
      userName={
        user?.name || 'Recruiter'
      }
    >
      <div style={styles.page}>

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div style={styles.header}>
          <div>
            <div
              style={styles.kicker}
            >
              RECRUITMENT PIPELINE
            </div>

            <h1
              style={styles.title}
            >
              Applications
            </h1>

            <p
              style={styles.subtitle}
            >
              Review applicants by role,
              understand their HireSense
              intelligence, and prioritize
              candidates within each opening.
            </p>
          </div>

          <button
            type="button"
            onClick={loadApplications}
            disabled={loading}
            style={
              styles.refreshButton
            }
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

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div
          style={styles.statsGrid}
        >
          <StatCard
            icon={
              <Users size={20} />
            }
            label="Total applicants"
            value={
              counts.total
            }
            tone="purple"
          />

          <StatCard
            icon={
              <Clock3 size={20} />
            }
            label="New applications"
            value={
              counts.applied
            }
            tone="blue"
          />

          <StatCard
            icon={
              <CheckCircle2
                size={20}
              />
            }
            label="Shortlisted"
            value={
              counts.shortlisted
            }
            tone="mint"
          />

          <StatCard
            icon={
              <BriefcaseBusiness
                size={20}
              />
            }
            label="Interviews"
            value={
              counts.interview
            }
            tone="yellow"
          />
        </div>

        {/* =================================================
            MAIN WORKSPACE
        ================================================= */}

        <section
          style={styles.panel}
        >
          <div
            style={styles.panelHeader}
          >
            <div>
              <div
                style={
                  styles.panelKicker
                }
              >
                CANDIDATES
              </div>

              <h2
                style={
                  styles.panelTitle
                }
              >
                Applicant pipeline
              </h2>

              <p
                style={
                  styles.panelDescription
                }
              >
                Candidates are ranked
                independently for each
                job role.
              </p>
            </div>

            <div
              style={
                styles.panelHeaderRight
              }
            >
              <div
                style={
                  styles.jobCount
                }
              >
                {jobs.length} posted{' '}
                {jobs.length === 1
                  ? 'role'
                  : 'roles'}
              </div>

              <div
                style={
                  styles.rankingNote
                }
              >
                <Sparkles
                  size={13}
                />

                Role-based ranking
              </div>
            </div>
          </div>

          {/* =================================================
              ROLE TABS
          ================================================= */}

          <div
            style={
              styles.roleTabsWrapper
            }
          >
            <div
              style={styles.roleTabsHeader}
            >
              <div>
                <span
                  style={
                    styles.roleTabsEyebrow
                  }
                >
                  APPLICATION VIEWS
                </span>

                <span
                  style={
                    styles.roleTabsHelper
                  }
                >
                  Select a role to review candidates ranked for that opening.
                </span>
              </div>

              <span
                style={
                  styles.roleTabsTotal
                }
              >
                {roleGroups.length}{' '}
                {roleGroups.length === 1
                  ? 'active role'
                  : 'active roles'}
              </span>
            </div>

            <div
              style={styles.roleTabs}
            >
              <button
                type="button"
                onClick={() => selectRole('all')}
                style={{
                  ...styles.roleTab,
                  ...styles.allRoleTab,
                  ...(activeJobId ===
                  'all'
                    ? styles.roleTabActive
                    : {}),
                }}
              >
                <div
                  style={
                    styles.roleTabIcon
                  }
                >
                  <Users size={15} />
                </div>

                <div
                  style={
                    styles.roleTabContent
                  }
                >
                  <span
                    style={
                      styles.roleTabLabel
                    }
                  >
                    All Applications
                  </span>

                  <span
                    style={
                      styles.roleTabSubtext
                    }
                  >
                    Overview
                  </span>
                </div>

                <span
                  style={
                    styles.roleTabCount
                  }
                >
                  {applications.length}
                </span>
              </button>

              {roleGroups.map(
                (group) => {
                  const active =
                    String(
                      activeJobId
                    ) ===
                    String(group.id)

                  const topCandidate =
                    group.applications[0]

                  const topScore =
                    topCandidate
                      ? getProfileFit(
                          topCandidate
                        )
                      : 0

                  return (
                    <button
                      type="button"
                      key={String(
                        group.id
                      )}
                      onClick={() => selectRole(group.id)}
                      style={{
                        ...styles.roleTab,
                        ...(active
                          ? styles.roleTabActive
                          : {}),
                      }}
                    >
                      <div
                        style={{
                          ...styles.roleTabIcon,
                          ...(active
                            ? styles.roleTabIconActive
                            : {}),
                        }}
                      >
                        <BriefcaseBusiness
                          size={15}
                        />
                      </div>

                      <div
                        style={
                          styles.roleTabContent
                        }
                      >
                        <span
                          style={
                            styles.roleTabName
                          }
                        >
                          {group.title}
                        </span>

                        <span
                          style={
                            styles.roleTabSubtext
                          }
                        >
                          Top match{' '}
                          {Math.round(
                            topScore
                          )}
                          %
                        </span>
                      </div>

                      <span
                        style={{
                          ...styles.roleTabCount,
                          ...(active
                            ? styles.roleTabCountActive
                            : {}),
                        }}
                      >
                        {
                          group
                            .applications
                            .length
                        }
                      </span>
                    </button>
                  )
                }
              )}
            </div>
          </div>

          {/* =================================================
              FILTERS
          ================================================= */}

          <div
            style={styles.filters}
          >
            <div
              style={
                styles.searchWrap
              }
            >
              <Search
                size={18}
                style={
                  styles.searchIcon
                }
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder={
                  activeRole
                    ? `Search applicants for ${activeRole.title}...`
                    : 'Search candidates or jobs...'
                }
                style={
                  styles.searchInput
                }
              />
            </div>

            <div
              style={
                styles.selectWrap
              }
            >
              <select
                value={
                  statusFilter
                }
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                style={
                  styles.select
                }
              >
                <option value="all">
                  All statuses
                </option>

                {STATUS_OPTIONS.map(
                  (status) => (
                    <option
                      value={status}
                      key={status}
                    >
                      {formatStatus(
                        status
                      )}
                    </option>
                  )
                )}
              </select>

              <ChevronDown
                size={16}
                style={
                  styles.selectIcon
                }
              />
            </div>

            <div
              style={
                styles.sortGroup
              }
            >
              <span
                style={
                  styles.sortLabel
                }
              >
                Rank by
              </span>

              <div
                style={
                  styles.selectWrap
                }
              >
                <select
                  value={
                    sortMode
                  }
                  onChange={(event) =>
                    setSortMode(
                      event.target
                        .value
                    )
                  }
                  style={
                    styles.select
                  }
                >
                  <option value="best_match">
                    HireSense Best Match
                  </option>

                  <option value="skill">
                    Highest Skill Match
                  </option>

                  <option value="experience">
                    Highest Experience Fit
                  </option>

                  <option value="education">
                    Highest Education Fit
                  </option>

                  <option value="eligibility">
                    Eligibility First
                  </option>

                  <option value="newest">
                    Newest Application
                  </option>
                </select>

                <ChevronDown
                  size={16}
                  style={
                    styles.selectIcon
                  }
                />
              </div>
            </div>
          </div>

          {/* =================================================
              CONTENT
          ================================================= */}

          {loading ? (
            <div
              style={
                styles.emptyState
              }
            >
              Loading applications...
            </div>
          ) : filteredApplications.length ===
            0 ? (
            <EmptyState
              hasApplications={
                applications.length >
                0
              }
            />
          ) : activeJobId ===
            'all' ? (
            <AllApplicationsList
              roleGroups={
                roleGroups
              }
              updatingId={
                updatingId
              }
              onStatusChange={
                updateStatus
              }
            />
          ) : activeRole ? (
            <RoleApplicationList
              role={activeRole}
              updatingId={
                updatingId
              }
              onStatusChange={
                updateStatus
              }
            />
          ) : (
            <EmptyState
              hasApplications={
                applications.length >
                0
              }
            />
          )}
        </section>
      </div>
    </AppShell>
  )
}


/* =========================================================
   ALL APPLICATIONS LIST
========================================================= */

function AllApplicationsList({
  roleGroups,
  updatingId,
  onStatusChange,
}) {
  const totalApplications = roleGroups.reduce(
    (total, group) =>
      total + group.applications.length,
    0
  )

  return (
    <div
      style={
        styles.allApplicationsWorkspace
      }
    >
      <div
        style={
          styles.allApplicationsHeader
        }
      >
        <div>
          <div
            style={
              styles.allApplicationsKicker
            }
          >
            ALL APPLICATIONS
          </div>

          <h3
            style={
              styles.allApplicationsTitle
            }
          >
            All applicants across your posted roles
          </h3>

          <p
            style={
              styles.allApplicationsSubtitle
            }
          >
            Showing {totalApplications}{' '}
            {totalApplications === 1
              ? 'application'
              : 'applications'}{' '}
            across {roleGroups.length}{' '}
            {roleGroups.length === 1
              ? 'role'
              : 'roles'}. Candidates remain ranked within their own job role.
          </p>
        </div>

        <div
          style={
            styles.allApplicationsBadge
          }
        >
          <Users size={15} />
          {totalApplications}{' '}
          {totalApplications === 1
            ? 'application'
            : 'applications'}
        </div>
      </div>

      <div
        style={
          styles.allApplicationsNotice
        }
      >
        <div
          style={
            styles.overviewNoticeIcon
          }
        >
          <Sparkles size={16} />
        </div>

        <div>
          <strong
            style={
              styles.overviewNoticeTitle
            }
          >
            Collective application view
          </strong>

          <p
            style={
              styles.overviewNoticeText
            }
          >
            All applications are shown here together for quick review. HireSense still ranks candidates independently within each role, so a rank in one job is not compared with a rank from another job.
          </p>
        </div>
      </div>

      <div
        style={
          styles.allApplicationsRoleList
        }
      >
        {roleGroups.map((role) => {
          const eligibleCount =
            role.applications.filter(
              (application) =>
                application.eligible !== false
            ).length

          return (
            <section
              key={String(role.id)}
              style={
                styles.allApplicationsRoleSection
              }
            >
              <div
                style={
                  styles.allApplicationsRoleHeader
                }
              >
                <div
                  style={
                    styles.allApplicationsRoleIdentity
                  }
                >
                  <div
                    style={
                      styles.selectedRoleIcon
                    }
                  >
                    <BriefcaseBusiness
                      size={19}
                    />
                  </div>

                  <div>
                    <div
                      style={
                        styles.selectedRoleKicker
                      }
                    >
                      OPEN ROLE
                    </div>

                    <h4
                      style={
                        styles.allApplicationsRoleTitle
                      }
                    >
                      {role.title}
                    </h4>

                    <div
                      style={
                        styles.selectedRoleMeta
                      }
                    >
                      <span>
                        {role.applications.length}{' '}
                        {role.applications.length === 1
                          ? 'applicant'
                          : 'applicants'}
                      </span>
                      <span>•</span>
                      <span>
                        {eligibleCount} eligible
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={
                    styles.allApplicationsRoleBadge
                  }
                >
                  <Sparkles size={13} />
                  Role ranking
                </div>
              </div>

              <div
                style={
                  styles.rankingBanner
                }
              >
                <Sparkles size={14} />

                <div>
                  <strong
                    style={
                      styles.rankingBannerTitle
                    }
                  >
                    {role.title} ranking
                  </strong>

                  <span
                    style={
                      styles.rankingBannerText
                    }
                  >
                    Candidates below are ranked against other applicants for this role only.
                  </span>
                </div>
              </div>

              <div
                style={
                  styles.candidateList
                }
              >
                {role.applications.map(
                  (application, index) => (
                    <ApplicationRow
                      key={application.id}
                      rank={index + 1}
                      application={application}
                      peerApplications={
                        role.applications
                      }
                      updating={
                        updatingId === application.id
                      }
                      onStatusChange={
                        onStatusChange
                      }
                    />
                  )
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}


/* =========================================================
   ROLE APPLICATION LIST
========================================================= */

function RoleApplicationList({
  role,
  updatingId,
  onStatusChange,
}) {
  const eligibleCount =
    role.applications.filter(
      (application) =>
        application.eligible !==
        false
    ).length

  return (
    <div
      style={
        styles.roleWorkspace
      }
    >
      <div
        style={
          styles.selectedRoleHeader
        }
      >
        <div
          style={
            styles.selectedRoleIdentity
          }
        >
          <div
            style={
              styles.selectedRoleIcon
            }
          >
            <BriefcaseBusiness
              size={20}
            />
          </div>

          <div>
            <div
              style={
                styles.selectedRoleKicker
              }
            >
              OPEN ROLE
            </div>

            <h3
              style={
                styles.selectedRoleTitle
              }
            >
              {role.title}
            </h3>

            <div
              style={
                styles.selectedRoleMeta
              }
            >
              <span>
                {
                  role
                    .applications
                    .length
                }{' '}
                {role
                  .applications
                  .length ===
                1
                  ? 'applicant'
                  : 'applicants'}
              </span>

              <span>
                •
              </span>

              <span>
                {eligibleCount}{' '}
                eligible
              </span>
            </div>
          </div>
        </div>

        <div
          style={
            styles.roleRankingBadge
          }
        >
          <Sparkles
            size={13}
          />

          Ranked for this role
        </div>
      </div>

      <div
        style={
          styles.rankingBanner
        }
      >
        <Sparkles
          size={14}
        />

        <div>
          <strong
            style={
              styles.rankingBannerTitle
            }
          >
            HireSense role ranking
          </strong>

          <span
            style={
              styles.rankingBannerText
            }
          >
            Rank #1 means the strongest
            applicant within{' '}
            <strong>
              {role.title}
            </strong>
            . Candidates from other
            roles are not included in
            this ranking.
          </span>
        </div>
      </div>

      <div
        style={
          styles.candidateList
        }
      >
        {role.applications.map(
          (
            application,
            index
          ) => (
            <ApplicationRow
              key={
                application.id
              }
              rank={
                index + 1
              }
              application={
                application
              }
              peerApplications={
                role.applications
              }
              updating={
                updatingId ===
                application.id
              }
              onStatusChange={
                onStatusChange
              }
            />
          )
        )}
      </div>
    </div>
  )
}


/* =========================================================
   APPLICATION ROW
========================================================= */

function ApplicationRow({
  application,
  rank,
  peerApplications,
  updating,
  onStatusChange,
}) {
  const [showIntelligence, setShowIntelligence] = useState(false)
  const [showCandidateProfile, setShowCandidateProfile] = useState(false)
  const [candidateProfile, setCandidateProfile] = useState(null)
  const [candidateProfileLoading, setCandidateProfileLoading] = useState(false)
  const [candidateProfileError, setCandidateProfileError] = useState('')

  async function openCandidateProfile() {
    setShowCandidateProfile(true)

    if (candidateProfile) return

    try {
      setCandidateProfileLoading(true)
      setCandidateProfileError('')

      const response = await api.get(
        `/applications/candidate/${application.candidate_id}`
      )

      setCandidateProfile(response.data || null)
    } catch (err) {
      console.error('Failed to load candidate profile:', err)
      setCandidateProfileError(
        err.response?.data?.detail ||
          'Unable to load this candidate profile.'
      )
    } finally {
      setCandidateProfileLoading(false)
    }
  }

  const initial = (application.candidate_name || 'C')
    .trim()
    .charAt(0)
    .toUpperCase()

  const profileFit = getProfileFit(application)
  const skillMatch = Number(application.skill_score ?? 0)
  const experienceFit = Number(application.experience_score ?? 0)
  const educationFit = Number(application.education_score ?? 0)
  const eligible = application.eligible !== false
  const eligibilityReasons = Array.isArray(application.eligibility_reasons)
    ? application.eligibility_reasons
    : []

  const signalScores = [
    { label: 'Skills', value: skillMatch },
    { label: 'Experience', value: experienceFit },
    { label: 'Education', value: educationFit },
  ]

  const strongestSignal = [...signalScores].sort((a, b) => b.value - a.value)[0]
  const weakestSignal = [...signalScores].sort((a, b) => a.value - b.value)[0]

  const primaryConcern = !eligible
    ? eligibilityReasons[0] || 'Eligibility requirements need recruiter review.'
    : weakestSignal.value < 70
      ? `${weakestSignal.label} fit is the main area to review.`
      : 'No major signal is currently below the review threshold.'

  return (
    <article
      style={{
        ...styles.applicationRow,
        ...(rank === 1 ? styles.topCandidate : {}),
      }}
    >
      <div style={styles.candidateDecisionHeader}>
        <div style={styles.candidateIdentity}>
          <div style={styles.rankBadgeColumn}>
            <span style={rank === 1 ? styles.rankNumberTop : styles.rankNumber}>
              #{rank}
            </span>
            <span style={styles.rankLabel}>role rank</span>
          </div>

          <div style={styles.candidateAvatar}>{initial}</div>

          <div style={styles.candidateIdentityText}>
            <div style={styles.candidateNameRow}>
              <h3 style={styles.candidateName}>
                {application.candidate_name}
              </h3>
              {rank === 1 && (
                <span style={styles.topMatchBadge}>
                  <Sparkles size={11} />
                  Top role match
                </span>
              )}
            </div>

            <div style={styles.jobTitle}>
              Applied for <strong>{application.job_title}</strong>
            </div>

            <div style={styles.applicationMeta}>
              <span>Application #{application.id}</span>
              {application.applied_at && (
                <span>{formatDate(application.applied_at)}</span>
              )}
              {application.candidate_experience_years != null && (
                <span>
                  {Number(application.candidate_experience_years).toFixed(1)} yrs experience
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={styles.candidateDecisionRight}>
          <div style={styles.matchScoreBlock}>
            <span style={styles.matchScoreLabel}>MATCH</span>
            <strong style={styles.matchScoreValue}>
              {Math.round(profileFit)}%
            </strong>
          </div>
          <StatusBadge status={application.status} />
        </div>
      </div>

      <div style={styles.decisionSignalRow}>
        <DecisionMetric label="Skills" value={skillMatch} />
        <DecisionMetric label="Experience" value={experienceFit} />
        <DecisionMetric label="Education" value={educationFit} />

        <div
          style={
            eligible
              ? styles.eligibilityCard
              : styles.eligibilityCardReview
          }
        >
          {eligible ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          <div>
            <span style={styles.signalLabel}>Eligibility</span>
            <strong style={styles.eligibilityValue}>
              {eligible ? 'Eligible' : 'Review'}
            </strong>
          </div>
        </div>
      </div>

      <div style={styles.recruiterReadRow}>
        <div style={styles.readSignal}>
          <Sparkles size={13} />
          <span>
            <strong>Strongest signal</strong>
            <span style={styles.readSignalValue}>{strongestSignal.label} · {Math.round(strongestSignal.value)}%</span>
          </span>
        </div>

        <div style={eligible ? styles.readSignal : styles.readSignalWarning}>
          {eligible ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
          <span>
            <strong>{eligible ? 'Recruiter note' : 'Main concern'}</strong>
            <span style={styles.readSignalValue}>{primaryConcern}</span>
          </span>
        </div>
      </div>

      <div style={styles.applicationActionBar}>
        <button
          type="button"
          onClick={() => setShowIntelligence((current) => !current)}
          style={styles.intelligenceToggle}
        >
          <Sparkles size={13} />
          {showIntelligence ? 'Hide candidate intelligence' : 'View candidate intelligence'}
          {showIntelligence ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <div style={styles.applicationActionsRight}>
          <button
            type="button"
            style={styles.profileActionButtonCompact}
            onClick={openCandidateProfile}
          >
            <UserRound size={14} />
            View profile
            <ArrowRight size={14} />
          </button>

          <div style={styles.statusControlInline}>
            <select
              value={application.status}
              onChange={(event) =>
                onStatusChange(application.id, event.target.value)
              }
              disabled={updating}
              style={styles.statusSelect}
              aria-label={`Update status for ${application.candidate_name}`}
            >
              {STATUS_OPTIONS.map((status) => (
                <option value={status} key={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
            {updating && <span style={styles.updatingText}>Saving...</span>}
          </div>
        </div>
      </div>

      {showIntelligence && (
        <div style={styles.expandedIntelligence}>
          <div style={styles.expandedHeader}>
            <div>
              <div style={styles.expandedKicker}>HIRE SENSE INTELLIGENCE</div>
              <h4 style={styles.expandedTitle}>
                Evidence and ranking explanation
              </h4>
            </div>
            <span style={styles.evidenceHint}>Role-specific</span>
          </div>

          <CandidateInsight
            profileFit={profileFit}
            skillMatch={skillMatch}
            experienceFit={experienceFit}
            educationFit={educationFit}
            eligible={eligible}
            eligibilityReasons={eligibilityReasons}
            matchedSkills={application.matched_skills}
            missingSkills={application.missing_skills}
            missingRequiredSkills={application.missing_required_skills}
          />

          <RankingExplanation
            application={application}
            rank={rank}
            peerApplications={peerApplications}
            profileFit={profileFit}
            skillMatch={skillMatch}
            experienceFit={experienceFit}
            educationFit={educationFit}
            eligible={eligible}
          />

          <div style={styles.profileActionBar}>
            <div>
              <strong style={styles.profileActionTitle}>
                Candidate profile evidence
              </strong>
              <span style={styles.profileActionText}>
                Review skills, education, experience, projects, and latest resume evidence.
              </span>
            </div>

            <button
              type="button"
              style={styles.profileActionButton}
              onClick={openCandidateProfile}
            >
              <UserRound size={14} />
              Full candidate profile
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {showCandidateProfile && (
        <CandidateProfileDrawer
          data={candidateProfile}
          loading={candidateProfileLoading}
          error={candidateProfileError}
          application={application}
          onClose={() => setShowCandidateProfile(false)}
          onRetry={() => {
            setCandidateProfile(null)
            openCandidateProfile()
          }}
        />
      )}
    </article>
  )
}

function DecisionMetric({ label, value }) {
  const safeValue = Number.isFinite(Number(value))
    ? Math.max(0, Math.min(100, Number(value)))
    : 0

  const roundedValue = Math.round(safeValue)

  return (
    <div style={styles.decisionMetric}>
      <div style={styles.decisionMetricTop}>
        <span>{label}</span>
        <strong>{roundedValue}%</strong>
      </div>

      <div
        style={styles.decisionMetricTrack}
        role="img"
        aria-label={`${label} score ${roundedValue}%`}
      >
        <span style={styles.scoreBandWeak} />
        <span style={styles.scoreBandReview} />
        <span style={styles.scoreBandGood} />
        <span style={styles.scoreBandStrong} />
        <span
          style={{
            ...styles.scoreMarker,
            left: `${safeValue}%`,
          }}
        />
      </div>

    </div>
  )
}


/* =========================================================
   CANDIDATE PROFILE DRAWER
========================================================= */

function CandidateProfileDrawer({
  data,
  loading,
  error,
  application,
  onClose,
  onRetry,
}) {
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  const candidate = data?.candidate || {}
  const skills = Array.isArray(data?.skills) ? data.skills : []
  const education = Array.isArray(data?.education) ? data.education : []
  const experience = Array.isArray(data?.experience) ? data.experience : []
  const projects = Array.isArray(data?.projects) ? data.projects : []
  const resume = data?.resume || null

  return (
    <div
      style={styles.drawerBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <aside style={styles.profileDrawer}>
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerKicker}>CANDIDATE INTELLIGENCE</div>
            <h2 style={styles.drawerTitle}>
              {candidate.full_name || application.candidate_name || 'Candidate profile'}
            </h2>
            <p style={styles.drawerSubtitle}>
              Profile evidence for <strong>{application.job_title}</strong>.
              Match scores remain role-specific and separate from this profile view.
            </p>
          </div>

          <button
            type="button"
            style={styles.drawerClose}
            onClick={onClose}
            aria-label="Close candidate profile"
          >
            <X size={19} />
          </button>
        </div>

        <div style={styles.drawerBody}>
          {loading && (
            <div style={styles.drawerState}>
              <RefreshCw size={20} />
              Loading candidate evidence...
            </div>
          )}

          {!loading && error && (
            <div style={styles.drawerError}>
              <AlertTriangle size={18} />
              <div>
                <strong>Candidate profile could not be loaded.</strong>
                <span>{error}</span>
                <button type="button" style={styles.retryButton} onClick={onRetry}>
                  Try again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && data && (
            <>
              <section style={styles.profileHero}>
                <div style={styles.profileHeroAvatar}>
                  {(candidate.full_name || application.candidate_name || 'C')
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div style={styles.profileHeroMain}>
                  <h3 style={styles.profileHeroName}>
                    {candidate.full_name || application.candidate_name}
                  </h3>

                  <div style={styles.profileContactRow}>
                    {candidate.location && (
                      <span><MapPin size={13} /> {candidate.location}</span>
                    )}
                    {candidate.phone && (
                      <span><Phone size={13} /> {candidate.phone}</span>
                    )}
                  </div>

                  <p style={styles.profileSummary}>
                    {candidate.summary ||
                      'No candidate summary has been added yet.'}
                  </p>
                </div>
              </section>

              <ProfileSection
                icon={<Sparkles size={16} />}
                eyebrow="SKILLS"
                title={`Skills & evidence (${skills.length})`}
              >
                {skills.length ? (
                  <div style={styles.profileSkillGrid}>
                    {skills.map((skill) => (
                      <div
                        key={`${skill.skill_id}-${skill.skill_name}`}
                        style={styles.profileSkillCard}
                      >
                        <strong>{skill.skill_name}</strong>
                        <span>
                          {skill.category || 'Skill'}
                          {skill.proficiency != null
                            ? ` · ${Number(skill.proficiency).toFixed(0)}% proficiency`
                            : ''}
                          {skill.years_used != null
                            ? ` · ${Number(skill.years_used).toFixed(1)} yrs`
                            : ''}
                        </span>
                        {skill.source && (
                          <small>Evidence: {skill.source}</small>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <ProfileEmpty text="No profile skills are available." />
                )}
              </ProfileSection>

              <ProfileSection
                icon={<GraduationCap size={16} />}
                eyebrow="EDUCATION"
                title={`Education (${education.length})`}
              >
                {education.length ? (
                  <div style={styles.profileTimeline}>
                    {education.map((item) => (
                      <EvidenceCard key={item.id}>
                        <strong>
                          {item.degree || 'Education'}
                          {item.field_of_study ? ` · ${item.field_of_study}` : ''}
                        </strong>
                        <span>{item.institution}</span>
                        <small>
                          {[item.start_year, item.end_year].filter(Boolean).join(' – ') || 'Dates not provided'}
                          {item.grade != null ? ` · Grade ${item.grade}` : ''}
                        </small>
                      </EvidenceCard>
                    ))}
                  </div>
                ) : (
                  <ProfileEmpty text="No education evidence is available." />
                )}
              </ProfileSection>

              <ProfileSection
                icon={<Briefcase size={16} />}
                eyebrow="EXPERIENCE"
                title={`Experience (${experience.length})`}
              >
                {experience.length ? (
                  <div style={styles.profileTimeline}>
                    {experience.map((item) => (
                      <EvidenceCard key={item.id}>
                        <strong>{item.job_title}</strong>
                        <span>
                          {item.company_name}
                          {item.employment_type ? ` · ${item.employment_type}` : ''}
                        </span>
                        <small>
                          {[item.start_date, item.end_date || 'Present']
                            .filter(Boolean)
                            .join(' – ')}
                          {item.location ? ` · ${item.location}` : ''}
                        </small>
                        {item.description && <p>{item.description}</p>}
                      </EvidenceCard>
                    ))}
                  </div>
                ) : (
                  <ProfileEmpty text="No experience evidence is available." />
                )}
              </ProfileSection>

              <ProfileSection
                icon={<FolderKanban size={16} />}
                eyebrow="PROJECTS"
                title={`Projects (${projects.length})`}
              >
                {projects.length ? (
                  <div style={styles.profileTimeline}>
                    {projects.map((item) => (
                      <EvidenceCard key={item.id}>
                        <strong>{item.project_name}</strong>
                        <span>
                          {[item.project_type, item.technologies]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                        <small>
                          {[item.start_date, item.end_date || 'Present']
                            .filter(Boolean)
                            .join(' – ')}
                        </small>
                        {item.description && <p>{item.description}</p>}
                        {item.project_link && (
                          <a
                            href={item.project_link}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.evidenceLink}
                          >
                            Open project <ExternalLink size={12} />
                          </a>
                        )}
                      </EvidenceCard>
                    ))}
                  </div>
                ) : (
                  <ProfileEmpty text="No project evidence is available." />
                )}
              </ProfileSection>

              <ProfileSection
                icon={<FileText size={16} />}
                eyebrow="RESUME"
                title="Latest resume evidence"
              >
                {resume ? (
                  <div style={styles.resumeEvidenceCard}>
                    <div style={styles.resumeEvidenceTop}>
                      <div>
                        <strong>{resume.file_name}</strong>
                        <span>
                          {resume.file_type || 'Resume'}
                          {' · '}
                          {resume.has_extracted_text
                            ? 'Text evidence available'
                            : 'No extracted text'}
                        </span>
                      </div>
                      <FileText size={20} />
                    </div>

                    {resume.extracted_text ? (
                      <div style={styles.resumeExtract}>
                        {resume.extracted_text}
                      </div>
                    ) : (
                      <ProfileEmpty text="No extracted resume text is available." />
                    )}
                  </div>
                ) : (
                  <ProfileEmpty text="No resume has been uploaded by this candidate." />
                )}
              </ProfileSection>

              <div style={styles.decisionSupportNote}>
                <Sparkles size={15} />
                <span>
                  HireSense presents profile evidence and role-specific matching
                  signals as decision support. Final hiring decisions remain with
                  the recruiter.
                </span>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}

function ProfileSection({ icon, eyebrow, title, children }) {
  return (
    <section style={styles.profileSection}>
      <div style={styles.profileSectionHeader}>
        <div style={styles.profileSectionIcon}>{icon}</div>
        <div>
          <div style={styles.profileSectionEyebrow}>{eyebrow}</div>
          <h4 style={styles.profileSectionTitle}>{title}</h4>
        </div>
      </div>
      {children}
    </section>
  )
}

function EvidenceCard({ children }) {
  return <div style={styles.evidenceCard}>{children}</div>
}

function ProfileEmpty({ text }) {
  return <div style={styles.profileEmpty}>{text}</div>
}


/* =========================================================
   RANKING EXPLANATION
========================================================= */

function RankingExplanation({
  application,
  rank,
  peerApplications,
  profileFit,
  skillMatch,
  experienceFit,
  educationFit,
  eligible,
}) {
  /*
   * peerApplications is ALREADY restricted to this role.
   * We therefore never compare against another job.
   */
  const sameRole =
    Array.isArray(
      peerApplications
    )
      ? peerApplications
      : []

  const currentIndex =
    sameRole.findIndex(
      (item) =>
        item.id ===
        application.id
    )

  const comparison =
    currentIndex >= 0
      ? sameRole[
          currentIndex + 1
        ] ||
        sameRole[
          currentIndex - 1
        ] ||
        null
      : null

  const reasons = []

  if (!eligible) {
    reasons.push(
      'Eligibility requires review before this candidate should be prioritized.'
    )
  }

  if (comparison) {
    const comparisonProfile =
      getProfileFit(
        comparison
      )

    const comparisonSkill =
      Number(
        comparison.skill_score ??
          0
      )

    const comparisonExperience =
      Number(
        comparison.experience_score ??
          0
      )

    const comparisonEducation =
      Number(
        comparison.education_score ??
          0
      )

    const comparisonEligible =
      comparison.eligible !==
      false

    if (
      eligible &&
      !comparisonEligible
    ) {
      reasons.push(
        'Eligibility gives this candidate priority over the nearby applicant.'
      )
    }

    const profileDelta =
      Math.round(
        profileFit -
          comparisonProfile
      )

    const skillDelta =
      Math.round(
        skillMatch -
          comparisonSkill
      )

    const experienceDelta =
      Math.round(
        experienceFit -
          comparisonExperience
      )

    const educationDelta =
      Math.round(
        educationFit -
          comparisonEducation
      )

    if (
      profileDelta !== 0
    ) {
      reasons.push(
        `${profileDelta > 0 ? '+' : ''}${profileDelta}% profile fit versus ${comparison.candidate_name || 'the next-ranked applicant'}.`
      )
    }

    if (
      skillDelta !== 0
    ) {
      reasons.push(
        `${skillDelta > 0 ? '+' : ''}${skillDelta}% skill match.`
      )
    }

    if (
      experienceDelta !==
      0
    ) {
      reasons.push(
        `${experienceDelta > 0 ? '+' : ''}${experienceDelta}% experience fit.`
      )
    }

    if (
      educationDelta !==
      0
    ) {
      reasons.push(
        `${educationDelta > 0 ? '+' : ''}${educationDelta}% education fit.`
      )
    }
  }

  if (
    reasons.length ===
    0
  ) {
    reasons.push(
      rank === 1
        ? 'Highest-ranked applicant for this role based on the available evidence.'
        : 'Ranking is based on the available profile, skills, experience, education, and eligibility signals.'
    )
  }

  return (
    <div
      style={
        styles.rankingExplanation
      }
    >
      <div
        style={
          styles.rankingExplanationHeader
        }
      >
        <span
          style={
            styles.rankingExplanationTitle
          }
        >
          Why this ranking?
        </span>

        <span
          style={
            styles.rankingExplanationRank
          }
        >
          Role #{rank}
        </span>
      </div>

      <p
        style={
          styles.rankingExplanationIntro
        }
      >
        {comparison
          ? `Compared with ${comparison.candidate_name || 'the nearby applicant'} for this same role.`
          : 'This is the highest-ranked applicant in this role.'}
      </p>

      <div
        style={
          styles.rankingReasonList
        }
      >
        {reasons
          .slice(0, 4)
          .map(
            (
              reason,
              index
            ) => (
              <div
                key={`${application.id}-reason-${index}`}
                style={
                  styles.rankingReasonItem
                }
              >
                <span
                  style={
                    styles.rankingReasonDot
                  }
                >
                  •
                </span>

                <span>
                  {reason}
                </span>
              </div>
            )
          )}
      </div>
    </div>
  )
}


/* =========================================================
   CANDIDATE INSIGHT
========================================================= */

function CandidateInsight({
  profileFit,
  skillMatch,
  experienceFit,
  educationFit,
  eligible,
  eligibilityReasons,
  matchedSkills,
  missingSkills,
  missingRequiredSkills,
}) {
  const matched =
    Array.isArray(
      matchedSkills
    )
      ? matchedSkills
      : []

  const missing =
    Array.isArray(
      missingSkills
    )
      ? missingSkills
      : []

  const missingRequired =
    Array.isArray(
      missingRequiredSkills
    )
      ? missingRequiredSkills
      : []

  const scores = [
    {
      label: 'skills',
      value: skillMatch,
    },
    {
      label: 'experience',
      value: experienceFit,
    },
    {
      label: 'education',
      value: educationFit,
    },
  ]

  const strongest =
    [...scores].sort(
      (a, b) =>
        b.value - a.value
    )[0]

  const weakest =
    [...scores].sort(
      (a, b) =>
        a.value - b.value
    )[0]

  let summary

  if (!eligible) {
    summary =
      missingRequired.length >
      0
        ? `Review required: ${missingRequired.length} required skill${missingRequired.length === 1 ? '' : 's'} lack sufficient evidence.`
        : eligibilityReasons[0] ||
          'Eligibility requirements need recruiter review.'
  } else if (
    profileFit >= 80
  ) {
    summary =
      matched.length > 0
        ? `Strong overall fit with ${matched.length} matched skill${matched.length === 1 ? '' : 's'}, led by ${strongest.label} fit.`
        : `Strong overall profile alignment, led by ${strongest.label} fit.`
  } else if (
    profileFit >= 65
  ) {
    summary =
      `Promising fit. ${capitalize(strongest.label)} is the strongest signal; ${weakest.label} is the main area to review.`
  } else {
    summary =
      `Lower current profile alignment. Review ${weakest.label} and the candidate's evidence before advancing.`
  }

  return (
    <div
      style={
        styles.insightArea
      }
    >
      <div
        style={
          styles.insightSummary
        }
      >
        <div
          style={
            styles.insightIcon
          }
        >
          {eligible ? (
            <Sparkles
              size={14}
            />
          ) : (
            <AlertTriangle
              size={14}
            />
          )}
        </div>

        <div
          style={
            styles.insightCopy
          }
        >
          <span
            style={
              styles.insightTitle
            }
          >
            AI insight
          </span>

          <p
            style={
              styles.insightText
            }
          >
            {summary}
          </p>
        </div>
      </div>

      {matched.length >
        0 && (
        <div
          style={
            styles.evidenceGroup
          }
        >
          <span
            style={
              styles.evidenceLabel
            }
          >
            Matched
          </span>

          <div
            style={
              styles.evidenceTags
            }
          >
            {matched
              .slice(0, 5)
              .map(
                (skill) => (
                  <span
                    key={`matched-${skill}`}
                    style={
                      styles.matchedTag
                    }
                  >
                    {skill}
                  </span>
                )
              )}

            {matched.length >
              5 && (
              <span
                style={
                  styles.moreTag
                }
              >
                +{matched.length - 5}
              </span>
            )}
          </div>
        </div>
      )}

      {missing.length >
        0 && (
        <div
          style={
            styles.evidenceGroup
          }
        >
          <span
            style={
              styles.evidenceLabel
            }
          >
            Gaps
          </span>

          <div
            style={
              styles.evidenceTags
            }
          >
            {missing
              .slice(0, 5)
              .map(
                (skill) => (
                  <span
                    key={`missing-${skill}`}
                    style={
                      styles.missingTag
                    }
                  >
                    {skill}
                  </span>
                )
              )}

            {missing.length >
              5 && (
              <span
                style={
                  styles.moreTag
                }
              >
                +{missing.length - 5}
              </span>
            )}
          </div>
        </div>
      )}

      <div
        style={
          styles.intelligenceFooter
        }
      >
        <div
          style={
            eligible
              ? styles.eligibilityGood
              : styles.eligibilityWarning
          }
        >
          {eligible ? (
            <CheckCircle2
              size={14}
            />
          ) : (
            <XCircle
              size={14}
            />
          )}

          {eligible
            ? 'Eligible for this role'
            : 'Eligibility needs review'}
        </div>

        {!eligible &&
          eligibilityReasons.length >
            0 && (
            <span
              style={
                styles.eligibilityReason
              }
            >
              {
                eligibilityReasons[0]
              }
            </span>
          )}
      </div>
    </div>
  )
}


/* =========================================================
   METRICS
========================================================= */

function IntelligenceMetric({
  label,
  value,
  tone,
}) {
  const tones = {
    purple: [
      '#f4f0ff',
      '#6f5bc4',
    ],
    blue: [
      '#eef5ff',
      '#4777b8',
    ],
    mint: [
      '#edf9f3',
      '#2c8661',
    ],
    yellow: [
      '#fff7e8',
      '#aa761d',
    ],
  }

  const [
    background,
    color,
  ] =
    tones[tone] ||
    tones.purple

  return (
    <div
      style={{
        ...styles.intelligenceMetric,
        background,
      }}
    >
      <strong
        style={{ color }}
      >
        {Math.round(
          Number(value) || 0
        )}
        %
      </strong>

      <span>
        {label}
      </span>
    </div>
  )
}


function MiniMetric({
  label,
  value,
}) {
  return (
    <div
      style={
        styles.miniMetric
      }
    >
      <strong>
        {Math.round(
          Number(value) || 0
        )}
        %
      </strong>

      <span>
        {label}
      </span>
    </div>
  )
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  label,
  value,
  tone,
}) {
  const tones = {
    purple: [
      '#eee8ff',
      '#6f5bc4',
    ],
    blue: [
      '#e8f2ff',
      '#4777b8',
    ],
    mint: [
      '#e7f7ef',
      '#2c8661',
    ],
    yellow: [
      '#fff2d9',
      '#aa761d',
    ],
  }

  const [
    background,
    color,
  ] =
    tones[tone] ||
    tones.purple

  return (
    <div
      style={styles.statCard}
    >
      <div
        style={{
          ...styles.statIcon,
          background,
          color,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={
            styles.statLabel
          }
        >
          {label}
        </div>

        <div
          style={
            styles.statValue
          }
        >
          {value}
        </div>
      </div>
    </div>
  )
}


/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}) {
  const config = {
    applied: {
      background:
        '#edf2ff',
      color:
        '#5268a9',
      icon: (
        <Clock3
          size={13}
        />
      ),
    },

    shortlisted: {
      background:
        '#fff4dc',
      color:
        '#9a6b17',
      icon: (
        <CheckCircle2
          size={13}
        />
      ),
    },

    interview: {
      background:
        '#e9f7f0',
      color:
        '#28785a',
      icon: (
        <BriefcaseBusiness
          size={13}
        />
      ),
    },

    rejected: {
      background:
        '#fff0ed',
      color:
        '#ad4939',
      icon: (
        <XCircle
          size={13}
        />
      ),
    },

    selected: {
      background:
        '#eee8ff',
      color:
        '#6f5bc4',
      icon: (
        <CheckCircle2
          size={13}
        />
      ),
    },
  }

  const current =
    config[status] ||
    config.applied

  return (
    <span
      style={{
        ...styles.statusBadge,
        background:
          current.background,
        color:
          current.color,
      }}
    >
      {current.icon}

      {formatStatus(
        status
      )}
    </span>
  )
}


/* =========================================================
   SORTING
========================================================= */

function compareApplications(
  a,
  b,
  mode
) {
  const profileA =
    getProfileFit(a)

  const profileB =
    getProfileFit(b)

  const skillA =
    Number(
      a.skill_score ?? 0
    )

  const skillB =
    Number(
      b.skill_score ?? 0
    )

  const experienceA =
    Number(
      a.experience_score ??
        0
    )

  const experienceB =
    Number(
      b.experience_score ??
        0
    )

  const educationA =
    Number(
      a.education_score ??
        0
    )

  const educationB =
    Number(
      b.education_score ??
        0
    )

  const eligibleA =
    a.eligible !== false

  const eligibleB =
    b.eligible !== false

  const dateA =
    getApplicationDate(a)

  const dateB =
    getApplicationDate(b)

  if (
    mode === 'newest'
  ) {
    return (
      dateB - dateA
    )
  }

  if (
    mode === 'skill'
  ) {
    return (
      skillB -
        skillA ||
      profileB -
        profileA ||
      dateB -
        dateA
    )
  }

  if (
    mode === 'experience'
  ) {
    return (
      experienceB -
        experienceA ||
      profileB -
        profileA ||
      dateB -
        dateA
    )
  }

  if (
    mode === 'education'
  ) {
    return (
      educationB -
        educationA ||
      profileB -
        profileA ||
      dateB -
        dateA
    )
  }

  if (
    mode === 'eligibility'
  ) {
    return (
      Number(!eligibleA) -
        Number(!eligibleB) ||
      profileB -
        profileA ||
      dateB -
        dateA
    )
  }

  /*
   * HireSense Best Match
   *
   * IMPORTANT:
   * This function receives applications belonging
   * to the SAME ROLE only.
   */
  return (
    Number(!eligibleA) -
      Number(!eligibleB) ||
    profileB -
      profileA ||
    skillB -
      skillA ||
    experienceB -
      experienceA ||
    educationB -
      educationA ||
    dateB -
      dateA
  )
}


/* =========================================================
   HELPERS
========================================================= */

function getProfileFit(
  application
) {
  return Number(
    application?.profile_fit_score ??
      application?.match_score ??
      0
  )
}


function getApplicationDate(
  application
) {
  if (
    !application?.applied_at
  ) {
    return 0
  }

  const value =
    new Date(
      application.applied_at
    ).getTime()

  return Number.isNaN(
    value
  )
    ? 0
    : value
}


function formatStatus(
  status
) {
  return String(
    status || ''
  )
    .replace(/_/g, ' ')
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    )
}


function formatDate(
  value
) {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  )
}


function capitalize(
  value
) {
  if (!value) {
    return ''
  }

  return (
    value.charAt(0)
      .toUpperCase() +
    value.slice(1)
  )
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  hasApplications,
}) {
  return (
    <div
      style={
        styles.emptyState
      }
    >
      <div
        style={
          styles.emptyIcon
        }
      >
        <Users
          size={24}
        />
      </div>

      <h3
        style={
          styles.emptyTitle
        }
      >
        {hasApplications
          ? 'No matching applications'
          : 'No applications yet'}
      </h3>

      <p
        style={
          styles.emptyText
        }
      >
        {hasApplications
          ? 'Try another candidate name, job title, or status.'
          : 'Applications submitted to your jobs will appear here.'}
      </p>
    </div>
  )
}


/* =========================================================
   STYLES
========================================================= */

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
    marginBottom: '26px',
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
    maxWidth: '720px',
    color: '#667085',
    fontSize: '14px',
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
    fontSize: '12px',
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
    gap: '15px',
    marginBottom: '22px',
  },

  statCard: {
    minHeight: '96px',
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
    padding: '18px',
    boxSizing: 'border-box',
    border: '1px solid #e8e4df',
    borderRadius: '17px',
    background: '#ffffff',
    boxShadow:
      '0 8px 28px rgba(40, 30, 70, 0.045)',
  },

  statIcon: {
    width: '43px',
    height: '43px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '12px',
  },

  statLabel: {
    color: '#718096',
    fontSize: '11px',
    fontWeight: 700,
  },

  statValue: {
    marginTop: '3px',
    color: '#18233d',
    fontSize: '24px',
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
    padding: '23px 25px 18px',
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

  panelDescription: {
    margin: '5px 0 0',
    color: '#858b99',
    fontSize: '11px',
  },

  panelHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
  },

  jobCount: {
    padding: '7px 10px',
    borderRadius: '9px',
    background: '#f5f2fb',
    color: '#756a8f',
    fontSize: '10px',
    fontWeight: 700,
  },

  rankingNote: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '7px 10px',
    border: '1px solid #e7e1f4',
    borderRadius: '9px',
    background: '#fcfbff',
    color: '#786b9b',
    fontSize: '10px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },

  /* =====================================================
     ROLE TABS
  ===================================================== */

  roleTabsWrapper: {
    padding: '14px 25px 15px',
    borderBottom: '1px solid #eeeae5',
    background: '#ffffff',
  },

  roleTabsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
    marginBottom: '10px',
  },

  roleTabsEyebrow: {
    display: 'block',
    color: '#8f86a0',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.11em',
  },

  roleTabsHelper: {
    display: 'block',
    marginTop: '3px',
    color: '#96909d',
    fontSize: '12px',
    lineHeight: 1.45,
  },

  roleTabsTotal: {
    flexShrink: 0,
    padding: '5px 8px',
    borderRadius: '7px',
    background: '#f7f4fb',
    color: '#766a91',
    fontSize: '11px',
    fontWeight: 800,
  },

  roleTabs: {
    display: 'flex',
    alignItems: 'stretch',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '2px',
    scrollbarWidth: 'thin',
  },

  roleTab: {
    flex: '0 0 220px',
    width: '220px',
    minWidth: '220px',
    maxWidth: '220px',
    minHeight: '68px',
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    padding: '11px 12px',
    boxSizing: 'border-box',
    border: '1px solid #e7e2ec',
    borderRadius: '11px',
    background: '#fbfafc',
    color: '#686d7b',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'all 160ms ease',
  },

  allRoleTab: {
    flex: '0 0 220px',
    width: '220px',
    minWidth: '220px',
    maxWidth: '220px',
  },

  roleTabActive: {
    border: '1px solid #d7cdf0',
    background: '#f4f0ff',
    color: '#5f51a0',
    boxShadow:
      '0 4px 14px rgba(103, 82, 167, 0.08)',
  },

  roleTabIcon: {
    width: '38px',
    height: '38px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '10px',
    background: '#eeeaf5',
    color: '#7f788c',
  },

  roleTabIconActive: {
    background: '#e4dcfb',
    color: '#6d5abb',
  },

  roleTabContent: {
    minWidth: 0,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },

  roleTabLabel: {
    overflow: 'visible',
    textOverflow: 'clip',
    whiteSpace: 'nowrap',
    color: '#555b6b',
    fontSize: '10px',
    fontWeight: 800,
  },

  roleTabName: {
    overflow: 'visible',
    textOverflow: 'clip',
    whiteSpace: 'nowrap',
    color: '#555b6b',
    fontSize: '10px',
    fontWeight: 800,
  },

  roleTabSubtext: {
    overflow: 'hidden',
    textOverflow: 'clip',
    whiteSpace: 'nowrap',
    color: '#96909e',
    fontSize: '9px',
    fontWeight: 600,
  },

  roleTabCount: {
    minWidth: '28px',
    height: '28px',
    flexShrink: 0,
    display: 'inline-grid',
    placeItems: 'center',
    padding: '0 6px',
    borderRadius: '7px',
    background: '#eeebf2',
    color: '#777082',
    fontSize: '11px',
    fontWeight: 800,
  },

  roleTabCountActive: {
    background: '#ded4f7',
    color: '#6654aa',
  },

  /* =====================================================
     FILTERS
  ===================================================== */

  filters: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '13px 25px',
    borderBottom:
      '1px solid #eeeae5',
  },

  searchWrap: {
    position: 'relative',
    flex: '1 1 auto',
  },

  searchIcon: {
    position: 'absolute',
    left: '13px',
    top: '50%',
    transform:
      'translateY(-50%)',
    color: '#98a0b1',
    pointerEvents: 'none',
  },

  searchInput: {
    width: '100%',
    minHeight: '42px',
    boxSizing: 'border-box',
    padding: '0 13px 0 40px',
    border:
      '1px solid #dedbe3',
    borderRadius: '10px',
    outline: 'none',
    background: '#fbfafc',
    color: '#252c3d',
    fontSize: '13px',
  },

  selectWrap: {
    position: 'relative',
    width: '165px',
    flexShrink: 0,
  },

  select: {
    width: '100%',
    height: '42px',
    appearance: 'none',
    padding: '0 33px 0 11px',
    border:
      '1px solid #dedbe3',
    borderRadius: '10px',
    outline: 'none',
    background: '#fbfafc',
    color: '#4f5668',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  selectIcon: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform:
      'translateY(-50%)',
    color: '#8e96a7',
    pointerEvents: 'none',
  },

  sortGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    flexShrink: 0,
  },

  sortLabel: {
    color: '#8a8494',
    fontSize: '11px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },

  /* =====================================================
     ALL OVERVIEW
  ===================================================== */

  overviewContainer: {
    padding: '18px 25px 25px',
  },

  overviewNotice: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px',
    marginBottom: '17px',
    border:
      '1px solid #e7e0f2',
    borderRadius: '11px',
    background: '#fbf9ff',
  },

  overviewNoticeIcon: {
    width: '28px',
    height: '28px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '8px',
    background: '#eee8ff',
    color: '#6f5bc4',
  },

  overviewNoticeTitle: {
    display: 'block',
    color: '#5d5572',
    fontSize: '13px',
    fontWeight: 800,
  },

  overviewNoticeText: {
    margin: '3px 0 0',
    color: '#7d7888',
    fontSize: '12px',
    lineHeight: 1.55,
  },

  roleOverviewGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(2, minmax(0, 1fr))',
    gap: '12px',
  },

  roleOverviewCard: {
    width: '100%',
    minHeight: '172px',
    padding: '18px',
    boxSizing: 'border-box',
    border:
      '1px solid #e8e3ee',
    borderRadius: '13px',
    background: '#ffffff',
    textAlign: 'left',
    cursor: 'pointer',
  },

  roleOverviewTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: '11px',
  },

  roleOverviewIcon: {
    width: '40px',
    height: '40px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '9px',
    background: '#eee8ff',
    color: '#6f5bc4',
  },

  roleOverviewArrow: {
    color: '#aaa4b2',
  },

  roleOverviewKicker: {
    color: '#9990a7',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.1em',
  },

  roleOverviewTitle: {
    margin: '3px 0 0',
    color: '#252d40',
    fontSize: '18px',
    fontWeight: 800,
  },

  roleOverviewMeta: {
    display: 'flex',
    gap: '6px',
    marginTop: '5px',
    color: '#8a909d',
    fontSize: '12px',
    fontWeight: 600,
  },

  roleOverviewBottom: {
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginTop: '15px',
    paddingTop: '9px',
    borderTop:
      '1px solid #f0edf2',
  },

  roleOverviewLabel: {
    color: '#8d8795',
    fontSize: '11px',
    fontWeight: 700,
  },

  roleOverviewScore: {
    color: '#6f5bc4',
    fontSize: '20px',
    fontWeight: 800,
  },

  /* =====================================================
     ROLE
  ===================================================== */

  allApplicationsWorkspace: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    padding: '14px 25px 28px',
    background: '#fbfafc',
  },

  allApplicationsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '18px',
    padding: '2px 2px 0',
  },

  allApplicationsKicker: {
    color: '#8b80a1',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.1em',
  },

  allApplicationsTitle: {
    margin: '4px 0 0',
    color: '#252d40',
    fontSize: '19px',
    lineHeight: 1.25,
    fontWeight: 800,
  },

  allApplicationsSubtitle: {
    margin: '4px 0 0',
    color: '#7e7889',
    fontSize: '12px',
    lineHeight: 1.5,
  },

  allApplicationsBadge: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 10px',
    border: '1px solid #e6e0ef',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#6f5bc4',
    fontSize: '11px',
    fontWeight: 800,
  },

  allApplicationsNotice: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '11px 13px',
    border: '1px solid #e6def2',
    borderRadius: '10px',
    background: '#fbf8ff',
  },

  allApplicationsRoleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },

  allApplicationsRoleSection: {
    overflow: 'hidden',
    border: '1px solid #e4e0e8',
    borderRadius: '12px',
    background: '#ffffff',
    boxShadow: '0 5px 18px rgba(48, 42, 68, 0.035)',
  },

  allApplicationsRoleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '13px 16px',
    borderBottom: '1px solid #eeeae5',
    background: '#fdfcff',
  },

  allApplicationsRoleIdentity: {
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    minWidth: 0,
  },

  allApplicationsRoleTitle: {
    margin: '3px 0 0',
    color: '#252d40',
    fontSize: '17px',
    lineHeight: 1.3,
    fontWeight: 800,
  },

  allApplicationsRoleBadge: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 9px',
    border: '1px solid #e2daf0',
    borderRadius: '8px',
    color: '#6f5bc4',
    background: '#fbf8ff',
    fontSize: '10px',
    fontWeight: 800,
  },

  roleWorkspace: {
    background: '#fcfbfd',
  },

  selectedRoleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: '15px',
    padding: '16px 25px',
    background: '#fcfbff',
    borderBottom:
      '1px solid #eeeaf3',
  },

  selectedRoleIdentity: {
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    minWidth: 0,
  },

  selectedRoleIcon: {
    width: '39px',
    height: '39px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '10px',
    background: '#eee8ff',
    color: '#6f5bc4',
  },

  selectedRoleKicker: {
    color: '#958ba9',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.1em',
  },

  selectedRoleTitle: {
    margin: '3px 0 0',
    color: '#252d40',
    fontSize: '20px',
    fontWeight: 800,
  },

  selectedRoleMeta: {
    display: 'flex',
    gap: '6px',
    marginTop: '4px',
    color: '#8c92a0',
    fontSize: '12px',
    fontWeight: 600,
  },

  roleRankingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '7px 9px',
    border:
      '1px solid #e4ddf2',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#71629d',
    fontSize: '11px',
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },

  rankingBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    margin: '12px 25px',
    padding: '12px 14px',
    border:
      '1px solid #e8e1f1',
    borderRadius: '9px',
    background: '#ffffff',
    color: '#71629d',
  },

  rankingBannerTitle: {
    display: 'block',
    color: '#625979',
    fontSize: '12px',
    fontWeight: 800,
  },

  rankingBannerText: {
    display: 'block',
    marginTop: '2px',
    color: '#8b8693',
    fontSize: '11px',
    lineHeight: 1.5,
  },

  candidateList: {
    display: 'grid',
  },

  /* =====================================================
     APPLICATION
  ===================================================== */

  applicationRow: {
    display: 'block',
    padding: '18px 22px 19px',
    borderTop: '1px solid #eeeae5',
    background: '#ffffff',
  },

  topCandidate: {
    background: '#fefeff',
  },

  candidateDecisionHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '22px',
  },

  candidateIdentity: {
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  rankBadgeColumn: {
    width: '42px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },

  rankNumber: {
    color: '#817990',
    fontSize: '13px',
    fontWeight: 850,
  },

  rankNumberTop: {
    color: '#6754bd',
    fontSize: '14px',
    fontWeight: 900,
  },

  rankLabel: {
    color: '#aaa3b2',
    fontSize: '8px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },

  candidateAvatar: {
    width: '42px',
    height: '42px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '12px',
    background: '#eee8ff',
    color: '#6f5bc4',
    fontSize: '17px',
    fontWeight: 850,
  },

  candidateIdentityText: {
    minWidth: 0,
  },

  candidateNameRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '7px',
  },

  candidateName: {
    margin: 0,
    color: '#1d2940',
    fontSize: '18px',
    lineHeight: 1.2,
    fontWeight: 850,
  },

  topMatchBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 7px',
    borderRadius: '6px',
    background: '#f0ebff',
    color: '#705dc0',
    fontSize: '10px',
    fontWeight: 850,
  },

  jobTitle: {
    marginTop: '4px',
    color: '#6f788a',
    fontSize: '12px',
  },

  applicationMeta: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '6px',
    color: '#9aa0ad',
    fontSize: '10px',
  },

  candidateDecisionRight: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  matchScoreBlock: {
    minWidth: '76px',
    padding: '8px 10px',
    border: '1px solid #e1d9f5',
    borderRadius: '10px',
    background: '#f8f5ff',
    textAlign: 'center',
  },

  matchScoreLabel: {
    display: 'block',
    color: '#8c82a1',
    fontSize: '8px',
    fontWeight: 850,
    letterSpacing: '0.08em',
  },

  matchScoreValue: {
    display: 'block',
    marginTop: '2px',
    color: '#5f4cb5',
    fontSize: '20px',
    lineHeight: 1,
    fontWeight: 900,
  },

  decisionSignalRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '0',
    marginTop: '14px',
    border: '1px solid #ebe7f0',
    borderRadius: '10px',
    overflow: 'hidden',
    background: '#ffffff',
  },

  primarySignalCard: {
    minHeight: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '10px 14px',
    border: 0,
    borderRight: '1px solid #ebe7f0',
    borderRadius: 0,
    background: '#f7f4ff',
  },

  decisionMetric: {
    minHeight: '58px',
    padding: '9px 12px',
    border: 0,
    borderRight: '1px solid #ebe7f0',
    borderRadius: 0,
    background: '#ffffff',
  },

  decisionMetricTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },

  decisionMetricTrack: {
    position: 'relative',
    height: '6px',
    display: 'flex',
    alignItems: 'stretch',
    gap: '2px',
    marginTop: '9px',
    overflow: 'visible',
    borderRadius: '99px',
  },

  scoreBandWeak: {
    flex: '4',
    borderRadius: '99px 0 0 99px',
    background: '#f1e1e3',
  },

  scoreBandReview: {
    flex: '2',
    background: '#f6ead7',
  },

  scoreBandGood: {
    flex: '2',
    background: '#eee9fb',
  },

  scoreBandStrong: {
    flex: '2',
    borderRadius: '0 99px 99px 0',
    background: '#e4f2ec',
  },

  scoreMarker: {
    position: 'absolute',
    top: '-3px',
    width: '3px',
    height: '13px',
    transform: 'translateX(-50%)',
    borderRadius: '99px',
    background: '#5f4cb5',
    boxShadow: '0 0 0 2px #ffffff',
  },

  scoreScale: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '4px',
    color: '#aaa4b1',
    fontSize: '7px',
    lineHeight: 1,
    fontWeight: 700,
  },

  eligibilityCard: {
    minHeight: '58px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 12px',
    border: 0,
    borderRadius: 0,
    background: '#f7fcf9',
    color: '#348061',
  },

  eligibilityCardReview: {
    minHeight: '58px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 12px',
    border: 0,
    borderRadius: 0,
    background: '#fffaf1',
    color: '#a86b12',
  },

  recruiterReadRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '10px',
  },

  readSignal: {
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 11px',
    border: '1px solid #f0edf3',
    borderRadius: '8px',
    background: '#fbfafc',
    color: '#6f7482',
    fontSize: '10px',
    lineHeight: 1.35,
  },

  readSignalWarning: {
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 11px',
    border: '1px solid #f2e1dd',
    borderRadius: '8px',
    background: '#fffaf8',
    color: '#9b6258',
    fontSize: '10px',
    lineHeight: 1.35,
  },

  applicationActionBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginTop: '11px',
    paddingTop: '11px',
    borderTop: '1px solid #eeeaf2',
  },

  applicationActionsRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  profileActionButtonCompact: {
    minHeight: '34px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0 11px',
    border: '1px solid #ddd5ec',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#67578f',
    fontSize: '10px',
    fontWeight: 800,
    cursor: 'pointer',
  },

  statusControlInline: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  },

  primaryFitScore: {
    color: '#604db6',
  },

  miniMetric: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    color: '#777d8c',
    fontSize: '11px',
    fontWeight: 600,
  },

  intelligenceToggle: {
    minHeight: '34px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0 11px',
    border: '1px solid #ddd5ec',
    borderRadius: '8px',
    background: '#f9f7ff',
    color: '#635391',
    fontSize: '10px',
    fontWeight: 850,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },

  expandedIntelligence: {
    marginTop: '12px',
    padding: '15px',
    border: '1px solid #e4deed',
    borderRadius: '11px',
    background: '#fbfaff',
  },

  expandedHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '10px',
  },

  expandedKicker: {
    color: '#9188a1',
    fontSize: '9px',
    fontWeight: 850,
    letterSpacing: '0.08em',
  },

  expandedTitle: {
    margin: '3px 0 0',
    color: '#504962',
    fontSize: '15px',
    fontWeight: 850,
  },

  evidenceHint: {
    padding: '5px 8px',
    borderRadius: '6px',
    background: '#f1eef7',
    color: '#81798d',
    fontSize: '9px',
    fontWeight: 750,
  },


  signalLabel: {
    display: 'block',
    color: '#7a7485',
    fontSize: '10px',
    fontWeight: 750,
  },

  signalSubtext: {
    display: 'block',
    marginTop: '3px',
    color: '#aaa4b1',
    fontSize: '9px',
    fontWeight: 600,
  },

  primarySignalValue: {
    color: '#5f4cb5',
    fontSize: '19px',
    fontWeight: 900,
  },

  eligibilityValue: {
    display: 'block',
    marginTop: '3px',
    fontSize: '11px',
    fontWeight: 850,
  },

  readSignalValue: {
    display: 'block',
    marginTop: '2px',
    color: 'inherit',
    fontSize: '10px',
    fontWeight: 600,
  },

  candidateMain: {
    minWidth: 0,
    width: '100%',
  },

  intelligenceMetric: {
    padding: '9px 10px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    fontSize: '11px',
  },

  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
    padding: '5px 8px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },

  statusControl: {
    position: 'relative',
    width: '128px',
    flexShrink: 0,
  },

  statusSelect: {
    width: '100%',
    height: '36px',
    padding: '0 9px',
    border: '1px solid #dedbe3',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#4d5362',
    fontSize: '10px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  updatingText: {
    position: 'absolute',
    right: 0,
    top: '38px',
    color: '#8b8497',
    fontSize: '8px',
  },

  insightArea: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop:
      '1px solid #eeeaf3',
  },

  insightSummary: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '7px',
  },

  insightIcon: {
    width: '28px',
    height: '28px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '7px',
    background: '#eee8ff',
    color: '#6f5bc4',
  },

  insightCopy: {
    minWidth: 0,
  },

  insightTitle: {
    display: 'block',
    color: '#6f6680',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
  },

  insightText: {
    margin: '3px 0 0',
    color: '#5f6675',
    fontSize: '12px',
    lineHeight: 1.45,
  },

  evidenceGroup: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '7px',
    marginTop: '7px',
  },

  evidenceLabel: {
    width: '58px',
    flexShrink: 0,
    paddingTop: '3px',
    color: '#918a99',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },

  evidenceTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },

  matchedTag: {
    padding: '3px 6px',
    borderRadius: '5px',
    background: '#edf9f3',
    color: '#28785a',
    fontSize: '10px',
    fontWeight: 700,
  },

  missingTag: {
    padding: '3px 6px',
    borderRadius: '5px',
    background: '#fff1ed',
    color: '#ad4939',
    fontSize: '10px',
    fontWeight: 700,
  },

  moreTag: {
    padding: '3px 5px',
    borderRadius: '5px',
    background: '#f0edf3',
    color: '#81798c',
    fontSize: '10px',
    fontWeight: 700,
  },

  intelligenceFooter: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '7px 10px',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop:
      '1px solid #eeeaf3',
  },

  eligibilityGood: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: '#2b8563',
    fontSize: '11px',
    fontWeight: 800,
  },

  eligibilityWarning: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: '#b04c3c',
    fontSize: '11px',
    fontWeight: 800,
  },

  eligibilityReason: {
    color: '#918a99',
    fontSize: '10px',
  },

  /* =====================================================
     RANKING EXPLANATION
  ===================================================== */

  rankingExplanation: {
    marginTop: '10px',
    padding: '12px',
    border:
      '1px solid #e5def3',
    borderRadius: '8px',
    background: '#ffffff',
  },

  rankingExplanationHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  rankingExplanationTitle: {
    color: '#5e5575',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
  },

  rankingExplanationRank: {
    color: '#7869b0',
    fontSize: '11px',
    fontWeight: 800,
  },

  rankingExplanationIntro: {
    margin: '4px 0 8px',
    color: '#8b8594',
    fontSize: '11px',
    lineHeight: 1.4,
  },

  rankingReasonList: {
    display: 'grid',
    gap: '3px',
  },

  rankingReasonItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '5px',
    color: '#606777',
    fontSize: '11px',
    lineHeight: 1.5,
  },

  rankingReasonDot: {
    color: '#7968bf',
    fontWeight: 900,
  },


  /* =====================================================
     EMPTY
  ===================================================== */


  /* =====================================================
     CANDIDATE PROFILE ACTION + DRAWER
  ===================================================== */

  profileActionBar: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #ebe6f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },

  profileActionTitle: {
    display: 'block',
    color: '#514a61',
    fontSize: '12px',
    fontWeight: 800,
  },

  profileActionText: {
    display: 'block',
    marginTop: '3px',
    color: '#918a99',
    fontSize: '10px',
    lineHeight: 1.5,
  },

  profileActionButton: {
    flexShrink: 0,
    minHeight: '36px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0 11px',
    border: '1px solid #dcd3ec',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#67578f',
    fontSize: '11px',
    fontWeight: 800,
    cursor: 'pointer',
  },

  drawerBackdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 1200,
    display: 'flex',
    justifyContent: 'flex-end',
    background: 'rgba(28, 24, 35, 0.38)',
    backdropFilter: 'blur(2px)',
  },

  profileDrawer: {
    width: 'min(680px, 94vw)',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#fcfbfd',
    boxShadow: '-18px 0 50px rgba(37, 30, 48, 0.18)',
    overflow: 'hidden',
  },

  drawerHeader: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '18px',
    padding: '24px 26px 20px',
    borderBottom: '1px solid #e9e4ed',
    background: '#ffffff',
  },

  drawerKicker: {
    color: '#7968a4',
    fontSize: '10px',
    fontWeight: 900,
    letterSpacing: '0.12em',
  },

  drawerTitle: {
    margin: '5px 0 0',
    color: '#252d40',
    fontSize: '24px',
    fontWeight: 850,
  },

  drawerSubtitle: {
    margin: '6px 0 0',
    maxWidth: '540px',
    color: '#7f7888',
    fontSize: '12px',
    lineHeight: 1.55,
  },

  drawerClose: {
    width: '38px',
    height: '38px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    border: '1px solid #e1dbe7',
    borderRadius: '10px',
    background: '#ffffff',
    color: '#6e6677',
    cursor: 'pointer',
  },

  drawerBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px 34px',
  },

  drawerState: {
    minHeight: '220px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    color: '#777080',
    fontSize: '13px',
    fontWeight: 700,
  },

  drawerError: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    border: '1px solid #f0cfc8',
    borderRadius: '12px',
    background: '#fff8f6',
    color: '#a84e40',
  },

  retryButton: {
    display: 'block',
    marginTop: '10px',
    padding: '7px 10px',
    border: '1px solid #e6c1b9',
    borderRadius: '7px',
    background: '#ffffff',
    color: '#9d493d',
    fontSize: '11px',
    fontWeight: 800,
    cursor: 'pointer',
  },

  profileHero: {
    display: 'flex',
    gap: '15px',
    padding: '18px',
    border: '1px solid #e6e0ec',
    borderRadius: '14px',
    background: '#ffffff',
  },

  profileHeroAvatar: {
    width: '52px',
    height: '52px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '14px',
    background: '#eee8ff',
    color: '#6955ad',
    fontSize: '20px',
    fontWeight: 900,
  },

  profileHeroMain: {
    minWidth: 0,
  },

  profileHeroName: {
    margin: 0,
    color: '#252d40',
    fontSize: '18px',
    fontWeight: 850,
  },

  profileContactRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px 14px',
    marginTop: '6px',
    color: '#7f7888',
    fontSize: '11px',
  },

  profileSummary: {
    margin: '10px 0 0',
    color: '#625c69',
    fontSize: '12px',
    lineHeight: 1.65,
  },

  profileSection: {
    marginTop: '15px',
    padding: '17px',
    border: '1px solid #e8e3ec',
    borderRadius: '13px',
    background: '#ffffff',
  },

  profileSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '13px',
  },

  profileSectionIcon: {
    width: '34px',
    height: '34px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '9px',
    background: '#f2edff',
    color: '#6f5bc4',
  },

  profileSectionEyebrow: {
    color: '#9991a2',
    fontSize: '9px',
    fontWeight: 900,
    letterSpacing: '0.1em',
  },

  profileSectionTitle: {
    margin: '2px 0 0',
    color: '#4c4656',
    fontSize: '14px',
    fontWeight: 850,
  },

  profileSkillGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: '8px',
  },

  profileSkillCard: {
    padding: '10px',
    border: '1px solid #ece7f1',
    borderRadius: '9px',
    background: '#fcfbff',
    color: '#4e4857',
    fontSize: '11px',
  },

  profileTimeline: {
    display: 'grid',
    gap: '9px',
  },

  evidenceCard: {
    padding: '12px',
    border: '1px solid #eee9f2',
    borderRadius: '9px',
    background: '#fcfbfd',
    color: '#554f5d',
    fontSize: '11px',
    lineHeight: 1.55,
  },

  evidenceLink: {
    marginTop: '7px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: '#6b58a3',
    fontSize: '10px',
    fontWeight: 800,
    textDecoration: 'none',
  },

  profileEmpty: {
    padding: '13px',
    border: '1px dashed #ddd6e3',
    borderRadius: '9px',
    color: '#928a99',
    background: '#fcfbfd',
    fontSize: '11px',
  },

  resumeEvidenceCard: {
    padding: '12px',
    border: '1px solid #ece6f0',
    borderRadius: '10px',
    background: '#fcfbfd',
  },

  resumeEvidenceTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    color: '#5c5367',
    fontSize: '11px',
  },

  resumeExtract: {
    maxHeight: '260px',
    overflowY: 'auto',
    marginTop: '12px',
    padding: '12px',
    borderRadius: '8px',
    background: '#f7f5f9',
    color: '#625b69',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: '10px',
    lineHeight: 1.65,
  },

  decisionSupportNote: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    marginTop: '15px',
    padding: '12px 14px',
    border: '1px solid #e4ddf1',
    borderRadius: '10px',
    background: '#f8f5ff',
    color: '#716680',
    fontSize: '10px',
    lineHeight: 1.55,
  },

  emptyState: {
    minHeight: '270px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '30px',
    textAlign: 'center',
  },

  emptyIcon: {
    width: '50px',
    height: '50px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '15px',
    background: '#eee8ff',
    color: '#6f5bc4',
  },

  emptyTitle: {
    margin: '14px 0 5px',
    color: '#252d40',
    fontSize: '16px',
    fontWeight: 800,
  },

  emptyText: {
    margin: 0,
    maxWidth: '450px',
    color: '#7c8495',
    fontSize: '11px',
    lineHeight: 1.6,
  },
}

export default RecruiterApplicationsPage