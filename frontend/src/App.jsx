import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import './App.css'
import { AuthProvider } from './context/AuthContext'
import ApplicationsPage from './pages/candidate/ApplicationsPage'
import CandidateProfilePage from './pages/candidate/CandidateProfilePage'
import LoginPage from './pages/auth/LoginPage'
import CandidateDashboardPage from './pages/candidate/CandidateDashboardPage'
import FindJobsPage from './pages/candidate/jobs/FindJobsPage'
import JobDetailsPage from './pages/candidate/jobs/JobDetailsPage'
import RecruiterDashboardPage from './pages/recruiter/RecruiterDashboardPage'
import RecruiterJobsPage from './pages/recruiter/RecruiterJobsPage'
import RecruiterApplicationsPage from './pages/recruiter/RecruiterApplicationsPage'
import ResumePage from './pages/candidate/ResumePage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          
          {/* Candidate */}
          <Route
            path="/candidate"
            element={<CandidateDashboardPage />}
          />
          <Route
            path="/candidate/jobs"
            element={<FindJobsPage />}
          />
          <Route
            path="/candidate/jobs/:jobId"
            element={<JobDetailsPage />}
          />
          <Route
            path="/candidate/applications"
            element={<ApplicationsPage />}
          />
          <Route
            path="/candidate/profile"
            element={<CandidateProfilePage />}
          />
          <Route 
            path="/candidate/resume"
            element={<ResumePage />}
          />

          {/* Recruiter */}
          <Route
            path="/recruiter"
            element={<RecruiterDashboardPage />}
          />
          <Route
            path="/recruiter/jobs"
            element={<RecruiterJobsPage />}
          />
          <Route
            path="/recruiter/applications"
            element={<RecruiterApplicationsPage />}
          />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
