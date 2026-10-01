import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import AppShell from '../../components/layout/AppShell'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const initialForm = {
  title: '',
  description: '',
  location: '',
  employment_type: '',
  experience_min: '',
  experience_max: '',
  experience_level: '',
  salary_min: '',
  salary_max: '',
  application_url: '',
  minimum_degree: '',
  required_field_of_study: '',
  minimum_grade: '',
}

function RecruiterJobsPage() {
  const {
    user,
    loading: authLoading,
    isAuthenticated,
  } = useAuth()

  const [jobs, setJobs] = useState([])
  const [company, setCompany] = useState(null)

  // Live hiring intelligence is derived from the existing recruiter
  // application/matching endpoint. No second matching system is created.
  const [jobIntelligence, setJobIntelligence] = useState({})
  const [intelligenceLoading, setIntelligenceLoading] = useState(false)

  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [companyLoading, setCompanyLoading] = useState(true)

  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingJobId, setEditingJobId] = useState(null)

  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  const [skills, setSkills] = useState([])
  const [jobSkills, setJobSkills] = useState([])
  const [skillSearch, setSkillSearch] = useState('')
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [jobSkillsLoading, setJobSkillsLoading] = useState(false)
  const [jobSkillsSaving, setJobSkillsSaving] = useState(false)

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return
    }

    async function loadData() {
      try {
        setLoading(true)
        setCompanyLoading(true)
        setError('')

        const [jobsResponse, companyResponse] =
          await Promise.all([
            api.get('/jobs/recruiter/my-jobs'),
            api.get('/companies/my-company'),
          ])

        setJobs(jobsResponse.data)
        setCompany(companyResponse.data)
      } catch (err) {
        console.error(err)

        setError(
          err.response?.data?.detail ||
          'Unable to load recruiter data.'
        )
      } finally {
        setLoading(false)
        setCompanyLoading(false)
      }
    }

    loadData()
  }, [authLoading, isAuthenticated])

  useEffect(() => {
    if (authLoading || !isAuthenticated || jobs.length === 0) {
      return
    }

    async function loadJobIntelligence() {
      try {
        setIntelligenceLoading(true)

        const results = await Promise.all(
          jobs.map(async (job) => {
            try {
              const response = await api.get(`/applications/job/${job.id}`)
              const applications = response.data || []

              const scores = applications
                .map((application) => Number(application.match_score))
                .filter((score) => Number.isFinite(score))

              const eligible = applications.filter(
                (application) => application.eligibility === true
              ).length

              const strongMatches = scores.filter((score) => score >= 80).length

              const averageScore = scores.length
                ? Math.round(
                    scores.reduce((sum, score) => sum + score, 0) / scores.length
                  )
                : null

              return [job.id, {
                applicants: applications.length,
                eligible,
                strongMatches,
                averageScore,
              }]
            } catch (err) {
              console.error(`Failed to load intelligence for job ${job.id}:`, err)
              return [job.id, {
                applicants: 0,
                eligible: 0,
                strongMatches: 0,
                averageScore: null,
              }]
            }
          })
        )

        setJobIntelligence(Object.fromEntries(results))
      } finally {
        setIntelligenceLoading(false)
      }
    }

    loadJobIntelligence()
  }, [authLoading, isAuthenticated, jobs])

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return
    }

    async function loadSkills() {
      try {
        setSkillsLoading(true)

        const response = await api.get('/skills/')
        setSkills(response.data)
      } catch (err) {
        console.error(err)
        setError(
          err.response?.data?.detail ||
          'Unable to load available skills.'
        )
      } finally {
        setSkillsLoading(false)
      }
    }

    loadSkills()
  }, [authLoading, isAuthenticated])

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const openCreateModal = () => {
    setEditingJobId(null)
    setForm(initialForm)
    setJobSkills([])
    setSkillSearch('')
    setJobSkillsLoading(false)
    setFormError('')
    setError('')
    setIsModalOpen(true)
  }

  const openEditModal = async (job) => {
    setEditingJobId(job.id)

    setForm({
      title: job.title || '',
      description: job.description || '',
      location: job.location || '',
      employment_type: job.employment_type || '',
      experience_min:
        job.experience_min != null
          ? String(job.experience_min)
          : '',
      experience_max:
        job.experience_max != null
          ? String(job.experience_max)
          : '',
      experience_level:
        job.experience_level || '',
      salary_min:
        job.salary_min != null
          ? String(job.salary_min)
          : '',
      salary_max:
        job.salary_max != null
          ? String(job.salary_max)
          : '',
      application_url:
        job.application_url || '',
      minimum_degree:
        job.minimum_degree || '',
      required_field_of_study:
        job.required_field_of_study || '',
      minimum_grade:
        job.minimum_grade != null
          ? String(job.minimum_grade)
          : '',
    })

    setJobSkills([])
    setSkillSearch('')
    setFormError('')
    setError('')
    setIsModalOpen(true)

    try {
      setJobSkillsLoading(true)

      const response = await api.get(
        `/job-skills/job/${job.id}`
      )

      const mappedSkills = response.data.map((mapping) => {
        const skill = skills.find(
          (item) => item.id === mapping.skill_id
        )

        return {
          mapping_id: mapping.id,
          skill_id: mapping.skill_id,
          name: skill?.name || `Skill #${mapping.skill_id}`,
          category: skill?.category || '',
          importance: mapping.importance ?? 1,
          required: Boolean(mapping.required),
        }
      })

      setJobSkills(mappedSkills)
    } catch (err) {
      console.error(err)
      setFormError(
        err.response?.data?.detail ||
        'Unable to load skills for this job.'
      )
    } finally {
      setJobSkillsLoading(false)
    }
  }

  const closeModal = () => {
    if (saving) {
      return
    }

    setIsModalOpen(false)
    setEditingJobId(null)
    setForm(initialForm)
    setJobSkills([])
    setSkillSearch('')
    setFormError('')
  }

  const buildPayload = () => {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim() || null,
      employment_type:
        form.employment_type.trim() || null,
      experience_level:
        form.experience_level.trim() || null,
      application_url:
        form.application_url.trim() || null,
      minimum_degree:
        form.minimum_degree.trim() || null,
      required_field_of_study:
        form.required_field_of_study.trim() || null,
    }

    if (form.experience_min !== '') {
      payload.experience_min =
        Number(form.experience_min)
    }

    if (form.experience_max !== '') {
      payload.experience_max =
        Number(form.experience_max)
    }

    if (form.salary_min !== '') {
      payload.salary_min =
        Number(form.salary_min)
    }

    if (form.salary_max !== '') {
      payload.salary_max =
        Number(form.salary_max)
    }

    if (form.minimum_grade !== '') {
      payload.minimum_grade =
        Number(form.minimum_grade)
    }

    return payload
  }

  const validateForm = () => {
    if (!form.title.trim()) {
      return 'Job title is required.'
    }

    if (form.title.trim().length < 2) {
      return 'Job title must be at least 2 characters.'
    }

    if (!form.description.trim()) {
      return 'Job description is required.'
    }

    if (form.description.trim().length < 10) {
      return 'Job description must be at least 10 characters.'
    }

    if (
      form.experience_min !== '' &&
      Number(form.experience_min) < 0
    ) {
      return 'Minimum experience cannot be negative.'
    }

    if (
      form.experience_max !== '' &&
      Number(form.experience_max) < 0
    ) {
      return 'Maximum experience cannot be negative.'
    }

    if (
      form.experience_min !== '' &&
      form.experience_max !== '' &&
      Number(form.experience_max) <
        Number(form.experience_min)
    ) {
      return 'Maximum experience cannot be less than minimum experience.'
    }

    if (
      form.salary_min !== '' &&
      Number(form.salary_min) < 0
    ) {
      return 'Minimum salary cannot be negative.'
    }

    if (
      form.salary_max !== '' &&
      Number(form.salary_max) < 0
    ) {
      return 'Maximum salary cannot be negative.'
    }

    if (
      form.salary_min !== '' &&
      form.salary_max !== '' &&
      Number(form.salary_max) <
        Number(form.salary_min)
    ) {
      return 'Maximum salary cannot be less than minimum salary.'
    }

    if (
      form.minimum_grade !== '' &&
      Number(form.minimum_grade) < 0
    ) {
      return 'Minimum grade cannot be negative.'
    }

    return ''
  }

  const addSkillToJob = (skill) => {
    const alreadyAdded = jobSkills.some(
      (item) => item.skill_id === skill.id
    )

    if (alreadyAdded) {
      setFormError(`${skill.name} is already added to this job.`)
      return
    }

    setJobSkills((current) => [
      ...current,
      {
        mapping_id: null,
        skill_id: skill.id,
        name: skill.name,
        category: skill.category || '',
        importance: 1,
        required: true,
      },
    ])

    setSkillSearch('')
    setFormError('')
  }

  const removeSkillFromJob = (skillId) => {
    setJobSkills((current) =>
      current.filter((item) => item.skill_id !== skillId)
    )
  }

  const updateJobSkillField = (skillId, field, value) => {
    setJobSkills((current) =>
      current.map((item) =>
        item.skill_id === skillId
          ? {
              ...item,
              [field]:
                field === 'importance'
                  ? Number(value)
                  : value,
            }
          : item
      )
    )
  }

  const saveJobSkills = async (jobId, previousSkills) => {
    setJobSkillsSaving(true)

    try {
      const previousById = new Map(
        previousSkills.map((item) => [
          item.skill_id,
          item,
        ])
      )

      const selectedById = new Map(
        jobSkills.map((item) => [
          item.skill_id,
          item,
        ])
      )

      const deleteRequests = previousSkills
        .filter(
          (item) => !selectedById.has(item.skill_id)
        )
        .map((item) =>
          api.delete(`/job-skills/${item.mapping_id}`)
        )

      const updateRequests = previousSkills
        .filter((item) => selectedById.has(item.skill_id))
        .map((item) => {
          const selected = selectedById.get(item.skill_id)

          const changed =
            Number(item.importance ?? 1) !==
              Number(selected.importance ?? 1) ||
            Boolean(item.required) !==
              Boolean(selected.required)

          if (!changed) {
            return null
          }

          return api.put(
            `/job-skills/${item.mapping_id}`,
            {
              skill_id: selected.skill_id,
              importance: Number(selected.importance),
              required: Boolean(selected.required),
            }
          )
        })
        .filter(Boolean)

      const createRequests = jobSkills
        .filter(
          (item) => !previousById.has(item.skill_id)
        )
        .map((item) =>
          api.post('/job-skills/', {
            job_id: jobId,
            skill_id: item.skill_id,
            importance: Number(item.importance),
            required: Boolean(item.required),
          })
        )

      await Promise.all([
        ...deleteRequests,
        ...updateRequests,
        ...createRequests,
      ])
    } finally {
      setJobSkillsSaving(false)
    }
  }

  const getFilteredSkills = () => {
    const query = skillSearch.trim().toLowerCase()

    return skills
      .filter(
        (skill) =>
          !jobSkills.some(
            (item) => item.skill_id === skill.id
          )
      )
      .filter((skill) => {
        if (!query) {
          return true
        }

        return (
          skill.name.toLowerCase().includes(query) ||
          (skill.category || '')
            .toLowerCase()
            .includes(query)
        )
      })
      .slice(0, 12)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setFormError(validationError)
      return
    }

    if (!company?.id) {
      setFormError(
        'No company is associated with this recruiter.'
      )
      return
    }

    try {
      setSaving(true)
      setFormError('')
      setError('')

      const payload = buildPayload()
      const previousSkills = [...jobSkills]
      let savedJob

      if (editingJobId) {
        const response = await api.put(
          `/jobs/${editingJobId}`,
          payload
        )

        savedJob = response.data

        setJobs((currentJobs) =>
          currentJobs.map((job) =>
            job.id === editingJobId
              ? response.data
              : job
          )
        )
      } else {
        const response = await api.post('/jobs/', {
          ...payload,
          company_id: company.id,
        })

        savedJob = response.data

        setJobs((currentJobs) => [
          response.data,
          ...currentJobs,
        ])
      }

      await saveJobSkills(
        savedJob.id,
        editingJobId ? previousSkills : []
      )

      setIsModalOpen(false)
      setEditingJobId(null)
      setForm(initialForm)
      setJobSkills([])
      setSkillSearch('')
      setFormError('')
    } catch (err) {
      console.error(err)

      const detail = err.response?.data?.detail

      if (Array.isArray(detail)) {
        setFormError(
          detail
            .map((item) => item.msg)
            .join(', ')
        )
      } else {
        setFormError(
          detail ||
          'Unable to save this job.'
        )
      }
    } finally {
      setSaving(false)
      setJobSkillsSaving(false)
    }
  }

  const handleToggleStatus = async (job) => {
    try {
      setError('')

      const newStatus =
        job.status === 'open'
          ? 'closed'
          : 'open'

      const response = await api.put(
        `/jobs/${job.id}`,
        {
          status: newStatus,
        }
      )

      setJobs((currentJobs) =>
        currentJobs.map((item) =>
          item.id === job.id
            ? response.data
            : item
        )
      )
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
        'Unable to update job status.'
      )
    }
  }

  const handleDelete = async (jobId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this job?'
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      await api.delete(`/jobs/${jobId}`)

      setJobs((currentJobs) =>
        currentJobs.filter(
          (job) => job.id !== jobId
        )
      )
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
        'Unable to delete this job.'
      )
    }
  }

  const formatSalary = (job) => {
    if (
      job.salary_min == null &&
      job.salary_max == null
    ) {
      return 'Salary not specified'
    }

    if (
      job.salary_min != null &&
      job.salary_max != null
    ) {
      return `₹${Number(job.salary_min).toLocaleString('en-IN')} – ₹${Number(
      job.salary_max
    ).toLocaleString('en-IN')}`
    }

    if (job.salary_min != null) {
      return `From ₹${Number(
        job.salary_min
      ).toLocaleString('en-IN')}`
    }

    return `Up to ₹${Number(
      job.salary_max
    ).toLocaleString('en-IN')}`
  }

  if (authLoading) {
    return (
      <AppShell
        role="recruiter"
        userName={user?.name || 'Recruiter'}
      >
        <div
          style={{
            minHeight: '420px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6f6a78',
          }}
        >
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
      <div
        style={{
          width: '100%',
          boxSizing: 'border-box',
          color: '#252525',
        }}
      >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            gap: '20px',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '34px',
                fontWeight: 800,
              }}
            >
              My Jobs
            </h1>

            <p
              style={{
                marginTop: '8px',
                color: '#6f6f6f',
              }}
            >
              Manage the opportunities you have posted.
            </p>

            {company && (
              <p
                style={{
                  marginTop: '5px',
                  color: '#8a7bc2',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                {company.name}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={companyLoading}
            style={{
              border: 'none',
              borderRadius: '12px',
              padding: '12px 20px',
              background: '#7c68c9',
              color: '#ffffff',
              fontWeight: 700,
              cursor: companyLoading
                ? 'not-allowed'
                : 'pointer',
              opacity: companyLoading ? 0.6 : 1,
            }}
          >
            + Create Job
          </button>
        </div>

        {error && (
          <div
            style={{
              marginBottom: '20px',
              padding: '14px 16px',
              borderRadius: '12px',
              background: '#fff0ed',
              color: '#a23a2a',
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div
            style={{
              padding: '40px',
              background: '#ffffff',
              borderRadius: '18px',
              textAlign: 'center',
            }}
          >
            Loading your jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div
            style={{
              padding: '50px',
              background: '#ffffff',
              borderRadius: '18px',
              textAlign: 'center',
            }}
          >
            <h2>No jobs posted yet</h2>

            <p style={{ color: '#777' }}>
              Create your first opportunity to start
              recruiting.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: '18px',
            }}
          >
            {jobs.map((job) => (
              <div
                key={job.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  padding: '24px',
                  boxShadow:
                    '0 8px 25px rgba(40, 30, 70, 0.06)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '20px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '22px',
                      }}
                    >
                      {job.title}
                    </h2>

                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                        marginTop: '12px',
                        color: '#666',
                      }}
                    >
                      <span>
                        {job.location ||
                          'Location not specified'}
                      </span>

                      <span>•</span>

                      <span>
                        {job.employment_type ||
                          'Employment type not specified'}
                      </span>
                    </div>

                    <p
                      style={{
                        marginTop: '12px',
                        color: '#666',
                        lineHeight: 1.6,
                      }}
                    >
                      {job.description}
                    </p>

                    <div
                      style={{
                        marginTop: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {formatSalary(job)}
                    </div>

                    <div
                      style={{
                        marginTop: '20px',
                        padding: '20px 20px 18px',
                        width: '100%',
                        boxSizing: 'border-box',
                        borderRadius: '16px',
                        background: '#faf8ff',
                        border: '1px solid #e7e0f7',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '18px',
                          marginBottom: '18px',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: 800,
                              letterSpacing: '0.09em',
                              color: '#7059b7',
                            }}
                          >
                            HIRING SNAPSHOT
                          </div>
                          <div
                            style={{
                              marginTop: '5px',
                              fontSize: '13px',
                              color: '#666',
                            }}
                          >
                            Live candidate-pool intelligence for this role.
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate('/recruiter/applications')}
                          style={{
                            border: '1px solid #ddd4f3',
                            borderRadius: '10px',
                            background: '#ffffff',
                            color: '#5d4ca5',
                            padding: '9px 13px',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          View applicants →
                        </button>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                          borderTop: '1px solid #e8e2f1',
                          borderBottom: '1px solid #e8e2f1',
                        }}
                      >
                        {[
                          [
                            'Applicants',
                            jobIntelligence[job.id]?.applicants ??
                              (intelligenceLoading ? '—' : 0),
                          ],
                          [
                            'Eligible',
                            jobIntelligence[job.id]?.eligible ??
                              (intelligenceLoading ? '—' : 0),
                          ],
                          [
                            'Strong matches',
                            jobIntelligence[job.id]?.strongMatches ??
                              (intelligenceLoading ? '—' : 0),
                          ],
                          [
                            'Avg. match',
                            jobIntelligence[job.id]?.averageScore != null
                              ? `${jobIntelligence[job.id].averageScore}%`
                              : '—',
                          ],
                        ].map(([label, value], index) => (
                          <div
                            key={label}
                            style={{
                              padding: '14px 18px',
                              borderRight:
                                index < 3 ? '1px solid #e8e2f1' : 'none',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '11px',
                                color: '#777',
                                fontWeight: 700,
                                letterSpacing: '0.01em',
                              }}
                            >
                              {label}
                            </div>
                            <div
                              style={{
                                marginTop: '5px',
                                fontSize: '25px',
                                lineHeight: 1,
                                fontWeight: 800,
                                color: '#24212b',
                              }}
                            >
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>

                      {(() => {
                        const insight = jobIntelligence[job.id]

                        // Keep the intelligence area clean while data is loading.
                        if (!insight) return null

                        if (insight.applicants === 0) {
                          return (
                            <div
                              style={{
                                marginTop: '14px',
                                padding: '11px 13px',
                                borderRadius: '10px',
                                background: '#ffffff',
                                border: '1px solid #ebe6f4',
                                color: '#6a6472',
                                fontSize: '12px',
                                lineHeight: 1.5,
                              }}
                            >
                              <strong style={{ color: '#413b50' }}>
                                No applicants yet.
                              </strong>{' '}
                              Candidate intelligence will appear here as applications are received.
                            </div>
                          )
                        }

                        let message = `Candidate pool: ${insight.applicants} applicant${insight.applicants === 1 ? '' : 's'} received.`

                        if (insight.strongMatches > 0) {
                          message += ` ${insight.strongMatches} strong match${insight.strongMatches === 1 ? '' : 'es'}.`
                        }

                        if (insight.averageScore != null) {
                          message += ` Average match ${insight.averageScore}%.`
                        }

                        return (
                          <div
                            style={{
                              marginTop: '14px',
                              padding: '11px 13px',
                              borderRadius: '10px',
                              background: '#ffffff',
                              border: '1px solid #ebe6f4',
                              color: '#5f5a68',
                              fontSize: '12px',
                              lineHeight: 1.5,
                            }}
                          >
                            <strong style={{ color: '#413b50' }}>
                              Candidate Pool Status:
                            </strong>{' '}
                            {message.replace(/^Candidate pool: /, '')}
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '12px',
                    }}
                  >
                    <span
                      style={{
                        padding: '6px 12px',
                        borderRadius: '999px',
                        background:
                          job.status === 'open'
                            ? '#e8f7ee'
                            : '#f4e8e8',
                        color:
                          job.status === 'open'
                            ? '#247342'
                            : '#9b3c3c',
                        fontSize: '13px',
                        fontWeight: 700,
                        textTransform: 'capitalize',
                      }}
                    >
                      {job.status}
                    </span>

                    <small
                      style={{
                        color: '#888',
                      }}
                    >
                      Job #{job.id}
                    </small>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    marginTop: '20px',
                    paddingTop: '18px',
                    borderTop:
                      '1px solid #eeeeee',
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleStatus(job)
                    }
                    style={{
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 15px',
                      background: '#eee9fb',
                      color: '#5d4ca5',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {job.status === 'open'
                      ? 'Close Job'
                      : 'Reopen Job'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openEditModal(job)
                    }
                    style={{
                      border:
                        '1px solid #ddd',
                      borderRadius: '10px',
                      padding: '10px 15px',
                      background: '#ffffff',
                      color: '#333',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(job.id)
                    }
                    style={{
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 15px',
                      background: '#fff0ed',
                      color: '#a23a2a',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal()
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(35, 30, 45, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '760px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: '22px',
              padding: '30px',
              boxShadow:
                '0 20px 60px rgba(30, 20, 50, 0.18)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '20px',
                marginBottom: '24px',
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '28px',
                  }}
                >
                  {editingJobId
                    ? 'Edit Job'
                    : 'Create New Job'}
                </h2>

                <p
                  style={{
                    marginTop: '7px',
                    color: '#777',
                  }}
                >
                  {editingJobId
                    ? 'Update the details of this opportunity.'
                    : `Post a new opportunity for ${company?.name || 'your company'}.`}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                style={{
                  border: 'none',
                  background: '#f3f1f5',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#555',
                }}
              >
                ×
              </button>
            </div>

            {formError && (
              <div
                style={{
                  marginBottom: '20px',
                  padding: '13px 15px',
                  borderRadius: '11px',
                  background: '#fff0ed',
                  color: '#a23a2a',
                  lineHeight: 1.5,
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: 'grid',
                  gap: '18px',
                }}
              >
                <div>
                  <label style={labelStyle}>
                    Job Title *
                  </label>

                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Software Engineer Intern"
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Description *
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe the role, responsibilities, and expectations..."
                    rows={5}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      minHeight: '130px',
                    }}
                    required
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(2, minmax(0, 1fr))',
                    gap: '16px',
                  }}
                >
                  <div>
                    <label style={labelStyle}>
                      Location
                    </label>

                    <input
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="e.g. Bengaluru / Remote"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Employment Type
                    </label>

                    <select
                      name="employment_type"
                      value={form.employment_type}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      <option value="">
                        Select type
                      </option>
                      <option value="Internship">
                        Internship
                      </option>
                      <option value="Full-time">
                        Full-time
                      </option>
                      <option value="Part-time">
                        Part-time
                      </option>
                      <option value="Contract">
                        Contract
                      </option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(3, minmax(0, 1fr))',
                    gap: '16px',
                  }}
                >
                  <div>
                    <label style={labelStyle}>
                      Minimum Experience
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      name="experience_min"
                      value={form.experience_min}
                      onChange={handleChange}
                      placeholder="0"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Maximum Experience
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      name="experience_max"
                      value={form.experience_max}
                      onChange={handleChange}
                      placeholder="1"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Experience Level
                    </label>

                    <select
                      name="experience_level"
                      value={form.experience_level}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      <option value="">
                        Select level
                      </option>
                      <option value="Entry Level">
                        Entry Level
                      </option>
                      <option value="Mid Level">
                        Mid Level
                      </option>
                      <option value="Senior Level">
                        Senior Level
                      </option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(2, minmax(0, 1fr))',
                    gap: '16px',
                  }}
                >
                  <div>
                    <label style={labelStyle}>
                      Minimum Salary (₹)
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      name="salary_min"
                      value={form.salary_min}
                      onChange={handleChange}
                      placeholder="15000"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Maximum Salary (₹)
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      name="salary_max"
                      value={form.salary_max}
                      onChange={handleChange}
                      placeholder="25000"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>
                    Application URL
                  </label>

                  <input
                    type="url"
                    name="application_url"
                    value={form.application_url}
                    onChange={handleChange}
                    placeholder="https://company.com/apply"
                    style={inputStyle}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(2, minmax(0, 1fr))',
                    gap: '16px',
                  }}
                >
                  <div>
                    <label style={labelStyle}>
                      Minimum Degree
                    </label>

                    <input
                      name="minimum_degree"
                      value={form.minimum_degree}
                      onChange={handleChange}
                      placeholder="e.g. B.Tech"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Required Field of Study
                    </label>

                    <input
                      name="required_field_of_study"
                      value={
                        form.required_field_of_study
                      }
                      onChange={handleChange}
                      placeholder="e.g. Computer Science"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>
                    Minimum Grade
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="minimum_grade"
                    value={form.minimum_grade}
                    onChange={handleChange}
                    placeholder="e.g. 60 or 7.5"
                    style={inputStyle}
                  />
                </div>

                <div
                  style={{
                    marginTop: '4px',
                    padding: '20px',
                    borderRadius: '16px',
                    background: '#faf8ff',
                    border: '1px solid #e9e3f7',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '16px',
                      marginBottom: '14px',
                    }}
                  >
                    <div>
                      <label style={labelStyle}>
                        Required & Preferred Skills
                      </label>
                      <p
                        style={{
                          margin: '4px 0 0',
                          color: '#777',
                          fontSize: '13px',
                          lineHeight: 1.5,
                        }}
                      >
                        Add skills that HireSense will use when
                        matching candidates to this opportunity.
                      </p>
                    </div>

                    {jobSkills.length > 0 && (
                      <span
                        style={{
                          padding: '5px 10px',
                          borderRadius: '999px',
                          background: '#eee9fb',
                          color: '#5d4ca5',
                          fontSize: '12px',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {jobSkills.length} skill
                        {jobSkills.length === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>

                  <input
                    value={skillSearch}
                    onChange={(event) =>
                      setSkillSearch(event.target.value)
                    }
                    placeholder={
                      skillsLoading
                        ? 'Loading skills...'
                        : 'Search Python, SQL, React...'
                    }
                    disabled={skillsLoading || jobSkillsLoading}
                    style={inputStyle}
                  />

                  {skillSearch.trim() && !skillsLoading && (
                    <div
                      style={{
                        marginTop: '8px',
                        border: '1px solid #e2ddec',
                        borderRadius: '12px',
                        background: '#ffffff',
                        maxHeight: '190px',
                        overflowY: 'auto',
                      }}
                    >
                      {getFilteredSkills().length === 0 ? (
                        <div
                          style={{
                            padding: '13px',
                            color: '#777',
                            fontSize: '13px',
                          }}
                        >
                          No matching skills found.
                        </div>
                      ) : (
                        getFilteredSkills().map((skill) => (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() =>
                              addSkillToJob(skill)
                            }
                            style={{
                              width: '100%',
                              border: 'none',
                              borderBottom:
                                '1px solid #f0edf5',
                              background: '#ffffff',
                              padding: '11px 13px',
                              textAlign: 'left',
                              cursor: 'pointer',
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 700,
                                color: '#333',
                              }}
                            >
                              {skill.name}
                            </div>

                            {skill.category && (
                              <div
                                style={{
                                  marginTop: '3px',
                                  fontSize: '12px',
                                  color: '#888',
                                }}
                              >
                                {skill.category}
                              </div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {jobSkillsLoading ? (
                    <div
                      style={{
                        marginTop: '14px',
                        padding: '15px',
                        borderRadius: '12px',
                        background: '#ffffff',
                        color: '#777',
                        fontSize: '13px',
                      }}
                    >
                      Loading skills for this job...
                    </div>
                  ) : jobSkills.length === 0 ? (
                    <div
                      style={{
                        marginTop: '14px',
                        padding: '15px',
                        borderRadius: '12px',
                        background: '#ffffff',
                        color: '#888',
                        fontSize: '13px',
                      }}
                    >
                      No skills added yet. Add the skills that
                      matter for this role.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gap: '10px',
                        marginTop: '14px',
                      }}
                    >
                      {jobSkills.map((skill) => (
                        <div
                          key={skill.skill_id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              'minmax(0, 1fr) 150px 120px auto',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '13px',
                            borderRadius: '12px',
                            background: '#ffffff',
                            border: '1px solid #eeeaf4',
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: 700,
                                color: '#333',
                              }}
                            >
                              {skill.name}
                            </div>
                            {skill.category && (
                              <div
                                style={{
                                  marginTop: '3px',
                                  color: '#888',
                                  fontSize: '12px',
                                }}
                              >
                                {skill.category}
                              </div>
                            )}
                          </div>

                          <select
                            value={skill.importance}
                            onChange={(event) =>
                              updateJobSkillField(
                                skill.skill_id,
                                'importance',
                                event.target.value
                              )
                            }
                            style={inputStyle}
                            disabled={jobSkillsSaving}
                          >
                            <option value={0.5}>
                              Low Importance
                            </option>
                            <option value={1}>
                              Medium Importance
                            </option>
                            <option value={1.5}>
                              High Importance
                            </option>
                            <option value={2}>
                              Critical
                            </option>
                          </select>

                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '7px',
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#555',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={skill.required}
                              onChange={(event) =>
                                updateJobSkillField(
                                  skill.skill_id,
                                  'required',
                                  event.target.checked
                                )
                              }
                              disabled={jobSkillsSaving}
                            />
                            Required
                          </label>

                          <button
                            type="button"
                            onClick={() =>
                              removeSkillFromJob(
                                skill.skill_id
                              )
                            }
                            disabled={jobSkillsSaving}
                            style={{
                              border: 'none',
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: '#fff0ed',
                              color: '#a23a2a',
                              fontSize: '18px',
                              cursor: 'pointer',
                            }}
                            title="Remove skill"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    paddingTop: '8px',
                  }}
                >
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    style={{
                      border:
                        '1px solid #ddd',
                      borderRadius: '11px',
                      padding: '12px 20px',
                      background: '#ffffff',
                      color: '#444',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || jobSkillsSaving}
                    style={{
                      border: 'none',
                      borderRadius: '11px',
                      padding: '12px 22px',
                      background: '#7c68c9',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: saving
                        ? 'not-allowed'
                        : 'pointer',
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saving || jobSkillsSaving
                      ? 'Saving...'
                      : editingJobId
                        ? 'Save Changes'
                        : 'Create Job'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AppShell>
  )
}

const labelStyle = {
  display: 'block',
  marginBottom: '7px',
  fontSize: '14px',
  fontWeight: 700,
  color: '#444',
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #ddd',
  borderRadius: '11px',
  padding: '11px 13px',
  fontSize: '14px',
  color: '#333',
  background: '#ffffff',
  outline: 'none',
}

export default RecruiterJobsPage