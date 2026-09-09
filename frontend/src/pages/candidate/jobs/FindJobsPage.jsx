import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Target,
  Zap,
} from 'lucide-react'

import AppShell from '../../../components/layout/AppShell'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../services/api'

function FindJobsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [jobs, setJobs] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true)
        setError('')

        const [jobsResponse, recommendationResponse] =
          await Promise.all([
            api.get('/jobs/'),
            api.get('/recommendations/jobs'),
          ])

        setJobs(
          Array.isArray(jobsResponse.data)
            ? jobsResponse.data
            : []
        )

        const recommendationData =
          recommendationResponse.data

        setRecommendations(
          Array.isArray(recommendationData?.recommendations)
            ? recommendationData.recommendations
            : []
        )
      } catch (err) {
        console.error(err)
        setError(
          'Unable to load opportunities right now.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [])

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return jobs

    return jobs.filter((job) => {
      return (
        job.title?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query) ||
        job.employment_type
          ?.toLowerCase()
          .includes(query) ||
        job.experience_level
          ?.toLowerCase()
          .includes(query)
      )
    })
  }, [jobs, search])

  const recommendedJob = recommendations[0]

  const getJobById = (jobId) => {
    return jobs.find((job) => job.id === jobId)
  }

  const openJob = (jobId) => {
    navigate(`/candidate/jobs/${jobId}`)
  }

  if (loading) {
    return (
      <AppShell
        role="candidate"
        userName={user?.name || 'User'}
      >
        <div className="hs-find-page">
          <div className="hs-loading-state">
            <Sparkles size={22} />
            <span>
              Finding opportunities for you...
            </span>
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
      <div className="hs-find-page">

        {/* =====================================================
            INTRO
           ===================================================== */}

        <section className="hs-find-hero">

          <div className="hs-find-intro">

            <div className="hs-eyebrow">
              <span className="hs-eyebrow-icon">
                <Sparkles size={14} />
              </span>

              Opportunity Finder
            </div>

            <h1>
              Find work that
              <span> fits you.</span>
            </h1>

            <p>
              HireSense looks at your skills, education and
              experience to help you discover opportunities
              worth exploring.
            </p>

          </div>

          <div className="hs-opportunity-count">

            <div className="hs-count-icon">
              <BriefcaseBusiness size={18} />
            </div>

            <div>
              <strong>{jobs.length}</strong>
              <span>open opportunities</span>
            </div>

          </div>

        </section>


        {/* =====================================================
            SEARCH
           ===================================================== */}

        <section className="hs-job-toolbar">

          <div className="hs-job-search">

            <Search size={19} />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search roles, skills or locations..."
            />

            {search && (
              <span className="hs-search-result-label">
                {filteredJobs.length}
              </span>
            )}

          </div>

          <button
            className="hs-filter-button"
            type="button"
          >
            <SlidersHorizontal size={18} />
            Filters
          </button>

        </section>


        {/* =====================================================
            ERROR
           ===================================================== */}

        {error && (
          <div className="hs-error-message">
            {error}
          </div>
        )}


        {/* =====================================================
            RECOMMENDED
           ===================================================== */}

        {!search && recommendedJob && (
          <section className="hs-recommended-section">

            <div className="hs-section-heading">

              <div>
                <span className="hs-section-kicker">
                  PICKED FOR YOU
                </span>

                <h2>
                  Your strongest match
                </h2>

                <p>
                  Based on your current HireSense profile.
                </p>
              </div>

              <div className="hs-powered-badge">
                <Zap size={14} />
                Smart match
              </div>

            </div>


            <article className="hs-featured-job">

              {/* Decorative background */}

              <div className="hs-featured-decoration hs-decoration-one" />
              <div className="hs-featured-decoration hs-decoration-two" />


              {/* Top */}

              <div className="hs-featured-top">

                <div className="hs-featured-label">
                  <span className="hs-featured-label-icon">
                    <Sparkles size={14} />
                  </span>

                  Best match for your profile
                </div>

                <div className="hs-featured-score-wrap">

                  <div
                    className="hs-score-ring"
                    style={{
                      '--score':
                        `${Math.round(
                          recommendedJob.match_score
                        ) * 3.6}deg`,
                    }}
                  >
                    <div className="hs-score-ring-inner">
                      <strong>
                        {Math.round(
                          recommendedJob.match_score
                        )}
                      </strong>

                      <span>%</span>
                    </div>
                  </div>

                  <div className="hs-score-copy">
                    <strong>Great fit</strong>
                    <span>profile match</span>
                  </div>

                </div>

              </div>


              {/* Main */}

              <div className="hs-featured-content">

                <div className="hs-company-mark">
                  <BriefcaseBusiness size={25} />
                </div>

                <div className="hs-featured-info">

                  <h3>
                    {recommendedJob.job_title}
                  </h3>

                  <div className="hs-company">
                    Company #{recommendedJob.company_id}
                  </div>


                  <div className="hs-featured-meta">

                    {recommendedJob.location && (
                      <span className="hs-meta-location">
                        <MapPin size={15} />
                        {recommendedJob.location}
                      </span>
                    )}

                    {recommendedJob.employment_type && (
                      <span className="hs-meta-type">
                        <BriefcaseBusiness size={15} />
                        {recommendedJob.employment_type}
                      </span>
                    )}

                    {recommendedJob.candidate_experience_years !==
                      undefined && (
                      <span className="hs-meta-experience">
                        <Clock3 size={15} />

                        {getJobById(
                          recommendedJob.job_id
                        )?.experience_min ?? 0}

                        {'–'}

                        {getJobById(
                          recommendedJob.job_id
                        )?.experience_max ?? 0}

                        {' yrs'}
                      </span>
                    )}

                  </div>


                  {/* Eligibility */}

                  <div
                    className={
                      recommendedJob.eligible
                        ? 'hs-featured-eligibility eligible'
                        : 'hs-featured-eligibility not-eligible'
                    }
                  >

                    <CheckCircle2 size={17} />

                    <div>
                      <strong>
                        {recommendedJob.eligible
                          ? 'You meet the requirements'
                          : 'Eligibility needs review'}
                      </strong>

                      <span>
                        {recommendedJob.eligible
                          ? 'Your current profile is eligible for this opportunity.'
                          : 'Check the role requirements before applying.'}
                      </span>
                    </div>

                  </div>


                  {/* Skills */}

                  {recommendedJob.matched_skills?.length > 0 && (
                    <div className="hs-skill-area">

                      <span className="hs-skill-label">
                        Your matching skills
                      </span>

                      <div className="hs-skill-row">

                        {recommendedJob.matched_skills
                          .slice(0, 5)
                          .map((skill) => (
                            <span
                              className="hs-skill-chip"
                              key={skill}
                            >
                              {skill}
                            </span>
                          ))}

                      </div>

                    </div>
                  )}

                </div>

              </div>


              {/* Footer */}

              <div className="hs-featured-footer">

                <div className="hs-featured-note">

                  <span className="hs-note-icon">
                    <Target size={15} />
                  </span>

                  <span>
                    Matched across skills, experience
                    and education
                  </span>

                </div>

                <button
                  className="hs-primary-action"
                  onClick={() =>
                    openJob(recommendedJob.job_id)
                  }
                >
                  View opportunity
                  <ArrowRight size={17} />
                </button>

              </div>

            </article>

          </section>
        )}


        {/* =====================================================
            ALL JOBS
           ===================================================== */}

        <section className="hs-all-jobs">

          <div className="hs-section-heading hs-all-heading">

            <div>

              <span className="hs-section-kicker">
                {search
                  ? 'SEARCH RESULTS'
                  : 'EXPLORE'}
              </span>

              <h2>
                {search
                  ? 'Matching opportunities'
                  : 'All open roles'}
              </h2>

              <p>
                {filteredJobs.length}{' '}
                {filteredJobs.length === 1
                  ? 'role'
                  : 'roles'}{' '}
                available
              </p>

            </div>

          </div>


          {filteredJobs.length === 0 ? (

            <div className="hs-empty-jobs">

              <div className="hs-empty-icon">
                <Search size={23} />
              </div>

              <h3>
                No matching roles
              </h3>

              <p>
                Try another role, skill, or location.
              </p>

            </div>

          ) : (

            <div className="hs-job-list">

              {filteredJobs.map((job) => {

                const recommendation =
                  recommendations.find(
                    (item) => item.job_id === job.id
                  )

                return (
                  <article
                    className="hs-job-card"
                    key={job.id}
                  >

                    {/* Colored accent */}

                    <div
                      className={`hs-job-accent ${
                        recommendation?.eligible
                          ? 'mint'
                          : recommendation
                            ? 'peach'
                            : 'blue'
                      }`}
                    />


                    <div className="hs-job-card-main">

                      <div
                        className={`hs-job-icon ${
                          recommendation?.eligible
                            ? 'icon-mint'
                            : recommendation
                              ? 'icon-peach'
                              : 'icon-blue'
                        }`}
                      >
                        <BriefcaseBusiness size={21} />
                      </div>


                      <div className="hs-job-info">

                        <div className="hs-job-title-row">

                          <div>

                            <h3>
                              {job.title}
                            </h3>

                            <div className="hs-company">
                              Company #{job.company_id}
                            </div>

                          </div>


                          {recommendation && (
                            <div className="hs-match-badge">

                              <Target size={12} />

                              <strong>
                                {Math.round(
                                  recommendation.match_score
                                )}%
                              </strong>

                              <span>
                                match
                              </span>

                            </div>
                          )}

                        </div>


                        {job.description && (
                          <p className="hs-job-description">
                            {job.description}
                          </p>
                        )}


                        <div className="hs-job-meta">

                          {job.location && (
                            <span className="meta-blue">
                              <MapPin size={14} />
                              {job.location}
                            </span>
                          )}

                          {job.employment_type && (
                            <span className="meta-purple">
                              <BriefcaseBusiness size={14} />
                              {job.employment_type}
                            </span>
                          )}

                          {job.experience_level && (
                            <span className="meta-yellow">
                              <GraduationCap size={14} />
                              {job.experience_level}
                            </span>
                          )}

                          {(job.experience_min !== null ||
                            job.experience_max !== null) && (
                            <span className="meta-peach">
                              <Clock3 size={14} />

                              {job.experience_min ?? 0}
                              {'–'}
                              {job.experience_max ?? 0}
                              {' yrs'}
                            </span>
                          )}

                        </div>

                      </div>

                    </div>


                    {/* Footer */}

                    <div className="hs-job-card-footer">

                      <div>

                        {recommendation ? (

                          <div
                            className={
                              recommendation.eligible
                                ? 'hs-eligibility eligible'
                                : 'hs-eligibility not-eligible'
                            }
                          >

                            <CheckCircle2 size={15} />

                            {recommendation.eligible
                              ? 'Eligible for this role'
                              : 'Eligibility needs review'}

                          </div>

                        ) : (

                          <span className="hs-job-open-label">
                            Open opportunity
                          </span>

                        )}

                      </div>


                      <button
                        className="hs-secondary-action"
                        onClick={() =>
                          openJob(job.id)
                        }
                      >
                        View details
                        <ArrowRight size={16} />
                      </button>

                    </div>

                  </article>
                )
              })}

            </div>
          )}

        </section>

      </div>
    </AppShell>
  )
}

export default FindJobsPage