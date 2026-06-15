import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Domain Categories to toggle in UI
const CATEGORIES = [
  { id: 'ai_ml', label: 'AI / Machine Learning', icon: '🧠' },
  { id: 'fullstack', label: 'Full Stack Development', icon: '💻' },
  { id: 'datascience', label: 'Data Science', icon: '📊' },
  { id: 'cloudcomputing', label: 'Cloud Computing', icon: '☁️' },
  { id: 'cybersecurity', label: 'Cybersecurity', icon: '🛡️' }
];

export default function App() {
  const [selectedDomain, setSelectedDomain] = useState('ai_ml');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // useEffect Hook triggers every time selectedDomain changes
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:5000/api/jobs?domain=${selectedDomain}`);
        if (Array.isArray(response.data)) {
          setJobs(response.data);
        } else {
          setJobs([]);
          setError("Invalid response format received from server.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.response?.data?.error || err.message || "Could not fetch job openings.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [selectedDomain]);

  // Styling helper for publisher badges
  const getPublisherStyles = (publisher) => {
    const pub = publisher ? publisher.toLowerCase().trim() : '';
    if (pub.includes('linkedin')) {
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    } else if (pub.includes('naukri')) {
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    } else if (pub.includes('indeed')) {
      return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
    } else if (pub.includes('glassdoor')) {
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    } else if (pub.includes('foundit')) {
      return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
    } else if (pub.includes('shine')) {
      return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
    } else if (pub.includes('upwork')) {
      return 'bg-green-500/10 text-green-400 border border-green-500/20';
    } else if (pub.includes('ziprecruiter')) {
      return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
    } else {
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden pb-16">
      {/* Dynamic Glowing Blur Accents */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute top-[30%] right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '4s' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* Main Header */}
        <header className="border-b border-slate-900 pb-8 mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🚀</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                Domain Job Hub <span className="text-xs font-mono font-bold align-middle bg-violet-500/10 text-violet-400 border border-violet-500/25 px-2 py-0.5 rounded ml-2 uppercase">Verified</span>
              </h1>
            </div>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              Real-time, strictly filtered tech vacancies. Sourced dynamically from major verified portals (LinkedIn, Indeed, Naukri, Glassdoor, Foundit, Shine, Upwork, ZipRecruiter) and direct corporate sites.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            Real-time Aggregator Live
          </div>
        </header>

        {/* Categories Tab Selector */}
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">Select Domain Category</h2>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => {
              const isActive = selectedDomain === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedDomain(cat.id)}
                  className={`flex items-center gap-2.5 px-5 py-3.5 rounded-xl border text-sm font-semibold transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 border-violet-500 text-white shadow-lg shadow-violet-500/30 scale-[1.02]'
                      : 'bg-slate-900/40 hover:bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:scale-[1.01]'
                  }`}
                >
                  <span className="text-base select-none">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Loading Spinner & Status */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 min-h-[400px]">
            <div className="relative mb-6">
              <div className="w-14 h-14 rounded-full border-4 border-slate-800 border-t-violet-500 animate-spin"></div>
              <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-transparent border-b-cyan-400 animate-pulse"></div>
            </div>
            <h3 className="text-lg font-semibold text-slate-300 animate-pulse">Loading live, genuine openings...</h3>
            <p className="text-slate-500 text-xs mt-1">Filtering out corporate placeholders and generic recruitment agency spam</p>
          </div>
        )}

        {/* Error Handling */}
        {!loading && error && (
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-8 text-center max-w-xl mx-auto my-12">
            <div className="inline-flex p-3.5 bg-rose-500/10 text-rose-400 rounded-full mb-4">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-rose-300 mb-2">Error Fetching Openings</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              {error}
            </p>
            <button
              onClick={() => setSelectedDomain(selectedDomain)}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && jobs.length === 0 && (
          <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-16 text-center max-w-xl mx-auto my-12">
            <span className="text-4xl block mb-4">🔍</span>
            <h3 className="text-xl font-bold text-slate-300 mb-2">No Verified Postings</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Currently no active postings for this domain passed our filters. Please try another category.
            </p>
          </div>
        )}

        {/* Jobs Cards Layout Grid */}
        {!loading && !error && jobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <article 
                key={job.id}
                className="group relative flex flex-col justify-between bg-slate-900/35 backdrop-blur-md border border-slate-900 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-slate-800 hover:shadow-[0_12px_30px_rgba(139,92,246,0.06)]"
              >
                {/* Visual glow-line card accent */}
                <div className="absolute inset-x-0 -bottom-px h-[2px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div>
                  {/* Card Header (Logo & Company Title) */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-white rounded-xl p-1 flex items-center justify-center shadow-inner overflow-hidden shrink-0 border border-slate-200/50">
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

                    <div className="min-w-0">
                      <span className="text-slate-400 text-xs font-semibold tracking-wide uppercase truncate block">
                        {job.company}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-violet-300 transition-colors duration-200 line-clamp-2 mt-0.5 leading-snug">
                        {job.title}
                      </h3>
                    </div>
                  </div>

                  {/* Metadata fields */}
                  <div className="space-y-2.5 pt-3 mb-6 border-t border-slate-900/60 text-xs text-slate-400">
                    <div className="flex items-center gap-2.5">
                      <span className="text-slate-500 text-sm select-none">📍</span>
                      <span className="truncate">{job.location}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-slate-500 text-sm select-none">📅</span>
                      <span>{job.postedAt}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Badges & Call to Action */}
                <div className="flex items-center justify-between gap-3 pt-3 mt-auto">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg truncate max-w-[150px] ${getPublisherStyles(job.publisher)}`}>
                    via {job.publisher}
                  </span>

                  <a
                    href={job.applyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-indigo-600 group-hover:border-violet-500 group-hover:text-white px-4 py-2.5 rounded-xl transition-all duration-300 shadow-md"
                  >
                    Apply Now <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <footer className="border-t border-slate-900 mt-20 pt-8 pb-4 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} Domain Job Hub. Sourced dynamically.</p>
          <p className="mt-1 text-slate-700 font-mono">Clean data validation layers active.</p>
        </div>
      </footer>
    </div>
  );
}
