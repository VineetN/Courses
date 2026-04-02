const axios = require('axios');

const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/web/search';
const SERPER_API_URL = 'https://google.serper.dev/search';

/**
 * Search using Brave Search API.
 * Returns array of { title, url, snippet, source_domain }
 */
async function searchBrave(query, count = 8) {
  const key = process.env.BRAVE_API_KEY;
  if (!key) throw new Error('BRAVE_API_KEY not set');

  const response = await axios.get(BRAVE_API_URL, {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': key,
    },
    params: {
      q: query,
      count,
      freshness: 'pd2', // past 48 hours
      search_lang: 'en',
      result_filter: 'web',
    },
    timeout: 10000,
  });

  const results = response.data?.web?.results || [];
  return results.map(r => ({
    title: r.title || '',
    url: r.url || '',
    snippet: r.description || '',
    source_domain: extractDomain(r.url),
  }));
}

/**
 * Fallback: Serper (Google Search API)
 */
async function searchSerper(query, count = 8) {
  const key = process.env.SERPER_API_KEY;
  if (!key) throw new Error('SERPER_API_KEY not set');

  const response = await axios.post(SERPER_API_URL, {
    q: query,
    num: count,
    tbs: 'qdr:2d', // past 2 days
  }, {
    headers: {
      'X-API-KEY': key,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });

  const results = response.data?.organic || [];
  return results.map(r => ({
    title: r.title || '',
    url: r.link || '',
    snippet: r.snippet || '',
    source_domain: extractDomain(r.link),
  }));
}

/**
 * Run a single query, trying Brave first then Serper.
 */
async function search(query, count = 8) {
  try {
    return await searchBrave(query, count);
  } catch (err) {
    if (process.env.SERPER_API_KEY) {
      return await searchSerper(query, count);
    }
    throw err;
  }
}

/**
 * Run multiple queries concurrently, returning deduplicated results.
 */
async function runQueries(queries, logger) {
  const seen = new Set();
  const allResults = [];

  const tasks = queries.map(async (q) => {
    try {
      const results = await search(q, 8);
      logger.info(`Query returned ${results.length} results`, { query: q });
      return results;
    } catch (err) {
      logger.error(`Search failed for query`, { query: q, error: err.message });
      return [];
    }
  });

  const batches = await Promise.allSettled(tasks);
  for (const batch of batches) {
    if (batch.status === 'fulfilled') {
      for (const r of batch.value) {
        if (r.url && !seen.has(r.url)) {
          seen.add(r.url);
          allResults.push({ ...r, fetched_at: new Date().toISOString() });
        }
      }
    }
  }

  return allResults;
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

module.exports = { runQueries };
