import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  UsersRound,
  Star,
} from 'lucide-react'

import AppShell from '../../components/layout/AppShell'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

function RecruiterAnalyticsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  async function loadAnalytics(showRefresh = false) {
    try {
      if (showRefresh) setRefreshing(true)
      else setLoading(true)
      setError('')

      const response = await api.get('/analytics/overview')
      setData(response.data || null)
    } catch (err) {
      console.error(err)
      setError(
        err.response?.data?.detail ||
          'Unable to load recruiter analytics.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    loadAnalytics()
  }, [authLoading, isAuthenticated])

  const statusRows = useMemo(() => {
    const distribution = data?.status_distribution || {}
    const total = Object.values(distribution).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    )

    const labels = [
      ['applied', 'Applied'],
      ['shortlisted', 'Shortlisted'],
      ['interview', 'Interview'],
      ['selected', 'Selected'],
      ['rejected', 'Rejected'],
    ]

    return labels.map(([key, label]) => ({
      key,
      label,
      count: Number(distribution[key] || 0),
      percentage: total
        ? Math.round((Number(distribution[key] || 0) / total) * 100)
        : 0,
    }))
  }, [data])

  const matchBands = {
    strong: Number(data?.match_band_counts?.strong || 0),
    good: Number(data?.match_band_counts?.good || 0),
    needsAttention: Number(data?.match_band_counts?.needs_attention || 0),
  }

  if (authLoading) {
    return (
      <AppShell role="recruiter" userName={user?.name || 'Recruiter'}>
        <div style={styles.loadingCard}>Loading recruiter analytics...</div>
      </AppShell>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'recruiter' && user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const totalApplications = Number(data?.total_applications || 0)
  const eligible = Number(data?.eligible_applications || 0)
  const averageMatch = Number(data?.average_match_score || 0)
  const jobs = data?.job_statistics || []
  const topSkills = data?.top_applicant_skills || []
  const skillGaps = data?.top_skill_gaps || []
  const requiredSkillGaps = data?.required_skill_gaps || []
  const maxSkillCount = Math.max(
    ...topSkills.map((item) => Number(item.applicant_count || 0)),
    1
  )
  const maxGapCount = Math.max(
    ...skillGaps.map((item) => Number(item.applicant_count || 0)),
    1
  )
  const maxJobApplications = Math.max(
    ...jobs.map((job) => Number(job.application_count || 0)),
    1
  )
  const eligibilityRate = totalApplications
    ? Math.round((eligible / totalApplications) * 100)
    : 0
  const populatedRoles = jobs.filter((job) => Number(job.application_count || 0) > 0)
  const bestRole = data?.best_role || populatedRoles[0] || null
  const attentionRole = data?.attention_role || null

  return (
    <AppShell role="recruiter" userName={user?.name || 'Recruiter'}>
      <div style={styles.page}>
        <div style={styles.container}>
          <header style={styles.header}>
            <div>
              <div style={styles.eyebrow}>RECRUITER INTELLIGENCE</div>
              <h1 style={styles.title}>Hiring Analytics</h1>
              <p style={styles.subtitle}>
                Turn candidate activity into clear hiring decisions across every role.
              </p>
            </div>

            <button
              type="button"
              style={styles.refreshButton}
              onClick={() => loadAnalytics(true)}
              disabled={refreshing}
            >
              <RefreshCw size={16} />
              {refreshing ? 'Refreshing...' : 'Refresh data'}
            </button>
          </header>

          {loading ? (
            <div style={styles.loadingCard}>Loading your hiring intelligence...</div>
          ) : error ? (
            <div style={styles.errorCard}>
              <strong>Analytics unavailable</strong>
              <span>{error}</span>
              <button type="button" style={styles.retryButton} onClick={() => loadAnalytics()}>
                Try again
              </button>
            </div>
          ) : (
            <>
              <section style={styles.metricGrid}>
                <MetricCard
                  icon={<BriefcaseBusiness size={19} />}
                  label="Posted roles"
                  value={data?.total_jobs || 0}
                  helper="Roles in your workspace"
                />
                <MetricCard
                  icon={<Users size={19} />}
                  label="Applications"
                  value={totalApplications}
                  helper="Across all roles"
                />
                <MetricCard
                  icon={<Target size={19} />}
                  label="Average match"
                  value={`${averageMatch}%`}
                  helper="Candidate-role alignment"
                />
                <MetricCard
                  icon={<CheckCircle2 size={19} />}
                  label="Eligibility rate"
                  value={`${eligibilityRate}%`}
                  helper={`${eligible} eligible applications`}
                />
              </section>

              {totalApplications === 0 ? (
                <section style={styles.emptyCard}>
                  <div style={styles.emptyIcon}><BarChart3 size={23} /></div>
                  <h2 style={styles.emptyTitle}>Your hiring intelligence starts with applications</h2>
                  <p style={styles.emptyText}>
                    Once candidates apply, HireSense will surface match quality, eligibility,
                    role performance, and skill-gap signals here.
                  </p>
                  <button type="button" style={styles.primaryButton} onClick={() => navigate('/recruiter/jobs')}>
                    View jobs <ArrowUpRight size={16} />
                  </button>
                </section>
              ) : (
                <>
                  <section style={styles.topGrid}>
                    <div style={styles.card}>
                      <div style={styles.sectionHeader}>
                        <div>
                          <div style={styles.sectionEyebrow}>PIPELINE</div>
                          <h2 style={styles.sectionTitle}>Application funnel</h2>
                        </div>
                        <ClipboardList size={19} color="#7869b0" />
                      </div>

                      <div style={styles.funnelList}>
                        {statusRows.map((row) => (
                          <div key={row.key} style={styles.funnelRow}>
                            <div style={styles.funnelLabelRow}>
                              <span>{row.label}</span>
                              <strong>{row.count}</strong>
                            </div>
                            <div style={styles.progressTrack}>
                              <div style={{ ...styles.progressFill, width: `${row.percentage}%` }} />
                            </div>
                            <span style={styles.percentage}>{row.percentage}% of applications</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={styles.card}>
                      <div style={styles.sectionHeader}>
                        <div>
                          <div style={styles.sectionEyebrow}>MATCH QUALITY</div>
                          <h2 style={styles.sectionTitle}>Candidate signal</h2>
                        </div>
                        <Target size={19} color="#7869b0" />
                      </div>

                      <div style={styles.bigScore}>{averageMatch}%</div>
                      <p style={styles.scoreDescription}>
                        Average candidate-role match across your application pool.
                      </p>

                      <div style={styles.signalGrid}>
                        <Signal label="Strong matches" value={matchBands.strong} detail="80%+ role match" />
                        <Signal label="Good matches" value={matchBands.good} detail="60–79% role match" />
                        <Signal label="Needs attention" value={matchBands.needsAttention} detail="Below 60%" />
                      </div>

                      <div style={styles.insightBox}>
                        <div style={styles.insightHeading}>
                          <Sparkles size={14} />
                          <strong>Hiring signal</strong>
                        </div>
                        <span>
                          {data?.hiring_signal || 'Review role-level candidate signals before moving applicants forward.'}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section style={styles.decisionGrid}>
                    <DecisionCard
                      icon={<TrendingUp size={17} />}
                      eyebrow="BEST ROLE"
                      title={bestRole?.job_title || 'No role signal yet'}
                      value={bestRole ? `${Number(bestRole.average_match_score || 0)}%` : '—'}
                      detail={
                        bestRole
                          ? `${bestRole.application_count} applicant${bestRole.application_count === 1 ? '' : 's'} · ${bestRole.strong_match_count || 0} strong match${Number(bestRole.strong_match_count || 0) === 1 ? '' : 'es'}`
                          : 'Applications will create role-level intelligence.'
                      }
                      tone="positive"
                      onClick={() => navigate('/recruiter/applications')}
                    />

                    <DecisionCard
                      icon={<AlertTriangle size={17} />}
                      eyebrow="NEEDS REVIEW"
                      title={attentionRole?.job_title || 'No immediate risk'}
                      value={attentionRole ? `${Number(attentionRole.average_match_score || 0)}%` : '✓'}
                      detail={
                        attentionRole
                          ? `${attentionRole.needs_attention_count || 0} candidate${Number(attentionRole.needs_attention_count || 0) === 1 ? '' : 's'} below 60% in this role`
                          : 'No role currently has a below-60% candidate signal.'
                      }
                      tone="attention"
                      onClick={() => navigate('/recruiter/applications')}
                    />

                    <DecisionCard
                      icon={<Target size={17} />}
                      eyebrow="SKILL GAP"
                      title={requiredSkillGaps[0]?.skill || skillGaps[0]?.skill || 'No recurring gap'}
                      value={
                        requiredSkillGaps[0]
                          ? `${requiredSkillGaps[0].applicant_count}`
                          : skillGaps[0]
                            ? `${skillGaps[0].applicant_count}`
                            : '—'
                      }
                      detail={
                        requiredSkillGaps[0]
                          ? 'applicants missing this required skill'
                          : skillGaps[0]
                            ? 'applicants showing this skill gap'
                            : 'Skill gaps will appear as matching data grows.'
                      }
                      tone="neutral"
                      onClick={() => navigate('/recruiter/applications')}
                    />
                  </section>

                  <section style={styles.rolePerformanceCard}>
                    <div style={styles.roleSectionHeader}>
                      <div>
                        <div style={styles.sectionEyebrow}>ROLE PERFORMANCE</div>
                        <h2 style={styles.sectionTitle}>Which roles need attention?</h2>
                        <p style={styles.roleSectionSubtitle}>
                          Compare applicant volume and average candidate-role match for each role.
                        </p>
                      </div>
                      <button
                        type="button"
                        style={styles.linkButton}
                        onClick={() => navigate(`/recruiter/applications?job=${job.job_id}`)}
                      >
                        View all applications <ArrowUpRight size={14} />
                      </button>
                    </div>

                    <div style={styles.roleGrid}>
                      {jobs.slice(0, 8).map((job) => {
                        const count = Number(job.application_count || 0)
                        const score = Number(job.average_match_score || 0)
                        const attention = Number(job.needs_attention_count || 0)
                        const strong = Number(job.strong_match_count || 0)

                        const status =
                          count === 0
                            ? 'Awaiting applicants'
                            : score >= 80
                              ? 'Strong pool'
                              : score >= 60
                                ? 'Review fit'
                                : 'Needs attention'

                        const initials = getRoleInitials(job.job_title)

                        return (
                          <button
                            key={job.job_id}
                            type="button"
                            style={styles.roleCard}
                            onClick={() => navigate(`/recruiter/applications?job=${job.job_id}`)}
                          >
                            <div style={styles.roleCardTop}>
                              <div style={styles.roleIdentity}>
                                <div style={styles.roleAvatar}>{initials}</div>

                                <div style={styles.roleIdentityText}>
                                  <div style={styles.roleTitleLine}>
                                    <span style={styles.jobName}>{job.job_title}</span>
                                    <RoleBadge status={status} />
                                  </div>
                                </div>
                              </div>

                              <ChevronRight size={18} style={styles.roleChevron} />
                            </div>

                            <div style={styles.roleCardBody}>
                              <div style={styles.roleMetricGroup}>
                                <div style={styles.roleMetric}>
                                  <div style={styles.roleMetricValue}>
                                    <UsersRound size={16} />
                                    <strong>{count}</strong>
                                  </div>
                                  <span style={styles.roleMetricLabel}>
                                    Applicant{count === 1 ? '' : 's'}
                                  </span>
                                </div>

                                <div style={styles.roleMetric}>
                                  <div style={{ ...styles.roleMetricValue, color: '#168b72' }}>
                                    <Star size={16} />
                                    <strong>{strong}</strong>
                                  </div>
                                  <span style={styles.roleMetricLabel}>
                                    Strong match{strong === 1 ? '' : 'es'}
                                  </span>
                                </div>

                                <div style={styles.roleMetric}>
                                  <div
                                    style={{
                                      ...styles.roleMetricValue,
                                      color: attention ? '#d06b39' : '#8b8e98',
                                    }}
                                  >
                                    <AlertTriangle size={16} />
                                    <strong>{attention}</strong>
                                  </div>
                                  <span style={styles.roleMetricLabel}>Needs attention</span>
                                </div>
                              </div>

                              <div style={styles.roleMatch}>
                                <div style={styles.roleMatchValue}>
                                  <strong>{count ? `${score.toFixed(2)}%` : '—'}</strong>
                                  <span>Average candidate match</span>
                                </div>

                                <div style={styles.roleMatchTrack}>
                                  <div
                                    style={{
                                      ...styles.roleMatchFill,
                                      width: `${count ? Math.min(Math.max(score, 0), 100) : 0}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    <div style={styles.roleHiringInsight}>
                      <div style={styles.roleHiringInsightIcon}>
                        <Sparkles size={15} />
                      </div>
                      <div style={styles.roleHiringInsightContent}>
                        <strong>Hiring insight</strong>
                        <span>
                          {data?.hiring_signal ||
                            'Review role-level candidate signals before moving applicants forward.'}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section style={styles.bottomGrid}>
                    <div style={styles.card}>
                      <div style={styles.sectionHeader}>
                        <div>
                          <div style={styles.sectionEyebrow}>SKILL SIGNALS</div>
                          <h2 style={styles.sectionTitle}>Top applicant skills</h2>
                        </div>
                        <BarChart3 size={19} color="#7869b0" />
                      </div>

                      <div style={styles.skillList}>
                        {topSkills.slice(0, 8).map((item) => (
                          <div key={item.skill} style={styles.skillRow}>
                            <div style={styles.skillRowTop}>
                              <span>{item.skill}</span>
                              <strong>{item.applicant_count}</strong>
                            </div>
                            <div style={styles.skillTrack}>
                              <div style={{ ...styles.skillFill, width: `${(Number(item.applicant_count || 0) / maxSkillCount) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={styles.card}>
                      <div style={styles.sectionHeader}>
                        <div>
                          <div style={styles.sectionEyebrow}>GAP SIGNALS</div>
                          <h2 style={styles.sectionTitle}>Recurring skill gaps</h2>
                        </div>
                        <AlertTriangle size={19} color="#7869b0" />
                      </div>

                      {skillGaps.length ? (
                        <div style={styles.skillList}>
                          {skillGaps.slice(0, 6).map((item) => (
                            <div key={item.skill} style={styles.skillRow}>
                              <div style={styles.skillRowTop}>
                                <span>{item.skill}</span>
                                <strong>{item.applicant_count}</strong>
                              </div>
                              <div style={styles.skillTrack}>
                                <div style={{ ...styles.gapFill, width: `${(Number(item.applicant_count || 0) / maxGapCount) * 100}%` }} />
                              </div>
                              <span style={styles.gapMeta}>
                                {item.required_gap_count
                                  ? `${item.required_gap_count} required-skill gap${item.required_gap_count === 1 ? '' : 's'}`
                                  : 'Skill gap signal'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={styles.noGapState}>
                          <CheckCircle2 size={18} />
                          <span>No recurring skill gaps detected across the current applicant pool.</span>
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function MetricCard({ icon, label, value, helper }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricIcon}>{icon}</div>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
      <div style={styles.metricHelper}>{helper}</div>
    </div>
  )
}

function Signal({ label, value, detail }) {
  return (
    <div style={styles.signalCard}>
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{detail}</small>
    </div>
  )
}

function DecisionCard({ icon, eyebrow, title, value, detail, tone, onClick }) {
  return (
    <button type="button" style={{ ...styles.decisionCard, ...styles[`decision_${tone}`] }} onClick={onClick}>
      <div style={styles.decisionTop}>
        <div style={styles.decisionIcon}>{icon}</div>
        <ArrowUpRight size={15} />
      </div>
      <div style={styles.decisionEyebrow}>{eyebrow}</div>
      <div style={styles.decisionTitle}>{title}</div>
      <div style={styles.decisionValue}>{value}</div>
      <div style={styles.decisionDetail}>{detail}</div>
    </button>
  )
}

function getRoleInitials(title = '') {
  const words = String(title).trim().split(/\s+/).filter(Boolean)
  if (!words.length) return 'R'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

function RoleBadge({ status }) {
  const className = status === 'Strong pool'
    ? 'positive'
    : status === 'Needs attention'
      ? 'attention'
      : status === 'Review fit'
        ? 'neutral'
        : 'muted'

  return <span style={{ ...styles.roleBadge, ...styles[`badge_${className}`] }}>{status}</span>
}

const styles = {
  page: { minHeight: '100%', background: '#f8f7f4', padding: '34px 30px 60px' },
  container: { maxWidth: '1240px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '24px', marginBottom: '28px' },
  eyebrow: { color: '#7869b0', fontSize: '11px', fontWeight: 900, letterSpacing: '0.12em' },
  title: { margin: '7px 0 6px', color: '#252d40', fontSize: '30px', lineHeight: 1.15, fontWeight: 850 },
  subtitle: { margin: 0, maxWidth: '680px', color: '#7b8190', fontSize: '13px', lineHeight: 1.65 },
  refreshButton: { display: 'inline-flex', alignItems: 'center', gap: '8px', height: '42px', padding: '0 15px', border: '1px solid #ded9e7', borderRadius: '11px', background: '#fff', color: '#5d5673', fontSize: '12px', fontWeight: 800, cursor: 'pointer' },
  metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '18px' },
  metricCard: { background: '#fff', border: '1px solid #e9e5df', borderRadius: '17px', padding: '18px 19px', boxShadow: '0 8px 24px rgba(42, 37, 54, 0.035)' },
  metricIcon: { width: '38px', height: '38px', display: 'grid', placeItems: 'center', borderRadius: '11px', background: '#f0ebfa', color: '#7565a9', marginBottom: '12px' },
  metricLabel: { color: '#777d8b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em' },
  metricValue: { marginTop: '5px', color: '#252d40', fontSize: '27px', lineHeight: 1.1, fontWeight: 850 },
  metricHelper: { marginTop: '6px', color: '#9a9eaa', fontSize: '11px' },
  topGrid: { display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '18px', marginBottom: '18px' },
  bottomGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginTop: '18px' },
  card: { minWidth: 0, background: '#fff', border: '1px solid #e9e5df', borderRadius: '18px', padding: '22px', boxShadow: '0 8px 24px rgba(42, 37, 54, 0.035)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', marginBottom: '22px' },
  sectionEyebrow: { color: '#948da1', fontSize: '9px', fontWeight: 900, letterSpacing: '0.12em' },
  sectionTitle: { margin: '5px 0 0', color: '#2d3548', fontSize: '18px', fontWeight: 850 },
  funnelList: { display: 'grid', gap: '17px' },
  funnelRow: {},
  funnelLabelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#4f5667', fontSize: '12px', fontWeight: 700, marginBottom: '7px' },
  progressTrack: { height: '8px', background: '#eeeaf2', borderRadius: '99px', overflow: 'hidden' },
  progressFill: { height: '100%', background: '#8878b1', borderRadius: '99px', minWidth: '0' },
  percentage: { display: 'block', marginTop: '5px', color: '#a0a3ad', fontSize: '10px' },
  bigScore: { color: '#6e5e9e', fontSize: '48px', lineHeight: 1, fontWeight: 900 },
  scoreDescription: { margin: '9px 0 20px', color: '#858a98', fontSize: '12px', lineHeight: 1.6 },
  signalGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
  signalCard: { display: 'grid', gap: '3px', background: '#faf9fb', border: '1px solid #eeeaf2', borderRadius: '11px', padding: '11px 10px', color: '#2f3545' },
  insightBox: { display: 'grid', gap: '6px', marginTop: '16px', padding: '13px 14px', background: '#f3effa', border: '1px solid #e5ddf1', borderRadius: '12px', color: '#6e6880', fontSize: '11px', lineHeight: 1.55 },
  insightHeading: { display: 'flex', alignItems: 'center', gap: '6px', color: '#62558b' },
  decisionGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px', marginBottom: '18px' },
  decisionCard: { textAlign: 'left', border: '1px solid #e9e5df', borderRadius: '16px', padding: '17px', background: '#fff', color: '#2d3548', cursor: 'pointer', boxShadow: '0 8px 24px rgba(42, 37, 54, 0.03)' },
  decision_positive: { borderColor: '#e3ddef', background: '#fbf9fe' },
  decision_attention: { borderColor: '#eadfd7', background: '#fdfaf8' },
  decision_neutral: { borderColor: '#e5e1eb', background: '#fcfbfd' },
  decisionTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#8174aa' },
  decisionIcon: { width: '31px', height: '31px', display: 'grid', placeItems: 'center', borderRadius: '9px', background: '#f0ebfa' },
  decisionEyebrow: { marginTop: '13px', color: '#928b9d', fontSize: '9px', fontWeight: 900, letterSpacing: '0.12em' },
  decisionTitle: { marginTop: '5px', color: '#30384b', fontSize: '14px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  decisionValue: { marginTop: '8px', color: '#6e5e9e', fontSize: '25px', lineHeight: 1, fontWeight: 900 },
  decisionDetail: { marginTop: '6px', color: '#858a98', fontSize: '10px', lineHeight: 1.5 },
  rolePerformanceCard: { minWidth: 0, background: '#fff', border: '1px solid #e9e5df', borderRadius: '18px', padding: '22px', boxShadow: '0 8px 24px rgba(42, 37, 54, 0.035)', marginBottom: '18px' },
  roleSectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '18px', marginBottom: '20px' },
  roleSectionSubtitle: { margin: '6px 0 0', color: '#858a98', fontSize: '11px', lineHeight: 1.55 },
  roleGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(300px, 1fr))', gap: '12px' },
  roleCard: { width: '100%', minWidth: 0, minHeight: '174px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left', border: '1px solid #e5e0ec', borderRadius: '16px', background: '#fff', padding: '15px 16px 14px', color: '#30384b', cursor: 'pointer', boxShadow: '0 4px 16px rgba(42, 37, 54, 0.035)', transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease' },
  roleCardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' },
  roleIdentity: { display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0, flex: 1 },
  roleAvatar: { width: '40px', height: '40px', flex: '0 0 40px', display: 'grid', placeItems: 'center', borderRadius: '11px', background: '#eee9fb', color: '#6756a0', fontSize: '12px', fontWeight: 900, letterSpacing: '-0.02em' },
  roleIdentityText: { minWidth: 0 },
  roleTitleLine: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'wrap' },
  jobName: { minWidth: 0, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 800, fontSize: '13px', lineHeight: 1.35 },
  roleChevron: { flex: '0 0 auto', color: '#5d5673' },
  roleBadge: { flex: '0 0 auto', padding: '4px 7px', borderRadius: '999px', fontSize: '8px', fontWeight: 850, letterSpacing: '0.02em', whiteSpace: 'nowrap' },
  badge_positive: { color: '#267c68', background: '#e5f5ef' },
  badge_attention: { color: '#b5572d', background: '#f9e9df' },
  badge_neutral: { color: '#8b672d', background: '#faf0d9' },
  badge_muted: { color: '#73737b', background: '#f0eff2' },
  roleCardBody: { marginTop: '15px' },
  roleMetricGroup: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0edf2' },
  roleMetric: { minWidth: 0 },
  roleMetricValue: { display: 'flex', alignItems: 'center', gap: '5px', color: '#62538f', fontSize: '15px', lineHeight: 1 },
  roleMetricLabel: { display: 'block', marginTop: '5px', color: '#8c909c', fontSize: '9px', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  roleMatch: { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' },
  roleMatchValue: { width: '145px', flex: '0 0 145px', display: 'grid', gap: '3px', color: '#5f4f92' },
  roleMatchTrack: { flex: 1, height: '8px', background: '#eeeaf2', borderRadius: '99px', overflow: 'hidden' },
  roleMatchFill: { height: '100%', background: '#7967ad', borderRadius: '99px', transition: 'width 0.25s ease' },
  roleHiringInsight: { display: 'flex', alignItems: 'center', gap: '9px', marginTop: '14px', padding: '11px 13px', border: '1px solid #e5ddf1', borderRadius: '12px', background: '#f6f1fd', color: '#6e6880', fontSize: '10px', lineHeight: 1.5 },
  roleHiringInsightIcon: { width: '26px', height: '26px', flex: '0 0 26px', display: 'grid', placeItems: 'center', borderRadius: '8px', background: '#ebe3f8', color: '#6f5ca1' },
  roleHiringInsightContent: { display: 'grid', gap: '2px', minWidth: 0 },

  skillList: { display: 'grid', gap: '14px' },
  skillRow: { minWidth: 0 },
  skillRowTop: { display: 'flex', justifyContent: 'space-between', gap: '12px', color: '#505767', fontSize: '11px', fontWeight: 750, marginBottom: '6px' },
  skillTrack: { height: '6px', background: '#eeeaf2', borderRadius: '99px', overflow: 'hidden' },
  skillFill: { height: '100%', background: '#a091c6', borderRadius: '99px' },
  gapFill: { height: '100%', background: '#b28d83', borderRadius: '99px' },
  gapMeta: { display: 'block', marginTop: '5px', color: '#aaa0a0', fontSize: '9px' },
  noGapState: { minHeight: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', color: '#7e8290', fontSize: '11px', lineHeight: 1.55, textAlign: 'center' },
  linkButton: { display: 'inline-flex', alignItems: 'center', gap: '4px', border: 0, background: 'transparent', color: '#70619f', fontSize: '11px', fontWeight: 800, cursor: 'pointer' },
  emptyCard: { background: '#fff', border: '1px solid #e9e5df', borderRadius: '18px', padding: '62px 30px', textAlign: 'center' },
  emptyIcon: { width: '52px', height: '52px', margin: '0 auto 14px', display: 'grid', placeItems: 'center', borderRadius: '15px', background: '#f0ebfa', color: '#7565a9' },
  emptyTitle: { margin: 0, color: '#30384b', fontSize: '18px', fontWeight: 850 },
  emptyText: { maxWidth: '560px', margin: '8px auto 19px', color: '#858b98', fontSize: '12px', lineHeight: 1.65 },
  primaryButton: { display: 'inline-flex', alignItems: 'center', gap: '7px', border: 0, borderRadius: '10px', background: '#7869b0', color: '#fff', padding: '10px 15px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' },
  loadingCard: { background: '#fff', border: '1px solid #e9e5df', borderRadius: '18px', padding: '45px', textAlign: 'center', color: '#7d8391', fontSize: '13px' },
  errorCard: { display: 'grid', gap: '7px', background: '#fff', border: '1px solid #ead9d4', borderRadius: '18px', padding: '28px', color: '#777d8a', fontSize: '12px' },
  retryButton: { width: 'fit-content', marginTop: '7px', border: '1px solid #ddd5e8', borderRadius: '9px', background: '#f5f1fa', color: '#6e5d9d', padding: '9px 13px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' },
}

export default RecruiterAnalyticsPage
