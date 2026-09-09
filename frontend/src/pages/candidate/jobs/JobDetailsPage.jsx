import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MapPin,
  Send,
  Sparkles,
  XCircle,
} from 'lucide-react'

import AppShell from '../../../components/layout/AppShell'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../services/api'

const APPLICATION_STATUSES = {
  applied: {
    label: 'Applied',
    background: '#edf2ff',
    color: '#5268a9',
  },
  shortlisted: {
    label: 'Shortlisted',
    background: '#fff4dc',
    color: '#9a6b17',
  },
  interview: {
    label: 'Interview',
    background: '#e9f7f0',
    color: '#28785a',
  },
  rejected: {
    label: 'Rejected',
    background: '#fff0ed',
    color: '#ad4939',
  },
  selected: {
    label: 'Selected',
    background: '#eee8ff',
    color: '#6f5bc4',
  },
}

function JobDetailsPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const {
    user,
    loading: authLoading,
    isAuthenticated,
  } = useAuth()

  const [job, setJob] = useState(null)
  const [company, setCompany] = useState(null)
  const [jobSkills, setJobSkills] = useState([])
  const [skills, setSkills] = useState([])
  const [existingApplication, setExistingApplication] =
    useState(null)

  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')
  const [applyError, setApplyError] = useState('')
  const [applySuccess, setApplySuccess] = useState('')

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return
    }

    async function loadJob() {
      try {
        setLoading(true)
        setError('')

        const [
          jobResponse,
          applicationsResponse,
        ] = await Promise.all([
          api.get(`/jobs/${jobId}`),
          api.get('/applications/me'),
        ])

        const jobData = jobResponse.data
        const applications = Array.isArray(
          applicationsResponse.data
        )
          ? applicationsResponse.data
          : []

        setJob(jobData)

        const currentApplication = applications.find(
          (application) =>
            application.job_id === Number(jobId)
        )

        setExistingApplication(
          currentApplication || null
        )

        const companyPromise = jobData.company_id
          ? api.get(
              `/companies/${jobData.company_id}`
            )
          : Promise.resolve(null)

        const jobSkillsPromise = api.get(
          `/job-skills/job/${jobId}`
        )

        const skillsPromise = api.get('/skills/')

        const [
          companyResponse,
          jobSkillsResponse,
          skillsResponse,
        ] = await Promise.all([
          companyPromise,
          jobSkillsPromise,
          skillsPromise,
        ])

        setCompany(
          companyResponse?.data || null
        )
        setJobSkills(
          Array.isArray(jobSkillsResponse.data)
            ? jobSkillsResponse.data
            : []
        )
        setSkills(
          Array.isArray(skillsResponse.data)
            ? skillsResponse.data
            : []
        )
      } catch (err) {
        console.error(err)
        setError(
          err.response?.data?.detail ||
            'Unable to load this opportunity.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadJob()
  }, [authLoading, isAuthenticated, jobId])

  const skillNames = useMemo(() => {
    const skillMap = new Map(
      skills.map((skill) => [
        skill.id,
        skill.name,
      ])
    )

    return jobSkills
      .map((item) => ({
        ...item,
        name:
          skillMap.get(item.skill_id) ||
          `Skill #${item.skill_id}`,
      }))
      .sort((a, b) => {
        if (Boolean(a.required) !== Boolean(b.required)) {
          return a.required ? -1 : 1
        }

        return (
          Number(b.importance || 0) -
          Number(a.importance || 0)
        )
      })
  }, [jobSkills, skills])

  async function handleApply() {
    if (!job) return

    if (job.status !== 'open') {
      setApplyError(
        'This opportunity is no longer accepting applications.'
      )
      return
    }

    if (existingApplication) {
      setApplyError(
        'You have already applied to this opportunity.'
      )
      return
    }

    try {
      setApplying(true)
      setApplyError('')
      setApplySuccess('')

      const response = await api.post(
        '/applications/',
        {
          job_id: job.id,
        }
      )

      setExistingApplication(response.data)
      setApplySuccess(
        'Application submitted successfully.'
      )
    } catch (err) {
      console.error(err)
      setApplyError(
        err.response?.data?.detail ||
          'Unable to submit your application.'
      )
    } finally {
      setApplying(false)
    }
  }

  if (authLoading) {
    return (
      <AppShell
        role="candidate"
        userName={user?.name || 'User'}
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

  if (user?.role !== 'candidate') {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return (
      <AppShell
        role="candidate"
        userName={user?.name || 'User'}
      >
        <div style={styles.centerMessage}>
          <Sparkles size={20} />
          Loading opportunity...
        </div>
      </AppShell>
    )
  }

  if (error || !job) {
    return (
      <AppShell
        role="candidate"
        userName={user?.name || 'User'}
      >
        <div style={styles.errorPage}>
          <XCircle size={28} />
          <h2>Opportunity unavailable</h2>
          <p>
            {error ||
              'This opportunity could not be found.'}
          </p>
          <button
            type="button"
            onClick={() =>
              navigate('/candidate/jobs')
            }
            style={styles.secondaryButton}
          >
            <ArrowLeft size={16} />
            Back to opportunities
          </button>
        </div>
      </AppShell>
    )
  }

  const isOpen = job.status === 'open'
  const hasApplied = Boolean(existingApplication)

  return (
    <AppShell
      role="candidate"
      userName={user?.name || 'User'}
    >
      <div className="hs-job-details-page">
        <style>{responsiveStyles}</style>

        <button
          type="button"
          onClick={() =>
            navigate('/candidate/jobs')
          }
          style={styles.backButton}
        >
          <ArrowLeft size={16} />
          Back to opportunities
        </button>

        <div className="hs-job-details-grid">
          <main>
            <section style={styles.heroCard}>
              <div style={styles.heroIcon}>
                <BriefcaseBusiness size={28} />
              </div>

              <div style={styles.heroContent}>
                <div style={styles.kicker}>
                  OPPORTUNITY
                </div>

                <h1 style={styles.title}>
                  {job.title}
                </h1>

                <div style={styles.companyName}>
                  {company?.name ||
                    `Company #${job.company_id}`}
                </div>

                <div style={styles.metaRow}>
                  {job.location && (
                    <span style={styles.metaItem}>
                      <MapPin size={15} />
                      {job.location}
                    </span>
                  )}

                  {job.employment_type && (
                    <span style={styles.metaItem}>
                      <BriefcaseBusiness size={15} />
                      {job.employment_type}
                    </span>
                  )}

                  {job.experience_level && (
                    <span style={styles.metaItem}>
                      <Clock3 size={15} />
                      {job.experience_level}
                    </span>
                  )}
                </div>
              </div>

              <span
                style={{
                  ...styles.statusBadge,
                  background: isOpen
                    ? '#e7f7ef'
                    : '#f1eff2',
                  color: isOpen
                    ? '#28785a'
                    : '#716b76',
                }}
              >
                {isOpen ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <XCircle size={14} />
                )}
                {isOpen ? 'Open' : 'Closed'}
              </span>
            </section>

            <section style={styles.contentCard}>
              <div style={styles.sectionKicker}>
                ABOUT THE ROLE
              </div>
              <h2 style={styles.sectionTitle}>
                Job description
              </h2>
              <p style={styles.description}>
                {job.description}
              </p>
            </section>

            {skillNames.length > 0 && (
              <section style={styles.contentCard}>
                <div style={styles.sectionKicker}>
                  WHAT YOU'LL NEED
                </div>
                <h2 style={styles.sectionTitle}>
                  Skills
                </h2>

                <div style={styles.skillGrid}>
                  {skillNames.map((skill) => (
                    <div
                      key={skill.id}
                      style={styles.skillCard}
                    >
                      <div style={styles.skillDot}>
                        <CheckCircle2 size={15} />
                      </div>

                      <div>
                        <strong
                          style={styles.skillName}
                        >
                          {skill.name}
                        </strong>

                        <div
                          style={styles.skillMeta}
                        >
                          {skill.required
                            ? 'Required'
                            : 'Preferred'}
                          {Number(
                            skill.importance || 0
                          ) > 1 && (
                            <>
                              {' '}
                              · High importance
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section style={styles.contentCard}>
              <div style={styles.sectionKicker}>
                ELIGIBILITY
              </div>
              <h2 style={styles.sectionTitle}>
                Requirements
              </h2>

              <div style={styles.requirementList}>
                {job.minimum_degree && (
                  <Requirement
                    icon={<GraduationCap size={17} />}
                    label="Minimum degree"
                    value={job.minimum_degree}
                  />
                )}

                {job.required_field_of_study && (
                  <Requirement
                    icon={<GraduationCap size={17} />}
                    label="Field of study"
                    value={
                      job.required_field_of_study
                    }
                  />
                )}

                {(job.experience_min != null ||
                  job.experience_max != null) && (
                  <Requirement
                    icon={<Clock3 size={17} />}
                    label="Experience"
                    value={`${job.experience_min ?? 0}–${
                      job.experience_max ?? 'Any'
                    } years`}
                  />
                )}

                {job.minimum_grade != null && (
                  <Requirement
                    icon={<CheckCircle2 size={17} />}
                    label="Minimum grade"
                    value={String(
                      job.minimum_grade
                    )}
                  />
                )}

                {!job.minimum_degree &&
                  !job.required_field_of_study &&
                  job.experience_min == null &&
                  job.experience_max == null &&
                  job.minimum_grade == null && (
                    <div
                      style={styles.noRequirements}
                    >
                      No additional eligibility
                      requirements were specified.
                    </div>
                  )}
              </div>
            </section>
          </main>

          <aside className="hs-job-details-side">
            <section style={styles.applyCard}>
              <div style={styles.sectionKicker}>
                APPLICATION
              </div>

              <h2 style={styles.applyTitle}>
                {hasApplied
                  ? 'Application submitted'
                  : 'Ready to apply?'}
              </h2>

              <p style={styles.applyText}>
                {hasApplied
                  ? 'Your application is now in the recruiter pipeline. You can track its progress from My Applications.'
                  : isOpen
                    ? 'Submit your application directly through HireSense. Your candidate profile will be used for the application.'
                    : 'This opportunity is currently closed and cannot accept new applications.'}
              </p>

              {job.salary_min != null &&
                job.salary_max != null && (
                  <div style={styles.salary}>
                    ₹
                    {Number(
                      job.salary_min
                    ).toLocaleString('en-IN')}
                    {' – '}
                    ₹
                    {Number(
                      job.salary_max
                    ).toLocaleString('en-IN')}
                  </div>
                )}

              {applyError && (
                <div style={styles.applyError}>
                  {applyError}
                </div>
              )}

              {applySuccess && (
                <div style={styles.applySuccess}>
                  <CheckCircle2 size={17} />
                  {applySuccess}
                </div>
              )}

              <button
                type="button"
                onClick={handleApply}
                disabled={
                  applying ||
                  hasApplied ||
                  !isOpen
                }
                style={{
                  ...styles.applyButton,
                  opacity:
                    applying ||
                    hasApplied ||
                    !isOpen
                      ? 0.62
                      : 1,
                  cursor:
                    applying ||
                    hasApplied ||
                    !isOpen
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                <Send size={17} />
                {applying
                  ? 'Submitting...'
                  : hasApplied
                    ? 'Already applied'
                    : isOpen
                      ? 'Apply now'
                      : 'Applications closed'}
              </button>

              {hasApplied && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      '/candidate/applications'
                    )
                  }
                  style={styles.secondaryButton}
                >
                  Track application
                  <ArrowUpRight size={15} />
                </button>
              )}

              {job.application_url && (
                <a
                  href={job.application_url}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.externalLink}
                >
                  External application link
                  <ArrowUpRight size={14} />
                </a>
              )}
            </section>

            <section style={styles.infoCard}>
              <div style={styles.infoIcon}>
                <Sparkles size={18} />
              </div>
              <div>
                <strong style={styles.infoTitle}>
                  HireSense matching
                </strong>
                <p style={styles.infoText}>
                  Your profile, skills, education,
                  and experience will power the
                  matching and skill-gap analysis
                  features as they are connected.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}

function Requirement({ icon, label, value }) {
  return (
    <div style={styles.requirement}>
      <div style={styles.requirementIcon}>
        {icon}
      </div>
      <div>
        <div style={styles.requirementLabel}>
          {label}
        </div>
        <strong style={styles.requirementValue}>
          {value}
        </strong>
      </div>
    </div>
  )
}

const styles = {
  centerMessage: {
    minHeight: '420px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    color: '#716b78',
  },

  errorPage: {
    minHeight: '420px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: '#a34a3e',
  },

  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    marginBottom: '18px',
    padding: '8px 0',
    border: 0,
    background: 'transparent',
    color: '#685d83',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  heroCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '18px',
    padding: '26px',
    border: '1px solid #e8e4df',
    borderRadius: '20px',
    background: '#ffffff',
    boxShadow:
      '0 10px 30px rgba(40, 30, 70, 0.045)',
  },

  heroIcon: {
    width: '56px',
    height: '56px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '16px',
    background: '#eee8ff',
    color: '#6f5bc4',
  },

  heroContent: {
    minWidth: 0,
    flex: 1,
  },

  kicker: {
    color: '#8a7bb4',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.12em',
  },

  title: {
    margin: '6px 0 4px',
    color: '#18233d',
    fontSize: '31px',
    lineHeight: 1.18,
    fontWeight: 800,
    letterSpacing: '-0.5px',
  },

  companyName: {
    color: '#665b7d',
    fontSize: '15px',
    fontWeight: 700,
  },

  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '13px',
    marginTop: '12px',
  },

  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    color: '#788092',
    fontSize: '12px',
  },

  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    flexShrink: 0,
    padding: '7px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 800,
  },

  contentCard: {
    marginTop: '18px',
    padding: '24px 26px',
    border: '1px solid #e8e4df',
    borderRadius: '18px',
    background: '#ffffff',
  },

  sectionKicker: {
    color: '#8a7bb4',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.12em',
  },

  sectionTitle: {
    margin: '5px 0 12px',
    color: '#1d2940',
    fontSize: '20px',
    fontWeight: 800,
  },

  description: {
    margin: 0,
    color: '#667085',
    fontSize: '14px',
    lineHeight: 1.8,
    whiteSpace: 'pre-wrap',
  },

  skillGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(2, minmax(0, 1fr))',
    gap: '10px',
  },

  skillCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    border: '1px solid #ece8e4',
    borderRadius: '12px',
    background: '#fcfbfd',
  },

  skillDot: {
    width: '31px',
    height: '31px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '9px',
    background: '#e9f7f0',
    color: '#2d8662',
  },

  skillName: {
    color: '#29344a',
    fontSize: '13px',
  },

  skillMeta: {
    marginTop: '3px',
    color: '#9299a8',
    fontSize: '10px',
  },

  requirementList: {
    display: 'grid',
    gap: '10px',
  },

  requirement: {
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    padding: '12px',
    borderRadius: '11px',
    background: '#faf9fb',
  },

  requirementIcon: {
    width: '34px',
    height: '34px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '9px',
    background: '#eee8ff',
    color: '#6f5bc4',
  },

  requirementLabel: {
    color: '#9299a8',
    fontSize: '10px',
    fontWeight: 700,
  },

  requirementValue: {
    display: 'block',
    marginTop: '2px',
    color: '#29344a',
    fontSize: '12px',
  },

  noRequirements: {
    padding: '13px',
    borderRadius: '10px',
    background: '#faf9fb',
    color: '#858c9b',
    fontSize: '12px',
  },

  applyCard: {
    padding: '23px',
    border: '1px solid #e1d9f1',
    borderRadius: '18px',
    background: '#f2edff',
  },

  applyTitle: {
    margin: '6px 0 7px',
    color: '#292b46',
    fontSize: '21px',
    fontWeight: 800,
  },

  applyText: {
    margin: 0,
    color: '#6d6780',
    fontSize: '12px',
    lineHeight: 1.65,
  },

  salary: {
    marginTop: '17px',
    color: '#262d43',
    fontSize: '18px',
    fontWeight: 800,
  },

  applyButton: {
    width: '100%',
    minHeight: '44px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '18px',
    border: 0,
    borderRadius: '11px',
    background: '#725fc7',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 800,
  },

  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    minHeight: '40px',
    marginTop: '9px',
    padding: '0 13px',
    border: '1px solid #ded7eb',
    borderRadius: '10px',
    background: '#ffffff',
    color: '#5e527b',
    fontSize: '12px',
    fontWeight: 700,
    textDecoration: 'none',
    cursor: 'pointer',
  },

  externalLink: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    width: '100%',
    boxSizing: 'border-box',
    marginTop: '13px',
    color: '#6b5bb2',
    fontSize: '11px',
    fontWeight: 700,
    textDecoration: 'none',
  },

  applyError: {
    marginTop: '13px',
    padding: '10px 11px',
    borderRadius: '9px',
    background: '#fff0ed',
    color: '#a34a3e',
    fontSize: '11px',
    lineHeight: 1.5,
    fontWeight: 600,
  },

  applySuccess: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '7px',
    marginTop: '13px',
    padding: '10px 11px',
    borderRadius: '9px',
    background: '#e8f7ef',
    color: '#2b7d5b',
    fontSize: '11px',
    lineHeight: 1.5,
    fontWeight: 700,
  },

  infoCard: {
    display: 'flex',
    gap: '11px',
    marginTop: '14px',
    padding: '17px',
    border: '1px solid #e8e4df',
    borderRadius: '16px',
    background: '#ffffff',
  },

  infoIcon: {
    width: '35px',
    height: '35px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '10px',
    background: '#fff1d9',
    color: '#aa761d',
  },

  infoTitle: {
    color: '#30384c',
    fontSize: '12px',
  },

  infoText: {
    margin: '4px 0 0',
    color: '#858c9b',
    fontSize: '11px',
    lineHeight: 1.55,
  },
}

const responsiveStyles = `
  .hs-job-details-page {
    width: 100%;
    box-sizing: border-box;
    padding-bottom: 24px;
  }

  .hs-job-details-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.7fr);
    gap: 18px;
    align-items: start;
  }

  .hs-job-details-side {
    position: sticky;
    top: 20px;
  }

  @media (max-width: 1050px) {
    .hs-job-details-grid {
      grid-template-columns: 1fr;
    }

    .hs-job-details-side {
      position: static;
    }
  }

  @media (max-width: 680px) {
    .hs-job-details-page {
      padding-bottom: 12px;
    }

    .hs-job-details-grid {
      gap: 12px;
    }
  }
`

export default JobDetailsPage
