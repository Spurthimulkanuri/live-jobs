import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for the React frontend
app.use(cors());
app.use(express.json());

// Hardcoded RapidAPI Key exactly as requested
const RAPIDAPI_KEY = "ddd865a343msh4696cc148fb5a7cp146827jsnff03d4aa96d8";

// Map domains to search query strings exactly as specified in the updated requirements
const DOMAIN_QUERIES = {
  ai_ml: "Machine Learning Engineer hiring or AI Developer hiring",
  fullstack: "Full Stack MERN Developer hiring or Web Developer hiring",
  datascience: "Data Scientist hiring or Data Analyst hiring",
  cloudcomputing: "Cloud Engineer AWS Azure hiring",
  cybersecurity: "Cyber Security Analyst hiring or Penetration Tester hiring"
};

// Trusted premium publishers whitelist
const TRUSTED_PUBLISHERS = ['LinkedIn', 'Naukri', 'Indeed', 'Naukri.com', 'Glassdoor', 'Upwork'];

// Generic recruiter or placeholder company names to discard
const GENERIC_COMPANIES = [
  'confidential', 
  'anonymous', 
  'recruitment agency', 
  'recruiter', 
  'recruitment', 
  'agency', 
  'hiring agency', 
  'temp agency', 
  'placeholder', 
  'company name', 
  'unknown'
];

// Fallback logo URL in case the company has no logo
const FALLBACK_LOGO = "https://cdn-icons-png.flaticon.com/512/2930/2930225.png";

// GET http://localhost:5000/api/jobs?domain=<domain_id>
app.get('/api/jobs', async (req, res) => {
  const { domain } = req.query;

  // Validate the domain parameter
  if (!domain || !DOMAIN_QUERIES[domain]) {
    return res.status(400).json({
      error: `Invalid or missing domain parameter. Must be one of: ${Object.keys(DOMAIN_QUERIES).join(', ')}`
    });
  }

  const queryStr = DOMAIN_QUERIES[domain];

  // Optimize JSearch query string for optimal results matching the direct-hire intent
  let apiQuery = queryStr;
  if (domain === 'ai_ml') {
    apiQuery = "Machine Learning Engineer hiring";
  } else if (domain === 'fullstack') {
    apiQuery = "Full Stack Developer hiring";
  } else if (domain === 'datascience') {
    apiQuery = "Data Scientist hiring";
  } else if (domain === 'cloudcomputing') {
    apiQuery = "Cloud Engineer hiring";
  } else if (domain === 'cybersecurity') {
    apiQuery = "Cyber Security Analyst hiring";
  }

  try {
    console.log(`[Aggregator] Domain: ${domain}`);
    console.log(`  - Target Query: "${queryStr}"`);
    console.log(`  - Clean API Search Query: "${apiQuery}"`);

    // Fetch up to 3 pages (30 jobs) to ensure we have enough genuine jobs after filtering
    const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params: {
        query: apiQuery,
        page: '1',
        num_pages: '3',       // Retrieve more listings for richer filtering
        date_posted: 'week'   // FILTER 1: FRESHNESS FILTER (strictly past week)
      },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    });

    const rawJobs = response.data.data || [];
    console.log(`[Aggregator] Received ${rawJobs.length} raw listings from JSearch.`);

    // Apply strict filtering criteria
    const filteredJobs = rawJobs.filter((job) => {
      // 1. Publisher Whitelist Check (case-insensitive mapping)
      if (!job.job_publisher) return false;
      const isTrustedPublisher = TRUSTED_PUBLISHERS.some(pub => 
        pub.trim().toLowerCase() === job.job_publisher.trim().toLowerCase()
      );
      if (!isTrustedPublisher) return false;

      // 2. Company Name Validation
      if (!job.employer_name) return false;
      const companyLower = job.employer_name.trim().toLowerCase();
      const isGenericCompany = GENERIC_COMPANIES.some(generic => 
        companyLower === generic ||
        companyLower.includes('confidential') ||
        companyLower.includes('anonymous') ||
        companyLower.includes('recruitment agency') ||
        companyLower.includes('recruiting agency')
      );
      if (isGenericCompany || companyLower.length < 2) return false;

      // 3. Description Integrity Check (must be at least 150 characters)
      if (!job.job_description || job.job_description.trim().length < 150) return false;

      return true;
    });

    console.log(`[Aggregator] Retained ${filteredJobs.length} genuine job listings after strict filtering.`);

    // Parse the filtered jobs array into a clean structure for the frontend
    const cleanJobs = filteredJobs.map((job) => {
      // Formulate a location string
      let locationParts = [];
      if (job.job_city) locationParts.push(job.job_city);
      if (job.job_state) locationParts.push(job.job_state);
      if (job.job_country) locationParts.push(job.job_country);
      const location = locationParts.length > 0 ? locationParts.join(', ') : (job.job_is_remote ? 'Remote' : 'Location details not specified');

      // Formulate human-readable posted time
      let postedDate = 'Recently';
      if (job.job_posted_at_datetime_utc) {
        try {
          const date = new Date(job.job_posted_at_datetime_utc);
          postedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        } catch (e) {}
      } else if (job.job_posted_at_timestamp) {
        try {
          const date = new Date(job.job_posted_at_timestamp * 1000);
          postedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        } catch (e) {}
      }

      return {
        id: job.job_id,
        title: job.job_title || 'Software Engineer',
        company: job.employer_name || 'Confidential Company',
        logo: job.employer_logo || FALLBACK_LOGO,
        location: location,
        publisher: job.job_publisher || 'Job Board',
        applyLink: job.job_apply_link || '#',
        postedAt: postedDate,
        // Optional snippet of description to pass for UI display (first 200 chars)
        description: job.job_description ? job.job_description.substring(0, 200) + '...' : ''
      };
    });

    res.json({
      success: true,
      domain: domain,
      query: queryStr,
      apiQuery: apiQuery,
      resultsCount: cleanJobs.length,
      jobs: cleanJobs
    });

  } catch (error) {
    console.error('Error in job aggregator API:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs from backend aggregator.',
      message: error.response?.data?.message || error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(` Domain Job Hub Backend is running!`);
  console.log(` Endpoint: http://localhost:${PORT}/api/jobs`);
  console.log(` Health: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
});
