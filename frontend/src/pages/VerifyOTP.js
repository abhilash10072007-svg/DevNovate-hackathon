import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function VerifyOTP() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const refs = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const email = location.state?.email;

  if (!email) { navigate('/register'); return null; }

  const handleChange = (index, val) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    if (val && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) refs.current[index - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      refs.current[5]?.focus();
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length !== 6) return toast.error('Enter all 6 digits');
    setLoading(true);
    try {
      const res = await API.post('/auth/verify-otp', { email, otp: otpStr });
      login(res.data.token, res.data.user);
      toast.success('Email verified! Welcome aboard 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await API.post('/auth/resend-otp', { email });
      toast.success('New OTP sent!');
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } catch (err) {
      toast.error('Failed to resend');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <h1 className="auth-title">Verify your email</h1>
        <p className="auth-subtitle">
          We sent a 6-digit code to<br/>
          <strong style={{ color: '#60a5fa' }}>{email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => refs.current[i] = el}
                className="otp-input"
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                autoFocus={i === 0}
              />
            ))}
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading || otp.join('').length !== 6}>
            {loading ? '⏳ Verifying...' : '✅ Verify Email'}
          </button>
        </form>

        <p style={{ marginTop: 20, color: 'var(--text-muted)', fontSize: 14 }}>
          Didn't receive the code?{' '}
          <button
            onClick={handleResend}
            disabled={resending}
            style={{ background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'inherit' }}
          >
            {resending ? 'Resending...' : 'Resend OTP'}
          </button>
        </p>
      </div>
    </div>
  );
}
