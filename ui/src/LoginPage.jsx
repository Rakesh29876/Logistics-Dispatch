import { useState } from 'react'
import {
  AlertCircle, ArrowRight, Building2,
  Eye, EyeOff, Factory, Globe, KeyRound, Lock, Moon, Scale,
  ShieldCheck, Sun, Truck, UserCheck, Warehouse, X
} from 'lucide-react'

const DEMO_PERSONAS = [
  {
    role: 'MANAGER',
    title: 'Manager / Admin',
    shortTitle: '👔 Manager',
    desc: 'Executive analytics, plant reports & full RBAC',
    user: 'mgr_admin',
    pass: 'GwcAdmin#2026!',
    badge: 'ALL PLANTS · FULL RBAC',
    color: '#0ea5e9',
    icon: ShieldCheck,
    camView: 'overview',
  },
  {
    role: 'DISPATCH_WORKER',
    title: 'Dispatch Worker',
    shortTitle: '🚛 Dispatch',
    desc: 'Dock staging priorities, bay allocation & approvals',
    user: 'dispatch_worker',
    pass: 'dispatch123',
    badge: 'FG-WH-01 · DOCK STAGING',
    color: '#f59e0b',
    icon: Warehouse,
    camView: 'dock',
  },
  {
    role: 'LOGISTICS_PERSONNEL',
    title: 'Logistics Personnel',
    shortTitle: '📦 Logistics',
    desc: 'Corridor fleet turnaround, GPS TAT & weighbridge',
    user: 'logistics_personnel',
    pass: 'logistics123',
    badge: 'CORRIDOR FLEET · GPS TAT',
    color: '#10b981',
    icon: Truck,
    camView: 'weighbridge',
  },
]

