import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API from '../utils/api';

const CATEGORIES = ['Frontend', 'Backend', 'AI/ML', 'DevOps', 'Mobile', 'Database', 'Cloud', 'Other'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const LEVEL_COLOR = { Beginner: 'badge-gray', Intermediate: 'badge-blue', Advanced: 'badge-purple', Expert: 'badge-yellow' };
const CAT_COLOR = {
  Frontend: 'badge-cyan', Backend: 'badge-blue', 'AI/ML': 'badge-purple',
  DevOps: 'badge-yellow', Mobile: 'badge-green', Database: 'badge-red',
  Cloud: 'badge-cyan', Other: 'badge-gray'
};

const emptyForm = { name: '', category: 'Frontend', level: 'Beginner', progress: 0, certificationLink: '' };

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState('My Skills');
  const [filterCat, setFilterCat] = useState('All');

  // Dynamic trending state
  const [trendingSkills, setTrendingSkills] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(false);

  const fetchSkills = async () => {
    try {
      const res = await API.get('/skills');
      setSkills(res.data);
    } catch { toast.error('Failed to load skills'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSkills(); }, []);

  // Fetch trending skills from AI when switching to Trending tab
  useEffect(() => {
    if (activeTab === 'Trending' && trendingSkills.length === 0 && !trendingLoading) {
      fetchTrendingSkills();
    }
  }, [activeTab]);

  const fetchTrendingSkills = async () => {
    setTrendingLoading(true);
    try {
      const year = new Date().getFullYear();
      const res = await API.post('/ai/chat', {
        messages: [{
          role: 'user',
          content: `What are the top 12 most in-demand tech skills for ${year}? Respond ONLY with a JSON array (no extra text): [{"name":"SkillName","category":"Frontend|Backend|AI/ML|DevOps|Mobile|Database|Cloud|Other","reason":"1 line why it's trending"}]. Cover a mix of categories.`
        }]
      });

      const match = res.data.reply.match(/\[[\s\S]*?\]/);
      if (match) {
        setTrendingSkills(JSON.parse(match[0]));
      } else {
        toast.error('Could not parse trending skills. Try refreshing.');
      }
    } catch {
      toast.error('Failed to fetch trending skills. Try again.');
    } finally {
      setTrendingLoading(false);
    }
  };

  const openAdd = (prefill = null) => {
    setEditing(null);
    setForm(prefill ? { ...emptyForm, ...prefill } : emptyForm);
    setShowModal(true);
  };

  const openEdit = (skill) => {
    setEditing(skill._id);
    setForm({ name: skill.name, category: skill.category, level: skill.level, progress: skill.progress, certificationLink: skill.certificationLink || '' });
    setShowModal(true);
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Skill name required');
    try {
      if (editing) {
        const res = await API.put(`/skills/${editing}`, form);
        setSkills(s => s.map(sk => sk._id === editing ? res.data : sk));
        toast.success('Skill updated!');
      } else {
        const res = await API.post('/skills', form);
        setSkills(s => [res.data, ...s]);
        toast.success('Skill added!');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving skill');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this skill?')) return;
    try {
      await API.delete(`/skills/${id}`);
      setSkills(s => s.filter(sk => sk._id !== id));
      toast.success('Skill deleted');
    } catch { toast.error('Delete failed'); }
  };

  const filteredSkills = filterCat === 'All' ? skills : skills.filter(s => s.category === filterCat);

  // Filter out skills the user already has
  const alreadyHave = skills.map(s => s.name.toLowerCase());
  const suggestions = trendingSkills.filter(s => !alreadyHave.includes(s.name.toLowerCase()));

  // Dynamic skill gap: compare user's skills vs trending per category
  const gapAnalysis = CATEGORIES.map(cat => {
    const myCount = skills.filter(s => s.category === cat).length;
    const trendingCount = trendingSkills.filter(s => s.category === cat).length;
    const pct = trendingCount === 0 ? 100 : Math.round((myCount / trendingCount) * 100);
    return { cat, myCount, trendingCount, pct: Math.min(pct, 100) };
  }).filter(g => g.trendingCount > 0); // Only show categories that have trending skills

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">⚡ Skills</h1>
            <p className="page-subtitle">Track your technical skills and growth</p>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => openAdd()}>
            ＋ Add Skill
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="tabs">
          {['My Skills', 'Trending'].map(t => (
            <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>

        {activeTab === 'My Skills' && (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {['All', ...CATEGORIES].map(c => (
                <button key={c} onClick={() => setFilterCat(c)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: filterCat === c ? 'var(--primary)' : 'var(--bg-card)',
                    color: filterCat === c ? '#fff' : 'var(--text-muted)',
                    border: `1px solid ${filterCat === c ? 'var(--primary)' : 'var(--border)'}`,
                    transition: 'all 0.2s', fontFamily: 'inherit'
                  }}>
                  {c}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
            ) : filteredSkills.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">⚡</div>
                <h3>No skills yet</h3>
                <p>Add your first technical skill and start tracking your progress!</p>
                <button className="btn btn-primary" style={{ width: 'auto', margin: '0 auto' }} onClick={() => openAdd()}>Add Skill</button>
              </div>
            ) : (
              <div className="grid-3">
                {filteredSkills.map((sk, i) => (
                  <div key={sk._id} className="skill-card" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="skill-header">
                      <div>
                        <div className="skill-name">{sk.name}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                          <span className={`badge ${CAT_COLOR[sk.category] || 'badge-gray'}`}>{sk.category}</span>
                          <span className={`badge ${LEVEL_COLOR[sk.level]}`}>{sk.level}</span>
                        </div>
                      </div>
                      <div className="skill-actions">
                        <button className="btn-icon" onClick={() => openEdit(sk)} title="Edit">✏️</button>
                        <button className="btn-icon" onClick={() => handleDelete(sk._id)} title="Delete">🗑️</button>
                      </div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                        <span>Progress</span><span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{sk.progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${sk.progress}%` }} />
                      </div>
                    </div>
                    {sk.certificationLink && (
                      <a href={sk.certificationLink} target="_blank" rel="noreferrer"
                        style={{ display: 'block', marginTop: 10, fontSize: 12, color: 'var(--primary-light)', textDecoration: 'none' }}>
                        🏆 View Certification →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'Trending' && (
          <div>
            {/* Trending Skills Section */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>🔥 Trending Tech Stack for {new Date().getFullYear()}</h3>
                {!trendingLoading && (
                  <button onClick={() => { setTrendingSkills([]); fetchTrendingSkills(); }}
                    style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 12px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                    🔄 Refresh
                  </button>
                )}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
                {trendingLoading ? '🤖 Fetching latest in-demand skills...' : 'Skills that are in high demand. Click any to add it to your profile!'}
              </p>

              {trendingLoading ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} style={{ height: 32, width: 90, background: 'var(--border)', borderRadius: 20, opacity: 0.5 }} />
                  ))}
                </div>
              ) : suggestions.length === 0 && trendingSkills.length > 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>🎉 You already have all the trending skills!</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {suggestions.map(s => (
                    <button key={s.name}
                      className={`trending-chip ${['AI/ML', 'Backend'].includes(s.category) ? 'hot' : ''}`}
                      onClick={() => { openAdd({ name: s.name, category: s.category }); setActiveTab('My Skills'); }}
                      title={s.reason || ''}>
                      {s.name}
                      <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 2 }}>+{s.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Skill Gap Analysis — dynamic based on AI trending data */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📊 Skill Gap Analysis</h3>

              {trendingLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i}>
                      <div style={{ height: 12, width: '40%', background: 'var(--border)', borderRadius: 6, marginBottom: 8, opacity: 0.5 }} />
                      <div style={{ height: 8, background: 'var(--border)', borderRadius: 6, opacity: 0.3 }} />
                    </div>
                  ))}
                </div>
              ) : gapAnalysis.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Load trending skills first to see your skill gap.</p>
              ) : (
                gapAnalysis.map(({ cat, myCount, trendingCount, pct }) => (
                  <div key={cat} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ fontWeight: 600 }}>{cat}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{myCount} / {trendingCount} trending skills</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width: `${pct}%`,
                        background: pct === 0 ? '#ef4444' : pct < 50 ? '#f59e0b' : '#22c55e'
                      }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing ? '✏️ Edit Skill' : '➕ Add Skill'}</span>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Skill Name</label>
                <input className="form-input" placeholder="e.g. React, Python, Docker" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Level</label>
                  <select className="form-input" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
                    {LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Progress: {form.progress}%</label>
                <input type="range" min="0" max="100" step="5" value={form.progress}
                  onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Certification Link (optional)</label>
                <input className="form-input" type="url" placeholder="https://..." value={form.certificationLink} onChange={e => setForm(f => ({ ...f, certificationLink: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{editing ? 'Update Skill' : 'Add Skill'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}