import { useState } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  KeyRound,
  UserPlus,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')

    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setError('Please enter your email address.')
      return
    }

    if (!password) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)

    try {
      const data = await login(
        trimmedEmail,
        password,
      )

      switch (data.role) {
        case 'candidate':
          navigate('/candidate', {
            replace: true,
          })
          break

        case 'recruiter':
          navigate('/recruiter', {
            replace: true,
          })
          break

        case 'placement_officer':
          navigate('/placement-officer', {
            replace: true,
          })
          break

        case 'admin':
          navigate('/admin', {
            replace: true,
          })
          break

        default:
          setError(
            'Your account has an unsupported role.',
          )
          break
      }
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        'Unable to sign in. Please check your credentials.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hs-login-page">

      {/* BACKGROUND */}
      <div className="hs-login-background">
        <div className="hs-glow hs-glow-one" />
        <div className="hs-glow hs-glow-two" />
      </div>

      <div className="hs-login-layout">

        {/* =====================================================
            LEFT BRANDING
        ===================================================== */}

        <section className="hs-login-intro">

          <div className="hs-login-brand">

            <div className="hs-login-logo">
              <Sparkles size={21} />
            </div>

            <div>
              <strong>HireSense</strong>
              <span>Placement Intelligence</span>
            </div>

          </div>

          <div className="hs-login-headline">

            <span className="hs-login-eyebrow">
              AI-powered career intelligence
            </span>

            <h1>
              Make better
              <br />
              career decisions.
            </h1>

            <p>
              Discover opportunities matched to your
              skills, experience, education, and career
              profile.
            </p>

          </div>

          <div className="hs-login-feature">

            <div className="hs-feature-icon">
              <Sparkles size={17} />
            </div>

            <div>
              <strong>
                Explainable matching
              </strong>

              <span>
                Understand exactly why an opportunity
                matches your profile.
              </span>
            </div>

          </div>

        </section>


        {/* =====================================================
            LOGIN CARD
        ===================================================== */}

        <section className="hs-login-card">

          {/* Mobile brand */}

          <div className="hs-mobile-brand">

            <div className="hs-login-logo">
              <Sparkles size={19} />
            </div>

            <strong>HireSense</strong>

          </div>


          {/* Header */}

          <div className="hs-login-header">

            <span className="hs-login-card-eyebrow">
              Welcome back
            </span>

            <h2>
              Sign in to your workspace
            </h2>

            <p>
              Continue to your personalized
              HireSense experience.
            </p>

          </div>


          {/* Error */}

          {error && (
            <div
              className="hs-login-error"
              role="alert"
            >
              {error}
            </div>
          )}


          {/* =====================================================
              LOGIN FORM
          ===================================================== */}

          <form
            className="hs-login-form"
            onSubmit={handleSubmit}
          >

            {/* EMAIL */}

            <div className="hs-field">

              <label htmlFor="login-email">
                Email address
              </label>

              <div className="hs-input-wrapper">

                <Mail size={17} />

                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="hs-field">

              <div className="hs-password-label-row">

                <label htmlFor="login-password">
                  Password
                </label>

                <button
                  type="button"
                  className="hs-forgot-link"
                  onClick={() =>
                    navigate('/forgot-password')
                  }
                  disabled={loading}
                >
                  Forgot password?
                </button>

              </div>


              <div className="hs-input-wrapper">

                <LockKeyhole size={17} />

                <input
                  id="login-password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="hs-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current,
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>

            </div>


            {/* SIGN IN */}

            <button
              type="submit"
              className="hs-login-button"
              disabled={loading}
            >

              {loading ? (
                <span className="hs-button-loader">
                  Signing in...
                </span>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight size={17} />
                </>
              )}

            </button>

          </form>


          {/* =====================================================
              CREATE ACCOUNT
          ===================================================== */}

          <div className="hs-auth-register">

            <div className="hs-auth-register-text">
              <span>
                Don't have an account?
              </span>

              <button
                type="button"
                className="hs-auth-link-button"
                onClick={() =>
                  navigate('/register')
                }
              >
                <UserPlus size={14} />
                Create an account
              </button>
            </div>

          </div>


          {/* FOOTER */}

          <div className="hs-login-footer">

            <span>
              HireSense Placement Intelligence Platform
            </span>

          </div>

        </section>

      </div>

    </div>
  )
}

export default LoginPage