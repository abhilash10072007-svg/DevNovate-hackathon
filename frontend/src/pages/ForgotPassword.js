import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()

      if (!res.ok) {
        setIsError(true)
        setMessage(data.message || 'Something went wrong.')
      } else {
        setIsError(false)
        setMessage(data.message)
        setSent(true)
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
          <div style={styles.iconWrap}>🔐</div>
          <h1 style={styles.title}>Forgot Password?</h1>
          <p style={styles.subtitle}>
            No worries! Enter your email and we'll send you a reset link.
          </p>
        </div>

        {/* Alert */}
        {message && (
          <div style={{ ...styles.alert, ...(isError ? styles.alertError : styles.alertSuccess) }}>
            {isError ? '❌' : '✅'} {message}
          </div>
        )}

        {!sent ? (
          <form onSubmit={handleSubmit}>
            <div style={styles.field}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={styles.input}
                required
              />
            </div>

            <button type="submit" disabled={loading} style={{
              ...styles.btn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}>
              {loading ? 'Sending...' : '📧 Send Reset Link'}
            </button>
          </form>
        ) : (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>📬</div>
            <p style={styles.successText}>
              Check your inbox! A password reset link has been sent to <strong>{email}</strong>.
            </p>
            <p style={styles.successNote}>
              The link expires in 15 minutes. Check your spam folder if you don't see it.
            </p>
          </div>
        )}

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
    transition: 'border-color 0.2s',
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
    transition: 'opacity 0.2s',
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
    marginBottom: '0.5rem',
    lineHeight: '1.6',
  },
  successNote: {
    fontSize: '0.8rem',
    color: '#64748b',
    margin: 0,
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