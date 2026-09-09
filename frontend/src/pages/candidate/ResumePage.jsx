import { useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  FileText,
  RefreshCw,
  Upload,
  XCircle,
} from 'lucide-react'

import AppShell from '../../components/layout/AppShell'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const ACCEPTED_TYPES = '.pdf,.doc,.docx'

function formatFileType(value, fileName) {
  if (value) return value.toUpperCase()
  const extension = fileName?.split('.').pop()
  return extension ? extension.toUpperCase() : 'FILE'
}

function ResumePage() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [resumes, setResumes] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [expandedResumeId, setExpandedResumeId] = useState(null)

  async function loadResumes(showRefresh = false) {
    try {
      if (showRefresh) setRefreshing(true)
      else setLoading(true)

      setError('')
      const response = await api.get('/resumes/me')
      setResumes(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error('Failed to load resumes:', err)
      setError(
        err.response?.data?.detail ||
          'Unable to load your resumes. Please try again.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadResumes()
  }, [])

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null
    setSuccess('')
    setError('')

    if (!file) {
      setSelectedFile(null)
      return
    }

    const extension = file.name.toLowerCase().split('.').pop()
    if (!['pdf', 'doc', 'docx'].includes(extension)) {
      setSelectedFile(null)
      setError('Please select a PDF, DOC, or DOCX resume.')
      event.target.value = ''
      return
    }

    setSelectedFile(file)
  }

  async function handleUpload(event) {
    event.preventDefault()

    if (!selectedFile) {
      setError('Please choose a resume file first.')
      return
    }

    try {
      setUploading(true)
      setError('')
      setSuccess('')

      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await api.post('/resumes/upload', formData)

      setResumes((current) => [response.data, ...current])
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setSuccess('Resume uploaded and processed successfully.')
      setExpandedResumeId(response.data.id)
    } catch (err) {
      console.error('Failed to upload resume:', err)
      setError(
        err.response?.data?.detail ||
          'Unable to upload your resume. Please try again.'
      )
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <AppShell role="candidate" userName={user?.name || 'User'}>
        <div className="hs-resume-page">
          <div className="hs-resume-state">Loading your resumes...</div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell role="candidate" userName={user?.name || 'User'}>
      <div className="hs-resume-page">
        <style>{`
          .hs-resume-page {
            max-width: 1100px;
            margin: 0 auto;
            padding: 34px 28px 60px;
          }

          .hs-resume-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 24px;
          }

          .hs-resume-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
            color: #756b80;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: .12em;
          }

          .hs-resume-header h1 {
            margin: 0;
            color: #2b2630;
            font-size: clamp(30px, 4vw, 44px);
            line-height: 1.06;
            letter-spacing: -.035em;
          }

          .hs-resume-header p {
            max-width: 690px;
            margin: 11px 0 0;
            color: #716a76;
            font-size: 15px;
            line-height: 1.65;
          }

          .hs-resume-refresh {
            min-height: 42px;
            border: 1px solid #e4dce9;
            border-radius: 12px;
            background: #fff;
            color: #544b5d;
            padding: 0 14px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-weight: 750;
            cursor: pointer;
          }

          .hs-resume-refresh:disabled {
            opacity: .6;
            cursor: default;
          }

          .hs-resume-upload-card,
          .hs-resume-card,
          .hs-resume-state {
            background: #fff;
            border: 1px solid #eee7f0;
            border-radius: 20px;
            box-shadow: 0 9px 30px rgba(54, 39, 68, .05);
          }

          .hs-resume-upload-card {
            padding: 22px;
            margin-bottom: 22px;
          }

          .hs-resume-upload-title {
            display: flex;
            gap: 12px;
            align-items: flex-start;
            margin-bottom: 17px;
          }

          .hs-resume-icon {
            width: 44px;
            height: 44px;
            flex: 0 0 44px;
            display: grid;
            place-items: center;
            border-radius: 13px;
            background: #f0edff;
            color: #6d60a5;
          }

          .hs-resume-upload-title h2 {
            margin: 0;
            color: #302a35;
            font-size: 18px;
          }

          .hs-resume-upload-title p {
            margin: 5px 0 0;
            color: #7a727f;
            font-size: 13px;
          }

          .hs-resume-file-row {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }

          .hs-resume-file-input {
            flex: 1 1 320px;
            min-height: 46px;
            box-sizing: border-box;
            border: 1px dashed #d9d0e3;
            border-radius: 13px;
            background: #fbfaff;
            padding: 10px 12px;
            color: #5b5263;
          }

          .hs-resume-upload-button {
            min-height: 46px;
            border: 0;
            border-radius: 12px;
            background: #7163a8;
            color: #fff;
            padding: 0 18px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-weight: 800;
            cursor: pointer;
          }

          .hs-resume-upload-button:disabled {
            opacity: .6;
            cursor: default;
          }

          .hs-resume-selected {
            margin-top: 12px;
            color: #6f6676;
            font-size: 12px;
          }

          .hs-resume-message {
            margin-top: 14px;
            padding: 11px 13px;
            border-radius: 11px;
            font-size: 13px;
          }

          .hs-resume-message.success {
            background: #eaf7ef;
            color: #26744c;
          }

          .hs-resume-message.error {
            background: #fff0ed;
            color: #a54537;
          }

          .hs-resume-section-label {
            margin: 0 0 12px;
            color: #786f7f;
            font-size: 11px;
            font-weight: 850;
            letter-spacing: .1em;
          }

          .hs-resume-list {
            display: grid;
            gap: 14px;
          }

          .hs-resume-card {
            padding: 19px 20px;
          }

          .hs-resume-card-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 15px;
          }

          .hs-resume-file-info {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }

          .hs-resume-file-info .hs-resume-icon {
            width: 40px;
            height: 40px;
            flex-basis: 40px;
            background: #fff3ed;
            color: #a9674d;
          }

          .hs-resume-file-info strong {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #302a35;
            font-size: 15px;
          }

          .hs-resume-file-info span {
            display: block;
            margin-top: 4px;
            color: #837a88;
            font-size: 12px;
          }

          .hs-resume-view {
            border: 1px solid #e2dbe8;
            border-radius: 10px;
            background: #fff;
            color: #5d5370;
            padding: 8px 11px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            white-space: nowrap;
          }

          .hs-resume-text {
            margin-top: 16px;
            padding-top: 15px;
            border-top: 1px solid #f0ebf2;
          }

          .hs-resume-text pre {
            max-height: 280px;
            overflow: auto;
            margin: 0;
            padding: 14px;
            border-radius: 12px;
            background: #faf9fc;
            color: #5c5463;
            white-space: pre-wrap;
            word-break: break-word;
            font: 12px/1.65 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          }

          .hs-resume-no-text {
            color: #837a88;
            font-size: 13px;
          }

          @media (max-width: 700px) {
            .hs-resume-page {
              padding: 26px 18px 45px;
            }

            .hs-resume-header {
              align-items: flex-start;
              flex-direction: column;
            }

            .hs-resume-file-row {
              align-items: stretch;
              flex-direction: column;
            }

            .hs-resume-upload-button {
              justify-content: center;
            }

            .hs-resume-card-top {
              align-items: stretch;
              flex-direction: column;
            }
          }
        `}</style>

        <section className="hs-resume-header">
          <div>
            <div className="hs-resume-eyebrow">
              <FileText size={15} />
              RESUME INTELLIGENCE
            </div>
            <h1>Your resume, ready for HireSense.</h1>
            <p>
              Upload your latest resume so HireSense can extract its text and
              use it as evidence for job matching.
            </p>
          </div>

          <button
            className="hs-resume-refresh"
            type="button"
            onClick={() => loadResumes(true)}
            disabled={refreshing}
          >
            <RefreshCw size={16} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </section>

        <section className="hs-resume-upload-card">
          <div className="hs-resume-upload-title">
            <div className="hs-resume-icon">
              <Upload size={20} />
            </div>
            <div>
              <h2>Upload a resume</h2>
              <p>Supported formats: PDF, DOC and DOCX.</p>
            </div>
          </div>

          <form onSubmit={handleUpload}>
            <div className="hs-resume-file-row">
              <input
                ref={fileInputRef}
                className="hs-resume-file-input"
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handleFileChange}
                disabled={uploading}
              />

              <button
                className="hs-resume-upload-button"
                type="submit"
                disabled={uploading || !selectedFile}
              >
                <Upload size={17} />
                {uploading ? 'Processing...' : 'Upload resume'}
              </button>
            </div>

            {selectedFile && (
              <div className="hs-resume-selected">
                Selected: <strong>{selectedFile.name}</strong> ·{' '}
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
          </form>

          {success && (
            <div className="hs-resume-message success">
              <CheckCircle2
                size={15}
                style={{ verticalAlign: 'middle', marginRight: 6 }}
              />
              {success}
            </div>
          )}

          {error && (
            <div className="hs-resume-message error">
              <XCircle
                size={15}
                style={{ verticalAlign: 'middle', marginRight: 6 }}
              />
              {error}
            </div>
          )}
        </section>

        <div className="hs-resume-section-label">UPLOADED RESUMES</div>

        {resumes.length === 0 ? (
          <div className="hs-resume-state" style={{ padding: '46px 24px', textAlign: 'center' }}>
            <strong style={{ display: 'block', color: '#302a35', marginBottom: 6 }}>
              No resume uploaded yet.
            </strong>
            <span style={{ color: '#7b7280', fontSize: 13 }}>
              Upload your resume above to start building resume evidence.
            </span>
          </div>
        ) : (
          <div className="hs-resume-list">
            {resumes.map((resume) => {
              const expanded = expandedResumeId === resume.id

              return (
                <article className="hs-resume-card" key={resume.id}>
                  <div className="hs-resume-card-top">
                    <div className="hs-resume-file-info">
                      <div className="hs-resume-icon">
                        <FileText size={19} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <strong title={resume.file_name}>
                          {resume.file_name}
                        </strong>
                        <span>
                          {formatFileType(resume.file_type, resume.file_name)}
                          {' · '}
                          Resume #{resume.id}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="hs-resume-view"
                      onClick={() =>
                        setExpandedResumeId(expanded ? null : resume.id)
                      }
                    >
                      {expanded ? 'Hide extracted text' : 'View extracted text'}
                    </button>
                  </div>

                  {expanded && (
                    <div className="hs-resume-text">
                      {resume.extracted_text ? (
                        <pre>{resume.extracted_text}</pre>
                      ) : (
                        <div className="hs-resume-no-text">
                          No extracted text is available for this resume.
                        </div>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}

export default ResumePage
