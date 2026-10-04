import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  Users,
  XCircle,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import AppShell from '../../components/layout/AppShell'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'


// =========================================================
// PAGE CONFIG
// =========================================================

const PAGE_CONFIG = {
  recruiters: {
    endpoint: '/placement-officer/recruiters',
    title: 'Recruiters',
    subtitle:
      'Monitor companies, recruiters and hiring activity across campus placement.',
    countLabel: 'recruiters',
  },

  drives: {
    endpoint: '/placement-officer/drives',
    title: 'Placement Drives',
    subtitle:
      'Track placement roles, application volume and selection progress.',
    countLabel: 'placement drives',
  },

  applications: {
    endpoint: '/placement-officer/applications',
    title: 'Applications',
    subtitle:
      'Monitor candidate applications across active placement opportunities.',
    countLabel: 'applications',
  },
}


// =========================================================
// STAT CARD
// =========================================================

function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'purple',
}) {
  const tones = {
    purple: {
      background: '#f4f1ff',
      icon: '#6557e8',
    },

    amber: {
      background: '#fff7df',
      icon: '#c99700',
    },

    green: {
      background: '#edf9f2',
      icon: '#27935c',
    },

    blue: {
      background: '#edf5ff',
      icon: '#477bc7',
    },

    red: {
      background: '#fff1f1',
      icon: '#d45a5a',
    },
  }

  const current =
    tones[tone] || tones.purple

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e9e6ef',
        borderRadius: 16,
        padding: 18,
        minHeight: 112,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#77727f',
          }}
        >
          {label}
        </span>

        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: current.background,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon
            size={17}
            color={current.icon}
          />
        </div>
      </div>

      <strong
        style={{
          fontSize: 27,
          lineHeight: 1,
          color: '#25222c',
        }}
      >
        {value}
      </strong>
    </div>
  )
}


// =========================================================
// STATUS BADGE
// =========================================================

function StatusBadge({ status }) {
  const config = {
    open: {
      label: 'Open',
      background: '#eaf8f0',
      color: '#218653',
    },

    closed: {
      label: 'Closed',
      background: '#f1f1f4',
      color: '#77727f',
    },

    draft: {
      label: 'Draft',
      background: '#fff7df',
      color: '#a77a00',
    },

    applied: {
      label: 'Applied',
      background: '#eef5ff',
      color: '#477bc5',
    },

    shortlisted: {
      label: 'Shortlisted',
      background: '#f3efff',
      color: '#6655d9',
    },

    interview: {
      label: 'Interview',
      background: '#fff6df',
      color: '#a47700',
    },

    selected: {
      label: 'Selected',
      background: '#eaf8f0',
      color: '#218653',
    },

    pending: {
      label: 'Pending',
      background: '#fff7df',
      color: '#a77a00',
    },

    approved: {
      label: 'Approved',
      background: '#eaf8f0',
      color: '#218653',
    },

    rejected: {
      label: 'Rejected',
      background: '#fff0f0',
      color: '#c75252',
    },
  }

  const current =
    config[status] || {
      label: status || 'Unknown',
      background: '#f3f3f5',
      color: '#77727f',
    }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 10px',
        borderRadius: 999,
        background: current.background,
        color: current.color,
        fontSize: 11,
        fontWeight: 750,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: current.color,
          marginRight: 7,
        }}
      />

      {current.label}
    </span>
  )
}


// =========================================================
// EMPTY STATE
// =========================================================

