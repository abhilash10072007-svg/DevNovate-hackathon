import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API from '../utils/api';

const STATUS_BADGE = { 'In Progress': 'badge-yellow', 'Completed': 'badge-green', 'On Hold': 'badge-gray' };
const STATUSES = ['In Progress', 'Completed', 'On Hold'];

const emptyForm = { title: '', description: '', techStack: '', githubLink: '', linkedinPost: '', liveLink: '', status: 'In Progress' };

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState('All');

  const fetchProjects = async () => {
    try {
      const res = await API.get('/projects');
      setProjects(res.data);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = p => {
    setEditing(p._id);
    setForm({ ...p, techStack: p.techStack?.join(', ') || '' });
    setShowModal(true);
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title required');
    const payload = {
      ...form,
      techStack: form.techStack.split(',').map(t => t.trim()).filter(Boolean)
    };
    try {
      if (editing) {
        const res = await API.put(`/projects/${editing}`, payload);
        setProjects(ps => ps.map(p => p._id === editing ? res.data : p));
        toast.success('Project updated!');
      } else {
        const res = await API.post('/projects', payload);
        setProjects(ps => [res.data, ...ps]);
        toast.success('Project added!');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await API.delete(`/projects/${id}`);
      setProjects(ps => ps.filter(p => p._id !== id));
      toast.success('Project deleted');
    } catch { toast.error('Delete failed'); }
  };

  const filtered = filter === 'All' ? projects : projects.filter(p => p.status === filter);

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">🛠️ Projects</h1>
            <p className="page-subtitle">Showcase your work and track what you've built</p>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={openAdd}>＋ Add Project</button>
        </div>
      </div>

      <div className="page-body">
        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['All', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: filter === s ? 'var(--primary)' : 'var(--bg-card)',
                color: filter === s ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${filter === s ? 'var(--primary)' : 'var(--border)'}`,
                transition: 'all 0.2s', fontFamily: 'inherit'
              }}>
              {s}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>
            {filtered.length} project{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛠️</div>
            <h3>No projects yet</h3>
            <p>Start adding your projects to build an impressive portfolio!</p>
            <button className="btn btn-primary" style={{ width: 'auto', margin: '0 auto' }} onClick={openAdd}>Add First Project</button>
          </div>
        ) : (
          <div className="grid-2">
            {filtered.map((p, i) => (
              <div key={p._id} className="project-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{p.title}</div>
                    <span className={`badge ${STATUS_BADGE[p.status]}`}>{p.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginLeft: 10 }}>
                    <button className="btn-icon" onClick={() => openEdit(p)}>✏️</button>
                    <button className="btn-icon" onClick={() => handleDelete(p._id)}>🗑️</button>
                  </div>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.description}
                </p>

                {p.techStack?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {p.techStack.map(t => <span key={t} className="tech-chip">{t}</span>)}
                  </div>
                )}

                <div className="project-links">
                  {p.githubLink && (
                    <a href={p.githubLink} target="_blank" rel="noreferrer" className="project-link github">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg>
                      GitHub
                    </a>
                  )}
                  {p.linkedinPost && (
                    <a href={p.linkedinPost} target="_blank" rel="noreferrer" className="project-link linkedin">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      LinkedIn
                    </a>
                  )}
                  {p.liveLink && (
                    <a href={p.liveLink} target="_blank" rel="noreferrer" className="project-link live">
                      🌐 Live Demo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing ? '✏️ Edit Project' : '🛠️ Add Project'}</span>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Project Title</label>
                <input className="form-input" placeholder="My Awesome Project" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" placeholder="What does this project do?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Tech Stack (comma separated)</label>
                <input className="form-input" placeholder="React, Node.js, MongoDB" value={form.techStack} onChange={e => setForm(f => ({ ...f, techStack: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">GitHub Link</label>
                <input className="form-input" type="url" placeholder="https://github.com/..." value={form.githubLink} onChange={e => setForm(f => ({ ...f, githubLink: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">LinkedIn Post Link</label>
                <input className="form-input" type="url" placeholder="https://linkedin.com/posts/..." value={form.linkedinPost} onChange={e => setForm(f => ({ ...f, linkedinPost: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Live Demo Link</label>
                <input className="form-input" type="url" placeholder="https://myproject.com" value={form.liveLink} onChange={e => setForm(f => ({ ...f, liveLink: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{editing ? 'Update' : 'Add Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
