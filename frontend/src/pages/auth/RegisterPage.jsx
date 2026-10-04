import { useState } from 'react'

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Globe,
  LockKeyhole,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  User,
  BriefcaseBusiness,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import api from '../../services/api'


function RegisterPage() {
  const navigate = useNavigate()

  // =========================================================
  // BASIC ACCOUNT
  // =========================================================

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('candidate')

  // =========================================================
  // RECRUITER
  // =========================================================

  const [position, setPosition] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [companyLocation, setCompanyLocation] = useState('')
  const [companyWebsite, setCompanyWebsite] = useState('')

  // =========================================================
  // PASSWORD
  // =========================================================

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] =
    useState('')

  const [showPassword, setShowPassword] =
    useState(false)

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  // =========================================================
  // FLOW
  // =========================================================

  const [step, setStep] = useState(1)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')


  // =========================================================
  // STEP 1
  // =========================================================

  function handleContinue() {
    setError('')

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName) {
      setError('Please enter your full name.')
      return
    }

    if (!trimmedEmail) {
      setError('Please enter your email address.')
      return
    }

    if (role === 'recruiter') {

      if (!position.trim()) {
        setError(
          'Please enter your position or designation.',
        )
        return
      }

      if (!companyName.trim()) {
        setError('Please enter your company name.')
        return
      }

      if (!industry.trim()) {
        setError('Please enter your company industry.')
        return
      }

      if (!companyLocation.trim()) {
        setError('Please enter your company location.')
        return
      }
    }

    setStep(2)
  }


  // =========================================================
  // SUBMIT
  // =========================================================

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (password.length < 6) {
      setError(
        'Password must contain at least 6 characters.',
      )
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {

      const registrationData = {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      }

      /*
       * Preserve the existing recruiter registration
       * structure used by the HireSense backend.
       */

      if (role === 'recruiter') {

        registrationData.position =
          position.trim()

        registrationData.company = {
          name: companyName.trim(),
          industry: industry.trim(),
          location: companyLocation.trim(),
          website:
            companyWebsite.trim() || null,
        }
      }

      const response = await api.post(
        '/users/',
        registrationData,
      )

      console.log(
        'Registration successful:',
        response.data,
      )

      setPassword('')
      setConfirmPassword('')

      if (role === 'recruiter') {

        setSuccess(
          'Your recruiter account has been created and is awaiting approval from the Placement Officer.',
        )

      } else {

        setSuccess(
          'Your HireSense account has been created successfully. You can now sign in.',
        )
      }

    } catch (err) {

      const message =
        err.response?.data?.detail ||
        err.message ||
        'Unable to create your account. Please try again.'

      setError(
        Array.isArray(message)
          ? message
              .map((item) => item.msg)
              .join(', ')
          : message,
      )

    } finally {

      setLoading(false)

    }
  }


  // =========================================================
  // SUCCESS SCREEN
  // =========================================================

  if (success) {

    return (
      <div style={pageStyle}>

        <div style={backgroundGlowOne} />
        <div style={backgroundGlowTwo} />

        <div
          style={{
            width: '100%',
            maxWidth: '1080px',
            display: 'grid',
            gridTemplateColumns:
              'minmax(0, 1fr) minmax(380px, 480px)',
            gap: '70px',
            alignItems: 'center',
          }}
        >

          <BrandPanel />

          <div style={cardStyle}>

            <div
              style={{
                width: '64px',
                height: '64px',
                marginBottom: '24px',
                borderRadius: '20px',
                background: '#ecfdf3',
                color: '#078449',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={31} />
            </div>

            <div style={eyebrowStyle}>
              Account created
            </div>

            <h2 style={titleStyle}>
              Welcome to HireSense.
            </h2>

            <p style={subtitleStyle}>
              {role === 'recruiter'
                ? 'Your recruiter account has been created successfully. It will become available after Placement Officer approval.'
                : 'Your account has been created successfully. You can now sign in and continue to your workspace.'}
            </p>

            <button
              type="button"
              onClick={() => navigate('/login')}
              style={primaryButtonStyle}
            >
              <span>Continue to sign in</span>
              <ArrowRight size={17} />
            </button>

            <div
              style={{
                marginTop: '26px',
                paddingTop: '20px',
                borderTop: '1px solid #edf0f5',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                color: '#7b8498',
                fontSize: '12px',
                lineHeight: 1.5,
              }}
            >
              <ShieldCheck
                size={17}
                color="#6257ff"
              />

              <span>
                Your account details are securely stored
                by HireSense.
              </span>
            </div>

            <Footer />

          </div>

        </div>

        <ResponsiveStyle />

      </div>
    )
  }


  // =========================================================
  // MAIN REGISTRATION
  // =========================================================

  return (
    <div style={pageStyle}>

      <div style={backgroundGlowOne} />
      <div style={backgroundGlowTwo} />

      <div
        style={{
          width: '100%',
          maxWidth: '1080px',
          display: 'grid',
          gridTemplateColumns:
            'minmax(0, 1fr) minmax(380px, 500px)',
          gap: '70px',
          alignItems: 'center',
        }}
      >

        {/* =================================================
            LEFT BRANDING
        ================================================= */}

        <BrandPanel />

        {/* =================================================
            REGISTRATION CARD
        ================================================= */}

        <div style={cardStyle}>

          {/* MOBILE BRAND */}

          <div
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '28px',
            }}
            className="register-mobile-brand"
          >

            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background:
                  'linear-gradient(135deg, #6257ff, #756aff)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={19} />
            </div>

            <strong
              style={{
                color: '#172033',
                fontSize: '18px',
              }}
            >
              HireSense
            </strong>

          </div>


          {/* =================================================
              HEADER
          ================================================= */}

          <div>

            <div style={eyebrowStyle}>
              Get started
            </div>

            <h2 style={titleStyle}>
              Create your account
            </h2>

            <p style={subtitleStyle}>
              Join HireSense and build a smarter
              career or hiring workspace.
            </p>

          </div>


          {/* =================================================
              PROGRESS
          ================================================= */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginTop: '28px',
              marginBottom: '28px',
            }}
          >

            <ProgressStep
              number="1"
              active={step === 1}
              complete={step === 2}
              label="Account"
            />

            <div
              style={{
                flex: 1,
                height: '1px',
                background:
                  step === 2
                    ? '#6257ff'
                    : '#e3e6ee',
              }}
            />

            <ProgressStep
              number="2"
              active={step === 2}
              complete={false}
              label="Security"
            />

          </div>


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              role="alert"
              style={{
                marginBottom: '18px',
                padding: '12px 14px',
                borderRadius: '11px',
                border:
                  '1px solid #fecaca',
                background: '#fff7f7',
                color: '#b42318',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}


          {/* =================================================
              STEP 1
          ================================================= */}

          {step === 1 && (

            <div>

              <div style={sectionLabel}>
                Personal details
              </div>

              <Field
                label="Full name"
                icon={<User size={17} />}
                value={name}
                onChange={setName}
                placeholder="Enter your full name"
                type="text"
                autoComplete="name"
              />

              <Field
                label="Email address"
                icon={<Mail size={17} />}
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
              />


              <div
                style={{
                  marginTop: '20px',
                  marginBottom: '22px',
                }}
              >

                <label
                  style={labelStyle}
                >
                  Account type
                </label>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap: '10px',
                  }}
                >

                  <RoleCard
                    selected={
                      role === 'candidate'
                    }
                    icon={
                      <User size={19} />
                    }
                    title="Candidate"
                    description="Find opportunities"
                    onClick={() => {
                      setRole('candidate')
                      setPosition('')
                      setCompanyName('')
                      setIndustry('')
                      setCompanyLocation('')
                      setCompanyWebsite('')
                    }}
                  />

                  <RoleCard
                    selected={
                      role === 'recruiter'
                    }
                    icon={
                      <BriefcaseBusiness
                        size={19}
                      />
                    }
                    title="Recruiter"
                    description="Hire candidates"
                    onClick={() =>
                      setRole('recruiter')
                    }
                  />

                </div>

              </div>


              {/* =================================================
                  RECRUITER DETAILS
              ================================================= */}

              {role === 'recruiter' && (

                <div
                  style={{
                    marginTop: '24px',
                    padding: '18px',
                    borderRadius: '14px',
                    background: '#fafaff',
                    border:
                      '1px solid #e8e6ff',
                  }}
                >

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      marginBottom: '16px',
                    }}
                  >

                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '9px',
                        background: '#eeecff',
                        color: '#6257ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Building2 size={16} />
                    </div>

                    <div>

                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 750,
                          color: '#252e40',
                        }}
                      >
                        Recruiter profile
                      </div>

                      <div
                        style={{
                          marginTop: '2px',
                          fontSize: '11px',
                          color: '#8992a5',
                        }}
                      >
                        Tell us about your hiring role.
                      </div>

                    </div>

                  </div>


                  <Field
                    compact
                    label="Position / Designation"
                    icon={
                      <BriefcaseBusiness
                        size={16}
                      />
                    }
                    value={position}
                    onChange={setPosition}
                    placeholder="e.g. HR Manager"
                    type="text"
                    autoComplete="organization-title"
                  />

                  <Field
                    compact
                    label="Company name"
                    icon={
                      <Building2 size={16} />
                    }
                    value={companyName}
                    onChange={setCompanyName}
                    placeholder="e.g. Yugsaman"
                    type="text"
                    autoComplete="organization"
                  />

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        '1fr 1fr',
                      gap: '10px',
                    }}
                  >

                    <Field
                      compact
                      label="Industry"
                      icon={
                        <BriefcaseBusiness
                          size={16}
                        />
                      }
                      value={industry}
                      onChange={setIndustry}
                      placeholder="Information Technology"
                      type="text"
                    />

                    <Field
                      compact
                      label="Location"
                      icon={
                        <MapPin size={16} />
                      }
                      value={companyLocation}
                      onChange={setCompanyLocation}
                      placeholder="Delhi NCR"
                      type="text"
                    />

                  </div>


                  <Field
                    compact
                    label={
                      <>
                        Website{' '}
                        <span
                          style={{
                            color: '#9ba3b3',
                            fontWeight: 400,
                          }}
                        >
                          optional
                        </span>
                      </>
                    }
                    icon={
                      <Globe size={16} />
                    }
                    value={companyWebsite}
                    onChange={setCompanyWebsite}
                    placeholder="https://example.com"
                    type="url"
                    autoComplete="url"
                    required={false}
                  />

                </div>

              )}


              <button
                type="button"
                onClick={handleContinue}
                style={primaryButtonStyle}
              >
                <span>Continue</span>
                <ArrowRight size={17} />
              </button>

            </div>

          )}


          {/* =================================================
              STEP 2
          ================================================= */}

          {step === 2 && (

            <form onSubmit={handleSubmit}>

              <div style={sectionLabel}>
                Secure your account
              </div>

              <div
                style={{
                  padding: '13px 14px',
                  borderRadius: '11px',
                  background: '#f7f7ff',
                  border:
                    '1px solid #e9e7ff',
                  marginBottom: '22px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                }}
              >

                <ShieldCheck
                  size={18}
                  color="#6257ff"
                  style={{
                    marginTop: '1px',
                    flexShrink: 0,
                  }}
                />

                <div>

                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#31394b',
                    }}
                  >
                    Create a strong password
                  </div>

                  <div
                    style={{
                      marginTop: '3px',
                      fontSize: '11px',
                      color: '#7e889c',
                      lineHeight: 1.45,
                    }}
                  >
                    Use at least 6 characters. You can
                    change it later from Settings.
                  </div>

                </div>

              </div>


              <PasswordField
                label="Password"
                value={password}
                onChange={setPassword}
                show={showPassword}
                setShow={setShowPassword}
                placeholder="Create a password"
                autoComplete="new-password"
              />

              <PasswordField
                label="Confirm password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showConfirmPassword}
                setShow={setShowConfirmPassword}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />


              <button
                type="submit"
                disabled={loading}
                style={{
                  ...primaryButtonStyle,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading
                    ? 'not-allowed'
                    : 'pointer',
                }}
              >

                {loading ? (
                  <span>
                    Creating your account...
                  </span>
                ) : (
                  <>
                    <span>
                      Create account
                    </span>
                    <ArrowRight size={17} />
                  </>
                )}

              </button>


              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setError('')
                  setStep(1)
                }}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  height: '42px',
                  border: 'none',
                  background: 'transparent',
                  color: '#68738a',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                }}
              >
                <ArrowLeft size={15} />
                Back to account details
              </button>

            </form>

          )}


          {/* =================================================
              LOGIN
          ================================================= */}

          <div
            style={{
              marginTop: '22px',
              paddingTop: '20px',
              borderTop: '1px solid #edf0f5',
              textAlign: 'center',
              fontSize: '13px',
              color: '#7c879b',
            }}
          >

            Already have an account?{' '}

            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                color: '#6257ff',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Sign in
            </button>

          </div>


          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              width: '100%',
              marginTop: '10px',
              border: 'none',
              background: 'transparent',
              color: '#8a94a7',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <ArrowLeft size={14} />
            Back to login
          </button>


          <Footer />

        </div>

      </div>


      <ResponsiveStyle />

    </div>
  )
}


