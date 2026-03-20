import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API from '../utils/api';

const STATUSES = ['Wishlist', 'Applied', 'OA', 'Interview', 'Offer', 'Rejected'];
const STATUS_EMOJI = { Wishlist: '⭐', Applied: '📤', OA: '💻', Interview: '🎙️', Offer: '🎉', Rejected: '❌' };
const emptyForm = { company: '', role: '', status: 'Wishlist', appliedDate: '', notes: '', link: '' };

export default function Internships() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [view, setView] = useState('kanban');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [userSkills, setUserSkills] = useState([]);
  const [activeTab, setActiveTab] = useState('tracker');

  const fetchItems = async () => {
    try {
      const res = await API.get('/internships');
      setItems(res.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  // Auto-fetch suggestions when switching to AI tab
  useEffect(() => {
    if (activeTab === 'suggestions' && aiSuggestions.length === 0 && !suggestionsLoading) {
      fetchAISuggestions();
    }
  }, [activeTab]);

  const fetchAISuggestions = async () => {
    setSuggestionsLoading(true);
    try {
      // Fetch skills from backend
      const skillsRes = await API.get('/skills');
      const skills = skillsRes.data.map(s => s.name);
      setUserSkills(skills);

      if (skills.length === 0) {
        toast.error('No skills found! Add skills in your profile first.');
        setSuggestionsLoading(false);
        return;
      }

      const skillList = skills.join(', ');
      const today = new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' });

      const res = await API.post('/ai/chat', {
        messages: [{
          role: 'user',
          content: `Today is ${today}. A student knows these skills: ${skillList}. Based ONLY on these skills, suggest 6 internship opportunities that are the best match. Respond ONLY with a JSON array (no extra text): [{"company":"Name","role":"Role","type":"Remote/Hybrid/Onsite","difficulty":"Easy/Medium/Hard","reason":"Why it fits their specific skills","link":"https://careers.company.com"}]. Use real companies relevant to their skill set.`
        }]
      });

      const match = res.data.reply.match(/\[[\s\S]*?\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setAiSuggestions(parsed);
      } else {
        toast.error('Could not parse AI response. Try refreshing.');
      }
    } catch {
      toast.error('AI fetch failed. Try again.');
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const openAdd = (status = 'Wishlist', prefill = null) => {
    setEditing(null);
    setForm(prefill ? { ...emptyForm, ...prefill, status } : { ...emptyForm, status });
    setShowModal(true);
  };

  const openEdit = item => {
    setEditing(item._id);
    setForm({ company: item.company, role: item.role, status: item.status, appliedDate: item.appliedDate ? item.appliedDate.slice(0, 10) : '', notes: item.notes || '', link: item.link || '' });
    setShowModal(true);
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.company || !form.role) return toast.error('Company and role required');
    try {
      if (editing) {
        const res = await API.put(`/internships/${editing}`, form);
        setItems(is => is.map(i => i._id === editing ? res.data : i));
        toast.success('Updated!');
      } else {
        const res = await API.post('/internships', form);
        setItems(is => [res.data, ...is]);
        toast.success('Added!');
      }
      setShowModal(false);
    } catch { toast.error('Error saving'); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete?')) return;
    try { await API.delete(`/internships/${id}`); setItems(is => is.filter(i => i._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const changeStatus = async (id, newStatus) => {
    try { const res = await API.put(`/internships/${id}`, { status: newStatus }); setItems(is => is.map(i => i._id === id ? res.data : i)); }
    catch { toast.error('Update failed'); }
  };

  const stats = STATUSES.reduce((acc, s) => { acc[s] = items.filter(i => i.status === s).length; return acc; }, {});
  const DIFF_COLOR = { Easy: 'badge-green', Medium: 'badge-yellow', Hard: 'badge-red' };
  const TYPE_COLOR = { Remote: 'badge-cyan', Hybrid: 'badge-blue', Onsite: 'badge-purple' };

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">💼 Internship Tracker</h1>
            <p className="page-subtitle">Track applications + AI-powered company suggestions</p>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => { setActiveTab('tracker'); openAdd(); }}>＋ Add Application</button>
        </div>
      </div>

      <div className="page-body">
        <div className="tabs">
          <button className={`tab ${activeTab === 'tracker' ? 'active' : ''}`} onClick={() => setActiveTab('tracker')}>📋 My Applications</button>
          <button className={`tab ${activeTab === 'suggestions' ? 'active' : ''}`} onClick={() => setActiveTab('suggestions')}>
            🤖 AI Suggestions {!suggestionsLoading && aiSuggestions.length > 0 && `(${aiSuggestions.length})`}
          </button>
        </div>

        {activeTab === 'suggestions' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>🤖 AI-Recommended Internships</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  {suggestionsLoading
                    ? '🤖 Analyzing your skills...'
                    : userSkills.length > 0
                      ? `Based on your skills: ${userSkills.slice(0, 4).join(', ')}${userSkills.length > 4 ? ` +${userSkills.length - 4} more` : ''}`
                      : 'Add skills to your profile to get personalized suggestions'}
                </p>
              </div>
              {!suggestionsLoading && (
                <button
                  onClick={fetchAISuggestions}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                  🔄 Refresh
                </button>
              )}
            </div>

            {suggestionsLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card" style={{ opacity: 0.5 }}>
                    <div style={{ height: 16, background: 'var(--border)', borderRadius: 6, width: '60%', marginBottom: 10 }} />
                    <div style={{ height: 12, background: 'var(--border)', borderRadius: 6, width: '40%', marginBottom: 14 }} />
                    <div style={{ height: 10, background: 'var(--border)', borderRadius: 6, width: '80%' }} />
                  </div>
                ))}
              </div>
            ) : aiSuggestions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🤖</div>
                <h3>No suggestions yet</h3>
                <p>We'll suggest internships based on your skills from your profile.</p>
                <button
                  className="btn btn-primary"
                  style={{ width: 'auto', margin: '0 auto' }}
                  onClick={fetchAISuggestions}>
                  🚀 Get Suggestions
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
                {aiSuggestions.map((s, i) => (
                  <div key={i} className="card" style={{ animation: `fadeInUp 0.4s ease ${i * 0.07}s both`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>{s.company}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{s.role}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                        <span className={`badge ${DIFF_COLOR[s.difficulty] || 'badge-gray'}`}>{s.difficulty}</span>
                        <span className={`badge ${TYPE_COLOR[s.type] || 'badge-gray'}`}>{s.type}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>💡 {s.reason}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { openAdd('Wishlist', { company: s.company, role: s.role, link: s.link }); setActiveTab('tracker'); }}
                        style={{ flex: 1, padding: '8px', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 8, color: '#60a5fa', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                        ＋ Add to Tracker
                      </button>
                      {s.link && (
                        <a href={s.link} target="_blank" rel="noreferrer"
                          style={{ padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                          🔗 Apply
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tracker' && (
          <>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              {STATUSES.map(s => (
                <div key={s} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{STATUS_EMOJI[s]}</span><span style={{ fontWeight: 700, fontSize: 16 }}>{stats[s]}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                {['kanban', 'list'].map(v => (
                  <button key={v} onClick={() => setView(v)}
                    style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', background: view === v ? 'var(--primary)' : 'transparent', color: view === v ? '#fff' : 'var(--text-muted)' }}>
                    {v === 'kanban' ? '📋 Board' : '📄 List'}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
            ) : view === 'kanban' ? (
              <div className="kanban-board">
                {STATUSES.map(status => {
                  const colItems = items.filter(i => i.status === status);
                  return (
                    <div key={status} className={`kanban-col status-${status}`}>
                      <div className="kanban-col-header">
                        <span>{STATUS_EMOJI[status]} {status}</span>
                        <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '1px 8px', fontSize: 11 }}>{colItems.length}</span>
                      </div>
                      <div className="kanban-cards">
                        {colItems.map((item, i) => (
                          <div key={item._id} className="kanban-card" style={{ animationDelay: `${i * 0.05}s` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <div className="kanban-company">{item.company}</div>
                                <div className="kanban-role">{item.role}</div>
                              </div>
                              <div style={{ display: 'flex', gap: 2 }}>
                                <button className="btn-icon" style={{ padding: 4 }} onClick={() => openEdit(item)}>✏️</button>
                                <button className="btn-icon" style={{ padding: 4 }} onClick={() => handleDelete(item._id)}>🗑️</button>
                              </div>
                            </div>
                            {item.appliedDate && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>📅 {new Date(item.appliedDate).toLocaleDateString()}</div>}
                            {item.link && <a href={item.link} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--primary-light)', textDecoration: 'none', display: 'block', marginTop: 4 }}>🔗 Job Link</a>}
                            {status !== 'Offer' && status !== 'Rejected' && (
                              <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {STATUSES.filter(s => s !== status && s !== 'Wishlist').slice(0, 2).map(s => (
                                  <button key={s} onClick={() => changeStatus(item._id, s)}
                                    style={{ fontSize: 10, padding: '3px 8px', border: '1px solid var(--border)', borderRadius: 6, background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit' }}>
                                    → {s}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        <button onClick={() => openAdd(status)}
                          style={{ width: '100%', padding: '8px', border: '1px dashed var(--border)', borderRadius: 10, background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}
                          onMouseEnter={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.color = 'var(--primary-light)'; }}
                          onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-dim)'; }}>
                          ＋ Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              items.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">💼</div>
                  <h3>No applications yet</h3>
                  <p>Check AI Suggestions for personalized recommendations!</p>
                  <button className="btn btn-primary" style={{ width: 'auto', margin: '0 auto' }} onClick={() => setActiveTab('suggestions')}>🤖 See AI Suggestions</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map((item, i) => (
                    <div key={item._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, animation: 'fadeInUp 0.3s ease both', animationDelay: `${i * 0.05}s` }}>
                      <div style={{ fontSize: 24 }}>{STATUS_EMOJI[item.status]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{item.company}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{item.role}</div>
                      </div>
                      <span className={`badge ${item.status === 'Offer' ? 'badge-green' : item.status === 'Rejected' ? 'badge-red' : item.status === 'Interview' ? 'badge-yellow' : 'badge-blue'}`}>{item.status}</span>
                      {item.appliedDate && <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{new Date(item.appliedDate).toLocaleDateString()}</span>}
                      <div style={{ display: 'flex', gap: 4 }}>
                        {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="btn-icon" style={{ textDecoration: 'none' }}>🔗</a>}
                        <button className="btn-icon" onClick={() => openEdit(item)}>✏️</button>
                        <button className="btn-icon" onClick={() => handleDelete(item._id)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing ? '✏️ Edit Application' : '💼 New Application'}</span>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input className="form-input" placeholder="Google, Amazon..." value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <input className="form-input" placeholder="SWE Intern..." value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required />
                </div>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Applied Date</label>
                  <input className="form-input" type="date" value={form.appliedDate} onChange={e => setForm(f => ({ ...f, appliedDate: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Job Post Link</label>
                <input className="form-input" type="url" placeholder="https://..." value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" placeholder="Referral, round details, etc." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{editing ? 'Update' : 'Add Application'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}