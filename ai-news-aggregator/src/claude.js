const Anthropic = require('@anthropic-ai/sdk');

let client;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const MODEL = 'claude-sonnet-4-20250514';

/**
 * Generate search queries biased toward non-mainstream AI-in-industry news.
 * Returns an array of query strings.
 */
async function generateSearchQueries() {
  const today = new Date().toISOString().split('T')[0];
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{
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

Return ONLY a JSON array of 10 query strings. No commentary, no markdown, no explanation. Example format:
["query one", "query two", ...]`,
    }],
  });

  const text = response.content[0].text.trim();
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error('Expected array of queries');
  return parsed.slice(0, 10);
}

/**
 * Summarize a single article. Returns structured JSON or null on failure.
 */
async function summarizeArticle(title, url, snippet, fullText) {
  const content = fullText
    ? `Title: ${title}\nURL: ${url}\n\nFull article text:\n${fullText}`
    : `Title: ${title}\nURL: ${url}\n\nSnippet: ${snippet}`;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Analyze this article about AI in industry and return a JSON object. Return ONLY valid JSON — no markdown, no code fences, no explanation.

${content}

Required JSON schema:
{
  "headline": "precise, specific rewrite of the headline (not clickbait, not vague)",
  "summary": "2-3 sentences covering what happened, who is involved, and why it matters — no fluff",
  "industry": "one of: Healthcare, Finance, Defense, Legal, Agriculture, Energy, Logistics, Insurance, Manufacturing, Government, Education, Retail, Transportation, Research, Other",
  "novelty_score": <integer 1-10, where 10 = completely unexpected/non-obvious>,
  "impact_score": <integer 1-10, where 10 = major real-world consequence if true>,
  "topic_tags": ["tag1", "tag2"] // 2-4 short lowercase tags for clustering, e.g. "drug-discovery", "ai-liability", "autonomous-vehicles"
}

Scoring guidance:
- novelty_score: 1 = "another LLM announcement", 10 = "AI used in unexpected high-stakes domain in a surprising way"
- impact_score: 1 = academic curiosity, 10 = affects millions of people or billions in capital
- Reject pure product launches with novelty_score ≤ 3 (still score it, but be honest)`,
    }],
  });

  const text = response.content[0].text.trim();
  // Strip any accidental markdown fences
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
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

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are a news editor grouping articles about AI in industry into topic clusters.

Here are the articles:
${JSON.stringify(input, null, 2)}

Group these articles into clusters where each cluster covers the same underlying story or closely related events. Articles with overlapping tags, similar industries, or clearly the same news event should be in the same cluster.

Return ONLY valid JSON — no markdown, no explanation. Format:
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
- Singletons (articles that don't match anything) get their own cluster
- cluster_id must be a short lowercase slug (e.g. "ai-drug-discovery", "autonomous-weapons-policy")
- title should be a crisp news-desk label, not a sentence`,
    }],
  });

  const text = response.content[0].text.trim();
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(cleaned);
  return parsed.clusters || [];
}

module.exports = { generateSearchQueries, summarizeArticle, clusterArticles };
