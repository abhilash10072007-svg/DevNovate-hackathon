import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [token, setToken] = useState('')
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const t = params.get('token')
    if (!t) {
      setIsError(true)
      setMessage('Invalid or missing reset token. Please request a new link.')
    } else {
      setToken(t)
    }
  }, [location])

  const strength = () => {
    if (!password) return 0
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    return score
  }

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e']
  const s = strength()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    if (password.length < 6) {
      setIsError(true)
      setMessage('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setIsError(true)
      setMessage('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })
      const data = await res.json()

      if (!res.ok) {
        setIsError(true)
        setMessage(data.message || 'Failed to reset password.')
      } else {
        setIsError(false)
        setMessage(data.message)
        setDone(true)
        setTimeout(() => navigate('/login'), 3000)
      }
    } catch {
      setIsError(true)
      setMessage('Unable to reach server. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconWrap}>🔒</div>
          <h1 style={styles.title}>Reset Password</h1>
          <p style={styles.subtitle}>Enter your new password below.</p>
        </div>

        {/* Alert */}
        {message && (
          <div style={{ ...styles.alert, ...(isError ? styles.alertError : styles.alertSuccess) }}>
            {isError ? '❌' : '✅'} {message}
          </div>
        )}

        {!done && token ? (
          <form onSubmit={handleSubmit}>
            {/* New Password */}
            <div style={styles.field}>
              <label style={styles.label}>New Password</label>
              <div style={styles.inputWrap}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  style={styles.input}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={styles.eyeBtn}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Strength bar */}
              {password && (
                <div style={styles.strengthWrap}>
                  <div style={styles.strengthBar}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{
                        ...styles.strengthSegment,
                        background: i <= s ? strengthColor[s] : '#e2e8f0'
                      }} />
                    ))}
                  </div>
                  <span style={{ ...styles.strengthLabel, color: strengthColor[s] }}>
                    {strengthLabel[s]}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={styles.field}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                style={{
                  ...styles.input,
                  borderColor: confirm && password !== confirm ? '#ef4444' : '#e2e8f0'
                }}
                required
              />
              {confirm && password !== confirm && (
                <span style={styles.matchError}>Passwords don't match</span>
              )}
            </div>

            <button type="submit" disabled={loading} style={{
              ...styles.btn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}>
              {loading ? 'Resetting...' : '🔐 Reset Password'}
            </button>
          </form>
        ) : done ? (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>🎉</div>
            <p style={styles.successText}>
              Password reset successfully! Redirecting to login...
            </p>
            <div style={styles.progressBar}>
              <div style={styles.progressFill} />
            </div>
          </div>
        ) : null}

        <div style={styles.footer}>
          <Link to="/login" style={styles.backLink}>← Back to Sign In</Link>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
  },
  card: {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  iconWrap: {
    fontSize: '3rem',
    marginBottom: '1rem',
    display: 'block',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 0.5rem',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#64748b',
    lineHeight: '1.6',
    margin: 0,
  },
  alert: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    marginBottom: '1.25rem',
    fontWeight: '500',
  },
  alertError: {
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
  },
  alertSuccess: {
    background: '#f0fdf4',
    color: '#16a34a',
    border: '1px solid #bbf7d0',
  },
  field: {
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#64748b',
    marginBottom: '0.4rem',
  },
  inputWrap: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1.5px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '0.925rem',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    background: '#f8fafc',
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: 0,
  },
  strengthWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  strengthBar: {
    display: 'flex',
    gap: '3px',
    flex: 1,
  },
  strengthSegment: {
    flex: 1,
    height: '4px',
    borderRadius: '2px',
    transition: 'background 0.3s',
  },
  strengthLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    width: '50px',
    textAlign: 'right',
  },
  matchError: {
    fontSize: '0.75rem',
    color: '#ef4444',
    marginTop: '4px',
    display: 'block',
  },
  btn: {
    width: '100%',
    padding: '0.85rem',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    fontFamily: 'inherit',
    marginBottom: '1.5rem',
  },
  successBox: {
    textAlign: 'center',
    padding: '1.5rem',
    background: '#f0fdf4',
    borderRadius: '12px',
    border: '1.5px solid #bbf7d0',
    marginBottom: '1.5rem',
  },
  successIcon: {
    fontSize: '2.5rem',
    marginBottom: '0.75rem',
  },
  successText: {
    fontSize: '0.9rem',
    color: '#166534',
    marginBottom: '1rem',
    lineHeight: '1.6',
  },
  progressBar: {
    background: '#bbf7d0',
    borderRadius: '4px',
    height: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#16a34a',
    borderRadius: '4px',
    animation: 'progress 3s linear forwards',
    width: '100%',
  },
  footer: {
    textAlign: 'center',
  },
  backLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
}