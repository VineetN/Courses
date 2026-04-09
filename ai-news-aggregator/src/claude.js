const OpenAI = require('openai');

let client;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

const MODEL = 'gpt-4o';

/**
 * Generate search queries biased toward non-mainstream AI-in-industry news.
 * Returns an array of query strings.
 */
async function generateSearchQueries() {
  const today = new Date().toISOString().split('T')[0];
  const response = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are a research assistant that generates search queries. Always respond with valid JSON only.',
      },
      {
        role: 'user',
        content: `Today is ${today}. Generate exactly 10 search queries to find unusual, non-obvious AI-in-industry news from the last 48 hours.

Goals:
- Surface unexpected AI deployments in non-tech industries (agriculture, law, defense, healthcare, energy, logistics, insurance)
- Find regulatory filings, government procurement actions, or court cases involving AI
- Uncover academic preprints (arXiv) with near-term industrial relevance
- Identify unusual corporate partnerships or pilots that mainstream tech press missed
- Expose AI ethics controversies, workforce displacement events, or audit findings
- Find niche trade publication stories missed by big tech outlets

Bias toward sources: STAT News, Law360, Politico Pro, Nature, arXiv, Federal Register, SEC EDGAR, engineering blogs, government press releases, trade association newsletters.
Avoid queries that would primarily return: TechCrunch, Wired, VentureBeat, The Verge.

Return a JSON object with a single key "queries" containing an array of 10 query strings. Example:
{"queries": ["query one", "query two", ...]}`,
      },
    ],
  });

  const text = response.choices[0].message.content.trim();
  const parsed = JSON.parse(text);
  const queries = Array.isArray(parsed) ? parsed : parsed.queries;
  if (!Array.isArray(queries)) throw new Error('Expected array of queries');
  return queries.slice(0, 10);
}

/**
 * Summarize a single article. Returns structured JSON or null on failure.
 */
async function summarizeArticle(title, url, snippet, fullText) {
  const content = fullText
    ? `Title: ${title}\nURL: ${url}\n\nFull article text:\n${fullText}`
    : `Title: ${title}\nURL: ${url}\n\nSnippet: ${snippet}`;

  const response = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: 512,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are a news analysis assistant. Always respond with valid JSON only.',
      },
      {
        role: 'user',
        content: `Analyze this article about AI in industry and return a JSON object.

${content}

Required JSON schema:
{
  "headline": "precise, specific rewrite of the headline (not clickbait, not vague)",
  "summary": "2-3 sentences covering what happened, who is involved, and why it matters — no fluff",
  "industry": "one of: Healthcare, Finance, Defense, Legal, Agriculture, Energy, Logistics, Insurance, Manufacturing, Government, Education, Retail, Transportation, Research, Other",
  "novelty_score": <integer 1-10, where 10 = completely unexpected/non-obvious>,
  "impact_score": <integer 1-10, where 10 = major real-world consequence if true>,
  "topic_tags": ["tag1", "tag2"]
}

Scoring guidance:
- novelty_score: 1 = "another LLM announcement", 10 = "AI used in unexpected high-stakes domain in a surprising way"
- impact_score: 1 = academic curiosity, 10 = affects millions of people or billions in capital
- topic_tags: 2-4 short lowercase tags, e.g. "drug-discovery", "ai-liability", "autonomous-vehicles"`,
      },
    ],
  });

  const text = response.choices[0].message.content.trim();
  return JSON.parse(text);
}

/**
 * Cluster articles by topic_tags and return cluster_id → [article_ids] map.
 * Also generates a short human-readable title for each cluster.
 */
async function clusterArticles(articles) {
  if (articles.length === 0) return {};

  const input = articles.map(a => ({
    id: a.id,
    headline: a.headline,
    tags: JSON.parse(a.topic_tags || '[]'),
    industry: a.industry,
  }));

  const response = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: 2048,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are a news editor. Always respond with valid JSON only.',
      },
      {
        role: 'user',
        content: `Group these AI industry articles into topic clusters.

Here are the articles:
${JSON.stringify(input, null, 2)}

Group articles that cover the same underlying story or closely related events into the same cluster.

Return a JSON object in this exact format:
{
  "clusters": [
    {
      "cluster_id": "short-slug",
      "title": "Human-readable cluster title (max 8 words)",
      "article_ids": [1, 2, 3]
    }
  ]
}

Rules:
- Every article must appear in exactly one cluster
- Singletons get their own cluster
- cluster_id must be a short lowercase slug (e.g. "ai-drug-discovery", "autonomous-weapons-policy")
- title should be a crisp news-desk label, not a sentence`,
      },
    ],
  });

  const text = response.choices[0].message.content.trim();
  const parsed = JSON.parse(text);
  return parsed.clusters || [];
}

module.exports = { generateSearchQueries, summarizeArticle, clusterArticles };