// =========================================================
// BRAND PANEL
// =========================================================

function BrandPanel() {
  return (
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
          maxWidth: '580px',
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
          Join HireSense
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
          Build your
          <br />
          career smarter.
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
          Create your HireSense account and access
          intelligent opportunities, applications, and
          placement insights.
        </p>

      </div>


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
          <Sparkles size={17} />
        </div>

        <div>

          <strong
            style={{
              display: 'block',
              fontSize: '14px',
              color: '#172033',
            }}
          >
            One intelligent platform
          </strong>

          <span
            style={{
              display: 'block',
              marginTop: '5px',
              fontSize: '13px',
              lineHeight: 1.5,
              color: '#7c879d',
            }}
          >
            Candidates, recruiters, and placement teams
            working from one connected workspace.
          </span>

        </div>

      </div>

    </div>
  )
}


// =========================================================
// FIELD
// =========================================================

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
  compact = false,
  required = true,
}) {
  return (
    <div
      style={{
        marginBottom: compact ? '13px' : '18px',
      }}
    >

      <label
        style={{
          ...labelStyle,
          fontSize: compact ? '11px' : '12px',
        }}
      >
        {label}
      </label>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          height: compact ? '45px' : '49px',
          padding: '0 13px',
          border: '1px solid #dfe3ec',
          borderRadius: '11px',
          background: '#ffffff',
          boxSizing: 'border-box',
        }}
      >

        <span
          style={{
            display: 'flex',
            color: '#8993a8',
            flexShrink: 0,
          }}
        >
          {icon}
        </span>

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: '#172033',
            fontSize: compact ? '12px' : '13px',
          }}
        />

      </div>

    </div>
  )
}


