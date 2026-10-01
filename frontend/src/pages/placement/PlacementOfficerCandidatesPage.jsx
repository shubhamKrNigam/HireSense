import { useEffect, useMemo, useState } from 'react'
import {
  Users,
  Search,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  XCircle,
} from 'lucide-react'

import AppShell from '../../components/layout/AppShell'
import api from '../../services/api'

function PlacementOfficerCandidatesPage() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // =========================================================
  // LOAD CANDIDATES
  // =========================================================

  async function loadCandidates() {
    try {
      setError('')

      if (candidates.length === 0) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      const response = await api.get(
        '/placement-officer/candidates'
      )

      const data = response.data

      /*
       * Backend returns:
       *
       * {
       *   role: "placement_officer",
       *   count: 2,
       *   candidates: [...]
       * }
       */

      if (Array.isArray(data?.candidates)) {
        setCandidates(data.candidates)
      } else if (Array.isArray(data)) {
        setCandidates(data)
      } else {
        setCandidates([])
        setError(
          'The server returned an unexpected candidate response.'
        )
      }
    } catch (err) {
      console.error(
        'Failed to load candidates:',
        err
      )

      setError(
        err.response?.data?.detail ||
          'Unable to load candidates.'
      )

      setCandidates([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadCandidates()
  }, [])

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return candidates
    }

    return candidates.filter((candidate) => {
      return (
        candidate.name
          ?.toLowerCase()
          .includes(query) ||
        candidate.email
          ?.toLowerCase()
          .includes(query) ||
        candidate.phone
          ?.toLowerCase()
          .includes(query) ||
        candidate.location
          ?.toLowerCase()
          .includes(query)
      )
    })
  }, [candidates, search])

  // =========================================================
  // HELPERS
  // =========================================================

  function getInitials(name) {
    if (!name) return 'U'

    const parts = name
      .trim()
      .split(/\s+/)

    if (parts.length === 1) {
      return parts[0]
        .charAt(0)
        .toUpperCase()
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase()
  }

  function getCandidateStatus(candidate) {
    if (
      Number(candidate.selected_count || 0) > 0
    ) {
      return {
        label: 'Selected',
        type: 'selected',
      }
    }

    if (
      Number(candidate.interview_count || 0) > 0
    ) {
      return {
        label: 'Interview',
        type: 'interview',
      }
    }

    if (
      Number(candidate.shortlisted_count || 0) > 0
    ) {
      return {
        label: 'Shortlisted',
        type: 'shortlisted',
      }
    }

    if (
      Number(candidate.rejected_count || 0) > 0 &&
      Number(candidate.application_count || 0) > 0
    ) {
      return {
        label: 'Rejected',
        type: 'rejected',
      }
    }

    if (
      Number(candidate.application_count || 0) > 0
    ) {
      return {
        label: 'Applied',
        type: 'applied',
      }
    }

    return {
      label: 'No applications',
      type: 'none',
    }
  }

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalApplications = candidates.reduce(
    (total, candidate) =>
      total +
      Number(
        candidate.application_count || 0
      ),
    0
  )

  const totalInterviews = candidates.reduce(
    (total, candidate) =>
      total +
      Number(
        candidate.interview_count || 0
      ),
    0
  )

  const totalSelected = candidates.reduce(
    (total, candidate) =>
      total +
      Number(
        candidate.selected_count || 0
      ),
    0
  )

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <AppShell
      role="placement_officer"
      userName="Placement Officer"
    >
      <div className="hs-page po-candidates-page">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="po-candidates-header">

          <div>
            <span className="hs-eyebrow">
              Placement Office
            </span>

            <h1>
              Candidates
            </h1>

            <p>
              Monitor registered candidates and
              their placement activity.
            </p>
          </div>

          <button
            type="button"
            className="po-refresh-button"
            onClick={loadCandidates}
            disabled={
              loading || refreshing
            }
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? 'po-spin'
                  : ''
              }
            />

            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>

        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="po-error">
            {error}
          </div>
        )}

        {/* =====================================================
            SUMMARY CARDS
        ====================================================== */}

        {!loading && (
          <div className="po-stats-grid">

            {/* REGISTERED */}

            <div className="po-stat-card po-stat-purple">

              <div className="po-stat-icon">
                <Users size={20} />
              </div>

              <div className="po-stat-content">

                <span>
                  Registered Candidates
                </span>

                <strong>
                  {candidates.length}
                </strong>

              </div>

            </div>

            {/* APPLICATIONS */}

            <div className="po-stat-card po-stat-yellow">

              <div className="po-stat-icon">
                <BriefcaseBusiness
                  size={20}
                />
              </div>

              <div className="po-stat-content">

                <span>
                  Applications
                </span>

                <strong>
                  {totalApplications}
                </strong>

              </div>

            </div>

            {/* INTERVIEWS */}

            <div className="po-stat-card po-stat-green">

              <div className="po-stat-icon">
                <Clock3 size={20} />
              </div>

              <div className="po-stat-content">

                <span>
                  Interviews
                </span>

                <strong>
                  {totalInterviews}
                </strong>

              </div>

            </div>

            {/* SELECTED */}

            <div className="po-stat-card po-stat-blue">

              <div className="po-stat-icon">
                <CheckCircle2
                  size={20}
                />
              </div>

              <div className="po-stat-content">

                <span>
                  Selected
                </span>

                <strong>
                  {totalSelected}
                </strong>

              </div>

            </div>

          </div>
        )}

        {/* =====================================================
            REGISTRY
        ====================================================== */}

        <div className="po-registry-card">

          {/* REGISTRY HEADER */}

          <div className="po-registry-header">

            <div>

              <h2>
                Candidate Registry
              </h2>

              <span>
                {filteredCandidates.length}{' '}
                {filteredCandidates.length === 1
                  ? 'candidate'
                  : 'candidates'}
              </span>

            </div>

            <div className="po-search">

              <Search size={17} />

              <input
                type="search"
                placeholder="Search candidates..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

            </div>

          </div>

          {/* ===================================================
              LOADING
          ==================================================== */}

          {loading ? (

            <div className="po-empty-state">

              <RefreshCw
                size={28}
                className="po-spin"
              />

              <strong>
                Loading candidates...
              </strong>

              <span>
                Fetching candidate records.
              </span>

            </div>

          ) : filteredCandidates.length === 0 ? (

            /* =================================================
               EMPTY
            ================================================== */

            <div className="po-empty-state">

              <Users size={34} />

              <strong>
                {search
                  ? 'No candidates found'
                  : 'No candidates registered'}
              </strong>

              <span>
                {search
                  ? 'Try searching by name, email, phone or location.'
                  : 'Candidate records will appear here.'}
              </span>

            </div>

          ) : (

            /* =================================================
               TABLE
            ================================================== */

            <div className="po-table-container">

              <table className="po-table">

                <thead>

                  <tr>

                    <th>
                      Candidate
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Location
                    </th>

                    <th className="po-center">
                      Applications
                    </th>

                    <th className="po-center">
                      Interview
                    </th>

                    <th className="po-center">
                      Selected
                    </th>

                    <th className="po-center">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredCandidates.map(
                    (candidate) => {

                      const status =
                        getCandidateStatus(
                          candidate
                        )

                      return (
                        <tr
                          key={
                            candidate.candidate_id
                          }
                        >

                          {/* ============================
                              CANDIDATE
                          ============================= */}

                          <td>

                            <div className="po-candidate">

                              <div className="po-avatar">
                                {getInitials(
                                  candidate.name
                                )}
                              </div>

                              <div className="po-candidate-info">

                                <strong>
                                  {candidate.name ||
                                    'Unknown candidate'}
                                </strong>

                                <span>
                                  Candidate #
                                  {
                                    candidate.candidate_id
                                  }
                                </span>

                              </div>

                            </div>

                          </td>

                          {/* ============================
                              CONTACT
                          ============================= */}

                          <td>

                            <div className="po-contact">

                              {candidate.email && (
                                <div>
                                  <Mail
                                    size={14}
                                  />

                                  <span>
                                    {
                                      candidate.email
                                    }
                                  </span>
                                </div>
                              )}

                              {candidate.phone && (
                                <div>
                                  <Phone
                                    size={14}
                                  />

                                  <span>
                                    {
                                      candidate.phone
                                    }
                                  </span>
                                </div>
                              )}

                            </div>

                          </td>

                          {/* ============================
                              LOCATION
                          ============================= */}

                          <td>

                            <div className="po-location">

                              <MapPin
                                size={15}
                              />

                              <span>
                                {candidate.location ||
                                  '—'}
                              </span>

                            </div>

                          </td>

                          {/* ============================
                              APPLICATIONS
                          ============================= */}

                          <td className="po-center">

                            <span className="po-number">
                              {
                                candidate.application_count ||
                                0
                              }
                            </span>

                          </td>

                          {/* ============================
                              INTERVIEW
                          ============================= */}

                          <td className="po-center">

                            <span className="po-number">
                              {
                                candidate.interview_count ||
                                0
                              }
                            </span>

                          </td>

                          {/* ============================
                              SELECTED
                          ============================= */}

                          <td className="po-center">

                            <span className="po-selected-count">

                              <CheckCircle2
                                size={15}
                              />

                              {
                                candidate.selected_count ||
                                0
                              }

                            </span>

                          </td>

                          {/* ============================
                              STATUS
                          ============================= */}

                          <td className="po-center">

                            <span
                              className={`po-status po-status-${status.type}`}
                            >
                              {status.label}
                            </span>

                          </td>

                        </tr>
                      )
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </AppShell>
  )
}

export default PlacementOfficerCandidatesPage