import { useState } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

function LoginPage() {
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      const data = await login(email, password)

      if (data.role === 'candidate') {
        window.location.href = '/candidate'
      } else if (data.role === 'recruiter') {
        window.location.href = '/recruiter'
      } else {
        window.location.href = '/'
      }
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        'Unable to sign in. Please check your credentials.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hs-login-page">

      <div className="hs-login-background">
        <div className="hs-glow hs-glow-one" />
        <div className="hs-glow hs-glow-two" />
      </div>

      <div className="hs-login-layout">

        {/* Left branding panel */}

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
              Discover opportunities matched to your skills,
              experience, education, and career profile.
            </p>
          </div>

          <div className="hs-login-feature">
            <div className="hs-feature-icon">
              <Sparkles size={17} />
            </div>

            <div>
              <strong>Explainable matching</strong>
              <span>
                Understand exactly why an opportunity matches
                your profile.
              </span>
            </div>
          </div>

        </section>

        {/* Login card */}

        <section className="hs-login-card">

          <div className="hs-mobile-brand">
            <div className="hs-login-logo">
              <Sparkles size={19} />
            </div>

            <strong>HireSense</strong>
          </div>

          <div className="hs-login-header">
            <span className="hs-login-card-eyebrow">
              Welcome back
            </span>

            <h2>Sign in to your workspace</h2>

            <p>
              Continue to your personalized HireSense
              experience.
            </p>
          </div>

          {error && (
            <div className="hs-login-error">
              {error}
            </div>
          )}

          <form
            className="hs-login-form"
            onSubmit={handleSubmit}
          >

            <div className="hs-field">
              <label htmlFor="email">
                Email address
              </label>

              <div className="hs-input-wrapper">
                <Mail size={17} />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="hs-field">
              <label htmlFor="password">
                Password
              </label>

              <div className="hs-input-wrapper">
                <LockKeyhole size={17} />

                <input
                  id="password"
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
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

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