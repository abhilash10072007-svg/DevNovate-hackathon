import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import API from '../utils/api';

const NAV = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/skills', icon: '⚡', label: 'Skills' },
  { to: '/projects', icon: '🛠️', label: 'Projects' },
  { to: '/internships', icon: '💼', label: 'Internships' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

const QUICK_PROMPTS = [
  { icon: '🗺️', label: 'My Roadmap', prompt: 'Based on my profile, give me a detailed 6-month learning roadmap to get a software engineering internship. Include specific skills, projects, and milestones.' },
  { icon: '📄', label: 'Resume Tips', prompt: 'Give me specific resume tips for a software engineering internship. What sections, what to highlight, and mistakes to avoid?' },
  { icon: '🎯', label: 'Skill Gaps', prompt: 'What are the most important skills I should learn next for top tech internships in 2026? Give a prioritized list with reasons.' },
  { icon: '💡', label: 'Project Ideas', prompt: 'Suggest 3 impressive project ideas I can build in 2-4 weeks that would stand out on my resume. Be specific about tech stack and features.' },
  { icon: '🎤', label: 'Interview Prep', prompt: 'Give me the top 10 technical interview questions for SWE internships and how to answer them. Include DSA topics I must know.' },
  { icon: '✉️', label: 'Cold Email', prompt: 'Write me a cold email template to reach out to a software engineer at a top tech company for a referral. Make it professional and concise.' },
];

const DIFF_STYLE = {
  Easy:   { background: 'rgba(34,197,94,0.15)',  border: '1px solid rgba(34,197,94,0.3)',  color: '#4ade80' },
  Medium: { background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' },
  Hard:   { background: 'rgba(239,68,68,0.15)',  border: '1px solid rgba(239,68,68,0.3)',  color: '#f87171' },
};

function AIChatPopup({ onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hey " + (user?.name?.split(' ')[0] || 'there') + "! 👋 I am TechMentor AI — your personal career advisor.\n\nI can help you with:\n🗺️ Learning Roadmaps — personalized to your goals\n📄 Resume Feedback — specific actionable tips\n🎯 Skill Gap Analysis — what to learn next\n💡 Project Ideas — that impress recruiters\n🎤 Interview Prep — DSA and system design\n🏆 Coding Challenges — for your advanced skills\n\nTry the quick actions below or ask me anything!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  // Resume tab
  const [resumeText, setResumeText] = useState('');
  const [resumeFeedback, setResumeFeedback] = useState('');
  const [resumeLoading, setResumeLoading] = useState(false);

  // Challenges tab
  const [advancedSkills, setAdvancedSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [expandedChallenge, setExpandedChallenge] = useState(null);
  // Quiz flow
  const [quizMode, setQuizMode] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [upgraded, setUpgraded] = useState(false);
  // Quiz flow
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Fetch skills above 75% when challenges tab is opened
  useEffect(() => {
    if (activeTab === 'challenges' && advancedSkills.length === 0) {
      fetchAdvancedSkills();
    }
  }, [activeTab]);

  const fetchAdvancedSkills = async () => {
    try {
      const res = await API.get('/skills');
      const above75 = res.data.filter(s => s.progress >= 75);
      setAdvancedSkills(above75);
    } catch {
      toast.error('Failed to load skills');
    }
  };

  const fetchChallenges = async (skill) => {
    setSelectedSkill(skill);
    setChallenges([]);
    setChallengesLoading(true);
    try {
      const res = await API.post('/ai/chat', {
        messages: [{
          role: 'user',
          content: `Give me 4 coding challenges for ${skill.name} (${skill.level} level). Return ONLY a JSON array, no markdown, no explanation. Format: [{"title":"...","difficulty":"Easy","description":"...","example":"Input: ...\nOutput: ...","hint":"...","topics":["..."]}]. Difficulties: Easy, Medium, Medium, Hard.`
        }]
      });

      // Try multiple extraction strategies
      let parsed = null;
      const reply = res.data.reply;

      // Strategy 1: direct JSON array
      try { parsed = JSON.parse(reply.trim()); } catch {}

      // Strategy 2: extract from markdown code block
      if (!parsed) {
        const codeBlock = reply.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlock) try { parsed = JSON.parse(codeBlock[1].trim()); } catch {}
      }

      // Strategy 3: extract first [...] block
      if (!parsed) {
        const arrMatch = reply.match(/\[[\s\S]*\]/);
        if (arrMatch) try { parsed = JSON.parse(arrMatch[0]); } catch {}
      }

      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        setChallenges(parsed);
      } else {
        toast.error('Could not parse challenges. Try again.');
      }
    } catch (err) {
      console.error('Challenge fetch error:', err);
      toast.error('Failed to fetch challenges. Try again.');
    } finally {
      setChallengesLoading(false);
    }
  };

  const resetChallenge = () => {
    setSelectedSkill(null);
    setChallenges([]);
    setExpandedChallenge(null);
    setQuizMode(false);
    setQuizAnswers({});
    setEvalResult(null);
    setUpgraded(false);
  };

  const startQuiz = () => {
    setQuizMode(true);
    setQuizAnswers({});
    setEvalResult(null);
    setUpgraded(false);
    setExpandedChallenge(0);
  };

  const evaluateAnswers = async () => {
    const answered = Object.keys(quizAnswers).filter(k => quizAnswers[k].trim());
    if (answered.length < 2) return toast.error('Please answer at least 2 challenges first!');
    setEvaluating(true);
    try {
      const questionsAndAnswers = challenges.slice(0, 4).map((c, i) => (
        `Q${i+1} [${c.difficulty}]: ${c.title}\nProblem: ${c.description}\nUser Answer: ${quizAnswers[i] || '(not answered)'}`
      )).join('\n\n');

      const res = await API.post('/ai/chat', {
        messages: [{
          role: 'user',
          content: `You are evaluating a coding quiz for ${selectedSkill.name}. Grade these answers strictly but fairly.\n\n${questionsAndAnswers}\n\nReturn ONLY a JSON object: {"passed": true/false, "totalScore": 0-100, "feedback": "2-3 sentence overall feedback", "scores": [{"q": 1, "score": 0-25, "comment": "brief comment"}, ...]}\n\nPassing threshold: score >= 60 AND at least 2 questions answered correctly. Be strict.`
        }]
      });

      const reply = res.data.reply;
      let result = null;
      try { result = JSON.parse(reply.trim()); } catch {}
      if (!result) {
        const m = reply.match(/\{[\s\S]*\}/);
        if (m) try { result = JSON.parse(m[0]); } catch {}
      }

      if (result) {
        setEvalResult(result);
        if (result.passed && !upgraded) {
          // Upgrade skill to Expert + 100%
          try {
            await API.put(`/skills/${selectedSkill._id}`, { level: 'Expert', progress: 100 });
            setUpgraded(true);
            setAdvancedSkills(prev => prev.map(s =>
              s._id === selectedSkill._id ? { ...s, level: 'Expert', progress: 100 } : s
            ));
            toast.success(`🏆 ${selectedSkill.name} upgraded to Expert!`);
          } catch {
            toast.error('Could not upgrade skill. Please try again.');
          }
        } else if (!result.passed) {
          // Only penalize if user actually attempted answers (not just skipped)
          const attemptedCount = Object.keys(quizAnswers).filter(k => quizAnswers[k].trim().length > 20).length;
          if (attemptedCount >= 2) {
            try {
              const penalty = Math.max(50, selectedSkill.progress - 15);
              await API.put(`/skills/${selectedSkill._id}`, { progress: penalty });
              setSelectedSkill(prev => ({ ...prev, progress: penalty }));
              setAdvancedSkills(prev => prev.map(s =>
                s._id === selectedSkill._id ? { ...s, progress: penalty } : s
              ));
              toast.error(`📉 ${selectedSkill.name} progress reduced to ${penalty}%`);
            } catch {
              toast.error('Could not update skill progress.');
            }
          }
        }
      } else {
        toast.error('Could not evaluate. Try again.');
      }
    } catch {
      toast.error('Evaluation failed. Try again.');
    } finally {
      setEvaluating(false);
    }
  };

  const send = async (customMessage) => {
    const text = customMessage || input.trim();
    if (!text || loading) return;
    const userMsg = { role: 'user', content: text };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const [skillsRes, projectsRes] = await Promise.all([
        API.get('/skills').catch(() => ({ data: [] })),
        API.get('/projects').catch(() => ({ data: [] }))
      ]);
      const skills = skillsRes.data.map(s => s.name).join(', ') || 'None added yet';
      const projects = projectsRes.data.map(p => p.title).join(', ') || 'None added yet';
      const contextPrompt = "User context — Name: " + user?.name + ", Skills: " + skills + ", Projects: " + projects + ", College: " + (user?.college || 'Not specified') + ". Personalize your response using this context.";
      const res = await API.post('/ai/chat', {
        messages: [
          { role: 'user', content: contextPrompt },
          ...messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: text }
        ]
      });
      setMessages(m => [...m, { role: 'assistant', content: res.data.reply }]);
    } catch {
      toast.error('AI error, try again');
      setMessages(m => [...m, { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' }]);
    } finally { setLoading(false); inputRef.current?.focus(); }
  };

  const handleResumeReview = async () => {
    if (!resumeText.trim()) return toast.error('Paste your resume text first');
    setResumeLoading(true); setResumeFeedback('');
    try {
      const res = await API.post('/ai/chat', {
        messages: [{ role: 'user', content: "Review this resume and give detailed feedback. Score it out of 10. Format your response with: Overall Score, Strengths, Areas to Improve, Missing Sections, ATS Tips, Rewritten Summary.\n\nResume:\n" + resumeText }]
      });
      setResumeFeedback(res.data.reply);
    } catch { toast.error('Resume review failed'); }
    finally { setResumeLoading(false); }
  };

  const fmt = (content) => content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');

  return (
    <div style={{ position: 'fixed', bottom: 100, right: 28, width: 420, height: 590, background: '#0a1a12', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, display: 'flex', flexDirection: 'column', zIndex: 500, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', animation: 'slideUp 0.3s ease' }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #064e3b, #065f46)', padding: '14px 16px', borderBottom: '1px solid rgba(16,185,129,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #10b981, #34d399)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#ecfdf5', fontSize: 14 }}>TechMentor AI</div>
            <div style={{ fontSize: 11, color: '#6ee7b7' }}>● Online · Powered by Groq</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6ee7b7', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 3 }}>
          {[['chat','💬 Chat'],['resume','📄 Resume'],['roadmap','🗺️ Roadmap'],['challenges','🏆 Challenges']].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ flex: 1, padding: '5px 2px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 10, fontWeight: 600, fontFamily: 'inherit', background: activeTab === tab ? '#10b981' : 'transparent', color: activeTab === tab ? '#fff' : '#6ee7b7' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                {msg.role === 'assistant' && <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>🤖</div>}
                <div style={{ maxWidth: '78%', padding: '9px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.6, background: msg.role === 'user' ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.08)', border: "1px solid " + (msg.role === 'user' ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.15)'), color: '#d1fae5' }}
                  dangerouslySetInnerHTML={{ __html: fmt(msg.content) }} />
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🤖</div>
                <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div style={{ display: 'flex', gap: 4 }}>{[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'typingBounce 1.2s infinite', animationDelay: i*0.2+'s' }} />)}</div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: '6px 12px', display: 'flex', gap: 5, overflowX: 'auto' }}>
            {QUICK_PROMPTS.map(p => (
              <button key={p.label} onClick={() => send(p.prompt)} disabled={loading}
                style={{ flexShrink: 0, padding: '4px 10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, color: '#6ee7b7', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                {p.icon} {p.label}
              </button>
            ))}
          </div>
          <div style={{ padding: '8px 12px 12px', display: 'flex', gap: 8, borderTop: '1px solid rgba(16,185,129,0.15)' }}>
            <input ref={inputRef}
              style={{ flex: 1, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '9px 12px', color: '#ecfdf5', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              placeholder="Ask about tech, career, code..."
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              style={{ background: '#10b981', border: 'none', borderRadius: 10, width: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', opacity: loading || !input.trim() ? 0.5 : 1 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
        </>
      )}

      {/* Resume Tab */}
      {activeTab === 'resume' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 14, gap: 10, overflowY: 'auto' }}>
          <div style={{ fontSize: 13, color: '#6ee7b7', fontWeight: 700 }}>📄 AI Resume Reviewer</div>
          <p style={{ fontSize: 12, color: '#4ade80', lineHeight: 1.5 }}>Paste your resume text below. Get an instant score out of 10, strengths, improvements, and ATS tips.</p>
          <textarea value={resumeText} onChange={e => setResumeText(e.target.value)}
            placeholder="Paste your resume text here..."
            style={{ minHeight: 160, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: 12, color: '#ecfdf5', fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
          <button onClick={handleResumeReview} disabled={resumeLoading || !resumeText.trim()}
            style={{ padding: '10px', background: resumeLoading ? 'rgba(16,185,129,0.3)' : '#10b981', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, cursor: resumeLoading ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
            {resumeLoading ? '🔍 Analyzing your resume...' : '🚀 Get AI Feedback'}
          </button>
          {resumeFeedback && (
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: 12, fontSize: 12, color: '#d1fae5', lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: fmt(resumeFeedback) }} />
          )}
        </div>
      )}

      {/* Roadmap Tab */}
      {activeTab === 'roadmap' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 14, gap: 8, overflowY: 'auto' }}>
          <div style={{ fontSize: 13, color: '#6ee7b7', fontWeight: 700 }}>🗺️ Career Roadmap Generator</div>
          <p style={{ fontSize: 12, color: '#4ade80', lineHeight: 1.5 }}>Pick a career path and get a personalized step-by-step roadmap based on your skills.</p>
          {[
            ['SWE Intern at FAANG', 'Create a detailed 6-month roadmap for landing a Software Engineering internship at a FAANG company. Include DSA, system design, projects, and weekly milestones.'],
            ['Frontend Developer', 'Create a 4-month roadmap to become job-ready as a Frontend Developer. Cover HTML/CSS, JavaScript, React, performance, and portfolio projects.'],
            ['AI/ML Engineer', 'Create a 6-month roadmap to become an AI/ML Engineer intern. Cover Python, math, ML algorithms, deep learning, and project ideas.'],
            ['Full Stack Developer', 'Create a 5-month roadmap to become a Full Stack Developer. Cover React, Node.js, databases, REST APIs, and deployment.'],
            ['DevOps Engineer', 'Create a 4-month roadmap for a DevOps internship. Cover Linux, Docker, Kubernetes, CI/CD, and cloud platforms.'],
            ['Open Source Contributor', 'Create a 3-month plan to start contributing to open source and use it to get internship opportunities.'],
          ].map(([label, prompt]) => (
            <button key={label} onClick={() => { setActiveTab('chat'); send(prompt); }}
              style={{ padding: '12px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, color: '#d1fae5', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.08)'}>
              <span>🗺️ {label}</span><span style={{ opacity: 0.5 }}>→</span>
            </button>
          ))}
        </div>
      )}

      {/* Coding Challenges Tab */}
      {activeTab === 'challenges' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {!selectedSkill ? (
            // Skill selection screen
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, color: '#6ee7b7', fontWeight: 700 }}>🏆 Coding Challenges</div>
              <p style={{ fontSize: 12, color: '#4ade80', lineHeight: 1.5 }}>
                Challenges unlock for skills <strong style={{ color: '#fbbf24' }}>above 75%</strong>. Answer 2+ correctly to get upgraded to <strong style={{ color: '#fbbf24' }}>Expert 🏅</strong>!
              </p>
              {advancedSkills.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#4ade80' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>⚡</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>No advanced skills yet!</div>
                  <div style={{ fontSize: 12, color: '#6ee7b7', lineHeight: 1.5 }}>Push any skill's progress above 75% to unlock challenges.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {advancedSkills.map(skill => (
                    <button key={skill._id} onClick={() => fetchChallenges(skill)}
                      style={{ padding: '12px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, color: '#d1fae5', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.18)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.08)'}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{skill.name} {skill.level === 'Expert' ? '🏅' : ''}</div>
                        <div style={{ fontSize: 11, color: '#6ee7b7', marginTop: 2 }}>{skill.level} · {skill.category}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: skill.progress === 100 ? '#fbbf24' : '#4ade80' }}>{skill.progress}%</span>
                        <span style={{ opacity: 0.5 }}>→</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={resetChallenge}
                  style={{ background: 'none', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '4px 10px', color: '#6ee7b7', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                  ← Back
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#ecfdf5', fontWeight: 700 }}>🏆 {selectedSkill.name} Challenges</div>
                  <div style={{ fontSize: 11, color: '#6ee7b7' }}>{selectedSkill.level} · {selectedSkill.progress}% · Answer 2+ to earn Expert 🏅</div>
                </div>
                {!quizMode && !challengesLoading && challenges.length > 0 && !evalResult && (
                  <button onClick={startQuiz}
                    style={{ padding: '6px 12px', background: '#10b981', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    ✍️ Start Quiz
                  </button>
                )}
              </div>

              {/* Loading skeleton */}
              {challengesLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: 12, opacity: 0.5 }}>
                      <div style={{ height: 12, width: '50%', background: 'rgba(16,185,129,0.2)', borderRadius: 6, marginBottom: 8 }} />
                      <div style={{ height: 10, width: '80%', background: 'rgba(16,185,129,0.1)', borderRadius: 6 }} />
                    </div>
                  ))}
                  <p style={{ textAlign: 'center', fontSize: 12, color: '#6ee7b7' }}>🤖 Generating challenges for {selectedSkill.name}...</p>
                </div>

              ) : evalResult ? (
                /* ── Evaluation Result Screen ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Pass / Fail banner */}
                  <div style={{ borderRadius: 12, padding: 16, textAlign: 'center', background: evalResult.passed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)', border: evalResult.passed ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(239,68,68,0.3)' }}>
                    <div style={{ fontSize: 32, marginBottom: 6 }}>{evalResult.passed ? '🎉' : '😅'}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: evalResult.passed ? '#4ade80' : '#f87171', marginBottom: 4 }}>
                      {evalResult.passed ? `You're a ${selectedSkill.name} Expert! 🏅` : 'Not quite there yet...'}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: evalResult.passed ? '#4ade80' : '#fbbf24' }}>{evalResult.totalScore}/100</div>
                    {upgraded && <div style={{ marginTop: 6, fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>✅ Skill upgraded to Expert + 100% in your profile!</div>}
                    {!evalResult.passed && Object.keys(quizAnswers).filter(k => quizAnswers[k].trim().length > 20).length >= 2 && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#f87171', fontWeight: 700 }}>📉 Skill progress reduced by 15% — study more and try again!</div>
                    )}
                    {!evalResult.passed && Object.keys(quizAnswers).filter(k => quizAnswers[k].trim().length > 20).length < 2 && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>💡 Tip: Write proper answers (20+ chars) to get evaluated correctly.</div>
                    )}
                  </div>

                  {/* Overall feedback */}
                  <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: 12, fontSize: 12, color: '#d1fae5', lineHeight: 1.6 }}>
                    {evalResult.feedback}
                  </div>

                  {/* Per-question scores */}
                  {(evalResult.scores || []).map((s, i) => (
                    <div key={i} style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: '#ecfdf5', fontWeight: 600 }}>Q{s.q}: {challenges[s.q - 1]?.title}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: s.score >= 15 ? '#4ade80' : s.score >= 8 ? '#fbbf24' : '#f87171' }}>{s.score}/25</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#6ee7b7' }}>{s.comment}</div>
                    </div>
                  ))}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!evalResult.passed && (
                      <button onClick={() => { setQuizMode(true); setQuizAnswers({}); setEvalResult(null); setUpgraded(false); setExpandedChallenge(0); }}
                        style={{ flex: 1, padding: '9px', background: '#10b981', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
                        🔄 Try Again
                      </button>
                    )}
                    <button onClick={() => { setChallenges([]); setQuizMode(false); setQuizAnswers({}); setEvalResult(null); setUpgraded(false); fetchChallenges(selectedSkill); }}
                      style={{ flex: 1, padding: '9px', background: 'none', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: '#6ee7b7', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
                      🎲 New Challenges
                    </button>
                  </div>
                </div>

              ) : quizMode ? (
                /* ── Quiz Answer Mode ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600, padding: '6px 10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8 }}>
                    ✍️ Answer mode — type your solution or explanation for each challenge. Answer at least 2 to submit.
                  </div>
                  {challenges.map((c, i) => (
                    <div key={i} style={{ background: 'rgba(16,185,129,0.06)', border: `1px solid ${expandedChallenge === i ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.15)'}`, borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setExpandedChallenge(expandedChallenge === i ? null : i)}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#ecfdf5' }}>Q{i+1}: {c.title}</div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center' }}>
                            <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, fontWeight: 700, ...(DIFF_STYLE[c.difficulty] || DIFF_STYLE.Medium) }}>{c.difficulty}</span>
                            {quizAnswers[i]?.trim() && <span style={{ fontSize: 10, color: '#4ade80' }}>✅ Answered</span>}
                          </div>
                        </div>
                        <span style={{ color: '#6ee7b7', fontSize: 11 }}>{expandedChallenge === i ? '▲' : '▼'}</span>
                      </div>
                      {expandedChallenge === i && (
                        <div style={{ padding: '0 12px 12px', borderTop: '1px solid rgba(16,185,129,0.1)' }}>
                          <p style={{ fontSize: 12, color: '#d1fae5', lineHeight: 1.6, margin: '10px 0 8px' }}>{c.description}</p>
                          {c.example && (
                            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                              <pre style={{ fontSize: 11, color: '#a7f3d0', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{c.example}</pre>
                            </div>
                          )}
                          <textarea
                            placeholder="Write your solution or explanation here..."
                            value={quizAnswers[i] || ''}
                            onChange={e => setQuizAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                            style={{ width: '100%', minHeight: 90, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: 10, color: '#ecfdf5', fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box', lineHeight: 1.5 }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  <button onClick={evaluateAnswers} disabled={evaluating || Object.keys(quizAnswers).filter(k => quizAnswers[k].trim()).length < 2}
                    style={{ padding: '11px', background: evaluating ? 'rgba(16,185,129,0.3)' : '#10b981', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: evaluating ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'inherit', opacity: Object.keys(quizAnswers).filter(k => quizAnswers[k].trim()).length < 2 ? 0.5 : 1 }}>
                    {evaluating ? '🤖 Evaluating your answers...' : `🚀 Submit & Evaluate (${Object.keys(quizAnswers).filter(k => quizAnswers[k].trim()).length}/4 answered)`}
                  </button>
                  <button onClick={() => { setQuizMode(false); setQuizAnswers({}); }}
                    style={{ padding: '8px', background: 'none', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, color: '#6ee7b7', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                    Cancel Quiz
                  </button>
                </div>

              ) : (
                /* ── Browse Mode (read challenges) ── */
                <>
                  {challenges.map((c, i) => (
                    <div key={i} style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => setExpandedChallenge(expandedChallenge === i ? null : i)}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#ecfdf5', marginBottom: 4 }}>{c.title}</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700, ...(DIFF_STYLE[c.difficulty] || DIFF_STYLE.Medium) }}>{c.difficulty}</span>
                            {(c.topics || []).map(t => (
                              <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }}>{t}</span>
                            ))}
                          </div>
                        </div>
                        <span style={{ color: '#6ee7b7', fontSize: 12, marginLeft: 8 }}>{expandedChallenge === i ? '▲' : '▼'}</span>
                      </div>
                      {expandedChallenge === i && (
                        <div style={{ padding: '0 12px 12px', borderTop: '1px solid rgba(16,185,129,0.1)', paddingTop: 10 }}>
                          <p style={{ fontSize: 12, color: '#d1fae5', lineHeight: 1.6, marginBottom: 10 }}>{c.description}</p>
                          {c.example && (
                            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                              <div style={{ fontSize: 10, color: '#6ee7b7', fontWeight: 700, marginBottom: 4 }}>EXAMPLE</div>
                              <pre style={{ fontSize: 11, color: '#a7f3d0', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{c.example}</pre>
                            </div>
                          )}
                          {c.hint && (
                            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
                              <span style={{ fontSize: 11, color: '#fbbf24' }}>💡 Hint: {c.hint}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <button onClick={() => fetchChallenges(selectedSkill)}
                    style={{ padding: '8px', background: 'none', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, color: '#6ee7b7', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                    🔄 Generate New Challenges
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [aiOpen, setAiOpen] = useState(false);
  const handleLogout = () => { logout(); navigate('/login'); toast.success('Logged out'); };
  const initial = user?.name?.[0]?.toUpperCase() || '?';

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🚀</div>
          <div className="sidebar-logo-text">AI Career<br/>Advisor</div>
        </div>
        <div className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => "nav-item " + (isActive ? 'active' : '')}>
              <span style={{ fontSize: 16 }}>{icon}</span> {label}
            </NavLink>
          ))}
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">{user?.avatar ? <img src={user.avatar} alt="" /> : initial}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-email">{user?.email}</div>
          </div>
          <button onClick={handleLogout} title="Logout" style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 16, padding: 4 }}>🚪</button>
        </div>
      </nav>
      <main className="main-content"><Outlet /></main>
      <button className="ai-btn" onClick={() => setAiOpen(v => !v)} title="TechMentor AI">
        {aiOpen ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg> : <span style={{ fontSize: 22 }}>🤖</span>}
      </button>
      {aiOpen && <AIChatPopup onClose={() => setAiOpen(false)} />}
    </div>
  );
}