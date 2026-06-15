import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

/* ─── Constants ─── */
const DOMAINS = [
  { id: 'ai_ml', label: 'AI / ML' },
  { id: 'fullstack', label: 'Full Stack' },
  { id: 'datascience', label: 'Data Science' },
  { id: 'cloudcomputing', label: 'Cloud' },
  { id: 'cybersecurity', label: 'Security' },
];

const API_BASE = 'http://localhost:5000/api/jobs';

/* ─── Helpers ─── */
function getExperienceBadge(title, snippet) {
  const text = ((title || '') + ' ' + (snippet || '')).toLowerCase();
  if (/\b(senior|lead|principal|staff|architect|director|head)\b/.test(text)) {
    return { label: 'Senior', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' };
  }
  if (/\b(junior|intern|associate|trainee|entry|fresher|graduate)\b/.test(text)) {
    return { label: 'Entry Level', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' };
  }
  return { label: 'Mid Level', color: '#6366F1', bg: 'rgba(99,102,241,0.1)' };
}

function timeAgo(dateStr) {
  if (!dateStr || dateStr === 'Recent') return 'Recently';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const days = Math.floor(diffMs / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return dateStr;
  } catch {
    return dateStr;
  }
}

/* ─── Bookmark persistence ─── */
function loadBookmarks() {
  try {
    return JSON.parse(localStorage.getItem('livejobs_bookmarks') || '[]');
  } catch { return []; }
}
function saveBookmarks(ids) {
  localStorage.setItem('livejobs_bookmarks', JSON.stringify(ids));
}

/* ─── Skeleton Card ─── */
function SkeletonCard() {
  return (
    <div style={{
      background: '#111827', border: '1px solid #26354A', borderRadius: 10,
      padding: 20, display: 'flex', flexDirection: 'column', gap: 14
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton" style={{ height: 12, width: '60%' }} />
          <div className="skeleton" style={{ height: 16, width: '85%' }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 10, width: '90%' }} />
      <div className="skeleton" style={{ height: 10, width: '70%' }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <div className="skeleton" style={{ height: 24, width: 70, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 24, width: 80, borderRadius: 4 }} />
      </div>
    </div>
  );
}

/* ─── Main App ─── */
export default function App() {
  const [domain, setDomain] = useState('ai_ml');
  const [locationInput, setLocationInput] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [jobTypes, setJobTypes] = useState({ fulltime: false, parttime: false, internship: false });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState(loadBookmarks);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  // Debounced location search — apply on Enter or blur
  const applyLocation = useCallback(() => {
    setLocationQuery(locationInput.trim());
  }, [locationInput]);

  // Fetch jobs from backend
  useEffect(() => {
    const ctrl = new AbortController();
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ domain });
        if (locationQuery) params.append('location', locationQuery);

        // Find first active job type checkbox
        const activeType = Object.entries(jobTypes).find(([, v]) => v);
        if (activeType) params.append('job_type', activeType[0]);

        const res = await axios.get(`${API_BASE}?${params.toString()}`, { signal: ctrl.signal });
        setJobs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!axios.isCancel(err)) {
          setError(err.response?.data?.error || err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
    return () => ctrl.abort();
  }, [domain, locationQuery, jobTypes]);

  // Bookmark helpers
  const toggleBookmark = useCallback((id) => {
    setBookmarkedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      saveBookmarks(next);
      return next;
    });
  }, []);

  const resetFilters = () => {
    setLocationInput('');
    setLocationQuery('');
    setJobTypes({ fulltime: false, parttime: false, internship: false });
    setShowBookmarksOnly(false);
  };

  // Visible jobs
  const visibleJobs = useMemo(() => {
    if (showBookmarksOnly) return jobs.filter(j => bookmarkedIds.includes(j.id));
    return jobs;
  }, [jobs, showBookmarksOnly, bookmarkedIds]);

  const toggleJobType = (key) => {
    setJobTypes(prev => {
      // Radio behavior: only one active at a time, or toggle off
      const newState = { fulltime: false, parttime: false, internship: false };
      if (!prev[key]) newState[key] = true;
      return newState;
    });
  };

  /* ─── Styles ─── */
  const s = {
    page: {
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: '#0B0F17', color: '#E2E8F0'
    },
    header: {
      borderBottom: '1px solid #26354A', padding: '14px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#0D1117', position: 'sticky', top: 0, zIndex: 50
    },
    logo: {
      fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: '#E2E8F0',
      display: 'flex', alignItems: 'center', gap: 8
    },
    nav: {
      display: 'flex', gap: 2, background: '#111827', borderRadius: 8,
      padding: 3, border: '1px solid #26354A'
    },
    navBtn: (active) => ({
      padding: '7px 14px', fontSize: 13, fontWeight: 500, borderRadius: 6,
      border: 'none', cursor: 'pointer', transition: 'all 0.15s',
      background: active ? '#1C2536' : 'transparent',
      color: active ? '#E2E8F0' : '#5A6F8F',
    }),
    bookmarkToggle: (active) => ({
      padding: '7px 14px', fontSize: 12, fontWeight: 500, borderRadius: 6,
      border: active ? '1px solid #F59E0B' : '1px solid #26354A',
      cursor: 'pointer', background: active ? 'rgba(245,158,11,0.08)' : '#111827',
      color: active ? '#F59E0B' : '#5A6F8F', display: 'flex', alignItems: 'center', gap: 6
    }),
    body: { display: 'flex', flex: 1 },
    sidebar: {
      width: 260, borderRight: '1px solid #26354A', padding: '20px 16px',
      background: '#0D1117', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 24,
      position: 'sticky', top: 53, height: 'calc(100vh - 53px)', overflowY: 'auto'
    },
    sideSection: { display: 'flex', flexDirection: 'column', gap: 10 },
    sideLabel: {
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.05em', color: '#5A6F8F', marginBottom: 2
    },
    input: {
      padding: '8px 10px', fontSize: 13, borderRadius: 6, border: '1px solid #26354A',
      background: '#111827', color: '#E2E8F0', outline: 'none', width: '100%',
      transition: 'border-color 0.15s'
    },
    checkbox: (checked) => ({
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
      borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#8B9DC3',
      background: checked ? 'rgba(99,102,241,0.08)' : 'transparent',
      border: checked ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
      transition: 'all 0.15s'
    }),
    resetBtn: {
      padding: '8px 12px', fontSize: 12, fontWeight: 500, borderRadius: 6,
      border: '1px solid #26354A', background: 'transparent', color: '#5A6F8F',
      cursor: 'pointer', marginTop: 4
    },
    main: { flex: 1, padding: '20px 24px', overflowY: 'auto' },
    statusBar: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 16, fontSize: 13, color: '#5A6F8F'
    },
    grid: {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: 12
    },
    card: {
      background: '#111827', border: '1px solid #26354A', borderRadius: 10,
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'border-color 0.15s, box-shadow 0.15s', cursor: 'default'
    },
    cardHover: {
      borderColor: '#374B6A',
      boxShadow: '0 2px 12px rgba(0,0,0,0.25)'
    },
    badge: (color, bg) => ({
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 4, fontSize: 11, fontWeight: 600, color, background: bg,
      lineHeight: '18px'
    }),
    pubBadge: {
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 4, fontSize: 11, fontWeight: 500, color: '#8B9DC3',
      background: 'rgba(139,157,195,0.08)', border: '1px solid rgba(139,157,195,0.12)'
    },
    applyBtn: {
      padding: '7px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6,
      border: '1px solid #26354A', background: '#151D2A', color: '#E2E8F0',
      cursor: 'pointer', textDecoration: 'none', display: 'inline-flex',
      alignItems: 'center', gap: 4, transition: 'all 0.15s'
    },
    starBtn: (active) => ({
      width: 30, height: 30, borderRadius: 6, border: 'none',
      background: active ? 'rgba(245,158,11,0.1)' : 'transparent',
      color: active ? '#F59E0B' : '#5A6F8F', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 16, transition: 'all 0.15s', flexShrink: 0
    }),
    emptyState: {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '80px 20px', color: '#5A6F8F',
      textAlign: 'center', gap: 12
    },
    errorBox: {
      background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: 10, padding: 24, textAlign: 'center', maxWidth: 480,
      margin: '60px auto'
    }
  };

  return (
    <div style={s.page}>
      {/* ─── Header ─── */}
      <header style={s.header}>
        <div style={s.logo}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
          </svg>
          LiveJobs
          <span style={{
            fontSize: 10, fontWeight: 600, color: '#6366F1', background: 'rgba(99,102,241,0.1)',
            padding: '2px 6px', borderRadius: 4, marginLeft: 2
          }}>BETA</span>
        </div>

        {/* Domain Tabs */}
        <nav style={s.nav}>
          {DOMAINS.map(d => (
            <button key={d.id} style={s.navBtn(domain === d.id)}
              onMouseEnter={e => { if (domain !== d.id) e.target.style.color = '#8B9DC3'; }}
              onMouseLeave={e => { if (domain !== d.id) e.target.style.color = '#5A6F8F'; }}
              onClick={() => setDomain(d.id)}>
              {d.label}
            </button>
          ))}
        </nav>

        {/* Bookmark Toggle */}
        <button style={s.bookmarkToggle(showBookmarksOnly)}
          onClick={() => setShowBookmarksOnly(p => !p)}>
          <span>{showBookmarksOnly ? '★' : '☆'}</span>
          Saved ({bookmarkedIds.length})
        </button>
      </header>

      <div style={s.body}>
        {/* ─── Sidebar ─── */}
        <aside style={s.sidebar}>
          {/* Location Filter */}
          <div style={s.sideSection}>
            <div style={s.sideLabel}>Location</div>
            <input
              style={s.input}
              type="text"
              placeholder="e.g. Remote, Bengaluru"
              value={locationInput}
              onChange={e => setLocationInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') applyLocation(); }}
              onBlur={applyLocation}
              onFocus={e => e.target.style.borderColor = '#6366F1'}
            />
            {locationQuery && (
              <div style={{ fontSize: 11, color: '#6366F1', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Filtering: {locationQuery}</span>
                <span style={{ cursor: 'pointer', color: '#5A6F8F' }}
                  onClick={() => { setLocationInput(''); setLocationQuery(''); }}>✕</span>
              </div>
            )}
          </div>

          {/* Job Type Filter */}
          <div style={s.sideSection}>
            <div style={s.sideLabel}>Employment Type</div>
            {[
              { key: 'fulltime', label: 'Full-time' },
              { key: 'parttime', label: 'Part-time' },
              { key: 'internship', label: 'Internship' },
            ].map(t => (
              <div key={t.key} style={s.checkbox(jobTypes[t.key])}
                onClick={() => toggleJobType(t.key)}>
                <span style={{
                  width: 16, height: 16, borderRadius: 4, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 11,
                  border: jobTypes[t.key] ? '1px solid #6366F1' : '1px solid #26354A',
                  background: jobTypes[t.key] ? '#6366F1' : 'transparent',
                  color: '#fff', fontWeight: 700
                }}>
                  {jobTypes[t.key] ? '✓' : ''}
                </span>
                {t.label}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={s.sideSection}>
            <div style={s.sideLabel}>Results</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#E2E8F0', lineHeight: 1 }}>
              {loading ? '—' : visibleJobs.length}
            </div>
            <div style={{ fontSize: 12, color: '#5A6F8F' }}>
              {showBookmarksOnly ? 'Bookmarked positions' : 'positions found'}
            </div>
          </div>

          {/* Reset */}
          <button style={s.resetBtn} onClick={resetFilters}
            onMouseEnter={e => { e.target.style.borderColor = '#374B6A'; e.target.style.color = '#8B9DC3'; }}
            onMouseLeave={e => { e.target.style.borderColor = '#26354A'; e.target.style.color = '#5A6F8F'; }}>
            Reset all filters
          </button>
        </aside>

        {/* ─── Main Content ─── */}
        <main style={s.main}>
          {/* Status Bar */}
          <div style={s.statusBar}>
            <span>
              {loading && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span className="spinner" /> Searching…
              </span>}
              {!loading && !error && `${visibleJobs.length} openings`}
              {!loading && error && ''}
            </span>
            <span style={{ fontSize: 11 }}>
              {DOMAINS.find(d => d.id === domain)?.label}
              {locationQuery ? ` · ${locationQuery}` : ''}
            </span>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div style={s.grid}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={s.errorBox}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#EF4444', marginBottom: 8 }}>
                Failed to load jobs
              </div>
              <div style={{ fontSize: 13, color: '#8B9DC3', marginBottom: 16 }}>{error}</div>
              <button style={{ ...s.applyBtn, borderColor: '#EF4444', color: '#EF4444' }}
                onClick={() => setDomain(domain)}>
                Retry
              </button>
            </div>
          )}

          {/* Empty Bookmark State */}
          {!loading && !error && visibleJobs.length === 0 && showBookmarksOnly && (
            <div style={s.emptyState}>
              <span style={{ fontSize: 32 }}>☆</span>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#8B9DC3' }}>No saved jobs</div>
              <div style={{ fontSize: 13 }}>Click the star icon on any job card to bookmark it.</div>
              <button style={{ ...s.resetBtn, marginTop: 12 }}
                onClick={() => setShowBookmarksOnly(false)}>View all jobs</button>
            </div>
          )}

          {/* Empty Results State */}
          {!loading && !error && visibleJobs.length === 0 && !showBookmarksOnly && (
            <div style={s.emptyState}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#8B9DC3' }}>No results found</div>
              <div style={{ fontSize: 13 }}>Try adjusting your filters or selecting a different domain.</div>
            </div>
          )}

          {/* Job Cards */}
          {!loading && !error && visibleJobs.length > 0 && (
            <div style={s.grid}>
              {visibleJobs.map(job => (
                <JobCard key={job.id} job={job} s={s}
                  isBookmarked={bookmarkedIds.includes(job.id)}
                  onToggleBookmark={() => toggleBookmark(job.id)} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ─── Job Card Component ─── */
function JobCard({ job, s, isBookmarked, onToggleBookmark }) {
  const [hovered, setHovered] = useState(false);
  const xp = getExperienceBadge(job.title, job.descriptionSnippet);

  return (
    <article
      style={{ ...s.card, ...(hovered ? s.cardHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Row 1: Logo + Company + Bookmark */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {job.logo ? (
            <img src={job.logo} alt="" style={{
              width: 36, height: 36, borderRadius: 8, objectFit: 'contain',
              background: '#fff', padding: 2, flexShrink: 0, border: '1px solid #26354A'
            }}
            onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: '#151D2A',
              border: '1px solid #26354A', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 14, color: '#5A6F8F', fontWeight: 700, flexShrink: 0
            }}>
              {(job.company || 'C')[0]}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, color: '#5A6F8F', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {job.company}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', lineHeight: 1.35, marginTop: 2 }}>
              {job.title}
            </div>
          </div>
        </div>
        <button style={s.starBtn(isBookmarked)} onClick={onToggleBookmark}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark this job'}>
          {isBookmarked ? '★' : '☆'}
        </button>
      </div>

      {/* Description snippet */}
      {job.descriptionSnippet && (
        <div style={{ fontSize: 12, color: '#5A6F8F', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {job.descriptionSnippet}
        </div>
      )}

      {/* Metadata row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', fontSize: 12 }}>
        <span style={{ color: '#8B9DC3', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {job.location}
        </span>
        <span style={{ color: '#26354A' }}>·</span>
        <span style={{ color: '#5A6F8F' }}>{timeAgo(job.postedAt)}</span>
      </div>

      {/* Badges + Apply */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={s.badge(xp.color, xp.bg)}>{xp.label}</span>
          {job.employmentType && (
            <span style={s.badge('#8B9DC3', 'rgba(139,157,195,0.08)')}>{job.employmentType}</span>
          )}
          <span style={s.pubBadge}>via {job.publisher}</span>
        </div>
        <a href={job.applyLink} target="_blank" rel="noopener noreferrer"
          style={s.applyBtn}
          onMouseEnter={e => { e.target.style.background = '#1C2536'; e.target.style.borderColor = '#374B6A'; }}
          onMouseLeave={e => { e.target.style.background = '#151D2A'; e.target.style.borderColor = '#26354A'; }}>
          Apply <span style={{ fontSize: 11 }}>↗</span>
        </a>
      </div>
    </article>
  );
}
