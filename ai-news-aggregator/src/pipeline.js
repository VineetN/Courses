const { PipelineLogger } = require('./logger');
const { runQueries } = require('./search');
const { fetchArticleText } = require('./fetcher');
const { generateSearchQueries, summarizeArticle, clusterArticles } = require('./claude');
const db = require('./db');

const MAX_ARTICLES_PER_RUN = 60;

let running = false;

async function runPipeline() {
  if (running) {
    console.log('[INF] Pipeline already running, skipping trigger');
    return;
  }
  running = true;
  const logger = new PipelineLogger();
  const startedAt = new Date().toISOString();

  try {
    logger.info('Pipeline started');

    // ── STEP 1: Generate queries & search ──────────────────────────────────
    logger.info('Generating search queries via Claude...');
    let queries;
    try {
      queries = await generateSearchQueries();
      logger.info(`Generated ${queries.length} queries`, { queries });
    } catch (err) {
      logger.error('Failed to generate queries', { error: err.message });
      queries = getFallbackQueries();
      logger.info('Using fallback queries');
    }

    logger.info('Running search queries...');
    const rawResults = await runQueries(queries, logger);
    logger.info(`Search returned ${rawResults.length} unique URLs`);
    logger.stats.articlesFound = rawResults.length;

    // Store raw results (dedup by URL via INSERT OR IGNORE)
    let newCount = 0;
    for (const r of rawResults) {
      const res = db.upsertRawArticle(r);
      if (res.changes > 0) newCount++;
    }
    logger.info(`Inserted ${newCount} new URLs into DB`);

    // ── STEP 2: Fetch full text ────────────────────────────────────────────
    const unfetched = db.getUnfetched().slice(0, MAX_ARTICLES_PER_RUN);
    logger.info(`Fetching full text for ${unfetched.length} articles...`);

    for (const article of unfetched) {
      const { text, error } = await fetchArticleText(article.url);
      if (error) {
        logger.warn(`Fetch skipped: ${article.url}`, { reason: error });
        // Store empty string so we don't retry indefinitely — sentinel value
        db.updateFullText(article.id, '');
      } else {
        db.updateFullText(article.id, text);
        logger.info(`Fetched text for: ${article.url}`);
      }
    }

    // ── STEP 2b: Summarize ─────────────────────────────────────────────────
    const toSummarize = db.getUnsummarized().slice(0, MAX_ARTICLES_PER_RUN);
    logger.info(`Summarizing ${toSummarize.length} articles via Claude...`);

    for (const article of toSummarize) {
      try {
        const data = await summarizeArticle(
          article.title,
          article.url,
          article.snippet,
          article.full_text || null,
        );

        // Validate required fields
        if (!data.headline || !data.summary || typeof data.novelty_score !== 'number') {
          throw new Error('Missing required fields in Claude response');
        }

        db.updateSummary(article.id, {
          headline: data.headline,
          summary: data.summary,
          industry: data.industry || 'Other',
          novelty_score: Math.min(10, Math.max(1, data.novelty_score)),
          impact_score: Math.min(10, Math.max(1, data.impact_score || 5)),
          topic_tags: JSON.stringify(data.topic_tags || []),
        });

        logger.stats.articlesProcessed++;
        logger.info(`Summarized: ${article.url}`);
      } catch (err) {
        logger.error(`Summarization failed: ${article.url}`, { error: err.message });
        // Mark as processed with error sentinel so we don't retry forever
        db.updateSummary(article.id, {
          headline: article.title || 'Untitled',
          summary: article.snippet || 'Could not summarize this article.',
          industry: 'Other',
          novelty_score: 1,
          impact_score: 1,
          topic_tags: '[]',
        });
      }
    }

    // ── STEP 3: Cluster & rank ─────────────────────────────────────────────
    logger.info('Clustering articles...');
    const allSummarized = db.getAllSummarized();

    if (allSummarized.length === 0) {
      logger.warn('No summarized articles to cluster');
    } else {
      try {
        const clusterDefs = await clusterArticles(allSummarized);
        logger.info(`Received ${clusterDefs.length} clusters from Claude`);

        const clustersToSave = [];

        for (const cluster of clusterDefs) {
          const { cluster_id, title, article_ids } = cluster;
          if (!Array.isArray(article_ids) || article_ids.length === 0) continue;

          // Update each article's cluster_id
          for (const aid of article_ids) {
            db.updateClusterId(aid, cluster_id);
          }

          // Fetch those articles to compute score
          const clusterArticlesData = db.getArticlesByIds(article_ids);
          const score = computeClusterScore(clusterArticlesData);

          clustersToSave.push({
            id: cluster_id,
            title: title || cluster_id,
            score,
            article_ids: JSON.stringify(article_ids),
          });
        }

        // Sort by score before saving
        clustersToSave.sort((a, b) => b.score - a.score);
        db.saveClusters(clustersToSave);
        logger.info(`Saved ${clustersToSave.length} clusters`);
      } catch (err) {
        logger.error('Clustering failed', { error: err.message });
        // Fallback: each article is its own cluster
        fallbackCluster(allSummarized, logger);
      }
    }

    const finishedAt = new Date().toISOString();
    const logFile = logger.flush();
    db.logPipelineRun({
      started_at: startedAt,
      finished_at: finishedAt,
      articles_found: logger.stats.articlesFound,
      articles_processed: logger.stats.articlesProcessed,
      errors: logger.stats.errors,
      log_file: logFile,
    });

    console.log(`[INF] Pipeline complete. Processed: ${logger.stats.articlesProcessed}, Errors: ${logger.stats.errors}`);
  } catch (err) {
    logger.error('Pipeline crashed', { error: err.message, stack: err.stack });
    logger.flush();
    console.error('[ERR] Pipeline crashed:', err.message);
  } finally {
    running = false;
  }
}

function computeClusterScore(articles) {
  if (!articles || articles.length === 0) return 0;
  const scores = articles.map(a => (a.novelty_score || 5) * 0.6 + (a.impact_score || 5) * 0.4);
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function fallbackCluster(articles, logger) {
  logger.warn('Using fallback clustering (one article per cluster)');
  const clusters = articles.map((a, i) => {
    const clusterId = `cluster-${a.id}`;
    db.updateClusterId(a.id, clusterId);
    return {
      id: clusterId,
      title: (JSON.parse(a.topic_tags || '[]')[0] || 'uncategorized'),
      score: computeClusterScore([a]),
      article_ids: JSON.stringify([a.id]),
    };
  });
  db.saveClusters(clusters);
}

function getFallbackQueries() {
  return [
    'AI deployment healthcare hospital clinical 2024 site:statnews.com OR site:modernhealthcare.com',
    'artificial intelligence government contract procurement "task order" 2024',
    'machine learning agriculture farming precision "case study" 2024',
    'AI regulation enforcement action "consent order" OR "enforcement action" 2024',
    'arXiv AI industry deployment real-world 2024',
    'artificial intelligence insurance underwriting actuarial 2024',
    '"AI pilot" OR "machine learning deployment" manufacturing logistics 2024',
    'AI legal court ruling liability lawsuit 2024 site:law.com OR site:law360.com',
    'AI defense military autonomous weapons procurement 2024',
    'AI energy grid power utility deployment 2024',
  ];
}

module.exports = { runPipeline, isRunning: () => running };
