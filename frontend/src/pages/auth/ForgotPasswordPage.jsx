import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()

    setError('')

    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)

    /*
     * IMPORTANT
     *
     * Real email / OTP recovery will be connected here
     * when the backend email verification service is added.
     *
     * For now this page provides the complete recovery UI
     * without pretending that an email was actually sent.
     */

    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 500)
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
            LEFT PANEL
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
              Secure account recovery
            </span>

            <h1>
              Get back to
              <br />
              your workspace.
            </h1>

            <p>
              Recover access to your HireSense account
              securely using your registered email.
            </p>

          </div>


          <div className="hs-login-feature">

            <div className="hs-feature-icon">
              <ShieldCheck size={17} />
            </div>

            <div>
              <strong>
                Secure recovery
              </strong>

              <span>
                Your account recovery will use verified
                email authentication.
              </span>
            </div>

          </div>

        </section>


        {/* =====================================================
            RECOVERY CARD
        ===================================================== */}

        <section className="hs-login-card">

          {/* MOBILE BRAND */}

          <div className="hs-mobile-brand">

            <div className="hs-login-logo">
              <Sparkles size={19} />
            </div>

            <strong>HireSense</strong>

          </div>


          {/* BACK */}

          <button
            type="button"
            className="hs-auth-back-button"
            onClick={() =>
              navigate('/login')
            }
          >
            <ArrowLeft size={16} />
            Back to login
          </button>


          {/* HEADER */}

          <div className="hs-login-header hs-recovery-header">

            <span className="hs-login-card-eyebrow">
              Account recovery
            </span>

            <h2>
              Forgot your password?
            </h2>

            <p>
              Enter the email address associated with
              your HireSense account.
            </p>

          </div>


          {/* SUCCESS */}

          {submitted && (
            <div
              className="hs-recovery-notice"
              role="status"
            >
              <ShieldCheck size={18} />

              <div>
                <strong>
                  Recovery request received
                </strong>

                <span>
                  Email verification will be available
                  once the HireSense email service is
                  connected.
                </span>
              </div>
            </div>
          )}


          {/* ERROR */}

          {error && (
            <div
              className="hs-login-error"
              role="alert"
            >
              {error}
            </div>
          )}


          {!submitted && (
            <form
              className="hs-login-form"
              onSubmit={handleSubmit}
            >

              <div className="hs-field">

                <label htmlFor="recovery-email">
                  Email address
                </label>

                <div className="hs-input-wrapper">

                  <Mail size={17} />

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
                    disabled={loading}
                    autoFocus
                  />

                </div>

              </div>


              <button
                type="submit"
                className="hs-login-button"
                disabled={loading}
              >

                {loading ? (
                  <span className="hs-button-loader">
                    Preparing recovery...
                  </span>
                ) : (
                  <>
                    <span>
                      Continue
                    </span>

                    <ArrowRight size={17} />
                  </>
                )}

              </button>

            </form>
          )}


          {/* SUCCESS ACTIONS */}

          {submitted && (
            <div className="hs-recovery-actions">

              <button
                type="button"
                className="hs-login-button"
                onClick={() =>
                  navigate('/login')
                }
              >
                <span>
                  Return to login
                </span>

                <ArrowRight size={17} />
              </button>

              <button
                type="button"
                className="hs-auth-secondary-button"
                onClick={() => {
                  setSubmitted(false)
                  setEmail('')
                }}
              >
                Try another email
              </button>

            </div>
          )}


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

export default ForgotPasswordPage