// =========================================================
// PASSWORD FIELD
// =========================================================

function PasswordField({
  label,
  value,
  onChange,
  show,
  setShow,
  placeholder,
  autoComplete,
}) {
  return (
    <div
      style={{
        marginBottom: '18px',
      }}
    >

      <label style={labelStyle}>
        {label}
      </label>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          height: '49px',
          padding: '0 13px',
          border: '1px solid #dfe3ec',
          borderRadius: '11px',
          background: '#ffffff',
          boxSizing: 'border-box',
        }}
      >

        <LockKeyhole
          size={17}
          color="#8993a8"
        />

        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: '#172033',
            fontSize: '13px',
          }}
        />

        <button
          type="button"
          onClick={() =>
            setShow((current) => !current)
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            color: '#8993a8',
            padding: '3px',
            cursor: 'pointer',
          }}
          aria-label={
            show
              ? 'Hide password'
              : 'Show password'
          }
        >
          {show ? (
            <EyeOff size={17} />
          ) : (
            <Eye size={17} />
          )}
        </button>

      </div>

    </div>
  )
}


// =========================================================
// ROLE CARD
// =========================================================

function RoleCard({
  selected,
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: '13px',
        borderRadius: '12px',
        border: selected
          ? '1.5px solid #6257ff'
          : '1px solid #dfe3ec',
        background: selected
          ? '#f7f6ff'
          : '#ffffff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        transition: 'all 0.15s ease',
      }}
    >

      <div
        style={{
          width: '34px',
          height: '34px',
          flexShrink: 0,
          borderRadius: '10px',
          background: selected
            ? '#e9e7ff'
            : '#f3f5f9',
          color: selected
            ? '#6257ff'
            : '#7f899d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>

      <div>

        <div
          style={{
            fontSize: '12px',
            fontWeight: 750,
            color: '#252e40',
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: '2px',
            fontSize: '10px',
            color: '#8993a7',
          }}
        >
          {description}
        </div>

      </div>

    </button>
  )
}


