import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  GraduationCap,
  Sparkles,
  Target,
  UserRound,
} from 'lucide-react'

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AppShell from '../../components/layout/AppShell'
import api from '../../services/api'

function CandidateDashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [recommendationData, setRecommendationData] = useState(null)
  const [skillGapData, setSkillGapData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [
          dashboardResponse,
          recommendationResponse,
          skillGapResponse,
        ] = await Promise.all([
          api.get('/analytics/candidate'),
          api.get('/matching/candidate/jobs/recommended'),
          api.get('/skill-gaps/candidate').catch(() => ({ data: null })),
        ])

        setData(dashboardResponse.data)
        setRecommendationData(recommendationResponse.data)
        setSkillGapData(skillGapResponse.data)
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          'Unable to load your dashboard.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <AppShell
        role="candidate"
        userName="User"
      >
        <div className="hs-loading-page">
          <div className="hs-spinner" />
          <span>Loading your career intelligence...</span>
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell
        role="candidate"
        userName="User"
      >
        <div className="hs-error-state">
          <div className="hs-error-icon">
            !
          </div>

          <h2>Something went wrong</h2>
          <p>{error}</p>

          <button
            className="hs-primary-action"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </AppShell>
    )
  }

  const candidate = data.candidate
  const summary = data.application_summary
  const skills = data.skills || []
  const applications = data.recent_applications || []
  const recommendations = data.recommendations || []
  const rankedRecommendations =
    recommendationData?.rankings || []
  const priorityGaps = skillGapData?.priority_gaps || []
  const strongSkills = skillGapData?.strong_skills || []
  const developingSkills = skillGapData?.developing_skills || []
  const targetJobs = skillGapData?.target_jobs || []
  const careerReadiness = skillGapData?.career_readiness

  const selectedCount =
    summary.status_distribution?.selected || 0

  const shortlistedCount =
    summary.status_distribution?.shortlisted || 0

  const recommendation =
    rankedRecommendations.length > 0
      ? rankedRecommendations[0]
      : recommendations.length > 0
        ? recommendations[0]
        : null

  const matchedSkillNames =
    recommendation?.matched_skills?.map((skill) => {
      if (typeof skill === 'string' && Number.isNaN(Number(skill))) {
        return skill
      }

      const skillId = Number(skill)
      const matchedSkill = skills.find(
        (candidateSkill) =>
          Number(candidateSkill.skill_id) === skillId,
      )

      return matchedSkill?.skill_name || String(skill)
    }) || []

  return (
    <AppShell
      role="candidate"
      userName={candidate.full_name}
    >
      <div className="candidate-dashboard">
        <style>{`
          .candidate-dashboard .hs-dashboard-grid {
            gap: 16px;
          }

          .candidate-dashboard .hs-lower-grid {
            grid-template-columns: minmax(0, 1.18fr) minmax(360px, 0.88fr);
            column-gap: 20px;
            row-gap: 20px;
            align-items: stretch;
            margin-top: 20px;
          }

          .candidate-dashboard .hs-lower-grid > .hs-panel {
            min-width: 0;
            height: 100%;
            box-sizing: border-box;
          }

          .candidate-dashboard .hs-lower-grid .hs-panel-header {
            margin-bottom: 18px;
          }

          @media (max-width: 1100px) {
            .candidate-dashboard .hs-lower-grid {
              grid-template-columns: minmax(0, 1.05fr) minmax(300px, 0.95fr);
            }
          }

          @media (max-width: 820px) {
            .candidate-dashboard .hs-lower-grid {
              grid-template-columns: 1fr;
              row-gap: 18px;
            }

            .candidate-dashboard .hs-lower-grid > .hs-panel {
              height: auto;
            }
          }

          .candidate-dashboard .hs-panel {
            box-sizing: border-box;
          }

          .candidate-dashboard .hs-lower-grid > .hs-panel {
            min-height: 0;
          }

          .candidate-dashboard .hs-application-list {
            gap: 0;
          }

          .candidate-dashboard .hs-application-row {
            min-height: 64px;
            padding: 10px 0;
          }

          .candidate-dashboard .hs-application-company {
            min-width: 0;
          }

          .candidate-dashboard .hs-application-company strong {
            font-size: 12px;
          }

          .candidate-dashboard .hs-application-company span {
            font-size: 10px;
          }

          .candidate-dashboard .hs-application-right {
            margin-left: 12px;
          }

          .candidate-dashboard .hs-skill-grid {
            gap: 13px;
          }

          .candidate-dashboard .hs-skill-item {
            min-height: 34px;
          }

          .candidate-dashboard .hs-skill-name strong {
            font-size: 11px;
          }

          .candidate-dashboard .hs-skill-name span {
            font-size: 9px;
          }

          .candidate-dashboard .hs-skill-level {
            gap: 8px;
          }

          .candidate-dashboard .hs-skill-track {
            min-width: 90px;
          }

          .candidate-dashboard .hs-recommendation-panel,
          .candidate-dashboard .hs-profile-panel {
            min-height: 0;
          }


        `}</style>

        {/* =================================================
            PAGE HEADER
           ================================================= */}

        <section className="hs-page-header">

          <div>
            <span className="hs-page-eyebrow">
              Candidate Dashboard
            </span>

            <h1>
              Welcome back, {candidate.full_name.split(' ')[0]}.
            </h1>

            <p>
              Here is your latest career intelligence,
              application activity, and recommended
              opportunities.
            </p>
          </div>

          <div className="hs-profile-completion">

            <div className="hs-completion-ring">
              <strong>
                {Math.round(candidate.profile_completion)}%
              </strong>
            </div>

            <div>
              <strong>Profile strength</strong>
              <span>
                {candidate.profile_completion >= 100
                  ? 'Profile complete'
                  : 'Complete your profile'}
              </span>
            </div>

          </div>

        </section>


        {/* =================================================
            STAT CARDS
           ================================================= */}

        <section className="hs-stat-grid">

          <div className="hs-stat-card">

            <div className="hs-stat-icon purple">
              <FileText size={18} />
            </div>

            <div className="hs-stat-content">
              <span>Applications</span>
              <strong>
                {summary.total_applications}
              </strong>
              <small>
                Total submitted
              </small>
            </div>

          </div>


          <div className="hs-stat-card">

            <div className="hs-stat-icon amber">
              <Clock3 size={18} />
            </div>

            <div className="hs-stat-content">
              <span>Shortlisted</span>
              <strong>
                {shortlistedCount}
              </strong>
              <small>
                Moving forward
              </small>
            </div>

          </div>


          <div className="hs-stat-card">

            <div className="hs-stat-icon green">
              <CheckCircle2 size={18} />
            </div>

            <div className="hs-stat-content">
              <span>Selected</span>
              <strong>
                {selectedCount}
              </strong>
              <small>
                Successful applications
              </small>
            </div>

          </div>


          <div className="hs-stat-card">

            <div className="hs-stat-icon blue">
              <Target size={18} />
            </div>

            <div className="hs-stat-content">
              <span>Skills</span>
              <strong>
                {skills.length}
              </strong>
              <small>
                In your profile
              </small>
            </div>

          </div>

        </section>


        {/* =================================================
            MAIN GRID
           ================================================= */}

        <section className="hs-dashboard-grid">

          {/* AI Recommendation */}

          <div className="hs-panel hs-recommendation-panel">

            <div className="hs-panel-header">

              <div>
                <div className="hs-section-label">
                  <Sparkles size={13} />
                  AI Recommendations
                </div>

                <h2>
                  Your best opportunity
                </h2>
              </div>

              {recommendation && (
                <div className="hs-match-score">
                  <strong>
                    {(recommendation.recommendation_score ??
                      recommendation.match_score ??
                      0).toFixed(2)}%
                  </strong>
                  <span>Recommendation Score</span>
                </div>
              )}

            </div>


            {recommendation ? (

              <>

                <div className="hs-recommended-job">

                  <div className="hs-company-avatar">
                    <BriefcaseBusiness size={20} />
                  </div>

                  <div className="hs-job-main">

                    <div className="hs-job-title-row">
                      <h3>
                        {recommendation.job_title}
                      </h3>

                      {recommendation.eligible && (
                        <span className="hs-eligible-badge">
                          <CheckCircle2 size={12} />
                          Eligible
                        </span>
                      )}
                    </div>

                    <p>
                      {recommendation.location || 'Location not specified'}
                      {' • '}
                      {recommendation.employment_type || 'Employment type not specified'}
                    </p>

                  </div>

                  <button
                    type="button"
                    className="hs-view-job"
                    onClick={() =>
                      navigate(`/candidate/jobs/${recommendation.job_id}`)
                    }
                  >
                    View
                    <ArrowUpRight size={15} />
                  </button>

                </div>


                <div className="hs-match-breakdown">

                  <MatchMetric
                    label="Profile Fit"
                    value={
                      recommendation.profile_fit_score ??
                      recommendation.match_score ??
                      0
                    }
                  />

                  <MatchMetric
                    label="Preference Fit"
                    value={recommendation.preference_fit_score ?? 0}
                  />

                  <MatchMetric
                    label="Skill Match"
                    value={recommendation.skill_score ?? 0}
                  />

                  <MatchMetric
                    label="Experience"
                    value={recommendation.experience_score ?? 0}
                  />

                </div>

                {recommendation.preference_reasons?.length > 0 && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: '#f8f6ff',
                      border: '1px solid #ebe7f8',
                      fontSize: '12px',
                      lineHeight: 1.5,
                      color: '#66616f',
                    }}
                  >
                    <strong
                      style={{
                        display: 'block',
                        marginBottom: '4px',
                        color: '#4f4860',
                      }}
                    >
                      Why this is recommended
                    </strong>
                    {recommendation.preference_reasons
                      .slice(0, 2)
                      .join(' ')}
                  </div>
                )}

                <div className="hs-recommendation-footer">

                  <div>
                    <span>Matched skills</span>

                    <div className="hs-mini-skills">

                      {matchedSkillNames.length > 0 ? (
                        matchedSkillNames.map(
                          (skill, index) => (
                            <span key={`${skill}-${index}`}>
                              {skill}
                            </span>
                          ),
                        )
                      ) : (
                        <span className="hs-no-data">
                          No explicit skill mappings
                        </span>
                      )}

                    </div>
                  </div>

                  <div className="hs-model-label">
                    <Sparkles size={12} />
                    Explainable AI
                  </div>

                </div>

              </>

            ) : (

              <div className="hs-empty-state">
                <Sparkles size={25} />
                <h3>No recommendations yet</h3>
                <p>
                  Complete your profile and skills to receive
                  personalized opportunities.
                </p>
              </div>

            )}

          </div>


          {/* Profile Card */}

          <div className="hs-panel hs-profile-panel">

            <div className="hs-panel-header">

              <div>
                <div className="hs-section-label">
                  <UserRound size={13} />
                  Profile
                </div>

                <h2>
                  Your profile
                </h2>
              </div>

            </div>


            <div className="hs-profile-progress">

              <div className="hs-progress-track">
                <div
                  className="hs-progress-fill"
                  style={{
                    width: `${candidate.profile_completion}%`,
                  }}
                />
              </div>

              <div className="hs-progress-label">
                <strong>
                  {Math.round(candidate.profile_completion)}%
                </strong>

                <span>
                  Complete
                </span>
              </div>

            </div>


            <div className="hs-profile-items">

              <ProfileItem
                icon={<UserRound size={16} />}
                label="Personal information"
                complete={candidate.profile_completion > 0}
              />

              <ProfileItem
                icon={<GraduationCap size={16} />}
                label="Education"
                complete={skills.length > 0}
              />

              <ProfileItem
                icon={<Target size={16} />}
                label="Skills & experience"
                complete={skills.length > 0}
              />

            </div>


            <button
              type="button"
              className="hs-profile-button"
              onClick={() => navigate('/candidate/profile')}
            >
              View profile
              <ChevronRight size={15} />
            </button>

          </div>

        </section>


        {/* =================================================
            RESUME STATUS
           ================================================= */}

        <section
          style={{
            marginTop: '24px',
            padding: '19px 21px',
            borderRadius: '18px',
            border: '1px solid #e7e2f5',
            background:
              'linear-gradient(135deg, #fbf9ff 0%, #f5f8ff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                background: '#ece8ff',
                color: '#6d5bc7',
              }}
            >
              <FileText size={21} />
            </div>

            <div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#6d5bc7',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '4px',
                }}
              >
                Resume Intelligence
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  color: '#252525',
                }}
              >
                Upload your resume to strengthen job matching
              </h2>

              <p
                style={{
                  margin: '6px 0 0',
                  color: '#6f6f6f',
                  fontSize: '13px',
                  lineHeight: 1.5,
                }}
              >
                HireSense can use your resume as evidence for skills and
                personalized match analysis.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/candidate/resume')}
            style={{
              border: 'none',
              borderRadius: '11px',
              padding: '11px 17px',
              background: '#7563c7',
              color: '#ffffff',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 7px 18px rgba(117, 99, 199, 0.18)',
            }}
          >
            Manage Resume
            <ChevronRight
              size={15}
              style={{ verticalAlign: 'middle', marginLeft: '6px' }}
            />
          </button>
        </section>


        {/* =================================================
            SKILL GAP INTELLIGENCE
           ================================================= */}

        <section
          style={{
            marginTop: '24px',
            padding: '22px 24px',
            borderRadius: '18px',
            border: '1px solid #e7e2f5',
            background: '#ffffff',
            boxShadow: '0 6px 20px rgba(32, 24, 56, 0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '18px',
              marginBottom: '18px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#635bff',
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                <Target size={13} />
                Skill Gap Intelligence
              </div>

              <h2
                style={{
                  margin: '5px 0 5px',
                  fontSize: '21px',
                  letterSpacing: '-0.025em',
                  color: '#171717',
                }}
              >
                Skills that can strengthen your next opportunity
              </h2>

              <p
                style={{
                  margin: 0,
                  color: '#6f6f6f',
                  fontSize: '13px',
                  lineHeight: 1.55,
                }}
              >
                HireSense compares your existing evidence with the skills
                requested by your strongest eligible roles.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
              }}
            >
              {careerReadiness != null && (
                <div
                  title="Average skill readiness across the strongest eligible target roles."
                  style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: '#f8f6ff',
                    border: '1px solid #ebe7f8',
                    color: '#6557ba',
                    fontSize: '11px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Career readiness <strong>{Number(careerReadiness).toFixed(0)}%</strong>
                </div>
              )}

              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: '#f8f6ff',
                  border: '1px solid #ebe7f8',
                  color: '#6557ba',
                  fontSize: '11px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                {targetJobs.length} target role{targetJobs.length === 1 ? '' : 's'} analyzed
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '12px',
            }}
          >
            <SkillGapGroup
              title="Strong"
              description="Well-supported by your evidence"
              items={strongSkills}
              tone="green"
            />

            <SkillGapGroup
              title="Developing"
              description="Evidence exists, but depth can improve"
              items={developingSkills}
              tone="amber"
            />

            <SkillGapGroup
              title="Priority gaps"
              description="Skills with the biggest opportunity impact"
              items={priorityGaps}
              tone="purple"
              isPriority
            />
          </div>

          {targetJobs.length > 0 && (
            <div
              style={{
                marginTop: '16px',
                paddingTop: '15px',
                borderTop: '1px solid #efedf4',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <span
                style={{
                  color: '#77727f',
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Strongest target roles
              </span>

              {targetJobs.slice(0, 3).map((job) => (
                <button
                  type="button"
                  key={job.job_id}
                  onClick={() =>
                    navigate(`/candidate/jobs/${job.job_id}`)
                  }
                  aria-label={`View skill readiness for ${job.job_title}`}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '8px 11px',
                    borderRadius: '10px',
                    background: '#fbfbfd',
                    border: '1px solid #efedf4',
                    color: 'inherit',
                    font: 'inherit',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'border-color 0.16s ease, background 0.16s ease, transform 0.16s ease',
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = '#f8f6ff'
                    event.currentTarget.style.borderColor = '#ddd5f6'
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = '#fbfbfd'
                    event.currentTarget.style.borderColor = '#efedf4'
                  }}
                >
                  <span
                    style={{
                      minWidth: 0,
                      color: '#25212c',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {job.job_title}
                  </span>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexShrink: 0,
                      color: '#635bff',
                      fontSize: '11px',
                      fontWeight: 800,
                    }}
                  >
                    {Number(job.skill_gap_score || 0).toFixed(0)}% skill readiness
                    <ArrowUpRight size={13} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* =================================================
            APPLICATIONS + SKILLS
           ================================================= */}

        <section className="hs-lower-grid">

          <div className="hs-panel">

            <div className="hs-panel-header">

              <div>
                <div className="hs-section-label">
                  <FileText size={13} />
                  Applications
                </div>

                <h2>
                  Recent activity
                </h2>
              </div>

              <button
                type="button"
                className="hs-text-button"
                onClick={() => navigate('/candidate/applications')}
              >
                View all
                <ChevronRight size={14} />
              </button>

            </div>


            {applications.length > 0 ? (

              <div className="hs-application-list">

                {applications.map((application) => (

                  <div
                    className="hs-application-row"
                    key={application.application_id}
                  >

                    <div className="hs-application-company">
                      <div className="hs-small-avatar">
                        <BriefcaseBusiness size={15} />
                      </div>

                      <div>
                        <strong>
                          {application.job_title}
                        </strong>

                        <span>
                          {application.company_name || 'Company'}
                          {' • '}
                          {application.location || 'Remote'}
                        </span>
                      </div>
                    </div>


                    <div className="hs-application-right">

                      <span
                        className={`hs-status hs-status-${application.status}`}
                      >
                        {formatApplicationStatus(application.status)}
                      </span>

                    </div>

                  </div>

                ))}

              </div>

            ) : (

              <div className="hs-empty-inline">
                No applications yet.
              </div>

            )}

          </div>


          <div className="hs-panel">

            <div className="hs-panel-header">

              <div>
                <div className="hs-section-label">
                  <Target size={13} />
                  Skill Profile
                </div>

                <h2>
                  Your skills
                </h2>
              </div>

            </div>


            {skills.length > 0 ? (

              <div className="hs-skill-grid">

                {skills.map((skill) => (

                  <div
                    className="hs-skill-item"
                    key={skill.skill_id}
                  >

                    <div className="hs-skill-name">
                      <strong>
                        {skill.skill_name}
                      </strong>

                      {skill.source && (
                        <span>
                          {skill.source}
                        </span>
                      )}
                    </div>

                    {skill.proficiency !== null &&
                      skill.proficiency !== undefined ? (

                      <div className="hs-skill-level">

                        <div className="hs-skill-track">
                          <div
                            style={{
                              width: `${skill.proficiency}%`,
                            }}
                          />
                        </div>

                        <span>
                          {Math.round(skill.proficiency)}%
                        </span>

                      </div>

                    ) : (

                      <span className="hs-detected">
                        Detected
                      </span>

                    )}

                  </div>

                ))}

              </div>

            ) : (

              <div className="hs-empty-inline">
                No skills found.
              </div>

            )}

          </div>

        </section>

      </div>
    </AppShell>
  )
}


/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function formatApplicationStatus(status) {
  const labels = {
    applied: 'Applied',
    shortlisted: 'Shortlisted',
    interview: 'Interview',
    rejected: 'Rejected',
    selected: 'Selected',
  }

  return labels[status] || String(status || 'Applied')
}


function SkillGapGroup({
  title,
  description,
  items,
  tone,
  isPriority = false,
}) {
  const tones = {
    green: {
      background: '#f1fbf5',
      border: '#dff2e6',
      accent: '#27865b',
    },
    amber: {
      background: '#fff9eb',
      border: '#f5e8bf',
      accent: '#a26b00',
    },
    purple: {
      background: '#f8f6ff',
      border: '#e9e4fb',
      accent: '#6557ba',
    },
  }

  const palette = tones[tone]
  const visibleItems = items.slice(0, 5)

  return (
    <div
      style={{
        padding: '14px',
        borderRadius: '12px',
        background: palette.background,
        border: `1px solid ${palette.border}`,
        minHeight: '108px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <strong
          style={{
            color: palette.accent,
            fontSize: '13px',
          }}
        >
          {title}
        </strong>

        {isPriority && items.length > 0 && (
          <span
            style={{
              color: palette.accent,
              fontSize: '9px',
              fontWeight: 800,
            }}
          >
            ACTIONABLE
          </span>
        )}
      </div>

      <p
        style={{
          margin: '3px 0 8px',
          color: '#77727f',
          fontSize: '10px',
          lineHeight: 1.4,
        }}
      >
        {description}
      </p>

      {visibleItems.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '5px',
          }}
        >
          {visibleItems.map((item) => {
            const label = typeof item === 'string'
              ? item
              : item.skill

            return (
              <span
                key={label}
                style={{
                  padding: '4px 7px',
                  borderRadius: '7px',
                  background: '#ffffff',
                  border: `1px solid ${palette.border}`,
                  color: '#403b4a',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                {label}
              </span>
            )
          })}
        </div>
      ) : (
        <span
          style={{
            color: '#77727f',
            fontSize: '10px',
          }}
        >
          {isPriority
            ? 'No high-priority skill gaps across your strongest matches.'
            : 'No items in this category yet.'}
        </span>
      )}
    </div>
  )
}


function MatchMetric({ label, value }) {
  const safeValue = Number.isFinite(Number(value))
    ? Number(value)
    : 0

  return (
    <div className="hs-match-metric">

      <div className="hs-metric-top">
        <span>{label}</span>
        <strong>{safeValue.toFixed(0)}%</strong>
      </div>

      <div className="hs-metric-track">
        <div
          style={{
            width: `${Math.min(Math.max(safeValue, 0), 100)}%`,
          }}
        />
      </div>

    </div>
  )
}


function ProfileItem({
  icon,
  label,
  complete,
}) {
  return (
    <div className="hs-profile-item">

      <div className="hs-profile-item-icon">
        {icon}
      </div>

      <span>{label}</span>

      {complete && (
        <CheckCircle2
          size={15}
          className="hs-profile-check"
        />
      )}

    </div>
  )
}


export default CandidateDashboardPage
