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
  const [skillGapData, setSkillGapData] = useState(null)

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
          skillGapResponse,
        ] = await Promise.all([
          api.get(`/jobs/${jobId}`),
          api.get('/applications/me'),
          api
            .get(`/skill-gaps/candidate/job/${jobId}`)
            .catch(() => ({ data: null })),
        ])

        const jobData = jobResponse.data
        const applications = Array.isArray(
          applicationsResponse.data
        )
          ? applicationsResponse.data
          : []

        setJob(jobData)
        setSkillGapData(skillGapResponse?.data || null)

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

  const readinessSummary = useMemo(() => {
    const analysis = Array.isArray(skillGapData?.skill_analysis)
      ? skillGapData.skill_analysis
      : []

    const strong = analysis.filter(
      (item) => item.status === 'strong'
    )
    const developing = analysis.filter(
      (item) => item.status === 'developing'
    )
    const missing = analysis.filter(
      (item) => item.status === 'missing'
    )
    const highPriority = analysis.filter(
      (item) =>
        item.priority === 'high' ||
        (item.status === 'missing' && item.required)
    )

    return {
      analysis,
      strong,
      developing,
      missing,
      highPriority,
      score:
        skillGapData?.skill_gap_score != null
          ? Number(skillGapData.skill_gap_score)
          : null,
    }
  }, [skillGapData])

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

            {skillGapData && readinessSummary.analysis.length > 0 && (
              <section style={styles.contentCard}>
                <div style={styles.sectionKicker}>
                  HIRESENSE INTELLIGENCE
                </div>
                <div style={styles.readinessHeader}>
                  <div>
                    <h2 style={styles.sectionTitle}>
                      Skill readiness
                    </h2>
                    <p style={styles.readinessIntro}>
                      See how your existing evidence aligns with the skills
                      this opportunity needs.
                    </p>
                  </div>

                  {readinessSummary.score != null && (
                    <div style={styles.readinessScore}>
                      <span style={styles.readinessScoreValue}>
                        {readinessSummary.score.toFixed(0)}%
                      </span>
                      <span style={styles.readinessScoreLabel}>
                        skill readiness
                      </span>
                    </div>
                  )}
                </div>

                <div style={styles.readinessStats}>
                  <ReadinessStat
                    label="Strong"
                    value={readinessSummary.strong.length}
                    background="#e9f7f0"
                    color="#28785a"
                  />
                  <ReadinessStat
                    label="Developing"
                    value={readinessSummary.developing.length}
                    background="#fff4dc"
                    color="#9a6b17"
                  />
                  <ReadinessStat
                    label="Missing"
                    value={readinessSummary.missing.length}
                    background="#fff0ed"
                    color="#ad4939"
                  />
                  <ReadinessStat
                    label="Priority gaps"
                    value={readinessSummary.highPriority.length}
                    background="#eee8ff"
                    color="#6f5bc4"
                  />
                </div>

                <div style={styles.readinessGroups}>
                  <SkillReadinessGroup
                    title="Strong skills"
                    skills={readinessSummary.strong}
                    emptyText="No skills are currently classified as strong for this role."
                    tone="strong"
                  />
                  <SkillReadinessGroup
                    title="Developing skills"
                    skills={readinessSummary.developing}
                    emptyText="No developing skills were identified."
                    tone="developing"
                  />
                  <SkillReadinessGroup
                    title="Missing skills"
                    skills={readinessSummary.missing}
                    emptyText="No unsupported skills were identified."
                    tone="missing"
                  />
                </div>

                {readinessSummary.highPriority.length > 0 && (
                  <div style={styles.priorityBox}>
                    <div style={styles.priorityTitle}>
                      What to improve first
                    </div>
                    <p style={styles.priorityText}>
                      Focus on the high-priority gaps below, especially when
                      they are required skills for this opportunity.
                    </p>
                    <div style={styles.prioritySkills}>
                      {readinessSummary.highPriority.map((item) => (
                        <span
                          key={`priority-${item.skill_id}`}
                          style={styles.priorityChip}
                        >
                          {item.skill}
                          {item.required ? ' · Required' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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


function ReadinessStat({
  label,
  value,
  background,
  color,
}) {
  return (
    <div
      style={{
        ...styles.readinessStat,
        background,
        color,
      }}
    >
      <strong style={styles.readinessStatValue}>
        {value}
      </strong>
      <span style={styles.readinessStatLabel}>
        {label}
      </span>
    </div>
  )
}

function SkillReadinessGroup({
  title,
  skills,
  emptyText,
  tone,
}) {
  const toneStyles = {
    strong: {
      background: '#e9f7f0',
      color: '#28785a',
      border: '#d9eee3',
    },
    developing: {
      background: '#fff4dc',
      color: '#9a6b17',
      border: '#f1e2bd',
    },
    missing: {
      background: '#fff0ed',
      color: '#ad4939',
      border: '#f1d7d1',
    },
  }

  const currentTone =
    toneStyles[tone] || toneStyles.strong

  return (
    <div style={styles.readinessGroup}>
      <div style={styles.readinessGroupTitle}>
        {title}
      </div>

      {skills.length > 0 ? (
        <div style={styles.readinessSkillList}>
          {skills.map((item) => (
            <div
              key={`${tone}-${item.skill_id}`}
              style={{
                ...styles.readinessSkill,
                background: currentTone.background,
                borderColor: currentTone.border,
              }}
            >
              <span
                style={{
                  ...styles.readinessSkillDot,
                  background: currentTone.color,
                }}
              />
              <div style={styles.readinessSkillContent}>
                <strong style={styles.readinessSkillName}>
                  {item.skill}
                </strong>
                <span style={styles.readinessSkillMeta}>
                  {item.required ? 'Required' : 'Preferred'}
                  {' · '}
                  {item.evidence_score}% evidence
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.readinessEmpty}>
          {emptyText}
        </div>
      )}
    </div>
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

  readinessHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '18px',
    marginBottom: '16px',
  },

  readinessIntro: {
    margin: '-6px 0 0',
    maxWidth: '620px',
    color: '#858c9b',
    fontSize: '12px',
    lineHeight: 1.6,
  },

  readinessScore: {
    minWidth: '92px',
    padding: '10px 12px',
    borderRadius: '12px',
    background: '#f2edff',
    textAlign: 'center',
  },

  readinessScoreValue: {
    display: 'block',
    color: '#6f5bc4',
    fontSize: '22px',
    lineHeight: 1,
    fontWeight: 800,
  },

  readinessScoreLabel: {
    display: 'block',
    marginTop: '5px',
    color: '#81769a',
    fontSize: '9px',
    fontWeight: 700,
    lineHeight: 1.2,
  },

  readinessStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '9px',
    marginBottom: '16px',
  },

  readinessStat: {
    minHeight: '58px',
    padding: '9px 10px',
    boxSizing: 'border-box',
    borderRadius: '11px',
    textAlign: 'center',
  },

  readinessStatValue: {
    display: 'block',
    fontSize: '19px',
    lineHeight: 1,
  },

  readinessStatLabel: {
    display: 'block',
    marginTop: '5px',
    fontSize: '9px',
    fontWeight: 700,
  },

  readinessGroups: {
    display: 'grid',
    gap: '12px',
  },

  readinessGroup: {
    padding: '12px',
    border: '1px solid #ece8e4',
    borderRadius: '12px',
    background: '#fcfbfd',
  },

  readinessGroupTitle: {
    marginBottom: '8px',
    color: '#4b5264',
    fontSize: '11px',
    fontWeight: 800,
  },

  readinessSkillList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '8px',
  },

  readinessSkill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
    padding: '9px',
    border: '1px solid',
    borderRadius: '10px',
  },

  readinessSkillDot: {
    width: '7px',
    height: '7px',
    flexShrink: 0,
    borderRadius: '50%',
  },

  readinessSkillContent: {
    minWidth: 0,
  },

  readinessSkillName: {
    display: 'block',
    overflow: 'hidden',
    color: '#29344a',
    fontSize: '11px',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },

  readinessSkillMeta: {
    display: 'block',
    marginTop: '3px',
    color: '#858c9b',
    fontSize: '9px',
  },

  readinessEmpty: {
    color: '#858c9b',
    fontSize: '10px',
    lineHeight: 1.5,
  },

  priorityBox: {
    marginTop: '12px',
    padding: '12px',
    border: '1px solid #e1d9f1',
    borderRadius: '12px',
    background: '#f8f5ff',
  },

  priorityTitle: {
    color: '#5e527b',
    fontSize: '11px',
    fontWeight: 800,
  },

  priorityText: {
    margin: '4px 0 9px',
    color: '#7b748b',
    fontSize: '10px',
    lineHeight: 1.5,
  },

  prioritySkills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },

  priorityChip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 8px',
    borderRadius: '999px',
    background: '#eee8ff',
    color: '#6f5bc4',
    fontSize: '9px',
    fontWeight: 800,
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

  @media (max-width: 680px) {
    .hs-job-details-page .readinessHeader {
      flex-direction: column;
    }

    .hs-job-details-page .readinessScore {
      width: 100%;
      box-sizing: border-box;
    }

    .hs-job-details-page .readinessStats,
    .hs-job-details-page .readinessSkillList {
      grid-template-columns: 1fr 1fr;
    }
  }
`

export default JobDetailsPage
