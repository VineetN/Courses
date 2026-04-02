const axios = require('axios');
const cheerio = require('cheerio');

const TIMEOUT_MS = 5000;
const MIN_TEXT_LENGTH = 200;

// Domains that consistently block scraping or are paywalled — skip gracefully
const SKIP_DOMAINS = new Set([
  'bloomberg.com', 'ft.com', 'wsj.com', 'nytimes.com',
  'thetimes.co.uk', 'telegraph.co.uk',
]);

/**
 * Fetch and extract article body text from a URL.
 * Returns { text, error } — always returns an object, never throws.
 */
async function fetchArticleText(url) {
  try {
    const domain = extractDomain(url);
    if (SKIP_DOMAINS.has(domain)) {
      return { text: null, error: `Skipping paywalled domain: ${domain}` };
    }

    const response = await axios.get(url, {
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregatorBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      maxRedirects: 5,
      responseType: 'text',
    });

    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('html')) {
      return { text: null, error: `Non-HTML content type: ${contentType}` };
    }

    const text = extractText(response.data, url);
    if (!text || text.length < MIN_TEXT_LENGTH) {
      return { text: null, error: `Extracted text too short (${text?.length ?? 0} chars)` };
    }

    return { text, error: null };
  } catch (err) {
    const reason = err.code || err.response?.status || err.message;
    return { text: null, error: `Fetch failed: ${reason}` };
  }
}

function extractText(html, url) {
  const $ = cheerio.load(html);

  // Remove noise
  $('script, style, nav, header, footer, aside, .ad, .ads, .advertisement, .cookie-banner, .newsletter-signup, noscript, iframe').remove();

  // Try article-specific selectors first
  const selectors = [
    'article',
    '[role="main"]',
    '.article-body',
    '.post-content',
    '.entry-content',
    '.story-body',
    '.article-content',
    '#article-body',
    'main',
  ];

  for (const sel of selectors) {
    const el = $(sel);
    if (el.length) {
      const text = el.text().replace(/\s+/g, ' ').trim();
      if (text.length > MIN_TEXT_LENGTH) return truncate(text, 8000);
    }
  }

  // Fallback: body text
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  return truncate(bodyText, 8000);
}

function truncate(text, maxChars) {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '…';
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

module.exports = { fetchArticleText };
