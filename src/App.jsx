import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

/* ═══ CONSTANTS ═══ */
const API = 'http://localhost:5000/api/jobs';
const DOMAINS = [
  { id: 'ai_ml', label: 'AI / ML', emoji: '🤖' },
  { id: 'fullstack', label: 'Fullstack', emoji: '⚡' },
  { id: 'datascience', label: 'Data Science', emoji: '📈' },
  { id: 'cloudcomputing', label: 'Cloud', emoji: '☁️' },
  { id: 'cybersecurity', label: 'Security', emoji: '🔒' },
];
const JOB_TYPES = [
  { key: 'fulltime', label: 'Full-Time' },
  { key: 'parttime', label: 'Part-Time' },
  { key: 'internship', label: 'Internship' },
];

/* ═══ HELPERS ═══ */
function getExpBadge(title, desc) {
  const t = ((title || '') + ' ' + (desc || '')).toLowerCase();
  if (/\b(senior|lead|principal|staff|architect|director|head|manager)\b/.test(t))
    return { label: 'Senior', fg: 'var(--amber)', bg: 'var(--amber-bg)' };
  if (/\b(junior|intern|associate|trainee|entry|fresher|graduate)\b/.test(t))
    return { label: 'Entry', fg: 'var(--green)', bg: 'var(--green-bg)' };
  return { label: 'Mid', fg: 'var(--accent-text)', bg: 'var(--accent-bg)' };
}

function relativeTime(d) {
  if (!d || d === 'Recent') return 'Recently';
  try {
    const ms = Date.now() - new Date(d).getTime();
    const days = Math.floor(ms / 864e5);
    if (days < 1) return 'Today';
    if (days === 1) return '1d ago';
    if (days < 7) return days + 'd ago';
    if (days < 30) return Math.floor(days / 7) + 'w ago';
    return d;
  } catch { return d; }
}

function loadBookmarks() {
  try { return JSON.parse(localStorage.getItem('ljp_bm') || '[]'); }
  catch { return []; }
}
function persistBookmarks(ids) { localStorage.setItem('ljp_bm', JSON.stringify(ids)); }

function loadTheme() {
  try { return localStorage.getItem('ljp_theme') || 'dark'; }
  catch { return 'dark'; }
}

/* ═══ SKELETON ═══ */
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '2px solid var(--border-soft)',
      borderRadius: 'var(--radius)', padding: 20,
      display: 'flex', flexDirection: 'column', gap: 14
    }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton" style={{ height: 12, width: '50%', borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 16, width: '80%', borderRadius: 4 }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 10, width: '90%', borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 10, width: '60%', borderRadius: 4 }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <div className="skeleton" style={{ height: 26, width: 60, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 26, width: 80, borderRadius: 6 }} />
      </div>
    </div>
  );
}

