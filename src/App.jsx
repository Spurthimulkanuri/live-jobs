import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Categories dictionary for navigation and layout
const CATEGORIES = [
  { id: 'ai_ml', label: 'AI / ML', icon: 'brain' },
  { id: 'fullstack', label: 'Fullstack', icon: 'code' },
  { id: 'datascience', label: 'Data Science', icon: 'database' },
  { id: 'cloudcomputing', label: 'Cloud Computing', icon: 'cloud' },
  { id: 'cybersecurity', label: 'Cybersecurity', icon: 'shield' },
];

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState('ai_ml');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiHealthy, setApiHealthy] = useState(null);
  
  // Bookmarks loaded from LocalStorage
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('job_hub_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Save bookmarks to LocalStorage on change
  useEffect(() => {
    localStorage.setItem('job_hub_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Check API health on mount
  useEffect(() => {
    axios.get('/api/health')
      .then(() => setApiHealthy(true))
      .catch(() => setApiHealthy(false));
  }, []);

  // Fetch jobs when selected domain changes
  useEffect(() => {
    if (selectedDomain === 'bookmarks') {
      setError(null);
      return; // No API call needed for bookmarks
    }

    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/jobs?domain=${selectedDomain}`);
        if (response.data && response.data.jobs) {
          setJobs(response.data.jobs);
        } else {
          setJobs([]);
          setError('Invalid API response format.');
        }
      } catch (err) {
        console.error(err);
        const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'An error occurred while fetching jobs.';
        setError(errMsg);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [selectedDomain]);

  // Toggle job bookmark state
  const toggleBookmark = (job, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (bookmarks.some(b => b.id === job.id)) {
      setBookmarks(bookmarks.filter(b => b.id !== job.id));
    } else {
      setBookmarks([...bookmarks, job]);
    }
  };

  const isBookmarked = (jobId) => bookmarks.some(b => b.id === jobId);

  // Compute active list and filter by search query
  const rawJobsList = selectedDomain === 'bookmarks' ? bookmarks : jobs;
  const filteredJobs = rawJobsList.filter(job => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query) ||
      job.publisher.toLowerCase().includes(query) ||
      (job.description && job.description.toLowerCase().includes(query))
    );
  });

  // Compute statistics
  const totalJobsCount = rawJobsList.length;
  const filteredCount = filteredJobs.length;
  const remoteCount = rawJobsList.filter(j => j.location.toLowerCase().includes('remote') || j.title.toLowerCase().includes('remote')).length;
  
  // Find top publisher in active set
  const getTopPublisher = () => {
    if (rawJobsList.length === 0) return 'N/A';
    const counts = {};
    rawJobsList.forEach(j => {
      counts[j.publisher] = (counts[j.publisher] || 0) + 1;
    });
    let top = 'N/A';
    let max = 0;
    Object.keys(counts).forEach(key => {
      if (counts[key] > max) {
        max = counts[key];
        top = key;
      }
    });
    return top;
  };

  // Color code source platforms (including Naukri, Indeed, Glassdoor, Upwork, LinkedIn)
  const getPublisherStyles = (publisher) => {
    const pub = publisher ? publisher.toLowerCase() : '';
    if (pub.includes('linkedin')) {
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    } else if (pub.includes('naukri')) {
      return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
    } else if (pub.includes('indeed')) {
      return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
    } else if (pub.includes('glassdoor')) {
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    } else if (pub.includes('upwork')) {
      return 'bg-green-500/10 text-green-400 border border-green-500/20';
    } else {
      return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  // Render SVG icons dynamically
  const renderIcon = (name, className = "w-5 h-5") => {
    switch (name) {
      case 'brain':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'code':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      case 'database':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        );
      case 'cloud':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        );
      case 'shield':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'star':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.373-1.81.588-1.81h4.906a1 1 0 00.95-.69l1.519-4.674z" />
          </svg>
        );
      case 'star-filled':
        return (
          <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      case 'location':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'clock':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'search':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      
      {/* Decorative Glowing Blur Backdrops */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '3s' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-900 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 p-2 rounded-xl text-white shadow-md shadow-violet-900/40">
                {renderIcon('brain', 'w-6 h-6')}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                Domain Job Hub <span className="text-xs align-super text-violet-400 font-mono tracking-widest border border-violet-500/20 px-2 py-0.5 rounded bg-violet-500/5">V2</span>
              </h1>
              {apiHealthy === true && (
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                  <span className="w-1.5 h-1.5 mr-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Verified Jobs Only
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
              Strictly filtered direct-hire tech vacancies. Real-time entries from premium whitelisted boards (LinkedIn, Indeed, Naukri, Glassdoor, Upwork) with verified company details.
            </p>
          </div>
          
          {/* Quick Bookmarks Button */}
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => setSelectedDomain('bookmarks')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-semibold transition-all duration-300 ${
                selectedDomain === 'bookmarks'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-amber-400 hover:border-amber-500/40'
              }`}
            >
              {selectedDomain === 'bookmarks' ? renderIcon('star-filled', 'w-5 h-5') : renderIcon('star', 'w-5 h-5')}
              Saved Jobs ({bookmarks.length})
            </button>
          </div>
        </header>

        {/* Domain Selection Tabs / Pills */}
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">Select Tech Domain</h2>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => {
              const isActive = selectedDomain === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedDomain(cat.id);
                    setSearchQuery('');
                  }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 border-violet-500 text-white shadow-lg shadow-violet-500/25 scale-[1.02]'
                      : 'bg-slate-900/40 hover:bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:scale-[1.01]'
                  }`}
                >
                  {renderIcon(cat.icon, `w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`)}
                  {cat.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Filter and Stats Card */}
        <section className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-4 sm:p-6 mb-8 flex flex-col lg:flex-row gap-6 justify-between items-stretch lg:items-center">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-xl">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              {renderIcon('search', 'w-5 h-5')}
            </span>
            <input
              type="text"
              placeholder="Filter by title, company, publisher, location, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-violet-500 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all duration-200"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-400">
            <div className="bg-slate-950/40 border border-slate-800/80 px-4 py-2.5 rounded-xl flex items-center gap-2">
              <span className="font-bold text-slate-200">{filteredCount}</span>
              <span>roles shown</span>
              {searchQuery && (
                <span className="text-slate-500">(filtered from {totalJobsCount})</span>
              )}
            </div>
            
            <div className="bg-slate-950/40 border border-slate-800/80 px-4 py-2.5 rounded-xl flex items-center gap-2">
              <span>Top Portal:</span>
              <span className="font-bold text-slate-200">{getTopPublisher()}</span>
            </div>

            {remoteCount > 0 && (
              <div className="bg-slate-950/40 border border-slate-800/80 px-4 py-2.5 rounded-xl flex items-center gap-2">
                <span>Remote Listings:</span>
                <span className="font-bold text-emerald-400">{remoteCount}</span>
              </div>
            )}
          </div>
        </section>

        {/* Loading Spinner and Skeleton States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
            {/* Centered Tailwind Loading Spinner */}
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-violet-500 animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-b-cyan-400 animate-pulse"></div>
            </div>
            <h3 className="text-lg font-semibold text-slate-300 animate-pulse">Filtering out fake and dead listings...</h3>
            <p className="text-slate-500 text-sm mt-1">Applying strict whitelist & freshness verification criteria</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-8 text-center max-w-2xl mx-auto my-12">
            <div className="inline-flex p-3 bg-rose-500/20 text-rose-400 rounded-full mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-rose-300 mb-2">Failed to Fetch Job Openings</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              {error}. This may happen if the RapidAPI key daily quota is exceeded, or the network request was blocked.
            </p>
            <button
              onClick={() => setSelectedDomain(selectedDomain)}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty States */}
        {!loading && !error && filteredJobs.length === 0 && (
          <div className="bg-slate-900/20 border border-slate-900/60 rounded-2xl p-12 text-center max-w-xl mx-auto my-12">
            <div className="inline-flex p-3 bg-slate-900 text-slate-500 rounded-full mb-4">
              {selectedDomain === 'bookmarks' ? renderIcon('star', 'w-8 h-8') : renderIcon('search', 'w-8 h-8')}
            </div>
            <h3 className="text-xl font-bold text-slate-300 mb-2">
              {selectedDomain === 'bookmarks' ? 'No Bookmarked Jobs' : 'No Genuine Listings Found'}
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              {selectedDomain === 'bookmarks'
                ? 'Save job listings by clicking the star icon in the top right corner of any job card.'
                : 'No postings for this domain passed our strict freshness and premium-whitelist filters. Try another category.'}
            </p>
            {selectedDomain === 'bookmarks' && (
              <button
                onClick={() => setSelectedDomain('ai_ml')}
                className="mt-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-violet-900/30 hover:shadow-violet-900/50 transition-all duration-200 cursor-pointer"
              >
                Browse Job Categories
              </button>
            )}
          </div>
        )}

        {/* Jobs Card Grid */}
        {!loading && !error && filteredJobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <article 
                key={job.id}
                className="group relative flex flex-col bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-slate-800 hover:shadow-[0_10px_35px_rgba(139,92,246,0.08)]"
              >
                {/* Decorative border line glow on card hover */}
                <div className="absolute inset-x-0 -bottom-px h-[2px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Card Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  {/* Employer Logo */}
                  <div className="w-12 h-12 bg-white rounded-xl p-1.5 flex items-center justify-center shadow-inner overflow-hidden shrink-0 border border-slate-100">
                    <img 
                      src={job.logo} 
                      alt={`${job.company} logo`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://cdn-icons-png.flaticon.com/512/2930/2930225.png';
                      }}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Bookmark Button */}
                  <button
                    onClick={(e) => toggleBookmark(job, e)}
                    className="p-2 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800/40 transition-colors"
                    aria-label={isBookmarked(job.id) ? "Remove Bookmark" : "Add Bookmark"}
                  >
                    {isBookmarked(job.id) ? (
                      renderIcon('star-filled', 'w-5 h-5 text-amber-400')
                    ) : (
                      renderIcon('star', 'w-5 h-5')
                    )}
                  </button>
                </div>

                {/* Job Info */}
                <div className="mb-4 flex-1">
                  <span className="text-slate-400 text-xs font-semibold tracking-wide uppercase mb-1 block">
                    {job.company}
                  </span>
                  <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors duration-200 line-clamp-2 leading-snug">
                    {job.title}
                  </h3>
                  {/* Description snippet for V2 authenticity check */}
                  {job.description && (
                    <p className="text-slate-400 text-xs mt-3 line-clamp-3 leading-relaxed italic border-l-2 border-violet-500/20 pl-2 bg-slate-950/20 py-1">
                      {job.description}
                    </p>
                  )}
                </div>

                {/* Location and Metadata */}
                <div className="space-y-3 mb-6 pt-4 border-t border-slate-900 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    {renderIcon('location', 'w-4 h-4 text-slate-500')}
                    <span className="truncate">{job.location}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {renderIcon('clock', 'w-4 h-4 text-slate-500')}
                    <span>Posted {job.postedAt}</span>
                  </div>
                </div>

                {/* Publisher & Apply Button Row */}
                <div className="flex items-center justify-between gap-4 mt-auto">
                  {/* Highlight Board Badge */}
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${getPublisherStyles(job.publisher)}`}>
                    via {job.publisher || 'Aggregator'}
                  </span>

                  {/* Apply Button */}
                  <a
                    href={job.applyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-indigo-600 group-hover:border-violet-500 group-hover:text-white px-4 py-2.5 rounded-xl transition-all duration-300 group-hover:shadow-lg group-hover:shadow-violet-900/20"
                  >
                    Apply Now
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

              </article>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 mt-20 py-8 bg-slate-950 text-slate-600 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} Domain Job Hub. Made for developers searching for the next big role.</p>
          <p className="mt-1.5 text-slate-700">Equipped with strict 4-tier genuineness filters to eliminate fake and floating ghost listings.</p>
        </div>
      </footer>

    </div>
  );
}
