import { useEffect, useState } from 'react'
import {
  Users,
  BriefcaseBusiness,
  Building2,
  FileText,
  UserCheck,
  Activity,
} from 'lucide-react'

import AppShell from '../../components/layout/AppShell'
import { useAuth } from '../../context/AuthContext'


function StatCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #eceaf1',
        borderRadius: '16px',
        padding: '20px',
        minHeight: '118px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
        }}
      >
        <span
          style={{
            color: '#77727f',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          {label}
        </span>

        <Icon
          size={18}
          strokeWidth={2}
          color="#6d63d9"
        />
      </div>

      <div
        style={{
          fontSize: '28px',
          lineHeight: 1,
          fontWeight: 800,
          color: '#25222c',
        }}
      >
        {value}
      </div>
    </div>
  )
}


function PlacementOfficerDashboardPage() {
  const { user } = useAuth()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadOverview() {
      try {
        setLoading(true)
        setError('')

        const token = localStorage.getItem(
          'hiresense_token'
        )

        const response = await fetch(
          'http://localhost:8000/placement-officer/overview',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(
            'Unable to load placement overview.'
          )
        }

        const result = await response.json()

        setData(result)
      } catch (err) {
        setError(
          err.message ||
            'Unable to load placement overview.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadOverview()
  }, [])

  const summary = data?.summary || {}

  const userName =
    user?.name ||
    user?.full_name ||
    'Placement Officer'

  return (
    <AppShell
      role="placement_officer"
      userName={userName}
    >
      <div
        style={{
          maxWidth: '1320px',
          margin: '0 auto',
          paddingBottom: '40px',
        }}
      >
        <div
          style={{
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#6d63d9',
              marginBottom: '7px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Placement Office
          </div>

          <h1
            style={{
              margin: 0,
              color: '#25222c',
              fontSize: '28px',
              lineHeight: 1.2,
              fontWeight: 800,
            }}
          >
            Placement Overview
          </h1>

          <p
            style={{
              marginTop: '8px',
              marginBottom: 0,
              color: '#77727f',
              fontSize: '13px',
            }}
          >
            Monitor candidates, recruiters,
            placement drives and application
            progress from one workspace.
          </p>
        </div>

        {loading && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #eceaf1',
              borderRadius: '16px',
              padding: '28px',
              color: '#77727f',
            }}
          >
            Loading placement overview...
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              background: '#fff8f8',
              border: '1px solid #f0d8d8',
              borderRadius: '16px',
              padding: '20px',
              color: '#a33a3a',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(3, minmax(0, 1fr))',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              <StatCard
                icon={Users}
                label="Registered Candidates"
                value={
                  summary.registered_candidates ??
                  0
                }
              />

              <StatCard
                icon={UserCheck}
                label="Active Candidates"
                value={
                  summary.active_candidates ??
                  0
                }
              />

              <StatCard
                icon={UserCheck}
                label="Placed Candidates"
                value={
                  summary.placed_candidates ??
                  0
                }
              />

              <StatCard
                icon={FileText}
                label="Total Applications"
                value={
                  summary.total_applications ??
                  0
                }
              />

              <StatCard
                icon={BriefcaseBusiness}
                label="Open Placement Drives"
                value={
                  summary.open_jobs ??
                  0
                }
              />

              <StatCard
                icon={Building2}
                label="Participating Companies"
                value={
                  summary.participating_companies ??
                  0
                }
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'minmax(0, 1.35fr) minmax(320px, 0.65fr)',
                gap: '20px',
                alignItems: 'stretch',
              }}
            >
              <section
                style={{
                  background: '#ffffff',
                  border: '1px solid #eceaf1',
                  borderRadius: '16px',
                  padding: '22px',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '18px',
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '17px',
                        color: '#25222c',
                      }}
                    >
                      Placement Drive Monitoring
                    </h2>

                    <p
                      style={{
                        margin:
                          '6px 0 0',
                        fontSize: '12px',
                        color: '#77727f',
                      }}
                    >
                      Application progress
                      across active and
                      recent roles.
                    </p>
                  </div>

                  <Activity
                    size={19}
                    color="#6d63d9"
                  />
                </div>

                {data.role_monitoring?.length ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {data.role_monitoring.map(
                      (role) => (
                        <div
                          key={role.job_id}
                          style={{
                            border:
                              '1px solid #eeeaf3',
                            borderRadius:
                              '12px',
                            padding:
                              '13px 14px',
                          }}
                        >
                          <div
                            style={{
                              display:
                                'flex',
                              justifyContent:
                                'space-between',
                              gap: '12px',
                              alignItems:
                                'flex-start',
                            }}
                          >
                            <div
                              style={{
                                minWidth: 0,
                              }}
                            >
                              <strong
                                style={{
                                  display:
                                    'block',
                                  fontSize:
                                    '13px',
                                  color:
                                    '#292630',
                                }}
                              >
                                {role.job_title}
                              </strong>

                              <span
                                style={{
                                  display:
                                    'block',
                                  marginTop:
                                    '3px',
                                  fontSize:
                                    '11px',
                                  color:
                                    '#85808d',
                                }}
                              >
                                {
                                  role.company_name
                                }
                              </span>
                            </div>

                            <span
                              style={{
                                fontSize:
                                  '11px',
                                fontWeight:
                                  800,
                                color:
                                  '#6d63d9',
                                whiteSpace:
                                  'nowrap',
                              }}
                            >
                              {
                                role.application_count
                              }{' '}
                              applicants
                            </span>
                          </div>

                          <div
                            style={{
                              display:
                                'flex',
                              flexWrap:
                                'wrap',
                              gap:
                                '8px',
                              marginTop:
                                '11px',
                            }}
                          >
                            <span>
                              Shortlisted:{' '}
                              {
                                role.shortlisted_count
                              }
                            </span>

                            <span>
                              Interview:{' '}
                              {
                                role.interview_count
                              }
                            </span>

                            <span>
                              Selected:{' '}
                              {
                                role.selected_count
                              }
                            </span>

                            <span>
                              Rejected:{' '}
                              {
                                role.rejected_count
                              }
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '20px 0',
                      color: '#85808d',
                      fontSize: '12px',
                    }}
                  >
                    No placement drives
                    available yet.
                  </div>
                )}
              </section>

              <section
                style={{
                  background: '#ffffff',
                  border: '1px solid #eceaf1',
                  borderRadius: '16px',
                  padding: '22px',
                  minWidth: 0,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: '17px',
                    color: '#25222c',
                  }}
                >
                  Recent Applications
                </h2>

                <p
                  style={{
                    margin:
                      '6px 0 18px',
                    fontSize: '12px',
                    color: '#77727f',
                  }}
                >
                  Latest placement activity.
                </p>

                {data.recent_applications
                  ?.length ? (
                  <div
                    style={{
                      display:
                        'flex',
                      flexDirection:
                        'column',
                      gap: '10px',
                    }}
                  >
                    {data.recent_applications.map(
                      (application) => (
                        <div
                          key={
                            application.application_id
                          }
                          style={{
                            border:
                              '1px solid #eeeaf3',
                            borderRadius:
                              '11px',
                            padding:
                              '12px',
                          }}
                        >
                          <strong
                            style={{
                              display:
                                'block',
                              fontSize:
                                '12px',
                              color:
                                '#292630',
                            }}
                          >
                            {
                              application.candidate_name
                            }
                          </strong>

                          <span
                            style={{
                              display:
                                'block',
                              marginTop:
                                '3px',
                              fontSize:
                                '11px',
                              color:
                                '#85808d',
                            }}
                          >
                            {
                              application.job_title
                            }
                          </span>

                          <span
                            style={{
                              display:
                                'inline-block',
                              marginTop:
                                '7px',
                              fontSize:
                                '10px',
                              fontWeight:
                                800,
                              color:
                                '#6d63d9',
                            }}
                          >
                            {
                              application.status
                            }
                          </span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      color:
                        '#85808d',
                      fontSize:
                        '12px',
                    }}
                  >
                    No recent
                    applications.
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}


export default PlacementOfficerDashboardPage