/* ═══ APP ═══ */
export default function App() {
  const [theme, setTheme] = useState(loadTheme);
  const [domain, setDomain] = useState('ai_ml');
  const [locInput, setLocInput] = useState('');
  const [locQuery, setLocQuery] = useState('');
  const [jobType, setJobType] = useState({ fulltime: false, parttime: false, internship: false });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bmIds, setBmIds] = useState(loadBookmarks);
  const [showBmOnly, setShowBmOnly] = useState(false);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ljp_theme', theme);
  }, [theme]);

  // Fetch jobs
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const p = new URLSearchParams({ domain });
        if (locQuery) p.append('location', locQuery);
        const active = Object.entries(jobType).find(([, v]) => v);
        if (active) p.append('job_type', active[0]);
        const r = await axios.get(`${API}?${p}`, { signal: ctrl.signal });
        setJobs(Array.isArray(r.data) ? r.data : []);
      } catch (e) {
        if (!axios.isCancel(e)) setError(e.response?.data?.error || e.message);
      } finally { setLoading(false); }
    })();
    return () => ctrl.abort();
  }, [domain, locQuery, jobType]);

  const applyLoc = useCallback(() => setLocQuery(locInput.trim()), [locInput]);

  const toggleBm = useCallback((id) => {
    setBmIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      persistBookmarks(next);
      return next;
    });
  }, []);

  const resetFilters = () => {
    setLocInput(''); setLocQuery('');
    setJobType({ fulltime: false, parttime: false, internship: false });
    setShowBmOnly(false);
  };

  const toggleType = (k) => {
    setJobType(prev => {
      const n = { fulltime: false, parttime: false, internship: false };
      if (!prev[k]) n[k] = true;
      return n;
    });
  };

  const visible = useMemo(() => {
    if (showBmOnly) return jobs.filter(j => bmIds.includes(j.id));
    return jobs;
  }, [jobs, showBmOnly, bmIds]);

  const activeSources = useMemo(() => {
    const s = new Set();
    jobs.forEach(j => { if (j.publisher) s.add(j.publisher); });
    return [...s].slice(0, 5);
  }, [jobs]);

  /* ─── Inline Styles (Neo-Brutalist) ─── */
  const V = {
    r: 'var(--radius)', bm: 'var(--border-main)', bs: 'var(--border-soft)',
    shB: 'var(--shadow-brutal)', shH: 'var(--shadow-brutal-hover)', shS: 'var(--shadow-brutal-sm)',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-primary)', transition: 'background 0.2s' }}>

      {/* ════════ HEADER ════════ */}
      <header style={{
        borderBottom: `2px solid ${V.bm}`, padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 100
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, border: `2px solid ${V.bm}`,
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 14, boxShadow: V.shS
          }}>LJ</div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>
            LiveJobs Pro <span style={{ fontSize: 10 }}>↗</span>
          </span>
        </div>

        {/* Domain Pills — center */}
        <nav style={{ display: 'flex', gap: 4 }}>
          {DOMAINS.map(d => {
            const active = domain === d.id;
            return (
              <button key={d.id} onClick={() => setDomain(d.id)} style={{
                padding: '6px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                border: `2px solid ${V.bm}`, cursor: 'pointer', transition: 'all 0.12s',
                background: active ? 'var(--bg-pill-active)' : 'var(--bg-pill-idle)',
                color: active ? 'var(--text-pill-active)' : 'var(--text-pill-idle)',
                boxShadow: active ? V.shS : 'none',
                transform: active ? 'translate(-1px, -1px)' : 'none'
              }}>
                {d.emoji} {d.label}
              </button>
            );
          })}
        </nav>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Theme toggle */}
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{
            width: 36, height: 36, borderRadius: 8, border: `2px solid ${V.bm}`,
            background: 'var(--bg-card)', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: V.shS, transition: 'all 0.12s'
          }} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Bookmark toggle */}
          <button onClick={() => setShowBmOnly(p => !p)} style={{
            padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 8,
            border: `2px solid ${showBmOnly ? 'var(--amber)' : V.bm}`,
            background: showBmOnly ? 'var(--amber-bg)' : 'var(--bg-card)',
            color: showBmOnly ? 'var(--amber)' : 'var(--text-primary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: V.shS, transition: 'all 0.12s'
          }}>
            {showBmOnly ? '★' : '☆'} Saved ({bmIds.length})
          </button>
        </div>
      </header>

      {/* ════════ KPI ROW ════════ */}
      <div style={{ padding: '16px 24px 0', display: 'flex', gap: 12 }}>
        {/* KPI 1 */}
        <div style={{
          flex: 1, padding: '16px 20px', background: 'var(--bg-kpi)',
          border: `2px solid ${V.bm}`, borderRadius: V.r, boxShadow: V.shB
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>Active Roles Tracked</div>
          <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>{loading ? '—' : visible.length}</div>
        </div>
        {/* KPI 2 */}
        <div style={{
          flex: 1, padding: '16px 20px', background: 'var(--bg-kpi)',
          border: `2px solid ${V.bm}`, borderRadius: V.r, boxShadow: V.shB
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>Saved Openings</div>
          <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: 'var(--amber)' }}>{bmIds.length}</div>
        </div>
        {/* KPI 3 */}
        <div style={{
          flex: 2, padding: '16px 20px', background: 'var(--bg-kpi)',
          border: `2px solid ${V.bm}`, borderRadius: V.r, boxShadow: V.shB
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Aggregated Sources</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(activeSources.length > 0 ? activeSources : ['LinkedIn', 'Naukri', 'Indeed']).map((src, i) => (
              <span key={i} style={{
                padding: '3px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6,
                border: `1.5px solid ${V.bs}`, background: 'var(--bg-badge)', color: 'var(--text-secondary)'
              }}>{src}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ════════ BODY ════════ */}
      <div style={{ display: 'flex', flex: 1 }}>

        {/* ════ SIDEBAR ════ */}
        <aside style={{
          width: 260, borderRight: `2px solid ${V.bm}`, padding: '20px 16px',
          background: 'var(--bg-sidebar)', flexShrink: 0, position: 'sticky',
          top: 56, height: 'calc(100vh - 56px)', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 24
        }}>
          {/* Location */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Location</label>
            <input
              type="text" placeholder="e.g. Remote, Bengaluru"
              value={locInput} onChange={e => setLocInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyLoc()} onBlur={applyLoc}
              style={{
                width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 8,
                border: `2px solid ${V.bm}`, background: 'var(--bg-input)',
                color: 'var(--text-primary)', outline: 'none', boxShadow: V.shS,
                transition: 'box-shadow 0.12s'
              }}
              onFocus={e => e.target.style.boxShadow = V.shB}
            />
            {locQuery && (
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--accent-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                📍 {locQuery}
                <span style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => { setLocInput(''); setLocQuery(''); }}>✕</span>
              </div>
            )}
          </div>

          {/* Employment Type */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Employment Type</label>
            {JOB_TYPES.map(t => {
              const on = jobType[t.key];
              return (
                <div key={t.key} onClick={() => toggleType(t.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                  border: `2px solid ${on ? 'var(--accent)' : 'var(--border-soft)'}`,
                  background: on ? 'var(--accent-bg)' : 'transparent',
                  transition: 'all 0.12s', fontSize: 13, fontWeight: 500,
                  color: 'var(--text-primary)'
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 5,
                    border: `2px solid ${on ? 'var(--accent)' : V.bm}`,
                    background: on ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 11, fontWeight: 800, flexShrink: 0
                  }}>{on ? '✓' : ''}</div>
                  {t.label}
                </div>
              );
            })}
          </div>

          {/* Results Count */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>Results</div>
            <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>
              {loading ? '—' : visible.length}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {showBmOnly ? 'bookmarked' : 'positions found'}
            </div>
          </div>

          {/* Reset */}
          <button onClick={resetFilters} style={{
            padding: '10px 14px', fontSize: 12, fontWeight: 700, borderRadius: 8,
            border: `2px solid ${V.bm}`, background: 'var(--bg-card)',
            color: 'var(--text-primary)', cursor: 'pointer', boxShadow: V.shS,
            transition: 'all 0.12s', textAlign: 'center', width: '100%'
          }}
          onMouseEnter={e => { e.target.style.boxShadow = V.shB; e.target.style.transform = 'translate(-2px,-2px)'; }}
          onMouseLeave={e => { e.target.style.boxShadow = V.shS; e.target.style.transform = 'none'; }}
          >
            Reset All Filters
          </button>
        </aside>

        {/* ════ MAIN GRID ════ */}
        <main style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>

          {/* Status line */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 14, fontSize: 13, color: 'var(--text-muted)'
          }}>
            <span>{loading ? 'Searching…' : `${visible.length} openings`}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {DOMAINS.find(d => d.id === domain)?.label}{locQuery ? ` · ${locQuery}` : ''}
            </span>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12
            }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{
              background: 'var(--red-bg)', border: `2px solid var(--red)`, borderRadius: V.r,
              padding: 28, textAlign: 'center', maxWidth: 440, margin: '40px auto', boxShadow: V.shB
            }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--red)', marginBottom: 8 }}>Connection Failed</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{error}</div>
              <button onClick={() => setDomain(domain)} style={{
                padding: '8px 20px', fontWeight: 700, fontSize: 12, borderRadius: 8,
                border: `2px solid ${V.bm}`, background: 'var(--bg-card)',
                color: 'var(--text-primary)', cursor: 'pointer', boxShadow: V.shS
              }}>Retry</button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && visible.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)'
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{showBmOnly ? '☆' : '🔍'}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {showBmOnly ? 'No saved jobs yet' : 'No results'}
              </div>
              <div style={{ fontSize: 13 }}>
                {showBmOnly ? 'Bookmark jobs by clicking the star icon.' : 'Try adjusting your filters or domain.'}
              </div>
            </div>
          )}

          {/* Job Grid */}
          {!loading && !error && visible.length > 0 && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12
            }}>
              {visible.map(job => (
                <JobCard key={job.id} job={job} V={V}
                  saved={bmIds.includes(job.id)}
                  onToggle={() => toggleBm(job.id)} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ═══ JOB CARD ═══ */
function JobCard({ job, V, saved, onToggle }) {
  const [hov, setHov] = useState(false);
  const xp = getExpBadge(job.title, job.descriptionSnippet);

  return (
    <article
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--bg-card)',
        border: `2px solid ${hov ? 'var(--accent)' : 'var(--border-card)'}`,
        borderRadius: 'var(--radius)', padding: '18px 20px',
        display: 'flex', flexDirection: 'column', gap: 12,
        boxShadow: hov ? 'var(--shadow-brutal-hover)' : 'var(--shadow-brutal)',
        transform: hov ? 'translate(-2px, -2px)' : 'none',
        transition: 'all 0.15s ease', cursor: 'default'
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
          {job.logo ? (
            <img src={job.logo} alt="" style={{
              width: 40, height: 40, borderRadius: 10, objectFit: 'contain',
              border: `2px solid var(--border-soft)`, background: '#fff', padding: 2, flexShrink: 0
            }} onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: 10, border: `2px solid ${V.bm}`,
              background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color: 'var(--accent)', flexShrink: 0
            }}>{(job.company || 'C')[0]}</div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              textTransform: 'uppercase', letterSpacing: '0.03em'
            }}>{job.company}</div>
            <div style={{
              fontSize: 14, fontWeight: 700, color: 'var(--text-primary)',
              lineHeight: 1.3, marginTop: 2,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>{job.title}</div>
          </div>
        </div>

        {/* Bookmark star */}
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{
          width: 32, height: 32, borderRadius: 8, border: `2px solid ${saved ? 'var(--amber)' : 'var(--border-soft)'}`,
          background: saved ? 'var(--amber-bg)' : 'transparent',
          color: saved ? 'var(--amber)' : 'var(--text-muted)',
          cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0, transition: 'all 0.12s'
        }}>{saved ? '★' : '☆'}</button>
      </div>

      {/* Snippet */}
      {job.descriptionSnippet && (
        <div style={{
          fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>{job.descriptionSnippet}</div>
      )}

      {/* Meta */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: 'var(--text-secondary)', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
          {job.location}
        </span>
        <span style={{ color: 'var(--border-soft)' }}>·</span>
        <span>{relativeTime(job.postedAt)}</span>
      </div>

      {/* Badges + Apply */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <span style={{
            padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700,
            color: xp.fg, background: xp.bg, border: `1.5px solid ${xp.fg}20`
          }}>{xp.label}</span>
          {job.employmentType && (
            <span style={{
              padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              color: 'var(--text-secondary)', background: 'var(--bg-badge)',
              border: '1.5px solid var(--border-soft)'
            }}>{job.employmentType}</span>
          )}
          <span style={{
            padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            color: 'var(--text-muted)', background: 'var(--bg-badge)',
            border: '1.5px solid var(--border-soft)'
          }}>via {job.publisher}</span>
        </div>
        <a href={job.applyLink} target="_blank" rel="noopener noreferrer"
          style={{
            padding: '7px 14px', fontSize: 12, fontWeight: 700, borderRadius: 8,
            border: `2px solid ${V.bm}`, background: 'var(--bg-pill-active)',
            color: 'var(--text-pill-active)', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 4,
            boxShadow: V.shS, transition: 'all 0.12s', flexShrink: 0
          }}
          onMouseEnter={e => { e.target.style.boxShadow = V.shB; e.target.style.transform = 'translate(-2px,-2px)'; }}
          onMouseLeave={e => { e.target.style.boxShadow = V.shS; e.target.style.transform = 'none'; }}
        >Apply <span style={{ fontSize: 11 }}>↗</span></a>
      </div>
    </article>
  );
}