// =========================================================
// PROGRESS STEP
// =========================================================

function ProgressStep({
  number,
  active,
  complete,
  label,
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
      }}
    >

      <div
        style={{
          width: '27px',
          height: '27px',
          borderRadius: '50%',
          background:
            active || complete
              ? '#6257ff'
              : '#eef0f5',
          color:
            active || complete
              ? '#ffffff'
              : '#8d96a8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 800,
        }}
      >
        {complete ? (
          <Check size={14} />
        ) : (
          number
        )}
      </div>

      <span
        style={{
          fontSize: '11px',
          fontWeight:
            active ? 750 : 600,
          color:
            active
              ? '#343d51'
              : '#949daf',
        }}
      >
        {label}
      </span>

    </div>
  )
}


// =========================================================
// FOOTER
// =========================================================

function Footer() {
  return (
    <div
      style={{
        marginTop: '26px',
        paddingTop: '18px',
        borderTop: '1px solid #edf0f5',
        textAlign: 'center',
        fontSize: '10px',
        color: '#a0a8b8',
      }}
    >
      HireSense Placement Intelligence Platform
    </div>
  )
}


// =========================================================
// RESPONSIVE
// =========================================================

function ResponsiveStyle() {
  return (
    <style>
      {`
        @media (max-width: 850px) {
          .register-mobile-brand {
            display: flex !important;
          }

          body {
            overflow-x: hidden;
          }
        }

        @media (max-width: 700px) {
          .hs-register-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 520px) {
          .hs-register-card {
            padding: 25px !important;
            border-radius: 18px !important;
          }
        }
      `}
    </style>
  )
}


