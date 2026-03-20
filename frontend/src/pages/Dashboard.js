import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

const STATUS_COLORS = {
  Wishlist: '#64748b', Applied: '#2563eb', OA: '#8b5cf6',
  Interview: '#f59e0b', Offer: '#22c55e', Rejected: '#ef4444'
};

const FALLBACK_TRENDING = [
  { name: 'Agentic AI / LLM Agents', tag: 'AI/ML', hot: true },
  { name: 'Rust Programming Language', tag: 'Systems', hot: true },
  { name: 'Next.js 15 + App Router', tag: 'Frontend', hot: false },
  { name: 'Kubernetes & GitOps', tag: 'DevOps', hot: false },
  { name: 'Vector Databases (Pinecone, Qdrant)', tag: 'AI/ML', hot: true },
  { name: 'Edge Computing & Cloudflare Workers', tag: 'Cloud', hot: false },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ skills: 0, projects: 0, internships: 0, avgProgress: 0 });
  const [recentProjects, setRecentProjects] = useState([]);
  const [internshipStats, setInternshipStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [trendingTech, setTrendingTech] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [skillsRes, projectsRes, internshipsRes] = await Promise.all([
          API.get('/skills'), API.get('/projects'), API.get('/internships')
        ]);
        const skills = skillsRes.data;
        const projects = projectsRes.data;
        const internships = internshipsRes.data;
        const avgProgress = skills.length
          ? Math.round(skills.reduce((s, sk) => s + sk.progress, 0) / skills.length)
          : 0;
        setStats({ skills: skills.length, projects: projects.length, internships: internships.length, avgProgress });
        setRecentProjects(projects.slice(0, 3));
        const iStats = internships.reduce((acc, i) => {
          acc[i.status] = (acc[i.status] || 0) + 1;
          return acc;
        }, {});
        setInternshipStats(iStats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const fetchTrending = () => {
    setTrendingLoading(true);
    setTrendingTech([]);
    const today = new Date().toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' });
    API.post('/ai/chat', {
      messages: [{
        role: 'user',
        content: `Today is ${today}. List exactly 6 trending technologies for software developers right now. Respond ONLY with a valid JSON array, no explanation, no markdown: [{"name":"Technology Name","tag":"Category","hot":true},...]. tag must be one of: Frontend, Backend, AI/ML, DevOps, Cloud, Systems, Mobile, Database. Set hot:true for exactly 3 items.`
      }]
    }).then(res => {
      const match = res.data.reply.match(/\[[\s\S]*?\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setTrendingTech(parsed);
        localStorage.setItem(`trending_${new Date().toDateString()}`, JSON.stringify(parsed));
      } else {
        setTrendingTech(FALLBACK_TRENDING);
      }
    }).catch(() => setTrendingTech(FALLBACK_TRENDING))
      .finally(() => setTrendingLoading(false));
  };

  useEffect(() => {
    const cacheKey = `trending_${new Date().toDateString()}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { setTrendingTech(JSON.parse(cached)); setTrendingLoading(false); return; } catch { }
    }
    fetchTrending();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Here's your career progress overview for today</p>
      </div>

      <div className="page-body">
        <div className="stats-grid">
          {[
            { icon: '⚡', label: 'Skills Learned', value: stats.skills, color: '#2563eb', bg: 'rgba(37,99,235,0.12)' },
            { icon: '🛠️', label: 'Projects Built', value: stats.projects, color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
            { icon: '💼', label: 'Applications', value: stats.internships, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
            { icon: '📈', label: 'Avg Skill Progress', value: `${stats.avgProgress}%`, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
          ].map((s, i) => (
            <div key={s.label} className="stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div className="card-title">🔥 Trending in Tech</div>
                <div className="card-subtitle">
                  {trendingLoading
                    ? '🤖 AI is fetching what\'s hot today...'
                    : `🤖 AI-curated · ${new Date().toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                </div>
              </div>
              {!trendingLoading && (
                <button onClick={fetchTrending}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                  🔄 Refresh
                </button>
              )}
            </div>

            {trendingLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="trend-item">
                  <div className="trend-rank" style={{ opacity: 0.3 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 13, background: 'var(--border)', borderRadius: 6, width: `${55 + i * 6}%`, marginBottom: 7, opacity: 0.5 }} />
                    <div style={{ height: 10, background: 'var(--border)', borderRadius: 6, width: '30%', opacity: 0.3 }} />
                  </div>
                </div>
              ))
            ) : (
              trendingTech.slice(0, 6).map((t, i) => (
                <div key={t.name} className="trend-item" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="trend-rank">{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div className="trend-name">{t.name}</div>
                    <div className="trend-tag">{t.tag}</div>
                  </div>
                  {t.hot && <span className="badge badge-yellow">🔥 Hot</span>}
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="card-title" style={{ marginBottom: 12 }}>💼 Application Pipeline</div>
              {Object.keys(STATUS_COLORS).map(status => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[status], flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)' }}>{status}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: STATUS_COLORS[status] }}>{internshipStats[status] || 0}</span>
                  <div style={{ width: 80, height: 4, background: 'var(--border)', borderRadius: 2 }}>
                    <div style={{
                      height: '100%', borderRadius: 2, background: STATUS_COLORS[status],
                      width: `${Math.min(100, ((internshipStats[status] || 0) / Math.max(stats.internships, 1)) * 100)}%`,
                      transition: 'width 0.6s ease'
                    }} />
                  </div>
                </div>
              ))}
              <Link to="/internships" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>
                Track Applications →
              </Link>
            </div>

            <div className="card">
              <div className="card-title" style={{ marginBottom: 12 }}>⚡ Quick Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { to: '/skills', icon: '➕', label: 'Add a new skill' },
                  { to: '/projects', icon: '🛠️', label: 'Log a project' },
                  { to: '/internships', icon: '📋', label: 'Track application' },
                  { to: '/profile', icon: '✏️', label: 'Update profile' },
                ].map(a => (
                  <Link key={a.to} to={a.to} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                    background: 'var(--bg)', borderRadius: 10, textDecoration: 'none',
                    color: 'var(--text-muted)', fontSize: 13, transition: 'all 0.2s',
                    border: '1px solid var(--border)'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--text)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                    <span>{a.icon}</span> {a.label}
                    <span style={{ marginLeft: 'auto' }}>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {recentProjects.length > 0 && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div className="card-title">🛠️ Recent Projects</div>
              <Link to="/projects" style={{ fontSize: 13, color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {recentProjects.map(p => (
                <div key={p._id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 14 }}>{p.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.description}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {p.techStack?.slice(0, 3).map(t => <span key={t} className="tech-chip">{t}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}