function EmptyState({
  icon: Icon = FileText,
  title,
  description,
}) {
  return (
    <div
      style={{
        padding: '70px 30px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          margin: '0 auto 14px',
          borderRadius: 15,
          background: '#f3f0ff',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Icon
          size={24}
          color="#7061df"
        />
      </div>

      <h3
        style={{
          margin: '0 0 6px',
          fontSize: 16,
          color: '#302c39',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: '#8b8495',
        }}
      >
        {description}
      </p>
    </div>
  )
}


// =========================================================
// SEARCH BOX
// =========================================================

function SearchBox({
  value,
  onChange,
  placeholder,
}) {
  return (
    <div style={styles.searchBox}>
      <Search
        size={17}
        color="#8c86a0"
      />

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        style={styles.searchInput}
      />
    </div>
  )
}


// =========================================================
// MAIN PAGE
// =========================================================

function PlacementOfficerDataPage({
  type,
}) {
  const config = PAGE_CONFIG[type]

  const {
    user,
    loading: authLoading,
    isAuthenticated,
  } = useAuth()

  const [data, setData] = useState(null)
  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [search, setSearch] =
    useState('')

  const [approvalAction, setApprovalAction] =
    useState(null)


  // =======================================================
  // LOAD DATA
  // =======================================================

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const response =
        await api.get(
          config.endpoint
        )

      setData(response.data)
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          'Unable to load the requested data.'
      )
    } finally {
      setLoading(false)
    }
  }


  // =======================================================
  // APPROVE / REJECT RECRUITER
  // =======================================================

  async function handleRecruiterApproval(
    recruiterId,
    action
  ) {
    try {
      setApprovalAction({
        recruiterId,
        action,
      })

      setError('')

      await api.patch(
        `/placement-officer/recruiters/${recruiterId}/${action}`
      )

      await loadData()
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          'Unable to update recruiter approval status.'
      )
    } finally {
      setApprovalAction(null)
    }
  }


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    if (
      authLoading ||
      !isAuthenticated
    ) {
      return
    }

    setSearch('')
    loadData()
  }, [
    authLoading,
    isAuthenticated,
    type,
  ])


  // =======================================================
  // DATA
  // =======================================================

  const recruiters =
    data?.recruiters || []

  const drives =
    data?.drives || []

  const applications =
    data?.applications || []


  // =======================================================
  // SEARCH - RECRUITERS
  // =======================================================

  const filteredRecruiters =
    useMemo(() => {
      const query =
        search.trim().toLowerCase()

      if (!query) {
        return recruiters
      }

      return recruiters.filter(
        (recruiter) =>
          [
            recruiter.name,
            recruiter.email,
            recruiter.position,
            ...(recruiter.companies || []),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(query)
      )
    }, [recruiters, search])


  // =======================================================
  // SEARCH - DRIVES
  // =======================================================

  const filteredDrives =
    useMemo(() => {
      const query =
        search.trim().toLowerCase()

      if (!query) {
        return drives
      }

      return drives.filter(
        (drive) =>
          [
            drive.title,
            drive.company_name,
            drive.location,
            drive.status,
            drive.work_mode,
            drive.employment_type,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(query)
      )
    }, [drives, search])


  // =======================================================
  // SEARCH - APPLICATIONS
  // =======================================================

  const filteredApplications =
    useMemo(() => {
      const query =
        search.trim().toLowerCase()

      if (!query) {
        return applications
      }

      return applications.filter(
        (application) =>
          [
            application.candidate_name,
            application.candidate_email,
            application.candidate_location,
            application.job_title,
            application.company_name,
            application.status,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(query)
      )
    }, [applications, search])


  // =======================================================
  // DRIVE STATS
  // =======================================================

  const driveStats =
    useMemo(
      () => ({
        total: drives.length,

        open: drives.filter(
          (item) =>
            item.status === 'open'
        ).length,

        applications:
          drives.reduce(
            (sum, item) =>
              sum +
              Number(
                item.application_count || 0
              ),
            0
          ),

        selected:
          drives.reduce(
            (sum, item) =>
              sum +
              Number(
                item.selected_count || 0
              ),
            0
          ),
      }),
      [drives]
    )


  // =======================================================
  // RECRUITER STATS
  // =======================================================

  const recruiterStats =
    useMemo(
      () => ({
        total: recruiters.length,

        companies:
          recruiters.reduce(
            (sum, item) =>
              sum +
              Number(
                item.company_count || 0
              ),
            0
          ),

        openJobs:
          recruiters.reduce(
            (sum, item) =>
              sum +
              Number(
                item.open_jobs || 0
              ),
            0
          ),

        applications:
          recruiters.reduce(
            (sum, item) =>
              sum +
              Number(
                item.total_applications || 0
              ),
            0
          ),
      }),
      [recruiters]
    )


  // =======================================================
  // APPLICATION STATS
  // =======================================================

  const applicationStats =
    useMemo(() => {
      const total =
        applications.length

      const active =
        applications.filter(
          (item) =>
            ![
              'rejected',
              'selected',
            ].includes(item.status)
        ).length

      const shortlisted =
        applications.filter(
          (item) =>
            item.status ===
            'shortlisted'
        ).length

      const interview =
        applications.filter(
          (item) =>
            item.status ===
            'interview'
        ).length

      const selected =
        applications.filter(
          (item) =>
            item.status ===
            'selected'
        ).length

      const rejected =
        applications.filter(
          (item) =>
            item.status ===
            'rejected'
        ).length

      return {
        total,
        active,
        shortlisted,
        interview,
        selected,
        rejected,
      }
    }, [applications])


  // =======================================================
  // AUTH LOADING
  // =======================================================

  if (authLoading) {
    return (
      <AppShell
        role="placement_officer"
        userName={
          user?.name ||
          'Placement Officer'
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
    user?.role !==
      'placement_officer' &&
    user?.role !== 'admin'
  ) {
    return null
  }


  // =======================================================
  // PAGE
  // =======================================================

  return (
    <AppShell
      role="placement_officer"
      userName={
        user?.name ||
        'Placement Officer'
      }
    >
      <div style={styles.page}>

        {/* HEADER */}

        <section style={styles.header}>

          <div>

            <div style={styles.kicker}>
              PLACEMENT OFFICE
            </div>

            <h1 style={styles.title}>
              {config.title}
            </h1>

            <p style={styles.subtitle}>
              {config.subtitle}
            </p>

          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            style={{
              ...styles.refreshButton,
              opacity: loading
                ? 0.6
                : 1,
              cursor: loading
                ? 'not-allowed'
                : 'pointer',
            }}
          >
            <RefreshCw
              size={16}
              style={
                loading
                  ? {
                      animation:
                        'spin 1s linear infinite',
                    }
                  : undefined
              }
            />

            Refresh
          </button>

        </section>


        {/* ERROR */}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}


        {/* =================================================
            RECRUITERS
            ================================================= */}

        {type === 'recruiters' && (
          <>
            <section
              style={styles.statsGrid}
            >

              <StatCard
                icon={Users}
                label="Total Recruiters"
                value={
                  recruiterStats.total
                }
              />

              <StatCard
                icon={Building2}
                label="Companies"
                value={
                  recruiterStats.companies
                }
                tone="blue"
              />

              <StatCard
                icon={BriefcaseBusiness}
                label="Open Roles"
                value={
                  recruiterStats.openJobs
                }
                tone="green"
              />

              <StatCard
                icon={FileText}
                label="Applications"
                value={
                  recruiterStats.applications
                }
                tone="amber"
              />

            </section>


            <section style={styles.card}>

              <div
                style={styles.cardHeader}
              >

                <div>

                  <h2
                    style={
                      styles.cardTitle
                    }
                  >
                    Recruiter Directory
                  </h2>

                  <p
                    style={
                      styles.cardSubtitle
                    }
                  >
                    {
                      filteredRecruiters.length
                    }{' '}
                    {
                      filteredRecruiters.length ===
                      1
                        ? 'recruiter'
                        : 'recruiters'
                    }
                  </p>

                </div>

                <SearchBox
                  value={search}
                  onChange={setSearch}
                  placeholder="Search recruiters, companies or positions..."
                />

              </div>


              {loading ? (
                <div
                  style={
                    styles.loading
                  }
                >
                  Loading recruiters...
                </div>
              ) : filteredRecruiters.length ===
                0 ? (
                <EmptyState
                  icon={Users}
                  title="No recruiters found"
                  description={
                    search
                      ? 'Try a different recruiter, company or position name.'
                      : 'Recruiter records will appear here when available.'
                  }
                />
              ) : (
                <div
                  style={
                    styles.tableWrap
                  }
                >

                  <table
                    style={styles.table}
                  >

                    <thead>

                      <tr>

                        <th>
                          RECRUITER
                        </th>

                        <th>
                          COMPANY
                        </th>

                        <th>
                          ROLES
                        </th>

                        <th>
                          APPLICATIONS
                        </th>

                        <th>
                          SELECTED
                        </th>

                        <th>
                          STATUS
                        </th>

                        <th>
                          ACTIONS
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {filteredRecruiters.map(
                        (recruiter) => (
                          <tr
                            key={
                              recruiter.recruiter_id
                            }
                          >

                            {/* RECRUITER */}

                            <td>

                              <div
                                style={
                                  styles.person
                                }
                              >

                                <div
                                  style={
                                    styles.avatar
                                  }
                                >
                                  {getInitials(
                                    recruiter.name
                                  )}
                                </div>


                                <div
                                  style={
                                    styles.personInfo
                                  }
                                >

                                  <strong
                                    style={
                                      styles.personName
                                    }
                                  >
                                    {
                                      recruiter.name
                                    }
                                  </strong>


                                  <span
                                    style={
                                      styles.personEmail
                                    }
                                  >
                                    <Mail
                                      size={13}
                                    />

                                    {
                                      recruiter.email
                                    }
                                  </span>


                                  {/* POSITION */}

                                  {recruiter.position && (
                                    <span
                                      style={
                                        styles.personPosition
                                      }
                                    >
                                      {
                                        recruiter.position
                                      }
                                    </span>
                                  )}

                                </div>

                              </div>

                            </td>


                            {/* COMPANY */}

                            <td>

                              <div
                                style={
                                  styles.companyCell
                                }
                              >

                                <Building2
                                  size={15}
                                />

                                <span>
                                  {(
                                    recruiter.companies ||
                                    []
                                  ).join(', ') ||
                                    'No company'}
                                </span>

                              </div>

                            </td>


                            {/* ROLES */}

                            <td>

                              <strong>
                                {
                                  recruiter.open_jobs ||
                                  0
                                }
                              </strong>

                              <span
                                style={
                                  styles.muted
                                }
                              >
                                {' '}
                                /{' '}
                                {
                                  recruiter.total_jobs ||
                                  0
                                }
                              </span>

                            </td>


                            {/* APPLICATIONS */}

                            <td>

                              <strong>
                                {
                                  recruiter.total_applications ||
                                  0
                                }
                              </strong>

                            </td>


                            {/* SELECTED */}

                            <td>

                              <span
                                style={
                                  styles.selectedText
                                }
                              >

                                <CheckCircle2
                                  size={15}
                                />

                                {
                                  recruiter.selected_candidates ||
                                  0
                                }

                              </span>

                            </td>


                            {/* STATUS */}

                            <td>

                              <StatusBadge
                                status={
                                  recruiter.approval_status
                                }
                              />

                            </td>


                            {/* ACTIONS */}

                            <td>

                              {recruiter.approval_status ===
                              'pending' ? (

                                <div
                                  style={
                                    styles.approvalActions
                                  }
                                >

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRecruiterApproval(
                                        recruiter.recruiter_id,
                                        'approve'
                                      )
                                    }
                                    disabled={
                                      approvalAction?.recruiterId ===
                                      recruiter.recruiter_id
                                    }
                                    style={{
                                      ...styles.approveButton,
                                      opacity:
                                        approvalAction?.recruiterId ===
                                        recruiter.recruiter_id
                                          ? 0.6
                                          : 1,
                                      cursor:
                                        approvalAction?.recruiterId ===
                                        recruiter.recruiter_id
                                          ? 'not-allowed'
                                          : 'pointer',
                                    }}
                                  >

                                    {approvalAction?.recruiterId ===
                                      recruiter.recruiter_id &&
                                    approvalAction?.action ===
                                      'approve' ? (
                                      <LoaderCircle
                                        size={14}
                                        style={
                                          styles.buttonSpinner
                                        }
                                      />
                                    ) : (
                                      <CheckCircle2
                                        size={14}
                                      />
                                    )}

                                    Approve

                                  </button>


                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRecruiterApproval(
                                        recruiter.recruiter_id,
                                        'reject'
                                      )
                                    }
                                    disabled={
                                      approvalAction?.recruiterId ===
                                      recruiter.recruiter_id
                                    }
                                    style={{
                                      ...styles.rejectButton,
                                      opacity:
                                        approvalAction?.recruiterId ===
                                        recruiter.recruiter_id
                                          ? 0.6
                                          : 1,
                                      cursor:
                                        approvalAction?.recruiterId ===
                                        recruiter.recruiter_id
                                          ? 'not-allowed'
                                          : 'pointer',
                                    }}
                                  >

                                    {approvalAction?.recruiterId ===
                                      recruiter.recruiter_id &&
                                    approvalAction?.action ===
                                      'reject' ? (
                                      <LoaderCircle
                                        size={14}
                                        style={
                                          styles.buttonSpinner
                                        }
                                      />
                                    ) : (
                                      <XCircle
                                        size={14}
                                      />
                                    )}

                                    Reject

                                  </button>

                                </div>

                              ) : (

                                <span
                                  style={
                                    styles.noAction
                                  }
                                >
                                  No action required
                                </span>

                              )}

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </section>

          </>
        )}


        {/* =================================================
            DRIVES
            ================================================= */}

        {type === 'drives' && (
          <>

            <section
              style={styles.statsGrid}
            >

              <StatCard
                icon={BriefcaseBusiness}
                label="Total Drives"
                value={
                  driveStats.total
                }
              />

              <StatCard
                icon={CheckCircle2}
                label="Open Drives"
                value={
                  driveStats.open
                }
                tone="green"
              />

              <StatCard
                icon={FileText}
                label="Applications"
                value={
                  driveStats.applications
                }
                tone="amber"
              />

              <StatCard
                icon={Users}
                label="Selected"
                value={
                  driveStats.selected
                }
                tone="blue"
              />

            </section>


            <section style={styles.card}>

              <div
                style={styles.cardHeader}
              >

                <div>

                  <h2
                    style={
                      styles.cardTitle
                    }
                  >
                    Placement Drive Monitor
                  </h2>

                  <p
                    style={
                      styles.cardSubtitle
                    }
                  >
                    {
                      filteredDrives.length
                    }{' '}
                    {
                      filteredDrives.length ===
                      1
                        ? 'drive'
                        : 'drives'
                    }
                  </p>

                </div>

                <SearchBox
                  value={search}
                  onChange={setSearch}
                  placeholder="Search roles, companies..."
                />

              </div>


              {loading ? (

                <div
                  style={
                    styles.loading
                  }
                >
                  Loading placement drives...
                </div>

              ) : filteredDrives.length ===
                0 ? (

                <EmptyState
                  icon={BriefcaseBusiness}
                  title="No placement drives found"
                  description={
                    search
                      ? 'Try a different role or company name.'
                      : 'Placement drives will appear here when jobs are available.'
                  }
                />

              ) : (

                <div
                  style={
                    styles.tableWrap
                  }
                >

                  <table
                    style={styles.table}
                  >

                    <thead>

                      <tr>

                        <th>
                          ROLE / DRIVE
                        </th>

                        <th>
                          COMPANY
                        </th>

                        <th>
                          LOCATION
                        </th>

                        <th>
                          MODE
                        </th>

                        <th>
                          APPLICATIONS
                        </th>

                        <th>
                          PIPELINE
                        </th>

                        <th>
                          STATUS
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {filteredDrives.map(
                        (drive) => (
                          <tr
                            key={
                              drive.job_id
                            }
                          >

                            <td>

                              <strong
                                style={
                                  styles.roleTitle
                                }
                              >
                                {
                                  drive.title
                                }
                              </strong>

                              <span
                                style={
                                  styles.subText
                                }
                              >
                                {
                                  drive.employment_type ||
                                  'Employment type not specified'
                                }

                                {' · Drive #'}

                                {
                                  drive.job_id
                                }
                              </span>

                            </td>


                            <td>

                              <div
                                style={
                                  styles.companyCell
                                }
                              >

                                <Building2
                                  size={15}
                                />

                                {
                                  drive.company_name ||
                                  'Unknown company'
                                }

                              </div>

                            </td>


                            <td>

                              <div
                                style={
                                  styles.companyCell
                                }
                              >

                                <MapPin
                                  size={15}
                                />

                                {
                                  drive.location ||
                                  'Not specified'
                                }

                              </div>

                            </td>


                            <td>
                              {
                                drive.work_mode ||
                                'Not specified'
                              }
                            </td>


                            <td>

                              <strong>
                                {
                                  drive.application_count ||
                                  0
                                }
                              </strong>

                            </td>


                            <td>

                              <div
                                style={
                                  styles.pipeline
                                }
                              >

                                <span>
                                  {
                                    drive.shortlisted_count ||
                                    0
                                  }{' '}
                                  shortlisted
                                </span>

                                <span>
                                  {
                                    drive.interview_count ||
                                    0
                                  }{' '}
                                  interviews
                                </span>

                                <span>
                                  {
                                    drive.selected_count ||
                                    0
                                  }{' '}
                                  selected
                                </span>

                              </div>

                            </td>


                            <td>

                              <StatusBadge
                                status={
                                  drive.status
                                }
                              />

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </section>

          </>
        )}


        {/* =================================================
            APPLICATIONS
            ================================================= */}

        {type === 'applications' && (
          <>

            <section
              style={styles.statsGrid}
            >

              <StatCard
                icon={FileText}
                label="Total Applications"
                value={
                  applicationStats.total
                }
              />

              <StatCard
                icon={Clock3}
                label="Active"
                value={
                  applicationStats.active
                }
                tone="amber"
              />

              <StatCard
                icon={Users}
                label="Shortlisted"
                value={
                  applicationStats.shortlisted
                }
                tone="purple"
              />

              <StatCard
                icon={CheckCircle2}
                label="Selected"
                value={
                  applicationStats.selected
                }
                tone="green"
              />

            </section>


            <section style={styles.card}>

              <div
                style={styles.cardHeader}
              >

                <div>

                  <h2
                    style={
                      styles.cardTitle
                    }
                  >
                    Application Monitor
                  </h2>

                  <p
                    style={
                      styles.cardSubtitle
                    }
                  >
                    {
                      filteredApplications.length
                    }{' '}
                    {
                      filteredApplications.length ===
                      1
                        ? 'application'
                        : 'applications'
                    }
                  </p>

                </div>

                <SearchBox
                  value={search}
                  onChange={setSearch}
                  placeholder="Search candidates, roles, companies..."
                />

              </div>


              {loading ? (

                <div
                  style={
                    styles.loading
                  }
                >
                  Loading applications...
                </div>

              ) : filteredApplications.length ===
                0 ? (

                <EmptyState
                  icon={FileText}
                  title="No applications found"
                  description={
                    search
                      ? 'Try a different candidate, role or company.'
                      : 'Candidate applications will appear here.'
                  }
                />

              ) : (

                <div
                  style={
                    styles.tableWrap
                  }
                >

                  <table
                    style={styles.table}
                  >

                    <thead>

                      <tr>

                        <th>
                          CANDIDATE
                        </th>

                        <th>
                          ROLE
                        </th>

                        <th>
                          COMPANY
                        </th>

                        <th>
                          APPLIED
                        </th>

                        <th>
                          STATUS
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {filteredApplications.map(
                        (application) => (
                          <tr
                            key={
                              application.application_id
                            }
                          >

                            <td>

                              <div
                                style={
                                  styles.person
                                }
                              >

                                <div
                                  style={
                                    styles.avatar
                                  }
                                >
                                  {getInitials(
                                    application.candidate_name
                                  )}
                                </div>


                                <div
                                  style={
                                    styles.personInfo
                                  }
                                >

                                  <strong
                                    style={
                                      styles.personName
                                    }
                                  >
                                    {
                                      application.candidate_name
                                    }
                                  </strong>


                                  <span
                                    style={
                                      styles.personEmail
                                    }
                                  >

                                    <Mail
                                      size={13}
                                    />

                                    {
                                      application.candidate_email ||
                                      'Email unavailable'
                                    }

                                  </span>


                                  {application.candidate_location && (
                                    <span
                                      style={
                                        styles.personLocation
                                      }
                                    >

                                      <MapPin
                                        size={13}
                                      />

                                      {
                                        application.candidate_location
                                      }

                                    </span>
                                  )}

                                </div>

                              </div>

                            </td>


                            <td>

                              <strong
                                style={
                                  styles.roleTitle
                                }
                              >
                                {
                                  application.job_title
                                }
                              </strong>

                            </td>


                            <td>

                              <div
                                style={
                                  styles.companyCell
                                }
                              >

                                <Building2
                                  size={15}
                                />

                                {
                                  application.company_name ||
                                  'Unknown company'
                                }

                              </div>

                            </td>


                            <td>

                              {formatDate(
                                application.applied_at
                              )}

                            </td>


                            <td>

                              <StatusBadge
                                status={
                                  application.status
                                }
                              />

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </section>

          </>
        )}

      </div>
    </AppShell>
  )
}


// =========================================================
// HELPERS
// =========================================================

function getInitials(name) {
  if (!name) {
    return 'U'
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toUpperCase()
    )
    .join('')
}


function formatDate(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  )
}


// =========================================================
// STYLES
// =========================================================

const styles = {

  page: {
    width: '100%',
    maxWidth: 1320,
    margin: '0 auto',
    paddingBottom: 40,
    boxSizing: 'border-box',
  },

  header: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 24,
    marginBottom: 26,
  },

  kicker: {
    fontSize: 12,
    fontWeight: 800,
    color: '#6657e8',
    letterSpacing: '0.06em',
    marginBottom: 8,
  },

  title: {
    margin: 0,
    color: '#25222c',
    fontSize: 32,
    lineHeight: 1.15,
    fontWeight: 800,
  },

  subtitle: {
    margin: '9px 0 0',
    color: '#77727f',
    fontSize: 14,
  },

  refreshButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid #e2deea',
    background: '#ffffff',
    color: '#332e40',
    borderRadius: 10,
    padding: '10px 15px',
    fontSize: 13,
    fontWeight: 700,
  },

  error: {
    background: '#fff6f6',
    border: '1px solid #f0d2d2',
    color: '#b14343',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    fontSize: 13,
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(4, minmax(0, 1fr))',
    gap: 15,
    marginBottom: 20,
  },

  card: {
    background: '#ffffff',
    border: '1px solid #e8e5ee',
    borderRadius: 17,
    overflow: 'hidden',
  },

  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    padding: '20px 22px',
    borderBottom:
      '1px solid #eeeaf2',
  },

  cardTitle: {
    margin: 0,
    color: '#292532',
    fontSize: 18,
    fontWeight: 800,
  },

  cardSubtitle: {
    margin: '5px 0 0',
    color: '#918a9d',
    fontSize: 12,
  },

  searchBox: {
    width: 330,
    maxWidth: '100%',
    height: 42,
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    border: '1px solid #ddd9e7',
    borderRadius: 10,
    padding: '0 12px',
    boxSizing: 'border-box',
    background: '#ffffff',
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    border: 0,
    outline: 0,
    fontSize: 13,
    color: '#302b3b',
    background: 'transparent',
  },

  tableWrap: {
    width: '100%',
    overflowX: 'auto',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 1260,
    tableLayout: 'auto',
  },

  person: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minWidth: 255,
  },

  personInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
  },

  personName: {
    display: 'block',
    color: '#302b3b',
    fontSize: 13,
    fontWeight: 750,
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
  },

  personEmail: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    color: '#918a9d',
    fontSize: 11,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  },

  /* =======================================================
     NEW: RECRUITER POSITION
     ======================================================= */

  personPosition: {
    display: 'inline-flex',
    alignItems: 'center',
    width: 'fit-content',
    color: '#6657e8',
    background: '#f3f0ff',
    borderRadius: 6,
    padding: '3px 7px',
    fontSize: 10,
    fontWeight: 750,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  },

  personLocation: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    color: '#aaa4b2',
    fontSize: 10,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: '#f0edff',
    color: '#6657e8',
    display: 'grid',
    placeItems: 'center',
    fontSize: 11,
    fontWeight: 800,
    flexShrink: 0,
  },

  companyCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    color: '#686274',
    whiteSpace: 'nowrap',
  },

  selectedText: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    color: '#218653',
    fontWeight: 750,
  },

  roleTitle: {
    display: 'block',
    color: '#302b3b',
    fontSize: 13,
  },

  subText: {
    display: 'block',
    marginTop: 4,
    color: '#918a9d',
    fontSize: 11,
  },

  muted: {
    color: '#aaa4b2',
  },

  pipeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    fontSize: 11,
    color: '#77727f',
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

  approvalActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    whiteSpace: 'nowrap',
    minWidth: 155,
  },

  approveButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    border: '1px solid #cce8d8',
    background: '#edf9f2',
    color: '#218653',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 11,
    fontWeight: 750,
  },

  rejectButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    border: '1px solid #f0d2d2',
    background: '#fff1f1',
    color: '#c75252',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 11,
    fontWeight: 750,
  },

  noAction: {
    color: '#aaa4b2',
    fontSize: 11,
    whiteSpace: 'nowrap',
  },

  buttonSpinner: {
    animation:
      'spin 1s linear infinite',
  },
}


// =========================================================
// TABLE CSS
// =========================================================

const tableStyle = `
  th {
    text-align: left;
    padding: 13px 22px;
    background: #faf9fc;
    color: #8a8495;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: .06em;
    border-bottom: 1px solid #eeeaf2;
    white-space: nowrap;
  }

  td {
    padding: 17px 22px;
    border-bottom: 1px solid #f0edf3;
    color: #686274;
    font-size: 12px;
    vertical-align: middle;
  }

  tr:last-child td {
    border-bottom: 0;
  }

  tbody tr:hover {
    background: #fcfbfe;
  }

  button {
    font-family: inherit;
  }

  button:focus-visible {
    outline: 2px solid #6657e8;
    outline-offset: 2px;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 900px) {
    .hs-placement-stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
`


// =========================================================
// INJECT TABLE CSS
// =========================================================

if (
  typeof document !== 'undefined' &&
  !document.getElementById(
    'hiresense-placement-table-style'
  )
) {
  const style =
    document.createElement('style')

  style.id =
    'hiresense-placement-table-style'

  style.textContent = tableStyle

  document.head.appendChild(style)
}


export default PlacementOfficerDataPage