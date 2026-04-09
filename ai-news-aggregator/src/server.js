require('dotenv').config();
const express = require('express');
const path = require('path');
const cron = require('node-cron');
const { serverLog } = require('./logger');
const { runPipeline, isRunning } = require('./pipeline');
const db = require('./db');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const REFRESH_HOURS = parseInt(process.env.REFRESH_INTERVAL_HOURS || '6', 10);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ── Track next refresh time ──────────────────────────────────────────────────
let nextRefresh = null;

function scheduleRefresh() {
  const cronExpr = `0 */${REFRESH_HOURS} * * *`; // every N hours at :00
  serverLog.info(`Scheduling pipeline every ${REFRESH_HOURS} hours (${cronExpr})`);

  cron.schedule(cronExpr, () => {
    serverLog.info('Cron triggered pipeline refresh');
    nextRefresh = computeNextRefresh();
    runPipeline();
  });

  nextRefresh = computeNextRefresh();
}

function computeNextRefresh() {
  const now = Date.now();
  const intervalMs = REFRESH_HOURS * 60 * 60 * 1000;
  return new Date(Math.ceil(now / intervalMs) * intervalMs).toISOString();
}

// ── API: feed ────────────────────────────────────────────────────────────────
app.get('/api/feed', (req, res) => {
  try {
    const clusters = db.getClusters();
    const feed = clusters.map(cluster => {
      const articleIds = JSON.parse(cluster.article_ids || '[]');
      const articles = db.getArticlesByIds(articleIds);

      // Sort articles within cluster by novelty descending
      articles.sort((a, b) => (b.novelty_score || 0) - (a.novelty_score || 0));

      const lead = articles[0];
      const others = articles.slice(1);

      return {
        cluster_id: cluster.id,
        cluster_title: cluster.title,
        score: Math.round(cluster.score * 10) / 10,
        lead: lead ? formatArticle(lead) : null,
        others: others.map(formatArticle),
      };
    }).filter(c => c.lead !== null);

    const lastRun = db.getLastRun();
    const totalArticles = db.getTotalArticles();

    res.json({
      meta: {
        last_refresh: lastRun?.finished_at || null,
        next_refresh: nextRefresh,
        total_articles: totalArticles,
        pipeline_running: isRunning(),
      },
      clusters: feed,
    });
  } catch (err) {
    serverLog.error('GET /api/feed failed', err.message);
    res.status(500).json({ error: 'Failed to load feed' });
  }
});

// ── API: manual refresh ──────────────────────────────────────────────────────
app.post('/api/refresh', (req, res) => {
  if (isRunning()) {
    return res.json({ status: 'already_running', message: 'Pipeline is already running' });
  }
  serverLog.info('Manual refresh triggered via API');
  runPipeline(); // fire and forget
  nextRefresh = computeNextRefresh();
  res.json({ status: 'started', message: 'Pipeline refresh started' });
});

// ── API: status ──────────────────────────────────────────────────────────────
app.get('/api/status', (req, res) => {
  const lastRun = db.getLastRun();
  res.json({
    pipeline_running: isRunning(),
    last_refresh: lastRun?.finished_at || null,
    next_refresh: nextRefresh,
    total_articles: db.getTotalArticles(),
    last_run_stats: lastRun ? {
      articles_found: lastRun.articles_found,
      articles_processed: lastRun.articles_processed,
      errors: lastRun.errors,
    } : null,
  });
});

// ── Serve SPA ────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatArticle(a) {
  return {
    id: a.id,
    url: a.url,
    headline: a.headline || a.title,
    summary: a.summary || a.snippet || '',
    industry: a.industry || 'Other',
    novelty_score: a.novelty_score || 0,
    impact_score: a.impact_score || 0,
    topic_tags: parseJson(a.topic_tags, []),
    source_domain: a.source_domain || '',
    fetched_at: a.fetched_at || a.created_at,
  };
}

function parseJson(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

// ── Boot ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  serverLog.info(`Server running on http://localhost:${PORT}`);

  // Validate critical env vars
  if (!process.env.OPENAI_API_KEY) {
    serverLog.warn('OPENAI_API_KEY is not set — OpenAI calls will fail');
  }
  if (!process.env.BRAVE_API_KEY && !process.env.SERPER_API_KEY) {
    serverLog.warn('Neither BRAVE_API_KEY nor SERPER_API_KEY is set — search will fail');
  }

  scheduleRefresh();

  // Run pipeline immediately on startup
  serverLog.info('Running initial pipeline on startup...');
  runPipeline();
});

module.exports = app;
