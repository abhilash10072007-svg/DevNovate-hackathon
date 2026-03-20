import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const [form, setForm] = useState({ name: '', bio: '', college: '', graduation: '', github: '', linkedin: '', portfolio: '', avatar: '' });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState({ skills: 0, projects: 0, internships: 0 });

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', bio: user.bio || '', college: user.college || '', graduation: user.graduation || '', github: user.github || '', linkedin: user.linkedin || '', portfolio: user.portfolio || '', avatar: user.avatar || '' });
    }
    Promise.all([API.get('/skills'), API.get('/projects'), API.get('/internships')])
      .then(([s, p, i]) => setStats({ skills: s.data.length, projects: p.data.length, internships: i.data.length }))
      .catch(() => {});
  }, [user]);

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await API.put('/profile', form);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); window.location.href = '/login'; };
  const initial = form.name?.[0]?.toUpperCase() || '?';

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">👤 Profile</h1>
            <p className="page-subtitle">Manage your personal information and social links</p>
          </div>
          <button onClick={handleLogout} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 18px', color: '#f87171', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="profile-hero">
          <div className="profile-avatar-large">
            {form.avatar ? <img src={form.avatar} alt="avatar" onError={e => e.target.style.display='none'} /> : initial}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{form.name || 'Your Name'}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>{user?.email}</p>
            {form.bio && <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 480, lineHeight: 1.6, marginBottom: 8 }}>{form.bio}</p>}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {form.college && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>🎓 {form.college}</span>}
              {form.graduation && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>📅 Class of {form.graduation}</span>}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              {form.github && <a href={form.github} target="_blank" rel="noreferrer" className="project-link github" style={{ textDecoration: 'none' }}>💻 GitHub</a>}
              {form.linkedin && <a href={form.linkedin} target="_blank" rel="noreferrer" className="project-link linkedin" style={{ textDecoration: 'none' }}>🔗 LinkedIn</a>}
              {form.portfolio && <a href={form.portfolio} target="_blank" rel="noreferrer" className="project-link live" style={{ textDecoration: 'none' }}>🌐 Portfolio</a>}
            </div>
          </div>
          <button onClick={() => setEditing(v => !v)}
            style={{ background: editing ? 'rgba(239,68,68,0.1)' : 'rgba(37,99,235,0.15)', border: `1px solid ${editing ? 'rgba(239,68,68,0.3)' : 'rgba(37,99,235,0.3)'}`, borderRadius: 10, padding: '10px 18px', color: editing ? '#f87171' : '#60a5fa', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>
            {editing ? '✕ Cancel' : '✏️ Edit Profile'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[{ label: 'Skills', value: stats.skills, icon: '⚡', color: '#2563eb' }, { label: 'Projects', value: stats.projects, icon: '🛠️', color: '#0ea5e9' }, { label: 'Applications', value: stats.internships, icon: '💼', color: '#8b5cf6' }].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {editing && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>✏️ Edit Your Information</h3>
            <form onSubmit={handleSave}>
              <div className="grid-2" style={{ gap: 14 }}>
                <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
                <div className="form-group"><label className="form-label">Avatar URL</label><input className="form-input" type="url" placeholder="https://..." value={form.avatar} onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Bio</label><textarea className="form-input" placeholder="Tell us about yourself..." value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} /></div>
              <div className="grid-2" style={{ gap: 14 }}>
                <div className="form-group"><label className="form-label">College</label><input className="form-input" placeholder="IIT, SKCET..." value={form.college} onChange={e => setForm(f => ({ ...f, college: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Graduation Year</label><input className="form-input" placeholder="2026" value={form.graduation} onChange={e => setForm(f => ({ ...f, graduation: e.target.value }))} /></div>
              </div>
              <div className="grid-2" style={{ gap: 14 }}>
                <div className="form-group"><label className="form-label">GitHub URL</label><input className="form-input" type="url" placeholder="https://github.com/username" value={form.github} onChange={e => setForm(f => ({ ...f, github: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">LinkedIn URL</label><input className="form-input" type="url" placeholder="https://linkedin.com/in/username" value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Portfolio Website</label><input className="form-input" type="url" placeholder="https://yourportfolio.com" value={form.portfolio} onChange={e => setForm(f => ({ ...f, portfolio: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>{saving ? '⏳ Saving...' : '💾 Save Changes'}</button>
              </div>
            </form>
          </div>
        )}

        {!editing && (
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📋 Account Details</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { label: 'Email', value: user?.email, icon: '📧' },
                { label: 'College', value: form.college || '— Not set', icon: '🎓' },
                { label: 'Graduation', value: form.graduation ? `Class of ${form.graduation}` : '— Not set', icon: '📅' },
                { label: 'GitHub', value: form.github || '— Not set', icon: '💻', link: form.github },
                { label: 'LinkedIn', value: form.linkedin || '— Not set', icon: '🔗', link: form.linkedin },
                { label: 'Portfolio', value: form.portfolio || '— Not set', icon: '🌐', link: form.portfolio },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 18 }}>{f.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</div>
                    {f.link ? <a href={f.link} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)', fontSize: 14, textDecoration: 'none' }}>{f.value}</a>
                      : <div style={{ color: 'var(--text)', fontSize: 14 }}>{f.value}</div>}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setEditing(true)} style={{ width: '100%', marginTop: 16, padding: '12px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 10, color: '#60a5fa', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>
              ✏️ Edit Profile
            </button>
          </div>
        )}
      </div>
    </>
  );
}
