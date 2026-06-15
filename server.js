import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 5000;

// Enable CORS for Vite frontend (typically http://localhost:5173)
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const RAPIDAPI_KEY = "ddd865a343msh4696cc148fb5a7cp146827jsnff03d4aa96d8";
const RAPIDAPI_HOST = "jsearch.p.rapidapi.com";

// Dictionary mapping for domains to JSearch query strings
const DOMAIN_QUERIES = {
  ai_ml: "Machine Learning Engineer hiring on LinkedIn or Naukri or Indeed",
  fullstack: "Full Stack Developer MERN hiring on LinkedIn or Naukri or Indeed",
  datascience: "Data Scientist hiring on LinkedIn or Naukri or Indeed",
  cloudcomputing: "Cloud Engineer hiring on LinkedIn or Naukri or Indeed",
  cybersecurity: "Cyber Security Analyst hiring on LinkedIn or Naukri or Indeed"
};

// GET /api/jobs endpoint
app.get('/api/jobs', async (req, res) => {
  const { domain } = req.query;

  // Validate the domain parameter
  if (!domain || !DOMAIN_QUERIES[domain]) {
    return res.status(400).json({
      error: `Invalid or missing domain parameter. Must be one of: ${Object.keys(DOMAIN_QUERIES).join(', ')}`
    });
  }

  const query = DOMAIN_QUERIES[domain];

  try {
    const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params: {
        query: query,
        page: '1',
        num_pages: '1',
        date_posted: 'week'
      },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    });

    const rawJobs = response.data.data || [];

    // Filter jobs based on verification rules
    const filteredJobs = rawJobs.filter((job) => {
      // 1. Check verified job publisher (LinkedIn, Naukri, Indeed, Glassdoor, or corporate/company career pages)
      const publisher = job.job_publisher ? job.job_publisher.toLowerCase().trim() : '';
      const company = job.employer_name ? job.employer_name.toLowerCase().trim() : '';

      const isVerifiedPublisher =
        publisher.includes('linkedin') ||
        publisher.includes('naukri') ||
        publisher.includes('indeed') ||
        publisher.includes('glassdoor') ||
        // Check if publisher contains company name (meaning it's their own corporate/career page)
        (company && publisher.includes(company)) ||
        // Check standard corporate page keywords / ATS portals
        publisher.includes('careers') ||
        publisher.includes('workday') ||
        publisher.includes('greenhouse') ||
        publisher.includes('lever') ||
        publisher.includes('recruitee') ||
        publisher.includes('jobvite') ||
        publisher.includes('bamboohr') ||
        publisher.includes('applytojob');

      if (!isVerifiedPublisher) {
        return false;
      }

      // 2. Check employer name is generic or missing (e.g. "Confidential" or "Anonymous")
      if (!job.employer_name) {
        return false;
      }
      
      const employerNameLower = job.employer_name.toLowerCase().trim();
      if (
        employerNameLower === '' ||
        employerNameLower === 'confidential' ||
        employerNameLower === 'anonymous' ||
        employerNameLower.includes('confidential') ||
        employerNameLower.includes('anonymous')
      ) {
        return false;
      }

      return true;
    });

    // Map the filtered jobs array into a clean structure for the frontend
    const cleanJobs = filteredJobs.map((job) => {
      // Parse locations
      let location = 'Remote';
      const locationParts = [];
      if (job.job_city) locationParts.push(job.job_city);
      if (job.job_state) locationParts.push(job.job_state);
      if (job.job_country) locationParts.push(job.job_country);

      if (locationParts.length > 0) {
        location = locationParts.join(', ');
      } else if (job.job_is_remote) {
        location = 'Remote';
      } else {
        location = 'N/A';
      }

      // Parse date posted
      let postedAt = 'Recently';
      if (job.job_posted_at_datetime_utc) {
        postedAt = new Date(job.job_posted_at_datetime_utc).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } else if (job.job_posted_at_timestamp) {
        postedAt = new Date(job.job_posted_at_timestamp * 1000).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }

      const defaultLogo = "https://cdn-icons-png.flaticon.com/512/2930/2930225.png";

      return {
        id: job.job_id,
        title: job.job_title || 'Software Engineer',
        company: job.employer_name,
        logo: job.employer_logo || defaultLogo,
        location: location,
        publisher: job.job_publisher || 'Corporate Page',
        applyLink: job.job_apply_link || '#',
        postedAt: postedAt
      };
    });

    res.json(cleanJobs);

  } catch (error) {
    console.error('Error fetching jobs from JSearch API:', error.message);
    res.status(500).json({
      error: 'Failed to fetch jobs',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