// =========================================================
// STYLES
// =========================================================

const pageStyle = {
  minHeight: '100vh',
  width: '100%',
  boxSizing: 'border-box',
  padding: '32px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background:
    'radial-gradient(circle at 8% 8%, rgba(99, 88, 255, 0.10), transparent 32%), radial-gradient(circle at 92% 92%, rgba(99, 88, 255, 0.08), transparent 32%), #f7f8fc',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e8eaf1',
  borderRadius: '24px',
  padding: '34px',
  boxShadow:
    '0 24px 70px rgba(30, 38, 60, 0.10)',
  boxSizing: 'border-box',
}

const eyebrowStyle = {
  fontSize: '11px',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.13em',
  color: '#6257ff',
  marginBottom: '11px',
}

const titleStyle = {
  margin: 0,
  fontSize: '31px',
  lineHeight: 1.15,
  letterSpacing: '-0.035em',
  color: '#172033',
  fontWeight: 800,
}

const subtitleStyle = {
  marginTop: '11px',
  marginBottom: 0,
  fontSize: '13px',
  lineHeight: 1.6,
  color: '#78849a',
}

const sectionLabel = {
  fontSize: '11px',
  fontWeight: 800,
  color: '#525d72',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '15px',
}

const labelStyle = {
  display: 'block',
  marginBottom: '7px',
  fontSize: '12px',
  fontWeight: 700,
  color: '#4d586d',
}

const primaryButtonStyle = {
  width: '100%',
  height: '50px',
  marginTop: '20px',
  border: 'none',
  borderRadius: '11px',
  background:
    'linear-gradient(135deg, #6257ff, #6f63ff)',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 750,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  boxShadow:
    '0 12px 24px rgba(98, 87, 255, 0.20)',
}

const backgroundGlowOne = {
  position: 'fixed',
  width: '350px',
  height: '350px',
  borderRadius: '50%',
  background:
    'rgba(110, 95, 255, 0.08)',
  filter: 'blur(70px)',
  top: '-180px',
  left: '-150px',
  pointerEvents: 'none',
}

const backgroundGlowTwo = {
  position: 'fixed',
  width: '300px',
  height: '300px',
  borderRadius: '50%',
  background:
    'rgba(110, 95, 255, 0.06)',
  filter: 'blur(70px)',
  bottom: '-160px',
  right: '-120px',
  pointerEvents: 'none',
}


export default RegisterPage