import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 5000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

const RAPIDAPI_KEY = "ddd865a343msh4696cc148fb5a7cp146827jsnff03d4aa96d8";

const domainKeywords = {
  ai_ml: "Machine Learning Engineer",
  fullstack: "Full Stack Developer",
  datascience: "Data Scientist",
  cloudcomputing: "Cloud Engineer",
  cybersecurity: "Cyber Security Analyst"
};

const trustedPublishers = [
  'linkedin', 'naukri', 'indeed', 'glassdoor',
  'foundit', 'shine', 'upwork', 'ziprecruiter', 'weworkremotely'
];

app.get('/api/jobs', async (req, res) => {
  const { domain, location, job_type } = req.query;

  if (!domain || !domainKeywords[domain]) {
    return res.status(400).json({ error: 'Invalid domain.' });
  }

  let query = domainKeywords[domain];
  if (location && location.trim()) query += ` ${location.trim()}`;

  const params = { query, page: '1', num_pages: '1', date_posted: 'all' };

  if (job_type) {
    const map = { fulltime: 'FULLTIME', parttime: 'PARTTIME', internship: 'INTERN' };
    if (map[job_type]) params.employment_types = map[job_type];
  }

  try {
    const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params,
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    });

    if (!response.data?.data) return res.json([]);

    const raw = response.data.data;

    const filtered = raw.filter(job => {
      const pub = (job.job_publisher || '').toLowerCase();
      const emp = (job.employer_name || '').toLowerCase();
      const trusted = trustedPublishers.some(k => pub.includes(k));
      const direct = pub.length > 2 && !pub.includes('job') && !pub.includes('board');
      const anon = emp.includes('confidential') || emp.includes('anonymous');
      return (trusted || direct) && !anon;
    });

    const mapJob = (job) => {
      const parts = [];
      if (job.job_city) parts.push(job.job_city);
      if (job.job_state) parts.push(job.job_state);
      if (job.job_country) parts.push(job.job_country);
      const loc = parts.length ? parts.join(', ') : (job.job_is_remote ? 'Remote' : 'Not specified');

      let postedAt = 'Recent';
      if (job.job_posted_at_datetime_utc) {
        postedAt = new Date(job.job_posted_at_datetime_utc).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        });
      }

      const desc = job.job_description || '';
      let empType = 'Full-time';
      if (job.job_employment_type) {
        const t = job.job_employment_type.toUpperCase();
        if (t === 'INTERN') empType = 'Internship';
        else if (t === 'PARTTIME') empType = 'Part-time';
        else if (t === 'CONTRACTOR') empType = 'Contract';
      }

      return {
        id: job.job_id,
        title: job.job_title || 'Engineer',
        company: job.employer_name || 'Company',
        logo: job.employer_logo || null,
        location: loc,
        publisher: job.job_publisher || 'Direct',
        applyLink: job.job_apply_link || '#',
        postedAt,
        descriptionSnippet: desc.length > 150 ? desc.substring(0, 150) + '…' : desc,
        employmentType: empType
      };
    };

    let results = filtered.map(mapJob);
    if (results.length === 0) results = raw.slice(0, 12).map(mapJob);

    return res.json(results);
  } catch (err) {
    console.error('[API Error]', err.response?.data || err.message);
    return res.status(500).json({ error: 'Upstream API failure.' });
  }
});

app.listen(PORT, () => console.log(`Backend → http://localhost:${PORT}`));
