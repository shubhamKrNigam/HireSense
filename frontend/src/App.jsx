import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom'

import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import './App.css'

import { AuthProvider } from './context/AuthContext'

// =========================================================
// AUTH
// =========================================================

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// =========================================================
// COMMON
// =========================================================

import SettingsPage from './pages/SettingsPage'
import NotificationsPage from './pages/NotificationsPage'

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

import RecruiterCompanyPage
  from './pages/recruiter/RecruiterCompanyPage'

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


// =========================================================
// FORGOT PASSWORD
// =========================================================
//
// This is the frontend recovery screen.
//
// Real email/OTP delivery is intentionally NOT faked here.
// The backend email verification flow can be connected later.
//
// =========================================================

function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()

    if (!email.trim()) {
      return
    }

    /*
     * Email/OTP backend is not connected yet.
     *
     * We deliberately do not pretend that an email was sent.
     * Once the backend recovery endpoint exists, this is where
     * the API request should be added.
     */

    setSubmitted(true)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        boxSizing: 'border-box',
        background:
          'radial-gradient(circle at 10% 10%, rgba(99, 88, 255, 0.10), transparent 32%), radial-gradient(circle at 90% 90%, rgba(99, 88, 255, 0.08), transparent 32%), #f7f8fc',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >

      <div
        style={{
          width: '100%',
          maxWidth: '1080px',
          display: 'grid',
          gridTemplateColumns:
            'minmax(0, 1fr) minmax(380px, 460px)',
          gap: '70px',
          alignItems: 'center',
        }}
      >

        {/* =====================================================
            LEFT
        ====================================================== */}

        <div
          style={{
            padding: '20px',
          }}
        >

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '70px',
            }}
          >

            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background:
                  'linear-gradient(135deg, #6257ff, #756aff)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow:
                  '0 12px 30px rgba(98, 87, 255, 0.25)',
              }}
            >
              <Sparkles size={22} />
            </div>

            <div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#172033',
                  lineHeight: 1.1,
                }}
              >
                HireSense
              </div>

              <div
                style={{
                  marginTop: '4px',
                  fontSize: '12px',
                  color: '#8791a8',
                }}
              >
                Placement Intelligence
              </div>
            </div>

          </div>

          <div
            style={{
              maxWidth: '590px',
            }}
          >

            <div
              style={{
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: '#6257ff',
                marginBottom: '18px',
              }}
            >
              Secure account recovery
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(42px, 5vw, 70px)',
                lineHeight: 0.98,
                letterSpacing: '-0.045em',
                color: '#172033',
                fontWeight: 800,
              }}
            >
              Get back to
              <br />
              your workspace.
            </h1>

            <p
              style={{
                marginTop: '28px',
                maxWidth: '540px',
                fontSize: '17px',
                lineHeight: 1.7,
                color: '#65718a',
              }}
            >
              Enter your registered email address to begin
              recovering access to your HireSense account.
            </p>

            <div
              style={{
                marginTop: '48px',
                paddingTop: '24px',
                borderTop: '1px solid #e2e6ef',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                maxWidth: '520px',
              }}
            >

              <div
                style={{
                  width: '38px',
                  height: '38px',
                  flexShrink: 0,
                  borderRadius: '11px',
                  background: '#eeecff',
                  color: '#6257ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={19} />
              </div>

              <div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#172033',
                  }}
                >
                  Secure recovery
                </div>

                <div
                  style={{
                    marginTop: '5px',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    color: '#7c879d',
                  }}
                >
                  Account recovery will use verified email
                  authentication.
                </div>
              </div>

            </div>

          </div>

        </div>


        {/* =====================================================
            CARD
        ====================================================== */}

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e8eaf1',
            borderRadius: '24px',
            padding: '38px',
            boxShadow:
              '0 24px 70px rgba(30, 38, 60, 0.10)',
          }}
        >

          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              border: 'none',
              background: 'transparent',
              padding: 0,
              color: '#59657d',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '32px',
            }}
          >
            <ArrowLeft size={16} />
            Back to login
          </button>


          {!submitted ? (
            <>

              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#6257ff',
                  marginBottom: '12px',
                }}
              >
                Account recovery
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: '32px',
                  lineHeight: 1.15,
                  letterSpacing: '-0.035em',
                  color: '#172033',
                }}
              >
                Forgot your password?
              </h2>

              <p
                style={{
                  marginTop: '12px',
                  marginBottom: '30px',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: '#78849a',
                }}
              >
                Enter the email address associated with
                your HireSense account.
              </p>


              <form onSubmit={handleSubmit}>

                <label
                  htmlFor="recovery-email"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#4d586d',
                  }}
                >
                  Email address
                </label>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    height: '52px',
                    padding: '0 15px',
                    border: '1px solid #dfe3ec',
                    borderRadius: '12px',
                    background: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                >

                  <Mail
                    size={18}
                    color="#8993a8"
                  />

                  <input
                    id="recovery-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      fontSize: '14px',
                      color: '#172033',
                      background: 'transparent',
                    }}
                  />

                </div>


                <button
                  type="submit"
                  style={{
                    width: '100%',
                    height: '52px',
                    marginTop: '18px',
                    border: 'none',
                    borderRadius: '12px',
                    background:
                      'linear-gradient(135deg, #6257ff, #6f63ff)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '9px',
                    boxShadow:
                      '0 12px 24px rgba(98, 87, 255, 0.20)',
                  }}
                >
                  Continue
                  <ArrowRight size={17} />
                </button>

              </form>

            </>
          ) : (

            <div
              style={{
                textAlign: 'center',
                padding: '20px 4px 8px',
              }}
            >

              <div
                style={{
                  width: '58px',
                  height: '58px',
                  margin: '0 auto 20px',
                  borderRadius: '50%',
                  background: '#ecfdf3',
                  color: '#0a8a4b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={28} />
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: '26px',
                  color: '#172033',
                }}
              >
                Recovery is ready
              </h2>

              <p
                style={{
                  marginTop: '12px',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: '#748096',
                }}
              >
                We have your recovery email:
              </p>

              <div
                style={{
                  marginTop: '10px',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  background: '#f6f7fb',
                  color: '#30394d',
                  fontSize: '14px',
                  fontWeight: 700,
                  wordBreak: 'break-word',
                }}
              >
                {email}
              </div>

              <p
                style={{
                  marginTop: '18px',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: '#8a94a8',
                }}
              >
                Email/OTP delivery will be activated when
                the HireSense verification service is connected.
              </p>

              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  width: '100%',
                  height: '50px',
                  marginTop: '18px',
                  border: 'none',
                  borderRadius: '11px',
                  background: '#6257ff',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Return to login
              </button>

            </div>

          )}

          <div
            style={{
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '1px solid #edf0f5',
              textAlign: 'center',
              fontSize: '11px',
              color: '#a0a8b8',
            }}
          >
            HireSense Placement Intelligence Platform
          </div>

        </div>

      </div>

      <style>
        {`
          @media (max-width: 850px) {
            div[style*="minmax(0, 1fr) minmax(380px, 460px)"] {
              grid-template-columns: 1fr !important;
              gap: 25px !important;
              max-width: 560px !important;
            }

            div[style*="minmax(0, 1fr) minmax(380px, 460px)"] > div:first-child {
              padding: 0 !important;
            }

            div[style*="minmax(0, 1fr) minmax(380px, 460px)"] > div:first-child > div:first-child {
              margin-bottom: 30px !important;
            }
          }

          @media (max-width: 520px) {
            div[style*="minmax(0, 1fr) minmax(380px, 460px)"] > div:last-child {
              padding: 26px !important;
              border-radius: 18px !important;
            }
          }
        `}
      </style>

    </div>
  )
}


// =========================================================
// APP
// =========================================================

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
            element={
              <LoginPage />
            }
          />

          <Route
            path="/register"
            element={
              <RegisterPage />
            }
          />

          <Route
            path="/forgot-password"
            element={
              <ForgotPasswordPage />
            }
          />


          {/* =================================================
              COMMON
          ================================================= */}

          <Route
            path="/settings"
            element={
              <SettingsPage />
            }
          />

          <Route
            path="/notifications"
            element={
              <NotificationsPage />
            }
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

          <Route
            path="/recruiter/company"
            element={
              <RecruiterCompanyPage />
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