import axios from 'axios';

const RAPIDAPI_KEY = "ddd865a343msh4696cc148fb5a7cp146827jsnff03d4aa96d8";

const NEW_QUERIES = {
  ai_ml: "Machine Learning Engineer hiring or AI Developer hiring",
  fullstack: "Full Stack MERN Developer hiring or Web Developer hiring",
  datascience: "Data Scientist hiring or Data Analyst hiring",
  cloudcomputing: "Cloud Engineer AWS Azure hiring",
  cybersecurity: "Cyber Security Analyst hiring or Penetration Tester hiring"
};

async function testNewQueries() {
  for (const [domain, query] of Object.entries(NEW_QUERIES)) {
    try {
      console.log(`Testing query for ${domain}: "${query}"`);
      const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
        params: {
          query: query,
          page: '1',
          num_pages: '1',
          date_posted: 'week' // Week filter as requested
        },
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      });
      console.log(`-> Status: ${response.status}, Results: ${response.data.data?.length || 0}`);
      if (response.data.data?.length > 0) {
        console.log(`   First publisher: ${response.data.data[0].job_publisher}, First description length: ${response.data.data[0].job_description?.length}`);
      }
    } catch (e) {
      console.error(`-> Failed for ${domain}:`, e.message);
    }
  }
}

testNewQueries();
