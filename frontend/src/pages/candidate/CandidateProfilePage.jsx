import { useEffect, useRef, useState } from 'react'
import {
  UserRound,
  MapPin,
  Phone,
  Mail,
  Pencil,
  GraduationCap,
  BriefcaseBusiness,
  FolderKanban,
  Code2,
  Plus,
  X,
  Save,
  Trash2,
  Search,
  ChevronDown,
} from 'lucide-react'

import AppShell from '../../components/layout/AppShell'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'


function CandidateProfilePage() {
  const { user } = useAuth()

  const [profile, setProfile] = useState(null)
  const [skills, setSkills] = useState([])
  const [availableSkills, setAvailableSkills] = useState([])
  const [educations, setEducations] = useState([])
  const [experiences, setExperiences] = useState([])
  const [projects, setProjects] = useState([])

  // ---------------------------------------------------------
  // CAREER PREFERENCES
  // ---------------------------------------------------------

  const [preferences, setPreferences] = useState({
    preferred_roles: [],
    preferred_locations: [],
    work_modes: [],
    employment_types: [],
    experience_level: '',
  })
  const [preferencesLoading, setPreferencesLoading] = useState(true)
  const [preferencesSaving, setPreferencesSaving] = useState(false)
  const [preferencesError, setPreferencesError] = useState('')
  const [preferencesSuccess, setPreferencesSuccess] = useState('')
  const [roleSearch, setRoleSearch] = useState('')
  const [locationInput, setLocationInput] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ---------------------------------------------------------
  // PROFILE EDIT
  // ---------------------------------------------------------

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    location: '',
    summary: '',
  })

  // ---------------------------------------------------------
  // SKILL MODAL
  // ---------------------------------------------------------

  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false)
  const [skillSaving, setSkillSaving] = useState(false)
  const [skillError, setSkillError] = useState('')
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false)

  const [skillForm, setSkillForm] = useState({
    skill_id: '',
    skill_search: '',
    proficiency: '',
    years_used: '',
  })

  const skillPickerRef = useRef(null)

  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false)
  const [educationSaving, setEducationSaving] = useState(false)
  const [educationError, setEducationError] = useState('')
  const [editingEducationId, setEditingEducationId] = useState(null)

  const [educationForm, setEducationForm] = useState({
    education_type: 'Undergraduate',
    institution: '',
    degree: '',
    field_of_study: '',
    score_type: 'CGPA',
    grade: '',
    start_year: '',
    end_year: '',
  })

  // ---------------------------------------------------------
  // EXPERIENCE
  // ---------------------------------------------------------

  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false)
  const [experienceSaving, setExperienceSaving] = useState(false)
  const [experienceError, setExperienceError] = useState('')
  const [editingExperienceId, setEditingExperienceId] = useState(null)

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [projectSaving, setProjectSaving] = useState(false)
  const [projectError, setProjectError] = useState('')
  const [editingProjectId, setEditingProjectId] = useState(null)
  const [projectForm, setProjectForm] = useState({
    project_name: '', project_type: 'Personal', technologies: '', project_link: '',
    start_date: '', end_date: '', description: '', currently_working: false,
  })

  const [experienceForm, setExperienceForm] = useState({
    company_name: '',
    job_title: '',
    employment_type: 'Full-time',
    location: '',
    start_date: '',
    end_date: '',
    description: '',
    currently_working: false,
  })


  // ---------------------------------------------------------
  // LOAD PROFILE + SKILLS + EDUCATION
  // ---------------------------------------------------------

  async function loadProfile() {
    try {
      setLoading(true)
      setError('')

      const [
        profileResponse,
        skillsResponse,
        availableSkillsResponse,
        educationResponse,
        experienceResponse,
        projectResponse,
        preferencesResponse,
      ] = await Promise.all([
        api.get('/candidates/me'),
        api.get('/candidate-skills/me'),
        api.get('/skills/'),
        api.get('/educations/me'),
        api.get('/experiences/me'),
        api.get('/projects/me'),
        api.get('/candidate-preferences/me'),
      ])

      setProfile(profileResponse.data)
      setSkills(skillsResponse.data)
      setAvailableSkills(availableSkillsResponse.data)
      setEducations(educationResponse.data)
      setExperiences(experienceResponse.data)
      setProjects(projectResponse.data)

      const preferenceData = preferencesResponse.data
      setPreferences({
        preferred_roles: Array.isArray(preferenceData.preferred_roles)
          ? preferenceData.preferred_roles
          : [],
        preferred_locations: Array.isArray(preferenceData.preferred_locations)
          ? preferenceData.preferred_locations
          : [],
        work_modes: Array.isArray(preferenceData.work_modes)
          ? preferenceData.work_modes
          : [],
        employment_types: Array.isArray(preferenceData.employment_types)
          ? preferenceData.employment_types
          : [],
        experience_level: preferenceData.experience_level || '',
      })
      setPreferencesLoading(false)

      setFormData({
        full_name: profileResponse.data.full_name || '',
        phone: profileResponse.data.phone || '',
        location: profileResponse.data.location || '',
        summary: profileResponse.data.summary || '',
      })
    } catch (err) {
      console.error('Failed to load profile:', err)
      setPreferencesLoading(false)
      setError('Unable to load your profile.')
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadProfile()
  }, [])


  // ---------------------------------------------------------
  // DROPDOWN OUTSIDE CLICK
  // ---------------------------------------------------------

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        skillPickerRef.current &&
        !skillPickerRef.current.contains(event.target)
      ) {
        setSkillDropdownOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setSkillDropdownOpen(false)
      }
    }

    /*
      IMPORTANT:
      Use capture phase so the document listener receives
      the click even when the modal itself uses
      stopPropagation().
    */

    document.addEventListener(
      'mousedown',
      handleOutsideClick,
      true
    )

    document.addEventListener(
      'keydown',
      handleEscape
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
        true
      )

      document.removeEventListener(
        'keydown',
        handleEscape
      )
    }
  }, [])


  // ---------------------------------------------------------
  // PROFILE EDIT
  // ---------------------------------------------------------

  function openEditProfile() {
    setSaveError('')
    setSaveSuccess('')

    setFormData({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      location: profile?.location || '',
      summary: profile?.summary || '',
    })

    setIsEditOpen(true)
  }


  function closeEditProfile() {
    if (saving) return

    setIsEditOpen(false)
    setSaveError('')
  }


  function handleChange(event) {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }


  async function handleSaveProfile(event) {
    event.preventDefault()

    if (!formData.full_name.trim()) {
      setSaveError('Full name is required.')
      return
    }

    try {
      setSaving(true)
      setSaveError('')
      setSaveSuccess('')

      const response = await api.put(
        '/candidates/me',
        {
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim() || null,
          location: formData.location.trim() || null,
          summary: formData.summary.trim() || null,
        }
      )

      setProfile(response.data)

      setFormData({
        full_name: response.data.full_name || '',
        phone: response.data.phone || '',
        location: response.data.location || '',
        summary: response.data.summary || '',
      })

      setSaveSuccess(
        'Profile updated successfully.'
      )

      setTimeout(() => {
        setIsEditOpen(false)
        setSaveSuccess('')
      }, 900)

    } catch (err) {
      console.error(
        'Failed to update profile:',
        err
      )

      setSaveError(
        err.response?.data?.detail ||
        'Unable to update your profile. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }


  // ---------------------------------------------------------
  // SKILL MODAL
  // ---------------------------------------------------------

  function openSkillModal() {
    setSkillError('')
    setSkillDropdownOpen(false)

    setSkillForm({
      skill_id: '',
      skill_search: '',
      proficiency: '',
      years_used: '',
    })

    setIsSkillModalOpen(true)
  }


  function closeSkillModal() {
    if (skillSaving) return

    setIsSkillModalOpen(false)
    setSkillDropdownOpen(false)
    setSkillError('')
  }


  function handleSkillChange(event) {
    const { name, value } = event.target

    setSkillForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }


  function selectSkill(skill) {
    setSkillForm((previous) => ({
      ...previous,
      skill_id: String(skill.id),
      skill_search: skill.name,
    }))

    setSkillDropdownOpen(false)
    setSkillError('')
  }


  function clearSelectedSkill() {
    setSkillForm((previous) => ({
      ...previous,
      skill_id: '',
      skill_search: '',
    }))

    setSkillDropdownOpen(true)
  }


  // ---------------------------------------------------------
  // FILTER AVAILABLE SKILLS
  // ---------------------------------------------------------

  const filteredSkills = availableSkills
    .filter(
      (availableSkill) =>
        !skills.some(
          (candidateSkill) =>
            candidateSkill.skill_id ===
            availableSkill.id
        )
    )
    .filter((skill) =>
      skill.name
        .toLowerCase()
        .includes(
          (
            skillForm.skill_search || ''
          ).toLowerCase()
        )
    )


  const exactSkillExists = availableSkills.some(
    (skill) =>
      skill.name.toLowerCase() ===
      (
        skillForm.skill_search || ''
      ).trim().toLowerCase()
  )


  // ---------------------------------------------------------
  // ADD SKILL
  // ---------------------------------------------------------

  async function handleAddSkill(event) {
    event.preventDefault()

    const skillName =
      skillForm.skill_search.trim()

    if (!skillName) {
      setSkillError(
        'Please select or enter a skill.'
      )

      setSkillDropdownOpen(true)
      return
    }

    if (
      skillForm.proficiency !== '' &&
      (
        Number(skillForm.proficiency) < 0 ||
        Number(skillForm.proficiency) > 100
      )
    ) {
      setSkillError(
        'Proficiency must be between 0 and 100.'
      )
      return
    }

    if (
      skillForm.years_used !== '' &&
      Number(skillForm.years_used) < 0
    ) {
      setSkillError(
        'Years used cannot be negative.'
      )
      return
    }

    let selectedSkillId =
      skillForm.skill_id
        ? Number(skillForm.skill_id)
        : null


    // If user typed an existing skill name
    // but did not click it, use that existing skill.
    if (!selectedSkillId && exactSkillExists) {
      const existingSkill =
        availableSkills.find(
          (skill) =>
            skill.name.toLowerCase() ===
            skillName.toLowerCase()
        )

      if (existingSkill) {
        selectedSkillId =
          existingSkill.id
      }
    }


    try {
      setSkillSaving(true)
      setSkillError('')
      setSkillDropdownOpen(false)

      const payload = {
        candidate_id: profile.id,

        skill_id: selectedSkillId,

        skill_name: selectedSkillId
          ? null
          : skillName,

        proficiency:
          skillForm.proficiency === ''
            ? null
            : Number(
                skillForm.proficiency
              ),

        years_used:
          skillForm.years_used === ''
            ? null
            : Number(
                skillForm.years_used
              ),

        source: 'manual',
      }


      const response = await api.post(
        '/candidate-skills/',
        payload
      )


      setSkills((previous) => [
        ...previous,
        response.data,
      ])


      // If a brand-new skill was created,
      // add it to the local skill list.
      if (!selectedSkillId) {
        const createdSkill = {
          id: response.data.skill_id,
          name: skillName,
          category: 'Other',
        }

        setAvailableSkills((previous) => [
          ...previous,
          createdSkill,
        ])
      }


      setIsSkillModalOpen(false)
      setSkillDropdownOpen(false)

      setSkillForm({
        skill_id: '',
        skill_search: '',
        proficiency: '',
        years_used: '',
      })

    } catch (err) {
      console.error(
        'Failed to add skill:',
        err
      )

      setSkillError(
        err.response?.data?.detail ||
        'Unable to add this skill. Please try again.'
      )
    } finally {
      setSkillSaving(false)
    }
  }


  // ---------------------------------------------------------
  // DELETE SKILL
  // ---------------------------------------------------------

  async function handleDeleteSkill(
    candidateSkillId
  ) {
    const confirmed = window.confirm(
      'Are you sure you want to remove this skill?'
    )

    if (!confirmed) return

    try {
      await api.delete(
        `/candidate-skills/${candidateSkillId}`
      )

      setSkills((previous) =>
        previous.filter(
          (skill) =>
            skill.id !== candidateSkillId
        )
      )

    } catch (err) {
      console.error(
        'Failed to delete skill:',
        err
      )

      window.alert(
        err.response?.data?.detail ||
        'Unable to remove this skill.'
      )
    }
  }


  // ---------------------------------------------------------
  // GET SKILL NAME
  // ---------------------------------------------------------

  function getSkillName(skillId) {
    const skill =
      availableSkills.find(
        (item) => item.id === skillId
      )

    return skill?.name || 'Unknown skill'
  }


  // ---------------------------------------------------------
  // EDUCATION
  // ---------------------------------------------------------

  function openAddEducation() {
    setEditingEducationId(null)
    setEducationError('')
    setEducationForm({
      education_type: 'Undergraduate',
      institution: '',
      degree: '',
      field_of_study: '',
      score_type: 'CGPA',
      grade: '',
      start_year: '',
      end_year: '',
    })
    setIsEducationModalOpen(true)
  }

  function openEditEducation(education) {
    setEditingEducationId(education.id)
    setEducationError('')
    setEducationForm({
      education_type: education.education_type || 'Undergraduate',
      institution: education.institution || '',
      degree: education.degree || '',
      field_of_study: education.field_of_study || '',
      score_type: education.score_type || 'CGPA',
      grade: education.grade ?? '',
      start_year: education.start_year ?? '',
      end_year: education.end_year ?? '',
    })
    setIsEducationModalOpen(true)
  }

  function closeEducationModal() {
    if (educationSaving) return
    setIsEducationModalOpen(false)
    setEducationError('')
    setEditingEducationId(null)
  }

  function handleEducationChange(event) {
    const { name, value } = event.target
    setEducationForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleSaveEducation(event) {
    event.preventDefault()

    if (!educationForm.institution.trim()) {
      setEducationError('Institution is required.')
      return
    }

    const startYear = educationForm.start_year === ''
      ? null
      : Number(educationForm.start_year)

    const endYear = educationForm.end_year === ''
      ? null
      : Number(educationForm.end_year)

    if (startYear !== null && endYear !== null && endYear < startYear) {
      setEducationError('End year cannot be earlier than start year.')
      return
    }

    const grade = educationForm.grade === ''
      ? null
      : Number(educationForm.grade)

    if (grade !== null && grade < 0) {
      setEducationError('Grade cannot be negative.')
      return
    }

    const payload = {
      candidate_id: profile.id,
      education_type: educationForm.education_type,
      institution: educationForm.institution.trim(),
      degree: educationForm.degree.trim() || null,
      field_of_study: educationForm.field_of_study.trim() || null,
      score_type: educationForm.score_type,
      start_year: startYear,
      end_year: endYear,
      grade,
    }

    try {
      setEducationSaving(true)
      setEducationError('')

      if (editingEducationId) {
        const response = await api.put(
          `/educations/${editingEducationId}`,
          payload
        )

        setEducations((previous) =>
          previous.map((education) =>
            education.id === editingEducationId
              ? response.data
              : education
          )
        )
      } else {
        const response = await api.post('/educations/', payload)

        setEducations((previous) =>
          [...previous, response.data].sort(
            (a, b) =>
              (b.end_year || 0) - (a.end_year || 0) ||
              (b.start_year || 0) - (a.start_year || 0)
          )
        )
      }

      closeEducationModal()
    } catch (err) {
      console.error('Failed to save education:', err)
      setEducationError(
        err.response?.data?.detail ||
        'Unable to save education. Please try again.'
      )
    } finally {
      setEducationSaving(false)
    }
  }

  async function handleDeleteEducation(educationId) {
    if (!window.confirm('Are you sure you want to remove this education entry?')) {
      return
    }

    try {
      await api.delete(`/educations/${educationId}`)
      setEducations((previous) =>
        previous.filter((education) => education.id !== educationId)
      )
    } catch (err) {
      console.error('Failed to delete education:', err)
      window.alert(
        err.response?.data?.detail ||
        'Unable to remove this education entry.'
      )
    }
  }

  function formatEducationYears(education) {
    if (education.start_year && education.end_year) {
      return `${education.start_year} – ${education.end_year}`
    }
    if (education.start_year) return `${education.start_year} – Present`
    if (education.end_year) return `${education.end_year}`
    return 'Years not specified'
  }


  // ---------------------------------------------------------
  // EXPERIENCE
  // ---------------------------------------------------------

  function openAddExperience() {
    setEditingExperienceId(null)
    setExperienceError('')
    setExperienceForm({
      company_name: '',
      job_title: '',
      employment_type: 'Full-time',
      location: '',
      start_date: '',
      end_date: '',
      description: '',
      currently_working: false,
    })
    setIsExperienceModalOpen(true)
  }

  function openEditExperience(experience) {
    const currentlyWorking =
      !experience.end_date ||
      experience.end_date.toLowerCase() === 'present'

    setEditingExperienceId(experience.id)
    setExperienceError('')
    setExperienceForm({
      company_name: experience.company_name || '',
      job_title: experience.job_title || '',
      employment_type: experience.employment_type || 'Full-time',
      location: experience.location || '',
      start_date: experience.start_date || '',
      end_date: currentlyWorking ? '' : (experience.end_date || ''),
      description: experience.description || '',
      currently_working: currentlyWorking,
    })
    setIsExperienceModalOpen(true)
  }

  function closeExperienceModal() {
    if (experienceSaving) return
    setIsExperienceModalOpen(false)
    setExperienceError('')
    setEditingExperienceId(null)
  }

  function handleExperienceChange(event) {
    const { name, value, type, checked } = event.target

    setExperienceForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'currently_working' && checked
        ? { end_date: '' }
        : {}),
    }))
  }

  async function handleSaveExperience(event) {
    event.preventDefault()

    if (!experienceForm.company_name.trim()) {
      setExperienceError('Company / organization is required.')
      return
    }

    if (!experienceForm.job_title.trim()) {
      setExperienceError('Job title is required.')
      return
    }

    if (
      experienceForm.start_date &&
      !experienceForm.currently_working &&
      experienceForm.end_date &&
      experienceForm.end_date < experienceForm.start_date
    ) {
      setExperienceError('End date cannot be earlier than start date.')
      return
    }

    const payload = {
      candidate_id: profile.id,
      company_name: experienceForm.company_name.trim(),
      job_title: experienceForm.job_title.trim(),
      employment_type: experienceForm.employment_type || null,
      location: experienceForm.location.trim() || null,
      start_date: experienceForm.start_date || null,
      end_date: experienceForm.currently_working
        ? 'Present'
        : experienceForm.end_date || null,
      description: experienceForm.description.trim() || null,
    }

    try {
      setExperienceSaving(true)
      setExperienceError('')

      if (editingExperienceId) {
        const response = await api.put(
          `/experiences/${editingExperienceId}`,
          payload
        )

        setExperiences((previous) =>
          previous
            .map((experience) =>
              experience.id === editingExperienceId
                ? response.data
                : experience
            )
            .sort((a, b) =>
              (b.start_date || '').localeCompare(a.start_date || '')
            )
        )
      } else {
        const response = await api.post(
          '/experiences/',
          payload
        )

        setExperiences((previous) =>
          [...previous, response.data].sort((a, b) =>
            (b.start_date || '').localeCompare(a.start_date || '')
          )
        )
      }

      closeExperienceModal()
    } catch (err) {
      console.error('Failed to save experience:', err)
      setExperienceError(
        err.response?.data?.detail ||
        'Unable to save experience. Please try again.'
      )
    } finally {
      setExperienceSaving(false)
    }
  }

  async function handleDeleteExperience(experienceId) {
    if (
      !window.confirm(
        'Are you sure you want to remove this experience entry?'
      )
    ) {
      return
    }

    try {
      await api.delete(`/experiences/${experienceId}`)

      setExperiences((previous) =>
        previous.filter(
          (experience) => experience.id !== experienceId
        )
      )
    } catch (err) {
      console.error('Failed to delete experience:', err)
      window.alert(
        err.response?.data?.detail ||
        'Unable to remove this experience entry.'
      )
    }
  }

  function openAddProject() {
    setEditingProjectId(null); setProjectError('')
    setProjectForm({ project_name: '', project_type: 'Personal', technologies: '', project_link: '', start_date: '', end_date: '', description: '', currently_working: false })
    setIsProjectModalOpen(true)
  }

  function openEditProject(project) {
    const current = !project.end_date || String(project.end_date).toLowerCase() === 'present'
    setEditingProjectId(project.id); setProjectError('')
    setProjectForm({ project_name: project.project_name || '', project_type: project.project_type || 'Personal', technologies: project.technologies || '', project_link: project.project_link || '', start_date: project.start_date || '', end_date: current ? '' : (project.end_date || ''), description: project.description || '', currently_working: current })
    setIsProjectModalOpen(true)
  }

  function closeProjectModal() {
    if (projectSaving) return
    setIsProjectModalOpen(false); setProjectError(''); setEditingProjectId(null)
  }

  function handleProjectChange(event) {
    const { name, value, type, checked } = event.target
    setProjectForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value, ...(name === 'currently_working' && checked ? { end_date: '' } : {}) }))
  }

  async function handleSaveProject(event) {
    event.preventDefault()
    if (!projectForm.project_name.trim()) { setProjectError('Project name is required.'); return }
    if (projectForm.start_date && !projectForm.currently_working && projectForm.end_date && projectForm.end_date < projectForm.start_date) { setProjectError('End date cannot be earlier than start date.'); return }
    if (projectForm.project_link.trim()) {
      try { const url = new URL(projectForm.project_link.trim()); if (!['http:', 'https:'].includes(url.protocol)) throw new Error() }
      catch { setProjectError('Project link must be a valid http:// or https:// URL.'); return }
    }
    const payload = { candidate_id: profile.id, project_name: projectForm.project_name.trim(), project_type: projectForm.project_type || null, technologies: projectForm.technologies.trim() || null, project_link: projectForm.project_link.trim() || null, start_date: projectForm.start_date || null, end_date: projectForm.currently_working ? 'Present' : projectForm.end_date || null, description: projectForm.description.trim() || null }
    try {
      setProjectSaving(true); setProjectError('')
      if (editingProjectId) {
        const response = await api.put(`/projects/${editingProjectId}`, payload)
        setProjects((previous) => previous.map((p) => p.id === editingProjectId ? response.data : p).sort((a,b) => (b.start_date || '').localeCompare(a.start_date || '')))
      } else {
        const response = await api.post('/projects/', payload)
        setProjects((previous) => [...previous, response.data].sort((a,b) => (b.start_date || '').localeCompare(a.start_date || '')))
      }
      setIsProjectModalOpen(false); setProjectError(''); setEditingProjectId(null)
    } catch (err) {
      console.error('Failed to save project:', err)
      setProjectError(err.response?.data?.detail || 'Unable to save project. Please try again.')
    } finally { setProjectSaving(false) }
  }

  async function handleDeleteProject(projectId) {
    if (!window.confirm('Are you sure you want to remove this project?')) return
    try { await api.delete(`/projects/${projectId}`); setProjects((previous) => previous.filter((p) => p.id !== projectId)) }
    catch (err) { console.error('Failed to delete project:', err); window.alert(err.response?.data?.detail || 'Unable to remove this project.') }
  }

  function formatProjectDates(project) {
    const start = project.start_date || 'Start date not specified'
    const end = String(project.end_date || '').toLowerCase() === 'present' ? 'Present' : project.end_date || 'Present'
    return `${start} – ${end}`
  }

  function formatExperienceDates(experience) {
    const start = experience.start_date || 'Start date not specified'
    const end =
      experience.end_date?.toLowerCase() === 'present'
        ? 'Present'
        : experience.end_date || 'Present'

    return `${start} – ${end}`
  }

  // ---------------------------------------------------------
  // CAREER PREFERENCES
  // ---------------------------------------------------------

  const roleOptions = [
    'Data Analyst',
    'Data Scientist',
    'Machine Learning Engineer',
    'AI Engineer',
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Python Developer',
    'Java Developer',
    'Cloud Engineer',
    'DevOps Engineer',
    'Data Engineer',
    'Business Analyst',
    'Product Analyst',
    'Product Manager',
    'UI/UX Designer',
    'QA Engineer',
    'Cybersecurity Analyst',
    'Database Administrator',
  ]

  const locationOptions = [
    'Remote',
    'Bengaluru',
    'Hyderabad',
    'Delhi NCR',
    'Mumbai',
    'Pune',
    'Chennai',
    'Gurugram',
    'Noida',
    'Kolkata',
    'Ahmedabad',
    'Jaipur',
    'Chandigarh',
    'Kochi',
    'Indore',
    'Dehradun',
  ]

  const workModeOptions = ['Remote', 'Hybrid', 'On-site']
  const employmentTypeOptions = ['Internship', 'Full-time', 'Part-time', 'Contract', 'Freelance']

  const filteredRoleOptions = roleOptions.filter((role) =>
    role.toLowerCase().includes(roleSearch.trim().toLowerCase())
  )

  function updatePreferenceList(field, value) {
    setPreferencesSuccess('')
    setPreferencesError('')
    setPreferences((previous) => {
      const current = Array.isArray(previous[field]) ? previous[field] : []
      const exists = current.some(
        (item) => item.toLowerCase() === value.toLowerCase()
      )

      return {
        ...previous,
        [field]: exists
          ? current.filter((item) => item.toLowerCase() !== value.toLowerCase())
          : [...current, value],
      }
    })
  }

  function addCustomRole() {
    const value = roleSearch.trim()
    if (!value) return

    const exists = preferences.preferred_roles.some(
      (role) => role.toLowerCase() === value.toLowerCase()
    )

    if (!exists && preferences.preferred_roles.length < 10) {
      setPreferences((previous) => ({
        ...previous,
        preferred_roles: [...previous.preferred_roles, value],
      }))
    }

    setRoleSearch('')
    setPreferencesSuccess('')
    setPreferencesError('')
  }

  function addCustomLocation() {
    const value = locationInput.trim()
    if (!value) return

    const exists = preferences.preferred_locations.some(
      (location) => location.toLowerCase() === value.toLowerCase()
    )

    if (!exists && preferences.preferred_locations.length < 15) {
      setPreferences((previous) => ({
        ...previous,
        preferred_locations: [...previous.preferred_locations, value],
      }))
    }

    setLocationInput('')
    setPreferencesSuccess('')
    setPreferencesError('')
  }

  async function handleSavePreferences(event) {
    event.preventDefault()

    try {
      setPreferencesSaving(true)
      setPreferencesError('')
      setPreferencesSuccess('')

      const response = await api.put('/candidate-preferences/me', {
        preferred_roles: preferences.preferred_roles,
        preferred_locations: preferences.preferred_locations,
        work_modes: preferences.work_modes,
        employment_types: preferences.employment_types,
        experience_level: preferences.experience_level || null,
      })

      const saved = response.data
      setPreferences({
        preferred_roles: Array.isArray(saved.preferred_roles)
          ? saved.preferred_roles
          : [],
        preferred_locations: Array.isArray(saved.preferred_locations)
          ? saved.preferred_locations
          : [],
        work_modes: Array.isArray(saved.work_modes)
          ? saved.work_modes
          : [],
        employment_types: Array.isArray(saved.employment_types)
          ? saved.employment_types
          : [],
        experience_level: saved.experience_level || '',
      })

      setPreferencesSuccess('Career preferences saved successfully.')
    } catch (err) {
      console.error('Failed to save career preferences:', err)
      setPreferencesError(
        err.response?.data?.detail ||
        'Unable to save your career preferences. Please try again.'
      )
    } finally {
      setPreferencesSaving(false)
    }
  }

  function removePreference(field, value) {
    setPreferencesSuccess('')
    setPreferencesError('')
    setPreferences((previous) => ({
      ...previous,
      [field]: previous[field].filter((item) => item !== value),
    }))
  }

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <AppShell
        role="candidate"
        userName={
          user?.name || 'User'
        }
      >
        <div className="hs-profile-page">
          <div className="hs-profile-loading">
            Loading your profile...
          </div>
        </div>
      </AppShell>
    )
  }


  // ---------------------------------------------------------
  // ERROR
  // ---------------------------------------------------------

  if (error) {
    return (
      <AppShell
        role="candidate"
        userName={
          user?.name || 'User'
        }
      >
        <div className="hs-profile-page">
          <div className="hs-profile-error">
            {error}
          </div>
        </div>
      </AppShell>
    )
  }


  // ---------------------------------------------------------
  // MAIN PAGE
  // ---------------------------------------------------------

  return (
    <AppShell
      role="candidate"
      userName={
        profile?.full_name ||
        user?.name ||
        'User'
      }
    >

      <div className="hs-profile-page">

        {/* ===================================================
            HEADER
            =================================================== */}

        <section className="hs-profile-header">

          <div>

            <div className="hs-profile-eyebrow">
              <UserRound size={15} />
              MY PROFILE
            </div>

            <h1>
              Your career profile.
            </h1>

            <p>
              Keep your information, skills
              and experience up to date so
              HireSense can find better
              opportunities for you.
            </p>

          </div>


          <button
            className="hs-profile-edit-btn"
            onClick={openEditProfile}
          >
            <Pencil size={16} />
            Edit profile
          </button>

        </section>


        <style>{`
          .hs-career-preferences-card {
            overflow: visible;
          }

          .hs-preference-block {
            padding: 22px 0;
            border-top: 1px solid #eee9f3;
          }

          .hs-preference-block:first-of-type {
            border-top: 0;
            padding-top: 0;
          }

          .hs-preference-label-row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 14px;
          }

          .hs-preference-label-row > div {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .hs-preference-label-row strong {
            color: #302a3b;
            font-size: 14px;
          }

          .hs-preference-label-row span {
            color: #91899e;
            font-size: 12px;
          }

          .hs-preference-label-row small {
            color: #91899e;
            font-size: 12px;
            white-space: nowrap;
          }

          .hs-preference-chip-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 12px;
          }

          .hs-preference-chip {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 8px 10px 8px 12px;
            border-radius: 999px;
            background: #f2edff;
            color: #5d4bb2;
            font-size: 12px;
            font-weight: 650;
          }

          .hs-preference-chip-blue {
            background: #edf5ff;
            color: #4670a8;
          }

          .hs-preference-chip button {
            display: grid;
            place-items: center;
            width: 20px;
            height: 20px;
            padding: 0;
            border: 0;
            border-radius: 50%;
            background: rgba(255,255,255,.7);
            color: currentColor;
            cursor: pointer;
          }

          .hs-preference-search-wrap,
          .hs-preference-custom-row {
            display: flex;
            align-items: center;
            gap: 10px;
            min-height: 48px;
            padding: 0 13px;
            border: 1px solid #ddd7e7;
            border-radius: 13px;
            background: #fff;
            color: #8b8497;
          }

          .hs-preference-search-wrap input,
          .hs-preference-custom-row input {
            width: 100%;
            min-width: 0;
            border: 0;
            outline: 0;
            background: transparent;
            color: #302a3b;
            font-size: 14px;
          }

          .hs-preference-options {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 9px;
            padding: 10px;
            border: 1px solid #e7e1ef;
            border-radius: 12px;
            background: #faf8fc;
          }

          .hs-preference-options button,
          .hs-preference-toggle {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            min-height: 36px;
            padding: 8px 11px;
            border: 1px solid #e1d9ed;
            border-radius: 10px;
            background: #fff;
            color: #5f566b;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
          }

          .hs-preference-options button:hover,
          .hs-preference-toggle:hover {
            border-color: #cfc1e9;
            background: #f8f4ff;
            color: #5d4bb2;
          }

          .hs-preference-option-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 9px;
            margin-bottom: 12px;
          }

          .hs-preference-option-grid.preference-three {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .hs-preference-select-card {
            display: flex;
            align-items: center;
            gap: 9px;
            min-height: 48px;
            padding: 10px 12px;
            border: 1px solid #e2dce9;
            border-radius: 12px;
            background: #fff;
            color: #4f475b;
            font-size: 13px;
            font-weight: 600;
            text-align: left;
            cursor: pointer;
          }

          .hs-preference-select-card:hover {
            border-color: #cfc1e9;
            background: #faf7ff;
          }

          .hs-preference-select-card.selected {
            border-color: #cdbff0;
            background: #f4efff;
            color: #5d4bb2;
          }

          .hs-preference-check {
            display: grid;
            place-items: center;
            width: 20px;
            height: 20px;
            flex: 0 0 20px;
            border: 1px solid #d8d0e1;
            border-radius: 6px;
            background: #fff;
            color: #6554c0;
            font-size: 12px;
            font-weight: 800;
          }

          .hs-preference-select-card.selected .hs-preference-check {
            border-color: #bca9e9;
            background: #fff;
          }

          .hs-preference-custom-row {
            padding-right: 7px;
          }

          .hs-preference-custom-row button {
            min-height: 36px;
            padding: 0 14px;
            border: 0;
            border-radius: 9px;
            background: #6554c0;
            color: #fff;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
          }

          .hs-preference-custom-row button:disabled {
            opacity: .45;
            cursor: not-allowed;
          }

          .hs-preferences-save-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
            padding-top: 22px;
            border-top: 1px solid #eee9f3;
          }

          .hs-preferences-save-row > span {
            color: #91899e;
            font-size: 12px;
            line-height: 1.5;
          }

          @media (max-width: 850px) {
            .hs-preference-option-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .hs-preference-option-grid.preference-three {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .hs-preferences-save-row {
              align-items: stretch;
              flex-direction: column;
            }

            .hs-preferences-save-row .hs-profile-save-btn {
              width: 100%;
              justify-content: center;
            }
          }

          @media (max-width: 560px) {
            .hs-preference-option-grid,
            .hs-preference-option-grid.preference-three {
              grid-template-columns: 1fr;
            }

            .hs-preference-custom-row {
              align-items: stretch;
              flex-wrap: wrap;
              padding: 10px;
            }

            .hs-preference-custom-row input {
              width: calc(100% - 35px);
            }

            .hs-preference-custom-row button {
              width: 100%;
            }
          }
        `}</style>

        {/* ===================================================
            PROFILE CARD
            =================================================== */}

        <section className="hs-profile-card hs-profile-main-card">

          <div className="hs-profile-avatar">
            {(
              profile?.full_name ||
              user?.name ||
              'U'
            )
              .charAt(0)
              .toUpperCase()}
          </div>


          <div className="hs-profile-main-info">

            <h2>
              {profile?.full_name ||
                user?.name ||
                'Your Name'}
            </h2>

            <p className="hs-profile-role">
              Candidate
            </p>


            <div className="hs-profile-contact-row">

              {profile?.location && (
                <span>
                  <MapPin size={15} />
                  {profile.location}
                </span>
              )}

              {profile?.phone && (
                <span>
                  <Phone size={15} />
                  {profile.phone}
                </span>
              )}

              {user?.email && (
                <span>
                  <Mail size={15} />
                  {user.email}
                </span>
              )}

            </div>

          </div>


          <div className="hs-profile-strength">

            <div className="hs-profile-strength-circle">
              100%
            </div>

            <div>
              <strong>
                Profile strength
              </strong>

              <span>
                Profile complete
              </span>
            </div>

          </div>

        </section>


        {/* ===================================================
            SUMMARY
            =================================================== */}

        <section className="hs-profile-card">

          <div className="hs-profile-section-heading">

            <div>

              <span className="hs-profile-section-label">
                ABOUT YOU
              </span>

              <h2>
                Professional summary
              </h2>

            </div>


            <button
              className="hs-profile-small-action"
              onClick={openEditProfile}
            >
              <Pencil size={15} />
              Edit
            </button>

          </div>


          <p className="hs-profile-summary">
            {profile?.summary ||
              'Add a short summary about your background, interests and career goals.'}
          </p>

        </section>


        {/* ===================================================
            CAREER PREFERENCES
            =================================================== */}

        <section className="hs-profile-card hs-career-preferences-card">
          <div className="hs-profile-section-heading">
            <div>
              <span className="hs-profile-section-label">WHAT YOU'RE LOOKING FOR</span>
              <h2>Career preferences</h2>
            </div>
          </div>

          <p className="hs-profile-summary" style={{ marginBottom: '24px' }}>
            Tell HireSense what kind of opportunities you want so job recommendations can be more relevant to you.
          </p>

          <form onSubmit={handleSavePreferences}>
            {/* Preferred roles */}
            <div className="hs-preference-block">
              <div className="hs-preference-label-row">
                <div>
                  <strong>Preferred roles</strong>
                  <span>Select roles you're interested in.</span>
                </div>
                <small>{preferences.preferred_roles.length}/10</small>
              </div>

              {preferences.preferred_roles.length > 0 && (
                <div className="hs-preference-chip-list">
                  {preferences.preferred_roles.map((role) => (
                    <span className="hs-preference-chip" key={role}>
                      {role}
                      <button
                        type="button"
                        onClick={() => removePreference('preferred_roles', role)}
                        disabled={preferencesSaving}
                        aria-label={`Remove ${role}`}
                        title={`Remove ${role}`}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="hs-preference-search-wrap">
                <Search size={17} />
                <input
                  type="text"
                  value={roleSearch}
                  onChange={(event) => setRoleSearch(event.target.value)}
                  placeholder="Search or type your own role..."
                  disabled={preferencesSaving || preferences.preferred_roles.length >= 10}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addCustomRole()
                    }
                  }}
                />
              </div>

              {roleSearch.trim() && (
                <div className="hs-preference-options">
                  {filteredRoleOptions
                    .filter(
                      (role) =>
                        !preferences.preferred_roles.some(
                          (selected) => selected.toLowerCase() === role.toLowerCase()
                        )
                    )
                    .map((role) => (
                      <button
                        type="button"
                        key={role}
                        onClick={() => {
                          if (preferences.preferred_roles.length < 10) {
                            setPreferences((previous) => ({
                              ...previous,
                              preferred_roles: [...previous.preferred_roles, role],
                            }))
                          }
                          setRoleSearch('')
                        }}
                        disabled={preferencesSaving}
                      >
                        <Plus size={14} />
                        {role}
                      </button>
                    ))}

                  {filteredRoleOptions.every(
                    (role) =>
                      preferences.preferred_roles.some(
                        (selected) => selected.toLowerCase() === role.toLowerCase()
                      )
                  ) &&
                    !preferences.preferred_roles.some(
                      (selected) => selected.toLowerCase() === roleSearch.trim().toLowerCase()
                    ) && (
                      <button type="button" onClick={addCustomRole} disabled={preferencesSaving}>
                        <Plus size={14} />
                        Add "{roleSearch.trim()}"
                      </button>
                    )}
                </div>
              )}
            </div>

            {/* Preferred locations */}
            <div className="hs-preference-block">
              <div className="hs-preference-label-row">
                <div>
                  <strong>Preferred locations</strong>
                  <span>Choose multiple locations or add your own.</span>
                </div>
                <small>{preferences.preferred_locations.length}/15</small>
              </div>

              {preferences.preferred_locations.length > 0 && (
                <div className="hs-preference-chip-list">
                  {preferences.preferred_locations.map((location) => (
                    <span className="hs-preference-chip hs-preference-chip-blue" key={location}>
                      {location}
                      <button
                        type="button"
                        onClick={() => removePreference('preferred_locations', location)}
                        disabled={preferencesSaving}
                        aria-label={`Remove ${location}`}
                        title={`Remove ${location}`}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="hs-preference-option-grid">
                {locationOptions
                  .filter(
                    (location) =>
                      !preferences.preferred_locations.some(
                        (selected) => selected.toLowerCase() === location.toLowerCase()
                      )
                  )
                  .map((location) => (
                    <button
                      type="button"
                      key={location}
                      className="hs-preference-toggle"
                      onClick={() => updatePreferenceList('preferred_locations', location)}
                      disabled={preferencesSaving || preferences.preferred_locations.length >= 15}
                    >
                      <Plus size={14} />
                      {location}
                    </button>
                  ))}
              </div>

              <div className="hs-preference-custom-row">
                <MapPin size={17} />
                <input
                  type="text"
                  value={locationInput}
                  onChange={(event) => setLocationInput(event.target.value)}
                  placeholder="Add another city, region or location..."
                  disabled={preferencesSaving || preferences.preferred_locations.length >= 15}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addCustomLocation()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addCustomLocation}
                  disabled={
                    preferencesSaving ||
                    !locationInput.trim() ||
                    preferences.preferred_locations.length >= 15
                  }
                >
                  Add
                </button>
              </div>
            </div>

            {/* Work mode */}
            <div className="hs-preference-block">
              <div className="hs-preference-label-row">
                <div>
                  <strong>Work mode</strong>
                  <span>You can select more than one.</span>
                </div>
              </div>

              <div className="hs-preference-option-grid preference-three">
                {workModeOptions.map((mode) => (
                  <button
                    type="button"
                    key={mode}
                    className={`hs-preference-select-card ${
                      preferences.work_modes.includes(mode) ? 'selected' : ''
                    }`}
                    onClick={() => updatePreferenceList('work_modes', mode)}
                    disabled={preferencesSaving}
                  >
                    <span className="hs-preference-check">
                      {preferences.work_modes.includes(mode) ? '✓' : ''}
                    </span>
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Employment type */}
            <div className="hs-preference-block">
              <div className="hs-preference-label-row">
                <div>
                  <strong>Employment type</strong>
                  <span>Select every type you're open to.</span>
                </div>
              </div>

              <div className="hs-preference-option-grid preference-three">
                {employmentTypeOptions.map((type) => (
                  <button
                    type="button"
                    key={type}
                    className={`hs-preference-select-card ${
                      preferences.employment_types.includes(type) ? 'selected' : ''
                    }`}
                    onClick={() => updatePreferenceList('employment_types', type)}
                    disabled={preferencesSaving}
                  >
                    <span className="hs-preference-check">
                      {preferences.employment_types.includes(type) ? '✓' : ''}
                    </span>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience level */}
            <div className="hs-preference-block">
              <div className="hs-preference-label-row">
                <div>
                  <strong>Experience level</strong>
                  <span>Choose the level that best describes what you're targeting.</span>
                </div>
              </div>

              <div className="hs-preference-option-grid preference-three">
                {['Entry Level', 'Mid Level', 'Senior Level'].map((level) => (
                  <button
                    type="button"
                    key={level}
                    className={`hs-preference-select-card ${
                      preferences.experience_level === level ? 'selected' : ''
                    }`}
                    onClick={() => {
                      setPreferencesSuccess('')
                      setPreferencesError('')
                      setPreferences((previous) => ({
                        ...previous,
                        experience_level: level,
                      }))
                    }}
                    disabled={preferencesSaving}
                  >
                    <span className="hs-preference-check">
                      {preferences.experience_level === level ? '✓' : ''}
                    </span>
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {preferencesError && (
              <div className="hs-profile-form-error">
                {preferencesError}
              </div>
            )}

            {preferencesSuccess && (
              <div className="hs-profile-form-success">
                {preferencesSuccess}
              </div>
            )}

            <div className="hs-preferences-save-row">
              <span>
                Your preferences help HireSense personalize job recommendations.
              </span>
              <button
                type="submit"
                className="hs-profile-save-btn"
                disabled={preferencesSaving || preferencesLoading}
              >
                <Save size={16} />
                {preferencesSaving ? 'Saving...' : 'Save preferences'}
              </button>
            </div>
          </form>
        </section>


        {/* ===================================================
            SKILLS
            =================================================== */}

        <section className="hs-profile-card">

          <div className="hs-profile-section-heading">

            <div>

              <span className="hs-profile-section-label">
                YOUR TOOLKIT
              </span>

              <h2>
                Skills
              </h2>

            </div>


            <button
              className="hs-profile-small-action"
              onClick={openSkillModal}
            >
              <Plus size={16} />
              Add skill
            </button>

          </div>


          {skills.length === 0 ? (

            <div className="hs-profile-empty">

              <Code2 size={22} />

              <div>

                <strong>
                  Your skills will appear here
                </strong>

                <span>
                  Add skills to improve your
                  HireSense job matches.
                </span>

              </div>

            </div>

          ) : (

            <div className="hs-profile-skills-grid">

              {skills.map((skill) => (

                <div
                  className="hs-profile-skill-card"
                  key={skill.id}
                >

                  <div className="hs-profile-skill-main">

                    <div className="hs-profile-skill-icon">
                      <Code2 size={17} />
                    </div>


                    <div>

                      <strong>
                        {getSkillName(
                          skill.skill_id
                        )}
                      </strong>

                      <span>
                        {skill.years_used != null
                          ? `${skill.years_used} ${
                              skill.years_used === 1
                                ? 'year'
                                : 'years'
                            }`
                          : 'Experience not specified'}
                      </span>

                    </div>

                  </div>


                  <div className="hs-profile-skill-right">

                    {skill.proficiency != null && (
                      <span className="hs-profile-skill-level">
                        {Math.round(
                          skill.proficiency
                        )}
                        %
                      </span>
                    )}


                    <button
                      className="hs-profile-skill-delete"
                      onClick={() =>
                        handleDeleteSkill(
                          skill.id
                        )
                      }
                      title="Remove skill"
                      aria-label={
                        `Remove ${getSkillName(
                          skill.skill_id
                        )}`
                      }
                    >
                      <Trash2 size={15} />
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>


        {/* ===================================================
            EDUCATION
            =================================================== */}

        <section className="hs-profile-card">
          <div className="hs-profile-section-heading">
            <div>
              <span className="hs-profile-section-label">EDUCATION</span>
              <h2>Education</h2>
            </div>

            <button
              className="hs-profile-small-action"
              onClick={openAddEducation}
            >
              <Plus size={16} />
              Add education
            </button>
          </div>

          {educations.length === 0 ? (
            <div className="hs-profile-empty">
              <GraduationCap size={22} />
              <div>
                <strong>Add your education</strong>
                <span>
                  Showcase your academic background and qualifications.
                </span>
              </div>
            </div>
          ) : (
            <div>
              {educations.map((education) => (
                <div className="hs-profile-item" key={education.id}>
                  <div className="hs-profile-item-icon hs-icon-purple">
                    <GraduationCap size={21} />
                  </div>

                  <div className="hs-profile-item-content">
                    <strong>
                      {education.degree ||
                        education.education_type ||
                        'Education'}
                    </strong>

                    {education.education_type && (
                      <span>{education.education_type}</span>
                    )}

                    {education.field_of_study && (
                      <span>{education.field_of_study}</span>
                    )}

                    <small>
                      {education.institution}
                      {' · '}
                      {formatEducationYears(education)}
                      {education.grade != null
                        ? ` · ${education.score_type || 'Score'} ${education.grade}`
                        : ''}
                    </small>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    marginLeft: 'auto',
                    flexShrink: 0,
                  }}>
                    <button
                      type="button"
                      className="hs-profile-skill-delete"
                      onClick={() => openEditEducation(education)}
                      title="Edit education"
                      aria-label="Edit education"
                      style={{
                        width: '34px',
                        height: '34px',
                        border: '0',
                        borderRadius: '9px',
                        background: '#f1edf8',
                        color: '#6554c0',
                        cursor: 'pointer',
                      }}
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      className="hs-profile-skill-delete"
                      onClick={() => handleDeleteEducation(education.id)}
                      title="Remove education"
                      aria-label="Remove education"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>


        {/* ===================================================
            EXPERIENCE
            =================================================== */}

        <section className="hs-profile-card">

          <div className="hs-profile-section-heading">

            <div>

              <span className="hs-profile-section-label">
                EXPERIENCE
              </span>

              <h2>
                Experience
              </h2>

            </div>


            <button
              className="hs-profile-small-action"
              onClick={openAddExperience}
            >
              <Plus size={16} />
              Add experience
            </button>

          </div>


          {experiences.length === 0 ? (

            <div className="hs-profile-empty">

              <BriefcaseBusiness size={22} />

              <div>

                <strong>
                  Add your experience
                </strong>

                <span>
                  Showcase internships, jobs and other professional experience.
                </span>

              </div>

            </div>

          ) : (

            <div>

              {experiences.map((experience) => (

                <div
                  className="hs-profile-item"
                  key={experience.id}
                >

                  <div className="hs-profile-item-icon hs-icon-peach">
                    <BriefcaseBusiness size={21} />
                  </div>


                  <div className="hs-profile-item-content">

                    <strong>
                      {experience.job_title}
                    </strong>

                    <span>
                      {experience.company_name}
                      {experience.employment_type
                        ? ` · ${experience.employment_type}`
                        : ''}
                    </span>

                    <small>
                      {experience.location
                        ? `${experience.location} · `
                        : ''}
                      {formatExperienceDates(experience)}
                    </small>

                    {experience.description && (
                      <p>
                        {experience.description}
                      </p>
                    )}

                  </div>


                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    marginLeft: 'auto',
                    flexShrink: 0,
                  }}>

                    <button
                      type="button"
                      className="hs-profile-skill-delete"
                      onClick={() => openEditExperience(experience)}
                      title="Edit experience"
                      aria-label="Edit experience"
                      style={{
                        width: '34px',
                        height: '34px',
                        border: '0',
                        borderRadius: '9px',
                        background: '#f1edf8',
                        color: '#6554c0',
                        cursor: 'pointer',
                      }}
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      className="hs-profile-skill-delete"
                      onClick={() =>
                        handleDeleteExperience(experience.id)
                      }
                      title="Remove experience"
                      aria-label="Remove experience"
                    >
                      <Trash2 size={15} />
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>


        {/* ===================================================
            PROJECTS
            =================================================== */}

        <section className="hs-profile-card">

          <div className="hs-profile-section-heading">

            <div>

              <span className="hs-profile-section-label">
                PROJECTS
              </span>

              <h2>
                Projects
              </h2>

            </div>


            <button type="button" className="hs-profile-small-action" onClick={openAddProject}>
              <Plus size={16} />
              Add project
            </button>

          </div>


          {projects.length === 0 ? (
            <div className="hs-profile-empty">
              <FolderKanban size={22} />
              <div>
                <strong>Showcase your projects</strong>
                <span>Add projects that demonstrate your technical skills.</span>
              </div>
            </div>
          ) : (
            <div>
              {projects.map((project) => (
                <div className="hs-profile-item" key={project.id}>
                  <div className="hs-profile-item-icon hs-icon-blue"><FolderKanban size={21} /></div>
                  <div className="hs-profile-item-content">
                    <strong>{project.project_name}</strong>
                    {project.project_type && <span>{project.project_type}</span>}
                    {project.technologies && <small>{project.technologies}</small>}
                    <small>{formatProjectDates(project)}</small>
                    {project.description && <p>{project.description}</p>}
                    {project.project_link && <a href={project.project_link} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '7px', color: '#6554c0', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>View project ↗</a>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto', flexShrink: 0 }}>
                    <button type="button" className="hs-profile-skill-delete" onClick={() => openEditProject(project)} title="Edit project" aria-label="Edit project" style={{ width: '34px', height: '34px', border: '0', borderRadius: '9px', background: '#f1edf8', color: '#6554c0', cursor: 'pointer' }}><Pencil size={15} /></button>
                    <button type="button" className="hs-profile-skill-delete" onClick={() => handleDeleteProject(project.id)} title="Remove project" aria-label="Remove project"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </section>

      </div>


      {/* =====================================================
          EDIT PROFILE MODAL
          ===================================================== */}

      {isEditOpen && (

        <div
          className="hs-profile-modal-overlay"
          onMouseDown={closeEditProfile}
        >

          <div
            className="hs-profile-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="hs-profile-modal-header">

              <div>

                <span className="hs-profile-section-label">
                  PROFILE SETTINGS
                </span>

                <h2>
                  Edit your profile
                </h2>

                <p>
                  Keep your basic information
                  up to date.
                </p>

              </div>


              <button
                className="hs-profile-modal-close"
                onClick={closeEditProfile}
                disabled={saving}
              >
                <X size={19} />
              </button>

            </div>


            <form
              className="hs-profile-form"
              onSubmit={handleSaveProfile}
            >

              <div className="hs-profile-form-grid">

                <label>

                  <span>
                    Full name
                  </span>

                  <input
                    type="text"
                    name="full_name"
                    value={
                      formData.full_name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter your full name"
                    disabled={saving}
                  />

                </label>


                <label>

                  <span>
                    Phone
                  </span>

                  <input
                    type="tel"
                    name="phone"
                    value={
                      formData.phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter your phone number"
                    disabled={saving}
                  />

                </label>


                <label>

                  <span>
                    Location
                  </span>

                  <input
                    type="text"
                    name="location"
                    value={
                      formData.location
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. Haridwar"
                    disabled={saving}
                  />

                </label>

              </div>


              <label>

                <span>
                  Professional summary
                </span>

                <textarea
                  name="summary"
                  value={
                    formData.summary
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Tell recruiters about your background, interests and career goals..."
                  rows="5"
                  disabled={saving}
                />

              </label>


              {saveError && (
                <div className="hs-profile-form-error">
                  {saveError}
                </div>
              )}


              {saveSuccess && (
                <div className="hs-profile-form-success">
                  {saveSuccess}
                </div>
              )}


              <div className="hs-profile-modal-actions">

                <button
                  type="button"
                  className="hs-profile-cancel-btn"
                  onClick={
                    closeEditProfile
                  }
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="hs-profile-save-btn"
                  disabled={saving}
                >
                  <Save size={16} />

                  {saving
                    ? 'Saving...'
                    : 'Save changes'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          ADD / EDIT EXPERIENCE MODAL
          ===================================================== */}

      {isExperienceModalOpen && (

        <div
          className="hs-profile-modal-overlay"
          onMouseDown={closeExperienceModal}
        >

          <div
            className="hs-profile-modal"
            onMouseDown={(event) => event.stopPropagation()}
            style={{
              maxWidth: '620px',
              width: 'calc(100% - 32px)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >

            <div className="hs-profile-modal-header">

              <div>
                <span className="hs-profile-section-label">
                  EXPERIENCE
                </span>

                <h2>
                  {editingExperienceId
                    ? 'Edit experience'
                    : 'Add experience'}
                </h2>

                <p>
                  Add internships, jobs and other professional experience.
                </p>
              </div>

              <button
                type="button"
                className="hs-profile-modal-close"
                onClick={closeExperienceModal}
                disabled={experienceSaving}
              >
                <X size={19} />
              </button>

            </div>


            <form
              className="hs-profile-form"
              onSubmit={handleSaveExperience}
            >

              <div className="hs-profile-form-grid">

                <label>
                  <span>Company / Organization</span>
                  <input
                    type="text"
                    name="company_name"
                    value={experienceForm.company_name}
                    onChange={handleExperienceChange}
                    placeholder="e.g. ABC Technologies"
                    disabled={experienceSaving}
                  />
                </label>

                <label>
                  <span>Job title</span>
                  <input
                    type="text"
                    name="job_title"
                    value={experienceForm.job_title}
                    onChange={handleExperienceChange}
                    placeholder="e.g. Software Development Intern"
                    disabled={experienceSaving}
                  />
                </label>

                <label>
                  <span>Employment type</span>
                  <select
                    name="employment_type"
                    value={experienceForm.employment_type}
                    onChange={handleExperienceChange}
                    disabled={experienceSaving}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Apprenticeship">Apprenticeship</option>
                    <option value="Volunteer">Volunteer</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label>
                  <span>Location</span>
                  <input
                    type="text"
                    name="location"
                    value={experienceForm.location}
                    onChange={handleExperienceChange}
                    placeholder="e.g. Haridwar / Remote"
                    disabled={experienceSaving}
                  />
                </label>

                <label>
                  <span>Start date</span>
                  <input
                    type="month"
                    name="start_date"
                    value={experienceForm.start_date}
                    onChange={handleExperienceChange}
                    disabled={experienceSaving}
                  />
                </label>

                <label>
                  <span>End date</span>
                  <input
                    type="month"
                    name="end_date"
                    value={experienceForm.end_date}
                    onChange={handleExperienceChange}
                    disabled={
                      experienceSaving ||
                      experienceForm.currently_working
                    }
                  />
                </label>

              </div>


              <label
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '4px',
                  marginBottom: '24px',
                  cursor: experienceSaving ? 'default' : 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  name="currently_working"
                  checked={experienceForm.currently_working}
                  onChange={handleExperienceChange}
                  disabled={experienceSaving}
                  style={{
                    width: '17px',
                    height: '17px',
                    accentColor: '#6554c0',
                    cursor: experienceSaving ? 'default' : 'pointer',
                  }}
                />

                <span style={{ margin: 0 }}>
                  I currently work here
                </span>
              </label>


              <label>
                <span>Description</span>
                <textarea
                  name="description"
                  value={experienceForm.description}
                  onChange={handleExperienceChange}
                  placeholder="Describe your responsibilities, achievements, technologies used, or impact..."
                  rows="5"
                  disabled={experienceSaving}
                />
              </label>


              {experienceError && (
                <div className="hs-profile-form-error">
                  {experienceError}
                </div>
              )}


              <div className="hs-profile-modal-actions">

                <button
                  type="button"
                  className="hs-profile-cancel-btn"
                  onClick={closeExperienceModal}
                  disabled={experienceSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="hs-profile-save-btn"
                  disabled={experienceSaving}
                >
                  <Save size={16} />

                  {experienceSaving
                    ? 'Saving...'
                    : editingExperienceId
                      ? 'Save changes'
                      : 'Add experience'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          ADD / EDIT EDUCATION MODAL
          ===================================================== */}

      {isEducationModalOpen && (
        <div
          className="hs-profile-modal-overlay"
          onMouseDown={closeEducationModal}
        >
          <div
            className="hs-profile-modal"
            onMouseDown={(event) => event.stopPropagation()}
            style={{
              maxWidth: '620px',
              width: 'calc(100% - 32px)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div className="hs-profile-modal-header">
              <div>
                <span className="hs-profile-section-label">EDUCATION</span>
                <h2>
                  {editingEducationId ? 'Edit education' : 'Add education'}
                </h2>
                <p>Keep your academic background up to date.</p>
              </div>

              <button
                type="button"
                className="hs-profile-modal-close"
                onClick={closeEducationModal}
                disabled={educationSaving}
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="hs-profile-form"
              onSubmit={handleSaveEducation}
            >
              <div className="hs-profile-form-grid">
                <label>
                  <span>Education type</span>
                  <select
                    name="education_type"
                    value={educationForm.education_type}
                    onChange={handleEducationChange}
                    disabled={educationSaving}
                  >
                    <option value="Class 10">Class 10</option>
                    <option value="Class 12">Class 12</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Doctorate">Doctorate</option>
                    <option value="Certification">Certification</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label>
                  <span>Institution</span>
                  <input
                    type="text"
                    name="institution"
                    value={educationForm.institution}
                    onChange={handleEducationChange}
                    placeholder="e.g. Gurukula Kangri University"
                    disabled={educationSaving}
                  />
                </label>

                <label>
                  <span>Qualification / Program</span>
                  <input
                    type="text"
                    name="degree"
                    value={educationForm.degree}
                    onChange={handleEducationChange}
                    placeholder="e.g. B.Tech / 12th / Diploma in Computer Engineering"
                    disabled={educationSaving}
                  />
                </label>

                <label>
                  <span>Field of study</span>
                  <input
                    type="text"
                    name="field_of_study"
                    value={educationForm.field_of_study}
                    onChange={handleEducationChange}
                    placeholder="e.g. CSE / PCM / Computer Engineering"
                    disabled={educationSaving}
                  />
                </label>

                <label>
                  <span>Score type</span>
                  <select
                    name="score_type"
                    value={educationForm.score_type}
                    onChange={handleEducationChange}
                    disabled={educationSaving}
                  >
                    <option value="Percentage">Percentage</option>
                    <option value="CGPA">CGPA</option>
                    <option value="GPA">GPA</option>
                    <option value="Marks">Marks</option>
                    <option value="Grade">Grade</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label>
                  <span>Score / Grade</span>
                  <input
                    type="number"
                    name="grade"
                    min="0"
                    step="0.1"
                    value={educationForm.grade}
                    onChange={handleEducationChange}
                    placeholder={
                      educationForm.score_type === 'Percentage'
                        ? 'e.g. 88'
                        : educationForm.score_type === 'CGPA'
                          ? 'e.g. 8.5'
                          : 'e.g. 450'
                    }
                    disabled={educationSaving}
                  />
                </label>

                <label>
                  <span>Start year</span>
                  <input
                    type="number"
                    name="start_year"
                    min="1900"
                    max="2100"
                    value={educationForm.start_year}
                    onChange={handleEducationChange}
                    placeholder="e.g. 2023"
                    disabled={educationSaving}
                  />
                </label>

                <label>
                  <span>End year</span>
                  <input
                    type="number"
                    name="end_year"
                    min="1900"
                    max="2100"
                    value={educationForm.end_year}
                    onChange={handleEducationChange}
                    placeholder="e.g. 2027"
                    disabled={educationSaving}
                  />
                </label>
              </div>

              {educationError && (
                <div className="hs-profile-form-error">
                  {educationError}
                </div>
              )}

              <div className="hs-profile-modal-actions">
                <button
                  type="button"
                  className="hs-profile-cancel-btn"
                  onClick={closeEducationModal}
                  disabled={educationSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="hs-profile-save-btn"
                  disabled={educationSaving}
                >
                  <Save size={16} />
                  {educationSaving
                    ? 'Saving...'
                    : editingEducationId
                      ? 'Save changes'
                      : 'Add education'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* =====================================================
          ADD / EDIT PROJECT MODAL
          ===================================================== */}

      {isProjectModalOpen && (
        <div className="hs-profile-modal-overlay" onMouseDown={closeProjectModal}>
          <div className="hs-profile-modal" onMouseDown={(event) => event.stopPropagation()} style={{ maxWidth: '620px', width: 'calc(100% - 32px)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="hs-profile-modal-header">
              <div>
                <span className="hs-profile-section-label">PROJECTS</span>
                <h2>{editingProjectId ? 'Edit project' : 'Add project'}</h2>
                <p>Showcase projects that demonstrate your technical skills.</p>
              </div>
              <button type="button" className="hs-profile-modal-close" onClick={closeProjectModal} disabled={projectSaving}><X size={19} /></button>
            </div>
            <form className="hs-profile-form" onSubmit={handleSaveProject}>
              <div className="hs-profile-form-grid">
                <label><span>Project name</span><input type="text" name="project_name" value={projectForm.project_name} onChange={handleProjectChange} placeholder="e.g. HireSense" disabled={projectSaving} /></label>
                <label><span>Project type</span><select name="project_type" value={projectForm.project_type} onChange={handleProjectChange} disabled={projectSaving}><option>Academic</option><option>Personal</option><option>Internship</option><option>Freelance</option><option>Open Source</option><option>Other</option></select></label>
                <label><span>Technologies</span><input type="text" name="technologies" value={projectForm.technologies} onChange={handleProjectChange} placeholder="e.g. React, FastAPI, MySQL, Docker" disabled={projectSaving} /></label>
                <label><span>Project link</span><input type="url" name="project_link" value={projectForm.project_link} onChange={handleProjectChange} placeholder="https://github.com/..." disabled={projectSaving} /></label>
                <label><span>Start date</span><input type="month" name="start_date" value={projectForm.start_date} onChange={handleProjectChange} disabled={projectSaving} /></label>
                <label><span>End date</span><input type="month" name="end_date" value={projectForm.end_date} onChange={handleProjectChange} disabled={projectSaving || projectForm.currently_working} /></label>
              </div>
              <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '4px', marginBottom: '24px', cursor: projectSaving ? 'default' : 'pointer' }}>
                <input type="checkbox" name="currently_working" checked={projectForm.currently_working} onChange={handleProjectChange} disabled={projectSaving} style={{ width: '17px', height: '17px', accentColor: '#6554c0', cursor: projectSaving ? 'default' : 'pointer' }} />
                <span style={{ margin: 0 }}>I am currently working on this project</span>
              </label>
              <label><span>Description</span><textarea name="description" value={projectForm.description} onChange={handleProjectChange} placeholder="Describe what you built, your role, key features, and impact..." rows="5" disabled={projectSaving} /></label>
              {projectError && <div className="hs-profile-form-error">{projectError}</div>}
              <div className="hs-profile-modal-actions">
                <button type="button" className="hs-profile-cancel-btn" onClick={closeProjectModal} disabled={projectSaving}>Cancel</button>
                <button type="submit" className="hs-profile-save-btn" disabled={projectSaving}><Save size={16} />{projectSaving ? 'Saving...' : editingProjectId ? 'Save changes' : 'Add project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          ADD SKILL MODAL
          ===================================================== */}

      {isSkillModalOpen && (

        <div
          className="hs-profile-modal-overlay"
          onMouseDown={closeSkillModal}
        >

          <div
            className="hs-profile-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
            style={{
              maxWidth: '560px',
              width: 'calc(100% - 32px)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >

            {/* HEADER */}

            <div className="hs-profile-modal-header">

              <div>

                <span className="hs-profile-section-label">
                  YOUR TOOLKIT
                </span>

                <h2>
                  Add a skill
                </h2>

                <p>
                  Add a skill to improve your
                  HireSense job matches.
                </p>

              </div>


              <button
                className="hs-profile-modal-close"
                onClick={
                  closeSkillModal
                }
                disabled={skillSaving}
              >
                <X size={19} />
              </button>

            </div>


            <form
              className="hs-profile-form"
              onSubmit={handleAddSkill}
            >

              {/* =================================================
                  SKILL PICKER
                  ================================================= */}

              <div
                ref={skillPickerRef}
                style={{
                  position: 'relative',
                  marginBottom: '28px',
                }}
              >

                <label
                  style={{
                    display: 'block',
                  }}
                >
                  <span>
                    Skill
                  </span>
                </label>


                <div
                  style={{
                    position: 'relative',
                    marginTop: '8px',
                  }}
                >

                  <Search
                    size={19}
                    style={{
                      position: 'absolute',
                      left: '15px',
                      top: '50%',
                      transform:
                        'translateY(-50%)',
                      color: '#8b8497',
                      pointerEvents:
                        'none',
                    }}
                  />


                  <input
                    type="text"
                    value={
                      skillForm.skill_search
                    }
                    onChange={(
                      event
                    ) => {

                      const value =
                        event.target.value

                      setSkillForm(
                        (previous) => ({
                          ...previous,
                          skill_id: '',
                          skill_search:
                            value,
                        })
                      )

                      setSkillDropdownOpen(
                        true
                      )

                      setSkillError('')

                    }}
                    onFocus={() =>
                      setSkillDropdownOpen(
                        true
                      )
                    }
                    placeholder="Search or type a skill..."
                    disabled={
                      skillSaving
                    }
                    style={{
                      width: '100%',
                      minHeight: '52px',
                      boxSizing:
                        'border-box',
                      padding:
                        '0 45px 0 45px',
                      border:
                        '1px solid #ddd7e7',
                      borderRadius:
                        '14px',
                      background:
                        '#fff',
                      color:
                        '#302a3b',
                      fontSize:
                        '15px',
                      outline:
                        'none',
                    }}
                  />


                  {skillForm.skill_id ? (

                    <button
                      type="button"
                      onClick={
                        clearSelectedSkill
                      }
                      disabled={
                        skillSaving
                      }
                      style={{
                        position:
                          'absolute',
                        right: '12px',
                        top: '50%',
                        transform:
                          'translateY(-50%)',
                        width: '30px',
                        height: '30px',
                        display:
                          'grid',
                        placeItems:
                          'center',
                        border: '0',
                        borderRadius:
                          '9px',
                        background:
                          '#f1edf8',
                        color:
                          '#746b82',
                        cursor:
                          'pointer',
                      }}
                    >
                      <X size={15} />
                    </button>

                  ) : (

                    <ChevronDown
                      size={19}
                      style={{
                        position:
                          'absolute',
                        right: '15px',
                        top: '50%',
                        transform:
                          'translateY(-50%)',
                        color:
                          '#746b82',
                        pointerEvents:
                          'none',
                      }}
                    />

                  )}

                </div>


                {/* =================================================
                    DROPDOWN
                    ================================================= */}

                {skillDropdownOpen && (

                  <div
                    style={{
                      position:
                        'absolute',
                      zIndex: 100,
                      left: 0,
                      right: 0,
                      top: '76px',
                      maxHeight:
                        '280px',
                      overflowY:
                        'auto',
                      overscrollBehavior:
                        'contain',
                      padding:
                        '7px',
                      border:
                        '1px solid #e2ddeb',
                      borderRadius:
                        '14px',
                      background:
                        '#fff',
                      boxShadow:
                        '0 18px 45px rgba(52, 43, 70, 0.18)',
                    }}
                  >

                    {filteredSkills.length > 0 ? (

                      filteredSkills.map(
                        (skill) => (

                          <button
                            type="button"
                            key={
                              skill.id
                            }
                            onClick={() =>
                              selectSkill(
                                skill
                              )
                            }
                            style={{
                              width:
                                '100%',
                              display:
                                'flex',
                              alignItems:
                                'center',
                              justifyContent:
                                'space-between',
                              gap:
                                '12px',
                              padding:
                                '13px 12px',
                              border:
                                '0',
                              borderRadius:
                                '10px',
                              background:
                                'transparent',
                              textAlign:
                                'left',
                              cursor:
                                'pointer',
                            }}
                            onMouseEnter={(
                              event
                            ) => {
                              event.currentTarget.style.background =
                                '#f4f0ff'
                            }}
                            onMouseLeave={(
                              event
                            ) => {
                              event.currentTarget.style.background =
                                'transparent'
                            }}
                          >

                            <span
                              style={{
                                fontWeight:
                                  600,
                                color:
                                  '#302a3b',
                                fontSize:
                                  '14px',
                              }}
                            >
                              {
                                skill.name
                              }
                            </span>


                            {skill.category && (

                              <span
                                style={{
                                  flexShrink:
                                    0,
                                  padding:
                                    '4px 8px',
                                  borderRadius:
                                    '999px',
                                  background:
                                    '#f2eef9',
                                  color:
                                    '#766b88',
                                  fontSize:
                                    '11px',
                                }}
                              >
                                {
                                  skill.category
                                }
                              </span>

                            )}

                          </button>

                        )
                      )

                    ) : skillForm.skill_search.trim() ? (

                      <div
                        style={{
                          padding:
                            '18px 14px',
                          textAlign:
                            'center',
                        }}
                      >

                        <div
                          style={{
                            color:
                              '#71697d',
                            fontSize:
                              '13px',
                            marginBottom:
                              '12px',
                          }}
                        >
                          No existing skill
                          matches{' '}

                          <strong>
                            "
                            {
                              skillForm.skill_search
                            }
                            "
                          </strong>
                        </div>


                        <button
                          type="button"
                          onClick={() => {
                            setSkillDropdownOpen(
                              false
                            )
                            setSkillError('')
                          }}
                          style={{
                            width:
                              '100%',
                            padding:
                              '11px 14px',
                            border:
                              '1px solid #dcd2f4',
                            borderRadius:
                              '10px',
                            background:
                              '#f6f2ff',
                            color:
                              '#6554c0',
                            fontWeight:
                              600,
                            cursor:
                              'pointer',
                          }}
                        >

                          <Plus
                            size={15}
                            style={{
                              verticalAlign:
                                'middle',
                              marginRight:
                                '6px',
                            }}
                          />

                          Use "
                          {
                            skillForm.skill_search
                          }
                          " as a new skill

                        </button>

                      </div>

                    ) : (

                      <div
                        style={{
                          padding:
                            '20px 14px',
                          textAlign:
                            'center',
                          color:
                            '#91899e',
                          fontSize:
                            '13px',
                        }}
                      >
                        Start typing to
                        search skills.
                      </div>

                    )}

                  </div>

                )}

              </div>


              {/* =================================================
                  PROFICIENCY + YEARS
                  ================================================= */}

              <div
                className="hs-profile-form-grid"
                style={{
                  gap: '28px',
                  marginTop: '0',
                  marginBottom:
                    '26px',
                }}
              >

                <label>

                  <span>
                    Proficiency (%)
                  </span>

                  <input
                    type="number"
                    name="proficiency"
                    min="0"
                    max="100"
                    step="1"
                    value={
                      skillForm.proficiency
                    }
                    onChange={
                      handleSkillChange
                    }
                    placeholder="e.g. 85"
                    disabled={
                      skillSaving
                    }
                  />

                </label>


                <label>

                  <span>
                    Years used
                  </span>

                  <input
                    type="number"
                    name="years_used"
                    min="0"
                    step="0.5"
                    value={
                      skillForm.years_used
                    }
                    onChange={
                      handleSkillChange
                    }
                    placeholder="e.g. 2"
                    disabled={
                      skillSaving
                    }
                  />

                  <small
                    style={{
                      display:
                        'block',
                      marginTop:
                        '7px',
                      color:
                        '#91899e',
                      fontSize:
                        '11px',
                    }}
                  >
                    Optional — duration
                    only
                  </small>

                </label>

              </div>


              {/* ERROR */}

              {skillError && (

                <div className="hs-profile-form-error">
                  {skillError}
                </div>

              )}


              {/* ACTIONS */}

              <div className="hs-profile-modal-actions">

                <button
                  type="button"
                  className="hs-profile-cancel-btn"
                  onClick={
                    closeSkillModal
                  }
                  disabled={
                    skillSaving
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="hs-profile-save-btn"
                  disabled={
                    skillSaving
                  }
                >
                  <Save size={16} />

                  {skillSaving
                    ? 'Adding...'
                    : 'Add skill'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </AppShell>
  )
}


export default CandidateProfilePage