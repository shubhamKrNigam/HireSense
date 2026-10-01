import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
} from 'lucide-react'

import AppShell from '../../../components/layout/AppShell'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../services/api'

function FindJobsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading, isAuthenticated } = useAuth()

  const [jobs, setJobs] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [skills, setSkills] = useState([])
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setSearch(searchParams.get('search') || '')
  }, [searchParams])

  useEffect(() => {
    if (authLoading || !isAuthenticated) return

    async function loadJobs() {
      try {
        setLoading(true)
        setError('')

        const [jobsResponse, skillsResponse] = await Promise.all([
          api.get('/jobs/'),
          api.get('/skills/'),
        ])

        setSkills(
          Array.isArray(skillsResponse.data)
            ? skillsResponse.data
            : []
        )

        let recommendationData = null

        try {
          const response = await api.get(
            '/matching/candidate/jobs/recommended'
          )
          recommendationData = response.data
        } catch (recommendationError) {
          console.error(
            'Recommendation ranking unavailable:',
            recommendationError
          )

          // Backward-compatible fallback for environments where the
          // newer candidate ranking endpoint is not available yet.
          try {
            const fallbackResponse = await api.get(
              '/recommendations/jobs'
            )
            recommendationData = fallbackResponse.data
          } catch (fallbackError) {
            console.error(
              'Legacy recommendation endpoint unavailable:',
              fallbackError
            )
          }
        }

        setJobs(
          Array.isArray(jobsResponse.data)
            ? jobsResponse.data
            : []
        )

        const rankedJobs = Array.isArray(
          recommendationData?.rankings
        )
          ? recommendationData.rankings
          : Array.isArray(
                recommendationData?.recommendations
              )
            ? recommendationData.recommendations
            : []

        setRecommendations(rankedJobs)
      } catch (err) {
        console.error(err)
        setError(
          err.response?.data?.detail ||
            'Unable to load opportunities right now.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [authLoading, isAuthenticated])

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return jobs

    return jobs.filter((job) => {
      return (
        job.title?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query) ||
        job.work_mode?.toLowerCase().includes(query) ||
        job.employment_type?.toLowerCase().includes(query) ||
        job.experience_level?.toLowerCase().includes(query)
      )
    })
  }, [jobs, search])

  const getSkillName = (skillId) => {
    const skill = skills.find((item) => item.id === skillId)
    return skill?.name || `Skill #${skillId}`
  }

  const getRecommendationScore = (recommendation) => {
    if (!recommendation) return null

    const score =
      recommendation.recommendation_score ??
      recommendation.match_score

    return score == null ? null : Number(score)
  }

  const getProfileFitScore = (recommendation) => {
    if (!recommendation) return null

    const score =
      recommendation.profile_fit_score ??
      recommendation.match_score

    return score == null ? null : Number(score)
  }

  const getPreferenceFitScore = (recommendation) => {
    if (!recommendation) return null

    const score = recommendation.preference_fit_score

    return score == null ? null : Number(score)
  }

  const recommendedJob =
    recommendations.find((item) => item.eligible) ||
    recommendations[0] ||
    null

  const getRecommendationById = (jobId) => {
    return recommendations.find(
      (item) => item.job_id === jobId
    )
  }

  const getJobById = (jobId) => {
    return jobs.find((job) => job.id === jobId)
  }

  const openJob = (jobId) => {
    navigate(`/candidate/jobs/${jobId}`)
  }

  if (authLoading) {
    return (
      <AppShell role="candidate" userName={user?.name || 'User'}>
        <div className="hs-find-page">
          <div className="hs-loading-state">
            <Sparkles size={22} />
            <span>Loading your opportunities...</span>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!isAuthenticated) return null

  if (loading) {
    return (
      <AppShell role="candidate" userName={user?.name || 'User'}>
        <div className="hs-find-page">
          <div className="hs-loading-state">
            <Sparkles size={22} />
            <span>Finding opportunities for you...</span>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell role="candidate" userName={user?.name || 'User'}>
      <div className="hs-find-page">

      {/* Header */}
      <section className="hs-find-hero">
        <div>
          <div className="hs-eyebrow">
            <Sparkles size={16} />
            Opportunity Finder
          </div>

          <h1>Find your next opportunity</h1>

          <p>
            Discover roles that fit your skills, education, and experience.
          </p>
        </div>

        <div className="hs-opportunity-count">
          <BriefcaseBusiness size={19} />
          <span>{jobs.length} opportunities</span>
        </div>
      </section>

      {/* Search */}
      <section className="hs-job-toolbar">
        <div className="hs-job-search">
          <Search size={19} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by role, skill, location..."
          />
        </div>

        <div
          className="hs-filter-button"
          aria-label="Filters are planned for a future release"
          title="Advanced filters are planned for a future release"
        >
          <SlidersHorizontal size={18} />
          Filters
        </div>
      </section>

      {error && (
        <div className="hs-error-message">
          {error}
        </div>
      )}

      {/* Recommended */}
      {!search && recommendedJob && (
        <section className="hs-recommended-section">

          <div className="hs-section-heading">
            <div>
              <span className="hs-section-kicker">
                PICKED FOR YOU
              </span>
              <h2>Recommended for you</h2>
              <p>
                Ranked using your profile fit, preferences, and eligibility.
              </p>
            </div>
          </div>

          <article className="hs-featured-job">

            <div className="hs-featured-top">
              <div className="hs-featured-label">
                <Sparkles size={15} />
                {recommendedJob.eligible
                  ? 'Best recommendation for you'
                  : 'Best available profile match'}
              </div>

              <div className="hs-featured-score">
                {Math.round(
                  getRecommendationScore(recommendedJob) || 0
                )}
                %
                <span>recommendation</span>
              </div>
            </div>

            <div className="hs-featured-content">

              <div className="hs-company-mark">
                <BriefcaseBusiness size={23} />
              </div>

              <div className="hs-featured-info">

                <h3>{recommendedJob.job_title}</h3>

                <div className="hs-company">
                  {recommendedJob.company_name ||
                    `Company #${recommendedJob.company_id}`}
                </div>

                <div className="hs-featured-meta">

                  {recommendedJob.location && (
                    <span>
                      <MapPin size={16} />
                      {recommendedJob.location}
                    </span>
                  )}

                  {recommendedJob.work_mode && (
                    <span>
                      <BriefcaseBusiness size={16} />
                      {recommendedJob.work_mode}
                    </span>
                  )}

                  {recommendedJob.employment_type && (
                    <span>
                      <BriefcaseBusiness size={16} />
                      {recommendedJob.employment_type}
                    </span>
                  )}

                  {getJobById(recommendedJob.job_id) && (
                    <span>
                      <Clock3 size={16} />
                      {getJobById(recommendedJob.job_id)?.experience_min ?? 0}
                      {'–'}
                      {getJobById(recommendedJob.job_id)?.experience_max ?? 0}
                      {' yrs'}
                    </span>
                  )}
                </div>

                <div className="hs-match-summary">
                  <CheckCircle2 size={17} />
                  <span>
                    {recommendedJob.eligible
                      ? 'You meet the current eligibility requirements for this role.'
                      : 'This role is not currently eligible for you. Review the eligibility requirements before applying.'}
                  </span>
                </div>

                {recommendedJob.preference_reasons?.length > 0 && (
                  <div
                    className="hs-match-summary"
                    style={{ marginTop: '8px' }}
                  >
                    <Sparkles size={17} />
                    <span>
                      {recommendedJob.preference_reasons
                        .slice(0, 2)
                        .join(' • ')}
                    </span>
                  </div>
                )}

                {recommendedJob.matched_skills?.length > 0 && (
                  <div className="hs-skill-row">
                    {recommendedJob.matched_skills
                      .slice(0, 4)
                      .map((skill) => (
                        <span
                          className="hs-skill-chip"
                          key={skill}
                        >
                          {getSkillName(skill)}
                        </span>
                      ))}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginTop: '10px',
                  }}
                >
                  <span className="hs-skill-chip">
                    Profile fit{' '}
                    {Math.round(
                      getProfileFitScore(recommendedJob) || 0
                    )}
                    %
                  </span>

                  {getPreferenceFitScore(recommendedJob) !== null && (
                    <span className="hs-skill-chip">
                      Preference fit{' '}
                      {Math.round(
                        getPreferenceFitScore(recommendedJob)
                      )}
                      %
                    </span>
                  )}
                </div>

              </div>
            </div>

            <div className="hs-featured-footer">

              <div className="hs-featured-note">
                <GraduationCap size={17} />
                <span>
                  Recommendation combines suitability, preferences, and eligibility
                </span>
              </div>

              <button
                className="hs-primary-action"
                type="button"
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

      {/* All jobs */}
      <section className="hs-all-jobs">

        <div className="hs-section-heading hs-all-heading">
          <div>
            <span className="hs-section-kicker">
              {search ? 'SEARCH RESULTS' : 'EXPLORE'}
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
            <Search size={24} />
            <h3>No matching roles</h3>
            <p>
              Try another role, skill, or location.
            </p>
          </div>
        ) : (
          <div className="hs-job-list">

            {filteredJobs.map((job) => {
              const recommendation =
                getRecommendationById(job.id)

              const recommendationScore =
                getRecommendationScore(recommendation)

              return (
                <article
                  className="hs-job-card"
                  key={job.id}
                >

                  <div className="hs-job-card-main">

                    <div className="hs-job-icon">
                      <BriefcaseBusiness size={21} />
                    </div>

                    <div className="hs-job-info">

                      <div className="hs-job-title-row">

                        <div>
                          <h3>{job.title}</h3>

                          <div className="hs-company">
                            {recommendation?.company_name ||
                              `Company #${job.company_id}`}
                          </div>
                        </div>

                        {recommendationScore !== null && (
                          <div className="hs-match-badge">
                            {Math.round(
                              recommendationScore
                            )}
                            <span>
                              recommendation
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
                          <span>
                            <MapPin size={15} />
                            {job.location}
                          </span>
                        )}

                        {job.work_mode && (
                          <span>
                            <BriefcaseBusiness size={15} />
                            {job.work_mode}
                          </span>
                        )}

                        {job.employment_type && (
                          <span>
                            <BriefcaseBusiness size={15} />
                            {job.employment_type}
                          </span>
                        )}

                        {job.experience_level && (
                          <span>
                            <GraduationCap size={15} />
                            {job.experience_level}
                          </span>
                        )}

                        {(job.experience_min !== null ||
                          job.experience_max !== null) && (
                          <span>
                            <Clock3 size={15} />
                            {job.experience_min ?? 0}
                            {'–'}
                            {job.experience_max ?? 0}
                            {' yrs'}
                          </span>
                        )}

                      </div>

                    </div>
                  </div>

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
                      type="button"
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