export default function LoginPage({ onLoginSuccess, theme, onToggleTheme }) {
  const [identifier, setIdentifier] = useState('mgr_admin')
  const [password, setPassword] = useState('GwcAdmin#2026!')
  const [selectedRole, setSelectedRole] = useState('MANAGER')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showForgot, setShowForgot] = useState(false)
  const [forgotIdent, setForgotIdent] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')

  const activePersona = DEMO_PERSONAS.find(p => p.role === selectedRole && p.user === identifier) || DEMO_PERSONAS[0]

  const handleSelectPersona = (p) => {
    setSelectedRole(p.role)
    setIdentifier(p.user)
    setPassword(p.pass)
    setError('')
  }

  const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!identifier.trim() || !password) {
      setError('Please enter both Username / Employee ID and Password.')
      return
    }
    setLoading(true)
    try {
      const loginUrl = `${API_BASE}/api/auth/login`
      const r = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          remember_me: rememberMe,
        }),
      })
      const text = await r.text()
      let res = {}
      try {
        res = text ? JSON.parse(text) : {}
      } catch {
        if (r.status === 405 || !API_BASE) {
          throw new Error('Backend URL not connected. Please set VITE_API_BASE_URL in Vercel settings to your Render backend URL and redeploy.')
        }
        throw new Error(`Server returned status ${r.status}`)
      }
      if (!r.ok) {
        if (r.status === 405 || !API_BASE) {
          throw new Error('Backend URL not connected. Please set VITE_API_BASE_URL in Vercel settings to your Render backend URL and redeploy.')
        }
        throw new Error(res.detail || 'Authentication failed.')
      }
      onLoginSuccess(res.access_token, res.user, rememberMe)
    } catch (err) {
      setError(err.message || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  const submitForgot = async (e) => {
    e.preventDefault()
    if (!forgotIdent.trim()) return
    try {
      const r = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdent.trim() }),
      })
      const res = await r.json()
      setForgotMsg(res.message || 'Reset request recorded for Operations Manager review.')
    } catch {
      setForgotMsg('Unable to submit request. Contact your Operations Manager.')
    }
  }

  return (
    <div className="login-shell">
      {/* ===================== 1. REALISTIC 3D MANUFACTURING FACILITY BACKGROUND ===================== */}
      <LoginBackground3D theme={theme} cameraView={cameraView} />

      {/* ===================== 2. CINEMATIC FROSTED BLUR BACKDROP ===================== */}
      <div className="login-blur-backdrop" />

      {/* ===================== 3. UNIFIED HIGH-END INTERFACE OVERLAY ===================== */}
      <div className="login-unified-overlay">
        {/* Top Minimalist Header */}
        <header className="login-top-bar">
          <div className="login-brand-tag">
            <img
              src={theme === 'dark' ? '/logos/logo-horizontal-dark.png' : '/logos/logo-horizontal-light.png'}
              alt="GWC DATA.AI"
              className="login-top-logo"
            />
            <span className="brand-tag-divider" />
            <span className="live-status-dot" />
            <span className="brand-tag-text">APEX MANUFACTURING OPERATIONS · ENTERPRISE CONTROL TOWER</span>
          </div>

          <div className="login-top-actions">
            {/* Day / Night Shift Mode Toggle */}
            <button
              className="shift-mode-toggle"
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'light' ? 'Night Shift Mode' : 'Day Shift Mode'}`}
            >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              <span>{theme === 'light' ? 'Night Shift' : 'Day Shift'}</span>
            </button>
          </div>
        </header>

        {/* CENTER: SINGLE UNIFIED LOGIN INTERFACE */}
        <main className="login-center-stage">
          <div className="login-unified-card">
            {/* Card Header with Brand & Title */}
            <div className="unified-card-head">
              <img
                src={theme === 'dark' ? '/logos/logo-stacked-dark.png' : '/logos/logo-stacked-light.png'}
                alt="GWC DATA.AI"
                className="unified-logo"
              />
              <div className="unified-agent-pill">
                <ShieldCheck size={13} />
                <span>AGENT 12 / 20 · ENTERPRISE CONTROL TOWER</span>
              </div>
              <h1 className="unified-title">Intelligent Logistics Operations</h1>
              <p className="unified-subtitle">
                Autonomous Turnaround Optimization, Real-Time Fleet Telemetry &amp; Domo AI on Neon PostgreSQL
              </p>
            </div>

            {/* Persona Quick Select Segmented Tabs */}
            <div className="unified-persona-box">
              <div className="persona-box-header">
                <span>SELECT DEMO PERSONA:</span>
              </div>

              <div className="persona-tabs-row">
                {DEMO_PERSONAS.map((p) => {
                  const Icon = p.icon
                  const isSelected = selectedRole === p.role && identifier === p.user
                  return (
                    <button
                      key={p.role}
                      type="button"
                      className={`persona-tab-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelectPersona(p)}
                      style={{
                        borderColor: isSelected ? p.color : undefined,
                        background: isSelected
                          ? (theme === 'dark' ? 'rgba(14, 165, 233, 0.16)' : 'rgba(14, 165, 233, 0.10)')
                          : undefined,
                      }}
                    >
                      <Icon size={14} color={isSelected ? p.color : 'var(--text-muted)'} />
                      <span style={{ color: isSelected ? p.color : 'var(--text-primary)' }}>
                        {p.shortTitle}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="persona-active-badge">
                <span className="active-badge-tag" style={{ color: activePersona.color }}>
                  {activePersona.badge}
                </span>
                <span className="active-badge-desc">
                  {activePersona.desc}
                </span>
              </div>
            </div>

            {error && (
              <div className="unified-error-alert">
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="unified-form">
              <label className="unified-field">
                <span className="field-label">Username or Employee ID</span>
                <div className="unified-input-wrap">
                  <UserCheck size={16} className="input-icon" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. mgr_admin"
                    autoComplete="username"
                  />
                  {identifier && (
                    <button
                      type="button"
                      onClick={() => setIdentifier('')}
                      className="clear-input-btn"
                      title="Clear"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </label>

              <label className="unified-field">
                <span className="field-label">Password</span>
                <div className="unified-input-wrap">
                  <Lock size={16} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="eye-toggle-btn"
                    onClick={() => setShowPassword((s) => !s)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <div className="unified-aux-row">
                <label className="remember-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me (7 days)</span>
                </label>

                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => { setShowForgot(true); setForgotMsg('') }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="unified-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Control Tower</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Single Unified Interface Footer */}
            <div className="unified-card-foot">
              <KeyRound size={12} />
              <span>2 Plants (KA-01 / TN-01) · WB-01 Certified 60T · TLS 1.3 AES-256</span>
            </div>
          </div>
        </main>

        {/* Bottom Status Information */}
        <footer className="login-unified-footer">
          <span>🏭 Apex Manufacturing Complex</span>
          <span>•</span>
          <span>Unit A Machining</span>
          <span>•</span>
          <span>FG-WH-01 Docks</span>
          <span>•</span>
          <span>Weighbridge WB-01 Active</span>
          <span>•</span>
          <span>🔒 Enterprise Single Sign-On · AES-256 TLS 1.3 Certified Session</span>
        </footer>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="modal-overlay" onClick={() => setShowForgot(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Password Reset Request</h3>
              <button className="icon-btn" onClick={() => setShowForgot(false)}><X size={18} /></button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
              Enter your Employee ID or Username. An audit-logged reset request will be queued for your Operations Manager to issue a temporary password.
            </p>
            <form onSubmit={submitForgot} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="unified-input-wrap">
                <UserCheck size={16} />
                <input
                  type="text"
                  value={forgotIdent}
                  onChange={(e) => setForgotIdent(e.target.value)}
                  placeholder="Employee ID or Username"
                />
              </div>
              {forgotMsg && (
                <div className="notice-banner info" style={{ marginBottom: 0 }}>{forgotMsg}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForgot(false)}>Close</button>
                <button type="submit" className="btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
