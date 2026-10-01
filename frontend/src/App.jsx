import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import './App.css'

import { AuthProvider } from './context/AuthContext'

// =========================================================
// AUTH
// =========================================================

import LoginPage from './pages/auth/LoginPage'

// =========================================================
// COMMON
// =========================================================

import SettingsPage from './pages/SettingsPage'

// =========================================================
// CANDIDATE
// =========================================================

import CandidateDashboardPage
  from './pages/candidate/CandidateDashboardPage'

import ApplicationsPage
  from './pages/candidate/ApplicationsPage'

import CandidateProfilePage
  from './pages/candidate/CandidateProfilePage'

import FindJobsPage
  from './pages/candidate/jobs/FindJobsPage'

import JobDetailsPage
  from './pages/candidate/jobs/JobDetailsPage'

import ResumePage
  from './pages/candidate/ResumePage'

// =========================================================
// RECRUITER
// =========================================================

import RecruiterDashboardPage
  from './pages/recruiter/RecruiterDashboardPage'

import RecruiterJobsPage
  from './pages/recruiter/RecruiterJobsPage'

import RecruiterApplicationsPage
  from './pages/recruiter/RecruiterApplicationsPage'

import RecruiterAnalyticsPage
  from './pages/recruiter/RecruiterAnalyticsPage'

// =========================================================
// PLACEMENT OFFICER
// =========================================================

import PlacementOfficerDashboardPage
  from './pages/placement/PlacementOfficerDashboardPage'

import PlacementOfficerCandidatesPage
  from './pages/placement/PlacementOfficerCandidatesPage'

import PlacementOfficerRecruitersPage
  from './pages/placement/PlacementOfficerRecruitersPage'

import PlacementOfficerDrivesPage
  from './pages/placement/PlacementOfficerDrivesPage'

import PlacementOfficerApplicationsPage
  from './pages/placement/PlacementOfficerApplicationsPage'


function App() {
  return (
    <BrowserRouter>

      <AuthProvider>

        <Routes>

          {/* =================================================
              AUTH
          ================================================= */}

          <Route
            path="/"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

          <Route
            path="/login"
            element={<LoginPage />}
          />


          {/* =================================================
              COMMON
          ================================================= */}

          <Route
            path="/settings"
            element={<SettingsPage />}
          />


          {/* =================================================
              CANDIDATE
          ================================================= */}

          <Route
            path="/candidate"
            element={
              <CandidateDashboardPage />
            }
          />

          <Route
            path="/candidate/jobs"
            element={
              <FindJobsPage />
            }
          />

          <Route
            path="/candidate/jobs/:jobId"
            element={
              <JobDetailsPage />
            }
          />

          <Route
            path="/candidate/applications"
            element={
              <ApplicationsPage />
            }
          />

          <Route
            path="/candidate/profile"
            element={
              <CandidateProfilePage />
            }
          />

          <Route
            path="/candidate/resume"
            element={
              <ResumePage />
            }
          />


          {/* =================================================
              RECRUITER
          ================================================= */}

          <Route
            path="/recruiter"
            element={
              <RecruiterDashboardPage />
            }
          />

          <Route
            path="/recruiter/jobs"
            element={
              <RecruiterJobsPage />
            }
          />

          <Route
            path="/recruiter/applications"
            element={
              <RecruiterApplicationsPage />
            }
          />

          <Route
            path="/recruiter/analytics"
            element={
              <RecruiterAnalyticsPage />
            }
          />


          {/* =================================================
              PLACEMENT OFFICER
          ================================================= */}

          <Route
            path="/placement-officer"
            element={
              <PlacementOfficerDashboardPage />
            }
          />

          <Route
            path="/placement-officer/candidates"
            element={
              <PlacementOfficerCandidatesPage />
            }
          />

          <Route
            path="/placement-officer/recruiters"
            element={
              <PlacementOfficerRecruitersPage />
            }
          />

          <Route
            path="/placement-officer/drives"
            element={
              <PlacementOfficerDrivesPage />
            }
          />

          <Route
            path="/placement-officer/applications"
            element={
              <PlacementOfficerApplicationsPage />
            }
          />


          {/* =================================================
              FALLBACK
          ================================================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

        </Routes>

      </AuthProvider>

    </BrowserRouter>
  )
}

export default App